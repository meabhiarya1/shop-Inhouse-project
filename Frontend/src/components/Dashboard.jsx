import React, { useEffect, useMemo, useState } from 'react'
import { Menu, Package, BarChart2, ShoppingCart, Settings, ChevronDown, LogOut, Building2, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { toast } from 'react-toastify'
import { BarChart, Bar, CartesianGrid, RadialBar, RadialBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import axios from 'axios'
import { DashboardProvider, useDashboard } from '../context/DashboardContext.jsx'
import PeriodSelect from './navbar/PeriodSelect.jsx'
import ShopDropdown from './navbar/ShopDropdown.jsx'
import AvatarDropdown from './navbar/AvatarDropdown.jsx'

function DashboardInner() {
  const { user } = useAuth()
  const { selectedShop, period } = useDashboard()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [analytics, setAnalytics] = useState(null)
  const [topProducts, setTopProducts] = useState([])
  const [shopSummary, setShopSummary] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Load dashboard data when shop/period changes
  useEffect(() => {
    const loadDashboard = async () => {
      if (!selectedShop) return
      setLoading(true)
      setError('')
      try {
        const headers = { Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}` }
        const [aRes, tRes, sRes] = await Promise.all([
          axios.get('/api/dashboard/analytics', { params: { period, shop_id: selectedShop }, headers }),
          axios.get('/api/dashboard/top-products', { params: { period, shop_id: selectedShop, limit: 10 }, headers }),
          axios.get('/api/dashboard/shop-summary', { params: { period }, headers }),
        ])
        setAnalytics(aRes.data?.data || null)
        setTopProducts(tRes.data?.data?.top_products || [])
        setShopSummary(sRes.data?.data?.shop_summary || [])
      } catch (e) {
        const msg = e?.response?.data?.message || e.message || 'Failed to load dashboard'
        setError(msg)
        toast.error(msg)
      } finally {
        setLoading(false)
      }
    }
    loadDashboard()
  }, [selectedShop, period])

  // Derived chart data from API
  const topProductsChart = useMemo(() => {
    return (topProducts || []).slice(0, 10).map((tp) => ({
      name: tp?.product?.product_name || `#${tp.product_id}`,
      sold: Number(tp?.dataValues?.total_sold || tp?.total_sold || 0),
      revenue: Number(tp?.dataValues?.total_revenue || tp?.total_revenue || 0),
    }))
  }, [topProducts])

  const salesSharePct = useMemo(() => {
    const total = Number(analytics?.summary?.total_products || 0)
    const withSales = Number(analytics?.summary?.products_with_sales || 0)
    const pct = total > 0 ? Math.round((withSales / total) * 100) : 0
    return [{ name: 'Products With Sales', value: pct, fill: '#34d399' }]
  }, [analytics])

  const Sidebar = (
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
        <a className="flex items-center space-x-3 px-3 py-2 rounded-xl bg-indigo-600/20 text-indigo-300 font-medium" href="#">
          <BarChart2 size={18} />
          <span>Dashboard</span>
        </a>
        <a className="flex items-center space-x-3 px-3 py-2 rounded-xl hover:bg-white/5 text-white/80" href="#">
          <ShoppingCart size={18} />
          <span>Sales</span>
        </a>
        <a className="flex items-center space-x-3 px-3 py-2 rounded-xl hover:bg-white/5 text-white/80" href="#">
          <Settings size={18} />
          <span>Settings</span>
        </a>
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

  return (
    <div className="w-full min-h-screen bg-[#0a0f1e] flex items-stretch justify-center relative overflow-hidden">
      <div className="w-full max-w-7xl mx-4 my-6 bg-[#0f1535] rounded-3xl shadow-2xl overflow-hidden flex max-[500px]:mx-2 max-[500px]:my-3">
        <div className="lg:block hidden">{Sidebar}</div>
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileSidebarOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 z-50">{Sidebar}</div>
          </div>
        )}

        <div className="flex-1 flex flex-col">
          <div className="h-16 px-4 lg:px-8 flex items-center justify-between border-b border-white/10 bg-[#0f1535] text-white max-[500px]:h-14 max-[500px]:px-3">
            <div className="flex items-center space-x-3">
              <button
                className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 max-[500px]:w-9 max-[500px]:h-9"
                onClick={() => setMobileSidebarOpen(true)}
              >
                <Menu size={20} />
              </button>
              <h1 className="text-xl font-bold max-[500px]:text-lg">Dashboard</h1>
            </div>

            <div className="flex items-center space-x-4 max-[500px]:space-x-2">
              <PeriodSelect />
              <ShopDropdown />
              <AvatarDropdown />
            </div>
          </div>

          {/* Top stats cards */}
          <div className="p-4 lg:p-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 max-[500px]:p-3 max-[500px]:gap-3">
            <div className="rounded-2xl p-5 bg-gradient-to-br from-[#121a3d] to-[#182057] text-white border border-white/10 max-[500px]:p-4">
              <p className="text-xs text-white/60 max-[500px]:text-[10px]">Total Products</p>
              <p className="mt-3 text-2xl font-extrabold max-[500px]:text-xl">{analytics?.summary?.total_products ?? '-'}</p>
            </div>
            <div className="rounded-2xl p-5 bg-gradient-to-br from-[#121a3d] to-[#182057] text-white border border-white/10 max-[500px]:p-4">
              <p className="text-xs text-white/60 max-[500px]:text-[10px]">Quantity Sold</p>
              <p className="mt-3 text-2xl font-extrabold max-[500px]:text-xl">{analytics?.summary?.total_quantity_sold ?? '-'}</p>
            </div>
            <div className="rounded-2xl p-5 bg-gradient-to-br from-[#121a3d] to-[#182057] text-white border border-white/10 max-[500px]:p-4">
              <p className="text-xs text-white/60 max-[500px]:text-[10px]">Total Revenue</p>
              <p className="mt-3 text-2xl font-extrabold max-[500px]:text-xl">₹{Number(analytics?.summary?.total_revenue || 0).toLocaleString('en-IN')}</p>
            </div>
            <div className="rounded-2xl p-5 bg-gradient-to-br from-[#121a3d] to-[#182057] text-white border border-white/10 max-[500px]:p-4">
              <p className="text-xs text-white/60 max-[500px]:text-[10px]">Products With Sales</p>
              <p className="mt-3 text-2xl font-extrabold max-[500px]:text-xl">{analytics?.summary?.products_with_sales ?? '-'}</p>
            </div>
          </div>

          <div className="px-4 lg:px-8 grid grid-cols-1 xl:grid-cols-3 gap-4 max-[500px]:px-3 max-[500px]:gap-3">
            <div className="rounded-2xl p-5 bg-gradient-to-br from-[#121a3d] to-[#182057] text-white border border-white/10 xl:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <p className="font-semibold">Top Products (Qty Sold)</p>
                <span className="text-xs text-white/60">Period: {period}</span>
              </div>
              <div className="h-56 sm:h-60 md:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProductsChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis dataKey="name" stroke="#ffffff50" interval={0} angle={-20} textAnchor="end" height={50} />
                    <YAxis stroke="#ffffff50" />
                    <Tooltip contentStyle={{ background: '#0f1535', border: '1px solid #ffffff22', color: '#fff' }} />
                    <Bar dataKey="sold" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl p-5 bg-gradient-to-br from-[#121a3d] to-[#182057] text-white border border-white/10">
              <p className="font-semibold mb-4">Products With Sales</p>
              <div className="h-48 sm:h-56 md:h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart innerRadius="70%" outerRadius="100%" data={salesSharePct} startAngle={90} endAngle={-270}>
                    <RadialBar minAngle={15} background clockWise dataKey="value" cornerRadius={8} fill="#34d399" />
                    <Tooltip contentStyle={{ background: '#0f1535', border: '1px solid #ffffff22', color: '#fff' }} />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-center text-3xl font-extrabold max-[500px]:text-2xl">{salesSharePct[0].value}%</p>
              <p className="text-center text-xs text-white/60">of {analytics?.summary?.total_products || 0} products</p>
            </div>
          </div>

          {/* Optional: could list shopSummary later */}
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  return (
    <DashboardProvider>
      <DashboardInner />
    </DashboardProvider>
  )
}
