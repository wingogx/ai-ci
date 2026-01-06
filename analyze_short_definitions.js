#!/usr/bin/env node
/**
 * 分析"过短"释义的质量
 * 区分哪些真的需要改善，哪些本身就应该简洁
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

// 真正有问题的释义特征
function isLowQuality(meaning, word, pos) {
  const zh = meaning?.zh || '';
  const en = meaning?.en || '';

  // 1. 包含占位符
  if (zh.includes('某物') || zh.includes('某种') || zh.includes('...的')) {
    return { issue: 'placeholder_残留', zh };
  }

  // 2. 格式错误（词性标注混乱）
  if (zh.startsWith('a. ') && pos !== 'adj') {
    return { issue: 'pos_mismatch', zh };
  }

  // 3. 过于简单（对于复杂词）
  const complexPos = ['v', 'n', 'adj'];
  if (complexPos.includes(pos) && word.length >= 5 && zh.length < 10) {
    return { issue: 'too_simple_for_complex_word', zh };
  }

  // 4. 只有一个词（如 "哭"、"跑"）- 对于多音节词这是有问题的
  if (word.length >= 4 && zh.length < 5 && !zh.includes('；') && !zh.includes(',')) {
    return { issue: 'single_char_for_long_word', zh };
  }

  return null;
}

// 合理的简短释义
function isReasonablyShort(meaning, word, pos) {
  const zh = meaning?.zh || '';

  // 1. 简单词性（代词、冠词、介词等）本来就应该简短
  const simplePos = ['pron', 'art', 'prep', 'conj', 'int', 'det'];
  if (simplePos.includes(pos)) {
    return true;
  }

  // 2. 短单词（≤3字母）的简短释义是合理的
  if (word.length <= 3) {
    return true;
  }

  // 3. 释义虽短但质量高（包含多个词性或用法）
  if (zh.includes('；') || zh.includes('，')) {
    return true;
  }

  return false;
}

function analyze() {
  const stats = {
    total: 0,
    short: 0,
    reasonablyShort: 0,
    needsImprovement: 0,
  };

  const issues = {
    placeholder_残留: [],
    pos_mismatch: [],
    too_simple_for_complex_word: [],
    single_char_for_long_word: [],
  };

  WORD_FILES.forEach(file => {
    if (!fs.existsSync(file)) return;

    const data = JSON.parse(fs.readFileSync(file, 'utf8'));

    data.words.forEach(word => {
      stats.total++;

      const zh = word.meaning?.zh || '';
      if (zh.length >= 15) return;

      stats.short++;

      // 检查是否合理简短
      if (isReasonablyShort(word.meaning, word.word, word.pos)) {
        stats.reasonablyShort++;
        return;
      }

      // 检查是否真的需要改善
      const issue = isLowQuality(word.meaning, word.word, word.pos);
      if (issue) {
        stats.needsImprovement++;
        issues[issue.issue].push({
          word: word.word,
          pos: word.pos,
          zh: issue.zh,
          file: file,
        });
      }
    });
  });

  console.log('=' + '='.repeat(59));
  console.log('释义质量分析报告');
  console.log('=' + '='.repeat(59));
  console.log();
  console.log(`总词数: ${stats.total}`);
  console.log(`短释义 (<15字): ${stats.short} (${(stats.short / stats.total * 100).toFixed(1)}%)`);
  console.log(`  - 合理简短: ${stats.reasonablyShort} (${(stats.reasonablyShort / stats.short * 100).toFixed(1)}%)`);
  console.log(`  - 需要改善: ${stats.needsImprovement} (${(stats.needsImprovement / stats.short * 100).toFixed(1)}%)`);
  console.log();

  console.log('需要改善的释义类型:');
  Object.keys(issues).forEach(type => {
    const count = issues[type].length;
    if (count > 0) {
      console.log(`\n【${type}】 ${count} 个`);
      issues[type].slice(0, 10).forEach(item => {
        console.log(`  ${item.word} (${item.pos}): "${item.zh}"`);
      });
      if (count > 10) {
        console.log(`  ... 还有 ${count - 10} 个`);
      }
    }
  });

  console.log('\n' + '='.repeat(60));
}

analyze();
