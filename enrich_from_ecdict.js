#!/usr/bin/env node
/**
 * 使用 ECDICT 词典批量改善单词释义
 *
 * 优势:
 * - 离线处理，速度快
 * - 包含77万+词条
 * - 数据质量高
 *
 * 使用方法:
 *   node enrich_from_ecdict.js [--dry-run] [--min-length=15]
 */

const fs = require('fs');
const readline = require('readline');

// ECDICT CSV 文件路径
const ECDICT_PATH = '/Users/win/Downloads/skywind3000-ECDICT-64b6edb/ecdict.csv';

// 词库文件列表
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

// 解析CSV行（处理引号内的逗号）
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);

  return result;
}

// 加载 ECDICT 词典（返回 Map）
async function loadECDICT() {
  console.log('📚 加载 ECDICT 词典...');

  if (!fs.existsSync(ECDICT_PATH)) {
    throw new Error(`ECDICT 文件不存在: ${ECDICT_PATH}`);
  }

  const dict = new Map();
  const fileStream = fs.createReadStream(ECDICT_PATH);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let lineNum = 0;
  for await (const line of rl) {
    lineNum++;
    if (lineNum === 1) continue; // 跳过表头

    const parts = parseCSVLine(line);
    if (parts.length < 4) continue;

    const [word, phonetic, definition, translation] = parts;

    if (word && translation) {
      // 清理translation中的\n为实际换行，然后合并多行
      const cleanTranslation = translation
        .replace(/\\n/g, '; ')  // 将\n替换为分号
        .replace(/\n/g, '; ')   // 将实际换行也替换为分号
        .replace(/;+/g, '; ')   // 多个分号合并
        .replace(/; $/, '')     // 去掉末尾分号
        .trim();

      const cleanDefinition = definition
        .replace(/\\n/g, '; ')
        .replace(/\n/g, '; ')
        .replace(/;+/g, '; ')
        .replace(/; $/, '')
        .trim();

      dict.set(word.toLowerCase(), {
        word,
        phonetic,
        zh: cleanTranslation,
        en: cleanDefinition,
      });
    }

    if (lineNum % 100000 === 0) {
      console.log(`  已加载 ${lineNum} 行...`);
    }
  }

  console.log(`✓ 加载完成! 共 ${dict.size} 个词条\n`);
  return dict;
}

// 检查释义是否有问题
function hasIssue(meaning, pos) {
  const zh = meaning?.zh || '';
  const en = meaning?.en || '';

  // 占位符
  if (zh.includes('详见词典') || zh.includes('见词典') || zh.includes('placeholder')) {
    return { type: 'placeholder', severity: 3 };
  }

  // 被截断
  if (zh.endsWith('...') || en.endsWith('...') || en.endsWith('(')) {
    return { type: 'truncated', severity: 2 };
  }

  // 过短（但排除一些本身就简单的词性）
  const simplePos = ['pron', 'art', 'int', 'det'];
  if (!simplePos.includes(pos) && zh.length > 0 && zh.length < 15) {
    return { type: 'too_short', severity: 1 };
  }

  return null;
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const minLengthArg = args.find(a => a.startsWith('--min-length='));
  const minLength = minLengthArg ? parseInt(minLengthArg.split('=')[1]) : 15;

  console.log('=' + '='.repeat(59));
  console.log('ECDICT 词典批量改善工具');
  console.log('=' + '='.repeat(59));
  console.log();

  // 加载 ECDICT 词典
  const ecdict = await loadECDICT();

  console.log('📊 扫描词库...\n');

  let stats = {
    total: 0,
    hasIssue: 0,
    foundInDict: 0,
    improved: 0,
    skipped: 0,
  };

  // 处理每个文件
  for (const file of WORD_FILES) {
    if (!fs.existsSync(file)) continue;

    console.log(`处理 ${file}...`);

    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    let updatedInFile = 0;

    data.words = data.words.map(wordEntry => {
      stats.total++;

      const issue = hasIssue(wordEntry.meaning, wordEntry.pos);
      if (!issue) return wordEntry;

      stats.hasIssue++;

      const wordLower = wordEntry.word.toLowerCase();
      const ecdictEntry = ecdict.get(wordLower);

      if (!ecdictEntry) {
        stats.skipped++;
        return wordEntry;
      }

      stats.foundInDict++;

      // 判断是否改善（新释义更长更详细）
      const oldZh = wordEntry.meaning?.zh || '';
      const newZh = ecdictEntry.zh;
      const newEn = ecdictEntry.en || wordEntry.meaning?.en || '';

      if (newZh.length >= minLength && newZh.length > oldZh.length) {
        stats.improved++;
        updatedInFile++;

        if (!dryRun) {
          return {
            ...wordEntry,
            meaning: {
              zh: newZh,
              en: newEn,
            }
          };
        } else {
          console.log(`  [DRY-RUN] ${wordEntry.word}:`);
          console.log(`    旧: ${oldZh}`);
          console.log(`    新: ${newZh}`);
        }
      }

      return wordEntry;
    });

    if (!dryRun && updatedInFile > 0) {
      fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
      console.log(`  ✓ 更新了 ${updatedInFile} 个词条`);
    } else if (dryRun && updatedInFile > 0) {
      console.log(`  [DRY-RUN] 将更新 ${updatedInFile} 个词条`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('统计报告:');
  console.log(`  总词数: ${stats.total}`);
  console.log(`  有问题: ${stats.hasIssue} (${(stats.hasIssue / stats.total * 100).toFixed(1)}%)`);
  console.log(`  词典中找到: ${stats.foundInDict}`);
  console.log(`  成功改善: ${stats.improved}`);
  console.log(`  跳过: ${stats.skipped}`);
  console.log('='.repeat(60));

  if (dryRun) {
    console.log('\n这是试运行模式，未修改任何文件。');
    console.log('运行 node enrich_from_ecdict.js 应用更改。');
  }
}

main().catch(console.error);
