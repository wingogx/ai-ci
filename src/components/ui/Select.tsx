'use client'

import { cn } from '@/utils'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  label?: string
  className?: string
}

export function Select({
  value,
  onChange,
  options,
  label,
  className,
}: SelectProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'px-3 py-2 rounded-lg border border-gray-300',
          'bg-white text-gray-900',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          'cursor-pointer'
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export default Select
