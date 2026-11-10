'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@career-intelligence/ui';
import { api, DataChatResponse } from '../lib/api';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  thoughts?: string;
  suggestions?: string[];
}

interface DataChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
}

export function DataChatDrawer({ isOpen, onClose, initialPrompt }: DataChatDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      content:
        "Welcome to the **Career Intelligence OS Analytics Engine**. Ask me anything about your target accounts, recruiter deliverability, or hiring trends.",
      suggestions: [
        'How many companies are actively hiring?',
        'What is our recruiter verification rate?',
        'Show in-demand skills and remote jobs',
      ],
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedThoughts, setExpandedThoughts] = useState<Record<number, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastProcessedPrompt = useRef<string | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const toggleThought = (idx: number) => {
    setExpandedThoughts((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    if (!textToSend) setInput('');
    setIsLoading(true);

    const userMsg: ChatMessage = { role: 'user', content: query };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    try {
      const history = updatedMessages.map((m) => ({ role: m.role, content: m.content }));
      const res: DataChatResponse = await api.analytics.chat(query, history.slice(0, -1));

      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          content: res.reply,
          thoughts: res.thoughts,
          suggestions: res.suggestions || [],
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          content:
            "I encountered a temporary issue querying the workspace analytics database. Please verify backend connectivity and retry.",
          suggestions: ['Retry query', 'Summarize company hiring activity'],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && initialPrompt && initialPrompt !== lastProcessedPrompt.current) {
      lastProcessedPrompt.current = initialPrompt;
      handleSend(initialPrompt);
    }
  }, [isOpen, initialPrompt]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fade-in" role="dialog" aria-modal="true" aria-label="AI Data Chat">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-lg bg-slate-950/90 border-l border-white/10 p-6 flex flex-col z-10 shadow-glass-crystal backdrop-blur-2xl animate-in slide-in-from-right duration-220">
        {/* Top Specular Rim */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-[1px] bg-gradient-to-b from-transparent via-white/20 to-transparent"
        />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/20 border border-sky-400/30 text-sky-400 font-bold text-xs">
              ✦
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">AI Data Chat Engine</h3>
              <p className="text-[10px] text-slate-400 font-mono">WORKSPACE AGGREGATE REASONER</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close AI chat"
          >
            &times;
          </button>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl p-4 text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-sky-500/20 border border-sky-400/30 text-sky-100 shadow-glass-sm'
                    : 'bg-slate-900/70 border border-white/[0.08] text-slate-200 shadow-glass-md'
                }`}
              >
                {/* Chain of Thought Collapsible Pill */}
                {m.thoughts && (
                  <div className="mb-2.5 pb-2 border-b border-white/[0.06]">
                    <button
                      type="button"
                      onClick={() => toggleThought(idx)}
                      className="text-[10px] font-mono text-slate-400 hover:text-sky-300 flex items-center gap-1.5 transition-colors"
                    >
                      <span>{expandedThoughts[idx] ? '▼ Hide reasoning' : '▶ View agent chain of thought'}</span>
                    </button>
                    {expandedThoughts[idx] && (
                      <p className="mt-1.5 text-[10px] font-mono text-slate-400 bg-black/30 p-2.5 rounded-lg border border-white/[0.04] whitespace-pre-wrap leading-relaxed">
                        {m.thoughts}
                      </p>
                    )}
                  </div>
                )}

                <div className="whitespace-pre-wrap">{m.content}</div>

                {/* Interactive Suggestion Pills */}
                {m.suggestions && m.suggestions.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex flex-wrap gap-1.5">
                    {m.suggestions.map((s, sIdx) => (
                      <button
                        key={sIdx}
                        type="button"
                        onClick={() => handleSend(s)}
                        className="text-[10px] font-mono bg-white/[0.04] hover:bg-sky-500/20 border border-white/[0.08] hover:border-sky-400/30 text-slate-300 hover:text-white px-2 py-1 rounded-md transition-all text-left"
                      >
                        ↳ {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-slate-400 pl-2">
              <span className="h-2 w-2 rounded-full bg-sky-400 animate-ping" />
              <span className="font-mono text-[11px]">Analyzing workspace metrics & database records...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="pt-3 border-t border-white/[0.08]">
          <div className="relative rounded-2xl bg-slate-900/80 border border-white/10 p-2 focus-within:border-sky-400/50 shadow-glass-sm">
            <textarea
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask questions about company hiring, contacts, deliverability..."
              className="w-full bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none resize-none px-1"
            />
            <div className="flex items-center justify-between pt-1 border-t border-white/[0.04]">
              <span className="text-[10px] text-slate-500 font-mono">Shift+Enter for new line</span>
              <Button
                variant="crystal"
                size="sm"
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="text-[11px] h-7 px-3 border-sky-400/30 bg-sky-500/20 text-sky-200"
              >
                Send ↵
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
