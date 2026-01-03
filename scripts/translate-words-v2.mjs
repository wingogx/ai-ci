import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// 配置
const BATCH_SIZE = 5; // 每批翻译数量
const DELAY_MS = 2000; // 每批之间的延迟
const SAVE_INTERVAL = 20; // 每翻译多少个保存一次

// 延迟函数
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 使用 MyMemory API 翻译（免费，无需 API key）
async function translateText(text) {
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|zh`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return data.responseData.translatedText;
    }
    return null;
  } catch (error) {
    console.error(`翻译失败: ${text.substring(0, 30)}...`, error.message);
    return null;
  }
}

// 翻译单个单词
async function translateWord(word, englishMeaning) {
  // 优先翻译英文释义，如果没有则翻译单词本身
  const textToTranslate = englishMeaning && englishMeaning.length > 3
    ? englishMeaning.substring(0, 150) // 限制长度
    : word;

  return await translateText(textToTranslate);
}

// 处理词库文件
async function processWordList(filePath) {
  console.log(`\n处理文件: ${filePath}`);

  // 读取文件
  const data = JSON.parse(readFileSync(filePath, 'utf-8'));
  const words = data.words;

  // 找出缺少中文释义的单词（排除太短的词）
  const needTranslate = words.filter(w =>
    w.word.length >= 3 && // 至少3个字母
    (!w.meaning?.zh || w.meaning.zh.trim() === '')
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

    process.stdout.write(`\r批次 ${batchNum}/${totalBatches} | 成功: ${translated} | 失败: ${failed}    `);

    // 翻译这一批
    for (const item of batch) {
      const zh = await translateWord(item.word, item.meaning?.en);

      // 更新原数据
      const original = words.find(w => w.id === item.id);
      if (original && zh) {
        if (!original.meaning) {
          original.meaning = { zh: '', en: '' };
        }
        original.meaning.zh = zh;
        translated++;
      } else {
        failed++;
      }

      await delay(300); // 单个请求间延迟
    }

    // 定期保存
    if (i % SAVE_INTERVAL === 0 || i + BATCH_SIZE >= needTranslate.length) {
      writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    }

    // 批次间延迟
    if (i + BATCH_SIZE < needTranslate.length) {
      await delay(DELAY_MS);
    }
  }

  // 最终保存
  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`\n\n完成! 成功: ${translated}, 失败: ${failed}`);
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
