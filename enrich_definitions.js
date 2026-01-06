/**
 * 单词释义补全工具
 * 将简短的中文释义扩展为包含主要词性和常见用法的中等详细程度
 */

const fs = require('fs');

// 手工标准释义模板（根据权威词典整理）
const ENRICHED_DEFINITIONS = {
  // 测试数据：这些是已经根据权威词典整理好的标准释义
  "bomb": {
    word: "bomb",
    definitions: [
      {
        pos: "n",
        meaning: {
          zh: "n. 炸弹；核弹；(俚语)彻底失败的事物",
          en: "explosive device; nuclear weapon; complete failure"
        }
      },
      {
        pos: "v",
        meaning: {
          zh: "v. 轰炸，投弹；惨败，搞砸",
          en: "attack with bombs; fail badly"
        }
      }
    ]
  },
  "run": {
    word: "run",
    definitions: [
      {
        pos: "v",
        meaning: {
          zh: "v. 跑，奔跑；运转，运行；经营，管理；延伸，流动",
          en: "move fast on foot; operate; manage; extend; flow"
        }
      },
      {
        pos: "n",
        meaning: {
          zh: "n. 跑步；旅程；一段时期；(板球、棒球)得分",
          en: "act of running; journey; period; score in cricket/baseball"
        }
      }
    ]
  },
  "bear": {
    word: "bear",
    definitions: [
      {
        pos: "n",
        meaning: {
          zh: "n. 熊；粗鲁的人；(股市)空头",
          en: "large animal; rude person; stock market pessimist"
        }
      },
      {
        pos: "v",
        meaning: {
          zh: "v. 承受，忍受；支撑；携带；生育",
          en: "endure; support; carry; give birth to"
        }
      }
    ]
  },
  "book": {
    word: "book",
    definitions: [
      {
        pos: "n",
        meaning: {
          zh: "n. 书，书籍；簿册，账本；(大型作品的)卷，篇",
          en: "printed work; account book; division of large work"
        }
      },
      {
        pos: "v",
        meaning: {
          zh: "v. 预订，预约；登记，记录；(对运动员)记名警告",
          en: "reserve; register; give official warning to"
        }
      }
    ]
  },
  "fly": {
    word: "fly",
    definitions: [
      {
        pos: "v",
        meaning: {
          zh: "v. 飞，飞行；乘飞机旅行；飘动；迅速移动；逃跑",
          en: "move through air; travel by plane; wave; move quickly; flee"
        }
      },
      {
        pos: "n",
        meaning: {
          zh: "n. 苍蝇；(裤子的)拉链",
          en: "flying insect; zipper on trousers"
        }
      }
    ]
  },
  "draw": {
    word: "draw",
    definitions: [
      {
        pos: "v",
        meaning: {
          zh: "v. 画，绘制；拉，拖；抽取，提取；吸引；推断出",
          en: "make picture; pull; extract; attract; deduce"
        }
      },
      {
        pos: "n",
        meaning: {
          zh: "n. 平局；抽签；吸引人的事物",
          en: "tie game; lottery; attraction"
        }
      }
    ]
  },
  "play": {
    word: "play",
    definitions: [
      {
        pos: "v",
        meaning: {
          zh: "v. 玩耍，游戏；参加(比赛)；演奏；播放；扮演",
          en: "engage in games; compete; perform music; broadcast; act a role"
        }
      },
      {
        pos: "n",
        meaning: {
          zh: "n. 游戏，玩耍；戏剧；比赛；发挥作用",
          en: "activity for enjoyment; drama; match; operation"
        }
      }
    ]
  },
  "light": {
    word: "light",
    definitions: [
      {
        pos: "n",
        meaning: {
          zh: "n. 光，光线；灯；(对事物的)认识角度",
          en: "brightness; lamp; way of viewing something"
        }
      },
      {
        pos: "adj",
        meaning: {
          zh: "adj. 明亮的；轻的；少量的；淡色的",
          en: "bright; not heavy; small in amount; pale"
        }
      },
      {
        pos: "v",
        meaning: {
          zh: "v. 点燃，照亮",
          en: "ignite; illuminate"
        }
      }
    ]
  },
  "well": {
    word: "well",
    definitions: [
      {
        pos: "adv",
        meaning: {
          zh: "adv. 很好地，令人满意地；充分地；很，相当",
          en: "in a good way; thoroughly; very; considerably"
        }
      },
      {
        pos: "adj",
        meaning: {
          zh: "adj. 健康的；恰当的；明智的",
          en: "healthy; appropriate; sensible"
        }
      },
      {
        pos: "n",
        meaning: {
          zh: "n. 井；源泉",
          en: "deep hole for water; source"
        }
      }
    ]
  },
  "mean": {
    word: "mean",
    definitions: [
      {
        pos: "v",
        meaning: {
          zh: "v. 意味着，意思是；打算；意义重大",
          en: "signify; intend; be important"
        }
      },
      {
        pos: "adj",
        meaning: {
          zh: "adj. 吝啬的；刻薄的；平均的",
          en: "not generous; unkind; average"
        }
      },
      {
        pos: "n",
        meaning: {
          zh: "n. 平均值；中间",
          en: "average value; middle point"
        }
      }
    ]
  }
};

// 批量更新词库文件
function updateWordFiles(enrichedData) {
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

  files.forEach(file => {
    try {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      let updatedInFile = 0;

      // 更新词库中的单词
      data.words = data.words.map(wordEntry => {
        const enriched = enrichedData[wordEntry.word];
        if (enriched) {
          // 找到匹配词性的释义，如果没有就用第一个
          const matchingDef = enriched.definitions.find(
            def => def.pos === wordEntry.pos
          ) || enriched.definitions[0];

          if (matchingDef) {
            updatedInFile++;
            return {
              ...wordEntry,
              meaning: matchingDef.meaning
            };
          }
        }
        return wordEntry;
      });

      if (updatedInFile > 0) {
        fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
        console.log(`✓ ${file}: 更新了 ${updatedInFile} 个词条`);
        totalUpdated += updatedInFile;
      }
    } catch (e) {
      console.error(`✗ ${file}: ${e.message}`);
    }
  });

  console.log(`\n总计更新: ${totalUpdated} 个词条`);
}

// 测试：使用预定义的标准释义更新10个单词
console.log('开始补全单词释义（测试批次：10个单词）\n');
updateWordFiles(ENRICHED_DEFINITIONS);

console.log('\n测试完成！请检查更新效果。');
console.log('\n下一步：');
console.log('1. 查看游戏中"bomb"等单词的显示效果');
console.log('2. 如果效果满意，我将准备剩余4500+单词的标准释义');
console.log('3. 批量更新所有词库文件');
