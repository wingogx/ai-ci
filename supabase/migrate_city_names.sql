-- 统一城市名称格式
-- 将拼音城市名转换为中文

-- 创建临时函数用于转换城市名
CREATE OR REPLACE FUNCTION convert_city_to_chinese(city_input TEXT)
RETURNS TEXT AS $$
BEGIN
  -- 如果为空，返回 NULL
  IF city_input IS NULL OR city_input = '' THEN
    RETURN NULL;
  END IF;

  -- 城市名称映射（拼音 -> 中文）
  RETURN CASE city_input
    -- 直辖市
    WHEN 'Beijing' THEN '北京'
    WHEN 'Shanghai' THEN '上海'
    WHEN 'Tianjin' THEN '天津'
    WHEN 'Chongqing' THEN '重庆'

    -- 省会和重要城市
    WHEN 'Guangzhou' THEN '广州'
    WHEN 'Shenzhen' THEN '深圳'
    WHEN 'Chengdu' THEN '成都'
    WHEN 'Hangzhou' THEN '杭州'
    WHEN 'Wuhan' THEN '武汉'
    WHEN 'Xian' THEN '西安'
    WHEN 'Xi''an' THEN '西安'
    WHEN 'Nanjing' THEN '南京'
    WHEN 'Shenyang' THEN '沈阳'
    WHEN 'Harbin' THEN '哈尔滨'
    WHEN 'Changchun' THEN '长春'
    WHEN 'Dalian' THEN '大连'
    WHEN 'Jinan' THEN '济南'
    WHEN 'Qingdao' THEN '青岛'
    WHEN 'Zhengzhou' THEN '郑州'
    WHEN 'Shijiazhuang' THEN '石家庄'
    WHEN 'Taiyuan' THEN '太原'
    WHEN 'Hefei' THEN '合肥'
    WHEN 'Changsha' THEN '长沙'
    WHEN 'Nanchang' THEN '南昌'
    WHEN 'Fuzhou' THEN '福州'
    WHEN 'Xiamen' THEN '厦门'
    WHEN 'Kunming' THEN '昆明'
    WHEN 'Guiyang' THEN '贵阳'
    WHEN 'Nanning' THEN '南宁'
    WHEN 'Haikou' THEN '海口'
    WHEN 'Sanya' THEN '三亚'
    WHEN 'Lanzhou' THEN '兰州'
    WHEN 'Yinchuan' THEN '银川'
    WHEN 'Xining' THEN '西宁'
    WHEN 'Urumqi' THEN '乌鲁木齐'
    WHEN 'Hohhot' THEN '呼和浩特'
    WHEN 'Lhasa' THEN '拉萨'

    -- 其他重要城市
    WHEN 'Suzhou' THEN '苏州'
    WHEN 'Ningbo' THEN '宁波'
    WHEN 'Wenzhou' THEN '温州'
    WHEN 'Foshan' THEN '佛山'
    WHEN 'Dongguan' THEN '东莞'
    WHEN 'Zhuhai' THEN '珠海'
    WHEN 'Wuxi' THEN '无锡'
    WHEN 'Changzhou' THEN '常州'
    WHEN 'Nantong' THEN '南通'
    WHEN 'Yangzhou' THEN '扬州'
    WHEN 'Xuzhou' THEN '徐州'

    -- 港澳台
    WHEN 'Hong Kong' THEN '香港'
    WHEN 'Hongkong' THEN '香港'
    WHEN 'Macau' THEN '澳门'
    WHEN 'Macao' THEN '澳门'
    WHEN 'Taipei' THEN '台北'

    -- 如果已经是中文或找不到映射，移除"市"后缀后返回
    ELSE REGEXP_REPLACE(city_input, '市$', '')
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 更新所有用户的城市名称
UPDATE users
SET city = convert_city_to_chinese(city)
WHERE city IS NOT NULL
  AND city != convert_city_to_chinese(city);

-- 显示更新统计
DO $$
DECLARE
  update_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO update_count
  FROM users
  WHERE city ~ '[a-zA-Z]'; -- 还有英文字母的城市名

  RAISE NOTICE '剩余未转换的城市名数量: %', update_count;

  -- 显示未转换的城市名
  IF update_count > 0 THEN
    RAISE NOTICE '未转换的城市名列表:';
    FOR rec IN
      SELECT DISTINCT city
      FROM users
      WHERE city ~ '[a-zA-Z]'
      ORDER BY city
    LOOP
      RAISE NOTICE '  %', rec.city;
    END LOOP;
  END IF;
END $$;

-- 可选：删除临时函数
-- DROP FUNCTION IF EXISTS convert_city_to_chinese(TEXT);

-- 创建索引优化城市查询性能
CREATE INDEX IF NOT EXISTS idx_users_city ON users(city) WHERE city IS NOT NULL;

-- 查看城市分布统计
SELECT
  city,
  COUNT(*) as user_count
FROM users
WHERE city IS NOT NULL
GROUP BY city
ORDER BY user_count DESC
LIMIT 20;
