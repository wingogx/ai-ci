#!/usr/bin/env node
/**
 * 全面检查词库质量
 * 检查所有可能的问题：占位符、截断、格式错误、数据缺失等
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

// 问题检测规则
const ISSUE_PATTERNS = {
  // 1. 占位符问题
  placeholder_dict: {
    name: '占位符-详见词典',
    test: (word) => {
      const zh = word.meaning?.zh || '';
      return zh.includes('详见词典') || zh.includes('见词典');
    }
  },
  placeholder_something: {
    name: '占位符-某物/某种',
    test: (word) => {
      const zh = word.meaning?.zh || '';
      return zh.includes('某物') || zh.includes('某种的') || zh.includes('某事');
    }
  },
  placeholder_ellipsis: {
    name: '占位符-省略号',
    test: (word) => {
      const zh = word.meaning?.zh || '';
      return zh.includes('...的');
    }
  },

  // 2. 截断问题
  truncated_zh: {
    name: '中文释义被截断',
    test: (word) => {
      const zh = word.meaning?.zh || '';
      return zh.endsWith('...') || zh.endsWith('…');
    }
  },
  truncated_en: {
    name: '英文释义被截断',
    test: (word) => {
      const en = word.meaning?.en || '';
      return en.endsWith('...') || en.endsWith('(') || en.endsWith('\\n');
    }
  },

  // 3. 数据缺失
  missing_zh: {
    name: '缺少中文释义',
    test: (word) => {
      const zh = word.meaning?.zh || '';
      return zh.trim().length === 0;
    }
  },
  missing_en: {
    name: '缺少英文释义',
    test: (word) => {
      const en = word.meaning?.en || '';
      return en.trim().length === 0;
    }
  },
  missing_phonetic: {
    name: '缺少音标',
    test: (word) => {
      return !word.phonetic || word.phonetic.trim().length === 0;
    }
  },

  // 4. 格式错误
  pos_mismatch: {
    name: '词性标注不匹配',
    test: (word) => {
      const zh = word.meaning?.zh || '';
      const pos = word.pos || '';

      // 检查释义开头是否与词性不符
      if (zh.startsWith('n. ') && pos !== 'n') return true;
      if (zh.startsWith('v. ') && (pos !== 'v' && pos !== 'vi' && pos !== 'vt')) return true;
      if (zh.startsWith('adj. ') && pos !== 'adj') return true;
      if (zh.startsWith('adv. ') && pos !== 'adv') return true;
      if (zh.startsWith('prep. ') && pos !== 'prep') return true;
      if (zh.startsWith('conj. ') && pos !== 'conj') return true;
      if (zh.startsWith('pron. ') && pos !== 'pron') return true;

      return false;
    }
  },
  invalid_pos: {
    name: '无效词性标注',
    test: (word) => {
      const validPos = ['n', 'v', 'adj', 'adv', 'prep', 'conj', 'pron', 'art', 'int', 'num', 'det',
                        'vi', 'vt', 'aux', 'mod', 'inf', 'interj', 'be-', 'do-', 'hav', 'phrasal verb',
                        'verb', 'adverb', 'adjective'];
      const pos = word.pos || '';
      return pos.length > 0 && !validPos.includes(pos);
    }
  },

  // 5. 质量问题
  too_short_complex: {
    name: '复杂词释义过短',
    test: (word) => {
      const zh = word.meaning?.zh || '';
      const simplePos = ['pron', 'art', 'int', 'det', 'num', 'be-', 'do-', 'hav'];

      // 复杂词（≥5字母）且非简单词性，释义少于10字
      return word.word.length >= 5 &&
             !simplePos.includes(word.pos) &&
             zh.length > 0 &&
             zh.length < 10;
    }
  },
  single_char_long_word: {
    name: '长单词只有单字释义',
    test: (word) => {
      const zh = word.meaning?.zh || '';
      // 4字母以上的词，释义少于5字且没有分号逗号
      return word.word.length >= 4 &&
             zh.length > 0 &&
             zh.length < 5 &&
             !zh.includes('；') &&
             !zh.includes('，');
    }
  },

  // 6. 特殊字符问题
  html_tags: {
    name: '包含HTML标签',
    test: (word) => {
      const zh = word.meaning?.zh || '';
      const en = word.meaning?.en || '';
      return /<[^>]+>/.test(zh) || /<[^>]+>/.test(en);
    }
  },
  strange_chars: {
    name: '包含异常字符',
    test: (word) => {
      const zh = word.meaning?.zh || '';
      // 检查是否有奇怪的转义字符
      return zh.includes('\\n') || zh.includes('\\r') || zh.includes('\\t');
    }
  },

  // 7. 重复问题
  duplicated_content: {
    name: '释义内容重复',
    test: (word) => {
      const zh = word.meaning?.zh || '';
      // 检查是否有明显的重复模式（如 "pron. （详见词典） pron. （详见词典）"）
      const parts = zh.split(/\s+/);
      if (parts.length >= 4) {
        for (let i = 0; i < parts.length - 3; i += 2) {
          if (parts[i] === parts[i + 2] && parts[i + 1] === parts[i + 3]) {
            return true;
          }
        }
      }
      return false;
    }
  },

  // 8. 空白问题
  excessive_spaces: {
    name: '多余空格',
    test: (word) => {
      const zh = word.meaning?.zh || '';
      return /\s{2,}/.test(zh) || zh.startsWith(' ') || zh.endsWith(' ');
    }
  }
};

function comprehensiveCheck() {
  const issueStats = {};
  const issueExamples = {};

  // 初始化统计
  Object.keys(ISSUE_PATTERNS).forEach(key => {
    issueStats[key] = 0;
    issueExamples[key] = [];
  });

  let totalWords = 0;
  let totalProblems = 0;
  const problematicWords = new Set();

  WORD_FILES.forEach(file => {
    if (!fs.existsSync(file)) return;

    const data = JSON.parse(fs.readFileSync(file, 'utf8'));

    data.words.forEach(word => {
      totalWords++;
      let hasIssue = false;

      // 检查所有问题模式
      Object.keys(ISSUE_PATTERNS).forEach(issueKey => {
        const pattern = ISSUE_PATTERNS[issueKey];
        if (pattern.test(word)) {
          issueStats[issueKey]++;
          hasIssue = true;

          // 保存示例（每种问题最多10个）
          if (issueExamples[issueKey].length < 10) {
            issueExamples[issueKey].push({
              word: word.word,
              pos: word.pos,
              zh: word.meaning?.zh || '',
              en: (word.meaning?.en || '').substring(0, 50),
              file: file.split('/').slice(-1)[0]
            });
          }
        }
      });

      if (hasIssue) {
        problematicWords.add(word.word);
        totalProblems++;
      }
    });
  });

  // 打印报告
  console.log('='.repeat(70));
  console.log('词库质量全面检查报告');
  console.log('='.repeat(70));
  console.log();
  console.log(`总词数: ${totalWords}`);
  console.log(`有问题的词条: ${totalProblems} (${(totalProblems / totalWords * 100).toFixed(2)}%)`);
  console.log(`唯一问题词: ${problematicWords.size}`);
  console.log();

  console.log('问题分类统计:');
  console.log('-'.repeat(70));

  // 按类别分组
  const categories = {
    '占位符问题': ['placeholder_dict', 'placeholder_something', 'placeholder_ellipsis'],
    '截断问题': ['truncated_zh', 'truncated_en'],
    '数据缺失': ['missing_zh', 'missing_en', 'missing_phonetic'],
    '格式错误': ['pos_mismatch', 'invalid_pos'],
    '质量问题': ['too_short_complex', 'single_char_long_word'],
    '特殊字符': ['html_tags', 'strange_chars'],
    '重复问题': ['duplicated_content'],
    '空白问题': ['excessive_spaces']
  };

  Object.keys(categories).forEach(category => {
    console.log(`\n【${category}】`);
    let categoryTotal = 0;

    categories[category].forEach(issueKey => {
      const count = issueStats[issueKey];
      categoryTotal += count;
      const pattern = ISSUE_PATTERNS[issueKey];

      if (count > 0) {
        console.log(`  ${pattern.name}: ${count} 个`);
      }
    });

    if (categoryTotal === 0) {
      console.log('  ✓ 无问题');
    }
  });

  // 打印详细示例
  console.log('\n' + '='.repeat(70));
  console.log('问题示例 (每类最多10个):');
  console.log('='.repeat(70));

  Object.keys(categories).forEach(category => {
    const issues = categories[category];
    let hasExamples = false;

    issues.forEach(issueKey => {
      const examples = issueExamples[issueKey];
      if (examples.length > 0) {
        if (!hasExamples) {
          console.log(`\n【${category}】`);
          hasExamples = true;
        }

        const pattern = ISSUE_PATTERNS[issueKey];
        console.log(`\n${pattern.name}:`);
        examples.forEach((ex, idx) => {
          console.log(`  ${idx + 1}. ${ex.word} (${ex.pos}) [${ex.file}]`);
          console.log(`     中文: "${ex.zh}"`);
          if (ex.en) console.log(`     英文: "${ex.en}..."`);
        });
      }
    });
  });

  console.log('\n' + '='.repeat(70));

  // 生成修复建议
  const criticalIssues =
    issueStats.placeholder_dict +
    issueStats.placeholder_something +
    issueStats.truncated_zh +
    issueStats.missing_zh;

  console.log('\n修复建议:');
  if (criticalIssues > 0) {
    console.log(`  ⚠️  严重问题: ${criticalIssues} 个（占位符、截断、缺失）`);
    console.log('  建议: 优先使用 ECDICT 或网络 API 修复');
  }

  const minorIssues = totalProblems - criticalIssues;
  if (minorIssues > 0) {
    console.log(`  ℹ️  次要问题: ${minorIssues} 个（格式、空格等）`);
    console.log('  建议: 可通过脚本批量清理');
  }

  if (totalProblems === 0) {
    console.log('  ✅ 词库质量优秀，无需修复！');
  }

  console.log('='.repeat(70));
}

comprehensiveCheck();
