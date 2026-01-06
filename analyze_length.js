const fs = require('fs');

const files = [
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

const stats = {
  total: 0,
  under50: 0,
  between50and100: 0,
  over100: 0,
  examples: {
    under50: [],
    between50and100: [],
    over100: []
  }
};

files.forEach(file => {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));

  data.words.forEach(word => {
    const zh = word.meaning?.zh || '';
    const len = zh.length;

    stats.total++;

    if (len < 50) {
      stats.under50++;
      if (stats.examples.under50.length < 3) {
        stats.examples.under50.push({ word: word.word, len, zh: zh.substring(0, 50) });
      }
    } else if (len < 100) {
      stats.between50and100++;
      if (stats.examples.between50and100.length < 5) {
        stats.examples.between50and100.push({ word: word.word, len, zh });
      }
    } else {
      stats.over100++;
      if (stats.examples.over100.length < 5) {
        stats.examples.over100.push({ word: word.word, len, zh });
      }
    }
  });
});

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  📊 词库中文释义长度统计分析');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log(`总词条数: ${stats.total}\n`);

console.log('📈 长度分布:');
console.log(`  < 50字:  ${stats.under50.toLocaleString().padStart(6)} 词  (${(stats.under50/stats.total*100).toFixed(1)}%) ✅ 显示效果最佳`);
console.log(`  50-100字: ${stats.between50and100.toLocaleString().padStart(6)} 词  (${(stats.between50and100/stats.total*100).toFixed(1)}%) ⚠️  多行显示`);
console.log(`  > 100字:  ${stats.over100.toLocaleString().padStart(6)} 词  (${(stats.over100/stats.total*100).toFixed(1)}%) ❌ 占用空间大\n`);

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('📝 50-100字示例（前5个）:\n');
stats.examples.between50and100.forEach((ex, i) => {
  console.log(`${i+1}. ${ex.word} (${ex.len}字):`);
  console.log(`   ${ex.zh}\n`);
});

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('📝 100字以上示例（前5个）:\n');
stats.examples.over100.forEach((ex, i) => {
  console.log(`${i+1}. ${ex.word} (${ex.len}字):`);
  console.log(`   ${ex.zh}\n`);
});

// 按词库文件统计
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('📚 各词库超长释义分布:\n');

files.forEach(file => {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const fileName = file.split('/').pop().replace('.json', '');

  let over50 = 0;
  let over100 = 0;

  data.words.forEach(word => {
    const len = (word.meaning?.zh || '').length;
    if (len >= 50) over50++;
    if (len >= 100) over100++;
  });

  const total = data.words.length;
  console.log(`${fileName.padEnd(12)}: ${total.toString().padStart(5)} 词  (50+: ${over50.toString().padStart(4)} = ${(over50/total*100).toFixed(1)}%, 100+: ${over100.toString().padStart(4)} = ${(over100/total*100).toFixed(1)}%)`);
});
