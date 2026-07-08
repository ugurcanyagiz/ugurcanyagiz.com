import { NAV_ITEMS } from './navigation';

type RawPageMap = Record<string, string>;

export type AtlasTopic = {
  title: string;
  href: string;
  description?: string;
  order?: number;
};

export type AtlasSubtopic = {
  title: string;
  href?: string;
  description?: string;
  order?: number;
  topics: AtlasTopic[];
};

export type AtlasCategory = {
  key: string;
  title: string;
  href?: string;
  index: string;
  kicker?: string;
  className: string;
  order?: number;
  children: AtlasSubtopic[];
};

type CardMeta = AtlasTopic & { category?: string; order: number };

const categoryPages = import.meta.glob<string>("../pages/*.{astro,md,mdx}", { query: "?raw", import: "default", eager: true }) as RawPageMap;
const routedPages = import.meta.glob<string>("../pages/**/*.{astro,md,mdx}", { query: "?raw", import: "default", eager: true }) as RawPageMap;

const CATEGORY_META: Record<string, Pick<AtlasCategory, "title" | "index" | "kicker" | "className" | "order">> = Object.fromEntries(
  NAV_ITEMS.map((item, order) => [
    item.key,
    {
      title: item.label,
      index: item.index,
      kicker: item.subtitle.split('→').slice(0, 2).join('&').replace(/\s+/g, ' ').trim() || item.description,
      className: item.sectionId,
      order: order + 1,
    },
  ]),
);

const EXCLUDED_ROUTE_SEGMENTS = new Set(["admin", "index", "me"]);

function titleCase(value: string) {
  return value.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim().replace(/\b\w/g, (char) => char.toUpperCase());
}

function pagePathToHref(path: string) {
  const route = path.replace(/^\.\.\/pages\//, "").replace(/\.(astro|md|mdx)$/i, "").replace(/\/index$/, "");
  if (!route || route === "index" || route.includes("[")) return null;
  return `/${route}`;
}

function stripQuotes(value: string) {
  return value.replace(/^['\"]|['\"]$/g, "").trim();
}

function readFrontmatter(raw: string) {
  const frontmatter = raw.match(/^---\s*([\s\S]*?)\s*---/);
  if (!frontmatter) return {} as Record<string, string>;
  const data: Record<string, string> = {};
  for (const line of frontmatter[1].split("\n")) {
    const match = line.match(/^\s*([A-Za-z0-9_-]+):\s*(.+?)\s*$/);
    if (match) data[match[1]] = stripQuotes(match[2]);
  }
  return data;
}

function readAstroString(raw: string, name: string) {
  const match = raw.match(new RegExp(`const\\s+${name}\\s*=\\s*(["'\`])([\\s\\S]*?)\\1\\s*;`));
  return match?.[2]?.trim();
}

function readFirstHtml(raw: string, tag: string) {
  const match = raw.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match?.[1]?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function pageTitle(raw: string, href: string) {
  const fm = readFrontmatter(raw);
  return fm.title || readFirstHtml(raw, "h1") || readAstroString(raw, "title")?.split(/[—|]/)[0]?.trim() || titleCase(href.split("/").filter(Boolean).at(-1) || "Topic");
}

function pageDescription(raw: string) {
  const fm = readFrontmatter(raw);
  return fm.description || fm.excerpt || fm.summary || readFirstHtml(raw, "p");
}

function parseCards(raw: string, collectionName: "cards" | "posts") {
  const arrayMatch = raw.match(new RegExp(`const\\s+${collectionName}\\s*=\\s*\\[([\\s\\S]*?)\\];`));
  if (!arrayMatch) return [] as CardMeta[];
  const objectBlocks = arrayMatch[1].match(/\{[\s\S]*?\n\s*\}/g) || [];
  return objectBlocks.map((block, order) => {
    const read = (key: string) => block.match(new RegExp(`${key}:\\s*(["'\`])([\\s\\S]*?)\\1\\s*,?`))?.[2]?.trim();
    return { href: read("href") || "", category: read("category"), title: read("title") || "", description: read("excerpt"), order };
  }).filter((card) => card.href && card.title);
}

const realRoutes = new Map<string, string>();
for (const [path, raw] of Object.entries(routedPages)) {
  const href = pagePathToHref(path);
  if (href) realRoutes.set(href, raw);
}

function getCardsForCategory(key: string) {
  const raw = categoryPages[`../pages/${key}.astro`] || categoryPages[`../pages/${key}.md`] || categoryPages[`../pages/${key}.mdx`];
  if (!raw) return [];
  return [...parseCards(raw, "cards"), ...parseCards(raw, "posts")].filter((card) => realRoutes.has(card.href));
}

function topicsFromRoutes(key: string) {
  return Array.from(realRoutes.entries())
    .filter(([href]) => href.startsWith(`/${key}/`))
    .map(([href, raw], order) => ({ href, title: pageTitle(raw, href), description: pageDescription(raw), order, category: href.split("/").filter(Boolean)[1] }));
}

function uniqueTopics(cards: CardMeta[], fallback: CardMeta[]) {
  const byHref = new Map<string, CardMeta>();
  for (const topic of [...cards, ...fallback]) if (!byHref.has(topic.href)) byHref.set(topic.href, topic);
  return Array.from(byHref.values());
}

function buildCategory(key: string, offset: number): AtlasCategory | null {
  const meta = CATEGORY_META[key] || { title: titleCase(key), index: String(offset + 1).padStart(2, "0"), className: key, order: offset + 1 };
  const topics = uniqueTopics(getCardsForCategory(key), topicsFromRoutes(key));
  if (!topics.length) return null;
  const groups = new Map<string, CardMeta[]>();
  for (const topic of topics) {
    const subtopicTitle = topic.category ? titleCase(topic.category) : "Topics";
    if (!groups.has(subtopicTitle)) groups.set(subtopicTitle, []);
    groups.get(subtopicTitle)?.push(topic);
  }
  return {
    key,
    href: `/${key}`,
    ...meta,
    children: Array.from(groups.entries()).map(([title, groupedTopics], order) => ({
      title,
      order,
      topics: groupedTopics.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map(({ category, ...topic }) => topic),
    })),
  };
}

const discoveredCategories = Array.from(new Set(Array.from(realRoutes.keys()).map((href) => href.split("/").filter(Boolean)[0]).filter((segment) => segment && !EXCLUDED_ROUTE_SEGMENTS.has(segment))));

export const atlasData: AtlasCategory[] = discoveredCategories
  .map((key, index) => buildCategory(key, index))
  .filter((category): category is AtlasCategory => Boolean(category))
  .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
