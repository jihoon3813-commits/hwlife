import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ConvexProvider, ConvexReactClient } from "convex/react";
import App from './App.tsx';
import AdminApp from './AdminApp.tsx';
import './index.css';

// Convex Client Setup with Safety Check
const convexUrl = (import.meta as any).env.VITE_CONVEX_URL || "https://elated-fish-742.convex.cloud"; // 임시 폴백 주소 포함
const convex = new ConvexReactClient(convexUrl);

// Precise Routing Logic for GitHub Pages & Vercel
const path = window.location.pathname.toLowerCase();
const search = window.location.search.toLowerCase();
const hash = window.location.hash.toLowerCase();
const isAdmin = path.includes('/admin') || search.includes('admin') || hash.includes('admin') || path.endsWith('admin');

console.log('Routing Debug:', { path, search, hash, isAdmin });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConvexProvider client={convex}>
      {isAdmin ? <AdminApp /> : <App />}
    </ConvexProvider>
  </StrictMode>,
);
