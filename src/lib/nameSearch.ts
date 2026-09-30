import { normalize } from './format';

export type NamePart = { text: string; highlighted: boolean };
export type NameSearchIndex = {
  name: string;
  searchable: string;
  positions: { start: number; end: number }[];
};

// A small search key, without the per-character map needed only for highlighting.
export function prepareNameFilter(name: string): Pick<NameSearchIndex, 'searchable'> {
  const unaccented = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return { searchable: Array.from(unaccented, (character) => character.toLowerCase()).join('') };
}

// Build once per name/catalog, not once per name on every keystroke.
export function prepareNameSearch(name: string): NameSearchIndex {
  let searchable = '';
  let offset = 0;
  const positions: { start: number; end: number }[] = [];
  for (const character of name) {
    const folded = character
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
    const end = offset + character.length;
    if (!folded.length && positions.length) positions[positions.length - 1].end = end;
    for (let i = 0; i < folded.length; i++) positions.push({ start: offset, end });
    searchable += folded;
    offset = end;
  }
  return { name, searchable, positions };
}

export const nameSearchTerms = (query: string): string[] =>
  normalize(query).split(/\s+/).filter(Boolean);

// Filtering only needs a boolean. Avoid allocating highlights for off-screen rows.
export function matchesIndexedName(
  index: Pick<NameSearchIndex, 'searchable'>,
  terms: readonly string[],
): boolean {
  let cursor = 0;
  for (const term of terms) {
    const start = index.searchable.indexOf(term, cursor);
    if (start === -1) return false;
    cursor = start + term.length;
  }
  return true;
}

export function matchIndexedNameParts(
  { name, searchable, positions }: NameSearchIndex,
  terms: readonly string[],
): NamePart[] | null {
  if (!terms.length) return [{ text: name, highlighted: false }];

  const ranges: { start: number; end: number }[] = [];
  let cursor = 0;
  for (const term of terms) {
    const start = searchable.indexOf(term, cursor);
    if (start === -1) return null;
    cursor = start + term.length;
    ranges.push({ start: positions[start].start, end: positions[cursor - 1].end });
  }

  const parts: NamePart[] = [];
  cursor = 0;
  for (const range of ranges) {
    if (range.start > cursor)
      parts.push({ text: name.slice(cursor, range.start), highlighted: false });
    parts.push({ text: name.slice(range.start, range.end), highlighted: true });
    cursor = range.end;
  }
  if (cursor < name.length) parts.push({ text: name.slice(cursor), highlighted: false });
  return parts;
}

// Convenience API for one-off searches; lists reuse prepareNameSearch instead.
export function matchNameParts(name: string, query: string): NamePart[] | null {
  const terms = nameSearchTerms(query);
  if (!terms.length) return [{ text: name, highlighted: false }];
  return matchIndexedNameParts(prepareNameSearch(name), terms);
}
