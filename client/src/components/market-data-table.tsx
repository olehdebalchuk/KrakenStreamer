import { useMarketData, useRefreshData } from "@/hooks/use-kraken-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  Download,
  RefreshCw,
  Bitcoin,
  Wallet,
  Hexagon,
  Circle,
  Diamond,
  Triangle,
  Square,
  Star,
  Shield,
  Zap,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { MarketData } from "@shared/schema";

const getPairIcon = (pair: string) => {
  // Handle both "BTC/USD" and "XBTUSD" formats
  let symbol = pair.includes("/")
    ? pair.split("/")[0]
    : pair.replace("USD", "");

  // Map Kraken symbols to standard symbols
  if (symbol === "XBT" || symbol === "XBTUSD") symbol = "BTC";
  if (symbol === "XETHZUSD" || symbol === "ETHUSD") symbol = "ETH";

  switch (symbol) {
    case "BTC":
      return <Bitcoin className="text-white w-3 h-3" />;
    case "ETH":
      return <Diamond className="text-white w-3 h-3" />;
    case "ADA":
      return <Triangle className="text-white w-3 h-3" />;
    case "DOT":
      return <Hexagon className="text-white w-3 h-3" />;
    case "SOL":
      return <Zap className="text-white w-3 h-3" />;
    case "LINK":
      return <Square className="text-white w-3 h-3" />;
    case "UNI":
      return <Circle className="text-white w-3 h-3" />;
    case "AVAX":
      return <Star className="text-white w-3 h-3" />;
    default:
      return <Wallet className="text-white w-3 h-3" />;
  }
};

const getPairColor = (pair: string) => {
  // Handle both "BTC/USD" and "XBTUSD" formats
  let symbol = pair.includes("/")
    ? pair.split("/")[0]
    : pair.replace("USD", "");

  // Map Kraken symbols to standard symbols
  if (symbol === "XBT" || symbol === "XBTUSD") symbol = "BTC";
  if (symbol === "XETHZUSD" || symbol === "ETHUSD") symbol = "ETH";

  const colors: Record<string, string> = {
    BTC: "bg-orange-500",
    ETH: "bg-blue-500",
    ADA: "bg-green-500",
    DOT: "bg-purple-500",
    SOL: "bg-gradient-to-r from-purple-500 to-pink-500",
    LINK: "bg-blue-600",
    UNI: "bg-pink-400",
    AVAX: "bg-red-500",
  };
  return colors[symbol] || "bg-gray-500";
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
};

const formatVolume = (volume: number) => {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(volume);
};

const formatChange = (change: number) => {
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(2)}%`;
};

const getChangeClass = (change: number) => {
  if (change > 0) return "price-up";
  if (change < 0) return "price-down";
  return "price-neutral";
};

const formatBidAsk = (bid: number, ask: number) => {
  return `${formatPrice(bid)} / ${formatPrice(ask)}`;
};

const exportData = (data: MarketData[]) => {
  const doc = new jsPDF();
  const title = "Kraken Market Data";
  const generatedOn = `Generated: ${new Date().toLocaleString()}`;

  doc.setFontSize(14);
  doc.text(title, 14, 16);
  doc.setFontSize(10);
  doc.text(generatedOn, 14, 22);

  const head = [
    [
      "Pair",
      "Last Price",
      "24h Change %",
      "24h Volume",
      "24h High",
      "24h Low",
      "Bid/Ask",
      "Created At",
    ],
  ];

  const body = data.map((item) => [
    item.pair,
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(item.lastPrice),
    `${item.changePercent24h.toFixed(2)}%`,
    new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(
      item.volume24h
    ),
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(item.high24h),
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(item.low24h),
    `${new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(item.bid)} / ${new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(item.ask)}`,
    new Date(item.createdAt).toLocaleString(),
  ]);

  autoTable(doc, {
    startY: 28,
    head,
    body,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [33, 33, 33] },
  });

  doc.save("kraken_market_data.pdf");
};

export default function MarketDataTable() {
  const { data: marketData, isLoading, error } = useMarketData();
  const refreshMutation = useRefreshData();

  const handleRefresh = () => {
    refreshMutation.mutate();
  };

  const handleExport = () => {
    if (marketData) {
      exportData(marketData);
    }
  };

  const renderTableContent = () => {
    if (isLoading) {
      return (
        <TableBody>
          {[...Array(4)].map((_, index) => (
            <TableRow key={index}>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Skeleton className="w-6 h-6 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="h-4 w-24 ml-auto" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="h-4 w-16 ml-auto" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="h-4 w-20 ml-auto" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="h-4 w-24 ml-auto" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="h-4 w-24 ml-auto" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="h-4 w-32 ml-auto" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      );
    }

    if (error) {
      return (
        <TableBody>
          <TableRow>
            <TableCell colSpan={7}>
              <Alert variant="destructive" data-testid="market-data-error">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Failed to load market data: {error.message}
                </AlertDescription>
              </Alert>
            </TableCell>
          </TableRow>
        </TableBody>
      );
    }

    if (!marketData || marketData.length === 0) {
      return (
        <TableBody>
          <TableRow>
            <TableCell colSpan={7}>
              <Alert data-testid="market-data-empty">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No market data available at the moment.
                </AlertDescription>
              </Alert>
            </TableCell>
          </TableRow>
        </TableBody>
      );
    }

    return (
      <TableBody>
        {marketData.map((item) => {
          if (!item || !item.pair) {
            console.warn("Invalid market data item:", item);
            return null;
          }
          return (
            <TableRow
              key={item.pair}
              className="hover:bg-accent"
              data-testid={`market-row-${item.pair
                .toLowerCase()
                .replace("/", "-")}`}
            >
              <TableCell>
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-6 h-6 ${getPairColor(
                      item.pair
                    )} rounded-full flex items-center justify-center`}
                  >
                    {getPairIcon(item.pair)}
                  </div>
                  <span
                    className="font-medium"
                    data-testid={`market-pair-${item.pair
                      .toLowerCase()
                      .replace("/", "-")}`}
                  >
                    {item.pair}
                  </span>
                </div>
              </TableCell>
              <TableCell
                className="text-right font-mono"
                data-testid={`market-price-${item.pair
                  .toLowerCase()
                  .replace("/", "-")}`}
              >
                {formatPrice(item.lastPrice)}
              </TableCell>
              <TableCell className="text-right">
                <span
                  className={`font-mono ${getChangeClass(
                    item.changePercent24h
                  )}`}
                  data-testid={`market-change-${item.pair
                    .toLowerCase()
                    .replace("/", "-")}`}
                >
                  {formatChange(item.changePercent24h)}
                </span>
              </TableCell>
              <TableCell
                className="text-right font-mono"
                data-testid={`market-volume-${item.pair
                  .toLowerCase()
                  .replace("/", "-")}`}
              >
                {formatVolume(item.volume24h)}
              </TableCell>
              <TableCell
                className="text-right font-mono"
                data-testid={`market-high-${item.pair
                  .toLowerCase()
                  .replace("/", "-")}`}
              >
                {formatPrice(item.high24h)}
              </TableCell>
              <TableCell
                className="text-right font-mono"
                data-testid={`market-low-${item.pair
                  .toLowerCase()
                  .replace("/", "-")}`}
              >
                {formatPrice(item.low24h)}
              </TableCell>
              <TableCell
                className="text-right font-mono text-sm"
                data-testid={`market-bidask-${item.pair
                  .toLowerCase()
                  .replace("/", "-")}`}
              >
                {formatBidAsk(item.bid, item.ask)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    );
  };

  return (
    <Card data-testid="market-data-table">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Market Data</CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={!marketData || marketData.length === 0}
              data-testid="export-button"
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshMutation.isPending}
              data-testid="refresh-all-button"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  refreshMutation.isPending ? "animate-spin" : ""
                }`}
              />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead className="text-left">Pair</TableHead>
                <TableHead className="text-right">Last Price</TableHead>
                <TableHead className="text-right">24h Change</TableHead>
                <TableHead className="text-right">24h Volume</TableHead>
                <TableHead className="text-right">24h High</TableHead>
                <TableHead className="text-right">24h Low</TableHead>
                <TableHead className="text-right">Bid/Ask</TableHead>
              </TableRow>
            </TableHeader>
            {renderTableContent()}
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
