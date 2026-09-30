import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  matchNameParts,
  matchIndexedNameParts,
  matchesIndexedName,
  nameSearchTerms,
  prepareNameSearch,
  prepareNameFilter,
} from '../src/lib/nameSearch';
import { prepareSearchOptions } from '../src/lib/searchOptions';

const name = 'Carlos Eduardo Alves Germano';

test('indice leve preserva busca e cache acompanha troca de catalogo sem mapa de destaque', () => {
  for (const label of [
    'José João',
    '  ÁLVARO  ',
    'José'.normalize('NFD'),
    'ΟΣ ΣΙΓΜΑ',
    'İara',
    'Ana 👩🏽',
  ]) {
    const lightweight = prepareNameFilter(label);
    assert.equal(lightweight.searchable, prepareNameSearch(label).searchable);
    for (const query of ['jose', 'alvaro', 'οσ', 'iara', 'ana', 'inexistente'])
      assert.equal(
        matchesIndexedName(lightweight, nameSearchTerms(query)),
        matchNameParts(label, query) !== null,
      );
  }
  const options = [{ id: 1, label: 'José João' }];
  const first = prepareSearchOptions(options, 'ordered-name');
  assert.equal(prepareSearchOptions(options, 'ordered-name'), first);
  assert.equal('positions' in first[0].nameIndex!, false);
  const updated = prepareSearchOptions([{ id: 1, label: 'Maria' }], 'ordered-name');
  assert.equal(matchesIndexedName(updated[0].nameIndex!, ['maria']), true);
  assert.equal(matchesIndexedName(updated[0].nameIndex!, ['jose']), false);
});

test('indice reutilizavel preserva acentos, ordem e resultados entre consultas sucessivas', () => {
  const original = 'José João Gonçalves'.normalize('NFD');
  const index = prepareNameSearch(original);
  const snapshot = JSON.stringify(index);
  for (const [query, accepted, highlighted] of [
    ['JOSE goncalves', true, ['José', 'Gonçalves']],
    ['goncalves jose', false, []],
    ['  joao  ', true, ['João']],
    ['', true, []],
    ['jose jose', false, []],
  ] as const) {
    const terms = nameSearchTerms(query);
    assert.equal(matchesIndexedName(index, terms), accepted);
    const parts = matchIndexedNameParts(index, terms);
    if (!accepted) assert.equal(parts, null);
    else {
      assert.equal(parts!.map((part) => part.text).join(''), original);
      assert.deepEqual(
        parts!.filter((part) => part.highlighted).map((part) => part.text.normalize('NFC')),
        highlighted,
      );
    }
    assert.equal(JSON.stringify(index), snapshot);
  }
});

test('busca nomes por trechos em ordem, permitindo pular palavras', () => {
  for (const query of [
    'Carlos',
    'Eduardo',
    'Eduardo Alves',
    'Alves',
    'Germano',
    'Carlos Alves',
    'Edu Ger',
    '  CARLOS   alves  ',
  ]) {
    const parts = matchNameParts(name, query);
    assert.ok(parts, query);
    assert.equal(parts.map((part) => part.text).join(''), name);
  }
  for (const query of [
    'Alves Carlos',
    'Germano Eduardo',
    'Carlos Carlos',
    'Carlos Souza',
    'Carlos .',
  ])
    assert.equal(matchNameParts(name, query), null, query);
});

test('destaque cobre somente os trechos encontrados e preserva o nome completo', () => {
  assert.deepEqual(matchNameParts(name, 'Carlos Alves'), [
    { text: 'Carlos', highlighted: true },
    { text: ' Eduardo ', highlighted: false },
    { text: 'Alves', highlighted: true },
    { text: ' Germano', highlighted: false },
  ]);
  assert.deepEqual(matchNameParts(name, 'edu'), [
    { text: 'Carlos ', highlighted: false },
    { text: 'Edu', highlighted: true },
    { text: 'ardo Alves Germano', highlighted: false },
  ]);
  for (const query of ['', '   ', '\t\n'])
    assert.deepEqual(matchNameParts(name, query), [{ text: name, highlighted: false }]);
});

test('busca ignora acentos e caixa sem deslocar o destaque na grafia original', () => {
  for (const original of [
    '  José  João Gonçalves  ',
    '  José  João Gonçalves  '.normalize('NFD'),
  ]) {
    const parts = matchNameParts(original, 'JOSE goncalves')!;
    assert.ok(parts);
    assert.equal(parts.map((part) => part.text).join(''), original);
    assert.deepEqual(
      parts.filter((part) => part.highlighted).map((part) => part.text.normalize('NFC')),
      ['José', 'Gonçalves'],
    );
  }
  assert.equal(matchNameParts('José João Gonçalves', 'goncalves jose'), null);
});

test('termos repetidos exigem ocorrencias distintas e pontuacao e literal', () => {
  const parts = matchNameParts('Ana Mariana Ana', 'ana ana')!;
  assert.ok(parts);
  assert.equal(parts.map((part) => part.text).join(''), 'Ana Mariana Ana');
  assert.equal(matchNameParts('Carlos Eduardo', '.*'), null);
  assert.equal(matchNameParts('Carlos Eduardo', '['), null);
});
