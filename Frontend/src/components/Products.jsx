import React, { useEffect, useMemo, useState } from 'react'
import { Menu, Plus, Pencil, Trash2, Info, CheckSquare, Square } from 'lucide-react'
import axios from 'axios'
import { toast } from 'react-toastify'
import Sidebar from './Sidebar.jsx'
import Pagination from './Pagination.jsx'
import { DashboardProvider, useDashboard } from '../context/DashboardContext.jsx'
import PeriodSelect from './navbar/PeriodSelect.jsx'
import ShopDropdown from './navbar/ShopDropdown.jsx'
import AvatarDropdown from './navbar/AvatarDropdown.jsx'

function ProductsInner() {
  const { selectedShop, period, shops } = useDashboard()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  })

  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const [activeProduct, setActiveProduct] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])

  const [form, setForm] = useState({
    product_name: '',
    length: '',
    width: '',
    thickness: '',
    quantity: '',
    weight: '',
    brand_id: '',
    shop_id: '',
    category_id: ''
  })

  const headers = useMemo(() => ({ Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}` }), [])

  const loadProducts = async (page = 1) => {
    setLoading(true)
    try {
      const params = { 
        period,
        page,
        limit: 10
      }
      // Prefer shop-specific endpoint for clarity; supports 'all'
      const url = `/api/products/shop/${selectedShop || 'all'}`
      const { data } = await axios.get(url, { params, headers })
      
      // Handle different response structures
      const productsList = Array.isArray(data?.data?.products)
        ? data.data.products
        : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
        ? data
        : []
      
      setProducts(productsList)
      
      // Set pagination data
      if (data?.pagination) {
        setPagination(data.pagination)
        setCurrentPage(data.pagination.currentPage)
      } else {
        // Fallback for legacy response
        setPagination({
          currentPage: page,
          limit: 10,
          total: data?.data?.totalProducts || productsList.length,
          totalPages: Math.ceil((data?.data?.totalProducts || productsList.length) / 10),
          hasNextPage: false,
          hasPrevPage: false
        })
        setCurrentPage(page)
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
    loadProducts(page)
    setSelectedIds([]) // Clear selections when changing pages
  }

  useEffect(() => { 
    if (selectedShop) {
      setCurrentPage(1) // Reset to first page when shop/period changes
      loadProducts(1) 
    }
  }, [selectedShop, period])

  const openCreate = () => {
    setForm({
      product_name: '', length: '', width: '', thickness: '', quantity: '', weight: '',
      brand_id: '', shop_id: selectedShop && selectedShop !== 'all' ? String(selectedShop) : (shops[0]?.id ? String(shops[0].id) : ''), category_id: ''
    })
    setCreateOpen(true)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...form,
        length: Number(form.length),
        width: Number(form.width),
        thickness: form.thickness ? Number(form.thickness) : null,
        quantity: Number(form.quantity),
        weight: form.weight ? Number(form.weight) : null,
        brand_id: Number(form.brand_id),
        shop_id: Number(form.shop_id),
        category_id: Number(form.category_id)
      }
      await axios.post('/api/products', payload, { headers })
      toast.success('Product created')
      setCreateOpen(false)
      loadProducts(currentPage)
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || 'Failed to create product')
    }
  }

  const openEdit = (prod) => {
    setActiveProduct(prod)
    setForm({
      product_name: prod.product_name || '',
      length: prod.length ?? '',
      width: prod.width ?? '',
      thickness: prod.thickness ?? '',
      quantity: prod.quantity ?? '',
      weight: prod.weight ?? '',
      brand_id: prod.brand?.id ?? prod.brand_id ?? '',
      shop_id: prod.shop?.id ?? prod.shop_id ?? '',
      category_id: prod.category?.id ?? prod.category_id ?? ''
    })
    setEditOpen(true)
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...form,
        length: Number(form.length),
        width: Number(form.width),
        thickness: form.thickness ? Number(form.thickness) : null,
        quantity: Number(form.quantity),
        weight: form.weight ? Number(form.weight) : null,
        brand_id: Number(form.brand_id),
        shop_id: Number(form.shop_id),
        category_id: Number(form.category_id)
      }
      await axios.put(`/api/products/${activeProduct.id}`, payload, { headers })
      toast.success('Product updated')
      setEditOpen(false)
      loadProducts(currentPage)
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || 'Failed to update product')
    }
  }

  const toggleSelected = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleDeleteMultiple = async () => {
    if (selectedIds.length === 0) return toast.info('Select at least one product')
    try {
      await axios.delete('/api/products/delete/multiple', { data: { productIds: selectedIds }, headers })
      toast.success('Deleted selected products')
      setSelectedIds([])
      // If we deleted all items on current page and it's not page 1, go to previous page
      const remainingItems = pagination.total - selectedIds.length
      const newTotalPages = Math.ceil(remainingItems / pagination.limit)
      const targetPage = currentPage > newTotalPages ? Math.max(1, newTotalPages) : currentPage
      loadProducts(targetPage)
    } catch (e) {
      toast.error(e?.response?.data?.message || e.message || 'Failed to delete products')
    }
  }

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
              <h1 className="text-xl font-bold max-[500px]:text-lg">Products</h1>
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
              <div className="text-white/70 text-sm">
                Total: {pagination.total} products
                {pagination.total > 0 && (
                  <span className="ml-2">
                    (Page {pagination.currentPage} of {pagination.totalPages})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={openCreate} className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded-lg text-sm">
                  <Plus size={16} />
                  <span>Create Product</span>
                </button>
                <button onClick={handleDeleteMultiple} className="inline-flex items-center space-x-2 bg-red-600 hover:bg-red-700 px-3 py-2 rounded-lg text-sm">
                  <Trash2 size={16} />
                  <span>Delete Selected</span>
                </button>
              </div>
            </div>

            <div className="rounded-2xl p-5 bg-gradient-to-br from-[#121a3d] to-[#182057] border border-white/10">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-white/70">
                    <tr>
                      <th className="text-left p-2 w-8"></th>
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Brand</th>
                      <th className="text-left p-2">Shop</th>
                      <th className="text-left p-2">Category</th>
                      <th className="text-right p-2">Qty</th>
                      <th className="text-left p-2">Size (L×W×T)</th>
                      <th className="text-left p-2">Weight</th>
                      <th className="text-left p-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td className="p-2" colSpan={9}>Loading...</td></tr>
                    ) : products.length === 0 ? (
                      <tr><td className="p-2" colSpan={9}>No products found</td></tr>
                    ) : (
                      products.map((p) => (
                        <tr key={p.id} className="border-t border-white/10 hover:bg-white/5">
                          <td className="p-2">
                            <button onClick={() => toggleSelected(p.id)} className="p-1 rounded bg-white/5 hover:bg-white/10">
                              {selectedIds.includes(p.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                            </button>
                          </td>
                          <td className="p-2">{p.product_name}</td>
                          <td className="p-2">{p?.brand?.brand_name || '-'}</td>
                          <td className="p-2">{p?.shop?.shop_name || '-'}</td>
                          <td className="p-2">{p?.category?.category_name || '-'}</td>
                          <td className="p-2 text-right">{p.quantity}</td>
                          <td className="p-2">{[p.length, p.width, p.thickness].filter(v => v != null && v !== '').join(' × ')}</td>
                          <td className="p-2">{p.weight ?? '-'}</td>
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <button className="px-2 py-1 rounded bg-white/10 hover:bg-white/20" onClick={() => openEdit(p)} title="Edit">
                                <Pencil size={14} />
                              </button>
                              <button className="px-2 py-1 rounded bg-white/10 hover:bg-white/20" onClick={() => { setActiveProduct(p); setDetailsOpen(true) }} title="Details">
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
              {!loading && pagination.totalPages > 1 && (
                <div className="mt-6 pt-4 border-t border-white/10">
                  <Pagination
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    total={pagination.total}
                    limit={pagination.limit}
                    onPageChange={handlePageChange}
                    className="text-white"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {createOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-3">
          <div className="w-full max-w-lg bg-[#0f1535] text-white rounded-2xl border border-white/10 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Create Product</h3>
              <button className="text-white/60" onClick={() => setCreateOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/60">Name</label>
                  <input className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1" value={form.product_name} onChange={(e) => setForm({ ...form, product_name: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-white/60">Brand ID</label>
                  <input className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1" value={form.brand_id} onChange={(e) => setForm({ ...form, brand_id: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-white/60">Shop</label>
                  <select className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1" value={form.shop_id} onChange={(e) => setForm({ ...form, shop_id: e.target.value })}>
                    <option value="">Select Shop</option>
                    {shops.map(s => <option key={s.id} value={s.id}>{s.shop_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/60">Category ID</label>
                  <input className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-white/60">Length</label>
                  <input type="number" step="0.01" className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1" value={form.length} onChange={(e) => setForm({ ...form, length: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-white/60">Width</label>
                  <input type="number" step="0.01" className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1" value={form.width} onChange={(e) => setForm({ ...form, width: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-white/60">Thickness</label>
                  <input type="number" step="0.01" className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1" value={form.thickness} onChange={(e) => setForm({ ...form, thickness: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-white/60">Quantity</label>
                  <input type="number" className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-white/60">Weight</label>
                  <input type="number" step="0.01" className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
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
              <h3 className="font-semibold">Edit Product</h3>
              <button className="text-white/60" onClick={() => setEditOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleEdit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/60">Name</label>
                  <input className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1" value={form.product_name} onChange={(e) => setForm({ ...form, product_name: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-white/60">Brand ID</label>
                  <input className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1" value={form.brand_id} onChange={(e) => setForm({ ...form, brand_id: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-white/60">Shop</label>
                  <select className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1" value={form.shop_id} onChange={(e) => setForm({ ...form, shop_id: e.target.value })}>
                    <option value="">Select Shop</option>
                    {shops.map(s => <option key={s.id} value={s.id}>{s.shop_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/60">Category ID</label>
                  <input className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-white/60">Length</label>
                  <input type="number" step="0.01" className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1" value={form.length} onChange={(e) => setForm({ ...form, length: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-white/60">Width</label>
                  <input type="number" step="0.01" className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1" value={form.width} onChange={(e) => setForm({ ...form, width: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-white/60">Thickness</label>
                  <input type="number" step="0.01" className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1" value={form.thickness} onChange={(e) => setForm({ ...form, thickness: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-white/60">Quantity</label>
                  <input type="number" className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-white/60">Weight</label>
                  <input type="number" step="0.01" className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
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

      {/* Details Modal */}
      {detailsOpen && activeProduct && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-3">
          <div className="w-full max-w-xl bg-[#0f1535] text-white rounded-2xl border border-white/10 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Product Details</h3>
              <button className="text-white/60" onClick={() => setDetailsOpen(false)}>✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-white/60">Name</p>
                <p>{activeProduct?.product_name}</p>
              </div>
              <div>
                <p className="text-white/60">Brand</p>
                <p>{activeProduct?.brand?.brand_name || activeProduct?.brand_id}</p>
              </div>
              <div>
                <p className="text-white/60">Shop</p>
                <p>{activeProduct?.shop?.shop_name || activeProduct?.shop_id}</p>
              </div>
              <div>
                <p className="text-white/60">Category</p>
                <p>{activeProduct?.category?.category_name || activeProduct?.category_id}</p>
              </div>
              <div>
                <p className="text-white/60">Quantity</p>
                <p>{activeProduct?.quantity}</p>
              </div>
              <div>
                <p className="text-white/60">Size</p>
                <p>{[activeProduct?.length, activeProduct?.width, activeProduct?.thickness].filter(Boolean).join(' × ')}</p>
              </div>
              <div>
                <p className="text-white/60">Weight</p>
                <p>{activeProduct?.weight ?? '-'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Products() {
  return (
    <DashboardProvider>
      <ProductsInner />
    </DashboardProvider>
  )
}
