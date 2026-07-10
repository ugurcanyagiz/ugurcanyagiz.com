export type NavItem = {
  index: string;
  key: 'science' | 'history' | 'art' | 'future' | 'blog' | 'me';
  label: string;
  href: string;
  sectionId: string;
  subtitle: string;
  description: string;
};

export const NAV_ITEMS: NavItem[] = [
  {
    index: '01',
    key: 'science',
    label: 'Science',
    href: '/science',
    sectionId: 'science',
    subtitle: 'Cosmos → Matter → Life → Mind → Technology.',
    description: 'A layered exploration of reality, curiosity, and careful awe.',
  },
  {
    index: '02',
    key: 'history',
    label: 'History',
    href: '/history',
    sectionId: 'history',
    subtitle: 'Empires → Trade → Ideas → War → Institutions.',
    description: 'A surreal timeline of civilization, power, memory, institutions, and patterns that keep returning.',
  },
  {
    index: '03',
    key: 'art',
    label: 'Art',
    href: '/art',
    sectionId: 'art',
    subtitle: 'Music → Painting → Architecture → Film → Design → Photography.',
    description: 'A digital gallery about perception and craft — music, painting, architecture, film, design, and photography.',
  },
  {
    index: '04',
    key: 'future',
    label: 'Future',
    href: '/future',
    sectionId: 'future',
    subtitle: 'AI → Biotech → Space → Energy → Computing → Society → Robotics.',
    description: 'Signals dashboard for AI, biotech, space, energy, computing, society, and robotics — thoughtful, not hype-driven.',
  },
  {
    index: '05',
    key: 'blog',
    label: 'JLOG',
    href: '/blog',
    sectionId: 'jlog',
    subtitle: 'The Pale Blue Dot · Carl Sagan · Audio recording.',
    description: "Personal notes, life threads, belief, reality, humility, and field observations around the line: I don't want to believe. I want to know.",
  },
];

export const ME_NAV_ITEM: NavItem = {
  index: '00',
  key: 'me',
  label: 'Me',
  href: '/me',
  sectionId: 'me',
  subtitle: 'The Memory of Earth.',
  description: 'A personal, interactive manifesto about science, civilization, time, and the future.',
};

export const NAV_ITEMS_BY_KEY = Object.fromEntries(NAV_ITEMS.map((item) => [item.key, item])) as Partial<Record<NavItem['key'], NavItem>>;
export const NAV_ITEMS_BY_SECTION = Object.fromEntries(NAV_ITEMS.map((item) => [item.sectionId, item])) as Record<string, NavItem>;
