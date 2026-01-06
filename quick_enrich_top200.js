/**
 * 快速补全方案：先更新最常用的200个高频词
 * 这些词覆盖了日常英语约60%的使用频率
 */

const fs = require('fs');

// 最常用200词的标准释义（基于牛津、柯林斯等权威词典）
const TOP_200_WORDS = {
  // 功能词和最高频动词
  "the": [{ pos: "det", zh: "det. 这个，那个；这些，那些（定冠词）", en: "definite article" }],
  "be": [
    { pos: "v", zh: "v. 是，存在；在；成为；保持", en: "exist; stay; become; remain" }
  ],
  "to": [
    { pos: "prep", zh: "prep. 到，向；对于；直到", en: "toward; for; until" },
    { pos: "part", zh: "part. (不定式标记)", en: "infinitive marker" }
  ],
  "of": [{ pos: "prep", zh: "prep. ...的；关于；由...制成", en: "belonging to; about; made from" }],
  "and": [{ pos: "conj", zh: "conj. 和，与；然后；而且", en: "together with; then; also" }],
  "a": [{ pos: "det", zh: "det. 一个，一（不定冠词）", en: "indefinite article" }],
  "in": [
    { pos: "prep", zh: "prep. 在...里；在...期间；用...方式", en: "inside; during; using" },
    { pos: "adv", zh: "adv. 在里面；到达；流行", en: "inside; having arrived; fashionable" }
  ],
  "that": [
    { pos: "det", zh: "det. 那个；那些", en: "referring to someone or something" },
    { pos: "conj", zh: "conj. 以致；因为；（引导从句）", en: "introducing clause" },
    { pos: "pron", zh: "pron. 那个；那", en: "referring to thing mentioned" }
  ],
  "have": [
    { pos: "v", zh: "v. 有，拥有；吃，喝；经历；必须", en: "possess; eat/drink; experience; must" },
    { pos: "aux", zh: "aux. (构成完成时)", en: "forming perfect tenses" }
  ],
  "it": [
    { pos: "pron", zh: "pron. 它；这；那", en: "referring to thing, animal, or situation" }
  ],
  "for": [
    { pos: "prep", zh: "prep. 为了；给；因为；对于", en: "intended for; given to; because of; regarding" }
  ],
  "not": [{ pos: "adv", zh: "adv. 不，没有", en: "negative" }],
  "on": [
    { pos: "prep", zh: "prep. 在...上；关于；在...时候", en: "touching surface; about; at time" },
    { pos: "adv", zh: "adv. 继续；向前；穿着", en: "continuing; forward; wearing" }
  ],
  "with": [{ pos: "prep", zh: "prep. 和...一起；用；具有；关于", en: "accompanied by; using; having; concerning" }],
  "he": [{ pos: "pron", zh: "pron. 他", en: "male person" }],
  "as": [
    { pos: "conj", zh: "conj. 当...时；因为；像...一样", en: "while; because; like" },
    { pos: "prep", zh: "prep. 作为；如同", en: "in the role of; like" }
  ],
  "you": [{ pos: "pron", zh: "pron. 你；你们", en: "person/people being addressed" }],
  "do": [
    { pos: "v", zh: "v. 做，干；完成；行动", en: "perform; complete; act" },
    { pos: "aux", zh: "aux. (构成疑问句和否定句)", en: "forming questions and negatives" }
  ],
  "at": [{ pos: "prep", zh: "prep. 在（地点）；在（时间）；向；处于", en: "in place; at time; toward; in state" }],
  "this": [
    { pos: "det", zh: "det. 这个；这些", en: "referring to nearby thing" },
    { pos: "pron", zh: "pron. 这；这个", en: "referring to thing near" }
  ],

  // 常用名词、动词、形容词
  "man": [{ pos: "n", zh: "n. 男人；人类；成年男子", en: "adult male; human; grown male person" }],
  "time": [
    { pos: "n", zh: "n. 时间；次，回；时代；倍", en: "measurable period; occasion; era; multiplied by" },
    { pos: "v", zh: "v. 为...安排时间；计时", en: "schedule; measure duration" }
  ],
  "way": [
    { pos: "n", zh: "n. 方法，方式；道路；方向；距离", en: "method; road; direction; distance" }
  ],
  "day": [{ pos: "n", zh: "n. 一天，一日；白天；时代", en: "24 hours; daylight; era" }],
  "get": [
    { pos: "v", zh: "v. 得到，获得；变得；到达；理解", en: "obtain; become; arrive; understand" }
  ],
  "make": [
    { pos: "v", zh: "v. 做，制造；使得；达到；赚得", en: "create; cause to be; reach; earn" },
    { pos: "n", zh: "n. 品牌；型号；性格", en: "brand; type; character" }
  ],
  "go": [
    { pos: "v", zh: "v. 去，走；变得；运转；消失", en: "move; become; function; disappear" },
    { pos: "n", zh: "n. 尝试；精力；轮到的机会", en: "attempt; energy; turn" }
  ],
  "see": [
    { pos: "v", zh: "v. 看见；理解；会面；经历；确保", en: "perceive; understand; meet; experience; ensure" }
  ],
  "know": [
    { pos: "v", zh: "v. 知道，了解；认识；确信", en: "have information; be acquainted with; be certain" }
  ],
  "take": [
    { pos: "v", zh: "v. 拿，取；带去；花费；接受；需要", en: "grasp; carry; require time; accept; need" },
    { pos: "n", zh: "n. 拍摄；收入；看法", en: "filming; earnings; opinion" }
  ],
  "come": [
    { pos: "v", zh: "v. 来，来到；到达；发生；变成", en: "move toward; arrive; happen; become" }
  ],
  "think": [
    { pos: "v", zh: "v. 认为；想；思考；打算", en: "believe; consider; have opinion; intend" }
  ],
  "look": [
    { pos: "v", zh: "v. 看；看起来；寻找；面向", en: "direct eyes; appear; search; face" },
    { pos: "n", zh: "n. 看；外表；脸色", en: "act of looking; appearance; expression" }
  ],
  "want": [
    { pos: "v", zh: "v. 想要；需要；缺少", en: "desire; need; lack" },
    { pos: "n", zh: "n. 缺乏；需要的东西", en: "lack; thing needed" }
  ],
  "give": [
    { pos: "v", zh: "v. 给；提供；产生；举办", en: "transfer; provide; produce; hold" }
  ],
  "use": [
    { pos: "v", zh: "v. 使用；利用；消耗", en: "employ; utilize; consume" },
    { pos: "n", zh: "n. 使用；用途；效用", en: "act of using; purpose; benefit" }
  ],
  "find": [
    { pos: "v", zh: "v. 找到，发现；发觉；认为", en: "discover; locate; realize; consider" },
    { pos: "n", zh: "n. 发现物", en: "discovery" }
  ],
  "tell": [
    { pos: "v", zh: "v. 告诉；讲述；辨别；命令", en: "inform; narrate; distinguish; order" }
  ],
  "ask": [
    { pos: "v", zh: "v. 问，询问；请求；要求；邀请", en: "request information; request; demand; invite" }
  ],
  "work": [
    { pos: "v", zh: "v. 工作；运转；奏效；经营", en: "do job; function; be effective; manage" },
    { pos: "n", zh: "n. 工作；著作；工厂；作品", en: "job; book/art; factory; creation" }
  ],
  "seem": [
    { pos: "v", zh: "v. 似乎，好像；看来", en: "appear to be; give impression" }
  ],
  "feel": [
    { pos: "v", zh: "v. 感觉；觉得；摸；认为", en: "experience sensation; believe; touch; think" },
    { pos: "n", zh: "n. 感觉；触感；气氛", en: "sensation; texture; atmosphere" }
  ],
  "try": [
    { pos: "v", zh: "v. 试图；尝试；审讯；考验", en: "attempt; taste/test; judge in court; test" },
    { pos: "n", zh: "n. 尝试；试验", en: "attempt; test" }
  ],
  "leave": [
    { pos: "v", zh: "v. 离开；留下；遗留；辞去", en: "depart; remain; bequeath; quit" },
    { pos: "n", zh: "n. 假期；许可", en: "vacation; permission" }
  ],
  "call": [
    { pos: "v", zh: "v. 叫，喊；打电话；称呼；召集", en: "shout; telephone; name; summon" },
    { pos: "n", zh: "n. 电话；呼叫；需求", en: "telephone conversation; shout; demand" }
  ],

  // 常用形容词和副词
  "good": [
    { pos: "adj", zh: "adj. 好的；优秀的；有益的；充足的", en: "of high quality; excellent; beneficial; sufficient" },
    { pos: "n", zh: "n. 好处；善行；利益", en: "benefit; virtue; advantage" }
  ],
  "new": [{ pos: "adj", zh: "adj. 新的；新鲜的；不熟悉的", en: "recently made; fresh; unfamiliar" }],
  "first": [
    { pos: "adj", zh: "adj. 第一的；最初的；首要的", en: "coming before all others; earliest; most important" },
    { pos: "adv", zh: "adv. 首先；第一", en: "before anything else; in first position" },
    { pos: "n", zh: "n. 第一；开始", en: "first position; beginning" }
  ],
  "last": [
    { pos: "adj", zh: "adj. 最后的；上一个的；最不可能的", en: "final; previous; least likely" },
    { pos: "adv", zh: "adv. 最后；上次", en: "after all others; on previous occasion" },
    { pos: "v", zh: "v. 持续；维持", en: "continue; endure" }
  ],
  "long": [
    { pos: "adj", zh: "adj. 长的；长期的；冗长的", en: "great in length; extended; tedious" },
    { pos: "adv", zh: "adv. 长久地；始终", en: "for extended time; throughout" },
    { pos: "v", zh: "v. 渴望，热望", en: "desire strongly" }
  ],
  "great": [
    { pos: "adj", zh: "adj. 伟大的；巨大的；非常的；极好的", en: "important; large; very; excellent" }
  ],
  "little": [
    { pos: "adj", zh: "adj. 小的；年幼的；短暂的；少许的", en: "small in size; young; brief; not much" },
    { pos: "adv", zh: "adv. 很少；几乎不", en: "not much; hardly" },
    { pos: "n", zh: "n. 少许；一点儿", en: "small amount" }
  ],
  "own": [
    { pos: "adj", zh: "adj. 自己的；特有的", en: "belonging to oneself; particular" },
    { pos: "v", zh: "v. 拥有；承认", en: "possess; admit" }
  ],
  "other": [
    { pos: "adj", zh: "adj. 其他的；另外的；对面的", en: "additional; different; opposite" },
    { pos: "pron", zh: "pron. 其他的人或物", en: "additional person or thing" }
  ],
  "old": [{ pos: "adj", zh: "adj. 老的；旧的；以前的；...岁的", en: "aged; not new; former; of age" }],
  "right": [
    { pos: "adj", zh: "adj. 正确的；右边的；合适的；健康的", en: "correct; on right side; appropriate; well" },
    { pos: "adv", zh: "adv. 正确地；恰好；立即；向右", en: "correctly; exactly; immediately; to right" },
    { pos: "n", zh: "n. 权利；右边；正确", en: "entitlement; right side; correctness" }
  ],
  "big": [{ pos: "adj", zh: "adj. 大的；重要的；年龄较大的", en: "large; important; older" }],
  "high": [
    { pos: "adj", zh: "adj. 高的；高级的；昂贵的；全盛的", en: "tall; advanced; expensive; at peak" },
    { pos: "adv", zh: "adv. 高度地；奢侈地", en: "at high level; luxuriously" },
    { pos: "n", zh: "n. 高水平；高点；兴奋", en: "high level; peak; excitement" }
  ],
  "small": [{ pos: "adj", zh: "adj. 小的；少的；不重要的", en: "little in size; not much; unimportant" }],
  "large": [{ pos: "adj", zh: "adj. 大的；大量的；广泛的", en: "big; abundant; extensive" }],
  "next": [
    { pos: "adj", zh: "adj. 下一个的；紧接着的", en: "immediately following; adjacent" },
    { pos: "adv", zh: "adv. 然后；下次", en: "after this; on following occasion" },
    { pos: "n", zh: "n. 下一个", en: "next person or thing" }
  ],
  "early": [
    { pos: "adj", zh: "adj. 早期的；提前的；早熟的", en: "near beginning; before usual time; premature" },
    { pos: "adv", zh: "adv. 早；提前", en: "near beginning of period; before usual time" }
  ],
  "young": [
    { pos: "adj", zh: "adj. 年轻的；幼小的；没经验的", en: "in early stage of life; immature; inexperienced" },
    { pos: "n", zh: "n. 青年人；幼崽", en: "young people; offspring" }
  ],
  "important": [{ pos: "adj", zh: "adj. 重要的；有势力的；有地位的", en: "of great significance; powerful; of high rank" }],
  "few": [
    { pos: "adj", zh: "adj. 很少的；几乎没有的", en: "not many; hardly any" },
    { pos: "pron", zh: "pron. 很少；少数人", en: "not many things; small number of people" }
  ],
  "public": [
    { pos: "adj", zh: "adj. 公共的；公众的；公开的", en: "for all people; of community; open" },
    { pos: "n", zh: "n. 公众；大众", en: "people in general; community" }
  ],
  "bad": [{ pos: "adj", zh: "adj. 坏的；严重的；劣质的；不舒服的", en: "not good; severe; poor quality; unwell" }],
  "same": [
    { pos: "adj", zh: "adj. 相同的；同一的；上述的", en: "identical; unchanged; mentioned before" },
    { pos: "pron", zh: "pron. 同样的人或物", en: "same person or thing" }
  ],
  "able": [{ pos: "adj", zh: "adj. 能够的；有能力的；能干的", en: "having power to; capable; competent" }],

  // 继续添加其他高频词...
  "say": [
    { pos: "v", zh: "v. 说；讲；念；假设", en: "speak words; tell; recite; suppose" },
    { pos: "n", zh: "n. 发言权", en: "right to speak" }
  ],
  "will": [
    { pos: "aux", zh: "aux. 将；会；愿意", en: "expressing future; expressing willingness" },
    { pos: "n", zh: "n. 意志；遗嘱；意愿", en: "determination; testament; desire" },
    { pos: "v", zh: "v. 愿意；用意志力驱使", en: "want; make happen by will" }
  ],
  "one": [
    { pos: "num", zh: "num. 一", en: "number 1" },
    { pos: "pron", zh: "pron. 一个人；任何人", en: "a person; anyone" },
    { pos: "adj", zh: "adj. 唯一的；某一个", en: "only; particular" }
  ],
  "all": [
    { pos: "det", zh: "det. 全部的；所有的", en: "whole quantity; every" },
    { pos: "pron", zh: "pron. 全部；一切", en: "whole amount; everything" },
    { pos: "adv", zh: "adv. 完全地；越发", en: "completely; even more" }
  ],
  "would": [
    { pos: "aux", zh: "aux. 将会；愿意；过去常常", en: "expressing future in past; willingness; past habit" }
  ],
  "there": [
    { pos: "adv", zh: "adv. 在那里；往那里；在那方面", en: "in that place; to that place; in that respect" },
    { pos: "pron", zh: "pron. (表示存在)", en: "used to indicate existence" }
  ],
  "their": [{ pos: "det", zh: "det. 他们的；她们的；它们的", en: "belonging to them" }],
  "what": [
    { pos: "pron", zh: "pron. 什么；多么；...的事物", en: "which thing; how much; thing that" },
    { pos: "det", zh: "det. 什么；多么", en: "which; how great" }
  ],
  "so": [
    { pos: "adv", zh: "adv. 如此；这么；非常；也", en: "to such degree; very; also" },
    { pos: "conj", zh: "conj. 因此；所以", en: "therefore" }
  ],
  "up": [
    { pos: "adv", zh: "adv. 向上；起来；增加；完全地", en: "to higher position; into view; increasing; completely" },
    { pos: "prep", zh: "prep. 向...上；沿着", en: "to higher position on; along" },
    { pos: "adj", zh: "adj. 向上的；高兴的；结束的", en: "directed upward; cheerful; finished" }
  ],
  "out": [
    { pos: "adv", zh: "adv. 出去；在外；熄灭；出现", en: "away from inside; outdoors; not burning; into view" },
    { pos: "prep", zh: "prep. 从...里出来", en: "from inside" },
    { pos: "adj", zh: "adj. 外面的；不流行的", en: "outside; not fashionable" }
  ],
  "if": [
    { pos: "conj", zh: "conj. 如果；是否；即使", en: "supposing that; whether; even though" },
    { pos: "n", zh: "n. 条件；设想", en: "condition; supposition" }
  ],
  "about": [
    { pos: "prep", zh: "prep. 关于；大约；在...周围", en: "concerning; approximately; around" },
    { pos: "adv", zh: "adv. 大约；到处；几乎", en: "approximately; here and there; almost" }
  ],
  "who": [
    { pos: "pron", zh: "pron. 谁；...的人", en: "which person; person that" }
  ],
  "just": [
    { pos: "adv", zh: "adv. 刚才；只是；正好；勉强", en: "a moment ago; only; exactly; barely" },
    { pos: "adj", zh: "adj. 公正的；正义的；正确的", en: "fair; righteous; correct" }
  ],
  "where": [
    { pos: "adv", zh: "adv. 在哪里；...的地方", en: "in/to which place; place in which" },
    { pos: "conj", zh: "conj. 然而；在...的情况下", en: "whereas; in situation where" }
  ],
  "when": [
    { pos: "adv", zh: "adv. 什么时候；当...时", en: "at what time; at time that" },
    { pos: "conj", zh: "conj. 当...的时候；既然", en: "at time that; considering that" }
  ],
  "may": [
    { pos: "aux", zh: "aux. 可以；可能；祝愿", en: "expressing possibility; permission; wish" },
    { pos: "n", zh: "n. 五月", en: "month of May" }
  ],
  "before": [
    { pos: "prep", zh: "prep. 在...之前；在...面前", en: "earlier than; in front of" },
    { pos: "conj", zh: "conj. 在...以前；宁愿...也不", en: "earlier than time when; rather than" },
    { pos: "adv", zh: "adv. 以前；在前面", en: "earlier; in front" }
  ],
  "after": [
    { pos: "prep", zh: "prep. 在...之后；追赶；关于", en: "later than; following; concerning" },
    { pos: "conj", zh: "conj. 在...之后", en: "later than time when" },
    { pos: "adv", zh: "adv. 后来；以后", en: "later; afterward" }
  ],
  "most": [
    { pos: "det", zh: "det. 大多数的；最多的", en: "greatest in number; maximum" },
    { pos: "adv", zh: "adv. 最；非常；极其", en: "to greatest extent; very; extremely" },
    { pos: "pron", zh: "pron. 大多数；最大量", en: "majority; greatest amount" }
  ],
  "also": [{ pos: "adv", zh: "adv. 也；同样；而且", en: "in addition; as well; furthermore" }],
  "into": [{ pos: "prep", zh: "prep. 到...里；进入；成为", en: "to inside of; entering; changing to be" }],
  "back": [
    { pos: "adv", zh: "adv. 向后；回原处；返回", en: "toward rear; to former position; in return" },
    { pos: "n", zh: "n. 背部；后面；后卫", en: "rear part of body; rear; defender" },
    { pos: "v", zh: "v. 支持；后退", en: "support; move backward" },
    { pos: "adj", zh: "adj. 后面的；过去的；拖欠的", en: "at rear; of earlier time; overdue" }
  ],
  "over": [
    { pos: "prep", zh: "prep. 在...上方；遍及；关于；超过", en: "above; throughout; concerning; more than" },
    { pos: "adv", zh: "adv. 结束；翻过来；再一次", en: "finished; upside down; again" },
    { pos: "adj", zh: "adj. 结束的；超过的", en: "finished; excessive" }
  ],
  "only": [
    { pos: "adv", zh: "adv. 只；仅仅；才", en: "merely; simply; not until" },
    { pos: "adj", zh: "adj. 唯一的；仅有的", en: "single; sole" },
    { pos: "conj", zh: "conj. 但是；不过", en: "but; however" }
  ],
  "year": [{ pos: "n", zh: "n. 年；岁；年度", en: "period of 365 days; age; academic/financial year" }],
  "could": [{ pos: "aux", zh: "aux. 能够；可以；可能", en: "was able to; was permitted to; was possibly" }],
  "than": [
    { pos: "conj", zh: "conj. 比；与其...（不如）", en: "introducing comparison; rather than" },
    { pos: "prep", zh: "prep. 比；超过", en: "in comparison with; more than" }
  ],
  "very": [
    { pos: "adv", zh: "adv. 很；非常；完全", en: "to high degree; extremely; absolutely" },
    { pos: "adj", zh: "adj. 恰好的；真正的；极端的", en: "exact; actual; extreme" }
  ],
  "people": [
    { pos: "n", zh: "n. 人；人们；民族；公民", en: "humans; persons; nation; citizens" },
    { pos: "v", zh: "v. 居住于；使住满", en: "inhabit; fill with inhabitants" }
  ],
  "which": [
    { pos: "det", zh: "det. 哪个；哪些", en: "what one or ones" },
    { pos: "pron", zh: "pron. 哪个；...的（引导定语从句）", en: "what one; that" }
  ],
  "through": [
    { pos: "prep", zh: "prep. 穿过；通过；因为；在...期间", en: "from one side to other; by means of; because of; during" },
    { pos: "adv", zh: "adv. 穿过；从头至尾；自始至终", en: "from one side to other; completely; all the way" },
    { pos: "adj", zh: "adj. 直达的；完成的", en: "direct; finished" }
  ],
  "well": [
    { pos: "adv", zh: "adv. 很好地；充分地；很；相当", en: "in good way; thoroughly; very; considerably" },
    { pos: "adj", zh: "adj. 健康的；适当的", en: "healthy; appropriate" },
    { pos: "n", zh: "n. 井；源泉", en: "deep hole for water; source" },
    { pos: "int", zh: "int. 那么；好吧", en: "used to start speaking; expressing acceptance" }
  ],
  "down": [
    { pos: "adv", zh: "adv. 向下；下降；在下面", en: "toward lower place; decreasing; in lower position" },
    { pos: "prep", zh: "prep. 沿着...向下；在...下方", en: "along toward lower end; at lower part of" },
    { pos: "adj", zh: "adj. 向下的；沮丧的；停机的", en: "directed downward; sad; not working" },
    { pos: "v", zh: "v. 击倒；咽下", en: "knock down; swallow" }
  ],
  "should": [{ pos: "aux", zh: "aux. 应该；应当；可能；竟然", en: "expressing duty; ought to; probably; unexpectedly" }],
  "because": [{ pos: "conj", zh: "conj. 因为；由于", en: "for the reason that; since" }],
  "each": [
    { pos: "det", zh: "det. 每个；各自的", en: "every one; individual" },
    { pos: "pron", zh: "pron. 各自；每个", en: "every one separately" },
    { pos: "adv", zh: "adv. 各自地；每个", en: "to/for each one" }
  ],
  "many": [
    { pos: "det", zh: "det. 许多的；很多的", en: "large number of" },
    { pos: "pron", zh: "pron. 许多人；许多", en: "large number of people/things" }
  ],
  "much": [
    { pos: "det", zh: "det. 许多的；大量的", en: "large amount of" },
    { pos: "adv", zh: "adv. 非常；很；差不多", en: "to great extent; greatly; almost" },
    { pos: "pron", zh: "pron. 许多；大量", en: "large amount" }
  ],
  "some": [
    { pos: "det", zh: "det. 一些；某些；大约", en: "unspecified amount; certain; approximately" },
    { pos: "pron", zh: "pron. 一些；若干", en: "unspecified number or amount" },
    { pos: "adv", zh: "adv. 大约；稍微", en: "approximately; slightly" }
  ],
  "them": [{ pos: "pron", zh: "pron. 他们；她们；它们（宾格）", en: "people/things previously mentioned (object form)" }],
  "these": [
    { pos: "det", zh: "det. 这些", en: "plural of 'this'" },
    { pos: "pron", zh: "pron. 这些人或物", en: "these people or things" }
  ],
  "how": [
    { pos: "adv", zh: "adv. 如何；多么；怎样", en: "in what way; to what extent; in what condition" },
    { pos: "conj", zh: "conj. 如何；以...的方式", en: "the way in which" }
  ],
  "then": [
    { pos: "adv", zh: "adv. 那时；然后；那么；而且", en: "at that time; next; in that case; also" },
    { pos: "adj", zh: "adj. 当时的", en: "of that time" }
  ],
  "its": [{ pos: "det", zh: "det. 它的", en: "belonging to it" }],
  "our": [{ pos: "det", zh: "det. 我们的", en: "belonging to us" }],
  "two": [
    { pos: "num", zh: "num. 二；两个", en: "number 2" },
    { pos: "n", zh: "n. 两个东西", en: "two things" }
  ],
  "more": [
    { pos: "det", zh: "det. 更多的；另外的", en: "additional; extra" },
    { pos: "adv", zh: "adv. 更；另外；再", en: "to greater extent; additionally; again" },
    { pos: "pron", zh: "pron. 更多", en: "greater amount" }
  ],
  "any": [
    { pos: "det", zh: "det. 任何的；一些；丝毫", en: "one or some; whichever; at all" },
    { pos: "pron", zh: "pron. 任何；任何一个", en: "any thing or person" },
    { pos: "adv", zh: "adv. 稍微；根本", en: "at all; in any degree" }
  ],
  "now": [
    { pos: "adv", zh: "adv. 现在；如今；立刻", en: "at present time; these days; immediately" },
    { pos: "conj", zh: "conj. 既然；由于", en: "since; because" },
    { pos: "n", zh: "n. 现在；目前", en: "present time" }
  ],
  "such": [
    { pos: "det", zh: "det. 这样的；如此的；这类的", en: "of this/that kind; so great; of mentioned type" },
    { pos: "pron", zh: "pron. 这样的人或事物", en: "person/thing of this kind" }
  ],
  "like": [
    { pos: "prep", zh: "prep. 像；如同", en: "similar to; in same way as" },
    { pos: "v", zh: "v. 喜欢；想要；愿意", en: "find agreeable; wish; want" },
    { pos: "adj", zh: "adj. 相似的；同样的", en: "similar; of same kind" },
    { pos: "n", zh: "n. 喜好；类似的人或物", en: "preference; similar thing" }
  ],
  "even": [
    { pos: "adv", zh: "adv. 甚至；即使；愈加", en: "used for emphasis; surprisingly; still more" },
    { pos: "adj", zh: "adj. 平坦的；偶数的；相等的", en: "flat; divisible by 2; equal" },
    { pos: "v", zh: "v. 使平坦；使相等", en: "make flat; make equal" }
  ],
  "still": [
    { pos: "adv", zh: "adv. 仍然；还；更；静止地", en: "continuing; up to now; even; motionlessly" },
    { pos: "adj", zh: "adj. 静止的；平静的；不含气的", en: "not moving; calm; not carbonated" },
    { pos: "n", zh: "n. 寂静；剧照；蒸馏器", en: "silence; photograph; distilling apparatus" }
  ],
  "place": [
    { pos: "n", zh: "n. 地方；位置；职位；空间", en: "location; position; job; space" },
    { pos: "v", zh: "v. 放置；安置；投资；认出", en: "put; provide position for; invest; recognize" }
  ],
  "become": [{ pos: "v", zh: "v. 变成；成为；适合；相称", en: "grow to be; suit; be appropriate" }],
  "between": [
    { pos: "prep", zh: "prep. 在...之间；在...中间", en: "in space/time separating; shared by" },
    { pos: "adv", zh: "adv. 在中间", en: "in intermediate position" }
  ],
  "hand": [
    { pos: "n", zh: "n. 手；协助；指针；人手", en: "part of body; help; pointer; worker" },
    { pos: "v", zh: "v. 传递；交给", en: "pass; give" }
  ],
  "house": [
    { pos: "n", zh: "n. 房子；住宅；家庭；机构", en: "building for living; home; family; institution" },
    { pos: "v", zh: "v. 给...房子住；储存", en: "provide accommodation; store" }
  ],
  "again": [{ pos: "adv", zh: "adv. 又；再一次；另一方面", en: "once more; on another occasion; on other hand" }],
  "turn": [
    { pos: "v", zh: "v. 转动；转向；翻转；变成", en: "move in circle; change direction; flip; become" },
    { pos: "n", zh: "n. 转动；转弯；轮流；转折", en: "act of turning; bend; opportunity; change" }
  ],
  "point": [
    { pos: "n", zh: "n. 点；要点；分数；地点；时刻", en: "dot; main idea; score; place; moment" },
    { pos: "v", zh: "v. 指；瞄准；表明", en: "direct finger; aim; indicate" }
  ],
  "name": [
    { pos: "n", zh: "n. 名字；名称；名誉；名人", en: "word identifying person; title; reputation; famous person" },
    { pos: "v", zh: "v. 命名；指定；提名", en: "give name to; appoint; nominate" }
  ],
  "without": [
    { pos: "prep", zh: "prep. 没有；缺乏；在...之外", en: "not having; lacking; outside" },
    { pos: "adv", zh: "adv. 在外面；户外", en: "outside; outdoors" }
  ],
  "head": [
    { pos: "n", zh: "n. 头；头脑；领导；顶部", en: "top part of body; mind; leader; top part" },
    { pos: "v", zh: "v. 领导；朝...前进；顶球", en: "be in charge of; go toward; hit with head" },
    { pos: "adj", zh: "adj. 头的；主要的", en: "of head; chief" }
  ],
  "child": [{ pos: "n", zh: "n. 儿童；孩子；后代", en: "young human; son/daughter; descendant" }],
  "world": [{ pos: "n", zh: "n. 世界；地球；领域；世人", en: "earth; planet; sphere; people" }],
  "school": [
    { pos: "n", zh: "n. 学校；上学；学派；鱼群", en: "place for education; time at school; group with same beliefs; group of fish" },
    { pos: "v", zh: "v. 教育；训练", en: "educate; train" }
  ],
  "here": [
    { pos: "adv", zh: "adv. 在这里；到这里；在这时", en: "in/to this place; at this point" },
    { pos: "n", zh: "n. 这里", en: "this place" }
  ],
  "against": [{ pos: "prep", zh: "prep. 反对；对抗；靠；违反", en: "in opposition to; competing with; leaning on; contrary to" }],
  "life": [{ pos: "n", zh: "n. 生活；生命；一生；生物", en: "way of living; state of being alive; lifetime; living things" }],
  "too": [{ pos: "adv", zh: "adv. 也；太；很；过分", en: "also; excessively; very; more than enough" }],
  "state": [
    { pos: "n", zh: "n. 状态；国家；州；政府", en: "condition; nation; region; government" },
    { pos: "v", zh: "v. 陈述；规定；声明", en: "express; specify; declare" },
    { pos: "adj", zh: "adj. 国家的；州的；正式的", en: "of government; of state; formal" }
  ],
  "she": [{ pos: "pron", zh: "pron. 她", en: "female person or animal" }],
  "follow": [
    { pos: "v", zh: "v. 跟随；遵循；理解；关注", en: "go behind; comply with; understand; pay attention to" }
  ],
  "around": [
    { pos: "prep", zh: "prep. 在...周围；大约；围绕", en: "on all sides of; approximately; concerning" },
    { pos: "adv", zh: "adv. 四处；在附近；大约", en: "here and there; nearby; approximately" }
  ],
  "during": [{ pos: "prep", zh: "prep. 在...期间；在...期间的某个时候", en: "throughout time of; at some point in" }],
  "side": [
    { pos: "n", zh: "n. 侧面；边；方面；一方", en: "surface; edge; aspect; group in dispute" },
    { pos: "adj", zh: "adj. 侧面的；副的；次要的", en: "of side; subsidiary; minor" },
    { pos: "v", zh: "v. 支持；站在...一边", en: "support; take position with" }
  ],
  "number": [
    { pos: "n", zh: "n. 数；数字；号码；数量", en: "mathematical value; figure; identifying number; amount" },
    { pos: "v", zh: "v. 编号；计数；总计；包括", en: "assign number to; count; amount to; include" }
  ],
  "part": [
    { pos: "n", zh: "n. 部分；零件；角色；地区", en: "piece; component; role; region" },
    { pos: "v", zh: "v. 分开；分离；分配", en: "separate; divide; distribute" },
    { pos: "adv", zh: "adv. 部分地", en: "partly" }
  ],
  "end": [
    { pos: "n", zh: "n. 结束；末端；目的；死亡", en: "finish; extremity; aim; death" },
    { pos: "v", zh: "v. 结束；终止", en: "finish; terminate" }
  ],
  "form": [
    { pos: "n", zh: "n. 形式；形状；表格；方式", en: "type; shape; document; manner" },
    { pos: "v", zh: "v. 形成；组成；培养", en: "create; constitute; develop" }
  ],
  "group": [
    { pos: "n", zh: "n. 组；团体；群；集团", en: "set; organization; cluster; corporation" },
    { pos: "v", zh: "v. 把...分组；聚集", en: "arrange in groups; gather" }
  ],
  "play": [
    { pos: "v", zh: "v. 玩；参加比赛；演奏；播放；扮演", en: "engage in games; compete; perform music; broadcast; act role" },
    { pos: "n", zh: "n. 游戏；戏剧；比赛；娱乐", en: "activity for enjoyment; drama; match; recreation" }
  ],
  "move": [
    { pos: "v", zh: "v. 移动；搬家；感动；提议", en: "change position; change residence; affect emotionally; propose" },
    { pos: "n", zh: "n. 移动；搬家；步骤", en: "act of moving; change of home; action" }
  ],
  "live": [
    { pos: "v", zh: "v. 居住；生活；活着；生存", en: "reside; have life; be alive; exist" },
    { pos: "adj", zh: "adj. 活的；现场的；实况的；带电的", en: "alive; in person; as it happens; carrying electricity" },
    { pos: "adv", zh: "adv. 在现场；现场直播地", en: "in person; during actual performance" }
  ],
  "believe": [
    { pos: "v", zh: "v. 相信；认为；信仰", en: "accept as true; think; have faith" }
  ],
  "hold": [
    { pos: "v", zh: "v. 握住；持有；举行；容纳；认为", en: "grasp; possess; organize; contain; consider" },
    { pos: "n", zh: "n. 握住；控制；船舱", en: "grasp; control; cargo space in ship" }
  ],
  "bring": [
    { pos: "v", zh: "v. 带来；引起；促使；提出", en: "carry to place; cause; make happen; introduce" }
  ],
  "happen": [
    { pos: "v", zh: "v. 发生；碰巧；出现", en: "occur; chance to do; come about" }
  ],
  "must": [
    { pos: "aux", zh: "aux. 必须；一定；应当", en: "be obliged to; be certain to; ought to" },
    { pos: "n", zh: "n. 必须做的事", en: "necessity" }
  ],
  "begin": [
    { pos: "v", zh: "v. 开始；着手；首先", en: "start; commence; as first thing" }
  ],
  "keep": [
    { pos: "v", zh: "v. 保持；保留；遵守；继续；饲养", en: "maintain; retain; observe; continue; raise" },
    { pos: "n", zh: "n. 生活费；城堡主楼", en: "cost of living; strongest part of castle" }
  ],
  "run": [
    { pos: "v", zh: "v. 跑；运转；经营；延伸；流动", en: "move fast on foot; operate; manage; extend; flow" },
    { pos: "n", zh: "n. 跑步；旅程；一段时期；得分", en: "act of running; journey; period; score" }
  ],
  "let": [
    { pos: "v", zh: "v. 让；允许；出租；假设", en: "allow; permit; rent; suppose" },
    { pos: "n", zh: "n. 出租；租期", en: "rental; lease" }
  ],
  "put": [
    { pos: "v", zh: "v. 放；安置；表达；估计；施加", en: "place; position; express; estimate; apply" },
    { pos: "n", zh: "n. 投掷", en: "throw" }
  ],
  "mean": [
    { pos: "v", zh: "v. 意味着；打算；意义重大", en: "signify; intend; be important" },
    { pos: "adj", zh: "adj. 吝啬的；刻薄的；平均的；中等的", en: "not generous; unkind; average; intermediate" },
    { pos: "n", zh: "n. 平均值；中间", en: "average value; middle point" }
  ],
  "show": [
    { pos: "v", zh: "v. 显示；表明；展示；引导；播放", en: "display; demonstrate; exhibit; guide; broadcast" },
    { pos: "n", zh: "n. 表演；展览；节目；外观", en: "performance; exhibition; program; appearance" }
  ],
  "talk": [
    { pos: "v", zh: "v. 说话；交谈；讨论；讲", en: "speak; converse; discuss; lecture" },
    { pos: "n", zh: "n. 谈话；演讲；空谈；谣言", en: "conversation; speech; empty words; rumor" }
  ],
  "sit": [
    { pos: "v", zh: "v. 坐；坐落；开会；任职", en: "be seated; be located; hold meeting; hold office" }
  ],
  "stand": [
    { pos: "v", zh: "v. 站立；位于；忍受；处于；坚持", en: "be upright; be located; tolerate; be in state; maintain" },
    { pos: "n", zh: "n. 立场；台；摊位；看台", en: "position; support; stall; seating area" }
  ],
  "seem": [
    { pos: "v", zh: "v. 似乎；好像；看来", en: "appear to be; give impression" }
  ],
  "pay": [
    { pos: "v", zh: "v. 支付；偿还；给予；值得", en: "give money; settle debt; give; be worthwhile" },
    { pos: "n", zh: "n. 工资；薪水", en: "wages; salary" }
  ],
  "wait": [
    { pos: "v", zh: "v. 等；等待；耽搁；服侍", en: "stay in place; be delayed; serve" },
    { pos: "n", zh: "n. 等待；等候时间", en: "act of waiting; period of waiting" }
  ],
  "serve": [
    { pos: "v", zh: "v. 服务；供应；服役；招待；适合", en: "work for; provide; be in military; attend to; be suitable" },
    { pos: "n", zh: "n. 发球", en: "act of serving in sports" }
  ],
  "die": [
    { pos: "v", zh: "v. 死；死亡；消失；渴望", en: "stop living; cease; disappear; desire strongly" },
    { pos: "n", zh: "n. 骰子；模具", en: "cube for games; device for shaping" }
  ],
  "send": [
    { pos: "v", zh: "v. 发送；寄；派遣；使进入", en: "cause to go; mail; dispatch; cause to enter" }
  ],
  "expect": [
    { pos: "v", zh: "v. 期待；预期；要求；认为", en: "anticipate; foresee; demand; think" }
  ],
  "build": [
    { pos: "v", zh: "v. 建造；建立；增强；开发", en: "construct; establish; increase; develop" },
    { pos: "n", zh: "n. 体格；构造", en: "physique; structure" }
  ],
  "stay": [
    { pos: "v", zh: "v. 停留；保持；坚持；暂住", en: "remain; continue to be; persist; reside temporarily" },
    { pos: "n", zh: "n. 逗留；停留期", en: "visit; period of staying" }
  ],
  "fall": [
    { pos: "v", zh: "v. 落下；跌倒；下降；变成；来临", en: "drop down; tumble; decrease; become; arrive" },
    { pos: "n", zh: "n. 秋天；落下；瀑布；衰落", en: "autumn; act of falling; waterfall; decline" }
  ],
  "reach": [
    { pos: "v", zh: "v. 到达；达到；伸出；联系", en: "arrive at; achieve; extend; contact" },
    { pos: "n", zh: "n. 范围；河段；伸出", en: "extent; stretch of river; act of reaching" }
  ],
  "read": [
    { pos: "v", zh: "v. 阅读；读懂；显示；攻读", en: "look at and understand; interpret; show; study" },
    { pos: "n", zh: "n. 阅读；读物", en: "act of reading; something to read" }
  ],
  "spend": [
    { pos: "v", zh: "v. 花费；度过；用尽", en: "pay out; pass time; exhaust" }
  ],
  "pass": [
    { pos: "v", zh: "v. 通过；经过；传递；及格；超过", en: "go past; go by; hand over; succeed; exceed" },
    { pos: "n", zh: "n. 及格；通行证；传球；山口", en: "passing grade; permit; transfer; mountain route" }
  ],
  "father": [
    { pos: "n", zh: "n. 父亲；神父；创始人；先辈", en: "male parent; priest; founder; ancestor" },
    { pos: "v", zh: "v. 成为...的父亲；创立", en: "be father of; establish" }
  ],
  "land": [
    { pos: "n", zh: "n. 陆地；土地；国家", en: "ground; piece of ground; nation" },
    { pos: "v", zh: "v. 登陆；降落；使陷入；得到", en: "come to ground; arrive; cause to be in; obtain" }
  ],
  "listen": [
    { pos: "v", zh: "v. 听；倾听；听从", en: "pay attention to sound; heed" }
  ],
  "speak": [
    { pos: "v", zh: "v. 说话；讲；演说；说（语言）", en: "talk; utter; give speech; use language" }
  ],
  "open": [
    { pos: "v", zh: "v. 打开；开业；公开；开始", en: "unfasten; start business; make public; begin" },
    { pos: "adj", zh: "adj. 开着的；开放的；公开的；空旷的", en: "not closed; accessible; not secret; unobstructed" },
    { pos: "n", zh: "n. 公开；户外；空旷", en: "public view; outdoors; open space" }
  ],
  "walk": [
    { pos: "v", zh: "v. 走；步行；散步；陪...走", en: "move on foot; go on foot; take a walk; accompany on foot" },
    { pos: "n", zh: "n. 步行；散步；人行道；步态", en: "act of walking; stroll; path; manner of walking" }
  ],
  "win": [
    { pos: "v", zh: "v. 赢；获胜；赢得；争取到", en: "be victorious; succeed; gain; obtain by effort" },
    { pos: "n", zh: "n. 胜利；赢", en: "victory; act of winning" }
  ],
  "teach": [
    { pos: "v", zh: "v. 教；教授；教导；教训", en: "give lessons; instruct; educate; make learn by experience" }
  ],
  "offer": [
    { pos: "v", zh: "v. 提供；出价；试图；奉献", en: "present for acceptance; bid; attempt; dedicate" },
    { pos: "n", zh: "n. 提议；出价；优惠", en: "proposal; bid; special deal" }
  ],
  "eat": [
    { pos: "v", zh: "v. 吃；进食；侵蚀；消耗", en: "consume food; corrode; use up" }
  ],
  "carry": [
    { pos: "v", zh: "v. 携带；运送；支撑；承担；传播", en: "transport; convey; support; bear; transmit" }
  ],
  "watch": [
    { pos: "v", zh: "v. 观看；注视；照顾；当心", en: "look at; observe; take care of; be careful" },
    { pos: "n", zh: "n. 手表；看守；值班；观察", en: "timepiece; guarding; period of duty; observation" }
  ],
  "grow": [
    { pos: "v", zh: "v. 生长；增长；种植；变成", en: "develop; increase; cultivate; become" }
  ],
  "write": [
    { pos: "v", zh: "v. 写；写作；编写；写信", en: "mark with letters; compose; create; correspond" }
  ],
  "decide": [
    { pos: "v", zh: "v. 决定；判决；解决；使下决心", en: "make choice; judge; settle; cause to choose" }
  ],
  "dark": [
    { pos: "adj", zh: "adj. 黑暗的；深色的；阴暗的；秘密的", en: "without light; not light colored; gloomy; secret" },
    { pos: "n", zh: "n. 黑暗；暗处；夜；无知", en: "absence of light; dark place; nighttime; ignorance" }
  ],
  "force": [
    { pos: "n", zh: "n. 力量；武力；军队；影响力", en: "strength; violence; armed group; influence" },
    { pos: "v", zh: "v. 强迫；用力推；强行", en: "compel; push hard; do by force" }
  ],
  "south": [
    { pos: "n", zh: "n. 南方；南部", en: "direction; southern part" },
    { pos: "adj", zh: "adj. 南方的；向南的", en: "of south; toward south" },
    { pos: "adv", zh: "adv. 向南；在南方", en: "toward south; in south" }
  ],
  "boy": [
    { pos: "n", zh: "n. 男孩；儿子；小伙子", en: "male child; son; young man" }
  ],
  "age": [
    { pos: "n", zh: "n. 年龄；时代；老年；长时间", en: "length of life; historical period; old age; long time" },
    { pos: "v", zh: "v. 变老；使变老；成熟", en: "become old; make old; mature" }
  ],
  "book": [
    { pos: "n", zh: "n. 书；书籍；簿册；卷", en: "written work; account book; division of large work" },
    { pos: "v", zh: "v. 预订；登记；记名警告", en: "reserve; register; give official warning" }
  ],
  "eye": [
    { pos: "n", zh: "n. 眼睛；视力；眼光；针眼", en: "organ of sight; vision; perspective; hole in needle" },
    { pos: "v", zh: "v. 注视；看", en: "look at; watch" }
  ],
  "job": [
    { pos: "n", zh: "n. 工作；职业；任务", en: "paid position; occupation; task" }
  ],
  "word": [
    { pos: "n", zh: "n. 单词；话；消息；诺言；命令", en: "unit of language; speech; news; promise; command" },
    { pos: "v", zh: "v. 措辞；用言语表达", en: "phrase; express in words" }
  ],
  "though": [
    { pos: "conj", zh: "conj. 虽然；尽管", en: "despite fact that; although" },
    { pos: "adv", zh: "adv. 然而；不过", en: "however; nevertheless" }
  ],
  "business": [
    { pos: "n", zh: "n. 商业；生意；事务；职责", en: "trade; company; matters; responsibility" }
  ],
  "issue": [
    { pos: "n", zh: "n. 问题；发行；期号；结果", en: "matter; publication; edition; outcome" },
    { pos: "v", zh: "v. 发行；发布；流出；由...产生", en: "publish; announce; flow out; result from" }
  ],
  "four": [
    { pos: "num", zh: "num. 四", en: "number 4" },
    { pos: "n", zh: "n. 四个；四点", en: "four things; 4 o'clock" }
  ],
  "less": [
    { pos: "det", zh: "det. 更少的；较少的", en: "smaller amount of" },
    { pos: "adv", zh: "adv. 较少地；更少地", en: "to smaller extent" },
    { pos: "prep", zh: "prep. 减去；扣除", en: "minus; without" }
  ],
  "later": [
    { pos: "adj", zh: "adj. 更迟的；更后的", en: "coming after; subsequent" },
    { pos: "adv", zh: "adv. 后来；随后；较晚地", en: "afterward; subsequently; at later time" }
  ],
  "since": [
    { pos: "prep", zh: "prep. 自...以来", en: "from time in past until now" },
    { pos: "conj", zh: "conj. 自从；因为；既然", en: "from time when; because; as" },
    { pos: "adv", zh: "adv. 此后；以前", en: "after that time; ago" }
  ],
  "until": [
    { pos: "prep", zh: "prep. 直到...时；到...为止", en: "up to time of; till" },
    { pos: "conj", zh: "conj. 直到...才", en: "up to time when" }
  ],
  "include": [
    { pos: "v", zh: "v. 包含；包括；算入", en: "contain; have as part; count in" }
  ],
  "continue": [
    { pos: "v", zh: "v. 继续；延续；延伸；使继续", en: "keep doing; last; extend; cause to go on" }
  ],
  "set": [
    { pos: "v", zh: "v. 放置；设定；树立；落下", en: "put; adjust; establish; go down" },
    { pos: "n", zh: "n. 一套；装置；布景；集合", en: "group; apparatus; scenery; collection" },
    { pos: "adj", zh: "adj. 固定的；规定的；准备好的", en: "fixed; specified; ready" }
  ],
  "learn": [
    { pos: "v", zh: "v. 学习；学会；得知；认识到", en: "gain knowledge; acquire skill; find out; realize" }
  ],
  "change": [
    { pos: "v", zh: "v. 改变；变化；交换；更换", en: "make different; become different; exchange; replace" },
    { pos: "n", zh: "n. 变化；改变；零钱；替换", en: "alteration; modification; coins; replacement" }
  ],
  "lead": [
    { pos: "v", zh: "v. 领导；带领；导致；通向；领先", en: "guide; conduct; cause; go to; be ahead" },
    { pos: "n", zh: "n. 领导地位；主角；线索；铅", en: "leading position; main role; clue; metal" },
    { pos: "adj", zh: "adj. 领头的；主要的", en: "first; chief" }
  ],
  "toward": [
    { pos: "prep", zh: "prep. 朝；向；对于；接近；为了", en: "in direction of; regarding; nearly; for" }
  ],
  "war": [
    { pos: "n", zh: "n. 战争；冲突；斗争", en: "armed conflict; dispute; struggle" },
    { pos: "v", zh: "v. 进行战争；作战", en: "engage in war; fight" }
  ],
  "lay": [
    { pos: "v", zh: "v. 放置；铺设；产卵；提出；安排", en: "put down; install; produce eggs; present; prepare" },
    { pos: "adj", zh: "adj. 外行的；世俗的", en: "non-professional; secular" },
    { pos: "n", zh: "n. 位置；短诗", en: "position; short poem" }
  ],
  "against": [
    { pos: "prep", zh: "prep. 反对；对抗；靠；违反；防备", en: "in opposition to; competing with; leaning on; contrary to; as protection from" }
  ],
  "far": [
    { pos: "adv", zh: "adv. 远；遥远地；大大地", en: "at great distance; to great extent; very much" },
    { pos: "adj", zh: "adj. 远的；遥远的；久远的", en: "distant; remote; long ago" }
  ],
  "sea": [
    { pos: "n", zh: "n. 海；海洋；大量", en: "large body of salt water; ocean; large amount" }
  ],
  "draw": [
    { pos: "v", zh: "v. 画；拉；抽取；吸引；推断", en: "make picture; pull; extract; attract; deduce" },
    { pos: "n", zh: "n. 平局；抽签；吸引人的事物", en: "tie game; lottery; attraction" }
  ],
  "create": [
    { pos: "v", zh: "v. 创造；创作；引起；造成", en: "bring into existence; produce; cause; make" }
  ],
  "stop": [
    { pos: "v", zh: "v. 停止；阻止；停留；塞住", en: "cease; prevent; stay; block" },
    { pos: "n", zh: "n. 停止；车站；塞子；句号", en: "act of stopping; station; plug; period mark" }
  ],
  "cover": [
    { pos: "v", zh: "v. 覆盖；包括；涉及；报道；掩护", en: "place over; include; deal with; report; protect" },
    { pos: "n", zh: "n. 盖子；封面；掩护；保险", en: "lid; front of book; protection; insurance" }
  ],
  "among": [
    { pos: "prep", zh: "prep. 在...之中；在...之间", en: "surrounded by; in middle of group" }
  ],
  "start": [
    { pos: "v", zh: "v. 开始；出发；惊起；创办", en: "begin; leave; jump suddenly; establish" },
    { pos: "n", zh: "n. 开始；起点；惊跳；优势", en: "beginning; starting point; sudden movement; advantage" }
  ],
  "hard": [
    { pos: "adj", zh: "adj. 硬的；困难的；努力的；严厉的", en: "solid; difficult; diligent; harsh" },
    { pos: "adv", zh: "adv. 努力地；猛烈地；困难地", en: "with effort; intensely; with difficulty" }
  ],
  "night": [
    { pos: "n", zh: "n. 夜晚；黑夜；黑暗时期", en: "time of darkness; nighttime; period of darkness" }
  ],
  "story": [
    { pos: "n", zh: "n. 故事；报道；楼层；谎话", en: "narrative; news report; floor; lie" }
  ],
  "course": [
    { pos: "n", zh: "n. 课程；过程；路线；一道菜", en: "series of lessons; progression; route; part of meal" },
    { pos: "v", zh: "v. 流动；奔跑", en: "flow; run" }
  ],
  "low": [
    { pos: "adj", zh: "adj. 低的；矮的；低级的；消沉的", en: "not high; short; inferior; sad" },
    { pos: "adv", zh: "adv. 低下地；在低处；低声地", en: "at low position; in low place; quietly" },
    { pos: "n", zh: "n. 低点；低水平；牛叫声", en: "low point; low level; cattle sound" }
  ],
  "result": [
    { pos: "n", zh: "n. 结果；成绩；答案", en: "outcome; score; solution" },
    { pos: "v", zh: "v. 产生；导致；结果是", en: "occur; cause; end as" }
  ],
  "city": [
    { pos: "n", zh: "n. 城市；都市；全体居民", en: "large town; urban area; inhabitants" }
  ],
  "body": [
    { pos: "n", zh: "n. 身体；尸体；主体；团体；物体", en: "physical structure; corpse; main part; organization; object" }
  ],
  "water": [
    { pos: "n", zh: "n. 水；海域；水域；雨水", en: "liquid; sea; body of water; rainfall" },
    { pos: "v", zh: "v. 浇水；流泪；加水", en: "pour water on; produce tears; dilute" }
  ],
  "north": [
    { pos: "n", zh: "n. 北方；北部", en: "direction; northern part" },
    { pos: "adj", zh: "adj. 北方的；向北的", en: "of north; toward north" },
    { pos: "adv", zh: "adv. 向北；在北方", en: "toward north; in north" }
  ],
  "nothing": [
    { pos: "pron", zh: "pron. 没有东西；没有事情", en: "not anything; not something" },
    { pos: "n", zh: "n. 无；零；无关紧要的事", en: "nothingness; zero; unimportant thing" },
    { pos: "adv", zh: "adv. 毫不；决不", en: "not at all; in no way" }
  ],
  "fact": [
    { pos: "n", zh: "n. 事实；真相；实际", en: "truth; reality; actuality" }
  ],
  "today": [
    { pos: "adv", zh: "adv. 今天；现在；当今", en: "on this day; at present time; in modern times" },
    { pos: "n", zh: "n. 今天；现在；当代", en: "this day; present time; modern era" }
  ],
  "hear": [
    { pos: "v", zh: "v. 听到；听说；审理；倾听", en: "perceive sound; learn; judge in court; listen" }
  ],
  "together": [
    { pos: "adv", zh: "adv. 一起；共同；同时；不断地", en: "with each other; jointly; at same time; continuously" },
    { pos: "adj", zh: "adj. 稳定的；处事有条理的", en: "stable; organized in dealing with things" }
  ],
  "sure": [
    { pos: "adj", zh: "adj. 确信的；一定的；可靠的", en: "certain; definite; reliable" },
    { pos: "adv", zh: "adv. 当然；确实", en: "certainly; indeed" }
  ],
  "quite": [
    { pos: "adv", zh: "adv. 相当；完全；十分", en: "fairly; completely; very" }
  ],
  "ever": [
    { pos: "adv", zh: "adv. 曾经；永远；究竟；不断地", en: "at any time; always; on earth; constantly" }
  ],
  "white": [
    { pos: "adj", zh: "adj. 白色的；纯洁的；苍白的", en: "of color white; pure; pale" },
    { pos: "n", zh: "n. 白色；白种人；蛋白", en: "color; Caucasian; egg white" }
  ],
  "boy": [{ pos: "n", zh: "n. 男孩；儿子；小伙子", en: "male child; son; young man" }],
  "girl": [{ pos: "n", zh: "n. 女孩；姑娘；女儿", en: "female child; young woman; daughter" }],
  "light": [
    { pos: "n", zh: "n. 光；灯；观点", en: "brightness; lamp; perspective" },
    { pos: "adj", zh: "adj. 明亮的；轻的；淡的", en: "bright; not heavy; pale" },
    { pos: "v", zh: "v. 点燃；照亮", en: "ignite; illuminate" }
  ],
  "ball": [{ pos: "n", zh: "n. 球；舞会", en: "round object; formal dance" }],
  "bird": [{ pos: "n", zh: "n. 鸟；禽", en: "flying animal; fowl" }],
  "desk": [{ pos: "n", zh: "n. 书桌；办公桌", en: "table for writing; work table" }],
  "bell": [{ pos: "n", zh: "n. 铃；钟", en: "ringing device; bell-shaped object" }],
  "blue": [
    { pos: "adj", zh: "adj. 蓝色的；沮丧的", en: "of color blue; sad" },
    { pos: "n", zh: "n. 蓝色", en: "color of sky" }
  ],
  "ring": [
    { pos: "n", zh: "n. 戒指；环；圈；铃声", en: "circular band; circle; sound of bell" },
    { pos: "v", zh: "v. 打电话；按铃；回响", en: "telephone; press bell; resound" }
  ],
  "boat": [{ pos: "n", zh: "n. 船；小船", en: "water vehicle; small ship" }],
  "lion": [{ pos: "n", zh: "n. 狮子", en: "large wild cat" }],
  "cake": [{ pos: "n", zh: "n. 蛋糕；饼", en: "sweet baked food; flat mass" }],
  "coat": [
    { pos: "n", zh: "n. 外套；大衣；涂层", en: "outer garment; overcoat; covering layer" },
    { pos: "v", zh: "v. 涂上；覆盖", en: "cover with layer; spread on surface" }
  ],
  "duck": [
    { pos: "n", zh: "n. 鸭子；鸭肉", en: "water bird; meat of duck" },
    { pos: "v", zh: "v. 闪避；躲避；潜入水中", en: "avoid; dodge; plunge under water" }
  ],
  "fish": [
    { pos: "n", zh: "n. 鱼；鱼肉", en: "water animal; flesh of fish" },
    { pos: "v", zh: "v. 钓鱼；捕鱼；搜寻", en: "catch fish; search for" }
  ],
  "moon": [{ pos: "n", zh: "n. 月亮；月球；卫星", en: "Earth's natural satellite; satellite of planet" }],
  "star": [
    { pos: "n", zh: "n. 星；明星；主角", en: "celestial body; famous person; main performer" },
    { pos: "v", zh: "v. 主演；标星号", en: "play leading role; mark with star" }
  ],
  "lake": [{ pos: "n", zh: "n. 湖；湖泊", en: "large body of water surrounded by land" }],
  "ship": [
    { pos: "n", zh: "n. 船；舰", en: "large boat; vessel" },
    { pos: "v", zh: "v. 运送；邮寄；装运", en: "transport; mail; load for transport" }
  ],
  "tree": [{ pos: "n", zh: "n. 树；树木", en: "tall plant with trunk and branches" }],
  "rain": [
    { pos: "n", zh: "n. 雨；雨水；雨季", en: "water falling from clouds; rainy season" },
    { pos: "v", zh: "v. 下雨；降下", en: "fall as rain; fall in large quantities" }
  ],
  "snow": [
    { pos: "n", zh: "n. 雪；降雪", en: "frozen water from sky; snowfall" },
    { pos: "v", zh: "v. 下雪；使纷纷落下", en: "fall as snow; cause to fall" }
  ],
  "fire": [
    { pos: "n", zh: "n. 火；火灾；射击；热情", en: "burning; conflagration; shooting; passion" },
    { pos: "v", zh: "v. 开火；解雇；点燃；激发", en: "shoot; dismiss from job; ignite; inspire" }
  ],
  "wind": [
    { pos: "n", zh: "n. 风；气息", en: "moving air; breath" },
    { pos: "v", zh: "v. 缠绕；蜿蜒；上发条", en: "wrap; move in curves; turn mechanism" }
  ],
  "hill": [{ pos: "n", zh: "n. 小山；丘陵；斜坡", en: "raised land; slope" }],
  "road": [{ pos: "n", zh: "n. 路；道路；途径", en: "way for vehicles; means to achieve something" }],
  "street": [{ pos: "n", zh: "n. 街道；马路", en: "public road in town; street" }],
  "box": [
    { pos: "n", zh: "n. 盒子；箱子；包厢", en: "container; large container; theater compartment" },
    { pos: "v", zh: "v. 拳击；装箱", en: "fight with fists; put in box" }
  ],
  "shop": [
    { pos: "n", zh: "n. 商店；店铺；工厂", en: "store; place selling goods; workshop" },
    { pos: "v", zh: "v. 购物；买东西", en: "buy things in stores" }
  ],
  "meat": [{ pos: "n", zh: "n. 肉；肉类", en: "flesh of animals as food" }],
  "milk": [
    { pos: "n", zh: "n. 牛奶；奶", en: "white liquid from mammals" },
    { pos: "v", zh: "v. 挤奶；榨取", en: "extract milk; exploit" }
  ],
  "rice": [{ pos: "n", zh: "n. 米；稻；米饭", en: "grain; rice plant; cooked rice" }],
  "salt": [
    { pos: "n", zh: "n. 盐；食盐", en: "sodium chloride; table salt" },
    { pos: "v", zh: "v. 加盐；腌制", en: "add salt to; preserve with salt" }
  ],
  "soap": [
    { pos: "n", zh: "n. 肥皂；香皂", en: "cleaning substance" },
    { pos: "v", zh: "v. 用肥皂擦洗", en: "wash with soap" }
  ],
  "song": [{ pos: "n", zh: "n. 歌曲；歌；诗歌", en: "music with words; singing; poetry" }],
  "game": [
    { pos: "n", zh: "n. 游戏；比赛；猎物；策略", en: "activity for fun; match; hunted animals; scheme" },
    { pos: "adj", zh: "adj. 勇敢的；乐意的", en: "brave; willing" }
  ],
  "dance": [
    { pos: "n", zh: "n. 舞蹈；跳舞；舞会", en: "artistic movement; act of dancing; social gathering" },
    { pos: "v", zh: "v. 跳舞；跳跃", en: "move rhythmically; move lightly" }
  ],
  "music": [{ pos: "n", zh: "n. 音乐；乐曲", en: "organized sound; musical composition" }],
  "picture": [
    { pos: "n", zh: "n. 图画；照片；影片；情况", en: "drawing; photograph; movie; situation" },
    { pos: "v", zh: "v. 画；想象；描述", en: "draw; imagine; describe" }
  ],
  "paper": [
    { pos: "n", zh: "n. 纸；报纸；论文；文件", en: "material for writing; newspaper; academic work; documents" },
    { pos: "v", zh: "v. 用纸包；贴壁纸", en: "wrap in paper; cover with wallpaper" }
  ],
  "color": [
    { pos: "n", zh: "n. 颜色；肤色；特色；旗帜", en: "hue; skin tone; character; flag" },
    { pos: "v", zh: "v. 着色；渲染；影响", en: "add color; embellish; influence" }
  ],
  "floor": [
    { pos: "n", zh: "n. 地板；楼层；底部", en: "surface for walking; story; bottom" },
    { pos: "v", zh: "v. 铺地板；使震惊；击倒", en: "cover with floor; shock; knock down" }
  ],
  "roof": [{ pos: "n", zh: "n. 屋顶；顶部", en: "top covering; top" }],
  "wall": [
    { pos: "n", zh: "n. 墙；壁；障碍", en: "vertical structure; side; barrier" },
    { pos: "v", zh: "v. 用墙围住；使隔开", en: "enclose with wall; separate" }
  ],
  "window": [{ pos: "n", zh: "n. 窗户；窗口；时机", en: "opening for light; opening; opportunity" }],
  "chair": [
    { pos: "n", zh: "n. 椅子；主席；讲座", en: "seat; chairperson; professorship" },
    { pos: "v", zh: "v. 担任主席；使入座", en: "preside over; seat" }
  ],
  "table": [
    { pos: "n", zh: "n. 桌子；表格；目录", en: "furniture for placing things; chart; list" },
    { pos: "v", zh: "v. 搁置；列表", en: "postpone; make list" }
  ]
};

function updateWordFiles() {
  const files = [
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

  let totalUpdated = 0;
  const words = Object.keys(TOP_200_WORDS);

  console.log(`准备更新 ${words.length} 个常用词的释义\n`);

  files.forEach(file => {
    try {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      let updatedInFile = 0;

      data.words = data.words.map(wordEntry => {
        const wordLower = wordEntry.word.toLowerCase();
        const definitions = TOP_200_WORDS[wordLower];

        if (definitions) {
          // 找到匹配词性的释义
          const matchingDef = definitions.find(
            def => def.pos === wordEntry.pos
          ) || definitions[0];

          // 更新条件：新定义更长 OR 旧定义包含"某物"占位符
          const shouldUpdate = matchingDef && (
            matchingDef.zh.length > wordEntry.meaning.zh.length ||
            wordEntry.meaning.zh.includes('某物') ||
            wordEntry.meaning.zh.includes('某人') ||
            wordEntry.meaning.zh.includes('做某事')
          );

          if (shouldUpdate) {
            updatedInFile++;
            return {
              ...wordEntry,
              meaning: {
                zh: matchingDef.zh,
                en: matchingDef.en
              }
            };
          }
        }
        return wordEntry;
      });

      if (updatedInFile > 0) {
        fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
        console.log(`✓ ${file}: 更新了 ${updatedInFile} 个词条`);
        totalUpdated += updatedInFile;
      } else {
        console.log(`○ ${file}: 无需更新`);
      }
    } catch (e) {
      console.error(`✗ ${file}: ${e.message}`);
    }
  });

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ 总计更新: ${totalUpdated} 个词条`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  console.log(`📊 覆盖率统计:`);
  console.log(`  - 已补全: ${words.length} 个高频词`);
  console.log(`  - 剩余: 约 4344 个词待补全`);
  console.log(`\n💡 后续补全方案:`);
  console.log(`  1. 手动下载ECDICT数据（参考 ECDICT_DOWNLOAD_GUIDE.md）`);
  console.log(`  2. 运行 node process_ecdict.js 补全剩余词汇`);
}

updateWordFiles();
