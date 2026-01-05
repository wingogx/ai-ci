'use client'

import { useMemo } from 'react'

interface DayData {
  date: string
  count: number
}

interface HeatmapCalendarProps {
  data: DayData[]
  lang: 'zh' | 'en'
}

/**
 * 近30天学习记录日历
 */
export function HeatmapCalendar({ data, lang }: HeatmapCalendarProps) {
  const { days, totalWords, activeDays } = useMemo(() => {
    const today = new Date()
    const daysToShow = 30

    // 创建日期到数据的映射
    const dataMap = new Map(data.map((d) => [d.date, d.count]))

    // 生成最近30天的日期
    const days: { date: Date; count: number; dateStr: string; isToday: boolean }[] = []
    let totalWords = 0
    let activeDays = 0

    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const count = dataMap.get(dateStr) || 0

      days.push({
        date,
        dateStr,
        count,
        isToday: i === 0,
      })

      totalWords += count
      if (count > 0) activeDays++
    }

    return { days, totalWords, activeDays }
  }, [data])

  const getColor = (count: number) => {
    if (count === 0) return 'bg-gray-100'
    if (count <= 3) return 'bg-green-200'
    if (count <= 8) return 'bg-green-400'
    if (count <= 15) return 'bg-green-500'
    return 'bg-green-600'
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  // 计算起止日期
  const startDate = days[0]?.date
  const endDate = days[days.length - 1]?.date

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <span>📅</span>
          {lang === 'zh' ? '学习记录' : 'Learning History'}
        </h3>
        <span className="text-xs text-gray-400">
          {lang === 'zh' ? '近30天' : 'Last 30 days'}
        </span>
      </div>

      {/* 统计摘要 */}
      <div className="flex gap-4 mb-3 text-sm">
        <div className="text-gray-600">
          <span className="font-bold text-green-600">{activeDays}</span>
          <span className="text-gray-400 ml-1">{lang === 'zh' ? '天' : 'days'}</span>
        </div>
        <div className="text-gray-600">
          <span className="font-bold text-blue-600">{totalWords}</span>
          <span className="text-gray-400 ml-1">{lang === 'zh' ? '词' : 'words'}</span>
        </div>
      </div>

      {/* 日期范围 */}
      <div className="text-xs text-gray-400 mb-2 flex justify-between">
        <span>{startDate && formatDate(startDate)}</span>
        <span>{endDate && formatDate(endDate)}</span>
      </div>

      {/* 热力图网格 - 5行6列 */}
      <div className="grid grid-cols-10 gap-1">
        {days.map((day, index) => (
          <div
            key={index}
            className={`aspect-square rounded-sm ${getColor(day.count)} ${
              day.isToday ? 'ring-2 ring-blue-400 ring-offset-1' : ''
            } transition-transform hover:scale-110 cursor-pointer`}
            title={`${day.dateStr}: ${day.count} ${lang === 'zh' ? '词' : 'words'}`}
          />
        ))}
      </div>

      {/* 图例 */}
      <div className="flex items-center justify-end gap-1 mt-3 text-xs text-gray-400">
        <span>{lang === 'zh' ? '少' : 'Less'}</span>
        <div className="w-3 h-3 rounded-sm bg-gray-100" />
        <div className="w-3 h-3 rounded-sm bg-green-200" />
        <div className="w-3 h-3 rounded-sm bg-green-400" />
        <div className="w-3 h-3 rounded-sm bg-green-500" />
        <div className="w-3 h-3 rounded-sm bg-green-600" />
        <span>{lang === 'zh' ? '多' : 'More'}</span>
      </div>
    </div>
  )
}
