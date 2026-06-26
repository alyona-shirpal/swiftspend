import path from 'path';
import dotenv from 'dotenv';
import { createApp } from './app';

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const app = createApp();

// Vercel Express runtime uses the default export as the server entrypoint
export default app;

// Local development: start a standalone HTTP server
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}
