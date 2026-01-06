#!/usr/bin/env node
/**
 * 测试城市名称转换功能
 * 验证拼音转中文是否正常工作
 */

// 模拟 cityMapping.ts 的功能（简化版）
const CITY_NAME_MAPPING = {
  'Beijing': '北京',
  'Shanghai': '上海',
  'Tianjin': '天津',
  'Chongqing': '重庆',
  'Guangzhou': '广州',
  'Shenzhen': '深圳',
  'Shenyang': '沈阳',
  'Hangzhou': '杭州',
  'Wuhan': '武汉',
  'Chengdu': '成都',
  'Nanjing': '南京',
  'Xian': '西安',
  "Xi'an": '西安',
  'Dalian': '大连',
  'Qingdao': '青岛',
  'Jinan': '济南',
  'Harbin': '哈尔滨',
  'Changchun': '长春',
  'Zhengzhou': '郑州',
  'Changsha': '长沙',
  'Hong Kong': '香港',
  'Hongkong': '香港',
  'Macau': '澳门',
  'Colorado Springs': 'Colorado Springs', // 保持不变
}

function convertToChineseCity(city) {
  if (!city) return null

  const trimmed = city.trim()

  // 如果是拼音，查找映射表
  if (/[a-zA-Z]/.test(trimmed)) {
    const chinese = CITY_NAME_MAPPING[trimmed]
    if (chinese) {
      return chinese
    }
    console.warn(`⚠️  未找到城市拼音映射: ${trimmed}`)
    return trimmed
  }

  // 如果已经是中文，移除"市"后缀
  return trimmed.replace(/市$/, '')
}

// 测试用例
const testCases = [
  // 拼音城市
  { input: 'Beijing', expected: '北京' },
  { input: 'Shanghai', expected: '上海' },
  { input: 'Shenyang', expected: '沈阳' },
  { input: 'Guangzhou', expected: '广州' },
  { input: 'Shenzhen', expected: '深圳' },

  // 中文城市（带市）
  { input: '沈阳市', expected: '沈阳' },
  { input: '北京市', expected: '北京' },
  { input: '天津市', expected: '天津' },
  { input: '广州市', expected: '广州' },

  // 中文城市（不带市）
  { input: '北京', expected: '北京' },
  { input: '上海', expected: '上海' },

  // 特殊情况
  { input: 'Colorado Springs', expected: 'Colorado Springs' },
  { input: 'Hong Kong', expected: '香港' },
  { input: null, expected: null },
  { input: '', expected: null },
]

console.log('=' .repeat(70))
console.log('城市名称转换测试')
console.log('='.repeat(70))
console.log()

let passed = 0
let failed = 0

testCases.forEach((testCase, index) => {
  const result = convertToChineseCity(testCase.input)
  const success = result === testCase.expected

  if (success) {
    passed++
    console.log(`✓ 测试 ${index + 1}: "${testCase.input}" → "${result}"`)
  } else {
    failed++
    console.log(`✗ 测试 ${index + 1}: "${testCase.input}"`)
    console.log(`  期望: "${testCase.expected}"`)
    console.log(`  实际: "${result}"`)
  }
})

console.log()
console.log('='.repeat(70))
console.log(`测试结果: ${passed}/${testCases.length} 通过`)
if (failed > 0) {
  console.log(`失败: ${failed} 个`)
  process.exit(1)
} else {
  console.log('✅ 所有测试通过!')
}
console.log('='.repeat(70))
