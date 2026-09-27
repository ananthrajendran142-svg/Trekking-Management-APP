import React, { useState } from 'react';
import api from '../../api';
import { Bot, Send, User, Sparkles, BookOpen, ShieldCheck } from 'lucide-react';

function FormattedMessage({ text, isUser }) {
  if (isUser) {
    return <span>{text}</span>;
  }
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];

  const renderInline = (str) => {
    if (!str) return null;
    const parts = str.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-navy-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  const getIconForLabel = (label) => {
    const l = label.toLowerCase();
    if (l.includes('location')) return '📍';
    if (l.includes('difficulty')) return '⛰️';
    if (l.includes('duration') || l.includes('distance')) return '⏱️';
    if (l.includes('price')) return '💵';
    if (l.includes('slots') || l.includes('availability')) return '👥';
    if (l.includes('meeting')) return '🚩';
    if (l.includes('guide')) return '👤';
    return '•';
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) {
      elements.push(<div key={`blank-${index}`} className="h-1.5" />);
      return;
    }

    if (trimmed === '---') {
      elements.push(<hr key={`hr-${index}`} className="my-3 border-slate-200" />);
      return;
    }

    if (trimmed.startsWith('### ')) {
      elements.push(
        <h3 key={`h3-${index}`} className="text-xs font-extrabold text-navy-900 bg-slate-100 border-l-4 border-trek-gold px-3 py-2 rounded-r-lg my-2 flex items-center gap-2 shadow-xs">
          {renderInline(trimmed.replace('### ', ''))}
        </h3>
      );
      return;
    }

    if (trimmed.startsWith('#### ')) {
      elements.push(
        <h4 key={`h4-${index}`} className="text-xs font-extrabold text-trek-blue bg-blue-50/60 border border-blue-100 px-3 py-1.5 rounded-lg mt-3 mb-1.5 flex items-center gap-2">
          {renderInline(trimmed.replace('#### ', ''))}
        </h4>
      );
      return;
    }

    if (trimmed.startsWith('👉') || trimmed.startsWith('💡') || trimmed.startsWith('⚠️')) {
      elements.push(
        <div key={`callout-${index}`} className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3 my-2 text-xs font-medium flex items-start gap-2 shadow-xs">
          <span className="shrink-0">{renderInline(trimmed)}</span>
        </div>
      );
      return;
    }

    if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
      const content = trimmed.substring(1).trim();
      const match = content.match(/^\*\*(.*?)\*\*:(.*)/);
      if (match) {
        const label = match[1].trim();
        const value = match[2].trim();
        const icon = getIconForLabel(label);

        elements.push(
          <div key={`item-${index}`} className="flex items-center gap-2 py-1 px-2.5 rounded-md hover:bg-slate-50 transition text-xs">
            <span className="text-sm shrink-0">{icon}</span>
            <span className="font-semibold text-slate-700 w-28 shrink-0">{label}:</span>
            <span className="text-navy-900 font-medium flex-1">{renderInline(value)}</span>
          </div>
        );
        return;
      }

      elements.push(
        <div key={`bullet-${index}`} className="flex items-start gap-2 py-0.5 px-2 text-xs text-slate-800">
          <span className="text-trek-gold text-sm shrink-0">•</span>
          <span>{renderInline(content)}</span>
        </div>
      );
      return;
    }

    elements.push(
      <p key={`p-${index}`} className="text-xs text-slate-800 leading-relaxed my-0.5">
        {renderInline(trimmed)}
      </p>
    );
  });

  return <div className="space-y-0.5">{elements}</div>;
}

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "Hello! I am TrekMate AI, your RAG-powered trekking & high-altitude safety assistant. Ask me anything about equipment checklists, altitude safety, weather precautions, or specific trek routes!",
      sources: []
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendQuery = async (e) => {
    e.preventDefault();
    if (!inputQuery.trim() || loading) return;

    const userQ = inputQuery.trim();
    setInputQuery('');

    setMessages(prev => [...prev, { sender: 'user', text: userQ }]);
    setLoading(true);

    try {
      const resp = await api.post('/ai/query', { query: userQ });
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: resp.data.answer,
          sources: resp.data.sources || [],
          confidence: resp.data.confidence
        }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: "I'm having trouble retrieving knowledge base records right now. Please try again shortly.",
          sources: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      
      {/* HEADER */}
      <div className="bg-navy-900 text-white rounded-3xl p-6 border border-navy-800 flex items-center justify-between">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-navy-800 text-trek-gold font-semibold text-xs rounded-full border border-navy-700">
            <Sparkles className="w-3.5 h-3.5" /> RAG Knowledge Retrieval
          </div>
          <h1 className="text-2xl font-extrabold">TrekMate AI Assistant</h1>
          <p className="text-xs text-slate-300">Natural language assistant powered by database document embeddings.</p>
        </div>
      </div>

      {/* CHAT WINDOW */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col h-[540px]">
        
        {/* Messages Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-50/50">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              
              {m.sender === 'ai' && (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-trek-blue to-trek-gold text-white font-bold flex items-center justify-center shrink-0 shadow">
                  <Bot className="w-5 h-5" />
                </div>
              )}

              <div className={`max-w-2xl space-y-2 ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`p-4 rounded-2xl text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-navy-900 text-white rounded-tr-none font-medium shadow'
                      : 'bg-white text-navy-900 border border-slate-200 rounded-tl-none shadow-sm'
                  }`}
                >
                  <FormattedMessage text={m.text} isUser={m.sender === 'user'} />
                </div>

                {/* Sources list if returned by RAG */}
                {m.sources && m.sources.length > 0 && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-slate-700 space-y-1.5">
                    <div className="font-bold text-amber-900 flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-amber-600" /> Retained Knowledge Sources:
                    </div>
                    {m.sources.map((src, sIdx) => (
                      <div key={sIdx} className="pl-2 border-l-2 border-amber-400">
                        <strong className="text-navy-900">{src.title}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {m.sender === 'user' && (
                <div className="w-9 h-9 rounded-xl bg-navy-800 text-trek-gold font-bold flex items-center justify-center shrink-0">
                  <User className="w-5 h-5" />
                </div>
              )}

            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-center text-xs text-slate-400 italic">
              <div className="w-8 h-8 rounded-xl bg-trek-blue/20 text-trek-blue font-bold flex items-center justify-center animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <span>Searching knowledge vector index...</span>
            </div>
          )}
        </div>

        {/* Query Input Bar */}
        <form onSubmit={handleSendQuery} className="p-4 bg-white border-t border-slate-200 flex gap-3">
          <input
            type="text"
            placeholder="Ask anything about gear, altitude safety, rules or route..."
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-navy-900 focus:outline-none focus:border-trek-blue"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-trek-gold hover:bg-trek-goldHover text-navy-900 font-extrabold rounded-xl text-xs shadow transition flex items-center gap-2"
          >
            <span>Ask AI</span>
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>

    </div>
  );
}
