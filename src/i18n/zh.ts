export const zh = {
  // 应用名称
  app: {
    name: '爱词鸭',
    slogan: '玩中学，轻松记单词',
    tagline: '玩中学，轻松记单词',
    copyright: '© 2024 爱词鸭 WordDuck',
  },

  // 首页
  home: {
    title: '爱词鸭',
    start: '开始挑战',
    continue: '继续挑战',
    level: '第 {level} 关',
    language: '语言',
    wordList: '词库',
    grade: '等级',
    stats: {
      wordsLearned: '已学单词',
      streakDays: '连续学习',
      days: '天',
      badges: '获得勋章',
      count: '枚',
    },
  },

  // 统计
  stats: {
    currentLevel: '当前关卡',
    wordsLearned: '已学单词',
    streakDays: '连续天数',
    progress: '学习进度',
    completed: '已完成',
  },

  // 词库模式
  wordListMode: {
    cefr: '国际标准 (CEFR)',
    china: '中国教材',
  },

  // CEFR 等级
  cefrLevels: {
    a1: 'A1 入门',
    a2: 'A2 初级',
    b1: 'B1 中级',
    b2: 'B2 中高级',
    c1: 'C1 高级',
    c2: 'C2 精通',
  },

  // 中国教材等级
  chinaLevels: {
    primary: '小学',
    junior: '初中',
    senior: '高中',
    cet4: '大学四级',
    cet6: '大学六级',
  },

  // 游戏页
  game: {
    level: '第 {level} 关',
    help: '帮助',
    helpCount: '剩余 {count} 次',
    replay: '重播发音',
    challengeLevel: '挑战关',
    challengeHint: '难度增加，单词更多！',
    correct: '正确！',
    incorrect: '再试一次',
    completed: '恭喜通关！',
    useHelp: '使用帮助',
    helpUsed: '已显示所有单词',
    helpWarning: '使用帮助后，本关单词不计入已学',
    noHelp: '没有帮助次数了',
  },

  // 设置页
  settings: {
    title: '设置',
    wordList: '词库',
    level: '等级',
    sound: '发音',
    vibrate: '震动反馈',
    clearData: '清除数据',
    clearDataConfirm: '确定要清除所有学习数据吗？此操作不可恢复。',
    clearSuccess: '数据已清除',
    about: '关于',
    version: '版本',
  },

  // 教程
  tutorial: {
    welcome: '欢迎来到爱词鸭！',
    step1: '听单词发音',
    step1Desc: '进入关卡后会自动播放所有单词的发音',
    step2: '拖动字母',
    step2Desc: '从下方字母池拖动字母到拼图中',
    step3: '完成拼图',
    step3Desc: '拼对所有单词即可过关',
    start: '开始挑战',
    skip: '跳过教程',
  },

  // 勋章
  badges: {
    iceBreaker: {
      name: '破冰者',
      description: '完成第一关',
    },
    risingStar: {
      name: '初露锋芒',
      description: '完成第5关',
    },
    wordHunter: {
      name: '词汇猎手',
      description: '学会100个单词',
    },
    persistent: {
      name: '坚持不懈',
      description: '连续学习7天',
    },
    challenger: {
      name: '挑战者',
      description: '完成10个挑战关',
    },
    master: {
      name: '词汇大师',
      description: '学会500个单词',
    },
  },

  // 通用
  common: {
    confirm: '确定',
    cancel: '取消',
    back: '返回',
    close: '关闭',
    loading: '加载中...',
    error: '出错了',
    retry: '重试',
    share: '分享',
    save: '保存',
  },

  // 认证
  auth: {
    login: '登录',
    loginTitle: '保存学习进度',
    loginSubtitle: '登录后可跨设备同步数据',
    loginWithWechat: '微信登录',
    loginWithGoogle: 'Google 登录',
    continueAsGuest: '暂不登录，继续游戏',
    loggingIn: '登录中...',
    loginFailed: '登录失败，请重试',
    wechatUnavailable: '微信登录暂不可用，请选择其他方式',
    termsHint: '登录即表示同意服务条款和隐私政策',
    or: '或',
    saveProgress: '保存进度',
    saveProgressHint: '登录后数据不会丢失',
    inviteReward: '邀请好友可获得帮助次数',
    setNickname: '设置昵称',
    nicknamePlaceholder: '输入你的昵称',
    nicknameHint: '最多20个字符，将显示在排行榜',
    nicknameEmpty: '昵称不能为空',
    nicknameTooLong: '昵称最多20个字符',
    nicknameFailed: '保存失败，请重试',
  },

  // 分享
  share: {
    title: '分享成就',
    badge: '分享勋章',
    stats: '分享成绩单',
    level: '分享通关',
    word: '分享单词',
    copyLink: '复制链接',
    copied: '已复制',
    download: '保存图片',
    downloading: '生成中...',
    scanToJoin: '扫码一起学',
    learnedWords: '已学 {count} 词',
    streakDays: '连续 {count} 天',
    beatPercent: '超越 {percent}% 学习者',
    inviteText: '我在「爱词鸭」学单词，一起来玩吧！',
    levelComplete: '第 {level} 关通过',
    gotBadge: '获得「{badge}」勋章',
  },

  // 排行榜
  ranking: {
    title: '排行榜',
    myRank: '我的排名',
    beatPercent: '已超越 {percent}% 的学习者',
    topLearners: '学习达人榜',
    noData: '暂无排名数据',
    you: '你',
  },

  // 邀请
  invite: {
    title: '邀请好友',
    myCode: '我的邀请码',
    copyCode: '复制邀请码',
    shareLink: '分享邀请链接',
    reward: '邀请奖励',
    rewardDesc: '好友注册：+1 帮助次数\n好友过5关：+2 帮助次数',
    invited: '已邀请 {count} 人',
    enterCode: '输入邀请码',
    enterCodeHint: '如果你是被朋友邀请来的',
    bind: '绑定',
    bindSuccess: '绑定成功，获得 +2 帮助次数',
    bindFailed: '邀请码无效',
    alreadyBound: '你已经绑定过邀请码了',
  },

  // 每日任务
  dailyTask: {
    title: '每日任务',
    completeLevel: '完成 {count} 关',
    learnWords: '学习 {count} 个新词',
    streak: '连续学习',
    reward: '奖励',
    helpCount: '+{count} 帮助次数',
    claim: '领取',
    claimed: '已领取',
    progress: '{current}/{target}',
  },
}

export default zh
