/**
 * 合并多词性释义脚本
 * 将常见多词性单词的释义合并到一个条目中
 */

const fs = require('fs');

// 常见多词性单词的合并释义
const MERGED_DEFINITIONS = {
  "bomb": { zh: "n. 炸弹；核弹 v. 轰炸；惨败", en: "n. explosive; nuclear weapon v. attack; fail" },
  "run": { zh: "v. 跑；运转；经营 n. 跑步；旅程", en: "v. move fast; operate n. act of running; journey" },
  "bear": { zh: "n. 熊 v. 承受；忍受；生育", en: "n. large animal v. endure; support; give birth" },
  "book": { zh: "n. 书；书籍 v. 预订；登记", en: "n. written work v. reserve; register" },
  "fly": { zh: "v. 飞；飞行 n. 苍蝇；拉链", en: "v. move through air n. insect; zipper" },
  "draw": { zh: "v. 画；拉；抽取 n. 平局；抽签", en: "v. make picture; pull n. tie game; lottery" },
  "play": { zh: "v. 玩；演奏；播放 n. 游戏；戏剧", en: "v. engage in games; perform n. game; drama" },
  "light": { zh: "n. 光；灯 adj. 明亮的；轻的 v. 点燃", en: "n. brightness adj. bright; not heavy v. ignite" },
  "well": { zh: "adv. 很好地 adj. 健康的 n. 井", en: "adv. in good way adj. healthy n. water source" },
  "mean": { zh: "v. 意味着；打算 adj. 吝啬的 n. 平均值", en: "v. signify; intend adj. not generous n. average" },
  "call": { zh: "v. 叫；打电话 n. 电话；呼叫", en: "v. shout; telephone n. phone call; shout" },
  "work": { zh: "v. 工作；运转 n. 工作；著作", en: "v. do job; function n. job; creation" },
  "show": { zh: "v. 显示；展示 n. 表演；展览", en: "v. display; exhibit n. performance; exhibition" },
  "talk": { zh: "v. 说话；交谈 n. 谈话；演讲", en: "v. speak; converse n. conversation; speech" },
  "stand": { zh: "v. 站立；位于 n. 立场；台", en: "v. be upright; be located n. position; support" },
  "point": { zh: "n. 点；要点 v. 指；指向", en: "n. dot; main idea v. direct finger; aim" },
  "watch": { zh: "v. 观看；注视 n. 手表；看守", en: "v. look at; observe n. timepiece; guarding" },
  "place": { zh: "n. 地方；位置 v. 放置；安置", en: "n. location; position v. put; provide position" },
  "turn": { zh: "v. 转动；转向 n. 转动；轮流", en: "v. move in circle; change direction n. act of turning; opportunity" },
  "hand": { zh: "n. 手；协助 v. 传递；交给", en: "n. part of body; help v. pass; give" },
  "move": { zh: "v. 移动；搬家 n. 移动；步骤", en: "v. change position; change residence n. act of moving; action" },
  "open": { zh: "v. 打开；开业 adj. 开着的；开放的", en: "v. unfasten; start business adj. not closed; accessible" },
  "walk": { zh: "v. 走；步行 n. 步行；散步", en: "v. move on foot; go on foot n. act of walking; stroll" },
  "cover": { zh: "v. 覆盖；包括 n. 盖子；封面", en: "v. place over; include n. lid; front of book" },
  "start": { zh: "v. 开始；出发 n. 开始；起点", en: "v. begin; leave n. beginning; starting point" },
  "stop": { zh: "v. 停止；阻止 n. 停止；车站", en: "v. cease; prevent n. act of stopping; station" },
  "fire": { zh: "n. 火；火灾 v. 开火；解雇", en: "n. burning; conflagration v. shoot; dismiss" },
  "sound": { zh: "n. 声音；音响 v. 听起来 adj. 健全的", en: "n. noise v. seem adj. healthy" },
  "hold": { zh: "v. 握住；持有 n. 握住；控制", en: "v. grasp; possess n. grasp; control" },
  "back": { zh: "adv. 向后；回 n. 背部 v. 支持", en: "adv. toward rear n. rear part v. support" },
  "name": { zh: "n. 名字；名称 v. 命名；指定", en: "n. word identifying person v. give name to" }
};

function updateWithMergedDefinitions() {
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

  console.log('🔄 开始合并多词性释义...\n');

  files.forEach(file => {
    try {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      let updatedInFile = 0;

      data.words = data.words.map(wordEntry => {
        const wordLower = wordEntry.word.toLowerCase();
        const mergedDef = MERGED_DEFINITIONS[wordLower];

        if (mergedDef) {
          updatedInFile++;
          return {
            ...wordEntry,
            meaning: mergedDef
          };
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

  console.log(`\n✅ 总计更新: ${totalUpdated} 个词条（合并了多词性）`);
}

updateWithMergedDefinitions();
