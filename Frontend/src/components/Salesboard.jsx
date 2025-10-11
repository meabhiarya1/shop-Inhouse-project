import React, { useCallback, useEffect, useMemo, useState } from "react";
import { 
  Menu, 
  Plus, 
  Pencil, 
  Trash2, 
  Info,
  Grid3X3,
  List,
  ShoppingCart,
  DollarSign,
  Calendar,
  Package,
  Store,
  User,
  CreditCard,
  Search,
  Phone
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  DashboardProvider,
  useDashboard,
} from "../context/DashboardContext.jsx";
import PeriodSelect from "./navbar/PeriodSelect.jsx";
import ShopDropdown from "./navbar/ShopDropdown.jsx";
import AvatarDropdown from "./navbar/AvatarDropdown.jsx";
import CartIcon from "./navbar/CartIcon.jsx";
import Sidebar from "./Sidebar.jsx";
import Pagination from "./Pagination.jsx";
import { useLocation } from "react-router-dom";

function SalesboardInner() {
  const { selectedShop, period, shops } = useDashboard();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sales, setSales] = useState([]);
  const [totalSales, setTotalSales] = useState(0);
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 12,
    total_pages: 1,
  });
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  
  // View mode and search state
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "list"
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Data for forms/modals
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [activeSale, setActiveSale] = useState(null);
  const [detailsSale, setDetailsSale] = useState(null);

  const [createForm, setCreateForm] = useState({
    product_id: "",
    shop_id: "",
    quantity_sold: 1,
    unit_price: "",
    total_amount: "",
    customer_name: "",
    customer_phone: "",
    payment_method: "cash",
    sale_date: "",
  });

  // Product search states
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [editForm, setEditForm] = useState({
    id: "",
    quantity_sold: "",
    unit_price: "",
    total_amount: "",
    customer_name: "",
    customer_phone: "",
    payment_method: "cash",
    sale_date: "",
  });

  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${localStorage.getItem("auth_token") || ""}`,
    }),
    []
  );
  const title = useMemo(
    () => (location.pathname.startsWith("/sales") ? "Sales" : "Dashboard"),
    [location.pathname]
  );

  // Search products with debouncing
  const searchProducts = useCallback(
    async (query) => {
      if (!query || query.trim().length < 2 || !createForm.shop_id) {
        setFilteredProducts([]);
        return;
      }

      try {
        const { data } = await axios.get("/api/products/search", {
          params: {
            q: query.trim(),
            limit: 20,
            shop_id: createForm.shop_id,
          },
          headers,
        });
        const searchResults = Array.isArray(data?.data?.products)
          ? data.data.products
          : Array.isArray(data?.data)
          ? data.data
          : [];
        setFilteredProducts(searchResults);
      } catch {
        setFilteredProducts([]);
      }
    },
    [headers, createForm.shop_id]
  );

  // Debounced search function
  const debouncedSearch = useMemo(() => {
    let timeoutId;
    return (query) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => searchProducts(query), 300);
    };
  }, [searchProducts]);

  // Handle product search input
  const handleProductSearch = (e) => {
    const query = e.target.value;
    setProductSearchTerm(query);
    setShowProductDropdown(true);
    debouncedSearch(query);
  };

  // Handle shop selection change
  const handleShopChange = (e) => {
    const shopId = e.target.value;
    setCreateForm((prev) => ({
      ...prev,
      shop_id: shopId,
    }));

    // Clear product selection when shop changes
    setSelectedProduct(null);
    setProductSearchTerm("");
    setShowProductDropdown(false);
    setFilteredProducts([]);
  };

  // Handle product selection
  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setProductSearchTerm(product.product_name);
    setCreateForm((prev) => ({
      ...prev,
      product_id: String(product.id),
    }));
    setShowProductDropdown(false);
  };

  // Clear product selection
  const clearProductSelection = () => {
    setSelectedProduct(null);
    setProductSearchTerm("");
    setCreateForm((prev) => ({
      ...prev,
      product_id: "",
    }));
    setShowProductDropdown(false);
  };

  const loadSales = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 12, period };
      if (selectedShop) params.shop_id = selectedShop;
      const { data } = await axios.get("/api/sales", { params, headers });
      setSales(data?.data?.sales || []);
      setTotalSales(data?.data?.pagination?.total || 0);
      setPagination(
        data?.data?.pagination || {
          current_page: page,
          per_page: 12,
          total_pages: 1,
        }
      );
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error.message ||
        "Failed to load sales";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setCreateForm((f) => ({
      ...f,
      product_id: "",
      shop_id:
        selectedShop && selectedShop !== "all"
          ? String(selectedShop)
          : shops[0]?.id
          ? String(shops[0].id)
          : "",
      quantity_sold: 1,
      unit_price: "",
      total_amount: "",
      payment_method: "cash",
      sale_date: "",
    }));
    // Clear product search states
    setProductSearchTerm("");
    setSelectedProduct(null);
    setShowProductDropdown(false);
    setCreateOpen(true);
  };

  const createTotal = useMemo(() => {
    const q = Number(createForm.quantity_sold || 0);
    const u = Number(createForm.unit_price || 0);
    return isFinite(q * u) ? q * u : 0;
  }, [createForm.quantity_sold, createForm.unit_price]);

  const editTotal = useMemo(() => {
    const q = Number(editForm.quantity_sold || 0);
    const u = Number(editForm.unit_price || 0);
    return isFinite(q * u) ? q * u : 0;
  }, [editForm.quantity_sold, editForm.unit_price]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      if (!createForm.shop_id || createForm.shop_id === "all")
        return toast.error("Please select a shop first");
      if (!createForm.product_id) return toast.error("Please select a product");
      const payload = {
        product_id: Number(createForm.product_id),
        shop_id: Number(createForm.shop_id),
        quantity_sold: Number(createForm.quantity_sold),
        unit_price: createForm.unit_price
          ? Number(createForm.unit_price)
          : null,
        total_amount: Number(createTotal),
        customer_name: createForm.customer_name || undefined,
        customer_phone: createForm.customer_phone || undefined,
        payment_method: createForm.payment_method || "cash",
        sale_date: createForm.sale_date || undefined,
      };
      await axios.post("/api/sales", payload, { headers });
      toast.success("Sale created");
      setCreateOpen(false);
      await loadSales(pagination.current_page || 1);
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error.message ||
        "Failed to create sale";
      toast.error(msg);
    }
  };

  const openEdit = async (sale) => {
    try {
      const { data } = await axios.get(`/api/sales/${sale.id}`, { headers });
      const s = data?.data || sale;
      setActiveSale(s);
      setEditForm({
        id: s.id,
        quantity_sold: s.quantity_sold,
        unit_price: s.unit_price ?? "",
        total_amount: s.total_amount ?? "",
        customer_name: s.customer_name ?? "",
        customer_phone: s.customer_phone ?? "",
        payment_method: s.payment_method || "cash",
        sale_date: s.sale_date
          ? new Date(s.sale_date).toISOString().slice(0, 16)
          : "", // datetime-local format
      });
      setEditOpen(true);
    } catch {
      toast.error("Failed to load sale");
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        quantity_sold: Number(editForm.quantity_sold),
        unit_price: editForm.unit_price ? Number(editForm.unit_price) : null,
        total_amount: Number(editTotal),
        customer_name: editForm.customer_name || undefined,
        customer_phone: editForm.customer_phone || undefined,
        payment_method: editForm.payment_method || "cash",
        sale_date: editForm.sale_date || undefined,
      };
      await axios.put(`/api/sales/${editForm.id}`, payload, { headers });
      toast.success("Sale updated");
      setEditOpen(false);
      await loadSales(pagination.current_page || 1);
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error.message ||
        "Failed to update sale";
      toast.error(msg);
    }
  };

  const openDelete = (sale) => {
    setActiveSale(sale);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!activeSale) return;
    try {
      await axios.delete(`/api/sales/${activeSale.id}`, { headers });
      toast.success("Sale deleted");
      setDeleteOpen(false);
      await loadSales(pagination.current_page || 1);
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error.message ||
        "Failed to delete sale";
      toast.error(msg);
    }
  };

  const openDetails = async (sale) => {
    try {
      const { data } = await axios.get(`/api/sales/${sale.id}`, { headers });
      setDetailsSale(data?.data || sale);
      setDetailsOpen(true);
    } catch {
      setDetailsSale(sale);
      setDetailsOpen(true);
    }
  };

  useEffect(() => {
    loadSales(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedShop, period]);

  return (
    <div className="w-full min-h-screen bg-[#0a0f1e] flex items-stretch justify-center relative overflow-hidden">
      <div className="w-full max-w-7xl mx-4 my-6 bg-[#0f1535] rounded-3xl shadow-2xl overflow-hidden flex max-[500px]:mx-2 max-[500px]:my-3">
        <div className="lg:block hidden">
          <Sidebar />
        </div>
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="absolute left-0 top-0 bottom-0 z-50">
              <Sidebar />
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col">
          {/* Navbar */}
          <div className="h-16 px-4 lg:px-8 flex items-center justify-between border-b border-white/10 bg-[#0f1535] text-white max-[500px]:h-14 max-[500px]:px-3">
            <div className="flex items-center space-x-3">
              <button
                className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 max-[500px]:w-9 max-[500px]:h-9"
                onClick={() => setMobileSidebarOpen(true)}
              >
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

          {/* Content */}
          <div className="p-4 lg:p-8 text-white">
            <div className="mb-4">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="text-white/70 text-sm">
                  Period: {period.toUpperCase()} • Total: {pagination.total || sales.length} sales
                  {pagination.total > 0 && (
                    <span className="ml-2">
                      (Page {pagination.current_page} of {pagination.total_pages})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {/* View Toggle */}
                  <div className="flex items-center bg-white/5 rounded-lg p-1 border border-white/10">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 rounded-md transition-all ${
                        viewMode === "grid"
                          ? "bg-indigo-600 text-white"
                          : "text-white/60 hover:text-white hover:bg-white/10"
                      }`}
                      title="Grid View"
                    >
                      <Grid3X3 size={16} />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2 rounded-md transition-all ${
                        viewMode === "list"
                          ? "bg-indigo-600 text-white"
                          : "text-white/60 hover:text-white hover:bg-white/10"
                      }`}
                      title="List View"
                    >
                      <List size={16} />
                    </button>
                  </div>

                  <div className="relative w-[240px] sm:w-[320px]">
                    <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center text-white/50">
                      <Search size={16} />
                    </div>
                    <input
                      className="w-full h-10 pl-9 pr-8 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Search sales..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                      {isSearching ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white/60"></div>
                      ) : searchTerm ? (
                        <button
                          onClick={() => setSearchTerm("")}
                          className="text-white/60 hover:text-white"
                          title="Clear"
                        >
                          ✕
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {/* <button
                    onClick={openCreate}
                    className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded-lg text-sm whitespace-nowrap"
                  >
                    <Plus size={16} />
                    <span>Create Sale</span>
                  </button> */}
                </div>
              </div>
            </div>

            <div className="rounded-2xl p-5 bg-gradient-to-br from-[#121a3d] to-[#182057] border border-white/10">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto mb-4"></div>
                    <p className="text-white/60">Loading sales...</p>
                  </div>
                </div>
              ) : sales.filter(s => !searchTerm || 
                s?.product?.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s?.shop?.shop_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s?.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
              ).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
                    <ShoppingCart size={32} className="text-white/40" />
                  </div>
                  <h3 className="text-lg font-medium text-white/80 mb-2">No sales found</h3>
                  <p className="text-white/60 text-center">
                    {searchTerm ? "Try adjusting your search terms." : "No sales records available for the selected period."}
                  </p>
                </div>
              ) : (
                <>
                  {viewMode === "grid" ? (
                    // Grid View
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {sales.filter(s => !searchTerm || 
                        s?.product?.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        s?.shop?.shop_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        s?.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
                      ).map((s) => (
                        <div
                          key={s.id}
                          className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all group cursor-pointer"
                          onClick={() => openDetails(s)}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
                              <ShoppingCart size={20} className="text-green-400" />
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEdit(s);
                                }}
                                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100"
                                title="Edit Sale"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDelete(s);
                                }}
                                className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-all opacity-0 group-hover:opacity-100"
                                title="Delete Sale"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          <div className="mb-3">
                            <h3 className="font-medium capitalize text-white truncate mb-2">
                              {s?.product?.product_name || s.product_id}
                            </h3>
                            
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Store size={14} className="text-white/40" />
                                <span className="text-white/60 text-xs capitalize">
                                  {s?.shop?.shop_name || s.shop_id}
                                </span>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Calendar size={14} className="text-white/40" />
                                <span className="text-white/60 text-xs">
                                  {new Date(s.sale_date).toLocaleDateString()}
                                </span>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Package size={14} className="text-white/40" />
                                <span className="text-white/60 text-xs">
                                  Qty: {s.quantity_sold}
                                </span>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <User size={14} className="text-white/40" />
                                <span className="text-white/60 text-xs capitalize">
                                  {s.customer_name || "N/A"}
                                </span>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Phone size={14} className="text-white/40" />
                                <span className="text-white/60 text-xs">
                                  {s.customer_phone || "N/A"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2 mb-4">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-white/60">Unit Price:</span>
                              <span className="text-white font-medium">
                                {s.unit_price != null
                                  ? `₹${Number(s.unit_price).toLocaleString("en-IN")}`
                                  : "-"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-white/60">Total:</span>
                              <span className="text-green-400 font-bold">
                                ₹{Number(s.total_amount || 0).toLocaleString("en-IN")}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-white/60">Payment:</span>
                              <div className="flex items-center space-x-1">
                                <CreditCard size={12} className="text-white/40" />
                                <span className="text-white/60 capitalize text-xs">
                                  {s.payment_method}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-center gap-1 pt-2 border-t border-white/10">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openDetails(s);
                              }}
                              className="flex-1 px-2 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all text-xs flex items-center justify-center space-x-1"
                            >
                              <Info size={12} />
                              <span className="hidden sm:inline">Details</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    // List View (Table)
                    <div className="overflow-x-auto">
                      <div className="max-h-[440px] scroll-y-invisible overflow-y-auto rounded-lg">
                        <table className="min-w-full table-fixed text-sm">
                          <thead className="sticky top-0 z-10 bg-[#121a3d] text-white/70">
                            <tr>
                              <th className="text-left p-3 font-medium">Sale</th>
                              <th className="text-left p-3 font-medium">Shop</th>
                              <th className="text-left p-3 font-medium">Product</th>
                              <th className="text-right p-3 w-20 font-medium">Qty</th>
                              <th className="text-right p-3 w-32 font-medium">Unit Price</th>
                              <th className="text-right p-3 w-32 font-medium">Total</th>
                              <th className="text-left p-3 w-24 font-medium">Payment</th>
                              <th className="text-center p-3 w-32 font-medium">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sales.filter(s => !searchTerm || 
                              s?.product?.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              s?.shop?.shop_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              s?.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
                            ).map((s) => (
                              <tr
                                key={s.id}
                                className="border-t border-white/10 hover:bg-white/5 transition-colors"
                              >
                                <td className="p-3">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-green-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                      <ShoppingCart size={16} className="text-green-400" />
                                    </div>
                                    <div>
                                      <div className="text-white/60 text-xs">
                                        {new Date(s.sale_date).toLocaleDateString()}
                                      </div>
                                      <div className="text-white/50 text-xs capitalize">
                                        {s.customer_name || "N/A"}
                                      </div>
                                      <div className="text-white/40 text-xs">
                                        {s.customer_phone || "N/A"}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-3 capitalize">
                                  {s?.shop?.shop_name || s.shop_id}
                                </td>
                                <td className="p-3 capitalize">
                                  {s?.product?.product_name || s.product_id}
                                </td>
                                <td className="p-3 text-right">
                                  <span className="bg-white/10 px-2 py-1 rounded-full text-xs">
                                    {s.quantity_sold}
                                  </span>
                                </td>
                                <td className="p-3 text-right">
                                  {s.unit_price != null
                                    ? `₹${Number(s.unit_price).toLocaleString("en-IN")}`
                                    : "-"}
                                </td>
                                <td className="p-3 text-right font-bold text-green-400">
                                  ₹{Number(s.total_amount || 0).toLocaleString("en-IN")}
                                </td>
                                <td className="p-3">
                                  <div className="flex items-center space-x-1">
                                    <CreditCard size={12} className="text-white/40" />
                                    <span className="capitalize text-xs">
                                      {s.payment_method}
                                    </span>
                                  </div>
                                </td>
                                <td className="p-3">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-all border border-white/10"
                                      onClick={() => openEdit(s)}
                                      title="Edit"
                                    >
                                      <Pencil size={14} />
                                    </button>
                                    <button
                                      className="px-2 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-all border border-red-500/30"
                                      onClick={() => openDelete(s)}
                                      title="Delete"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                    <button
                                      className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-all border border-white/10"
                                      onClick={() => openDetails(s)}
                                      title="Details"
                                    >
                                      <Info size={14} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}

              {sales.length > 0 && (
                <div className="mt-5">
                  <Pagination
                    currentPage={pagination.current_page}
                    totalPages={pagination.total_pages}
                    onPageChange={(page) => loadSales(page)}
                    totalItems={totalSales}
                    pageSize={pagination.per_page}
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
              <h3 className="font-semibold">Create Sale</h3>
              <button
                className="text-white/60"
                onClick={() => setCreateOpen(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              {/* First Row - Shop Selection */}
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="text-xs text-white/60">Shop *</label>
                  <select
                    className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1"
                    value={createForm.shop_id}
                    onChange={handleShopChange}
                    required
                  >
                    <option value="">Select Shop First</option>
                    {shops.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.shop_name || s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Second Row - Product Search */}
              <div className="grid grid-cols-1 gap-3">
                <div className="relative">
                  <label className="text-xs text-white/60">Product *</label>
                  <div className="relative">
                    <input
                      type="text"
                      className={`w-full bg-white/10 border border-white/10 rounded p-2 mt-1 pr-8 ${
                        !createForm.shop_id
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                      placeholder={
                        createForm.shop_id
                          ? "Search products..."
                          : "Select a shop first to search products"
                      }
                      value={productSearchTerm}
                      onChange={handleProductSearch}
                      onFocus={() =>
                        createForm.shop_id && setShowProductDropdown(true)
                      }
                      onBlur={() =>
                        setTimeout(() => setShowProductDropdown(false), 200)
                      }
                      disabled={!createForm.shop_id}
                    />
                    {productSearchTerm && createForm.shop_id && (
                      <button
                        type="button"
                        onClick={clearProductSelection}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                      >
                        ✕
                      </button>
                    )}

                    {/* Product Dropdown */}
                    {showProductDropdown && createForm.shop_id && (
                      <div className="absolute z-50 w-full mt-1 bg-[#0f1535] border border-white/10 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {filteredProducts.length > 0 ? (
                          filteredProducts.map((product) => (
                            <div
                              key={product.id}
                              className="px-3 py-2 hover:bg-white/10 cursor-pointer text-sm border-b border-white/5 last:border-b-0"
                              onClick={() => handleProductSelect(product)}
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="font-medium text-white">
                                    {product.product_name}
                                  </div>
                                  <div className="text-xs text-white/60">
                                    {product.brand?.brand_name &&
                                      `${product.brand.brand_name} • `}
                                    Qty: {product.quantity}
                                  </div>
                                </div>
                                <div className="text-xs text-white/40">
                                  {product.category?.category_name}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : productSearchTerm.length >= 2 ? (
                          <div className="px-3 py-2 text-white/60 text-sm">
                            No products found for "{productSearchTerm}" in this
                            shop
                          </div>
                        ) : productSearchTerm.length > 0 ? (
                          <div className="px-3 py-2 text-white/60 text-sm">
                            Type at least 2 characters to search
                          </div>
                        ) : (
                          <div className="px-3 py-2 text-white/60 text-sm">
                            Start typing to search products...
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Selected Product Display */}
                  {selectedProduct && (
                    <div className="mt-2 p-2 bg-white/5 rounded border border-white/10">
                      <div className="text-xs text-white/80">
                        <strong>Selected:</strong>{" "}
                        {selectedProduct.product_name}
                        {selectedProduct.brand?.brand_name &&
                          ` • ${selectedProduct.brand.brand_name}`}
                        {selectedProduct.shop?.shop_name &&
                          ` • ${selectedProduct.shop.shop_name}`}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Third Row - Other Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/60">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1"
                    value={createForm.quantity_sold}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        quantity_sold: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs text-white/60">
                    Unit Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1"
                    value={createForm.unit_price}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        unit_price: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs text-white/60">Total (auto)</label>
                  <input
                    type="text"
                    readOnly
                    className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1"
                    value={`₹${Number(createTotal).toLocaleString("en-IN")}`}
                  />
                </div>
                <div>
                  <label className="text-xs text-white/60">Payment</label>
                  <select
                    className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1"
                    value={createForm.payment_method}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        payment_method: e.target.value,
                      })
                    }
                  >
                    {["cash", "card", "upi", "bank_transfer", "credit"].map(
                      (m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      )
                    )}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/60">Customer Name</label>
                  <input
                    className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1"
                    value={createForm.customer_name}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        customer_name: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs text-white/60">
                    Customer Phone
                  </label>
                  <input
                    className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1"
                    value={createForm.customer_phone}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        customer_phone: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-white/60">
                    Sale Date/Time
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1"
                    value={createForm.sale_date}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        sale_date: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="px-3 py-2 rounded bg-white/10 hover:bg-white/20"
                  onClick={() => setCreateOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3">
          <div className="w-full max-w-3xl bg-gradient-to-br from-[#0f1535] to-[#1a2048] text-white rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-indigo-600/20 rounded-xl flex items-center justify-center">
                    <Pencil size={24} className="text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Edit Sale</h3>
                    <p className="text-white/60 text-sm">Update sale information</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                  onClick={() => setEditOpen(false)}
                >
                  <span className="text-white/80 text-lg">✕</span>
                </button>
              </div>
            </div>

            {/* Form Content */}
            <form onSubmit={handleEdit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Quantity & Unit Price */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10 h-full">
                  <div className="flex items-center space-x-2 mb-4">
                    <Package size={18} className="text-indigo-400" />
                    <h4 className="font-semibold text-white">Quantity & Price</h4>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center space-x-2 text-sm text-white/70 mb-2">
                        <Package size={14} />
                        <span>Quantity</span>
                      </label>
                      <input
                        type="number"
                        min={1}
                        className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-white/40 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all"
                        value={editForm.quantity_sold}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            quantity_sold: e.target.value,
                          })
                        }
                      />
                    </div>
                    
                    <div>
                      <label className="flex items-center space-x-2 text-sm text-white/70 mb-2">
                        <DollarSign size={14} />
                        <span>Unit Price (₹)</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-white/40 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all"
                        value={editForm.unit_price}
                        onChange={(e) =>
                          setEditForm({ ...editForm, unit_price: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Payment & Total */}
                <div className="bg-gradient-to-br from-green-600/10 to-emerald-600/10 rounded-xl p-4 border border-green-600/20 h-full">
                  <div className="flex items-center space-x-2 mb-4">
                    <DollarSign size={18} className="text-green-400" />
                    <h4 className="font-semibold text-white">Payment Details</h4>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center space-x-2 text-sm text-white/70 mb-2">
                        <CreditCard size={14} />
                        <span>Payment Method</span>
                      </label>
                      <select
                        className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white focus:border-green-400 focus:ring-2 focus:ring-green-400/20 transition-all"
                        value={editForm.payment_method}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            payment_method: e.target.value,
                          })
                        }
                      >
                        {["cash", "card", "upi", "bank_transfer", "credit"].map(
                          (m) => (
                            <option key={m} value={m} className="bg-[#0f1535] text-white">
                              {m.charAt(0).toUpperCase() + m.slice(1).replace('_', ' ')}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                    
                    <div>
                      <label className="flex items-center space-x-2 text-sm text-white/70 mb-2">
                        <DollarSign size={14} />
                        <span>Total Amount</span>
                      </label>
                      <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-600/30 rounded-lg p-4 text-center">
                        <span className="text-green-400 font-bold text-2xl">
                          ₹{Number(editTotal).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10 h-full">
                  <div className="flex items-center space-x-2 mb-4">
                    <User size={18} className="text-purple-400" />
                    <h4 className="font-semibold text-white">Customer Information</h4>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center space-x-2 text-sm text-white/70 mb-2">
                        <User size={14} />
                        <span>Customer Name</span>
                      </label>
                      <input
                        type="text"
                        className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-white/40 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                        placeholder="Enter customer name"
                        value={editForm.customer_name}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            customer_name: e.target.value,
                          })
                        }
                      />
                    </div>
                    
                    <div>
                      <label className="flex items-center space-x-2 text-sm text-white/70 mb-2">
                        <Phone size={14} />
                        <span>Customer Phone</span>
                      </label>
                      <input
                        type="tel"
                        className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-white/40 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                        placeholder="Enter phone number"
                        value={editForm.customer_phone}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            customer_phone: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Sale Date & Time */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10 h-full">
                  <div className="flex items-center space-x-2 mb-4">
                    <Calendar size={18} className="text-blue-400" />
                    <h4 className="font-semibold text-white">Sale Date & Time</h4>
                  </div>
                  
                  <div className="flex flex-col justify-center h-full">
                    <div>
                      <label className="flex items-center space-x-2 text-sm text-white/70 mb-2">
                        <Calendar size={14} />
                        <span>Date & Time</span>
                      </label>
                      <input
                        type="datetime-local"
                        className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
                        value={editForm.sale_date}
                        onChange={(e) =>
                          setEditForm({ ...editForm, sale_date: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="mt-6 pt-4 border-t border-white/10 flex justify-end space-x-3">
                <button
                  type="button"
                  className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all border border-white/10"
                  onClick={() => setEditOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all flex items-center space-x-2 shadow-lg"
                >
                  <span>Save Changes</span>
                </button>
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
            <p className="text-white/70 mb-4">
              Are you sure you want to delete this sale? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="px-3 py-2 rounded bg-white/10 hover:bg-white/20"
                onClick={() => setDeleteOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-3 py-2 rounded bg-red-600 hover:bg-red-700"
                onClick={handleDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {detailsOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3">
          <div className="w-full max-w-2xl bg-gradient-to-br from-[#0f1535] to-[#1a2048] text-white rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-600/20 rounded-xl flex items-center justify-center">
                    <ShoppingCart size={24} className="text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Sale Details</h3>
                    <p className="text-white/60 text-sm">Transaction Information</p>
                  </div>
                </div>
                <button
                  className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                  onClick={() => setDetailsOpen(false)}
                >
                  <span className="text-white/80 text-lg">✕</span>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sale Information */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10 h-full">
                  <div className="flex items-center space-x-3 mb-4">
                    <Calendar size={20} className="text-indigo-400" />
                    <h4 className="font-semibold text-white">Sale Information</h4>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white/60 text-sm">Date & Time</span>
                      <span className="text-white font-medium text-right">
                        {detailsSale?.sale_date
                          ? new Date(detailsSale.sale_date).toLocaleString()
                          : "N/A"}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-white/60 text-sm">Quantity</span>
                      <span className="bg-indigo-600/20 text-indigo-300 px-3 py-1 rounded-full text-sm font-medium">
                        {detailsSale?.quantity_sold || "0"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Shop & Product */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10 h-full">
                  <div className="flex items-center space-x-3 mb-4">
                    <Store size={20} className="text-blue-400" />
                    <h4 className="font-semibold text-white">Shop & Product</h4>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="text-white/60 text-sm block mb-1">Shop Name</span>
                      <span className="text-white capitalize">
                        {detailsSale?.shop?.shop_name || detailsSale?.shop_id || "N/A"}
                      </span>
                    </div>
                    
                    <div>
                      <span className="text-white/60 text-sm block mb-1">Product Name</span>
                      <span className="text-white capitalize">
                        {detailsSale?.product?.product_name || detailsSale?.product_id || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Financial Details */}
                <div className="bg-gradient-to-br from-green-600/10 to-emerald-600/10 rounded-xl p-4 border border-green-600/20 h-full">
                  <div className="flex items-center space-x-3 mb-4">
                    <DollarSign size={20} className="text-green-400" />
                    <h4 className="font-semibold text-white">Financial Details</h4>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white/60 text-sm">Unit Price</span>
                      <span className="text-white font-medium">
                        {detailsSale?.unit_price != null
                          ? `₹${Number(detailsSale.unit_price).toLocaleString("en-IN")}`
                          : "N/A"}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between py-2 border-t border-white/10">
                      <span className="text-green-300 font-medium">Total Amount</span>
                      <span className="text-green-400 font-bold text-lg">
                        ₹{Number(detailsSale?.total_amount || 0).toLocaleString("en-IN")}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-white/60 text-sm">Payment Method</span>
                      <div className="flex items-center space-x-2">
                        <CreditCard size={16} className="text-white/40" />
                        <span className="text-white capitalize">
                          {detailsSale?.payment_method || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10 h-full">
                  <div className="flex items-center space-x-3 mb-4">
                    <User size={20} className="text-purple-400" />
                    <h4 className="font-semibold text-white">Customer Details</h4>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="text-white/60 text-sm block mb-1">Customer Name</span>
                      <span className="text-white capitalize">
                        {detailsSale?.customer_name || "N/A"}
                      </span>
                    </div>
                    
                    <div>
                      <span className="text-white/60 text-sm block mb-1">Phone Number</span>
                      <div className="flex items-center space-x-2">
                        <Phone size={14} className="text-white/40" />
                        <span className="text-white">
                          {detailsSale?.customer_phone || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="mt-6 pt-4 border-t border-white/10 flex justify-end space-x-3">
                <button
                  onClick={() => setDetailsOpen(false)}
                  className="px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all border border-white/10"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setDetailsOpen(false);
                    openEdit(detailsSale);
                  }}
                  className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all flex items-center space-x-2"
                >
                  <Pencil size={16} />
                  <span>Edit Sale</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Salesboard() {
  return (
    <DashboardProvider>
      <SalesboardInner />
    </DashboardProvider>
  );
}
