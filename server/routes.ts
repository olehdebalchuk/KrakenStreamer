import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { krakenApi } from "./services/kraken-api";
import { type WebSocketMessage } from "@shared/schema";

const POPULAR_PAIRS = ['XBTUSD', 'ETHUSD', 'ADAUSD', 'DOTUSD', 'SOLUSD', 'MATICUSD', 'LINKUSD', 'UNIUSD'];

export async function registerRoutes(app: Express): Promise<Server> {
  // Get ticker data for a specific pair
  app.get("/api/ticker/:pair", async (req, res) => {
    try {
      const { pair } = req.params;
      const data = await krakenApi.getTickerData(pair);
      await storage.setTickerData(pair, data);
      res.json(data);
    } catch (error) {
      console.error('Error fetching ticker data:', error);
      res.status(500).json({ 
        error: 'Failed to fetch ticker data',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get order book for a specific pair
  app.get("/api/orderbook/:pair", async (req, res) => {
    try {
      const { pair } = req.params;
      const count = parseInt(req.query.count as string) || 5;
      const data = await krakenApi.getOrderBook(pair, count);
      await storage.setOrderBook(pair, data);
      res.json(data);
    } catch (error) {
      console.error('Error fetching order book:', error);
      res.status(500).json({ 
        error: 'Failed to fetch order book',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get recent trades for a specific pair
  app.get("/api/trades/:pair", async (req, res) => {
    try {
      const { pair } = req.params;
      const count = parseInt(req.query.count as string) || 100;
      const data = await krakenApi.getRecentTrades(pair, count);
      await storage.setRecentTrades(pair, data);
      res.json(data);
    } catch (error) {
      console.error('Error fetching recent trades:', error);
      res.status(500).json({ 
        error: 'Failed to fetch recent trades',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get market data for all popular pairs
  app.get("/api/market-data", async (req, res) => {
    try {
      const data = await krakenApi.getMultipleTickers(POPULAR_PAIRS);
      await storage.setMarketData(data);
      await storage.setLastUpdated(new Date());
      res.json(data);
    } catch (error) {
      console.error('Error fetching market data:', error);
      res.status(500).json({ 
        error: 'Failed to fetch market data',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get cached data from storage
  app.get("/api/cached/:type/:pair?", async (req, res) => {
    try {
      const { type, pair } = req.params;
      
      switch (type) {
        case 'ticker':
          if (pair) {
            const data = await storage.getTickerData(pair);
            res.json(data || null);
          } else {
            const data = await storage.getAllTickerData();
            res.json(data);
          }
          break;
          
        case 'orderbook':
          if (!pair) {
            return res.status(400).json({ error: 'Pair required for order book' });
          }
          const orderBook = await storage.getOrderBook(pair);
          res.json(orderBook || null);
          break;
          
        case 'trades':
          if (!pair) {
            return res.status(400).json({ error: 'Pair required for trades' });
          }
          const trades = await storage.getRecentTrades(pair);
          res.json(trades || null);
          break;
          
        case 'market-data':
          const marketData = await storage.getMarketData();
          const lastUpdated = await storage.getLastUpdated();
          res.json({ data: marketData, lastUpdated });
          break;
          
        default:
          res.status(400).json({ error: 'Invalid type' });
      }
    } catch (error) {
      console.error('Error fetching cached data:', error);
      res.status(500).json({ 
        error: 'Failed to fetch cached data',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get API authentication status and account info
  app.get("/api/auth-status", async (req, res) => {
    try {
      const authStatus = krakenApi.getAuthenticationStatus();
      let accountInfo = null;
      
      if (authStatus.isAuthenticated) {
        try {
          accountInfo = await krakenApi.getAccountBalance();
        } catch (error) {
          console.error('Failed to fetch account balance:', error);
          // Don't fail the whole request if balance fails
          accountInfo = { error: 'Failed to fetch account balance' };
        }
      }

      res.json({
        authentication: authStatus,
        account: accountInfo,
        systemStatus: await krakenApi.getSystemStatus()
      });
    } catch (error) {
      console.error('Error fetching auth status:', error);
      res.status(500).json({ 
        error: 'Failed to fetch authentication status',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Force refresh all data
  app.post("/api/refresh", async (req, res) => {
    try {
      // Refresh market data
      const marketData = await krakenApi.getMultipleTickers(POPULAR_PAIRS);
      await storage.setMarketData(marketData);
      
      // Refresh order books and trades for popular pairs
      for (const pair of POPULAR_PAIRS) {
        try {
          const [orderBook, trades] = await Promise.all([
            krakenApi.getOrderBook(pair, 10),
            krakenApi.getRecentTrades(pair, 50)
          ]);
          
          await storage.setOrderBook(pair, orderBook);
          await storage.setRecentTrades(pair, trades);
        } catch (error) {
          console.error(`Error refreshing data for ${pair}:`, error);
        }
      }
      
      await storage.setLastUpdated(new Date());
      res.json({ success: true, message: 'Data refreshed successfully' });
    } catch (error) {
      console.error('Error refreshing data:', error);
      res.status(500).json({ 
        error: 'Failed to refresh data',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected');
    
    ws.on('message', async (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'subscribe') {
          // Client wants to subscribe to updates for specific pairs
          const pairs = data.pairs || POPULAR_PAIRS;
          
          // Send initial data
          for (const pair of pairs) {
            try {
              const [ticker, orderBook, trades] = await Promise.all([
                storage.getTickerData(pair) || krakenApi.getTickerData(pair),
                storage.getOrderBook(pair) || krakenApi.getOrderBook(pair, 5),
                storage.getRecentTrades(pair) || krakenApi.getRecentTrades(pair, 20)
              ]);

              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                  type: 'ticker',
                  pair,
                  data: ticker
                } as WebSocketMessage));

                ws.send(JSON.stringify({
                  type: 'orderBook',
                  pair,
                  data: orderBook
                } as WebSocketMessage));

                ws.send(JSON.stringify({
                  type: 'trades',
                  pair,
                  data: trades
                } as WebSocketMessage));
              }
            } catch (error) {
              console.error(`Error sending initial data for ${pair}:`, error);
            }
          }
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });

    // Send ping every 30 seconds to keep connection alive
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      } else {
        clearInterval(pingInterval);
      }
    }, 30000);
  });

  // Broadcast updates to all connected clients every 15 seconds
  setInterval(async () => {
    if (wss.clients.size === 0) return;

    try {
      // Refresh data periodically
      const marketData = await krakenApi.getMultipleTickers(POPULAR_PAIRS);
      await storage.setMarketData(marketData);

      // Broadcast to all connected clients
      for (const ticker of marketData) {
        const message: WebSocketMessage = {
          type: 'ticker',
          pair: ticker.pair,
          data: ticker
        };

        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
          }
        });
      }
    } catch (error) {
      console.error('Error broadcasting updates:', error);
    }
  }, 15000);

  return httpServer;
}
