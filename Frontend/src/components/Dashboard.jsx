import React, { useEffect, useMemo, useState } from 'react'
import { Menu, Package, BarChart2, ShoppingCart, Settings, ChevronDown, LogOut, Building2, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { toast } from 'react-toastify'
import { BarChart, Bar, CartesianGrid, RadialBar, RadialBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import axios from 'axios'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [avatarOpen, setAvatarOpen] = useState(false)

  const [shops, setShops] = useState([])
  const [selectedShop, setSelectedShop] = useState('')
  const [period, setPeriod] = useState('today')
  const [analytics, setAnalytics] = useState(null)
  const [topProducts, setTopProducts] = useState([])
  const [shopSummary, setShopSummary] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const handleLogout = () => {
    logout()
    toast.success('Logged out')
  }

  // Load shops on mount
  useEffect(() => {
    const loadShops = async () => {
      try {
        const { data } = await axios.get('/api/shops', {
          headers: { Authorization: `Bearer ${user ? localStorage.getItem('auth_token') : ''}` },
        })
        const list = Array.isArray(data?.data?.shops)
          ? data.data.shops
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
          ? data
          : []
        setShops(list)
        if (list.length > 0) setSelectedShop(String(list[0].id))
      } catch (e) {
        setShops([])
      }
    }
    loadShops()
  }, [user])

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

  return (
    <div className="w-full min-h-screen bg-[#0a0f1e] flex items-stretch justify-center relative overflow-hidden">
      {/* Container */}
      <div className="w-full max-w-7xl mx-4 my-6 bg-[#0f1535] rounded-3xl shadow-2xl overflow-hidden flex max-[500px]:mx-2 max-[500px]:my-3">
        {/* Sidebar (mobile overlay) */}
        <div className="lg:block hidden">
          {Sidebar}
        </div>
        {/* Mobile sidebar */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileSidebarOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 z-50">
              {Sidebar}
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col">
          {/* Navbar */}
          <div className="h-16 px-4 lg:px-8 flex items-center justify-between border-b border-white/10 bg-[#0f1535] text-white max-[500px]:h-14 max-[500px]:px-3">
            <div className="flex items-center space-x-3">
              <button className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 max-[500px]:w-9 max-[500px]:h-9" onClick={() => setMobileSidebarOpen(true)}>
                <Menu size={20} />
              </button>
              <h1 className="text-xl font-bold max-[500px]:text-lg">Dashboard</h1>
            </div>

            <div className="flex items-center space-x-4 max-[500px]:space-x-2">
              {/* Period (optional simple select) */}
              <select value={period} onChange={(e) => setPeriod(e.target.value)} className="bg-white/10 border border-white/10 text-white rounded-xl text-xs px-2 py-1 hidden sm:block">
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="lifetime">Lifetime</option>
              </select>
              {/* Shops dropdown */}
              <div className="relative">
                <div className="flex items-center px-3 py-2 bg-white/10 border border-white/10 rounded-xl max-[500px]:px-2 max-[500px]:py-1">
                  <Building2 size={18} className="text-white/70 mr-2 max-[500px]:hidden" />
                  <select
                    value={selectedShop}
                    onChange={(e) => setSelectedShop(e.target.value)}
                    className="appearance-none bg-transparent pr-6 text-sm text-white focus:outline-none max-[500px]:pr-4 max-[500px]:text-xs"
                  >
                    {Array.isArray(shops) && shops.map(s => (
                      <option value={s.id} key={s.id}>{s.shop_name || s.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="text-white/70 -ml-5 max-[500px]:-ml-4" />
                </div>
              </div>

              {/* Avatar dropdown */}
              <div className="relative">
                <button onClick={() => setAvatarOpen(v => !v)} className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow">
                  <User size={18} />
                </button>
                {avatarOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-[#0f1535] text-white rounded-xl shadow-lg border border-white/10 p-2 z-10">
                    <div className="px-3 py-2">
                      <p className="text-sm font-semibold">{user?.ownerName || 'User'}</p>
                      <p className="text-xs text-white/70">{user?.mobileNumber || ''}</p>
                    </div>
                    <button onClick={handleLogout} className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-white/10">
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
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

          {/* Charts row */}
          <div className="px-4 lg:px-8 grid grid-cols-1 xl:grid-cols-3 gap-4 max-[500px]:px-3 max-[500px]:gap-3">
            {/* Top products by quantity */}
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
                    <Bar dataKey="sold" fill="#6366f1" radius={[6,6,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Radial satisfaction */}
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
