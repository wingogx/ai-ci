import { translate } from 'google-translate-api-x';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// 配置
const BATCH_SIZE = 10; // 每批翻译数量
const DELAY_MS = 1000; // 每批之间的延迟
const SAVE_INTERVAL = 50; // 每翻译多少个保存一次

// 延迟函数
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 翻译单个单词
async function translateWord(word, englishMeaning) {
  try {
    // 优先翻译英文释义，如果没有则翻译单词本身
    const textToTranslate = englishMeaning && englishMeaning.length > 0
      ? englishMeaning.substring(0, 200) // 限制长度
      : word;

    const result = await translate(textToTranslate, { from: 'en', to: 'zh-CN' });
    return result.text;
  } catch (error) {
    console.error(`翻译失败: ${word}`, error.message);
    return null;
  }
}

// 批量翻译
async function translateBatch(words) {
  const results = [];
  for (const item of words) {
    const zh = await translateWord(item.word, item.meaning?.en);
    results.push({ ...item, zh });
    await delay(100); // 单个请求间小延迟
  }
  return results;
}

// 处理词库文件
async function processWordList(filePath) {
  console.log(`\n处理文件: ${filePath}`);

  // 读取文件
  const data = JSON.parse(readFileSync(filePath, 'utf-8'));
  const words = data.words;

  // 找出缺少中文释义的单词
  const needTranslate = words.filter(w =>
    !w.meaning?.zh || w.meaning.zh.trim() === ''
  );

  console.log(`总词数: ${words.length}`);
  console.log(`需要翻译: ${needTranslate.length}`);

  if (needTranslate.length === 0) {
    console.log('无需翻译');
    return;
  }

  let translated = 0;
  let failed = 0;

  // 分批处理
  for (let i = 0; i < needTranslate.length; i += BATCH_SIZE) {
    const batch = needTranslate.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(needTranslate.length / BATCH_SIZE);

    console.log(`批次 ${batchNum}/${totalBatches} (${i + 1}-${Math.min(i + BATCH_SIZE, needTranslate.length)})`);

    // 翻译这一批
    const results = await translateBatch(batch);

    // 更新原数据
    for (const result of results) {
      const original = words.find(w => w.id === result.id);
      if (original && result.zh) {
        if (!original.meaning) {
          original.meaning = { zh: '', en: '' };
        }
        original.meaning.zh = result.zh;
        translated++;
      } else {
        failed++;
      }
    }

    // 定期保存
    if ((i + BATCH_SIZE) % SAVE_INTERVAL === 0 || i + BATCH_SIZE >= needTranslate.length) {
      writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
      console.log(`  已保存 (成功: ${translated}, 失败: ${failed})`);
    }

    // 批次间延迟
    if (i + BATCH_SIZE < needTranslate.length) {
      await delay(DELAY_MS);
    }
  }

  // 最终保存
  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`\n完成! 成功: ${translated}, 失败: ${failed}`);
}

// 主函数
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // 默认处理 CET4 和 CET6
    const basePath = join(__dirname, '../src/data/words/china');
    await processWordList(join(basePath, 'cet4.json'));
    await processWordList(join(basePath, 'cet6.json'));
  } else {
    // 处理指定文件
    for (const file of args) {
      await processWordList(file);
    }
  }
}

main().catch(console.error);
