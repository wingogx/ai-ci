import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// 配置
const BATCH_SIZE = 3;
const DELAY_MS = 1500;
const SAVE_INTERVAL = 15;

// Lingva Translate 实例列表（多个镜像）
const LINGVA_INSTANCES = [
  'https://lingva.ml',
  'https://lingva.lunar.icu',
  'https://translate.plausibility.cloud',
];

let currentInstance = 0;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 使用 Lingva Translate API
async function translateText(text) {
  const instance = LINGVA_INSTANCES[currentInstance % LINGVA_INSTANCES.length];

  try {
    const url = `${instance}/api/v1/en/zh/${encodeURIComponent(text)}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 10000,
    });

    if (!response.ok) {
      currentInstance++;
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.translation || null;
  } catch (error) {
    // 切换到下一个实例
    currentInstance++;
    return null;
  }
}

// 处理词库文件
async function processWordList(filePath) {
  console.log(`\n处理文件: ${filePath}`);

  const data = JSON.parse(readFileSync(filePath, 'utf-8'));
  const words = data.words;

  // 找出缺少中文释义的单词
  const needTranslate = words.filter(w =>
    w.word.length >= 3 &&
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
  let consecutiveFails = 0;

  for (let i = 0; i < needTranslate.length; i += BATCH_SIZE) {
    // 如果连续失败太多次，停止
    if (consecutiveFails > 30) {
      console.log('\n连续失败过多，暂停翻译');
      break;
    }

    const batch = needTranslate.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(needTranslate.length / BATCH_SIZE);

    process.stdout.write(`\r批次 ${batchNum}/${totalBatches} | 成功: ${translated} | 失败: ${failed}    `);

    for (const item of batch) {
      const textToTranslate = item.meaning?.en && item.meaning.en.length > 3
        ? item.meaning.en.substring(0, 100)
        : item.word;

      const zh = await translateText(textToTranslate);

      const original = words.find(w => w.id === item.id);
      if (original && zh) {
        if (!original.meaning) {
          original.meaning = { zh: '', en: '' };
        }
        original.meaning.zh = zh;
        translated++;
        consecutiveFails = 0;
      } else {
        failed++;
        consecutiveFails++;
      }

      await delay(500);
    }

    // 定期保存
    if (i % SAVE_INTERVAL === 0) {
      writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    }

    await delay(DELAY_MS);
  }

  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`\n\n完成! 成功: ${translated}, 失败: ${failed}`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    const basePath = join(__dirname, '../src/data/words/china');
    await processWordList(join(basePath, 'cet4.json'));
    await processWordList(join(basePath, 'cet6.json'));
  } else {
    for (const file of args) {
      await processWordList(file);
    }
  }
}

main().catch(console.error);
