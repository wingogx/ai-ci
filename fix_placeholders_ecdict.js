#!/usr/bin/env node
/**
 * 使用 ECDICT 修复占位符问题
 * 专门针对 "某物"、"某种的"、"...的" 等占位符
 */

const fs = require('fs');
const readline = require('readline');

const ECDICT_PATH = '/Users/win/Downloads/skywind3000-ECDICT-64b6edb/ecdict.csv';

const WORD_FILES = [
  'src/data/words/cefr/a1.json',
  'src/data/words/cefr/a2.json',
  'src/data/words/cefr/b1.json',
  'src/data/words/cefr/b2.json',
  'src/data/words/cefr/c1.json',
  'src/data/words/cefr/c2.json',
  'src/data/words/china/primary.json',
  'src/data/words/china/junior.json',
  'src/data/words/china/senior.json',
  'src/data/words/china/cet4.json',
  'src/data/words/china/cet6.json',
];

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

async function loadECDICT() {
  console.log('📚 加载 ECDICT 词典...');

  const dict = new Map();
  const fileStream = fs.createReadStream(ECDICT_PATH);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let lineNum = 0;
  for await (const line of rl) {
    lineNum++;
    if (lineNum === 1) continue;

    const parts = parseCSVLine(line);
    if (parts.length < 4) continue;

    const [word, phonetic, definition, translation] = parts;

    if (word && translation) {
      const cleanTranslation = translation
        .replace(/\\n/g, '; ')
        .replace(/\n/g, '; ')
        .replace(/;+/g, '; ')
        .replace(/; $/, '')
        .trim();

      const cleanDefinition = definition
        .replace(/\\n/g, '; ')
        .replace(/\n/g, '; ')
        .replace(/;+/g, '; ')
        .replace(/; $/, '')
        .trim();

      dict.set(word.toLowerCase(), {
        word,
        phonetic,
        zh: cleanTranslation,
        en: cleanDefinition,
      });
    }

    if (lineNum % 100000 === 0) {
      console.log(`  已加载 ${lineNum} 行...`);
    }
  }

  console.log(`✓ 加载完成! 共 ${dict.size} 个词条\n`);
  return dict;
}

function hasPlaceholder(meaning) {
  const zh = meaning?.zh || '';

  // 检测各种占位符
  return zh.includes('某物') ||
         zh.includes('某种的') ||
         zh.includes('某事') ||
         zh.includes('...的') ||
         zh.includes('...-') ||
         zh.includes('；某');
}

async function main() {
  const ecdict = await loadECDICT();

  console.log('🔍 扫描并修复占位符问题...\n');

  let stats = {
    total: 0,
    hasPlaceholder: 0,
    foundInDict: 0,
    fixed: 0,
    notFound: 0,
  };

  for (const file of WORD_FILES) {
    if (!fs.existsSync(file)) continue;

    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    let fixedInFile = 0;

    data.words = data.words.map(word => {
      stats.total++;

      if (!hasPlaceholder(word.meaning)) {
        return word;
      }

      stats.hasPlaceholder++;

      const wordLower = word.word.toLowerCase();
      const ecdictEntry = ecdict.get(wordLower);

      if (!ecdictEntry) {
        stats.notFound++;
        return word;
      }

      stats.foundInDict++;

      const newZh = ecdictEntry.zh;
      const newEn = ecdictEntry.en || word.meaning?.en || '';

      // 确保新释义不是占位符且比旧释义好
      // 对于简单名词，即使新释义较短（如"n. 钢琴"），也比占位符好
      if (newZh && newZh.length >= 3 && !hasPlaceholder({ zh: newZh })) {
        stats.fixed++;
        fixedInFile++;

        return {
          ...word,
          meaning: {
            zh: newZh,
            en: newEn,
          }
        };
      }

      return word;
    });

    if (fixedInFile > 0) {
      fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
      console.log(`✓ ${file.split('/').pop()}: 修复了 ${fixedInFile} 个占位符`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('占位符修复报告:');
  console.log(`  总词数: ${stats.total}`);
  console.log(`  有占位符: ${stats.hasPlaceholder}`);
  console.log(`  词典中找到: ${stats.foundInDict}`);
  console.log(`  成功修复: ${stats.fixed}`);
  console.log(`  未找到: ${stats.notFound}`);
  console.log('='.repeat(60));
}

main().catch(console.error);
