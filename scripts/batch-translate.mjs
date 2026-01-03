import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// 配置
const BATCH_SIZE = 50;  // 每批处理数量
const DELAY_BETWEEN_BATCHES = 60000;  // 批次间延迟 60 秒
const DELAY_BETWEEN_WORDS = 200;  // 单词间延迟
const PROGRESS_FILE = join(__dirname, '../.translate-progress.json');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 多个翻译源
const translators = [
  {
    name: 'MyMemory',
    translate: async (text) => {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|zh-CN`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.responseStatus === 200) return data.responseData?.translatedText;
      return null;
    }
  },
  {
    name: 'Lingva1',
    translate: async (text) => {
      const url = `https://lingva.ml/api/v1/en/zh/${encodeURIComponent(text)}`;
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const data = await res.json();
      return data.translation || null;
    }
  },
  {
    name: 'Lingva2',
    translate: async (text) => {
      const url = `https://lingva.lunar.icu/api/v1/en/zh/${encodeURIComponent(text)}`;
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const data = await res.json();
      return data.translation || null;
    }
  }
];

let currentTranslator = 0;
let consecutiveFails = 0;

async function translateWord(word, englishMeaning) {
  const text = englishMeaning && englishMeaning.length > 5
    ? englishMeaning.substring(0, 100)
    : word;

  // 尝试当前翻译源
  for (let attempt = 0; attempt < translators.length; attempt++) {
    const translator = translators[(currentTranslator + attempt) % translators.length];
    try {
      const result = await translator.translate(text);
      if (result && result.length > 0) {
        consecutiveFails = 0;
        return result;
      }
    } catch (e) {
      // 继续尝试下一个
    }
  }

  consecutiveFails++;
  // 切换到下一个翻译源
  currentTranslator = (currentTranslator + 1) % translators.length;
  return null;
}

// 保存进度
function saveProgress(progress) {
  writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

// 加载进度
function loadProgress() {
  if (existsSync(PROGRESS_FILE)) {
    return JSON.parse(readFileSync(PROGRESS_FILE, 'utf-8'));
  }
  return { completed: [], currentBatch: 0 };
}

// 处理单个词库文件
async function processFile(filePath, progress) {
  console.log(`\n处理: ${filePath}`);

  const data = JSON.parse(readFileSync(filePath, 'utf-8'));
  const words = data.words;

  // 找出需要翻译的
  const needTranslate = words.filter(w =>
    w.word.length >= 3 &&
    !progress.completed.includes(w.word) &&
    (!w.meaning?.zh || w.meaning.zh.trim() === '')
  );

  console.log(`需要翻译: ${needTranslate.length}`);

  let translated = 0;
  let failed = 0;

  // 分批处理
  const totalBatches = Math.ceil(needTranslate.length / BATCH_SIZE);

  for (let b = 0; b < totalBatches; b++) {
    const batch = needTranslate.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
    console.log(`\n批次 ${b + 1}/${totalBatches} (使用 ${translators[currentTranslator].name})`);

    for (const item of batch) {
      process.stdout.write(`  ${item.word}... `);

      const zh = await translateWord(item.word, item.meaning?.en);

      if (zh) {
        const original = words.find(w => w.id === item.id);
        if (original) {
          if (!original.meaning) original.meaning = { zh: '', en: '' };
          original.meaning.zh = zh;
          translated++;
          progress.completed.push(item.word);
          console.log(`✓ ${zh}`);
        }
      } else {
        failed++;
        console.log('✗');
      }

      await delay(DELAY_BETWEEN_WORDS);

      // 如果连续失败太多，暂停等待
      if (consecutiveFails >= 10) {
        console.log('\n连续失败，等待 30 秒...');
        await delay(30000);
        consecutiveFails = 0;
      }
    }

    // 保存文件和进度
    writeFileSync(filePath, JSON.stringify(data, null, 2));
    saveProgress(progress);
    console.log(`已保存 (成功: ${translated}, 失败: ${failed})`);

    // 批次间等待
    if (b < totalBatches - 1) {
      console.log(`等待 ${DELAY_BETWEEN_BATCHES / 1000} 秒后继续下一批...`);
      await delay(DELAY_BETWEEN_BATCHES);
    }
  }

  return { translated, failed };
}

async function main() {
  const progress = loadProgress();
  console.log(`已完成: ${progress.completed.length} 个单词`);

  const basePath = join(__dirname, '../src/data/words/china');

  // 处理 CET4
  const result4 = await processFile(join(basePath, 'cet4.json'), progress);

  // 处理 CET6
  const result6 = await processFile(join(basePath, 'cet6.json'), progress);

  console.log('\n=== 完成 ===');
  console.log(`CET4: 成功 ${result4.translated}, 失败 ${result4.failed}`);
  console.log(`CET6: 成功 ${result6.translated}, 失败 ${result6.failed}`);
}

main().catch(console.error);
