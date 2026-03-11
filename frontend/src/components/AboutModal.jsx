import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, GitBranch, Share2, Box, Zap, MessageSquare } from 'lucide-react';

export default function AboutModal({ isOpen, onClose }) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Welcome to Atonement",
      description: "Atonement is more than just a chat. It's a spatial conversation engine designed to keep your thoughts organized using 'Branching Context'.",
      icon: <Zap className="text-atonement-cyan" size={32} />,
      benefit: "No more confusing the AI with irrelevant side-tracks."
    },
    {
      title: "How to Branch",
      description: "See something interesting? Just select any text in a message or click 'Branch'. This creates a 'Rough Sheet' on the right.",
      icon: <GitBranch className="text-atonement-accent" size={32} />,
      benefit: "Explore sub-topics in total isolation from the main thread."
    },
    {
      title: "The Benefit of Focus",
      description: "While you're in a branch, the AI only remembers what's relevant to that specific task. The main conversation stays 'Clean'.",
      icon: <Box className="text-atonement-success" size={32} />,
      benefit: "Faster, more accurate answers without 'context pollution'."
    },
    {
      title: "Resolve & Summarize",
      description: "Done exploring? Click 'Resolve'. The AI will condense your long deep-dive into a compact summary for the main thread.",
      icon: <Share2 className="text-atonement-cyan" size={32} />,
      benefit: "Keep the main conversation high-level and readable."
    },
    {
      title: "Reference Vault",
      description: "Every resolved branch is stored in your 'Reference Vault'. You can revisit these deep dives anytime without digging through logs.",
      icon: <MessageSquare className="text-atonement-warning" size={32} />,
      benefit: "Build a persistent knowledge base of your explorations."
    }
  ];

  if (!isOpen) return null;

  const current = steps[step];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-atonement-bg/60 backdrop-blur-md" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg glass-strong rounded-[2rem] shadow-2xl border border-white/40 overflow-hidden flex flex-col items-center p-8 sm:p-10 text-center">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-atonement-card text-atonement-muted transition-all"
        >
          <X size={20} />
        </button>

        <div className="mb-8 w-20 h-20 rounded-3xl bg-atonement-bg shadow-inner flex items-center justify-center animate-pulse-glow">
          {current.icon}
        </div>

        <h2 className="text-2xl font-bold text-atonement-text mb-4 leading-tight">
          {current.title}
        </h2>

        <p className="text-atonement-muted text-base leading-relaxed mb-8 min-h-[80px]">
          {current.description}
        </p>

        <div className="w-full bg-atonement-cyan/5 border border-atonement-cyan/10 rounded-2xl p-4 mb-10">
          <p className="text-xs font-semibold text-atonement-cyan uppercase tracking-widest mb-1">Benefit</p>
          <p className="text-sm text-atonement-text/80">{current.benefit}</p>
        </div>

        {/* Navigation */}
        <div className="w-full flex items-center justify-between">
          <button 
            disabled={step === 0}
            onClick={() => setStep(s => s - 1)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-atonement-muted hover:text-atonement-text transition-colors disabled:opacity-0"
          >
            <ChevronLeft size={18} /> Back
          </button>

          <div className="flex gap-2">
            {steps.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-atonement-cyan' : 'w-1.5 bg-atonement-border/40'}`}
              />
            ))}
          </div>

          {step < steps.length - 1 ? (
            <button 
              onClick={() => setStep(s => s + 1)}
              className="flex items-center gap-2 px-6 py-2 bg-atonement-cyan rounded-full text-sm font-semibold text-white hover:bg-atonement-cyan/80 transition-all hover:translate-x-1"
            >
              Next <ChevronRight size={18} />
            </button>
          ) : (
            <button 
              onClick={onClose}
              className="flex items-center gap-2 px-8 py-2 bg-atonement-success rounded-full text-sm font-semibold text-white hover:bg-atonement-success/80 transition-all hover:scale-105"
            >
              Get Started
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
