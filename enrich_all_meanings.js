#!/usr/bin/env node
/**
 * 批量改善单词释义质量
 *
 * 处理以下问题：
 * 1. 占位符释义（如"详见词典"）
 * 2. 过短的释义（<15字符）
 * 3. 被截断的释义（包含"..."）
 * 4. 格式混乱的释义
 *
 * 使用方法:
 *   node enrich_all_meanings.js [--scan-only] [--limit=50]
 *
 * 选项:
 *   --scan-only  仅扫描问题，不修复
 *   --limit=N    每次运行最多处理N个词（默认50）
 */

const fs = require('fs');
const https = require('https');
const { URL } = require('url');

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

// 进度文件
const PROGRESS_FILE = '.enrich_progress.json';

// 检查释义是否有问题
function hasIssue(meaning, pos) {
  const zh = meaning?.zh || '';
  const en = meaning?.en || '';

  // 占位符
  if (zh.includes('详见词典') || zh.includes('见词典') || zh.includes('placeholder')) {
    return { type: 'placeholder', zh, en };
  }

  // 过短（但排除代词、冠词等本身就很简单的词）
  const simplePos = ['pron', 'art', 'int', 'num', 'det'];
  if (!simplePos.includes(pos) && zh.length > 0 && zh.length < 15) {
    return { type: 'too_short', zh, en };
  }

  // 被截断
  if (zh.endsWith('...') || en.endsWith('...') || en.endsWith('(')) {
    return { type: 'truncated', zh, en };
  }

  return null;
}

// 扫描所有词库找出问题词
function scanIssues() {
  const issues = {
    placeholder: [],
    too_short: [],
    truncated: [],
  };

  let totalWords = 0;

  WORD_FILES.forEach(file => {
    if (!fs.existsSync(file)) return;

    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    totalWords += data.words.length;

    data.words.forEach(word => {
      const issue = hasIssue(word.meaning, word.pos);
      if (issue) {
        issues[issue.type].push({
          word: word.word,
          pos: word.pos,
          zh: issue.zh,
          en: issue.en,
          file: file,
        });
      }
    });
  });

  return { issues, totalWords };
}

// 从有道词典获取释义
function fetchYoudaoMeaning(word) {
  return new Promise((resolve, reject) => {
    const url = `https://dict.youdao.com/jsonapi?q=${encodeURIComponent(word)}`;

    https.get(url, { timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const result = { zh: null, en: null };

          // 获取中文释义
          const ec = json.ec?.word?.[0];
          if (ec?.trs) {
            const meanings = [];
            ec.trs.forEach(tr => {
              tr.tr?.forEach(t => {
                const text = t.l?.i?.[0];
                if (text) {
                  // 清理HTML标签
                  const clean = text.replace(/<[^>]+>/g, '');
                  meanings.push(clean);
                }
              });
            });
            if (meanings.length > 0) {
              result.zh = meanings.join('; ');
            }
          }

          // 获取英文释义
          const ee = json.ee?.word;
          if (ee?.trs) {
            const meanings = [];
            ee.trs.slice(0, 3).forEach(tr => {
              const pos = tr.pos || '';
              tr.tr?.forEach(t => {
                const text = t.l?.i;
                if (text) {
                  meanings.push(pos ? `${pos} ${text}` : text);
                }
              });
            });
            if (meanings.length > 0) {
              result.en = meanings.join('; ');
            }
          }

          resolve(result);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject).on('timeout', () => reject(new Error('Timeout')));
  });
}

// 等待指定毫秒数
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 加载进度
function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
  }
  return { processed: {}, stats: { success: 0, failed: 0, skipped: 0 } };
}

// 保存进度
function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), 'utf8');
}

// 更新单个文件中的词
function updateWordInFile(file, word, newMeaning) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  let updated = false;

  data.words = data.words.map(w => {
    if (w.word.toLowerCase() === word.toLowerCase()) {
      updated = true;
      return {
        ...w,
        meaning: {
          zh: newMeaning.zh || w.meaning?.zh || '',
          en: newMeaning.en || w.meaning?.en || '',
        }
      };
    }
    return w;
  });

  if (updated) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  }

  return updated;
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const scanOnly = args.includes('--scan-only');
  const limitArg = args.find(a => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 50;

  console.log('=' + '='.repeat(59));
  console.log('单词释义质量改善工具');
  console.log('=' + '='.repeat(59));

  console.log('\n📊 扫描词库...');
  const { issues, totalWords } = scanIssues();

  const totalIssues = issues.placeholder.length + issues.too_short.length + issues.truncated.length;

  console.log(`\n总词数: ${totalWords}`);
  console.log(`有问题的词: ${totalIssues} (${(totalIssues / totalWords * 100).toFixed(1)}%)`);
  console.log(`  - 占位符: ${issues.placeholder.length}`);
  console.log(`  - 过短: ${issues.too_short.length}`);
  console.log(`  - 被截断: ${issues.truncated.length}`);

  if (scanOnly) {
    console.log('\n问题词示例:');
    ['placeholder', 'too_short', 'truncated'].forEach(type => {
      if (issues[type].length > 0) {
        console.log(`\n【${type}】`);
        issues[type].slice(0, 5).forEach(item => {
          console.log(`  ${item.word} (${item.pos}): "${item.zh}"`);
        });
        if (issues[type].length > 5) {
          console.log(`  ... 还有 ${issues[type].length - 5} 个`);
        }
      }
    });
    return;
  }

  // 合并所有问题词并按优先级排序（占位符 > 被截断 > 过短）
  const allIssues = [
    ...issues.placeholder,
    ...issues.truncated,
    ...issues.too_short,
  ];

  // 加载进度
  const progress = loadProgress();
  const processed = progress.processed;

  // 过滤已处理的词
  const remaining = allIssues.filter(item => {
    const key = `${item.word}_${item.file}`;
    return !processed[key];
  });

  console.log(`\n已处理: ${Object.keys(processed).length} 个`);
  console.log(`待处理: ${remaining.length} 个`);

  if (remaining.length === 0) {
    console.log('\n✅ 所有问题已处理完成！');
    return;
  }

  const toProcess = remaining.slice(0, limit);
  console.log(`\n本次处理: ${toProcess.length} 个 (限制: ${limit})`);
  console.log(`预计时间: ${(toProcess.length * 0.5 / 60).toFixed(1)} 分钟\n`);

  let stats = { success: 0, failed: 0, skipped: 0 };

  for (let i = 0; i < toProcess.length; i++) {
    const item = toProcess[i];
    const key = `${item.word}_${item.file}`;

    try {
      console.log(`[${i + 1}/${toProcess.length}] ${item.word} (${item.pos})...`);

      // 获取新释义
      const newMeaning = await fetchYoudaoMeaning(item.word);

      if (newMeaning.zh || newMeaning.en) {
        // 更新文件
        const updated = updateWordInFile(item.file, item.word, newMeaning);

        if (updated) {
          console.log(`  ✓ zh: ${newMeaning.zh || '(无)'}`);
          console.log(`  ✓ en: ${(newMeaning.en || '(无)').substring(0, 60)}${newMeaning.en?.length > 60 ? '...' : ''}`);
          stats.success++;
          processed[key] = { ...newMeaning, timestamp: new Date().toISOString() };
        } else {
          console.log(`  ⚠ 未找到词条`);
          stats.skipped++;
          processed[key] = { skipped: true, timestamp: new Date().toISOString() };
        }
      } else {
        console.log(`  ✗ 未获取到释义`);
        stats.failed++;
        processed[key] = { failed: true, timestamp: new Date().toISOString() };
      }

      // 保存进度
      if ((i + 1) % 10 === 0 || i === toProcess.length - 1) {
        saveProgress({
          processed,
          stats: {
            success: progress.stats.success + stats.success,
            failed: progress.stats.failed + stats.failed,
            skipped: progress.stats.skipped + stats.skipped,
          },
          lastUpdate: new Date().toISOString(),
        });
      }

      // 延迟避免请求过快
      await sleep(500);

    } catch (error) {
      console.log(`  ✗ 错误: ${error.message}`);
      stats.failed++;
      processed[key] = { failed: true, error: error.message, timestamp: new Date().toISOString() };
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`完成! 成功: ${stats.success} | 失败: ${stats.failed} | 跳过: ${stats.skipped}`);
  console.log('='.repeat(60));

  if (remaining.length > toProcess.length) {
    console.log(`\n还有 ${remaining.length - toProcess.length} 个词待处理`);
    console.log(`运行 node enrich_all_meanings.js --limit=${limit} 继续处理`);
  }
}

// 运行
main().catch(console.error);
