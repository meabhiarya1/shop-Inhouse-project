import React, { useEffect, useMemo, useState } from 'react'
import { Menu } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { toast } from 'react-toastify'
import { BarChart, Bar, CartesianGrid, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts'
import axios from '../utils/axiosConfig'
import { DashboardProvider, useDashboard } from '../context/DashboardContext.jsx'
import PeriodSelect from './navbar/PeriodSelect.jsx'
import ShopDropdown from './navbar/ShopDropdown.jsx'
import AvatarDropdown from './navbar/AvatarDropdown.jsx'
import CartIcon from './navbar/CartIcon.jsx'
import Sidebar from './Sidebar.jsx'
import { useLocation } from 'react-router-dom'

function DashboardInner() {
  const { user } = useAuth()
  const { selectedShop, period } = useDashboard()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [analytics, setAnalytics] = useState(null)
  const [topProducts, setTopProducts] = useState([])
  const [shopSummary, setShopSummary] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const location = useLocation()

  const title = useMemo(() => (location.pathname.startsWith('/sales') ? 'Sales' : 'Dashboard'), [location.pathname])

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
      quantity: Number(tp?.dataValues?.total_sold || tp?.total_sold || 0),
      paid: Number(tp?.dataValues?.total_customer_paid || tp?.total_customer_paid || 0),
      discount: Number(tp?.dataValues?.total_discount || tp?.total_discount || 0),
      due: Number(tp?.dataValues?.total_due || tp?.total_due || 0),
    }))
  }, [topProducts])

  const revenueVsDuePct = useMemo(() => {
    const totalPaid = Number(analytics?.summary?.total_customer_paid || 0)
    const totalDue = Number(analytics?.summary?.total_due_amount || 0)
    return [
      { name: 'Customer Paid', value: totalPaid, color: '#34d399' },
      { name: 'Due Amount', value: totalDue, color: '#f87171' }
    ]
  }, [analytics])

  return (
    <div className="w-full min-h-screen bg-[#0a0f1e] flex items-stretch justify-center relative overflow-hidden">
      <div className="w-full max-w-7xl mx-4 my-6 bg-[#0f1535] rounded-3xl shadow-2xl overflow-hidden flex max-[500px]:mx-2 max-[500px]:my-3">
        <div className="lg:block hidden"><Sidebar /></div>
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileSidebarOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 z-50"><Sidebar /></div>
          </div>
        )}

        <div className="flex-1 flex flex-col">
          <div className="h-16 px-4 lg:px-8 flex items-center justify-between border-b border-white/10 bg-[#0f1535] text-white max-[500px]:h-14 max-[500px]:px-3">
            <div className="flex items-center space-x-3">
              <button className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 max-[500px]:w-9 max-[500px]:h-9" onClick={() => setMobileSidebarOpen(true)}>
                <Menu size={20} />
              </button>
              <h1 className="text-xl font-bold max-[500px]:text-lg">{title}</h1>
            </div>

            <div className="flex items-center space-x-4 max-[500px]:space-x-2">
              <PeriodSelect />
              <ShopDropdown />
              <CartIcon />
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
              <p className="text-xs text-white/60 max-[500px]:text-[10px]">Total Quantity Sold</p>
              <p className="mt-3 text-2xl font-extrabold max-[500px]:text-xl">{analytics?.summary?.total_quantity_sold ?? '-'}</p>
            </div>
            <div className="rounded-2xl p-5 bg-gradient-to-br from-[#121a3d] to-[#182057] text-white border border-white/10 max-[500px]:p-4">
              <p className="text-xs text-white/60 max-[500px]:text-[10px]">Total Customer Paid</p>
              <p className="mt-3 text-2xl font-extrabold max-[500px]:text-xl">₹{Number(analytics?.summary?.total_customer_paid || 0).toLocaleString('en-IN')}</p>
            </div>
            <div className="rounded-2xl p-5 bg-gradient-to-br from-[#121a3d] to-[#182057] text-white border border-white/10 max-[500px]:p-4">
              <p className="text-xs text-white/60 max-[500px]:text-[10px]">Total Due Amount</p>
              <p className="mt-3 text-2xl font-extrabold max-[500px]:text-xl text-red-400">₹{Number(analytics?.summary?.total_due_amount || 0).toLocaleString('en-IN')}</p>
            </div>
          </div>

          <div className="px-4 lg:px-8 space-y-4 max-[500px]:px-3 max-[500px]:space-y-3">
            {/* Pie Chart Row */}
            <div className="rounded-2xl p-5 bg-gradient-to-br from-[#121a3d] to-[#182057] text-white border border-white/10">
              <p className="font-semibold mb-4">Customer Paid vs Due Amount</p>
              <div className="h-64 sm:h-72 md:h-80 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={revenueVsDuePct}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {revenueVsDuePct.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        background: '#0f1535', 
                        border: '1px solid #ffffff22', 
                        color: '#fff',
                        borderRadius: '8px',
                        padding: '8px 12px'
                      }}
                      itemStyle={{ color: '#fff' }}
                      labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                      formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#34d399]"></div>
                  <p className="text-sm">Paid: ₹{Number(analytics?.summary?.total_customer_paid || 0).toLocaleString('en-IN')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#f87171]"></div>
                  <p className="text-sm">Due: ₹{Number(analytics?.summary?.total_due_amount || 0).toLocaleString('en-IN')}</p>
                </div>
                <p className="text-xs text-white/60">Total: ₹{(Number(analytics?.summary?.total_customer_paid || 0) + Number(analytics?.summary?.total_due_amount || 0)).toLocaleString('en-IN')}</p>
              </div>
            </div>

            {/* Bar Chart Row */}
            <div className="rounded-2xl p-5 bg-gradient-to-br from-[#121a3d] to-[#182057] text-white border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <p className="font-semibold">Top Sold Products</p>
                <span className="text-xs text-white/60">Period: {period}</span>
              </div>
              <div className="h-80 sm:h-96 md:h-[28rem] pb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProductsChart} margin={{ bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#ffffff50" 
                      interval={0} 
                      angle={-45} 
                      textAnchor="end" 
                      height={120}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis stroke="#ffffff50" />
                    <Tooltip 
                      contentStyle={{ background: '#0f1535', border: '1px solid #ffffff22', color: '#fff' }}
                      cursor={false}
                    />
                    <Bar dataKey="quantity" fill="#6366f1" radius={[6, 6, 0, 0]} name="Quantity" />
                    <Bar dataKey="paid" fill="#34d399" radius={[6, 6, 0, 0]} name="Paid (₹)" />
                    <Bar dataKey="discount" fill="#fbbf24" radius={[6, 6, 0, 0]} name="Discount (₹)" />
                    <Bar dataKey="due" fill="#f87171" radius={[6, 6, 0, 0]} name="Due (₹)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
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
