import * as functions from 'firebase-functions';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { MarketDataService } from './marketDataService';

const app = express();
const marketService = new MarketDataService();

// Enable CORS for mobile app requests
app.use(cors({ origin: true }));
app.use(express.json());

// Health & System Info
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    service: 'Minti Finance Market Data Gateway',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    compliance: 'Educational Virtual-Trading Simulator with Live Market Feeds',
  });
});

// Live Market Status
app.get('/api/market/status', async (req: Request, res: Response) => {
  try {
    const status = await marketService.getMarketStatus();
    res.json({ success: true, data: status });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Market Overview (Indices, Gainers, Losers, Most Active)
app.get('/api/market/overview', async (req: Request, res: Response) => {
  try {
    const overview = await marketService.getMarketOverview();
    res.json({ success: true, data: overview });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Batch Quotes
app.get('/api/market/quotes', async (req: Request, res: Response) => {
  try {
    const symbolsParam = req.query.symbols as string;
    const symbols = symbolsParam ? symbolsParam.split(',').map((s) => s.trim()) : [];
    const quotes = await marketService.getQuotes(symbols);
    res.json({ success: true, data: quotes });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Single Instrument Quote
app.get('/api/market/quote/:symbol', async (req: Request, res: Response) => {
  try {
    const symbol = req.params.symbol;
    const quote = await marketService.getQuote(symbol);
    if (!quote) {
      res.status(404).json({ success: false, error: `Instrument ${symbol} not found.` });
      return;
    }
    res.json({ success: true, data: quote });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Historical Candles / Chart Series
app.get('/api/market/history/:symbol', async (req: Request, res: Response) => {
  try {
    const symbol = req.params.symbol;
    const timeframe = (req.query.range as string) || '1D';
    const candles = await marketService.getHistoricalCandles(symbol, timeframe);
    res.json({ success: true, data: { symbol, timeframe, candles } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Company Fundamentals & Research
app.get('/api/market/fundamentals/:symbol', async (req: Request, res: Response) => {
  try {
    const symbol = req.params.symbol;
    const fundamentals = await marketService.getCompanyFundamentals(symbol);
    if (!fundamentals) {
      res.status(404).json({ success: false, error: `Fundamentals for ${symbol} not found.` });
      return;
    }
    res.json({ success: true, data: fundamentals });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Stock Search
app.get('/api/market/search', async (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string) || '';
    const results = await marketService.searchInstruments(query);
    res.json({ success: true, data: results });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mutual Funds
app.get('/api/market/mutual-funds', async (req: Request, res: Response) => {
  try {
    const funds = await marketService.getMutualFunds();
    res.json({ success: true, data: funds });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Simulated Charges Calculation
app.post('/api/simulation/charges', (req: Request, res: Response) => {
  try {
    const { grossValue, isBuy } = req.body;
    const charges = marketService.calculateSimulatedCharges(Number(grossValue) || 0, !!isBuy);
    res.json({ success: true, data: charges });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Simulated Order Execution Endpoint
app.post('/api/simulation/order', async (req: Request, res: Response) => {
  try {
    const { symbol, type, quantity, virtualCashAvailable } = req.body;
    if (!symbol || !type || !quantity) {
      res.status(400).json({ success: false, error: 'Missing required order fields.' });
      return;
    }

    const orderResult = await marketService.simulateOrder({
      symbol,
      type,
      quantity: Number(quantity),
      virtualCashAvailable: Number(virtualCashAvailable) || 0,
    });

    res.json({ success: true, data: orderResult });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export as Firebase Cloud Function
export const api = functions.https.onRequest(app);
