import React from 'react'
import { Package, BarChart2, ShoppingCart, Settings, Layers } from 'lucide-react'
import { NavLink } from 'react-router-dom'

export default function Sidebar() {
  return (
    <div className="w-64 bg-[#0b1020] text-white lg:static lg:translate-x-0 h-full shadow-2xl flex flex-col">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/30 flex items-center justify-center text-indigo-400">
            <Package size={22} />
          </div>
          <div>
            <p className="font-bold leading-tight">Inventory</p>
            <p className="text-xs text-white/60">Manager</p>
          </div>
        </div>
      </div>
      <nav className="p-4 space-y-2">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex items-center space-x-3 px-3 py-2 rounded-xl ${isActive ? 'bg-indigo-600/20 text-indigo-300 font-medium' : 'hover:bg-white/5 text-white/80'}`
          }
        >
          <BarChart2 size={18} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink
          to="/sales"
          className={({ isActive }) =>
            `flex items-center space-x-3 px-3 py-2 rounded-xl ${isActive ? 'bg-indigo-600/20 text-indigo-300 font-medium' : 'hover:bg-white/5 text-white/80'}`
          }
        >
          <ShoppingCart size={18} />
          <span>Sales</span>
        </NavLink>
        <NavLink
          to="/products"
          className={({ isActive }) =>
            `flex items-center space-x-3 px-3 py-2 rounded-xl ${isActive ? 'bg-indigo-600/20 text-indigo-300 font-medium' : 'hover:bg-white/5 text-white/80'}`
          }
        >
          <Package size={18} />
          <span>Products</span>
        </NavLink>
        <NavLink
          to="/categories"
          className={({ isActive }) =>
            `flex items-center space-x-3 px-3 py-2 rounded-xl ${isActive ? 'bg-indigo-600/20 text-indigo-300 font-medium' : 'hover:bg-white/5 text-white/80'}`
          }
        >
          <Layers size={18} />
          <span>Categories</span>
        </NavLink>
      
      </nav>
      <div className="mt-auto p-4">
        <div className="rounded-2xl p-4 bg-gradient-to-br from-indigo-600/30 to-purple-600/30 text-white">
          <p className="text-sm font-semibold">Need help?</p>
          <p className="text-xs text-white/70">Please check our docs</p>
          <button className="mt-3 text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg">Documentation</button>
        </div>
      </div>
    </div>
  )
}
