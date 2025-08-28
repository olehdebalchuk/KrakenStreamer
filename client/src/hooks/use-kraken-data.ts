import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type TickerData, type OrderBook, type RecentTrades, type MarketData } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useRef } from "react";

export function useTickerData(pair: string) {
  return useQuery<TickerData>({
    queryKey: ['/api/ticker', pair],
    refetchInterval: 15000, // Refresh every 15 seconds
    staleTime: 10000,
  });
}

export function useOrderBook(pair: string, count: number = 5) {
  return useQuery<OrderBook>({
    queryKey: ['/api/orderbook', pair, count],
    refetchInterval: 10000, // Refresh every 10 seconds
    staleTime: 5000,
  });
}

export function useRecentTrades(pair: string, count: number = 100) {
  return useQuery<RecentTrades>({
    queryKey: ['/api/trades', pair, count],
    refetchInterval: 5000, // Refresh every 5 seconds
    staleTime: 2000,
  });
}

export function useMarketData() {
  return useQuery<MarketData[]>({
    queryKey: ['/api/market-data'],
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 20000,
  });
}

export function useRefreshData() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => apiRequest("POST", "/api/refresh"),
    onSuccess: () => {
      // Invalidate all cached data
      queryClient.invalidateQueries();
      toast({
        title: "Data Refreshed",
        description: "All market data has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Refresh Failed",
        description: error.message || "Failed to refresh market data. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useWebSocketData() {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let isUnmounted = false;
    
    const connectWebSocket = () => {
      if (isUnmounted) return;
      
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('WebSocket connected');
          // Subscribe to updates for popular pairs
          ws.send(JSON.stringify({
            type: 'subscribe',
            pairs: ['XBTUSD', 'ETHUSD', 'ADAUSD', 'DOTUSD']
          }));
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            
            switch (message.type) {
              case 'ticker':
                // Update ticker data in cache
                queryClient.setQueryData(['/api/ticker', message.pair], message.data);
                // Also update market data cache
                queryClient.setQueryData(['/api/market-data'], (oldData: MarketData[] | undefined) => {
                  if (!oldData) return [message.data];
                  const updated = oldData.map(item => 
                    item.pair === message.pair ? { ...item, ...message.data } : item
                  );
                  return updated.some(item => item.pair === message.pair) 
                    ? updated 
                    : [...updated, message.data];
                });
                break;
                
              case 'orderBook':
                queryClient.setQueryData(['/api/orderbook', message.pair, 5], message.data);
                break;
                
              case 'trades':
                queryClient.setQueryData(['/api/trades', message.pair, 100], message.data);
                break;
            }
          } catch (error) {
            console.error('Error processing WebSocket message:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };

        ws.onclose = () => {
          console.log('WebSocket disconnected');
          if (!isUnmounted && wsRef.current?.readyState === WebSocket.CLOSED) {
            reconnectTimeoutRef.current = setTimeout(() => {
              connectWebSocket();
            }, 5000);
          }
        };

      } catch (error) {
        console.error('Failed to establish WebSocket connection:', error);
      }
    };

    connectWebSocket();

    return () => {
      isUnmounted = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [queryClient, toast]);

  return wsRef.current;
}
