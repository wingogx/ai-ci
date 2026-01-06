#!/usr/bin/env node
/**
 * 统计释义少于10个字的词条
 */

const fs = require('fs');

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

function analyze() {
  const stats = {
    total: 0,
    lessThan10: 0,
    lessThan5: 0,
    lessThan15: 0,
    lessThan20: 0,
    examples: {
      lessThan5: [],
      between5And10: [],
      between10And15: [],
    }
  };

  const lengthDistribution = {};

  WORD_FILES.forEach(file => {
    if (!fs.existsSync(file)) return;

    const data = JSON.parse(fs.readFileSync(file, 'utf8'));

    data.words.forEach(word => {
      stats.total++;

      const zh = word.meaning?.zh || '';
      const length = zh.length;

      // 统计长度分布
      if (!lengthDistribution[length]) {
        lengthDistribution[length] = 0;
      }
      lengthDistribution[length]++;

      // 统计不同长度区间
      if (length < 5) {
        stats.lessThan5++;
        if (stats.examples.lessThan5.length < 10) {
          stats.examples.lessThan5.push({
            word: word.word,
            pos: word.pos,
            zh: zh,
            length: length,
            file: file.split('/').pop()
          });
        }
      } else if (length < 10) {
        stats.lessThan10++;
        if (stats.examples.between5And10.length < 10) {
          stats.examples.between5And10.push({
            word: word.word,
            pos: word.pos,
            zh: zh,
            length: length,
            file: file.split('/').pop()
          });
        }
      } else if (length < 15) {
        stats.lessThan15++;
        if (stats.examples.between10And15.length < 10) {
          stats.examples.between10And15.push({
            word: word.word,
            pos: word.pos,
            zh: zh,
            length: length,
            file: file.split('/').pop()
          });
        }
      } else if (length < 20) {
        stats.lessThan20++;
      }
    });
  });

  // 打印报告
  console.log('='.repeat(70));
  console.log('中文释义长度统计报告');
  console.log('='.repeat(70));
  console.log();
  console.log(`总词数: ${stats.total}`);
  console.log();

  const totalShort = stats.lessThan5 + stats.lessThan10;
  console.log('长度分布:');
  console.log(`  < 5字: ${stats.lessThan5.toLocaleString()} (${(stats.lessThan5 / stats.total * 100).toFixed(2)}%)`);
  console.log(`  5-9字: ${stats.lessThan10.toLocaleString()} (${(stats.lessThan10 / stats.total * 100).toFixed(2)}%)`);
  console.log(`  < 10字: ${totalShort.toLocaleString()} (${(totalShort / stats.total * 100).toFixed(2)}%)`);
  console.log(`  10-14字: ${stats.lessThan15.toLocaleString()} (${(stats.lessThan15 / stats.total * 100).toFixed(2)}%)`);
  console.log(`  15-19字: ${stats.lessThan20.toLocaleString()} (${(stats.lessThan20 / stats.total * 100).toFixed(2)}%)`);
  console.log(`  >= 20字: ${(stats.total - totalShort - stats.lessThan15 - stats.lessThan20).toLocaleString()} (${((stats.total - totalShort - stats.lessThan15 - stats.lessThan20) / stats.total * 100).toFixed(2)}%)`);
  console.log();

  // 打印详细长度分布（0-30字）
  console.log('详细长度分布 (0-30字):');
  for (let i = 0; i <= 30; i++) {
    const count = lengthDistribution[i] || 0;
    if (count > 0) {
      const bar = '█'.repeat(Math.min(50, Math.floor(count / 100)));
      console.log(`  ${i.toString().padStart(2)}字: ${count.toString().padStart(5)} ${bar}`);
    }
  }
  console.log();

  // 打印示例
  console.log('='.repeat(70));
  console.log('示例 (每类最多10个):');
  console.log('='.repeat(70));

  console.log('\n【< 5字】');
  stats.examples.lessThan5.forEach((item, idx) => {
    console.log(`  ${idx + 1}. ${item.word} (${item.pos}) [${item.file}] - ${item.length}字`);
    console.log(`     "${item.zh}"`);
  });

  console.log('\n【5-9字】');
  stats.examples.between5And10.forEach((item, idx) => {
    console.log(`  ${idx + 1}. ${item.word} (${item.pos}) [${item.file}] - ${item.length}字`);
    console.log(`     "${item.zh}"`);
  });

  console.log('\n【10-14字】');
  stats.examples.between10And15.forEach((item, idx) => {
    console.log(`  ${idx + 1}. ${item.word} (${item.pos}) [${item.file}] - ${item.length}字`);
    console.log(`     "${item.zh}"`);
  });

  console.log('\n' + '='.repeat(70));
}

analyze();
