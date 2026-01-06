#!/usr/bin/env node
/**
 * 修复释义内容重复问题
 */

const fs = require('fs');

const WORD_FILES = [
  'src/data/words/cefr/a1.json',
  'src/data/words/cefr/c1.json',
  'src/data/words/cefr/c2.json',
  'src/data/words/china/junior.json',
  'src/data/words/china/senior.json',
  'src/data/words/china/cet4.json',
  'src/data/words/china/cet6.json',
];

// 正确的定义
const CORRECT_DEFINITIONS = {
  'anything': {
    zh: 'pron. 任何事',
    en: 'Any object, act, state, event, or fact whatever; thing of any kind; something or other; aught; as, I would not do it for anything.'
  },
  'harbor': {
    zh: 'n. 港, 避难所; v. 庇护, 藏匿, (使)入港停泊',
    en: 'n. a place of refuge and comfort and security; v. maintain (a theory, thoughts, or feelings); v. secretly shelter (as of fugitives or criminals)'
  },
  'harbour': {
    zh: 'n. 港, 避难所; v. 庇护, 藏匿, (使)入港停泊',
    en: 'n. a place of refuge and comfort and security; v. maintain (a theory, thoughts, or feelings); v. secretly shelter (as of fugitives or criminals)'
  },
  'paralyze': {
    zh: 'vt. 使瘫痪, 使麻痹',
    en: 'v. make powerless and unable to function; v. cause to be paralyzed and immobile'
  },
  'paralyse': {
    zh: 'vt. 使瘫痪, 使麻痹',
    en: 'v. make powerless and unable to function; v. cause to be paralyzed and immobile'
  },
};

function hasDuplicate(meaning) {
  const zh = meaning?.zh || '';
  const en = meaning?.en || '';

  // 检查中文释义是否有重复（如 "pron. 事物；东西 pron. 事物；东西"）
  const zhParts = zh.split(/\s+/);
  if (zhParts.length >= 4) {
    const mid = Math.floor(zhParts.length / 2);
    const first = zhParts.slice(0, mid).join(' ');
    const second = zhParts.slice(mid).join(' ');
    if (first === second && first.length > 0) {
      return true;
    }
  }

  // 检查英文释义是否有重复
  const enParts = en.split(/\s+/);
  if (enParts.length >= 4) {
    const mid = Math.floor(enParts.length / 2);
    const first = enParts.slice(0, mid).join(' ');
    const second = enParts.slice(mid).join(' ');
    if (first === second && first.length > 0) {
      return true;
    }
  }

  return false;
}

function fixDuplicates() {
  let totalFixed = 0;

  console.log('开始修复重复内容...\n');

  WORD_FILES.forEach(file => {
    if (!fs.existsSync(file)) return;

    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    let fixedInFile = 0;

    data.words = data.words.map(word => {
      // 检查是否有已知的正确定义
      // 对于 "word1/word2" 形式的词，取第一个词查找
      const wordKey = word.word.split('/')[0];
      const correctDef = CORRECT_DEFINITIONS[wordKey] || CORRECT_DEFINITIONS[word.word];

      if (correctDef) {
        const oldZh = word.meaning?.zh || '';
        const oldEn = word.meaning?.en || '';

        // 如果当前定义有重复，使用正确定义
        if (hasDuplicate(word.meaning)) {
          fixedInFile++;
          totalFixed++;
          console.log(`  修复 ${word.word} (${file.split('/').pop()})`);
          console.log(`    旧: ${oldZh}`);
          console.log(`    新: ${correctDef.zh}`);

          return {
            ...word,
            meaning: {
              zh: correctDef.zh,
              en: correctDef.en,
            }
          };
        }
      }

      return word;
    });

    if (fixedInFile > 0) {
      fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
      console.log(`✓ ${file}: 修复了 ${fixedInFile} 个词条\n`);
    }
  });

  console.log('============================================================');
  console.log(`修复完成! 共修复 ${totalFixed} 个重复内容`);
  console.log('============================================================');
}

fixDuplicates();
