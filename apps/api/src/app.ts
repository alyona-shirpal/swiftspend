import express from 'express';
import cors from 'cors';
import categoriesRoutes from './routes/categories';
import expensesRoutes from './routes/expenses';
import reportsRoutes from './routes/reports';
import exchangeRatesRoutes from './routes/exchangeRates';
import userCurrenciesRoutes from './routes/userCurrencies';
import authRoutes from './routes/auth';
import monobankRoutes from './routes/monobankIntegrations';
import integrationsRoutes from './routes/integrations';
import apiKeysRoutes from './routes/apiKeys';
import publicV1Routes from './routes/publicV1';
import { serveDocsHtml, serveMcpDocsHtml, openApiSpec } from './controllers/docs';
import { errorHandler } from './middleware/errorHandler';

export function createApp() {
  const app = express();
  const jsonParser = express.json();

  app.use(cors());
  app.use((req, res, next) => {
    if (req.path === '/expenses/document') return next();
    return jsonParser(req, res, next);
  });

  // Docs
  app.get('/docs', serveDocsHtml);
  app.get('/docs/mcp', serveMcpDocsHtml);
  app.get('/mcp/docs', serveMcpDocsHtml);
  app.get('/api/v1/docs', serveDocsHtml);
  app.get('/api/v1/openapi.json', (req, res) => res.json(openApiSpec));


  // Legacy internal API routes
  app.use('/categories', categoriesRoutes);
  app.use('/expenses', expensesRoutes);
  app.use('/reports', reportsRoutes);
  app.use('/exchange-rates', exchangeRatesRoutes);
  app.use('/user-currencies', userCurrenciesRoutes);
  app.use('/auth', authRoutes);
  app.use('/integrations/monobank', monobankRoutes);
  app.use('/integrations', integrationsRoutes);
  app.use('/api-keys', apiKeysRoutes);

  // Public REST API v1
  app.use('/api/v1', publicV1Routes);

  app.use(errorHandler);

  return app;
}

