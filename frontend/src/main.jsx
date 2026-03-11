import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App';
import './index.css';

const FRONTEND_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Fail-safe: If key is missing or is the placeholder, we'll try to render without Clerk
// to avoid the "blank screen" crash.
const isValidKey = FRONTEND_KEY && FRONTEND_KEY !== 'pk_test_...';

function Root() {
  if (!isValidKey) {
    return (
      <div className="h-screen w-screen bg-[#0f172a] flex flex-col items-center justify-center p-6 text-center text-white">
        <div className="mb-8 relative">
          <div className="w-24 h-24 rounded-3xl bg-white p-1 shadow-2xl flex items-center justify-center">
            <img src="/assets/penguin.png" alt="Atonement" className="w-full h-full rounded-2xl object-cover" />
          </div>
        </div>
        <h1 className="text-3xl font-bold gradient-text mb-4">Atonement Configuration Required</h1>
        <p className="max-w-md text-slate-400 mb-8 leading-relaxed">
          The application is running, but you haven't set up your <strong>Clerk Authentication</strong> keys yet.
        </p>
        <div className="bg-slate-800/50 border border-slate-700/50 p-6 rounded-2xl text-left font-mono text-sm space-y-2 mb-8">
           <p className="text-ston-400"># Please add this to your Environment Variables:</p>
           <p className="text-atonement-cyan">VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key</p>
           <p className="text-ston-400"># and in your Backend Secrets:</p>
           <p className="text-atonement-cyan">CLERK_SECRET_KEY=sk_test_your_key</p>
        </div>
        <a 
          href="https://dashboard.clerk.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="px-6 py-3 bg-atonement-cyan rounded-xl font-bold hover:scale-105 transition-all shadow-lg"
        >
          Get Free Keys from Clerk
        </a>
      </div>
    );
  }

  return (
    <React.StrictMode>
      <ClerkProvider publishableKey={FRONTEND_KEY}>
        <App />
      </ClerkProvider>
    </React.StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Root />);
