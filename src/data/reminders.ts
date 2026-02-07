import { v4 as uuidv4 } from 'uuid';
import quotesCSV from './quotes.csv?raw';

export interface Reminder {
  id: string;
  quote: string;
  category: string;
}

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function parseCSV(): { quote: string; category: string }[] {
  const lines = quotesCSV.split('\n');
  const results: { quote: string; category: string }[] = [];

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Split on last comma to separate quote from category
    const lastComma = line.lastIndexOf(',');
    if (lastComma === -1) continue;

    const rawQuote = line.substring(0, lastComma);
    const rawCategory = line.substring(lastComma + 1);

    // Clean quote: trim whitespace and surrounding double quotes, unescape ""
    let quote = rawQuote.trim();
    if (quote.startsWith('"') && quote.endsWith('"')) {
      quote = quote.slice(1, -1);
    }
    quote = quote.replace(/""/g, '"').trim();

    // Skip empty quotes and metadata lines
    if (!quote || /^\(\d+ rows\)$/.test(quote)) continue;

    const category = rawCategory.trim();

    results.push({
      quote,
      category: category ? toTitleCase(category) : 'General',
    });
  }

  return results;
}

let parsedQuotes: { quote: string; category: string }[] | null = null;

function getParsedQuotes() {
  if (!parsedQuotes) {
    parsedQuotes = parseCSV();
  }
  return parsedQuotes;
}

export const getDefaultReminders = (): Reminder[] => {
  return getParsedQuotes().map(({ quote, category }) => ({
    id: uuidv4(),
    quote,
    category,
  }));
};

export const getDefaultCategories = (): string[] => {
  const categories = new Set(getParsedQuotes().map((q) => q.category));
  return Array.from(categories);
};
