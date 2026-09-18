import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchNameParts } from '../src/lib/nameSearch';

const name = 'Carlos Eduardo Alves Germano';

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
