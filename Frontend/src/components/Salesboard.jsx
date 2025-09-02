import React, { useEffect, useMemo, useState } from 'react'
import { Menu } from 'lucide-react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { DashboardProvider, useDashboard } from '../context/DashboardContext.jsx'
import PeriodSelect from './navbar/PeriodSelect.jsx'
import ShopDropdown from './navbar/ShopDropdown.jsx'
import AvatarDropdown from './navbar/AvatarDropdown.jsx'
import Sidebar from './Sidebar.jsx'
import { useLocation } from 'react-router-dom'

function SalesboardInner() {
  const { selectedShop, period } = useDashboard()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [sales, setSales] = useState([])
  const [pagination, setPagination] = useState({ current_page: 1, per_page: 20, total_pages: 1 })
  const [loading, setLoading] = useState(true)
  const location = useLocation()

  const title = useMemo(() => (location.pathname.startsWith('/sales') ? 'Sales' : 'Dashboard'), [location.pathname])

  const loadSales = async (page = 1) => {
    setLoading(true)
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}` }
      const params = { page, limit: pagination.per_page || 20, period }
      if (selectedShop) params.shop_id = selectedShop
      const { data } = await axios.get('/api/sales', { params, headers })
      setSales(data?.data?.sales || [])
      setPagination(data?.data?.pagination || { current_page: page, per_page: 20, total_pages: 1 })
    } catch (e) {
      const msg = e?.response?.data?.message || e.message || 'Failed to load sales'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSales(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedShop, period])

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
          {/* Navbar */}
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
              <AvatarDropdown />
            </div>
          </div>

          {/* Content */}
          <div className="p-4 lg:p-8 text-white">
            <div className="rounded-2xl p-5 bg-gradient-to-br from-[#121a3d] to-[#182057] border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <p className="font-semibold">Sales Records</p>
                <span className="text-xs text-white/60">Period: {period}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-white/70">
                    <tr>
                      <th className="text-left p-2">Date</th>
                      <th className="text-left p-2">Shop</th>
                      <th className="text-left p-2">Product</th>
                      <th className="text-right p-2">Qty</th>
                      <th className="text-right p-2">Unit Price</th>
                      <th className="text-right p-2">Total</th>
                      <th className="text-left p-2">Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td className="p-2" colSpan={7}>Loading...</td></tr>
                    ) : sales.length === 0 ? (
                      <tr><td className="p-2" colSpan={7}>No sales found</td></tr>
                    ) : (
                      sales.map((s) => (
                        <tr key={s.id} className="border-t border-white/10">
                          <td className="p-2">{new Date(s.sale_date).toLocaleString()}</td>
                          <td className="p-2">{s?.shop?.shop_name || s.shop_id}</td>
                          <td className="p-2">{s?.product?.product_name || s.product_id}</td>
                          <td className="p-2 text-right">{s.quantity_sold}</td>
                          <td className="p-2 text-right">{s.unit_price != null ? `₹${Number(s.unit_price).toLocaleString('en-IN')}` : '-'}</td>
                          <td className="p-2 text-right">₹{Number(s.total_amount || 0).toLocaleString('en-IN')}</td>
                          <td className="p-2">{s.payment_method}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4 text-sm">
                <div>
                  Page {pagination.current_page} of {pagination.total_pages}
                </div>
                <div className="space-x-2">
                  <button
                    className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 disabled:opacity-50"
                    onClick={() => loadSales(Math.max(1, (pagination.current_page || 1) - 1))}
                    disabled={pagination.current_page <= 1}
                  >
                    Prev
                  </button>
                  <button
                    className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 disabled:opacity-50"
                    onClick={() => loadSales(Math.min(pagination.total_pages || 1, (pagination.current_page || 1) + 1))}
                    disabled={pagination.current_page >= pagination.total_pages}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Salesboard() {
  return (
    <DashboardProvider>
      <SalesboardInner />
    </DashboardProvider>
  )
}
