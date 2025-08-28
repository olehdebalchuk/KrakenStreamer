import { useMarketData } from "@/hooks/use-kraken-data";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Bitcoin, Wallet } from "lucide-react";

const getPairIcon = (pair: string) => {
  const symbol = pair.split('/')[0].replace('X', '');
  switch (symbol) {
    case 'BTC':
      return <Bitcoin className="text-white w-4 h-4" />;
    default:
      return <Wallet className="text-white w-4 h-4" />;
  }
};

const getPairColor = (pair: string) => {
  const symbol = pair.split('/')[0].replace('X', '');
  const colors: Record<string, string> = {
    'BTC': 'bg-orange-500',
    'ETH': 'bg-blue-500',
    'ADA': 'bg-green-500',
    'DOT': 'bg-purple-500',
  };
  return colors[symbol] || 'bg-gray-500';
};

const formatPrice = (price: number, symbol: string = 'USD') => {
  if (symbol === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  }
  return price.toFixed(4);
};

const formatVolume = (volume: number) => {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(volume);
};

const formatChange = (change: number) => {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
};

const getChangeClass = (change: number) => {
  if (change > 0) return 'price-up';
  if (change < 0) return 'price-down';
  return 'price-neutral';
};

export default function PriceOverview() {
  const { data: marketData, isLoading, error } = useMarketData();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="price-overview-loading">
        {[...Array(4)].map((_, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-16 mb-1" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </div>
                <div className="text-right">
                  <Skeleton className="h-6 w-20 mb-1" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Skeleton className="h-3 w-16 mb-1" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div>
                  <Skeleton className="h-3 w-16 mb-1" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" data-testid="price-overview-error">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load market data: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  if (!marketData || marketData.length === 0) {
    return (
      <Alert data-testid="price-overview-empty">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No market data available at the moment.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="price-overview">
      {marketData.map((data) => {
        if (!data || !data.pair) {
          console.warn('Invalid market data item:', data);
          return null;
        }
        return (
        <Card key={data.pair} data-testid={`price-card-${data.pair.toLowerCase().replace('/', '-')}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className={`w-8 h-8 ${getPairColor(data.pair)} rounded-full flex items-center justify-center`}>
                  {getPairIcon(data.pair)}
                </div>
                <div>
                  <span 
                    className="font-semibold text-foreground" 
                    data-testid={`pair-symbol-${data.pair.toLowerCase().replace('/', '-')}`}
                  >
                    {data.pair}
                  </span>
                  <p 
                    className="text-xs text-muted-foreground"
                    data-testid={`pair-name-${data.pair.toLowerCase().replace('/', '-')}`}
                  >
                    {data.name}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div 
                  className={`text-lg font-bold ${getChangeClass(data.changePercent24h)}`}
                  data-testid={`last-price-${data.pair.toLowerCase().replace('/', '-')}`}
                >
                  {formatPrice(data.lastPrice)}
                </div>
                <div 
                  className={`text-sm ${getChangeClass(data.changePercent24h)}`}
                  data-testid={`change-${data.pair.toLowerCase().replace('/', '-')}`}
                >
                  {formatChange(data.changePercent24h)}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">24h Vol:</span>
                <p 
                  className="font-medium"
                  data-testid={`volume-${data.pair.toLowerCase().replace('/', '-')}`}
                >
                  {formatVolume(data.volume24h)}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">24h High:</span>
                <p 
                  className="font-medium"
                  data-testid={`high-${data.pair.toLowerCase().replace('/', '-')}`}
                >
                  {formatPrice(data.high24h)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        );
      })}
    </div>
  );
}
