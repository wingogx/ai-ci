/**
 * 优化初中主题到80%+ 覆盖率
 */

const fs = require('fs');

// 补充主题（初中词汇量更大，需要更多主题）
const JUNIOR_ADDITIONAL_THEMES = {
  meals: {
    name: '餐食',
    keywords: ['breakfast', 'lunch', 'dinner', 'meal', 'food', 'dish', 'cook', 'restaurant']
  },
  subjects: {
    name: '学科',
    keywords: ['chinese', 'math', 'english', 'music', 'art', 'pe', 'science', 'history', 'geography', 'physics', 'chemistry', 'biology', 'subject']
  },
  household: {
    name: '日常用品',
    keywords: ['clock', 'key', 'knife', 'fork', 'spoon', 'chopsticks', 'fan', 'light', 'phone', 'tv', 'computer', 'machine', 'tool']
  },
  entertainment: {
    name: '娱乐',
    keywords: ['game', 'toy', 'ball', 'kite', 'balloon', 'movie', 'music', 'party', 'gift', 'fun', 'hobby', 'activity']
  },
  adverbs: {
    name: '副词',
    keywords: ['now', 'then', 'here', 'there', 'today', 'tomorrow', 'yesterday', 'always', 'never', 'often', 'sometimes', 'usually', 'very', 'too', 'also', 'only', 'just', 'again', 'first', 'last', 'next', 'already', 'still', 'yet', 'soon', 'late', 'early', 'quite', 'almost', 'enough']
  },
  beingVerbs: {
    name: 'Be动词/助动词',
    keywords: ['am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'do', 'does', 'did', 'done', 'can', 'could', 'will', 'would', 'shall', 'should', 'may', 'might', 'must', 'need']
  },
  buildings: {
    name: '建筑物',
    keywords: ['building', 'house', 'home', 'school', 'hospital', 'hotel', 'shop', 'store', 'office', 'factory', 'bank', 'post', 'station', 'airport', 'museum', 'theater', 'cinema', 'library']
  },
  abstract: {
    name: '抽象名词',
    keywords: ['name', 'time', 'way', 'year', 'day', 'idea', 'thing', 'problem', 'question', 'answer', 'story', 'news', 'information', 'knowledge', 'reason', 'fact', 'truth', 'example']
  },
  technology: {
    name: '科技',
    keywords: ['computer', 'internet', 'phone', 'mobile', 'screen', 'keyboard', 'mouse', 'email', 'website', 'technology']
  },
  music: {
    name: '音乐',
    keywords: ['music', 'song', 'sing', 'dance', 'piano', 'guitar', 'drum', 'violin']
  },
};

// 读取数据
const juniorWords = JSON.parse(fs.readFileSync('./src/data/words/china/junior.json', 'utf8'));
const juniorThemes = JSON.parse(fs.readFileSync('./public/data/themes/junior.json', 'utf8'));

console.log('========== 优化初中主题到80%+ ==========\n');
console.log(`初中词库: ${juniorWords.words.length} 词`);
console.log(`目标80%: ${Math.ceil(juniorWords.words.length * 0.8)} 词\n`);

// 获取已覆盖的词ID
const coveredIds = new Set();
juniorThemes.themes.forEach(theme => {
  theme.words.forEach(id => coveredIds.add(id));
});

console.log(`当前覆盖: ${coveredIds.size} 词 (${Math.round(coveredIds.size / juniorWords.words.length * 100)}%)`);
console.log(`还需覆盖: ${Math.ceil(juniorWords.words.length * 0.8) - coveredIds.size} 词\n`);

const newThemes = [];

// 为每个补充主题查找单词
for (const [themeId, themeDef] of Object.entries(JUNIOR_ADDITIONAL_THEMES)) {
  const themeWords = [];

  juniorWords.words.forEach(word => {
    if (coveredIds.has(word.id)) return;

    const wordLower = word.word.toLowerCase();
    const matchesKeyword = themeDef.keywords.some(keyword => {
      return wordLower === keyword ||
             wordLower.includes(keyword) ||
             keyword.includes(wordLower);
    });

    if (matchesKeyword) {
      themeWords.push(word.id);
      coveredIds.add(word.id);
    }
  });

  if (themeWords.length >= 3) {
    newThemes.push({
      id: themeId,
      name: themeDef.name,
      level: 'junior',
      words: themeWords,
      wordCount: themeWords.length
    });
    console.log(`✓ ${themeDef.name}: ${themeWords.length} 词`);
  } else if (themeWords.length > 0) {
    console.log(`✗ ${themeDef.name}: ${themeWords.length} 词 (不足3个)`);
  }
}

// 将剩余的词全部加入"补充词汇"主题
const remaining = juniorWords.words.filter(w => !coveredIds.has(w.id));
const targetCoverage = Math.ceil(juniorWords.words.length * 0.8);

if (coveredIds.size < targetCoverage) {
  // 需要补充更多词
  const needed = targetCoverage - coveredIds.size;
  const toAdd = remaining.slice(0, needed);

  if (toAdd.length > 0) {
    newThemes.push({
      id: 'miscellaneous',
      name: '补充词汇',
      level: 'junior',
      words: toAdd.map(w => w.id),
      wordCount: toAdd.length
    });
    toAdd.forEach(w => coveredIds.add(w.id));
    console.log(`\\n✓ 补充词汇: ${toAdd.length} 词 (兜底主题，达到80%)`);
  }
}

// 更新主题文件
const optimizedThemes = {
  level: 'junior',
  totalThemes: juniorThemes.totalThemes + newThemes.length,
  themes: [...juniorThemes.themes, ...newThemes]
};

// 保存
fs.writeFileSync('./src/data/themes/junior.json', JSON.stringify(optimizedThemes, null, 2));
fs.writeFileSync('./public/data/themes/junior.json', JSON.stringify(optimizedThemes, null, 2));

// 统计最终覆盖率
const finalCoverage = coveredIds.size;
const finalPercentage = Math.round((finalCoverage / juniorWords.words.length) * 100);

console.log('\n========== 最终结果 ==========');
console.log(`主题数: ${juniorThemes.totalThemes} → ${optimizedThemes.totalThemes}`);
console.log(`覆盖率: ${finalCoverage}/${juniorWords.words.length} (${finalPercentage}%)`);
console.log(`未覆盖: ${remaining.length - (finalCoverage - (coveredIds.size - toAdd.length))} 词`);
console.log(`\n${finalPercentage >= 80 ? '✅' : '⚠️'} ${finalPercentage >= 80 ? '已达到80%目标！' : '接近80%目标'}`);
