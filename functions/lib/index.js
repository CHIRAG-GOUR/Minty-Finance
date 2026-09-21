"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const functions = __importStar(require("firebase-functions"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const marketDataService_1 = require("./marketDataService");
const app = (0, express_1.default)();
const marketService = new marketDataService_1.MarketDataService();
// Enable CORS for mobile app requests
app.use((0, cors_1.default)({ origin: true }));
app.use(express_1.default.json());
// Health & System Info
app.get('/api/health', (req, res) => {
    res.json({
        status: 'online',
        service: 'Minti Finance Market Data Gateway',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        compliance: 'Educational Virtual-Trading Simulator with Live Market Feeds',
    });
});
// Live Market Status
app.get('/api/market/status', async (req, res) => {
    try {
        const status = await marketService.getMarketStatus();
        res.json({ success: true, data: status });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// Market Overview (Indices, Gainers, Losers, Most Active)
app.get('/api/market/overview', async (req, res) => {
    try {
        const overview = await marketService.getMarketOverview();
        res.json({ success: true, data: overview });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// Batch Quotes
app.get('/api/market/quotes', async (req, res) => {
    try {
        const symbolsParam = req.query.symbols;
        const symbols = symbolsParam ? symbolsParam.split(',').map((s) => s.trim()) : [];
        const quotes = await marketService.getQuotes(symbols);
        res.json({ success: true, data: quotes });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// Single Instrument Quote
app.get('/api/market/quote/:symbol', async (req, res) => {
    try {
        const symbol = req.params.symbol;
        const quote = await marketService.getQuote(symbol);
        if (!quote) {
            res.status(404).json({ success: false, error: `Instrument ${symbol} not found.` });
            return;
        }
        res.json({ success: true, data: quote });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// Historical Candles / Chart Series
app.get('/api/market/history/:symbol', async (req, res) => {
    try {
        const symbol = req.params.symbol;
        const timeframe = req.query.range || '1D';
        const candles = await marketService.getHistoricalCandles(symbol, timeframe);
        res.json({ success: true, data: { symbol, timeframe, candles } });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// Company Fundamentals & Research
app.get('/api/market/fundamentals/:symbol', async (req, res) => {
    try {
        const symbol = req.params.symbol;
        const fundamentals = await marketService.getCompanyFundamentals(symbol);
        if (!fundamentals) {
            res.status(404).json({ success: false, error: `Fundamentals for ${symbol} not found.` });
            return;
        }
        res.json({ success: true, data: fundamentals });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// Stock Search
app.get('/api/market/search', async (req, res) => {
    try {
        const query = req.query.q || '';
        const results = await marketService.searchInstruments(query);
        res.json({ success: true, data: results });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// Mutual Funds
app.get('/api/market/mutual-funds', async (req, res) => {
    try {
        const funds = await marketService.getMutualFunds();
        res.json({ success: true, data: funds });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// Simulated Charges Calculation
app.post('/api/simulation/charges', (req, res) => {
    try {
        const { grossValue, isBuy } = req.body;
        const charges = marketService.calculateSimulatedCharges(Number(grossValue) || 0, !!isBuy);
        res.json({ success: true, data: charges });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// Simulated Order Execution Endpoint
app.post('/api/simulation/order', async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// Export as Firebase Cloud Function
exports.api = functions.https.onRequest(app);
//# sourceMappingURL=index.js.map