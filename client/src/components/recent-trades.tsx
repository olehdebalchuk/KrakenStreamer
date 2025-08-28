import { useState } from "react";
import { useRecentTrades } from "@/hooks/use-kraken-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const AVAILABLE_PAIRS = [
  { value: 'XBTUSD', label: 'BTC/USD' },
  { value: 'ETHUSD', label: 'ETH/USD' },
  { value: 'ADAUSD', label: 'ADA/USD' },
  { value: 'DOTUSD', label: 'DOT/USD' },
];

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};

const formatVolume = (volume: number) => {
  return volume.toFixed(4);
};

const formatTime = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleTimeString();
};

const getSideClass = (side: 'buy' | 'sell') => {
  return side === 'buy' ? 'price-up' : 'price-down';
};

export default function RecentTrades() {
  const [selectedPair, setSelectedPair] = useState('XBTUSD');
  const queryClient = useQueryClient();
  const { data: tradesData, isLoading, error, refetch } = useRecentTrades(selectedPair, 20);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: [`/api/trades/${selectedPair}?count=20`] });
    refetch();
  };

  const renderTradesData = () => {
    if (isLoading) {
      return (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {[...Array(10)].map((_, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive" data-testid="trades-error">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load recent trades: {error.message}
          </AlertDescription>
        </Alert>
      );
    }

    if (!tradesData || tradesData.trades.length === 0) {
      return (
        <Alert data-testid="trades-empty">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No recent trades available for {selectedPair}.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-2 max-h-96 overflow-y-auto" data-testid="trades-list">
        {tradesData.trades.slice(0, 20).map((trade, index) => (
          <div 
            key={index}
            className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0"
            data-testid={`trade-${index}`}
          >
            <div className="flex items-center space-x-3">
              <span className={`font-mono ${getSideClass(trade.side)}`}>
                {formatPrice(trade.price)}
              </span>
              <span className="text-muted-foreground font-mono">
                {formatVolume(trade.volume)}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {formatTime(trade.time)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card data-testid="recent-trades">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Recent Trades</CardTitle>
          <div className="flex items-center space-x-2">
            <Select value={selectedPair} onValueChange={setSelectedPair}>
              <SelectTrigger className="w-32" data-testid="trades-pair-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_PAIRS.map((pair) => (
                  <SelectItem key={pair.value} value={pair.value}>
                    {pair.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              data-testid="trades-refresh"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {renderTradesData()}
      </CardContent>
    </Card>
  );
}
