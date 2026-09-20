import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ReactDOM from 'react-dom/client';

import App from './App.tsx';

import './styles.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

// No React.StrictMode: RevealWidget (3D preview panel, FR-019) creates its
// own WebGL/Reveal viewer context on mount. StrictMode's dev-mode double
// mount/cleanup/mount doesn't cancel Reveal's in-flight async loads cleanly,
// producing spurious errors from the discarded first instance — per the
// reveal-3d skill's own documented guidance.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
