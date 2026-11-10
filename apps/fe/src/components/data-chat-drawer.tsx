'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button, Badge } from '@career-intelligence/ui';
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
}

export function DataChatDrawer({ isOpen, onClose }: DataChatDrawerProps) {
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Surface */}
      <div className="relative w-full sm:w-[500px] h-full bg-slate-950/95 border-l border-white/[0.08] shadow-glass-xl flex flex-col z-10">
        {/* Header */}
        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between bg-slate-900/40">
          <div className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8] animate-pulse" />
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                Gemini Data Analytics
                <Badge variant="purple" className="text-[10px] py-0 px-1.5">
                  Natural Language Engine
                </Badge>
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Real-time multi-tenant workspace intelligence
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            aria-label="Close analytics chat"
          >
            &times;
          </button>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col space-y-2 ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[90%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-sky-500/20 text-white border border-sky-500/30 shadow-sm'
                    : 'bg-slate-900/80 text-slate-200 border border-white/[0.08] shadow-glass-sm'
                }`}
              >
                {/* Collapsible Thoughts Accordion */}
                {msg.thoughts && (
                  <div className="mb-2 pb-2 border-b border-white/[0.08]">
                    <button
                      onClick={() => toggleThought(idx)}
                      className="flex items-center gap-1.5 text-[10px] font-mono text-sky-400 hover:text-sky-300 transition-colors"
                    >
                      <span>{expandedThoughts[idx] ? '▾' : '▸'}</span>
                      <span>Reasoning Context & Pipeline</span>
                    </button>
                    {expandedThoughts[idx] && (
                      <div className="mt-1.5 p-2 rounded-lg bg-black/40 text-[11px] text-slate-400 font-mono">
                        {msg.thoughts}
                      </div>
                    )}
                  </div>
                )}

                {/* Formatted Message Content */}
                <div className="whitespace-pre-line prose-invert text-xs">
                  {msg.content}
                </div>
              </div>

              {/* Dynamic Suggestion Chips */}
              {msg.suggestions && msg.suggestions.length > 0 && idx === messages.length - 1 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {msg.suggestions.map((sug, sIdx) => (
                    <button
                      key={sIdx}
                      onClick={() => handleSend(sug)}
                      disabled={isLoading}
                      className="px-2.5 py-1 rounded-full text-[11px] bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 text-sky-300 transition-all duration-160 cursor-pointer disabled:opacity-50"
                    >
                      {sug} &rarr;
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-900/50 border border-white/[0.06] text-xs text-sky-300">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
              <span>Analyzing workspace dataset across MongoDB pipelines...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Query Input Box */}
        <div className="p-3 border-t border-white/[0.08] bg-slate-900/50 space-y-2">
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about companies, recruiters, or hiring signals..."
              rows={2}
              className="w-full resize-none rounded-xl bg-slate-950/80 border border-white/[0.12] p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/40"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-mono">
              Press Enter to send &bull; Shift+Enter for new line
            </span>
            <Button
              variant="crystal"
              size="sm"
              disabled={!input.trim() || isLoading}
              onClick={() => handleSend()}
            >
              Send Query &rarr;
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
