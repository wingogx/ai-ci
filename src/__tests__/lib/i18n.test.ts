import { t, createT } from '@/i18n'

describe('国际化', () => {
  describe('t 函数', () => {
    test('中文翻译正确', () => {
      expect(t('app.name', 'zh')).toBe('爱词鸭')
    })

    test('英文翻译正确', () => {
      expect(t('app.name', 'en')).toBe('WordDuck')
    })

    test('嵌套键正确解析', () => {
      expect(t('home.stats.wordsLearned', 'zh')).toBe('已学单词')
      expect(t('home.stats.wordsLearned', 'en')).toBe('Words Learned')
    })

    test('缺失翻译返回key', () => {
      expect(t('nonexistent.key', 'zh')).toBe('nonexistent.key')
    })

    test('默认语言为中文', () => {
      expect(t('app.name')).toBe('爱词鸭')
    })

    test('插值参数正确替换', () => {
      expect(t('home.level', 'zh', { level: 5 })).toBe('第 5 关')
      expect(t('home.level', 'en', { level: 5 })).toBe('Level 5')
    })

    test('多个插值参数', () => {
      expect(t('game.helpCount', 'zh', { count: 3 })).toBe('剩余 3 次')
      expect(t('game.helpCount', 'en', { count: 3 })).toBe('3 left')
    })

    test('缺失插值参数保留占位符', () => {
      expect(t('home.level', 'zh')).toBe('第 {level} 关')
    })
  })

  describe('createT 函数', () => {
    test('创建中文翻译函数', () => {
      const tZh = createT('zh')
      expect(tZh('app.name')).toBe('爱词鸭')
      expect(tZh('home.level', { level: 10 })).toBe('第 10 关')
    })

    test('创建英文翻译函数', () => {
      const tEn = createT('en')
      expect(tEn('app.name')).toBe('WordDuck')
      expect(tEn('home.level', { level: 10 })).toBe('Level 10')
    })
  })

  describe('翻译完整性', () => {
    test('所有页面标题存在', () => {
      const keys = ['home.title', 'settings.title', 'tutorial.welcome']
      keys.forEach((key) => {
        expect(t(key, 'zh')).not.toBe(key)
        expect(t(key, 'en')).not.toBe(key)
      })
    })

    test('所有等级标签存在', () => {
      const cefrLevels = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2']
      cefrLevels.forEach((level) => {
        expect(t(`cefrLevels.${level}`, 'zh')).not.toBe(`cefrLevels.${level}`)
        expect(t(`cefrLevels.${level}`, 'en')).not.toBe(`cefrLevels.${level}`)
      })

      const chinaLevels = ['primary', 'junior', 'senior', 'cet4', 'cet6']
      chinaLevels.forEach((level) => {
        expect(t(`chinaLevels.${level}`, 'zh')).not.toBe(`chinaLevels.${level}`)
        expect(t(`chinaLevels.${level}`, 'en')).not.toBe(`chinaLevels.${level}`)
      })
    })

    test('所有通用按钮文本存在', () => {
      const buttons = ['confirm', 'cancel', 'back', 'close', 'retry', 'share', 'save']
      buttons.forEach((btn) => {
        expect(t(`common.${btn}`, 'zh')).not.toBe(`common.${btn}`)
        expect(t(`common.${btn}`, 'en')).not.toBe(`common.${btn}`)
      })
    })
  })
})
