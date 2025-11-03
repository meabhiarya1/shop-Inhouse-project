import React, { useState } from 'react'
import { useDashboard } from '../../context/DashboardContext.jsx'
import { Calendar } from 'lucide-react'

export default function PeriodSelect() {
  const { period, setPeriod, startDate, setStartDate, endDate, setEndDate } = useDashboard()
  const [showDatePicker, setShowDatePicker] = useState(false)

  const handlePeriodChange = (e) => {
    const value = e.target.value
    setPeriod(value)
    if (value !== 'custom') {
      setShowDatePicker(false)
      setStartDate(null)
      setEndDate(null)
    } else {
      setShowDatePicker(true)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <select
        value={period}
        onChange={handlePeriodChange}
        className="bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-sm px-4 py-2 min-w-[140px] cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/30 font-medium"
      >
        <option value="today" className='bg-[#0f1535] cursor-pointer'>Today</option>
        <option value="yesterday" className='bg-[#0f1535] cursor-pointer'>Yesterday</option>
        <option value="lifetime" className='bg-[#0f1535] cursor-pointer'>Lifetime</option>
        <option value="custom" className='bg-[#0f1535] cursor-pointer'>Custom Range</option>
      </select>

      {showDatePicker && (
        <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-3 py-2 animate-fadeIn">
          <Calendar size={16} className="text-white/60" />
          <input
            type="date"
            value={startDate || ''}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-transparent text-white text-sm outline-none cursor-pointer w-32 font-medium"
            placeholder="Start Date"
          />
          <span className="text-white/60 text-sm font-medium">to</span>
          <input
            type="date"
            value={endDate || ''}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-transparent text-white text-sm outline-none cursor-pointer w-32 font-medium"
            placeholder="End Date"
          />
        </div>
      )}
    </div>
  )
}
