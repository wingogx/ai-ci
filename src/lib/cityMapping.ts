/**
 * 城市名称映射表
 * 将拼音/英文城市名转换为标准中文名称
 */

export const CITY_NAME_MAPPING: Record<string, string> = {
  // 直辖市
  'Beijing': '北京',
  'Shanghai': '上海',
  'Tianjin': '天津',
  'Chongqing': '重庆',

  // 省会城市
  'Guangzhou': '广州',
  'Shenzhen': '深圳',
  'Chengdu': '成都',
  'Hangzhou': '杭州',
  'Wuhan': '武汉',
  'Xian': '西安',
  "Xi'an": '西安',
  'Nanjing': '南京',
  'Shenyang': '沈阳',
  'Harbin': '哈尔滨',
  'Changchun': '长春',
  'Dalian': '大连',
  'Jinan': '济南',
  'Qingdao': '青岛',
  'Zhengzhou': '郑州',
  'Shijiazhuang': '石家庄',
  'Taiyuan': '太原',
  'Hefei': '合肥',
  'Changsha': '长沙',
  'Nanchang': '南昌',
  'Fuzhou': '福州',
  'Xiamen': '厦门',
  'Kunming': '昆明',
  'Guiyang': '贵阳',
  'Nanning': '南宁',
  'Haikou': '海口',
  'Sanya': '三亚',
  'Lanzhou': '兰州',
  'Yinchuan': '银川',
  'Xining': '西宁',
  'Urumqi': '乌鲁木齐',
  'Hohhot': '呼和浩特',
  'Lhasa': '拉萨',

  // 其他重要城市
  'Suzhou': '苏州',
  'Ningbo': '宁波',
  'Wenzhou': '温州',
  'Foshan': '佛山',
  'Dongguan': '东莞',
  'Zhuhai': '珠海',
  'Wuxi': '无锡',
  'Changzhou': '常州',
  'Nantong': '南通',
  'Yangzhou': '扬州',
  'Xuzhou': '徐州',
  'Shaoxing': '绍兴',
  'Jinhua': '金华',
  'Taizhou': '台州',
  'Huizhou': '惠州',
  'Zhongshan': '中山',
  'Jiangmen': '江门',
  'Zhanjiang': '湛江',
  'Shantou': '汕头',
  'Meizhou': '梅州',
  'Qingyuan': '清远',
  'Shaoguan': '韶关',
  'Heyuan': '河源',
  'Yangjiang': '阳江',
  'Maoming': '茂名',
  'Zhuzhou': '株洲',
  'Xiangtan': '湘潭',
  'Hengyang': '衡阳',
  'Yueyang': '岳阳',
  'Changde': '常德',
  'Zhangjiajie': '张家界',
  'Yichang': '宜昌',
  'Xiangyang': '襄阳',
  'Jingzhou': '荆州',
  'Huangshi': '黄石',
  'Shiyan': '十堰',
  'Luoyang': '洛阳',
  'Kaifeng': '开封',
  'Anyang': '安阳',
  'Xinxiang': '新乡',
  'Nanyang': '南阳',
  'Pingdingshan': '平顶山',
  'Xingtai': '邢台',
  'Handan': '邯郸',
  'Baoding': '保定',
  'Cangzhou': '沧州',
  'Tangshan': '唐山',
  'Qinhuangdao': '秦皇岛',
  'Langfang': '廊坊',
  'Datong': '大同',
  'Linfen': '临汾',
  'Yuncheng': '运城',
  'Baotou': '包头',
  'Anshan': '鞍山',
  'Fushun': '抚顺',
  'Benxi': '本溪',
  'Dandong': '丹东',
  'Jinzhou': '锦州',
  'Yingkou': '营口',
  'Fuxin': '阜新',
  'Liaoyang': '辽阳',
  'Panjin': '盘锦',
  'Tieling': '铁岭',
  'Chaoyang': '朝阳',
  'Huludao': '葫芦岛',
  'Jilin': '吉林',
  'Siping': '四平',
  'Liaoyuan': '辽源',
  'Tonghua': '通化',
  'Baishan': '白山',
  'Songyuan': '松原',
  'Baicheng': '白城',
  'Qiqihar': '齐齐哈尔',
  'Mudanjiang': '牡丹江',
  'Daqing': '大庆',
  'Jiamusi': '佳木斯',
  'Hegang': '鹤岗',
  'Shuangyashan': '双鸭山',
  'Yichun': '伊春',
  'Qitaihe': '七台河',
  'Heihe': '黑河',
  'Suihua': '绥化',

  // 港澳台
  'Hong Kong': '香港',
  'Hongkong': '香港',
  'Macau': '澳门',
  'Macao': '澳门',
  'Taipei': '台北',
  'Kaohsiung': '高雄',
  'Taichung': '台中',
  'Tainan': '台南',
}

/**
 * 标准化城市名称
 * 移除市/区/县等后缀，统一为标准格式
 */
export function normalizeCityName(city: string | null): string | null {
  if (!city) return null

  // 去除空格
  let normalized = city.trim()

  // 如果是拼音/英文，尝试转换为中文
  if (CITY_NAME_MAPPING[normalized]) {
    normalized = CITY_NAME_MAPPING[normalized]
  }

  // 移除常见后缀（市、区、县、自治州等）
  normalized = normalized
    .replace(/市$/, '')
    .replace(/区$/, '')
    .replace(/县$/, '')
    .replace(/自治州$/, '')
    .replace(/地区$/, '')
    .replace(/盟$/, '')

  // 特殊处理：直辖市保持原样
  const municipalities = ['北京', '上海', '天津', '重庆']
  if (municipalities.includes(normalized)) {
    return normalized
  }

  return normalized
}

/**
 * 判断城市名是否为拼音/英文
 */
export function isPinyinCity(city: string | null): boolean {
  if (!city) return false
  // 检查是否包含英文字母
  return /[a-zA-Z]/.test(city)
}

/**
 * 转换城市名为中文
 * 如果已经是中文则返回标准化后的名称
 * 如果是拼音则转换为中文
 */
export function convertToChineseCity(city: string | null): string | null {
  if (!city) return null

  const trimmed = city.trim()

  // 如果是拼音，查找映射表
  if (isPinyinCity(trimmed)) {
    const chinese = CITY_NAME_MAPPING[trimmed]
    if (chinese) {
      return chinese
    }
    // 如果找不到映射，保持原样
    console.warn(`未找到城市拼音映射: ${trimmed}`)
    return trimmed
  }

  // 如果已经是中文，标准化后返回
  return normalizeCityName(trimmed)
}
