#!/usr/bin/env node
/**
 * 对比我们词库中少于10字的词条与 ECDICT 中的释义长度
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
  console.log('📚 加载 ECDICT 词典...\n');

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

      dict.set(word.toLowerCase(), {
        word,
        phonetic,
        zh: cleanTranslation,
      });
    }

    if (lineNum % 100000 === 0) {
      process.stdout.write(`  已加载 ${lineNum} 行...\r`);
    }
  }

  console.log(`✓ 加载完成! 共 ${dict.size} 个词条\n`);
  return dict;
}

async function compare() {
  const ecdict = await loadECDICT();

  // 收集少于10字的词条
  const shortWords = [];

  WORD_FILES.forEach(file => {
    if (!fs.existsSync(file)) return;

    const data = JSON.parse(fs.readFileSync(file, 'utf8'));

    data.words.forEach(word => {
      const zh = word.meaning?.zh || '';
      if (zh.length < 10 && zh.length > 0) {
        // 取第一个词（处理 word1/word2 的情况）
        const wordKey = word.word.split('/')[0].toLowerCase();
        shortWords.push({
          word: word.word,
          wordKey: wordKey,
          pos: word.pos,
          ourZh: zh,
          ourLength: zh.length,
          file: file.split('/').pop()
        });
      }
    });
  });

  console.log(`找到 ${shortWords.length} 个少于10字的词条\n`);

  // 在 ECDICT 中查找这些词
  const stats = {
    total: shortWords.length,
    foundInDict: 0,
    ecdictShorter: 0,
    ecdictSimilar: 0,
    ecdictLonger: 0,
    notFound: 0,
  };

  const examples = {
    ecdictShorter: [],
    ecdictLonger: [],
  };

  shortWords.forEach(item => {
    const ecdictEntry = ecdict.get(item.wordKey);

    if (!ecdictEntry) {
      stats.notFound++;
      return;
    }

    stats.foundInDict++;
    const ecdictLength = ecdictEntry.zh.length;

    if (ecdictLength < item.ourLength) {
      stats.ecdictShorter++;
    } else if (ecdictLength > item.ourLength * 1.5) {
      // ECDICT 明显更长（1.5倍以上）
      stats.ecdictLonger++;
      if (examples.ecdictLonger.length < 20) {
        examples.ecdictLonger.push({
          ...item,
          ecdictZh: ecdictEntry.zh,
          ecdictLength: ecdictLength
        });
      }
    } else {
      stats.ecdictSimilar++;
    }
  });

  // 打印报告
  console.log('='.repeat(70));
  console.log('与 ECDICT 对比分析');
  console.log('='.repeat(70));
  console.log();
  console.log(`我们的少于10字词条: ${stats.total}`);
  console.log(`在 ECDICT 中找到: ${stats.foundInDict} (${(stats.foundInDict / stats.total * 100).toFixed(1)}%)`);
  console.log(`未在 ECDICT 中找到: ${stats.notFound} (${(stats.notFound / stats.total * 100).toFixed(1)}%)`);
  console.log();

  console.log('对比结果:');
  console.log(`  ECDICT 更短: ${stats.ecdictShorter} (${(stats.ecdictShorter / stats.foundInDict * 100).toFixed(1)}%)`);
  console.log(`  ECDICT 相近: ${stats.ecdictSimilar} (${(stats.ecdictSimilar / stats.foundInDict * 100).toFixed(1)}%)`);
  console.log(`  ECDICT 更长: ${stats.ecdictLonger} (${(stats.ecdictLonger / stats.foundInDict * 100).toFixed(1)}%)`);
  console.log();

  console.log('结论:');
  const reasonable = stats.ecdictShorter + stats.ecdictSimilar;
  console.log(`  合理的短释义: ${reasonable} (${(reasonable / stats.foundInDict * 100).toFixed(1)}%)`);
  console.log(`  可以改善的: ${stats.ecdictLonger} (${(stats.ecdictLonger / stats.foundInDict * 100).toFixed(1)}%)`);

  // 打印可以改善的示例
  if (examples.ecdictLonger.length > 0) {
    console.log('\n' + '='.repeat(70));
    console.log('可以改善的词条示例 (ECDICT 有更详细释义):');
    console.log('='.repeat(70));

    examples.ecdictLonger.forEach((item, idx) => {
      console.log(`\n${idx + 1}. ${item.word} (${item.pos}) [${item.file}]`);
      console.log(`   我们: (${item.ourLength}字) "${item.ourZh}"`);
      console.log(`   ECDICT: (${item.ecdictLength}字) "${item.ecdictZh.substring(0, 100)}${item.ecdictZh.length > 100 ? '...' : ''}"`);
    });
  }

  console.log('\n' + '='.repeat(70));

  // 统计 ECDICT 中所有词的平均长度
  console.log('\n计算 ECDICT 整体统计...');
  let totalLength = 0;
  let countLessThan10 = 0;
  let validCount = 0;

  for (const [word, entry] of ecdict) {
    if (entry.zh && entry.zh.length > 0) {
      totalLength += entry.zh.length;
      validCount++;
      if (entry.zh.length < 10) {
        countLessThan10++;
      }
    }
  }

  const avgLength = totalLength / validCount;
  const percentLessThan10 = (countLessThan10 / validCount * 100);

  console.log('\nECDICT 整体统计:');
  console.log(`  平均释义长度: ${avgLength.toFixed(1)} 字`);
  console.log(`  少于10字的比例: ${percentLessThan10.toFixed(2)}% (${countLessThan10.toLocaleString()}/${validCount.toLocaleString()})`);
  console.log('\n我们的词库统计:');
  console.log(`  少于10字的比例: 4.94% (1,278/25,895)`);

  console.log('\n' + '='.repeat(70));
}

compare().catch(console.error);
