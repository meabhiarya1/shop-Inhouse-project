import React from 'react'
import { useDashboard } from '../../context/DashboardContext.jsx'

export default function PeriodSelect() {
  const { period, setPeriod } = useDashboard()
  return (
    <select
      value={period}
      onChange={(e) => setPeriod(e.target.value)}
      className="bg-white/10 border border-white/10 text-white rounded-xl text-xs px-2 py-1 hidden sm:block"
    >
      <option value="today">Today</option>
      <option value="yesterday">Yesterday</option>
      <option value="lifetime">Lifetime</option>
    </select>
  )
}
