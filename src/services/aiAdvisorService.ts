import { BudgetState } from '../types';
import { calculateSavingsRate } from '../utils/financialMath';
import { formatCurrency } from '../utils/formatters';

export interface AIAdvisorResponse {
  message: string;
  suggestedPrompts: string[];
  actionRecommendation?: {
    type: 'rebalance_budget' | 'start_sip' | 'open_fd' | 'explore_lesson' | 'explore_markets';
    label: string;
    payload?: any;
  };
}

export const AIAdvisorService = {
  generateBudgetAnalysis(budget: BudgetState): AIAdvisorResponse {
    const totalSpent = budget.items.reduce((acc, item) => acc + item.spentAmount, 0);
    const { savingsAmount, savingsRatePercent, status } = calculateSavingsRate(
      budget.monthlyIncome,
      totalSpent
    );

    const highestExpense = [...budget.items].sort((a, b) => b.spentAmount - a.spentAmount)[0];

    let advice = '';
    const suggestedPrompts: string[] = [
      'What does P/E ratio mean for stock valuation?',
      'Why did my simulated portfolio move today?',
      'How does diversification reduce investment risk?',
    ];

    if (status === 'low') {
      advice = `[Educational Budget Analysis]\nYour current simulated savings rate is ${savingsRatePercent}%, leaving ${formatCurrency(
        savingsAmount
      )}/month. Your largest category is ${highestExpense?.categoryName} (${formatCurrency(
        highestExpense?.spentAmount || 0
      )}). Reducing discretionary spending by 10% will help reach the optimal 20% savings target.`;
    } else if (status === 'moderate' || status === 'good') {
      advice = `[Educational Budget Analysis]\nSolid financial balance! You are saving ${savingsRatePercent}% (${formatCurrency(
        savingsAmount
      )}/month). In educational practice, consider allocating part into diversified mutual funds and part into a capital-guaranteed Fixed Deposit.`;
    } else {
      advice = `[Educational Budget Analysis]\nOutstanding savings discipline! At a ${savingsRatePercent}% savings rate (${formatCurrency(
        savingsAmount
      )}/month), you are well ahead of average benchmarks and ready to explore compound wealth growth.`;
    }

    return {
      message: advice,
      suggestedPrompts,
    };
  },

  async askQuestion(
    query: string,
    context: {
      budget: BudgetState;
      currentCash: number;
      portfolioValue: number;
      level: number;
    }
  ): Promise<AIAdvisorResponse> {
    const lower = query.toLowerCase();

    if (lower.includes('pe') || lower.includes('p/e') || lower.includes('price to earnings') || lower.includes('valuation')) {
      return {
        message:
          '[Educational Financial Metric: P/E Ratio]\n\n• What it means: The Price-to-Earnings ratio compares the current market price of a stock to its earnings per share (EPS). It shows how many rupees investors pay for ₹1 of annual company profit.\n\n• Why investors look at it: It helps determine if a stock is trading at a premium or discount compared to its sector peers.\n\n• What to watch: Fast-growing tech companies often have higher P/E ratios due to future growth expectations, while cyclical commodity firms trade at lower P/E multiples.\n\n[Disclaimer: Minti Finance provides educational analysis and never gives financial buy/sell recommendations.]',
        suggestedPrompts: [
          'What is Debt-to-Equity ratio?',
          'What does Return on Equity (ROE) measure?',
          'How do I use the Pre-Investment Checklist?',
        ],
        actionRecommendation: {
          type: 'explore_markets',
          label: 'Compare P/E on Markets Tab',
        },
      };
    }

    if (lower.includes('debt') || lower.includes('debt-to-equity') || lower.includes('borrow')) {
      return {
        message:
          '[Educational Financial Metric: Debt-to-Equity]\n\n• What it means: The Debt-to-Equity ratio measures total company debt relative to shareholder equity.\n\n• Why it matters: Companies with low debt (under 0.5x) easily service interest payments and weather economic recessions without bankruptcy risk.\n\n• Sector nuance: Capital-heavy industries (telecom, power, banking) naturally use higher leverage, while IT companies like TCS and Infosys are virtually debt-free.',
        suggestedPrompts: [
          'What is ROE (Return on Equity)?',
          'What is P/E Ratio?',
          'Why did my portfolio change value?',
        ],
      };
    }

    if (lower.includes('why did my portfolio') || lower.includes('portfolio fall') || lower.includes('market move')) {
      return {
        message:
          '[Observed Market Dynamics & Education]\n\nYour simulated portfolio valuation updates dynamically in real-time as live market quotes on the National Stock Exchange (NSE) fluctuate throughout the 09:15 - 15:30 IST session.\n\nStock prices change daily based on corporate earnings announcements, macroeconomic data, interest rate shifts, and supply/demand. Short-term price swings are normal; holding quality, profitable businesses across diverse sectors helps compound wealth over 5+ years.',
        suggestedPrompts: [
          'What is diversification?',
          'How do mutual funds reduce volatility?',
          'Explain the 50/30/20 budgeting rule',
        ],
      };
    }

    if (lower.includes('diversif') || lower.includes('allocation') || lower.includes('risk')) {
      return {
        message:
          '[Core Concept: Portfolio Diversification]\n\nDiversification means spreading your investment capital across multiple companies, sectors (IT, Banking, FMCG, Auto, Pharma), and asset types (Equities, Mutual Funds, Fixed Deposits, Cash).\n\nIf one sector faces headwinds, gains in other sectors protect your overall portfolio from steep declines.',
        suggestedPrompts: [
          'What is an Index Fund?',
          'How does a Fixed Deposit work?',
          'What is P/E ratio?',
        ],
        actionRecommendation: {
          type: 'explore_lesson',
          label: 'Read Risk & Diversification Lesson',
        },
      };
    }

    if (lower.includes('compound') || lower.includes('growth') || lower.includes('rule of 72')) {
      return {
        message:
          '[Core Concept: Compound Growth]\n\nCompound interest means you earn returns not only on your initial principal, but also on all past accumulated profits. Albert Einstein called compounding the 8th wonder of the world.\n\nShortcut: The Rule of 72 tells you how fast your money doubles (72 ÷ Annual Return % = Years to Double). At 12% p.a., your money doubles in 6 years!',
        suggestedPrompts: [
          'Open the Compound Simulator',
          'What is the difference between stocks and mutual funds?',
          'What is P/E ratio?',
        ],
        actionRecommendation: {
          type: 'start_sip',
          label: 'Open Growth Simulator',
        },
      };
    }

    if (lower.includes('stock') || lower.includes('share') || lower.includes('equity') || lower.includes('nifty')) {
      return {
        message:
          '[Educational Market Concept: Stocks & Equities]\n\nA stock represents real fractional ownership in a listed corporation (e.g. Reliance, TCS, HDFC Bank). When the company generates profits and expands, the share price tends to appreciate and companies may distribute cash dividends to shareholders.\n\nMinti Finance allows you to practice whole-share simulated orders using live NSE market data without risking real money.',
        suggestedPrompts: [
          'How do I calculate simulated charges?',
          'What is the Pre-Investment Checklist?',
          'Explain P/E ratio',
        ],
        actionRecommendation: {
          type: 'explore_markets',
          label: 'Explore Stocks',
        },
      };
    }

    // Default financial explainer
    return {
      message:
        `[Minti Finance Educational Assistant]\n\nHello! I am your interactive financial learning companion. You have ${formatCurrency(
        context.currentCash
      )} in virtual practice capital.\n\nAsk me about:\n• Financial valuation metrics (P/E, Debt-to-Equity, ROE, EPS)\n• How stock markets and benchmark indices (NIFTY 50, SENSEX) work\n• Why your virtual portfolio moves with real market data\n• Budgeting principles and the 50/30/20 rule\n• Compound interest and long-term asset allocation`,
      suggestedPrompts: [
        'What does P/E ratio mean?',
        'What is Debt-to-Equity?',
        'How does compound growth work?',
      ],
    };
  },
};
