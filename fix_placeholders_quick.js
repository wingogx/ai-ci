/**
 * 快速修复常见占位符
 * 针对代词、冠词等简单词汇，使用预定义的标准释义
 */

const fs = require('fs');

// 常见占位符词的标准释义（基于权威词典）
const STANDARD_DEFINITIONS = {
  // 代词 (pronouns)
  "i": { zh: "pron. 我（主格）", en: "first person singular pronoun" },
  "me": { zh: "pron. 我（宾格）", en: "objective case of I" },
  "my": { zh: "det. 我的（所有格）", en: "possessive form of I" },
  "you": { zh: "pron. 你；你们", en: "second person pronoun" },
  "your": { zh: "det. 你的；你们的", en: "possessive form of you" },
  "he": { zh: "pron. 他", en: "third person singular male pronoun" },
  "him": { zh: "pron. 他（宾格）", en: "objective case of he" },
  "his": { zh: "det./pron. 他的", en: "possessive form of he" },
  "she": { zh: "pron. 她", en: "third person singular female pronoun" },
  "her": { zh: "det./pron. 她的；她（宾格）", en: "possessive/objective form of she" },
  "it": { zh: "pron. 它；这；那", en: "third person singular neuter pronoun" },
  "its": { zh: "det. 它的", en: "possessive form of it" },
  "we": { zh: "pron. 我们", en: "first person plural pronoun" },
  "us": { zh: "pron. 我们（宾格）", en: "objective case of we" },
  "our": { zh: "det. 我们的", en: "possessive form of we" },
  "they": { zh: "pron. 他们；她们；它们", en: "third person plural pronoun" },
  "them": { zh: "pron. 他们；她们；它们（宾格）", en: "objective case of they" },
  "their": { zh: "det. 他们的；她们的；它们的", en: "possessive form of they" },
  "this": { zh: "det./pron. 这；这个", en: "demonstrative pronoun (near)" },
  "that": { zh: "det./pron. 那；那个", en: "demonstrative pronoun (far)" },
  "these": { zh: "det./pron. 这些", en: "plural of this" },
  "those": { zh: "det./pron. 那些", en: "plural of that" },
  "who": { zh: "pron. 谁；......的人", en: "interrogative/relative pronoun (person)" },
  "what": { zh: "pron./det. 什么；多么", en: "interrogative pronoun (thing)" },
  "which": { zh: "pron./det. 哪一个；哪些", en: "interrogative/relative pronoun (choice)" },
  "whose": { zh: "det./pron. 谁的", en: "possessive form of who" },

  // 冠词 (articles)
  "a": { zh: "det. 一个（不定冠词，用于辅音音素前）", en: "indefinite article (before consonant sound)" },
  "an": { zh: "det. 一个（不定冠词，用于元音音素前）", en: "indefinite article (before vowel sound)" },
  "the": { zh: "det. 这；那（定冠词）", en: "definite article" },

  // be动词变形
  "am": { zh: "v. 是（be 的第一人称单数现在时）", en: "first person singular present of be" },
  "is": { zh: "v. 是（be 的第三人称单数现在时）", en: "third person singular present of be" },
  "are": { zh: "v. 是（be 的复数现在时）", en: "plural present of be" },
  "was": { zh: "v. 是（be 的过去式，第一、三人称单数）", en: "past tense of be (singular)" },
  "were": { zh: "v. 是（be 的过去式，复数）", en: "past tense of be (plural)" },
  "been": { zh: "v. 是（be 的过去分词）", en: "past participle of be" },
  "being": { zh: "v. 是（be 的现在分词）; n. 存在；生物", en: "present participle of be; existence" },

  // 助动词
  "do": { zh: "v. 做；干；完成；进行 aux. （构成否定句、疑问句）", en: "perform action; auxiliary verb" },
  "does": { zh: "v. 做（do 的第三人称单数）", en: "third person singular of do" },
  "did": { zh: "v. 做（do 的过去式）", en: "past tense of do" },
  "have": { zh: "v. 有；拥有；经历 aux. （构成完成时）", en: "possess; auxiliary for perfect tense" },
  "has": { zh: "v. 有（have 的第三人称单数）", en: "third person singular of have" },
  "had": { zh: "v. 有（have 的过去式和过去分词）", en: "past tense and past participle of have" },
  "will": { zh: "aux. 将；会（表示将来）; n. 意志；遗嘱", en: "future auxiliary; willpower" },
  "would": { zh: "aux. 将会；愿意；过去常常", en: "past/conditional of will" },
  "can": { zh: "aux. 能；可以；会 n. 罐头", en: "be able to; tin container" },
  "could": { zh: "aux. 能够（can 的过去式）；可能", en: "past tense of can; possibility" },
  "may": { zh: "aux. 可能；可以；祝愿 n. 五月", en: "possibility; permission; May (month)" },
  "might": { zh: "aux. 可能（may 的过去式）；或许", en: "past tense of may; possibility" },
  "shall": { zh: "aux. 将；应该（正式用语）", en: "future/obligation (formal)" },
  "should": { zh: "aux. 应该；应当；可能", en: "obligation; expectation" },
  "must": { zh: "aux. 必须；一定；应当 n. 必需品", en: "necessity; strong obligation" },

  // 其他常见简单词
  "yes": { zh: "adv. 是的；对 n. 同意；赞成", en: "affirmative reply; agreement" },
  "no": { zh: "adv. 不；否 det. 没有 n. 否定；拒绝", en: "negative reply; not any" },
  "not": { zh: "adv. 不；没有（否定副词）", en: "negation adverb" },
  "ok": { zh: "adj./adv. 好的；可以 int. 行；好吧", en: "acceptable; all right" },
  "okay": { zh: "adj./adv. 好的；可以 int. 行；好吧", en: "acceptable; all right" },
  "hi": { zh: "int. 嗨；你好（非正式问候）", en: "informal greeting" },
  "hello": { zh: "int. 你好；喂（问候或引起注意）", en: "greeting or attention-getting" },
  "bye": { zh: "int. 再见（非正式告别）", en: "informal goodbye" },
  "goodbye": { zh: "int. 再见；告别 n. 告别", en: "farewell" },
  "please": { zh: "int. 请；拜托 v. 使高兴；使满意", en: "polite request; make happy" },
  "thanks": { zh: "int. 谢谢 n. 感谢（thank 的复数）", en: "expression of gratitude" },
  "sorry": { zh: "adj. 抱歉的；难过的 int. 对不起", en: "feeling regret; apology" },

  // 常见疑问副词
  "when": { zh: "adv./conj. 什么时候；当......时", en: "at what time; while" },
  "where": { zh: "adv./conj. 在哪里；......的地方", en: "at/to what place" },
  "why": { zh: "adv. 为什么 n. 原因", en: "for what reason" },
  "how": { zh: "adv. 如何；怎样；多么", en: "in what way; to what degree" },
};

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

function fixPlaceholders() {
  let totalUpdated = 0;

  console.log('🔧 开始修复占位符问题...\n');

  WORD_FILES.forEach(file => {
    try {
      if (!fs.existsSync(file)) return;

      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      let updatedInFile = 0;

      data.words = data.words.map(wordEntry => {
        const wordLower = wordEntry.word.toLowerCase();
        const meaning = wordEntry.meaning || {};
        const zh = meaning.zh || '';

        // 检查是否是占位符
        const isPlaceholder = zh.includes('详见词典') || zh.includes('见词典');

        if (isPlaceholder && STANDARD_DEFINITIONS[wordLower]) {
          updatedInFile++;
          return {
            ...wordEntry,
            meaning: STANDARD_DEFINITIONS[wordLower]
          };
        }
        return wordEntry;
      });

      if (updatedInFile > 0) {
        fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
        console.log(`✓ ${file}: 修复了 ${updatedInFile} 个占位符`);
        totalUpdated += updatedInFile;
      }
    } catch (e) {
      console.error(`✗ ${file}: ${e.message}`);
    }
  });

  console.log(`\n✅ 总计修复: ${totalUpdated} 个占位符\n`);
}

fixPlaceholders();
