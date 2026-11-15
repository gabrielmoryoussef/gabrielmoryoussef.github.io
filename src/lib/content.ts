import { getCollection, type CollectionEntry } from 'astro:content';
import { site, themes } from '@/data/site';

export type Pub = CollectionEntry<'publications'>;
export type NewsItem = CollectionEntry<'news'>;

/** All non-draft publications, newest first. */
export async function getPublications(): Promise<Pub[]> {
  const all = await getCollection('publications', ({ data }) => !data.draft);
  return all.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/** All non-draft news items, newest first. */
export async function getNews(): Promise<NewsItem[]> {
  const all = await getCollection('news', ({ data }) => !data.draft);
  return all.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export const STATUS_LABEL: Record<Pub['data']['status'], string> = {
  published: 'Published',
  accepted: 'Accepted',
  'to-appear': 'To appear',
  'under-review': 'Under review',
  preprint: 'Preprint',
};

/** Coarse status used by the filter chips. */
export function statusGroup(s: Pub['data']['status']): 'published' | 'review' {
  return s === 'under-review' || s === 'preprint' ? 'review' : 'published';
}

export function themeLabel(key: string): string {
  return themes.find((t) => t.key === key)?.short ?? key;
}

export function isOwner(author: string): boolean {
  return site.authorMatch.test(author);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function newsLabel(item: NewsItem): string {
  if (item.data.label) return item.data.label;
  const d = item.data.date;
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Minimal inline Markdown: [text](url) links only. Everything else is escaped. */
export function inlineMarkdown(s: string): string {
  return escapeHtml(s).replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (_, text, href) => {
    return `<a class="link" href="${href}" rel="noopener">${text}</a>`;
  });
}
