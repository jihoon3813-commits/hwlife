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
const isAdmin = path.includes('/admin') || search.includes('proxy=') || search.includes('admin=true');


window.onerror = function(msg, url, lineNo, columnNo, error) {
  alert('Error: ' + msg + '\nURL: ' + url + '\nLine: ' + lineNo + '\nColumn: ' + columnNo + '\nError object: ' + JSON.stringify(error));
  return false;
};

console.log('Routing Debug:', { path, search, hash, isAdmin });
if (isAdmin && search.includes('admin=true')) {
    window.history.replaceState({}, '', '/admin');
}

import React from 'react';
import LandingRouter from './components/LandingRouter.tsx';

// Error Boundary for Admin debugging
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-20 text-center bg-white h-screen">
          <h1 className="text-2xl font-bold text-red-600 mb-4">애플리케이션 오류 발생</h1>
          <pre className="text-left bg-gray-100 p-4 rounded overflow-auto max-w-2xl mx-auto text-sm">
            {this.state.error?.stack || String(this.state.error)}
          </pre>
          <button 
            onClick={() => { localStorage.clear(); sessionStorage.clear(); window.location.reload(); }}
            className="mt-8 bg-blue-500 text-white px-6 py-2 rounded-lg"
          >
            전체 초기화 후 재시도
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ConvexProvider client={convex}>
        {isAdmin ? (
          <AdminApp />
        ) : (
          <LandingRouter />
        )}
      </ConvexProvider>
    </ErrorBoundary>
  </StrictMode>,
);
