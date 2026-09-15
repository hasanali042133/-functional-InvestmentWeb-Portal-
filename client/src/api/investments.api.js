import { api, unwrap } from './client.js';

/** → { investment, transaction } */
export const createInvestment = ({ productId, amount }) =>
  api.post('/api/investments', { productId, amount }).then(unwrap);

/** → { investments } */
export const listInvestments = () => api.get('/api/investments').then(unwrap);

/** → { transactions, pagination } */
export const listTransactions = ({ page = 1, limit = 10 } = {}) =>
  api.get('/api/transactions', { params: { page, limit } }).then(unwrap);

/** → { totalInvested, currentValue, totalGain, gainPct, investmentCount, availableBalance, holdings } */
export const getPortfolioSummary = () => api.get('/api/portfolio/summary').then(unwrap);

/** → { series: [{ date, value, invested }] } — the portfolio performance chart. */
export const getPortfolioPerformance = () => api.get('/api/portfolio/performance').then(unwrap);

export const getPortfolioRisk = () => api.get('/api/portfolio/risk').then(unwrap);
