import React, { useEffect, useMemo, useState } from 'react'
import { Menu, Plus, Pencil, Trash2, Info } from 'lucide-react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { DashboardProvider, useDashboard } from '../context/DashboardContext.jsx'
import PeriodSelect from './navbar/PeriodSelect.jsx'
import ShopDropdown from './navbar/ShopDropdown.jsx'
import AvatarDropdown from './navbar/AvatarDropdown.jsx'
import Sidebar from './Sidebar.jsx'
import { useLocation } from 'react-router-dom'

function SalesboardInner() {
  const { selectedShop, period, shops } = useDashboard()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [sales, setSales] = useState([])
  const [pagination, setPagination] = useState({ current_page: 1, per_page: 20, total_pages: 1 })
  const [loading, setLoading] = useState(true)
  const location = useLocation()

  // Data for forms/modals
  const [products, setProducts] = useState([])
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [activeSale, setActiveSale] = useState(null)
  const [detailsSale, setDetailsSale] = useState(null)

  const [createForm, setCreateForm] = useState({
    product_id: '',
    shop_id: '',
    quantity_sold: 1,
    unit_price: '',
    total_amount: '',
    customer_name: '',
    customer_phone: '',
    payment_method: 'cash',
    sale_date: ''
  })

  const [editForm, setEditForm] = useState({
    id: '',
    quantity_sold: '',
    unit_price: '',
    total_amount: '',
    customer_name: '',
    customer_phone: '',
    payment_method: 'cash',
    sale_date: ''
  })

  const headers = useMemo(() => ({ Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}` }), [])
  const title = useMemo(() => (location.pathname.startsWith('/sales') ? 'Sales' : 'Dashboard'), [location.pathname])

  const loadProducts = async () => {
    try {
      const { data } = await axios.get('/api/products', { headers })
      const list = Array.isArray(data?.data?.products)
        ? data.data.products
        : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
        ? data
        : []
      setProducts(list)
    } catch (e) {
      setProducts([])
    }
  }

  const loadSales = async (page = 1) => {
    setLoading(true)
    try {
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

  const openCreate = () => {
    setCreateForm((f) => ({
      ...f,
      product_id: products[0]?.id ? String(products[0].id) : '',
      shop_id: selectedShop && selectedShop !== 'all' ? String(selectedShop) : (shops[0]?.id ? String(shops[0].id) : ''),
      quantity_sold: 1,
      unit_price: '',
      total_amount: '',
      payment_method: 'cash',
      sale_date: ''
    }))
    setCreateOpen(true)
  }

  const createTotal = useMemo(() => {
    const q = Number(createForm.quantity_sold || 0)
    const u = Number(createForm.unit_price || 0)
    return isFinite(q * u) ? q * u : 0
  }, [createForm.quantity_sold, createForm.unit_price])

  const editTotal = useMemo(() => {
    const q = Number(editForm.quantity_sold || 0)
    const u = Number(editForm.unit_price || 0)
    return isFinite(q * u) ? q * u : 0
  }, [editForm.quantity_sold, editForm.unit_price])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      if (!createForm.product_id) return toast.error('Select product')
      if (!createForm.shop_id || createForm.shop_id === 'all') return toast.error('Select shop')
      const payload = {
        product_id: Number(createForm.product_id),
        shop_id: Number(createForm.shop_id),
        quantity_sold: Number(createForm.quantity_sold),
        unit_price: createForm.unit_price ? Number(createForm.unit_price) : null,
        total_amount: Number(createTotal),
        customer_name: createForm.customer_name || undefined,
        customer_phone: createForm.customer_phone || undefined,
        payment_method: createForm.payment_method || 'cash',
        sale_date: createForm.sale_date || undefined
      }
      await axios.post('/api/sales', payload, { headers })
      toast.success('Sale created')
      setCreateOpen(false)
      await loadSales(pagination.current_page || 1)
    } catch (e) {
      const msg = e?.response?.data?.message || e.message || 'Failed to create sale'
      toast.error(msg)
    }
  }

  const openEdit = async (sale) => {
    try {
      const { data } = await axios.get(`/api/sales/${sale.id}`, { headers })
      const s = data?.data || sale
      setActiveSale(s)
      setEditForm({
        id: s.id,
        quantity_sold: s.quantity_sold,
        unit_price: s.unit_price ?? '',
        total_amount: s.total_amount ?? '',
        customer_name: s.customer_name ?? '',
        customer_phone: s.customer_phone ?? '',
        payment_method: s.payment_method || 'cash',
        sale_date: s.sale_date ? new Date(s.sale_date).toISOString().slice(0, 16) : '' // datetime-local format
      })
      setEditOpen(true)
    } catch (e) {
      toast.error('Failed to load sale')
    }
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        quantity_sold: Number(editForm.quantity_sold),
        unit_price: editForm.unit_price ? Number(editForm.unit_price) : null,
        total_amount: Number(editTotal),
        customer_name: editForm.customer_name || undefined,
        customer_phone: editForm.customer_phone || undefined,
        payment_method: editForm.payment_method || 'cash',
        sale_date: editForm.sale_date || undefined
      }
      await axios.put(`/api/sales/${editForm.id}`, payload, { headers })
      toast.success('Sale updated')
      setEditOpen(false)
      await loadSales(pagination.current_page || 1)
    } catch (e) {
      const msg = e?.response?.data?.message || e.message || 'Failed to update sale'
      toast.error(msg)
    }
  }

  const openDelete = (sale) => {
    setActiveSale(sale)
    setDeleteOpen(true)
  }

  const handleDelete = async () => {
    if (!activeSale) return
    try {
      await axios.delete(`/api/sales/${activeSale.id}`, { headers })
      toast.success('Sale deleted')
      setDeleteOpen(false)
      await loadSales(pagination.current_page || 1)
    } catch (e) {
      const msg = e?.response?.data?.message || e.message || 'Failed to delete sale'
      toast.error(msg)
    }
  }

  const openDetails = async (sale) => {
    try {
      const { data } = await axios.get(`/api/sales/${sale.id}`, { headers })
      setDetailsSale(data?.data || sale)
      setDetailsOpen(true)
    } catch (e) {
      setDetailsSale(sale)
      setDetailsOpen(true)
    }
  }

  useEffect(() => {
    loadSales(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedShop, period])

  useEffect(() => {
    loadProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
            <div className="flex items-center justify-between mb-4">
              <div className="text-white/70 text-sm">Period: {period.toUpperCase()}</div>
              <button onClick={openCreate} className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded-lg text-sm">
                <Plus size={16} />
                <span>Create Sale</span>
              </button>
            </div>

            <div className="rounded-2xl p-5 bg-gradient-to-br from-[#121a3d] to-[#182057] border border-white/10">
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
                      <th className="text-left p-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td className="p-2" colSpan={8}>Loading...</td></tr>
                    ) : sales.length === 0 ? (
                      <tr><td className="p-2" colSpan={8}>No sales found</td></tr>
                    ) : (
                      sales.map((s) => (
                        <tr key={s.id} className="border-t border-white/10 hover:bg-white/5">
                          <td className="p-2 cursor-pointer" onClick={() => openDetails(s)}>{new Date(s.sale_date).toLocaleString()}</td>
                          <td className="p-2 cursor-pointer" onClick={() => openDetails(s)}>{s?.shop?.shop_name || s.shop_id}</td>
                          <td className="p-2 cursor-pointer" onClick={() => openDetails(s)}>{s?.product?.product_name || s.product_id}</td>
                          <td className="p-2 text-right cursor-pointer" onClick={() => openDetails(s)}>{s.quantity_sold}</td>
                          <td className="p-2 text-right cursor-pointer" onClick={() => openDetails(s)}>{s.unit_price != null ? `₹${Number(s.unit_price).toLocaleString('en-IN')}` : '-'}</td>
                          <td className="p-2 text-right cursor-pointer" onClick={() => openDetails(s)}>{`₹${Number(s.total_amount || 0).toLocaleString('en-IN')}`}</td>
                          <td className="p-2 cursor-pointer" onClick={() => openDetails(s)}>{s.payment_method}</td>
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <button className="px-2 py-1 rounded bg-white/10 hover:bg-white/20" onClick={() => openEdit(s)} title="Edit">
                                <Pencil size={14} />
                              </button>
                              <button className="px-2 py-1 rounded bg-white/10 hover:bg-white/20" onClick={() => openDelete(s)} title="Delete">
                                <Trash2 size={14} />
                              </button>
                              <button className="px-2 py-1 rounded bg-white/10 hover:bg-white/20" onClick={() => openDetails(s)} title="Details">
                                <Info size={14} />
                              </button>
                            </div>
                          </td>
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

      {/* Create Modal */}
      {createOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-3">
          <div className="w-full max-w-lg bg-[#0f1535] text-white rounded-2xl border border-white/10 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Create Sale</h3>
              <button className="text-white/60" onClick={() => setCreateOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/60">Product</label>
                  <select className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1" value={createForm.product_id} onChange={(e) => setCreateForm({ ...createForm, product_id: e.target.value })}>
                    <option value="">Select Product</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.product_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/60">Shop</label>
                  <select className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1" value={createForm.shop_id} onChange={(e) => setCreateForm({ ...createForm, shop_id: e.target.value })}>
                    <option value="">Select Shop</option>
                    {shops.map(s => <option key={s.id} value={s.id}>{s.shop_name || s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/60">Quantity</label>
                  <input type="number" min={1} className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1" value={createForm.quantity_sold} onChange={(e) => setCreateForm({ ...createForm, quantity_sold: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-white/60">Unit Price (₹)</label>
                  <input type="number" step="0.01" className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1" value={createForm.unit_price} onChange={(e) => setCreateForm({ ...createForm, unit_price: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-white/60">Total (auto)</label>
                  <input type="text" readOnly className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1" value={`₹${Number(createTotal).toLocaleString('en-IN')}`} />
                </div>
                <div>
                  <label className="text-xs text-white/60">Payment</label>
                  <select className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1" value={createForm.payment_method} onChange={(e) => setCreateForm({ ...createForm, payment_method: e.target.value })}>
                    {['cash','card','upi','bank_transfer','credit'].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/60">Customer Name</label>
                  <input className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1" value={createForm.customer_name} onChange={(e) => setCreateForm({ ...createForm, customer_name: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-white/60">Customer Phone</label>
                  <input className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1" value={createForm.customer_phone} onChange={(e) => setCreateForm({ ...createForm, customer_phone: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-white/60">Sale Date/Time</label>
                  <input type="datetime-local" className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1" value={createForm.sale_date} onChange={(e) => setCreateForm({ ...createForm, sale_date: e.target.value })} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="px-3 py-2 rounded bg-white/10 hover:bg-white/20" onClick={() => setCreateOpen(false)}>Cancel</button>
                <button type="submit" className="px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-700">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-3">
          <div className="w-full max-w-lg bg-[#0f1535] text-white rounded-2xl border border-white/10 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Edit Sale</h3>
              <button className="text-white/60" onClick={() => setEditOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleEdit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/60">Quantity</label>
                  <input type="number" min={1} className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1" value={editForm.quantity_sold} onChange={(e) => setEditForm({ ...editForm, quantity_sold: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-white/60">Unit Price (₹)</label>
                  <input type="number" step="0.01" className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1" value={editForm.unit_price} onChange={(e) => setEditForm({ ...editForm, unit_price: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-white/60">Total (auto)</label>
                  <input type="text" readOnly className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1" value={`₹${Number(editTotal).toLocaleString('en-IN')}`} />
                </div>
                <div>
                  <label className="text-xs text-white/60">Payment</label>
                  <select className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1" value={editForm.payment_method} onChange={(e) => setEditForm({ ...editForm, payment_method: e.target.value })}>
                    {['cash','card','upi','bank_transfer','credit'].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/60">Customer Name</label>
                  <input className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1" value={editForm.customer_name} onChange={(e) => setEditForm({ ...editForm, customer_name: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-white/60">Customer Phone</label>
                  <input className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1" value={editForm.customer_phone} onChange={(e) => setEditForm({ ...editForm, customer_phone: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-white/60">Sale Date/Time</label>
                  <input type="datetime-local" className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1" value={editForm.sale_date} onChange={(e) => setEditForm({ ...editForm, sale_date: e.target.value })} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="px-3 py-2 rounded bg-white/10 hover:bg-white/20" onClick={() => setEditOpen(false)}>Cancel</button>
                <button type="submit" className="px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-700">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-3">
          <div className="w-full max-w-md bg-[#0f1535] text-white rounded-2xl border border-white/10 p-4">
            <h3 className="font-semibold mb-2">Delete Sale</h3>
            <p className="text-white/70 mb-4">Are you sure you want to delete this sale? This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button className="px-3 py-2 rounded bg-white/10 hover:bg-white/20" onClick={() => setDeleteOpen(false)}>Cancel</button>
              <button className="px-3 py-2 rounded bg-red-600 hover:bg-red-700" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {detailsOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-3">
          <div className="w-full max-w-xl bg-[#0f1535] text-white rounded-2xl border border-white/10 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Sale Details</h3>
              <button className="text-white/60" onClick={() => setDetailsOpen(false)}>✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-white/60">Date</p>
                <p>{detailsSale?.sale_date ? new Date(detailsSale.sale_date).toLocaleString() : '-'}</p>
              </div>
              <div>
                <p className="text-white/60">Payment</p>
                <p>{detailsSale?.payment_method || '-'}</p>
              </div>
              <div>
                <p className="text-white/60">Shop</p>
                <p>{detailsSale?.shop?.shop_name || detailsSale?.shop_id}</p>
              </div>
              <div>
                <p className="text-white/60">Product</p>
                <p>{detailsSale?.product?.product_name || detailsSale?.product_id}</p>
              </div>
              <div>
                <p className="text-white/60">Quantity</p>
                <p>{detailsSale?.quantity_sold}</p>
              </div>
              <div>
                <p className="text-white/60">Unit Price</p>
                <p>{detailsSale?.unit_price != null ? `₹${Number(detailsSale.unit_price).toLocaleString('en-IN')}` : '-'}</p>
              </div>
              <div>
                <p className="text-white/60">Total Amount</p>
                <p>{`₹${Number(detailsSale?.total_amount || 0).toLocaleString('en-IN')}`}</p>
              </div>
              <div>
                <p className="text-white/60">Customer</p>
                <p>{detailsSale?.customer_name || '-'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-white/60">Customer Phone</p>
                <p>{detailsSale?.customer_phone || '-'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
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
