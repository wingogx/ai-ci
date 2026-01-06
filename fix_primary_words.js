/**
 * 修复小学词库中"某物"占位符的问题
 * 为基础词汇添加正确的中文释义
 */

const fs = require('fs');

// 小学基础词汇的标准释义
const PRIMARY_WORDS = {
  // 动物类
  "ant": { pos: "n", zh: "n. 蚂蚁", en: "small insect" },
  "chicken": { pos: "n", zh: "n. 鸡；鸡肉", en: "bird; poultry meat" },
  "sheep": { pos: "n", zh: "n. 羊；绵羊", en: "farm animal with wool" },
  "panda": { pos: "n", zh: "n. 熊猫；大熊猫", en: "black and white bear from China" },
  "hen": { pos: "n", zh: "n. 母鸡", en: "female chicken" },
  "animal": { pos: "n", zh: "n. 动物", en: "living creature" },
  "duck": { pos: "n", zh: "n. 鸭子；鸭肉", en: "water bird; meat of duck" },

  // 食物类
  "banana": { pos: "n", zh: "n. 香蕉", en: "yellow curved fruit" },
  "pizza": { pos: "n", zh: "n. 比萨饼；意大利薄饼", en: "Italian flat bread with toppings" },
  "noodle": { pos: "n", zh: "n. 面条", en: "long thin pasta" },
  "breakfast": { pos: "n", zh: "n. 早餐；早饭", en: "first meal of day" },
  "lunch": { pos: "n", zh: "n. 午餐；午饭", en: "midday meal" },
  "ice-cream": { pos: "n", zh: "n. 冰淇淋", en: "frozen sweet dessert" },

  // 星期类
  "monday": { pos: "n", zh: "n. 星期一", en: "first day of week" },
  "tuesday": { pos: "n", zh: "n. 星期二", en: "second day of week" },
  "wednesday": { pos: "n", zh: "n. 星期三", en: "third day of week" },
  "thursday": { pos: "n", zh: "n. 星期四", en: "fourth day of week" },
  "friday": { pos: "n", zh: "n. 星期五", en: "fifth day of week" },
  "saturday": { pos: "n", zh: "n. 星期六", en: "sixth day of week" },
  "week": { pos: "n", zh: "n. 星期；周；一周", en: "period of seven days" },
  "weekend": { pos: "n", zh: "n. 周末", en: "Saturday and Sunday" },

  // 家庭成员
  "dad": { pos: "n", zh: "n. 爸爸；父亲", en: "father (informal)" },
  "mom": { pos: "n", zh: "n. 妈妈；母亲", en: "mother (informal)" },
  "brother": { pos: "n", zh: "n. 兄；弟；兄弟", en: "male sibling" },
  "grandfather": { pos: "n", zh: "n. 祖父；外祖父", en: "father's or mother's father" },
  "grandmother": { pos: "n", zh: "n. 祖母；外祖母", en: "father's or mother's mother" },
  "aunt": { pos: "n", zh: "n. 姑母；姨母；伯母；婶母", en: "parent's sister or uncle's wife" },
  "daughter": { pos: "n", zh: "n. 女儿", en: "female child" },
  "children": { pos: "n", zh: "n. 儿童；孩子们（child的复数）", en: "young people; plural of child" },

  // 地点场所
  "classroom": { pos: "n", zh: "n. 教室；课堂", en: "room where lessons are taught" },
  "hospital": { pos: "n", zh: "n. 医院", en: "place for medical treatment" },
  "door": { pos: "n", zh: "n. 门；门口", en: "entrance; way in" },
  "zoo": { pos: "n", zh: "n. 动物园", en: "place where animals are kept for viewing" },
  "mountain": { pos: "n", zh: "n. 山；高山", en: "very high hill" },

  // 时间日期
  "morning": { pos: "n", zh: "n. 早晨；上午", en: "early part of day" },
  "birthday": { pos: "n", zh: "n. 生日", en: "day of one's birth" },
  "january": { pos: "n", zh: "n. 一月；元月", en: "first month of year" },
  "autumn": { pos: "n", zh: "n. 秋天；秋季", en: "season between summer and winter" },
  "winter": { pos: "n", zh: "n. 冬天；冬季", en: "coldest season of year" },

  // 学习相关
  "lesson": { pos: "n", zh: "n. 课；课程；教训", en: "period of teaching; thing learned" },
  "math": { pos: "n", zh: "n. 数学", en: "study of numbers and shapes" },
  "teacher": { pos: "n", zh: "n. 教师；老师", en: "person who teaches" },

  // 其他
  "china": { pos: "n", zh: "n. 中国；瓷器", en: "country name; porcelain" },
  "clothes": { pos: "n", zh: "n. 衣服；服装", en: "items worn on body" },
  "movie": { pos: "n", zh: "n. 电影", en: "motion picture; film" },
  "television": { pos: "n", zh: "n. 电视；电视机", en: "device for watching programs" },
  "football": { pos: "n", zh: "n. 足球；橄榄球", en: "ball game; soccer" },
  "woman": { pos: "n", zh: "n. 妇女；女人", en: "adult female person" },

  // 动词
  "dance": { pos: "v", zh: "v. 跳舞；舞蹈", en: "move rhythmically to music" },
  "bat": { pos: "n", zh: "n. 球拍；蝙蝠", en: "sports equipment; flying mammal" },
  "wind": { pos: "n", zh: "n. 风", en: "moving air" },
  "will": { pos: "aux", zh: "aux. 将；会；愿意", en: "expressing future or willingness" }
};

function fixPrimaryWords() {
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

  let totalUpdated = 0;
  let totalPlaceholders = 0;

  console.log('开始修复"某物"占位符问题\n');

  files.forEach(file => {
    try {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      let updatedInFile = 0;
      let placeholdersInFile = 0;

      data.words = data.words.map(wordEntry => {
        const hasPaceholder = wordEntry.meaning.zh.includes('某物') ||
                             wordEntry.meaning.zh.includes('某人') ||
                             wordEntry.meaning.zh.includes('做某事');

        if (hasPaceholder) {
          placeholdersInFile++;

          const wordLower = wordEntry.word.toLowerCase();
          const fixedDef = PRIMARY_WORDS[wordLower];

          // 只有当找到匹配的定义 AND 词性匹配时才更新
          if (fixedDef && fixedDef.pos === wordEntry.pos) {
            updatedInFile++;
            console.log(`    修复: ${wordEntry.word} - "${wordEntry.meaning.zh}" -> "${fixedDef.zh}"`);
            return {
              ...wordEntry,
              meaning: {
                zh: fixedDef.zh,
                en: fixedDef.en
              }
            };
          } else {
            console.log(`    跳过: ${wordEntry.word} (${wordEntry.pos}) - 无匹配定义`);
          }
        }

        return wordEntry;
      });

      if (updatedInFile > 0) {
        fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
        console.log(`✓ ${file}:`);
        console.log(`  - 发现占位符: ${placeholdersInFile} 个`);
        console.log(`  - 成功修复: ${updatedInFile} 个`);
        totalUpdated += updatedInFile;
        totalPlaceholders += placeholdersInFile;
      } else if (placeholdersInFile > 0) {
        console.log(`⚠ ${file}:`);
        console.log(`  - 发现占位符: ${placeholdersInFile} 个`);
        console.log(`  - 但无匹配的修复定义`);
        totalPlaceholders += placeholdersInFile;
      }
    } catch (e) {
      console.error(`✗ ${file}: ${e.message}`);
    }
  });

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📊 修复统计:`);
  console.log(`  - 发现占位符: ${totalPlaceholders} 个`);
  console.log(`  - 成功修复: ${totalUpdated} 个`);
  console.log(`  - 剩余未修复: ${totalPlaceholders - totalUpdated} 个`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}

fixPrimaryWords();
