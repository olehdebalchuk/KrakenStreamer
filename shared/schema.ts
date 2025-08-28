import { z } from "zod";

export const tickerDataSchema = z.object({
  pair: z.string(),
  name: z.string(),
  lastPrice: z.number(),
  change24h: z.number(),
  changePercent24h: z.number(),
  volume24h: z.number(),
  high24h: z.number(),
  low24h: z.number(),
  bid: z.number(),
  ask: z.number(),
  spread: z.number(),
  spreadPercent: z.number(),
});

export const orderBookEntrySchema = z.object({
  price: z.number(),
  volume: z.number(),
  timestamp: z.number(),
});

export const orderBookSchema = z.object({
  pair: z.string(),
  asks: z.array(orderBookEntrySchema),
  bids: z.array(orderBookEntrySchema),
  spread: z.number(),
  spreadPercent: z.number(),
});

export const tradeSchema = z.object({
  price: z.number(),
  volume: z.number(),
  time: z.number(),
  side: z.enum(['buy', 'sell']),
});

export const recentTradesSchema = z.object({
  pair: z.string(),
  trades: z.array(tradeSchema),
});

export const marketDataSchema = z.object({
  pair: z.string(),
  name: z.string(),
  lastPrice: z.number(),
  change24h: z.number(),
  changePercent24h: z.number(),
  volume24h: z.number(),
  high24h: z.number(),
  low24h: z.number(),
  bid: z.number(),
  ask: z.number(),
});

export const krakenApiErrorSchema = z.object({
  error: z.array(z.string()),
  result: z.any().optional(),
});

export const websocketMessageSchema = z.object({
  type: z.enum(['ticker', 'orderBook', 'trades']),
  pair: z.string(),
  data: z.any(),
});

export type TickerData = z.infer<typeof tickerDataSchema>;
export type OrderBookEntry = z.infer<typeof orderBookEntrySchema>;
export type OrderBook = z.infer<typeof orderBookSchema>;
export type Trade = z.infer<typeof tradeSchema>;
export type RecentTrades = z.infer<typeof recentTradesSchema>;
export type MarketData = z.infer<typeof marketDataSchema>;
export type KrakenApiError = z.infer<typeof krakenApiErrorSchema>;
export type WebSocketMessage = z.infer<typeof websocketMessageSchema>;
