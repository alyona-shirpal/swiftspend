import express from 'express';
import cors from 'cors';
import categoriesRoutes from './routes/categories';
import expensesRoutes from './routes/expenses';
import reportsRoutes from './routes/reports';
import exchangeRatesRoutes from './routes/exchangeRates';
import userCurrenciesRoutes from './routes/userCurrencies';
import authRoutes from './routes/auth';
import { errorHandler } from './middleware/errorHandler';

export function createApp() {
  const app = express();
  const jsonParser = express.json();

  app.use(cors());
  app.use((req, res, next) => {
    if (req.path === '/expenses/document') return next();
    return jsonParser(req, res, next);
  });

  app.use('/categories', categoriesRoutes);
  app.use('/expenses', expensesRoutes);
  app.use('/reports', reportsRoutes);
  app.use('/exchange-rates', exchangeRatesRoutes);
  app.use('/user-currencies', userCurrenciesRoutes);
  app.use('/auth', authRoutes);

  app.use(errorHandler);

  return app;
}
