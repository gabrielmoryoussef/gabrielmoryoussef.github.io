/**
 * Everything about the person that is not a paper or a news item.
 * Edit here; components read from this file.
 */
export const site = {
  name: 'Gabriel Moryoussef',
  givenName: 'Gabriel',
  familyName: 'Moryoussef',
  /** Matched against author lists to bold the owner's name. */
  authorMatch: /Moryoussef/,
  url: 'https://gabrielmoryoussef.github.io',
  role: 'PhD in Statistics & Data Science, Carnegie Mellon University',
  /** Shown under the role. Drop "Incoming" in January 2027. */
  next: { label: 'Incoming Member of Research Staff, the Voleon Group', url: 'https://voleon.com' },
  statement:
    'I develop statistical methods for high-dimensional data in which the signal is rare and weak, or hidden in latent structure.',
  thesis: 'Statistical Methods for High-Dimensional Data with Rare Signals and Latent Structure',
  description:
    'Gabriel Moryoussef — statistician working on high-dimensional inference with rare signals and latent structure: Higher Criticism, vertex hunting, ranking models, and detecting AI-generated text. PhD, Carnegie Mellon University.',
  /** Split so the address is never present verbatim in the HTML. */
  email: { user: 'gmoryous', domain: 'andrew.cmu.edu' },
  location: 'Berkeley, CA',
  links: {
    cv: '/uploads/resume.pdf',
    scholar: 'https://scholar.google.com/citations?user=kUQryMEAAAAJ&hl=en',
    github: 'https://github.com/gabrielmoryoussef',
    linkedin: 'https://www.linkedin.com/in/gabriel-moryoussef-ab66a714a/',
  },
  googleSiteVerification: 'HUVLvwDJZpYA6XaTQzMlkhcOKh2v7UzJmeXjiLxI6ng',
} as const;

export const people = {
  jin: { name: 'Jiashun Jin', url: 'https://www.stat.cmu.edu/~jiashun/' },
  ke: { name: 'Tracy Ke', url: 'https://zke.fas.harvard.edu/' },
} as const;

export type ThemeKey = 'rare-signals' | 'latent-structure' | 'ranking' | 'llm' | 'topology';

/** Research themes, in display order. `home: false` themes appear only as filters. */
export const themes: {
  key: ThemeKey;
  label: string;
  short: string;
  blurb: string;
  home: boolean;
}[] = [
  {
    key: 'rare-signals',
    label: 'Rare & weak signals',
    short: 'Rare signals',
    blurb:
      'Higher Criticism and its extensions: detecting and exploiting a vanishing fraction of useful features, with sharp phase transitions for what is and is not possible.',
    home: true,
  },
  {
    key: 'latent-structure',
    label: 'Latent structure',
    short: 'Latent structure',
    blurb:
      'Vertex hunting on the simplex and topic models: recovering the extreme points of a noisy simplex, with improved algorithms and error bounds for successive projection.',
    home: true,
  },
  {
    key: 'ranking',
    label: 'Ranking & pairwise comparisons',
    short: 'Ranking',
    blurb:
      'Bradley–Terry–Luce models that are aware of topics, for ranking journals and large language models from pairwise comparisons.',
    home: true,
  },
  {
    key: 'llm',
    label: 'Statistics of LLMs',
    short: 'LLMs & AI text',
    blurb:
      'Statistical approaches to detecting AI-generated and AI-edited text, and principled comparisons between large language models.',
    home: true,
  },
  {
    key: 'topology',
    label: 'Topological data analysis',
    short: 'Topology',
    blurb: 'Persistent homology of knotted proteins.',
    home: false,
  },
];

export const education = [
  {
    degree: 'PhD, Statistics & Data Science',
    school: 'Carnegie Mellon University',
    years: '2022 – 2026',
    note: 'Advised by Jiashun Jin & Tracy Ke. Graduating December 2026.',
  },
  {
    degree: 'MSc, Mathematics, Vision, Learning (MVA)',
    school: 'ENS Paris-Saclay',
    years: '2021 – 2022',
    note: '',
  },
  {
    degree: 'MSc, Mathematical Sciences',
    school: 'University of Oxford',
    years: '2020 – 2021',
    note: 'Thesis: Persistent Homology of Knotted Proteins.',
  },
  {
    degree: 'BSc, Mathematics',
    school: 'Imperial College London',
    years: '2017 – 2020',
    note: 'First Class Honours.',
  },
] as const;
