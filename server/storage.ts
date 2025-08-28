import { type TickerData, type OrderBook, type RecentTrades, type MarketData } from "@shared/schema";

export interface IStorage {
  // Ticker data operations
  setTickerData(pair: string, data: TickerData): Promise<void>;
  getTickerData(pair: string): Promise<TickerData | undefined>;
  getAllTickerData(): Promise<TickerData[]>;
  
  // Order book operations
  setOrderBook(pair: string, data: OrderBook): Promise<void>;
  getOrderBook(pair: string): Promise<OrderBook | undefined>;
  
  // Recent trades operations
  setRecentTrades(pair: string, data: RecentTrades): Promise<void>;
  getRecentTrades(pair: string): Promise<RecentTrades | undefined>;
  
  // Market data operations
  setMarketData(data: MarketData[]): Promise<void>;
  getMarketData(): Promise<MarketData[]>;
  
  // Utility operations
  getLastUpdated(): Promise<Date | undefined>;
  setLastUpdated(date: Date): Promise<void>;
}

export class MemStorage implements IStorage {
  private tickerData: Map<string, TickerData>;
  private orderBooks: Map<string, OrderBook>;
  private recentTrades: Map<string, RecentTrades>;
  private marketData: MarketData[];
  private lastUpdated: Date | undefined;

  constructor() {
    this.tickerData = new Map();
    this.orderBooks = new Map();
    this.recentTrades = new Map();
    this.marketData = [];
    this.lastUpdated = undefined;
  }

  async setTickerData(pair: string, data: TickerData): Promise<void> {
    this.tickerData.set(pair, data);
  }

  async getTickerData(pair: string): Promise<TickerData | undefined> {
    return this.tickerData.get(pair);
  }

  async getAllTickerData(): Promise<TickerData[]> {
    return Array.from(this.tickerData.values());
  }

  async setOrderBook(pair: string, data: OrderBook): Promise<void> {
    this.orderBooks.set(pair, data);
  }

  async getOrderBook(pair: string): Promise<OrderBook | undefined> {
    return this.orderBooks.get(pair);
  }

  async setRecentTrades(pair: string, data: RecentTrades): Promise<void> {
    this.recentTrades.set(pair, data);
  }

  async getRecentTrades(pair: string): Promise<RecentTrades | undefined> {
    return this.recentTrades.get(pair);
  }

  async setMarketData(data: MarketData[]): Promise<void> {
    this.marketData = data;
  }

  async getMarketData(): Promise<MarketData[]> {
    return this.marketData;
  }

  async getLastUpdated(): Promise<Date | undefined> {
    return this.lastUpdated;
  }

  async setLastUpdated(date: Date): Promise<void> {
    this.lastUpdated = date;
  }
}

export const storage = new MemStorage();
