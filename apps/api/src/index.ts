import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import categoriesRoutes from './routes/categories';
import expensesRoutes from './routes/expenses';
import reportsRoutes from './routes/reports';
import exchangeRatesRoutes from './routes/exchangeRates';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/categories', categoriesRoutes);
app.use('/expenses', expensesRoutes);
app.use('/reports', reportsRoutes);
app.use('/exchange-rates', exchangeRatesRoutes);

// Global Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
