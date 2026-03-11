import React, { useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';

export default function Toast({ message, visible, onClose }) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] animate-fadeIn">
      <div className="glass-strong border border-atonement-success/30 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-atonement-success/20 flex items-center justify-center">
          <CheckCircle size={18} className="text-atonement-success" />
        </div>
        <p className="text-sm font-semibold text-atonement-text">{message}</p>
        <button 
          onClick={onClose}
          className="ml-4 p-1 rounded-lg hover:bg-atonement-card text-atonement-muted transition-all"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
