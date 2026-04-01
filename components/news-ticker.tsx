'use client';

import { useState, useEffect, useCallback } from 'react';
import { Newspaper, ExternalLink, RefreshCw, Clock, TrendingUp } from 'lucide-react';

interface NewsItem {
  title: string;
  link: string;
  source: string;
  publishedAt: string;
  relatedTicker?: string;
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'gerade eben';
    if (mins < 60) return `vor ${mins} Min.`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `vor ${hrs} Std.`;
    const days = Math.floor(hrs / 24);
    return `vor ${days} Tag${days > 1 ? 'en' : ''}`;
  } catch {
    return '';
  }
}

export default function NewsTicker({ ticker }: { ticker?: string }) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    try {
      const url = ticker ? `/api/news?ticker=${encodeURIComponent(ticker)}` : '/api/news';
      const res = await fetch(url);
      const data = await res.json();
      setNews(data?.news ?? []);
    } catch {
      setNews([]);
    } finally {
      setLoading(false);
    }
  }, [ticker]);

  useEffect(() => { fetchNews(); }, [fetchNews]);

  const displayNews = expanded ? news : news.slice(0, 6);

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-[#f0b90b]" />
          {ticker ? `News: ${ticker}` : 'Markt-News'}
        </h3>
        <button onClick={fetchNews} className="text-gray-400 hover:text-[#f0b90b] transition-colors p-1" title="Aktualisieren">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && news.length === 0 ? (
        <div className="flex items-center justify-center py-6">
          <RefreshCw className="w-5 h-5 text-[#f0b90b] animate-spin" />
          <span className="text-gray-500 text-sm ml-2">Nachrichten laden...</span>
        </div>
      ) : news.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-4">Keine aktuellen Nachrichten gefunden</p>
      ) : (
        <div className="space-y-0">
          {displayNews.map((item, i) => (
            <a
              key={i}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-start gap-3 py-3 hover:bg-[#1a1f37]/50 px-2 -mx-2 rounded-lg transition-colors group ${
                i < displayNews.length - 1 ? 'border-b border-[#1a1f37]/50' : ''
              }`}
            >
              <div className="mt-1 shrink-0">
                <TrendingUp className="w-3.5 h-3.5 text-[#f0b90b]/50 group-hover:text-[#f0b90b]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-200 group-hover:text-white leading-snug line-clamp-2">
                  {item.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-[#f0b90b]/60 font-medium">{item.source}</span>
                  {item.publishedAt && (
                    <span className="text-[10px] text-gray-600 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {timeAgo(item.publishedAt)}
                    </span>
                  )}
                  {item.relatedTicker && (
                    <span className="text-[10px] text-gray-600 bg-[#1a1f37] px-1.5 py-0.5 rounded font-mono">{item.relatedTicker}</span>
                  )}
                </div>
              </div>
              <ExternalLink className="w-3 h-3 text-gray-600 group-hover:text-gray-400 mt-1 shrink-0" />
            </a>
          ))}
        </div>
      )}

      {news.length > 6 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-center text-xs text-gray-500 hover:text-[#f0b90b] mt-3 py-2 transition-colors"
        >
          {expanded ? 'Weniger anzeigen' : `Alle ${news.length} Nachrichten anzeigen`}
        </button>
      )}
    </div>
  );
}
