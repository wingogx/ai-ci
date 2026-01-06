const fs = require('fs');
const file = 'src/data/words/china/primary.json';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

const shortDefs = [];
data.words.forEach(word => {
  const zh = word.meaning?.zh || '';
  if (zh.length > 0 && zh.length < 15) {
    shortDefs.push({ word: word.word, zh, len: zh.length });
  }
});

console.log(`小学词库定义质量检查:`);
console.log(`  总词数: ${data.words.length}`);
console.log(`  短定义(<15字): ${shortDefs.length}`);
if (shortDefs.length > 0) {
  console.log(`\n仍需补充的词:`);
  shortDefs.slice(0, 20).forEach(w => {
    console.log(`  - ${w.word}: "${w.zh}" (${w.len}字)`);
  });
  if (shortDefs.length > 20) {
    console.log(`  ... 还有 ${shortDefs.length - 20} 个`);
  }
} else {
  console.log(`\n✅ 所有定义均≥15字符，符合标准！`);
}
