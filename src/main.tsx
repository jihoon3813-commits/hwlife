import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ConvexProvider, ConvexReactClient } from "convex/react";
import App from './App.tsx';
import AdminApp from './AdminApp.tsx';
import './index.css';

// Convex Client Setup
const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

// Precise Routing Logic for GitHub Pages & Vercel
const path = window.location.pathname;
const isAdmin = path.endsWith('/admin') || path.endsWith('/admin/') || path.includes('/admin?');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConvexProvider client={convex}>
      {isAdmin ? <AdminApp /> : <App />}
    </ConvexProvider>
  </StrictMode>,
);
