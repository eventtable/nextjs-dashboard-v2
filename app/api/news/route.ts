import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const RSS_FEEDS = [
  'https://feeds.finance.yahoo.com/rss/2.0/headline?s=%5EDJI&region=US&lang=en-US',
  'https://feeds.finance.yahoo.com/rss/2.0/headline?s=%5EGSPC&region=US&lang=en-US',
  'https://www.finanznachrichten.de/rss/nachrichten',
];

const ABACUS_API_KEY = process.env.ABACUSAI_API_KEY;

interface NewsItem {
  title: string;
  titleDe: string;
  link: string;
  pubDate: string;
  source: string;
  summary?: string;
}

// Simple XML parser for RSS
function parseRSS(xml: string, source: string): NewsItem[] {
  const items: NewsItem[] = [];
  const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);

  for (const match of itemMatches) {
    const item = match[1];
    const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ||
      item.match(/<title>(.*?)<\/title>/)?.[1] || '';
    const link = item.match(/<link>(.*?)<\/link>/)?.[1] ||
      item.match(/<guid[^>]*>(.*?)<\/guid>/)?.[1] || '';
    const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || new Date().toUTCString();

    if (title && link) {
      items.push({ title, titleDe: title, link, pubDate, source });
    }
  }

  return items.slice(0, 5);
}

// Translate titles to German using AbacusAI (gpt-4.1-mini)
async function translateToGerman(titles: string[]): Promise<string[]> {
  if (!ABACUS_API_KEY || titles.length === 0) return titles;

  try {
    const prompt = `Translate these financial news headlines to German. Return ONLY a JSON array of translated strings, same order:\n${JSON.stringify(titles)}`;

    const res = await fetch('https://api.abacus.ai/api/v0/getLlmResponse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apiKey': ABACUS_API_KEY,
      },
      body: JSON.stringify({
        deploymentToken: ABACUS_API_KEY,
        prompt,
        llmName: 'GPT_4O_MINI',
      }),
    });

    if (!res.ok) return titles;

    const data = await res.json();
    const content = data?.response || data?.choices?.[0]?.message?.content || '';
    const match = content.match(/\[[\s\S]*\]/);
    if (match) {
      return JSON.parse(match[0]);
    }
    return titles;
  } catch {
    return titles;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol') || '';

  try {
    const allNews: NewsItem[] = [];

    // Fetch RSS feeds
    await Promise.allSettled(
      RSS_FEEDS.map(async (feedUrl) => {
        try {
          const res = await fetch(feedUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            next: { revalidate: 300 }, // 5 min cache
          });
          if (!res.ok) return;
          const xml = await res.text();
          const source = new URL(feedUrl).hostname.replace('www.', '').replace('feeds.', '');
          allNews.push(...parseRSS(xml, source));
        } catch {
          // Skip failed feeds
        }
      })
    );

    // If symbol provided, also try Yahoo Finance news for that symbol
    if (symbol) {
      try {
        const yahooFeed = `https://feeds.finance.yahoo.com/rss/2.0/headline?s=${encodeURIComponent(symbol)}&region=DE&lang=de-DE`;
        const res = await fetch(yahooFeed, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (res.ok) {
          const xml = await res.text();
          allNews.unshift(...parseRSS(xml, 'yahoo-finance'));
        }
      } catch {
        // Skip
      }
    }

    // Deduplicate
    const seen = new Set<string>();
    const unique = allNews.filter(n => {
      if (seen.has(n.link)) return false;
      seen.add(n.link);
      return true;
    });

    // Translate English titles to German
    const englishItems = unique.filter(n => !n.source.includes('finanznachrichten'));
    const germanItems = unique.filter(n => n.source.includes('finanznachrichten'));

    if (englishItems.length > 0 && ABACUS_API_KEY) {
      const translated = await translateToGerman(englishItems.map(n => n.title));
      englishItems.forEach((item, i) => {
        item.titleDe = translated[i] || item.title;
      });
    }

    const result = [...englishItems, ...germanItems]
      .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
      .slice(0, 20);

    return NextResponse.json({ news: result });
  } catch (error) {
    console.error('News API error:', error);
    return NextResponse.json({ news: [] }, { status: 500 });
  }
}
