#!/usr/bin/env node
/**
 * 分析小学和初中词库中的主题词汇
 */

const fs = require('fs');

const FILES = {
  primary: 'src/data/words/china/primary.json',
  junior: 'src/data/words/china/junior.json',
};

// 主题词汇定义
const THEMES = {
  weekdays: {
    name: '星期',
    keywords: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
  },
  colors: {
    name: '颜色',
    keywords: ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'black', 'white', 'brown', 'gray', 'grey'],
  },
  numbers: {
    name: '数字',
    keywords: ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety', 'hundred', 'thousand'],
  },
  fruits: {
    name: '水果',
    keywords: ['apple', 'banana', 'orange', 'grape', 'pear', 'peach', 'strawberry', 'watermelon', 'lemon', 'mango'],
  },
  animals: {
    name: '动物',
    keywords: ['cat', 'dog', 'bird', 'fish', 'rabbit', 'mouse', 'tiger', 'lion', 'elephant', 'monkey', 'panda', 'bear', 'pig', 'cow', 'horse', 'sheep', 'duck', 'chicken', 'snake', 'frog'],
  },
  family: {
    name: '家庭',
    keywords: ['father', 'mother', 'parent', 'brother', 'sister', 'son', 'daughter', 'grandfather', 'grandmother', 'uncle', 'aunt', 'cousin', 'family'],
  },
  body: {
    name: '身体部位',
    keywords: ['head', 'eye', 'ear', 'nose', 'mouth', 'hand', 'foot', 'arm', 'leg', 'finger', 'toe', 'hair', 'face', 'neck', 'shoulder', 'knee'],
  },
  food: {
    name: '食物',
    keywords: ['bread', 'rice', 'noodle', 'egg', 'milk', 'water', 'tea', 'coffee', 'juice', 'cake', 'chicken', 'fish', 'meat', 'vegetable', 'potato', 'tomato'],
  },
  weather: {
    name: '天气',
    keywords: ['sunny', 'rainy', 'cloudy', 'windy', 'snowy', 'hot', 'cold', 'warm', 'cool', 'weather'],
  },
  school: {
    name: '学校',
    keywords: ['school', 'teacher', 'student', 'classroom', 'book', 'pen', 'pencil', 'desk', 'chair', 'blackboard', 'homework', 'lesson', 'study', 'learn', 'read', 'write'],
  },
  sports: {
    name: '运动',
    keywords: ['football', 'basketball', 'tennis', 'swimming', 'running', 'jump', 'play', 'game', 'sport'],
  },
  transport: {
    name: '交通',
    keywords: ['car', 'bus', 'bike', 'bicycle', 'train', 'plane', 'ship', 'taxi', 'subway'],
  },
  clothes: {
    name: '衣服',
    keywords: ['shirt', 'pants', 'dress', 'skirt', 'coat', 'jacket', 'shoes', 'socks', 'hat', 'cap'],
  },
  places: {
    name: '地点',
    keywords: ['home', 'house', 'room', 'kitchen', 'bedroom', 'bathroom', 'garden', 'park', 'shop', 'store', 'hospital', 'library', 'restaurant', 'hotel'],
  },
  time: {
    name: '时间',
    keywords: ['hour', 'minute', 'second', 'today', 'yesterday', 'tomorrow', 'morning', 'afternoon', 'evening', 'night', 'day', 'week', 'month', 'year'],
  },
};

function analyzeWordList(level, filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const words = data.words;

  const results = {};

  Object.keys(THEMES).forEach((themeKey) => {
    const theme = THEMES[themeKey];
    const found = [];

    theme.keywords.forEach((keyword) => {
      const word = words.find((w) => w.word.toLowerCase() === keyword);
      if (word) {
        found.push({
          id: word.id,
          word: word.word,
          phonetic: word.phonetic,
          pos: word.pos,
          zh: word.meaning?.zh || '',
        });
      }
    });

    if (found.length > 0) {
      results[themeKey] = {
        name: theme.name,
        count: found.length,
        words: found,
      };
    }
  });

  return results;
}

console.log('='.repeat(70));
console.log('小学和初中词库主题词汇分析');
console.log('='.repeat(70));
console.log();

const allResults = {};

Object.keys(FILES).forEach((level) => {
  console.log(`\n【${level === 'primary' ? '小学' : '初中'}词库】`);
  console.log('-'.repeat(70));

  const results = analyzeWordList(level, FILES[level]);
  allResults[level] = results;

  // 统计
  let totalThemes = 0;
  let totalWords = 0;

  Object.keys(results)
    .sort((a, b) => results[b].count - results[a].count)
    .forEach((themeKey) => {
      const theme = results[themeKey];
      totalThemes++;
      totalWords += theme.count;
      console.log(`  ${theme.name}: ${theme.count} 个词`);
    });

  console.log(`\n  总计: ${totalThemes} 个主题，${totalWords} 个词`);
});

// 打印详细词汇
console.log('\n' + '='.repeat(70));
console.log('详细词汇列表');
console.log('='.repeat(70));

Object.keys(FILES).forEach((level) => {
  console.log(`\n【${level === 'primary' ? '小学' : '初中'}词库】`);

  const results = allResults[level];

  Object.keys(results)
    .sort((a, b) => results[b].count - results[a].count)
    .forEach((themeKey) => {
      const theme = results[themeKey];
      console.log(`\n${theme.name} (${theme.count}个):`);
      theme.words.forEach((word, idx) => {
        console.log(`  ${idx + 1}. ${word.word} - ${word.zh}`);
      });
    });
});

// 生成主题词库JSON文件
console.log('\n' + '='.repeat(70));
console.log('生成主题词库数据文件...');
console.log('='.repeat(70));

Object.keys(FILES).forEach((level) => {
  const results = allResults[level];
  const themes = [];

  Object.keys(results).forEach((themeKey) => {
    const theme = results[themeKey];
    if (theme.count >= 4) {
      // 至少4个词才能成为一个主题关卡
      themes.push({
        id: themeKey,
        name: theme.name,
        level: level,
        words: theme.words.map((w) => w.id),
        wordCount: theme.count,
      });
    }
  });

  const outputPath = `src/data/themes/${level}.json`;
  const outputData = {
    level: level,
    totalThemes: themes.length,
    themes: themes,
  };

  // 确保目录存在
  const dir = 'src/data/themes';
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf8');
  console.log(`✓ ${outputPath}: ${themes.length} 个主题`);
});

console.log('\n完成！');
