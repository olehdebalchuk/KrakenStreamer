import { useState } from "react";
import { useOrderBook } from "@/hooks/use-kraken-data";
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

const formatSpread = (spread: number, spreadPercent: number) => {
  return `${formatPrice(spread)} (${spreadPercent.toFixed(3)}%)`;
};

export default function OrderBook() {
  const [selectedPair, setSelectedPair] = useState('XBTUSD');
  const queryClient = useQueryClient();
  const { data: orderBook, isLoading, error, refetch } = useOrderBook(selectedPair, 5);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/orderbook', selectedPair] });
    refetch();
  };

  const renderOrderBookData = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Asks</h3>
            <div className="space-y-1">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="flex justify-between py-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Bids</h3>
            <div className="space-y-1">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="flex justify-between py-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive" data-testid="orderbook-error">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load order book: {error.message}
          </AlertDescription>
        </Alert>
      );
    }

    if (!orderBook) {
      return (
        <Alert data-testid="orderbook-empty">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No order book data available for {selectedPair}.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <>
        <div className="grid grid-cols-2 gap-4">
          {/* Asks */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Asks</h3>
            <div className="space-y-1" data-testid="asks-list">
              {orderBook.asks.map((ask, index) => (
                <div 
                  key={index} 
                  className="flex justify-between text-sm py-1"
                  data-testid={`ask-${index}`}
                >
                  <span className="price-down font-mono">
                    {formatPrice(ask.price)}
                  </span>
                  <span className="text-muted-foreground font-mono">
                    {formatVolume(ask.volume)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bids */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Bids</h3>
            <div className="space-y-1" data-testid="bids-list">
              {orderBook.bids.map((bid, index) => (
                <div 
                  key={index} 
                  className="flex justify-between text-sm py-1"
                  data-testid={`bid-${index}`}
                >
                  <span className="price-up font-mono">
                    {formatPrice(bid.price)}
                  </span>
                  <span className="text-muted-foreground font-mono">
                    {formatVolume(bid.volume)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Spread:</span>
            <span className="font-mono" data-testid="spread-value">
              {formatSpread(orderBook.spread, orderBook.spreadPercent)}
            </span>
          </div>
        </div>
      </>
    );
  };

  return (
    <Card data-testid="order-book">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Order Book</CardTitle>
          <div className="flex items-center space-x-2">
            <Select value={selectedPair} onValueChange={setSelectedPair}>
              <SelectTrigger className="w-32" data-testid="orderbook-pair-select">
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
              data-testid="orderbook-refresh"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {renderOrderBookData()}
      </CardContent>
    </Card>
  );
}
