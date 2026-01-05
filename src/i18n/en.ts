export const en = {
  // App name
  app: {
    name: 'WordDuck',
    slogan: 'Learn words through play',
    tagline: 'Learn words through play',
    copyright: '© 2024 WordDuck',
  },

  // Home page
  home: {
    title: 'WordDuck',
    start: 'Start Challenge',
    continue: 'Continue',
    level: 'Level {level}',
    language: 'Language',
    wordList: 'Word List',
    grade: 'Grade',
    stats: {
      wordsLearned: 'Words Learned',
      streakDays: 'Day Streak',
      days: 'days',
      badges: 'Badges',
      count: '',
    },
  },

  // Stats
  stats: {
    currentLevel: 'Current Level',
    wordsLearned: 'Words Learned',
    streakDays: 'Streak Days',
    progress: 'Progress',
    completed: 'completed',
  },

  // Word list modes
  wordListMode: {
    cefr: 'International (CEFR)',
    china: 'China Curriculum',
  },

  // CEFR levels
  cefrLevels: {
    a1: 'A1 Beginner',
    a2: 'A2 Elementary',
    b1: 'B1 Intermediate',
    b2: 'B2 Upper Intermediate',
    c1: 'C1 Advanced',
    c2: 'C2 Proficient',
  },

  // China curriculum levels
  chinaLevels: {
    primary: 'Primary School',
    junior: 'Junior High',
    senior: 'Senior High',
    cet4: 'CET-4',
    cet6: 'CET-6',
  },

  // Game page
  game: {
    level: 'Level {level}',
    help: 'Help',
    helpCount: '{count} left',
    replay: 'Replay',
    challengeLevel: 'Challenge Level',
    challengeHint: 'More words, more challenge!',
    correct: 'Correct!',
    incorrect: 'Try again',
    completed: 'Level Complete!',
    useHelp: 'Use Help',
    helpUsed: 'All words revealed',
    helpWarning: 'Words won\'t count as learned when using help',
    noHelp: 'No help remaining',
  },

  // Settings page
  settings: {
    title: 'Settings',
    wordList: 'Word List',
    level: 'Level',
    sound: 'Sound',
    vibrate: 'Vibration',
    clearData: 'Clear Data',
    clearDataConfirm: 'Are you sure you want to clear all learning data? This cannot be undone.',
    clearSuccess: 'Data cleared',
    about: 'About',
    version: 'Version',
  },

  // Tutorial
  tutorial: {
    welcome: 'Welcome to WordDuck!',
    step1: 'Listen to words',
    step1Desc: 'Words are pronounced when you enter a level',
    step2: 'Drag letters',
    step2Desc: 'Drag letters from the pool to the puzzle',
    step3: 'Complete the puzzle',
    step3Desc: 'Spell all words correctly to pass',
    start: 'Start Challenge',
    skip: 'Skip Tutorial',
  },

  // Badges
  badges: {
    iceBreaker: {
      name: 'Ice Breaker',
      description: 'Complete your first level',
    },
    risingStar: {
      name: 'Rising Star',
      description: 'Complete level 5',
    },
    wordHunter: {
      name: 'Word Hunter',
      description: 'Learn 100 words',
    },
    persistent: {
      name: 'Persistent',
      description: 'Learn for 7 days in a row',
    },
    challenger: {
      name: 'Challenger',
      description: 'Complete 10 challenge levels',
    },
    master: {
      name: 'Word Master',
      description: 'Learn 500 words',
    },
  },

  // Common
  common: {
    confirm: 'Confirm',
    cancel: 'Cancel',
    back: 'Back',
    close: 'Close',
    loading: 'Loading...',
    error: 'Error',
    retry: 'Retry',
    share: 'Share',
    save: 'Save',
  },

  // Authentication
  auth: {
    login: 'Sign In',
    loginTitle: 'Save Your Progress',
    loginSubtitle: 'Sign in to sync across devices',
    loginWithWechat: 'Sign in with WeChat',
    loginWithGoogle: 'Sign in with Google',
    continueAsGuest: 'Continue as Guest',
    loggingIn: 'Signing in...',
    loginFailed: 'Sign in failed, please try again',
    wechatUnavailable: 'WeChat sign in is not available, please try another method',
    termsHint: 'By signing in, you agree to our Terms and Privacy Policy',
    or: 'or',
    saveProgress: 'Save Progress',
    saveProgressHint: 'Your data will be safe after signing in',
    inviteReward: 'Invite friends to get help credits',
    setNickname: 'Set Nickname',
    nicknamePlaceholder: 'Enter your nickname',
    nicknameHint: 'Max 20 characters, shown on leaderboard',
    nicknameEmpty: 'Nickname cannot be empty',
    nicknameTooLong: 'Nickname cannot exceed 20 characters',
    nicknameFailed: 'Failed to save, please try again',
  },

  // Share
  share: {
    title: 'Share Achievement',
    badge: 'Share Badge',
    stats: 'Share Stats',
    level: 'Share Level',
    word: 'Share Word',
    copyLink: 'Copy Link',
    copied: 'Copied',
    download: 'Save Image',
    downloading: 'Generating...',
    scanToJoin: 'Scan to learn together',
    learnedWords: '{count} words learned',
    streakDays: '{count} day streak',
    beatPercent: 'Beat {percent}% of learners',
    inviteText: 'I\'m learning English with WordDuck, join me!',
    levelComplete: 'Level {level} Complete',
    gotBadge: 'Got "{badge}" Badge',
  },

  // Ranking
  ranking: {
    title: 'Leaderboard',
    myRank: 'My Rank',
    beatPercent: 'You beat {percent}% of learners',
    topLearners: 'Top Learners',
    noData: 'No ranking data yet',
    you: 'You',
  },

  // Invite
  invite: {
    title: 'Invite Friends',
    myCode: 'My Invite Code',
    copyCode: 'Copy Code',
    shareLink: 'Share Invite Link',
    reward: 'Invite Rewards',
    rewardDesc: 'Friend signs up: +1 help credit\nFriend reaches level 5: +2 help credits',
    invited: '{count} friends invited',
    enterCode: 'Enter Invite Code',
    enterCodeHint: 'If you were invited by a friend',
    bind: 'Apply',
    bindSuccess: 'Code applied! +2 help credits received',
    bindFailed: 'Invalid invite code',
    alreadyBound: 'You have already used an invite code',
  },

  // Daily Tasks
  dailyTask: {
    title: 'Daily Tasks',
    completeLevel: 'Complete {count} levels',
    learnWords: 'Learn {count} new words',
    streak: 'Keep streak going',
    reward: 'Reward',
    helpCount: '+{count} help credits',
    claim: 'Claim',
    claimed: 'Claimed',
    progress: '{current}/{target}',
  },
}

export default en
