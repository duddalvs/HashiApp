import { normalize } from './format';

export type NamePart = { text: string; highlighted: boolean };

// Returns the original spelling split into matched/unmatched parts, or null when
// any search term is missing after the previous one. Terms cannot overlap.
export function matchNameParts(name: string, query: string): NamePart[] | null {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return [{ text: name, highlighted: false }];

  let searchable = '';
  let offset = 0;
  const positions: { start: number; end: number }[] = [];
  for (const character of name) {
    const folded = character
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('pt-BR');
    const end = offset + character.length;
    if (!folded.length && positions.length) positions[positions.length - 1].end = end;
    for (let i = 0; i < folded.length; i++) positions.push({ start: offset, end });
    searchable += folded;
    offset = end;
  }

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
