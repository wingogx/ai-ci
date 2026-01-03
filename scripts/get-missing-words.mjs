import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const cet4 = JSON.parse(readFileSync(join(__dirname, '../src/data/words/china/cet4.json'), 'utf-8'));
const cet6 = JSON.parse(readFileSync(join(__dirname, '../src/data/words/china/cet6.json'), 'utf-8'));

const missing4 = cet4.words.filter(w =>
  w.word.length >= 3 &&
  (!w.meaning?.zh || w.meaning.zh.trim() === '')
).map(w => w.word);

const missing6 = cet6.words.filter(w =>
  w.word.length >= 3 &&
  (!w.meaning?.zh || w.meaning.zh.trim() === '')
).map(w => w.word);

const allMissing = [...new Set([...missing4, ...missing6])].sort();

// 输出为 JSON 格式
console.log(JSON.stringify(allMissing, null, 2));
