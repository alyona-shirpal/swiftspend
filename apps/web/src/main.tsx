import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import App from './App.tsx';
import './index.css';
import { createQueryCachePersister } from './services/queryCachePersister';
import { registerServiceWorker } from './services/serviceWorker';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24,
    },
  },
});

async function bootstrap() {
  const persister = await createQueryCachePersister();

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister,
          maxAge: 1000 * 60 * 60 * 24,
          buster: 'swiftspend-v1',
        }}
      >
        <App />
      </PersistQueryClientProvider>
    </React.StrictMode>,
  );
}

void bootstrap();
registerServiceWorker();
