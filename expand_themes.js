/**
 * 扩展主题分类 - 目标80%覆盖率
 */

const fs = require('fs');

// 扩展的主题定义（在原有15个基础上增加）
const EXPANDED_THEMES = {
  // ========== 名词主题扩展 ==========
  toys: {
    name: '玩具',
    keywords: ['toy', 'ball', 'kite', 'doll', 'robot', 'balloon', 'puzzle', 'game']
  },
  furniture: {
    name: '家具/房间',
    keywords: ['room', 'bed', 'desk', 'chair', 'table', 'door', 'window', 'wall', 'floor', 'sofa', 'lamp']
  },
  jobs: {
    name: '职业',
    keywords: ['teacher', 'doctor', 'nurse', 'farmer', 'worker', 'driver', 'cook', 'policeman', 'postman', 'singer', 'dancer', 'pilot']
  },
  nature: {
    name: '自然',
    keywords: ['tree', 'flower', 'grass', 'river', 'mountain', 'sky', 'cloud', 'sun', 'moon', 'star', 'water', 'fire', 'wind', 'rain', 'snow']
  },
  stationery: {
    name: '文具',
    keywords: ['pen', 'pencil', 'book', 'ruler', 'eraser', 'bag', 'crayon', 'paper', 'notebook']
  },
  shapes: {
    name: '形状',
    keywords: ['circle', 'square', 'triangle', 'round', 'line']
  },
  positions: {
    name: '方位',
    keywords: ['up', 'down', 'left', 'right', 'front', 'back', 'in', 'on', 'under', 'near', 'behind', 'between']
  },
  people: {
    name: '人物',
    keywords: ['boy', 'girl', 'man', 'woman', 'baby', 'child', 'people', 'friend', 'student']
  },
  containers: {
    name: '容器/物品',
    keywords: ['box', 'bag', 'cup', 'glass', 'bottle', 'bowl', 'plate', 'basket']
  },

  // ========== 动词主题（按语义分组） ==========
  movement: {
    name: '移动动作',
    keywords: ['go', 'come', 'run', 'walk', 'jump', 'fly', 'swim', 'ride', 'drive', 'stop', 'sit', 'stand']
  },
  handActions: {
    name: '手部动作',
    keywords: ['take', 'give', 'put', 'get', 'open', 'close', 'draw', 'write', 'cut', 'wash', 'clean']
  },
  dailyActivities: {
    name: '日常活动',
    keywords: ['eat', 'drink', 'sleep', 'wake', 'brush', 'wear', 'use', 'make', 'cook']
  },
  studyActivities: {
    name: '学习活动',
    keywords: ['read', 'write', 'learn', 'study', 'know', 'understand', 'remember', 'think']
  },
  playActivities: {
    name: '娱乐活动',
    keywords: ['play', 'sing', 'dance', 'watch', 'listen', 'laugh', 'smile']
  },
  communication: {
    name: '交流动词',
    keywords: ['say', 'tell', 'speak', 'talk', 'ask', 'answer', 'call', 'shout', 'cry']
  },
  perception: {
    name: '感知动词',
    keywords: ['see', 'look', 'watch', 'hear', 'listen', 'feel', 'touch', 'smell', 'taste']
  },
  emotion: {
    name: '情感动词',
    keywords: ['like', 'love', 'want', 'need', 'hope', 'wish', 'miss', 'thank', 'help']
  },
  possession: {
    name: '拥有/变化',
    keywords: ['have', 'has', 'buy', 'sell', 'find', 'lose', 'show', 'meet', 'become', 'grow', 'change']
  },

  // ========== 形容词主题 ==========
  sizeAdjectives: {
    name: '大小形容词',
    keywords: ['big', 'small', 'large', 'little', 'tall', 'short', 'long', 'high', 'low', 'fat', 'thin']
  },
  qualityAdjectives: {
    name: '品质形容词',
    keywords: ['good', 'bad', 'nice', 'fine', 'great', 'right', 'wrong', 'new', 'old', 'young']
  },
  feelingAdjectives: {
    name: '感觉形容词',
    keywords: ['happy', 'sad', 'tired', 'hungry', 'thirsty', 'angry', 'sorry', 'afraid']
  },
  stateAdjectives: {
    name: '状态形容词',
    keywords: ['hot', 'cold', 'warm', 'cool', 'wet', 'dry', 'clean', 'dirty', 'full', 'empty', 'busy', 'free']
  },
  appearanceAdjectives: {
    name: '外观形容词',
    keywords: ['beautiful', 'pretty', 'cool', 'cute', 'ugly', 'bright', 'dark']
  },

  // ========== 功能词主题 ==========
  questionWords: {
    name: '疑问词',
    keywords: ['what', 'where', 'when', 'who', 'whose', 'which', 'why', 'how']
  },
  commonWords: {
    name: '常用词',
    keywords: ['the', 'a', 'an', 'and', 'or', 'but', 'so', 'very', 'too', 'all', 'some', 'any', 'no', 'not', 'yes']
  },
  pronouns: {
    name: '代词',
    keywords: ['i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'this', 'that', 'these', 'those']
  },
  prepositions: {
    name: '介词',
    keywords: ['in', 'on', 'at', 'to', 'from', 'with', 'by', 'for', 'of', 'about', 'into', 'out', 'up', 'down']
  },
};

// 读取词库
const primaryWords = JSON.parse(fs.readFileSync('./src/data/words/china/primary.json', 'utf8'));
const juniorWords = JSON.parse(fs.readFileSync('./src/data/words/china/junior.json', 'utf8'));

// 读取现有主题
const primaryThemes = JSON.parse(fs.readFileSync('./public/data/themes/primary.json', 'utf8'));
const juniorThemes = JSON.parse(fs.readFileSync('./public/data/themes/junior.json', 'utf8'));

/**
 * 扩展主题
 */
function expandThemes(words, existingThemes, level) {
  console.log(`\n========== 扩展 ${level} 主题 ==========`);

  // 获取已覆盖的词ID
  const coveredIds = new Set();
  existingThemes.themes.forEach(theme => {
    theme.words.forEach(id => coveredIds.add(id));
  });

  const newThemes = [];

  // 为每个新主题查找单词
  for (const [themeId, themeDef] of Object.entries(EXPANDED_THEMES)) {
    const themeWords = [];

    words.words.forEach(word => {
      // 跳过已覆盖的词
      if (coveredIds.has(word.id)) return;

      // 检查单词是否匹配主题关键词
      const wordLower = word.word.toLowerCase();
      const matchesKeyword = themeDef.keywords.some(keyword => {
        return wordLower === keyword ||
               wordLower.startsWith(keyword) ||
               keyword.startsWith(wordLower);
      });

      if (matchesKeyword) {
        themeWords.push(word.id);
        coveredIds.add(word.id); // 标记为已覆盖
      }
    });

    // 只添加有足够单词的主题（至少5个）
    if (themeWords.length >= 5) {
      newThemes.push({
        id: themeId,
        name: themeDef.name,
        level: level,
        words: themeWords,
        wordCount: themeWords.length
      });
      console.log(`✓ ${themeDef.name}: ${themeWords.length} 词`);
    } else if (themeWords.length > 0) {
      console.log(`✗ ${themeDef.name}: ${themeWords.length} 词 (不足5个，跳过)`);
    }
  }

  return newThemes;
}

// 扩展小学主题
const newPrimaryThemes = expandThemes(primaryWords, primaryThemes, 'primary');
const expandedPrimaryThemes = {
  level: 'primary',
  totalThemes: primaryThemes.totalThemes + newPrimaryThemes.length,
  themes: [...primaryThemes.themes, ...newPrimaryThemes]
};

// 扩展初中主题
const newJuniorThemes = expandThemes(juniorWords, juniorThemes, 'junior');
const expandedJuniorThemes = {
  level: 'junior',
  totalThemes: juniorThemes.totalThemes + newJuniorThemes.length,
  themes: [...juniorThemes.themes, ...newJuniorThemes]
};

// 保存扩展后的主题
fs.writeFileSync(
  './src/data/themes/primary.json',
  JSON.stringify(expandedPrimaryThemes, null, 2)
);
fs.writeFileSync(
  './src/data/themes/junior.json',
  JSON.stringify(expandedJuniorThemes, null, 2)
);

// 也更新 public 目录
fs.writeFileSync(
  './public/data/themes/primary.json',
  JSON.stringify(expandedPrimaryThemes, null, 2)
);
fs.writeFileSync(
  './public/data/themes/junior.json',
  JSON.stringify(expandedJuniorThemes, null, 2)
);

// 统计覆盖率
function calculateCoverage(words, themes) {
  const coveredIds = new Set();
  themes.themes.forEach(theme => {
    theme.words.forEach(id => coveredIds.add(id));
  });
  const coverage = coveredIds.size;
  const percentage = Math.round((coverage / words.words.length) * 100);
  return { coverage, total: words.words.length, percentage };
}

const primaryCoverage = calculateCoverage(primaryWords, expandedPrimaryThemes);
const juniorCoverage = calculateCoverage(juniorWords, expandedJuniorThemes);

console.log('\n========== 结果汇总 ==========');
console.log(`\n小学 (primary):`);
console.log(`  原主题数: ${primaryThemes.totalThemes}`);
console.log(`  新增主题: ${newPrimaryThemes.length}`);
console.log(`  总主题数: ${expandedPrimaryThemes.totalThemes}`);
console.log(`  覆盖率: ${primaryCoverage.coverage}/${primaryCoverage.total} (${primaryCoverage.percentage}%)`);

console.log(`\n初中 (junior):`);
console.log(`  原主题数: ${juniorThemes.totalThemes}`);
console.log(`  新增主题: ${newJuniorThemes.length}`);
console.log(`  总主题数: ${expandedJuniorThemes.totalThemes}`);
console.log(`  覆盖率: ${juniorCoverage.coverage}/${juniorCoverage.total} (${juniorCoverage.percentage}%)`);

console.log('\n✅ 主题扩展完成！');
