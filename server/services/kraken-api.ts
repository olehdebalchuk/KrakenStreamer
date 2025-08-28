import { type TickerData, type OrderBook, type RecentTrades, type MarketData, krakenApiErrorSchema } from "@shared/schema";
import crypto from 'crypto';

export class KrakenApiService {
  private readonly baseUrl = 'https://api.kraken.com/0';
  private readonly apiKey = process.env.KRAKEN_API_KEY;
  private readonly privateKey = process.env.KRAKEN_PRIVATE_KEY;
  private lastRequestTime = 0;
  private readonly rateLimitMs = this.apiKey ? 500 : 1000; // Faster rate limit with API key

  private async rateLimitedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.rateLimitMs) {
      const delayMs = this.rateLimitMs - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    
    this.lastRequestTime = Date.now();
    return fetch(url, options);
  }

  private generateAuthHeaders(endpoint: string, data: string = ''): Record<string, string> {
    if (!this.apiKey || !this.privateKey) {
      throw new Error('Kraken API credentials not configured');
    }

    const nonce = Date.now().toString();
    const postData = `nonce=${nonce}&${data}`;
    const message = endpoint + crypto.createHash('sha256').update(postData).digest();
    const signature = crypto
      .createHmac('sha512', Buffer.from(this.privateKey, 'base64'))
      .update(message)
      .digest('base64');

    return {
      'API-Key': this.apiKey,
      'API-Sign': signature,
      'Content-Type': 'application/x-www-form-urlencoded',
    };
  }

  private async makeRequest<T>(endpoint: string): Promise<T> {
    try {
      const response = await this.rateLimitedFetch(`${this.baseUrl}${endpoint}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const validatedData = krakenApiErrorSchema.parse(data);
      
      if (validatedData.error && validatedData.error.length > 0) {
        throw new Error(`Kraken API Error: ${validatedData.error.join(', ')}`);
      }
      
      return validatedData.result as T;
    } catch (error) {
      console.error(`Kraken API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  private async makePrivateRequest<T>(endpoint: string, data: string = ''): Promise<T> {
    try {
      const headers = this.generateAuthHeaders(endpoint, data);
      const postData = `nonce=${Date.now()}&${data}`;
      
      const response = await this.rateLimitedFetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers,
        body: postData,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const responseData = await response.json();
      const validatedData = krakenApiErrorSchema.parse(responseData);
      
      if (validatedData.error && validatedData.error.length > 0) {
        throw new Error(`Kraken API Error: ${validatedData.error.join(', ')}`);
      }
      
      return validatedData.result as T;
    } catch (error) {
      console.error(`Kraken private API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  async getTickerData(pair: string): Promise<TickerData> {
    const result = await this.makeRequest<any>(`/public/Ticker?pair=${pair}`);
    const pairKey = Object.keys(result)[0];
    const data = result[pairKey];
    
    return {
      pair,
      name: this.getPairDisplayName(pair),
      lastPrice: parseFloat(data.c[0]),
      change24h: parseFloat(data.c[0]) - parseFloat(data.o),
      changePercent24h: ((parseFloat(data.c[0]) - parseFloat(data.o)) / parseFloat(data.o)) * 100,
      volume24h: parseFloat(data.v[1]),
      high24h: parseFloat(data.h[1]),
      low24h: parseFloat(data.l[1]),
      bid: parseFloat(data.b[0]),
      ask: parseFloat(data.a[0]),
      spread: parseFloat(data.a[0]) - parseFloat(data.b[0]),
      spreadPercent: ((parseFloat(data.a[0]) - parseFloat(data.b[0])) / parseFloat(data.b[0])) * 100,
    };
  }

  async getOrderBook(pair: string, count: number = 5): Promise<OrderBook> {
    const result = await this.makeRequest<any>(`/public/Depth?pair=${pair}&count=${count}`);
    const pairKey = Object.keys(result)[0];
    const data = result[pairKey];
    
    const asks = data.asks.map((ask: [string, string, number]) => ({
      price: parseFloat(ask[0]),
      volume: parseFloat(ask[1]),
      timestamp: ask[2],
    }));
    
    const bids = data.bids.map((bid: [string, string, number]) => ({
      price: parseFloat(bid[0]),
      volume: parseFloat(bid[1]),
      timestamp: bid[2],
    }));

    const bestAsk = asks.length > 0 ? asks[0].price : 0;
    const bestBid = bids.length > 0 ? bids[0].price : 0;
    const spread = bestAsk - bestBid;
    const spreadPercent = bestBid > 0 ? (spread / bestBid) * 100 : 0;
    
    return {
      pair,
      asks,
      bids,
      spread,
      spreadPercent,
    };
  }

  async getRecentTrades(pair: string, count: number = 100): Promise<RecentTrades> {
    const result = await this.makeRequest<any>(`/public/Trades?pair=${pair}&count=${count}`);
    const pairKey = Object.keys(result)[0];
    const trades = result[pairKey];
    
    const processedTrades = trades.map((trade: [string, string, number, string, string, string]) => ({
      price: parseFloat(trade[0]),
      volume: parseFloat(trade[1]),
      time: trade[2],
      side: trade[3] === 'b' ? 'buy' as const : 'sell' as const,
    }));
    
    return {
      pair,
      trades: processedTrades,
    };
  }

  async getMultipleTickers(pairs: string[]): Promise<MarketData[]> {
    const pairString = pairs.join(',');
    const result = await this.makeRequest<any>(`/public/Ticker?pair=${pairString}`);
    
    return pairs.map(pair => {
      // Map common pair names to Kraken's format
      const krakenPairMap: Record<string, string[]> = {
        'XBTUSD': ['XXBTZUSD', 'XBTUSD'],
        'ETHUSD': ['XETHZUSD', 'ETHUSD'],
        'ADAUSD': ['ADAUSD'],
        'DOTUSD': ['DOTUSD'],
        'SOLUSD': ['SOLUSD'],
        'MATICUSD': ['MATICUSD'],
        'LINKUSD': ['LINKUSD'],
        'UNIUSD': ['UNIUSD']
      };
      
      let pairKey = '';
      const possibleKeys = krakenPairMap[pair] || [pair];
      
      for (const key of possibleKeys) {
        if (result[key]) {
          pairKey = key;
          break;
        }
      }
      
      // Fallback to general matching if specific mapping doesn't work
      if (!pairKey) {
        pairKey = Object.keys(result).find(key => {
          const normalizedKey = key.replace(/[XZ]/g, '');
          const normalizedPair = pair.replace(/[XZ/]/g, '');
          return normalizedKey.includes(normalizedPair) || key.includes(pair);
        }) || '';
      }
      
      if (!pairKey || !result[pairKey]) {
        console.warn(`No data found for pair ${pair}. Available keys:`, Object.keys(result));
        throw new Error(`No data found for pair ${pair}`);
      }
      
      const data = result[pairKey];
      
      return {
        pair,
        name: this.getPairDisplayName(pair),
        lastPrice: parseFloat(data.c[0]),
        change24h: parseFloat(data.c[0]) - parseFloat(data.o),
        changePercent24h: ((parseFloat(data.c[0]) - parseFloat(data.o)) / parseFloat(data.o)) * 100,
        volume24h: parseFloat(data.v[1]),
        high24h: parseFloat(data.h[1]),
        low24h: parseFloat(data.l[1]),
        bid: parseFloat(data.b[0]),
        ask: parseFloat(data.a[0]),
      };
    });
  }

  private getPairDisplayName(pair: string): string {
    const names: Record<string, string> = {
      'XBTUSD': 'Bitcoin',
      'ETHUSD': 'Ethereum',
      'ADAUSD': 'Cardano',
      'DOTUSD': 'Polkadot',
      'SOLUSD': 'Solana',
      'MATICUSD': 'Polygon',
      'LINKUSD': 'Chainlink',
      'UNIUSD': 'Uniswap',
      'BTC/USD': 'Bitcoin',
      'ETH/USD': 'Ethereum',
      'ADA/USD': 'Cardano',
      'DOT/USD': 'Polkadot',
      'SOL/USD': 'Solana',
      'MATIC/USD': 'Polygon',
      'LINK/USD': 'Chainlink',
      'UNI/USD': 'Uniswap',
    };
    
    return names[pair] || pair.split('/')[0];
  }

  getPairIcon(pair: string): string {
    const icons: Record<string, string> = {
      'BTC': 'fab fa-bitcoin',
      'ETH': 'fab fa-ethereum',
      'XBT': 'fab fa-bitcoin',
    };
    
    const symbol = pair.split('/')[0].replace('X', '');
    return icons[symbol] || 'fas fa-coins';
  }

  getPairColor(pair: string): string {
    const colors: Record<string, string> = {
      'BTC': 'bg-orange-500',
      'ETH': 'bg-blue-500',
      'ADA': 'bg-green-500',
      'DOT': 'bg-purple-500',
      'SOL': 'bg-pink-500',
      'MATIC': 'bg-indigo-500',
      'LINK': 'bg-blue-600',
      'UNI': 'bg-pink-400',
      'XBT': 'bg-orange-500',
    };
    
    const symbol = pair.split('/')[0].replace('X', '');
    return colors[symbol] || 'bg-gray-500';
  }

  // Utility methods for authentication status and account info
  isAuthenticated(): boolean {
    return !!(this.apiKey && this.privateKey);
  }

  getAuthenticationStatus() {
    return {
      isAuthenticated: this.isAuthenticated(),
      rateLimitMs: this.rateLimitMs,
      apiKeyConfigured: !!this.apiKey,
      privateKeyConfigured: !!this.privateKey,
    };
  }

  // Example of a private endpoint - get account balance
  async getAccountBalance(): Promise<any> {
    if (!this.isAuthenticated()) {
      throw new Error('Authentication required for account balance');
    }
    return this.makePrivateRequest<any>('/private/Balance');
  }

  // Get system status (public endpoint with better rate limits when authenticated)
  async getSystemStatus(): Promise<any> {
    return this.makeRequest<any>('/public/SystemStatus');
  }
}

export const krakenApi = new KrakenApiService();
