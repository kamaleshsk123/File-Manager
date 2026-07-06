import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HashRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import ShareLandingPage from './components/layout/ShareLandingPage.tsx'

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/share/:type/:shareId" element={<ShareLandingPage />} />
        </Routes>
      </HashRouter>
    </QueryClientProvider>
  </StrictMode>,
)
