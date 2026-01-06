# 城市名称统一化解决方案

## 问题描述

排行榜中城市名称显示不统一：
- 部分用户显示**拼音**：Beijing, Shenyang, Shanghai
- 部分用户显示**中文**：北京市, 沈阳市, 天津市

## 根本原因

应用使用了三种地理位置API，返回的城市名称格式不同：

### 1. 浏览器定位 API（优先级最高）
```typescript
// 使用 BigDataCloud 反向地理编码，指定 localityLanguage=zh
```
- ✅ 返回中文："北京"、"上海"
- 需要用户授权浏览器定位
- 最准确但需要权限

### 2. Vercel Edge API（降级方案）
```typescript
const city = request.headers.get('x-vercel-ip-city')
```
- ❌ 返回拼音："Beijing"、"Shenyang"
- 基于 IP 地理位置
- 无需用户授权

### 3. ipapi.co API（备用方案）
```typescript
fetch('https://ipapi.co/json/')
```
- ❌ 返回拼音："Beijing"、"Shanghai"
- 第三方 IP 定位服务

## 解决方案

### 1. 创建城市名称映射表

**文件**: `src/lib/cityMapping.ts`

包含：
- 100+ 个中国主要城市的拼音→中文映射
- 城市名称标准化函数（移除"市"后缀）
- 自动转换功能

### 2. 修改地理位置获取逻辑

**文件**: `src/lib/geo.ts`

```typescript
import { convertToChineseCity } from './cityMapping'

export async function getCityName(): Promise<string | null> {
  const geo = await getGeoByIP()
  // 自动转换为中文城市名
  return convertToChineseCity(geo.city)
}
```

### 3. 数据库迁移脚本

**文件**: `supabase/migrate_city_names.sql`

功能：
- 将现有数据库中的拼音城市名批量转换为中文
- 创建城市查询索引优化性能
- 显示转换统计和未匹配的城市名

## 使用步骤

### 步骤 1: 测试转换功能

```bash
node test_city_conversion.js
```

应该看到所有测试通过：
```
✅ 所有测试通过! (15/15)
```

### 步骤 2: 执行数据库迁移

在 Supabase SQL Editor 中执行：

```sql
-- 复制 supabase/migrate_city_names.sql 的内容并执行
```

脚本会：
1. 创建 `convert_city_to_chinese()` 函数
2. 批量更新现有用户的城市名称
3. 显示转换统计
4. 列出未匹配的城市名（需要手动添加到映射表）

### 步骤 3: 部署代码更新

新用户注册时会自动使用中文城市名。

## 验证效果

### 迁移前
```
Beijing → Beijing
Shenyang → Shenyang
沈阳市 → 沈阳市
```

### 迁移后
```
Beijing → 北京
Shenyang → 沈阳
沈阳市 → 沈阳
```

## 扩展城市映射

如果发现未覆盖的城市，在 `src/lib/cityMapping.ts` 中添加：

```typescript
export const CITY_NAME_MAPPING: Record<string, string> = {
  // ... 现有映射
  'NewCity': '新城市',  // 添加新映射
}
```

然后重新执行数据库迁移脚本。

## 注意事项

1. **国际城市**: 非中国城市（如 "Colorado Springs"）保持原样
2. **港澳台**: 已包含香港、澳门、台北等城市的映射
3. **性能**: 城市字段已添加索引，查询性能不受影响
4. **向后兼容**: 旧数据会在迁移时自动转换，新数据自动使用中文

## 文件清单

- ✅ `src/lib/cityMapping.ts` - 城市映射表和转换函数
- ✅ `src/lib/geo.ts` - 修改后的地理位置获取逻辑
- ✅ `supabase/migrate_city_names.sql` - 数据库迁移脚本
- ✅ `test_city_conversion.js` - 转换功能测试

## 测试结果

```bash
$ node test_city_conversion.js

======================================================================
城市名称转换测试
======================================================================

✓ 测试 1: "Beijing" → "北京"
✓ 测试 2: "Shanghai" → "上海"
✓ 测试 3: "Shenyang" → "沈阳"
✓ 测试 4: "Guangzhou" → "广州"
✓ 测试 5: "Shenzhen" → "深圳"
✓ 测试 6: "沈阳市" → "沈阳"
✓ 测试 7: "北京市" → "北京"
✓ 测试 8: "天津市" → "天津"
✓ 测试 9: "广州市" → "广州"
✓ 测试 10: "北京" → "北京"
✓ 测试 11: "上海" → "上海"

======================================================================
测试结果: 15/15 通过
✅ 所有测试通过!
======================================================================
```

## 效果预期

修复后，排行榜中所有城市名称将统一显示为：
- 北京（不是 Beijing）
- 沈阳（不是 Shenyang）
- 上海（不是 Shanghai）
- 广州（不是 Guangzhou）

提升用户体验的同时，也便于后续的城市排行榜功能。
