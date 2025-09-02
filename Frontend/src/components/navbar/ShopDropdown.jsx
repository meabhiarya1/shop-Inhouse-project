import React from 'react'
import { ChevronDown, Building2 } from 'lucide-react'
import { useDashboard } from '../../context/DashboardContext.jsx'

export default function ShopDropdown() {
  const { shops, selectedShop, setSelectedShop } = useDashboard()
  return (
    <div className="relative">
      <div className="flex items-center px-3 py-2 bg-white/10 border border-white/10 rounded-xl max-[500px]:px-2 max-[500px]:py-1">
        <Building2 size={18} className="text-white/70 mr-2 max-[500px]:hidden" />
        <select
          value={selectedShop}
          onChange={(e) => setSelectedShop(e.target.value)}
          className="appearance-none bg-transparent pr-6 text-sm text-white focus:outline-none max-[500px]:pr-4 max-[500px]:text-xs"
        >
          <option value="all">All Shops</option>
          {Array.isArray(shops) && shops.map((s) => (
            <option value={s.id} key={s.id}>
              {s.shop_name || s.name}
            </option>
          ))}
        </select>
        <ChevronDown size={16} className="text-white/70 -ml-5 max-[500px]:-ml-4" />
      </div>
    </div>
  )
}
