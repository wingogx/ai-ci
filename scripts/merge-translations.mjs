import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const basePath = join(__dirname, '../src/data/words/china');

// 从所有词库构建中文释义词典
function buildDictionary() {
  const dict = {};
  const sources = ['primary', 'junior', 'senior', 'cet4', 'cet6'];

  for (const source of sources) {
    const data = JSON.parse(readFileSync(join(basePath, `${source}.json`), 'utf-8'));
    for (const word of data.words) {
      const w = word.word.toLowerCase();
      if (word.meaning?.zh && word.meaning.zh.trim() !== '' && !dict[w]) {
        dict[w] = word.meaning.zh;
      }
    }
  }

  console.log(`词典构建完成: ${Object.keys(dict).length} 个单词有中文释义`);
  return dict;
}

// 应用词典到词库
function applyDictionary(filePath, dict) {
  const data = JSON.parse(readFileSync(filePath, 'utf-8'));
  let updated = 0;

  for (const word of data.words) {
    const w = word.word.toLowerCase();
    if ((!word.meaning?.zh || word.meaning.zh.trim() === '') && dict[w]) {
      if (!word.meaning) word.meaning = { zh: '', en: '' };
      word.meaning.zh = dict[w];
      updated++;
    }
  }

  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`${filePath}: 更新了 ${updated} 个单词`);
  return updated;
}

// 主函数
function main() {
  const dict = buildDictionary();

  // 应用到 CET4 和 CET6
  applyDictionary(join(basePath, 'cet4.json'), dict);
  applyDictionary(join(basePath, 'cet6.json'), dict);

  // 统计结果
  console.log('\n=== 最终统计 ===');
  for (const f of ['cet4', 'cet6']) {
    const data = JSON.parse(readFileSync(join(basePath, `${f}.json`), 'utf-8'));
    const withZh = data.words.filter(w => w.meaning?.zh && w.meaning.zh.trim() !== '');
    console.log(`${f}: ${withZh.length}/${data.words.length} 有中文释义`);
  }
}

main();
