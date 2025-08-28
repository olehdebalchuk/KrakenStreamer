import { useEffect } from "react";
import { ChartLine } from "lucide-react";
import PriceOverview from "@/components/price-overview";
import SearchFilter from "@/components/search-filter";
import OrderBook from "@/components/order-book";
import RecentTrades from "@/components/recent-trades";
import MarketDataTable from "@/components/market-data-table";
import { useWebSocketData } from "@/hooks/use-kraken-data";

export default function Dashboard() {
  const ws = useWebSocketData();

  useEffect(() => {
    document.title = "Kraken Crypto Dashboard - Real-time Market Data";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <ChartLine className="text-primary text-xl" data-testid="logo-icon" />
                <span className="text-xl font-bold text-foreground" data-testid="app-title">
                  Kraken Dashboard
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <div 
                  className="auto-refresh-indicator" 
                  data-testid="live-indicator"
                  title="Real-time updates active"
                />
                <span data-testid="live-status">Live</span>
              </div>
              <div className="text-sm text-muted-foreground">
                <span data-testid="last-updated">
                  Last updated: {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 lg:px-8 py-6 space-y-6">
        <SearchFilter />
        <PriceOverview />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <OrderBook />
          <RecentTrades />
        </div>
        
        <MarketDataTable />
      </main>
    </div>
  );
}
