/**
 * 为小学基础词汇补充完整定义（多词性 + 详细释义）
 * 标准：中文释义 >= 15字符，包含多个常用词性和用法
 */

const fs = require('fs');

// 小学基础词汇的完整定义（基于权威词典整理）
const FULL_DEFINITIONS = {
  // 动物类
  "ant": {
    pos: "n",
    zh: "n. 蚂蚁, 一种群居性昆虫 [复数ants]",
    en: "n. small social insect that lives in organized groups"
  },
  "chicken": {
    pos: "n",
    zh: "n. 鸡, 小鸡, 鸡肉 a. 胆小的, 懦弱的",
    en: "n. common farm bird; meat from this bird a. cowardly"
  },
  "sheep": {
    pos: "n",
    zh: "n. 羊, 绵羊, 胆小鬼 [复数同形]",
    en: "n. farm animal with thick wool coat [plural: sheep]"
  },
  "panda": {
    pos: "n",
    zh: "n. 熊猫, 大熊猫, 小熊猫",
    en: "n. large black and white bear from China; red panda"
  },
  "hen": {
    pos: "n",
    zh: "n. 母鸡, 雌禽, 雌鸟",
    en: "n. female chicken or other female bird"
  },
  "animal": {
    pos: "n",
    zh: "n. 动物, 兽类, 畜生 a. 动物的, 野兽般的",
    en: "n. living creature that can move a. of animals; brutal"
  },

  // 食物类
  "banana": {
    pos: "n",
    zh: "n. 香蕉, 香蕉树, 芭蕉属植物",
    en: "n. long curved yellow fruit; tropical plant"
  },
  "pizza": {
    pos: "n",
    zh: "n. 比萨饼, 意大利薄饼",
    en: "n. Italian dish of flat bread with toppings"
  },
  "noodle": {
    pos: "n",
    zh: "n. 面条, 挂面 vi. 用脑筋, 即兴演奏",
    en: "n. long thin strip of pasta vi. improvise"
  },
  "breakfast": {
    pos: "n",
    zh: "n. 早餐, 早饭 vi. 吃早餐 vt. 供给...早餐",
    en: "n. first meal of day v. eat/serve breakfast"
  },
  "lunch": {
    pos: "n",
    zh: "n. 午餐, 午饭, 便餐 vi. 吃午餐 vt. 供给...午餐",
    en: "n. midday meal v. eat/serve lunch"
  },
  "ice-cream": {
    pos: "n",
    zh: "n. 冰淇淋, 冰激凌, 雪糕",
    en: "n. frozen sweet dessert made from cream or milk"
  },

  // 星期类
  "monday": {
    pos: "n",
    zh: "n. 星期一, 礼拜一, 周一",
    en: "n. first day of the work week; Mon."
  },
  "tuesday": {
    pos: "n",
    zh: "n. 星期二, 礼拜二, 周二",
    en: "n. second day of the work week; Tue."
  },
  "wednesday": {
    pos: "n",
    zh: "n. 星期三, 礼拜三, 周三",
    en: "n. third day of the work week; Wed."
  },
  "thursday": {
    pos: "n",
    zh: "n. 星期四, 礼拜四, 周四",
    en: "n. fourth day of the work week; Thu."
  },
  "friday": {
    pos: "n",
    zh: "n. 星期五, 礼拜五, 周五",
    en: "n. fifth day of the work week; Fri."
  },
  "saturday": {
    pos: "n",
    zh: "n. 星期六, 礼拜六, 周六",
    en: "n. sixth day of the week, first weekend day; Sat."
  },
  "week": {
    pos: "n",
    zh: "n. 星期, 周, 一周, 工作周",
    en: "n. period of seven days; working days excluding weekend"
  },
  "weekend": {
    pos: "n",
    zh: "n. 周末, 周末假期 vi. 度周末",
    en: "n. Saturday and Sunday v. spend weekend"
  },

  // 家庭成员
  "dad": {
    pos: "n",
    zh: "n. 爸爸, 父亲, 爹爹 [儿语, 口语]",
    en: "n. father (informal, used by children)"
  },
  "mom": {
    pos: "n",
    zh: "n. 妈妈, 母亲 [儿语, 口语]",
    en: "n. mother (informal, used by children)"
  },
  "brother": {
    pos: "n",
    zh: "n. 兄弟, 哥哥, 弟弟, 教友, 同事",
    en: "n. male sibling; fellow member; close friend"
  },
  "grandfather": {
    pos: "n",
    zh: "n. 祖父, 外祖父, 老爷爷",
    en: "n. father of one's father or mother"
  },
  "grandmother": {
    pos: "n",
    zh: "n. 祖母, 外祖母, 老奶奶",
    en: "n. mother of one's father or mother"
  },
  "aunt": {
    pos: "n",
    zh: "n. 姑母, 伯母, 婶母, 姨母, 舅母, 阿姨",
    en: "n. sister of one's parent; uncle's wife"
  },
  "daughter": {
    pos: "n",
    zh: "n. 女儿, 闺女, 养女, 女弟子",
    en: "n. female child in relation to parents"
  },
  "children": {
    pos: "n",
    zh: "n. 儿童, 孩子们, 子女 [child的复数]",
    en: "n. young people; sons and daughters [plural of child]"
  },

  // 地点场所
  "classroom": {
    pos: "n",
    zh: "n. 教室, 课堂, 班级, 全班学生",
    en: "n. room where lessons are taught; class; students"
  },
  "hospital": {
    pos: "n",
    zh: "n. 医院, 医务室, 兽医院",
    en: "n. place for medical treatment and care"
  },
  "door": {
    pos: "n",
    zh: "n. 门, 门口, 户, 家, 通道 vt. 装门于",
    en: "n. entrance; doorway; household v. fit with door"
  },
  "zoo": {
    pos: "n",
    zh: "n. 动物园, 拥挤杂乱的地方",
    en: "n. place where animals are kept for public viewing"
  },
  "mountain": {
    pos: "n",
    zh: "n. 山, 山脉, 高山, 大量 a. 山的, 山地的",
    en: "n. very high hill; large amount a. of mountains"
  },

  // 时间日期
  "morning": {
    pos: "n",
    zh: "n. 早晨, 上午, 黎明 a. 早晨的, 上午的",
    en: "n. early part of day; dawn a. of morning"
  },
  "birthday": {
    pos: "n",
    zh: "n. 生日, 诞生日, 诞辰, 生辰",
    en: "n. anniversary of the day of one's birth"
  },
  "january": {
    pos: "n",
    zh: "n. 一月, 元月 [缩写Jan.]",
    en: "n. first month of the year [abbr. Jan.]"
  },
  "autumn": {
    pos: "n",
    zh: "n. 秋天, 秋季, 成熟期 a. 秋天的, 秋季的",
    en: "n. season between summer and winter a. of autumn"
  },
  "winter": {
    pos: "n",
    zh: "n. 冬天, 冬季, 严寒期 vi. 过冬 a. 冬天的",
    en: "n. coldest season v. spend winter a. of winter"
  },

  // 学习相关
  "lesson": {
    pos: "n",
    zh: "n. 课, 课程, 一节课, 教训, 经验",
    en: "n. period of teaching; thing learned; warning"
  },
  "math": {
    pos: "n",
    zh: "n. 数学, 算术 [mathematics的缩写]",
    en: "n. study of numbers and shapes [short for mathematics]"
  },
  "teacher": {
    pos: "n",
    zh: "n. 教师, 老师, 先生, 导师",
    en: "n. person who teaches; instructor"
  },

  // 其他
  "china": {
    pos: "n",
    zh: "n. 中国, 瓷器, 瓷料 a. 瓷器的, 中国的",
    en: "n. country in East Asia; porcelain a. of china/China"
  },
  "clothes": {
    pos: "n",
    zh: "n. 衣服, 服装, 被褥 [复数]",
    en: "n. items worn to cover body; garments [plural]"
  },
  "movie": {
    pos: "n",
    zh: "n. 电影, 影片, 电影院 [常用复数movies]",
    en: "n. motion picture; cinema [often plural: movies]"
  },
  "television": {
    pos: "n",
    zh: "n. 电视, 电视机, 电视节目, 电视业 [缩写TV]",
    en: "n. TV; TV set; TV programs; TV industry [abbr. TV]"
  },
  "football": {
    pos: "n",
    zh: "n. 足球, 橄榄球, 足球运动",
    en: "n. soccer; American football; the ball used"
  },
  "woman": {
    pos: "n",
    zh: "n. 妇女, 女人, 成年女子 [复数women]",
    en: "n. adult female person [plural: women]"
  },

  // 动词/其他词性
  "dance": {
    pos: "v",
    zh: "n. 跳舞, 舞蹈, 舞会 vi. 跳舞 vt. 使跳舞",
    en: "n. dancing; social event v. move rhythmically to music"
  },
  "bat": {
    pos: "n",
    zh: "n. 球拍, 球棒, 蝙蝠 vt. 用球棒击球",
    en: "n. sports equipment; flying mammal v. hit with bat"
  },
  "wind": {
    pos: "n",
    zh: "n. 风, 气流, 呼吸 vt. 缠绕, 上发条 vi. 蜿蜒",
    en: "n. moving air; breath v. wrap around; turn mechanism"
  },
  "will": {
    pos: "aux",
    zh: "aux. 将要, 会, 愿意 n. 意志, 遗嘱, 决心",
    en: "aux. expressing future/willingness n. determination; testament"
  }
};

function enrichPrimaryWords() {
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
  let totalShort = 0;

  console.log('开始补充完整定义（标准：中文≥15字符）\n');

  files.forEach(file => {
    try {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      let updatedInFile = 0;
      let shortInFile = 0;

      data.words = data.words.map(wordEntry => {
        const zh = wordEntry.meaning.zh || '';
        const isShort = zh.length > 0 && zh.length < 15;

        if (isShort) {
          shortInFile++;

          const wordLower = wordEntry.word.toLowerCase();
          const fullDef = FULL_DEFINITIONS[wordLower];

          if (fullDef && fullDef.pos === wordEntry.pos) {
            console.log(`    ${file.split('/').pop()}: ${wordEntry.word}`);
            console.log(`      旧: "${zh}" (${zh.length}字)`);
            console.log(`      新: "${fullDef.zh}" (${fullDef.zh.length}字)`);

            updatedInFile++;
            return {
              ...wordEntry,
              meaning: {
                zh: fullDef.zh,
                en: fullDef.en
              }
            };
          }
        }

        return wordEntry;
      });

      if (updatedInFile > 0) {
        fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
        console.log(`  ✓ ${file}: 更新了 ${updatedInFile}/${shortInFile} 个短释义\n`);
        totalUpdated += updatedInFile;
        totalShort += shortInFile;
      } else if (shortInFile > 0) {
        console.log(`  ○ ${file}: 发现 ${shortInFile} 个短释义，但无匹配定义\n`);
        totalShort += shortInFile;
      }
    } catch (e) {
      console.error(`✗ ${file}: ${e.message}`);
    }
  });

  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📊 补全统计:`);
  console.log(`  - 发现短释义: ${totalShort} 个`);
  console.log(`  - 成功补全: ${totalUpdated} 个`);
  console.log(`  - 剩余未补全: ${totalShort - totalUpdated} 个`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
}

enrichPrimaryWords();
