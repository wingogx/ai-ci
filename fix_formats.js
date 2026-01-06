#!/usr/bin/env node
/**
 * 批量修复词库中的格式问题
 * 1. 移除多余空格
 * 2. 修复重复内容
 * 3. 清理HTML标签
 * 4. 统一分隔符
 */

const fs = require('fs');

const WORD_FILES = [
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

function cleanMeaning(meaning) {
  if (!meaning || typeof meaning !== 'string') return meaning;

  let cleaned = meaning;

  // 1. 移除HTML标签
  cleaned = cleaned.replace(/<[^>]+>/g, '');

  // 2. 清理多余空格
  cleaned = cleaned.replace(/\s{2,}/g, ' ');  // 多个空格变成一个
  cleaned = cleaned.replace(/\s*;\s*/g, '; '); // 统一分号前后空格
  cleaned = cleaned.replace(/\s*，\s*/g, '，'); // 中文逗号不需要空格
  cleaned = cleaned.replace(/\s*；\s*/g, '；'); // 中文分号不需要空格
  cleaned = cleaned.trim();

  // 3. 修复重复内容（检测重复的短语模式）
  // 例如: "n. dish；某物 n. dish；某物" -> "n. dish；某物"
  const parts = cleaned.split(/\s+/);
  if (parts.length >= 6) {
    // 检查是否前半部分=后半部分
    const mid = Math.floor(parts.length / 2);
    const first = parts.slice(0, mid).join(' ');
    const second = parts.slice(mid).join(' ');

    if (first === second) {
      cleaned = first;
    }
  }

  // 4. 移除转义字符
  cleaned = cleaned.replace(/\\n/g, ' ');
  cleaned = cleaned.replace(/\\r/g, '');
  cleaned = cleaned.replace(/\\t/g, ' ');

  // 5. 清理多余空格（再次）
  cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();

  return cleaned;
}

function fixFormats() {
  let stats = {
    files: 0,
    words: 0,
    fixed: 0,
    removedSpaces: 0,
    removedHTML: 0,
    removedDuplicates: 0,
  };

  console.log('开始批量修复格式问题...\n');

  WORD_FILES.forEach(file => {
    if (!fs.existsSync(file)) return;

    stats.files++;
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    let fixedInFile = 0;

    data.words = data.words.map(word => {
      stats.words++;

      const oldZh = word.meaning?.zh || '';
      const oldEn = word.meaning?.en || '';

      const newZh = cleanMeaning(oldZh);
      const newEn = cleanMeaning(oldEn);

      if (newZh !== oldZh || newEn !== oldEn) {
        stats.fixed++;
        fixedInFile++;

        // 统计修复类型
        if (oldZh !== newZh) {
          if (oldZh.includes('  ')) stats.removedSpaces++;
          if (/<[^>]+>/.test(oldZh)) stats.removedHTML++;

          // 检测重复
          const parts = oldZh.split(/\s+/);
          if (parts.length >= 6) {
            const mid = Math.floor(parts.length / 2);
            if (parts.slice(0, mid).join(' ') === parts.slice(mid).join(' ')) {
              stats.removedDuplicates++;
            }
          }
        }

        return {
          ...word,
          meaning: {
            zh: newZh,
            en: newEn,
          }
        };
      }

      return word;
    });

    if (fixedInFile > 0) {
      fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
      console.log(`✓ ${file}: 修复了 ${fixedInFile} 个词条`);
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log('修复统计:');
  console.log(`  处理文件: ${stats.files} 个`);
  console.log(`  总词数: ${stats.words}`);
  console.log(`  修复词条: ${stats.fixed} (${(stats.fixed / stats.words * 100).toFixed(2)}%)`);
  console.log(`    - 移除多余空格: ${stats.removedSpaces}`);
  console.log(`    - 移除HTML标签: ${stats.removedHTML}`);
  console.log(`    - 移除重复内容: ${stats.removedDuplicates}`);
  console.log('='.repeat(60));
}

fixFormats();
