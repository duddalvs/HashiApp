import { normalize, normalizePlate } from './format';
import { prepareNameFilter } from './nameSearch';

export type Option = { id: number; label: string; description?: string };
export type SearchMode = 'text' | 'ordered-name';
const cache = {
  text: new WeakMap<Option[], ReturnType<typeof indexOptions>>(),
  'ordered-name': new WeakMap<Option[], ReturnType<typeof indexOptions>>(),
};
function indexOptions(options: Option[], mode: SearchMode) {
  return options.map((option) => ({
    ...option,
    nameIndex: mode === 'ordered-name' ? prepareNameFilter(option.label) : null,
    text: mode === 'text' ? normalize(`${option.label} ${option.description ?? ''}`) : '',
    plate: mode === 'text' ? normalizePlate(option.label) : '',
  }));
}
export function prepareSearchOptions(options: Option[], mode: SearchMode) {
  let indexed = cache[mode].get(options);
  if (!indexed) {
    indexed = indexOptions(options, mode);
    cache[mode].set(options, indexed);
  }
  return indexed;
}
