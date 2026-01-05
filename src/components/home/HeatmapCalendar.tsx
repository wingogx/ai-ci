'use client'

import { useMemo } from 'react'
import { t } from '@/i18n'

interface DayData {
  date: string
  count: number
}

interface HeatmapCalendarProps {
  data: DayData[]
  lang: 'zh' | 'en'
}

/**
 * GitHub 风格的学习热力图
 */
export function HeatmapCalendar({ data, lang }: HeatmapCalendarProps) {
  const { weeks, months } = useMemo(() => {
    const today = new Date()
    const weeksToShow = 15 // 显示约 3.5 个月
    const totalDays = weeksToShow * 7

    // 创建日期到数据的映射
    const dataMap = new Map(data.map((d) => [d.date, d.count]))

    // 生成日期网格
    const days: { date: Date; count: number; dateStr: string }[] = []
    for (let i = totalDays - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      days.push({
        date,
        dateStr,
        count: dataMap.get(dateStr) || 0,
      })
    }

    // 按周分组
    const weeks: typeof days[] = []
    let currentWeek: typeof days = []

    // 填充第一周开头的空白
    const firstDayOfWeek = days[0].date.getDay()
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push({ date: new Date(0), count: -1, dateStr: '' })
    }

    days.forEach((day) => {
      currentWeek.push(day)
      if (currentWeek.length === 7) {
        weeks.push(currentWeek)
        currentWeek = []
      }
    })

    if (currentWeek.length > 0) {
      weeks.push(currentWeek)
    }

    // 提取月份标签
    const months: { name: string; col: number }[] = []
    let lastMonth = -1
    weeks.forEach((week, weekIndex) => {
      const firstValidDay = week.find((d) => d.count >= 0)
      if (firstValidDay) {
        const month = firstValidDay.date.getMonth()
        if (month !== lastMonth) {
          const monthName = firstValidDay.date.toLocaleDateString(
            lang === 'zh' ? 'zh-CN' : 'en-US',
            { month: 'short' }
          )
          months.push({ name: monthName, col: weekIndex })
          lastMonth = month
        }
      }
    })

    return { weeks, months }
  }, [data, lang])

  const getColor = (count: number) => {
    if (count < 0) return 'transparent' // 空白格子
    if (count === 0) return '#ebedf0'
    if (count <= 3) return '#9be9a8'
    if (count <= 8) return '#40c463'
    if (count <= 15) return '#30a14e'
    return '#216e39'
  }

  const weekDays = lang === 'zh'
    ? ['日', '一', '二', '三', '四', '五', '六']
    : ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
        <span>📅</span>
        {lang === 'zh' ? '学习记录' : 'Learning History'}
      </h3>

      <div className="overflow-x-auto">
        <div className="inline-block">
          {/* 月份标签 */}
          <div className="flex mb-1 text-xs text-gray-400" style={{ marginLeft: '20px' }}>
            {months.map((month, i) => (
              <div
                key={i}
                style={{
                  position: 'relative',
                  left: `${month.col * 14}px`,
                  marginRight: i < months.length - 1
                    ? `${(months[i + 1]?.col - month.col - 1) * 14}px`
                    : 0,
                }}
              >
                {month.name}
              </div>
            ))}
          </div>

          <div className="flex">
            {/* 星期标签 */}
            <div className="flex flex-col text-xs text-gray-400 mr-1">
              {weekDays.map((day, i) => (
                <div
                  key={i}
                  className="h-[12px] leading-[12px] text-right pr-1"
                  style={{ fontSize: '9px' }}
                >
                  {i % 2 === 1 ? day : ''}
                </div>
              ))}
            </div>

            {/* 热力图网格 */}
            <div className="flex gap-[2px]">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-[2px]">
                  {week.map((day, dayIndex) => (
                    <div
                      key={dayIndex}
                      className="w-[10px] h-[10px] rounded-sm cursor-pointer transition-transform hover:scale-125"
                      style={{ backgroundColor: getColor(day.count) }}
                      title={
                        day.count >= 0
                          ? `${day.dateStr}: ${day.count} ${lang === 'zh' ? '词' : 'words'}`
                          : ''
                      }
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* 图例 */}
          <div className="flex items-center justify-end gap-1 mt-2 text-xs text-gray-400">
            <span>{lang === 'zh' ? '少' : 'Less'}</span>
            {[0, 3, 8, 15, 20].map((count) => (
              <div
                key={count}
                className="w-[10px] h-[10px] rounded-sm"
                style={{ backgroundColor: getColor(count) }}
              />
            ))}
            <span>{lang === 'zh' ? '多' : 'More'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
