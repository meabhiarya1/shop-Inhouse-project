import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Menu,
  Plus,
  Minus,
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
  Phone,
} from "lucide-react";
import axios from "../utils/axiosConfig";
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
    currentPage: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  // View mode and search state
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "list"
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [searchPagination, setSearchPagination] = useState({
    currentPage: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Filter states
  const [filterWalkIn, setFilterWalkIn] = useState(false); // Filter for walk-in/anonymous customers
  const [filterRestAmount, setFilterRestAmount] = useState(false); // Filter for sales with rest amount

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
    items: [], // Array of sale items with their details
    customer_name: "",
    customer_phone: "",
    payment_method: "cash",
    sale_date: "",
    customer_paid: 0,
    discount_amount: 0,
    rest_amount: 0,
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
          currentPage: page,
          limit: 12,
          total: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
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

  // Search sales with API
  const searchSalesApi = useCallback(
    async (query, page = 1) => {
      // Validate query
      if (!query || query.trim().length < 2) {
        setSearchResults(null);
        setSearchTerm("");
        setSales([]);
        setPagination({
          currentPage: 1,
          limit: 12,
          total: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        });
        return;
      }

      setIsSearching(true);
      try {
        const params = {
          q: query.trim(),
          limit: 12,
          page,
        };

        const { data } = await axios.get("/api/sales/search", {
          params,
          headers,
        });

        if (data?.success && data?.data?.sales) {
          setSales(data.data.sales);
          setSearchPagination(data.data.pagination || {
            currentPage: page,
            limit: 12,
            total: 0,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
          });
          setSearchResults(true);
        }
      } catch (error) {
        const msg =
          error?.response?.data?.message ||
          error.message ||
          "Failed to search sales";
        console.error("Search error:", error);
        setSearchResults(true);
        setSales([]);
      } finally {
        setIsSearching(false);
      }
    },
    [headers]
  );

  // Debounced search for sales
  const debouncedSearchSales = useMemo(() => {
    let timeoutId;
    return (query) => {
      clearTimeout(timeoutId);
      if (!query || query.trim().length === 0) {
        setSearchTerm("");
        setSearchResults(null);
        loadSales(1);
        return;
      }
      setSearchTerm(query);
      setIsSearching(true);
      timeoutId = setTimeout(() => {
        searchSalesApi(query, 1);
      }, 500); // 500ms debounce
    };
  }, [searchSalesApi]);

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    debouncedSearchSales(value);
  };

  // Handle search pagination
  const handleSearchPageChange = (page) => {
    if (searchTerm && searchTerm.trim().length >= 2) {
      searchSalesApi(searchTerm, page);
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

  // Calculate edit totals based on items
  const editTotals = useMemo(() => {
    let grandTotal = 0;
    const itemTotals = {};
    
    editForm.items.forEach(item => {
      const unitPrice = parseFloat(item.unit_price) || 0;
      const quantity = parseInt(item.quantity_sold) || 0;
      const itemTotal = unitPrice * quantity;
      itemTotals[item.id] = itemTotal;
      grandTotal += itemTotal;
    });

    return {
      itemTotals,
      grandTotal
    };
  }, [editForm.items]);

  // Handle item quantity change in edit modal
  const handleEditItemQuantityChange = (itemId, newQuantity) => {
    setEditForm(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === itemId 
          ? { ...item, quantity_sold: newQuantity }
          : item
      )
    }));
  };

  // Handle item unit price change in edit modal
  const handleEditItemPriceChange = (itemId, newPrice) => {
    setEditForm(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === itemId 
          ? { ...item, unit_price: newPrice }
          : item
      )
    }));
  };

  // Handle item removal in edit modal
  const handleEditItemRemove = (itemId) => {
    setEditForm(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
  };

  // Filter sales based on selected filters
  const filteredSales = useMemo(() => {
    let filtered = [...sales];

    // Filter for walk-in/anonymous customers
    if (filterWalkIn) {
      filtered = filtered.filter(
        (s) => !s.customer_name || s.customer_name.toLowerCase().includes('walk') || s.customer_name.toLowerCase().includes('anonymous')
      );
    }

    // Filter for sales with rest amount (pending payment)
    if (filterRestAmount) {
      filtered = filtered.filter(
        (s) => s.rest_amount && parseFloat(s.rest_amount) > 0
      );
    }

    return filtered;
  }, [sales, filterWalkIn, filterRestAmount]);

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
      
      // If user is viewing search results, clear search and go to page 1
      if (searchResults && searchTerm) {
        setSearchTerm("");
        setSearchResults(null);
      }
      // Always load first page after creating a new sale
      await loadSales(1);
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
      
      // Format items for editing - each item can have its quantity and unit price edited
      const formattedItems = (s.items || []).map(item => ({
        id: item.id,
        product_id: item.product?.id,
        product_name: item.product?.product_name,
        brand: item.product?.brand?.brand_name,
        category: item.product?.category?.category_name,
        shop_id: item.shop?.id,
        shop_name: item.shop?.shop_name,
        quantity_sold: item.quantity_sold,
        unit_price: parseFloat(item.unit_price),
        total_price: parseFloat(item.total_price),
        dimensions: item.product?.length && item.product?.width && item.product?.thickness 
          ? `${item.product.length} × ${item.product.width} × ${item.product.thickness}` 
          : 'N/A',
        weight: item.product?.weight || 'N/A'
      }));
      
      setEditForm({
        id: s.id,
        items: formattedItems,
        customer_name: s.customer_name ?? "",
        customer_phone: s.customer_phone ?? "",
        payment_method: s.payment_method || "cash",
        sale_date: s.sale_date
          ? new Date(s.sale_date).toISOString().slice(0, 16)
          : "",
        customer_paid: parseFloat(s.customer_paid) || 0,
        discount_amount: parseFloat(s.discount_amount) || 0,
        rest_amount: parseFloat(s.rest_amount) || 0,
      });
      setEditOpen(true);
    } catch (error) {
      console.error("Failed to load sale:", error);
      toast.error("Failed to load sale");
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    
    // Validate that we have items
    if (!editForm.items || editForm.items.length === 0) {
      toast.error('Cannot save sale with no items');
      return;
    }

    // Validate customer_paid
    if (editForm.customer_paid <= 0) {
      toast.error('Customer paid amount must be greater than 0');
      return;
    }

    if (editForm.customer_paid > editTotals.grandTotal) {
      toast.error('Customer paid amount cannot be greater than Grand Total');
      return;
    }

    try {
      // Calculate rest amount and validate discount
      const grandTotal = editTotals.grandTotal;
      const paidAmount = editForm.customer_paid;
      let discountAmount = parseFloat(editForm.discount_amount) || 0;
      let restAmount = 0;
      
      // If customer paid equals grand total, reset discount and rest to 0
      if (paidAmount === grandTotal) {
        discountAmount = 0;
        restAmount = 0;
      } else if (paidAmount < grandTotal) {
        // Validate discount amount
        if (discountAmount > (grandTotal - paidAmount)) {
          toast.error('Discount amount cannot be greater than the remaining balance');
          return;
        }
        // Calculate rest amount
        restAmount = Math.max(0, grandTotal - paidAmount - discountAmount);
      }

      const payload = {
        items: editForm.items.map(item => ({
          id: item.id,
          product_id: item.product_id,
          quantity_sold: parseInt(item.quantity_sold) || 0,
          unit_price: parseFloat(item.unit_price) || 0,
          total: editTotals.itemTotals[item.id] || 0,
          shop_id: item.shop_id
        })),
        customer: {
          customer_name: editForm.customer_name.trim() || null,
          customer_phone: editForm.customer_phone.trim() || null,
          payment_method: editForm.payment_method,
          sale_date: editForm.sale_date
        },
        totals: {
          total_amount: grandTotal,
          customer_paid: paidAmount,
          discount_amount: discountAmount > 0 ? discountAmount : null,
          rest_amount: restAmount > 0 ? restAmount : null
        }
      };
      
      await axios.put(`/api/sales/${editForm.id}`, payload, { headers });
      toast.success("Sale updated successfully");
      setEditOpen(false);
      
      // If user is viewing search results, refresh the search
      if (searchResults && searchTerm) {
        await searchSalesApi(searchTerm, searchPagination.currentPage || 1);
      } else {
        // Otherwise refresh the regular sales list
        await loadSales(pagination.currentPage || 1);
      }
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
      // Use the customer sale transaction delete endpoint
      await axios.delete(`/api/sales/customer/${activeSale.id}`, { headers });
      toast.success("Sale deleted");
      setDeleteOpen(false);
      setActiveSale(null);
      
      // If user is viewing search results, refresh the search
      if (searchResults && searchTerm) {
        await searchSalesApi(searchTerm, searchPagination.currentPage || 1);
      } else {
        // Otherwise refresh the regular sales list
        await loadSales(pagination.currentPage || 1);
      }
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error.message ||
        "Failed to delete sale";
      toast.error(msg);
    }
  };

  const openDetails = async (sale) => {
    // Since we now have customer-based sales data with items included,
    // we don't need to fetch individual sale details anymore
    // console.log("Opening details for sale:", sale);
    // console.log("Items in sale:", sale?.items);
    setDetailsSale(sale);
    setDetailsOpen(true);
  };

  useEffect(() => {
    loadSales(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedShop, period]);

  // Listen for sale completion events to refresh data
  useEffect(() => {
    const handleSaleCompleted = (event) => {
      // console.log("Sale completed event received:", event.detail);
      // Refresh sales data to show the new sale
      loadSales(pagination.currentPage || 1);
      // toast.success('Sales data refreshed!', {
      //   position: "top-right",
      //   autoClose: 2000,
      //   hideProgressBar: true,
      //   closeOnClick: true,
      //   pauseOnHover: false,
      //   draggable: true,
      // });
    };

    // Add event listener
    window.addEventListener("saleCompleted", handleSaleCompleted);

    // Cleanup
    return () => {
      window.removeEventListener("saleCompleted", handleSaleCompleted);
    };
  }, [pagination.currentPage]); // Include pagination.currentPage to get current page

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
                  {searchResults ? (
                    <>
                      Search Results: {searchPagination.total || 0} sales
                      {searchPagination.total > 0 && (
                        <span className="ml-2">
                          (Page {searchPagination.currentPage} of{" "}
                          {searchPagination.totalPages})
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      Period: {period.toUpperCase()} • Total:{" "}
                      {pagination.total || sales.length} sales
                      {(filterWalkIn || filterRestAmount) && filteredSales.length !== sales.length && (
                        <span className="ml-2 text-indigo-400">
                          (Showing {filteredSales.length} filtered)
                        </span>
                      )}
                      {pagination.total > 0 && !filterWalkIn && !filterRestAmount && (
                        <span className="ml-2">
                          (Page {pagination.currentPage} of{" "}
                          {pagination.totalPages})
                        </span>
                      )}
                    </>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {/* Filter Buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setFilterWalkIn(!filterWalkIn)}
                      className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 border ${
                        filterWalkIn
                          ? "bg-purple-600 text-white border-purple-500"
                          : "bg-white/5 text-white/70 hover:bg-white/10 border-white/10"
                      }`}
                      title={filterWalkIn ? "Remove Walk-in Filter" : "Filter Walk-in Customers"}
                    >
                      <User size={12} />
                      <span className="hidden sm:inline text-[10px]">Walk-in</span>
                    </button>
                    <button
                      onClick={() => setFilterRestAmount(!filterRestAmount)}
                      className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 border ${
                        filterRestAmount
                          ? "bg-red-600 text-white border-red-500"
                          : "bg-white/5 text-white/70 hover:bg-white/10 border-white/10"
                      }`}
                      title={filterRestAmount ? "Remove Pending Filter" : "Filter Sales with Pending Amount"}
                    >
                      <DollarSign size={12} />
                      <span className="hidden sm:inline text-[10px]">Pending</span>
                    </button>
                  </div>

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
                      onChange={handleSearchChange}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                      {isSearching ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white/60"></div>
                      ) : searchTerm ? (
                        <button
                          onClick={() => {
                            setSearchTerm("");
                            setSearchResults(null);
                            loadSales(1);
                          }}
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
              ) : filteredSales.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
                    <ShoppingCart size={32} className="text-white/40" />
                  </div>
                  <h3 className="text-lg font-medium text-white/80 mb-2">
                    No sales found
                  </h3>
                  <p className="text-white/60 text-center">
                    {filterWalkIn || filterRestAmount
                      ? "No sales match the selected filters."
                      : searchTerm
                      ? "Try adjusting your search terms."
                      : "No sales records available for the selected period."}
                  </p>
                </div>
              ) : (
                <>
                  {viewMode === "grid" ? (
                    // Grid View - Customer Transaction Cards
                    <div className="max-h-[440px] scroll-y-invisible overflow-y-auto">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredSales.map((s) => (
                            <div
                              key={s.id}
                              className="bg-white/5 rounded-xl px-4 py-2 border border-white/10 hover:border-white/20 transition-all group cursor-pointer"
                              onClick={() => openDetails(s)}
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
                                  <ShoppingCart
                                    size={20}
                                    className="text-green-400"
                                  />
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="bg-indigo-600/20 text-indigo-300 px-2 py-1 rounded-full text-xs font-medium">
                                    {s.total_items || 0} items
                                  </span>
                                  <span className="bg-purple-600/20 text-purple-300 px-2 py-1 rounded-full text-xs font-medium">
                                    {s.total_quantity || 0} qty
                                  </span>
                                </div>
                              </div>

                              <div className="mb-3">
                                <h3 className="font-medium capitalize text-white truncate mb-2">
                                  <avtar className="inline-block mr-2">
                                    <User size={16} className="text-white/60" />
                                  </avtar>
                                  {s.customer_name || "Walk-in Customer"}
                                </h3>

                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <Phone
                                      size={14}
                                      className="text-white/40"
                                    />
                                    <span className="text-white/60 text-xs">
                                      {s.customer_phone || "N/A"}
                                    </span>
                                  </div>

                                  <div className="flex items-center space-x-2">
                                    <Calendar
                                      size={14}
                                      className="text-white/40"
                                    />
                                    <span className="text-white/60 text-xs">
                                      {new Date(
                                        s.sale_date
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>

                                  <div className="flex items-center space-x-2">
                                    <Package
                                      size={14}
                                      className="text-white/40"
                                    />
                                    <span className="text-white/60 text-xs capitalize">
                                      {s.total_items || 0} items •{" "}
                                      {s.total_quantity || 0} qty
                                    </span>
                                  </div>

                                  <div className="flex items-center space-x-2">
                                    <Store
                                      size={14}
                                      className="text-white/40"
                                    />
                                    <span className="text-white/60 text-xs capitalize">
                                      {s.shops_involved &&
                                      s.shops_involved.length > 0
                                        ? s.shops_involved.length === 1
                                          ? s.shops_involved[0]
                                          : `${s.shops_involved.length} shops`
                                        : "N/A"}
                                    </span>
                                  </div>

                                  <div className="flex items-center space-x-2">
                                    <CreditCard
                                      size={14}
                                      className="text-white/40"
                                    />
                                    <span className="text-white/60 text-xs ">
                                      {s.payment_method.toUpperCase() || "N/A"}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2 mb-4">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-white/60">
                                    Total Amount:
                                  </span>
                                  <span className="text-green-400 font-bold">
                                    ₹
                                    {Number(s.total_amount || 0).toLocaleString(
                                      "en-IN"
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-white/60">Paid:</span>
                                  <span className="text-white font-medium">
                                    ₹
                                    {Number(
                                      s.customer_paid || 0
                                    ).toLocaleString("en-IN")}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-white/60">
                                    Discount:
                                  </span>
                                  <span className="text-orange-400 font-medium">
                                    {Number(s.discount_amount).toLocaleString(
                                      "en-IN"
                                    )
                                      ? `₹${Number(
                                          s.discount_amount
                                        ).toLocaleString("en-IN")}`
                                      : "N/A"}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-white/60">
                                    Due Amount:
                                  </span>
                                  <span
                                    className={
                                      s.rest_amount &&
                                      parseFloat(s.rest_amount) > 0
                                        ? "text-red-400 font-medium"
                                        : "text-white/60"
                                    }
                                  >
                                    {s.rest_amount &&
                                    parseFloat(s.rest_amount) > 0
                                      ? `₹${Number(
                                          s.rest_amount
                                        ).toLocaleString("en-IN")}`
                                      : "N/A"}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between gap-2 pt-3 pb-3 border-t border-white/10">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEdit(s);
                                  }}
                                  className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all text-xs flex items-center justify-center"
                                  title="Edit Sale"
                                  style={{ minWidth: 0 }}
                                >
                                  <Pencil size={16} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openDelete(s);
                                  }}
                                  className="px-3 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 hover:text-red-300 transition-all text-xs flex items-center justify-center"
                                  title="Delete Sale"
                                  style={{ minWidth: 0 }}
                                >
                                  <Trash2 size={16} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openDetails(s);
                                  }}
                                  className=" px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all text-xs flex items-center justify-center space-x-1"
                                  title="View Items"
                                  // style={{ minWidth: 0 }}
                                >
                                  <Info size={15} />
                                  {/* <span className="hidden sm:inline">View Items</span> */}
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : (
                    // List View (Table) - Customer Transaction Table
                    <div className="overflow-x-auto">
                      <div className="max-h-[440px] scroll-y-invisible overflow-y-auto rounded-lg">
                        <table className="min-w-full table-fixed text-sm">
                          <thead className="sticky top-0 z-10 bg-[#121a3d] text-white/70">
                            <tr>
                              <th className="text-left p-3 font-medium">
                                Customer
                              </th>
                              <th className="text-left p-3 font-medium">
                                Shops
                              </th>
                              <th className="text-center p-3 w-20 font-medium">
                                Items
                              </th>
                              <th className="text-center p-3 w-20 font-medium">
                                Qty
                              </th>
                              <th className="text-right p-3 w-32 font-medium">
                                Total
                              </th>
                              <th className="text-right p-3 w-32 font-medium">
                                Paid
                              </th>
                              <th className="text-left p-3 w-24 font-medium">
                                Payment
                              </th>
                              <th className="text-center p-3 w-32 font-medium">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredSales.map((s) => (
                                <tr
                                  key={s.id}
                                  className="border-t border-white/10 hover:bg-white/5 transition-colors"
                                >
                                  <td className="p-3">
                                    <div className="flex items-center space-x-3">
                                      <div className="w-8 h-8 bg-green-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <User
                                          size={16}
                                          className="text-green-400"
                                        />
                                      </div>
                                      <div>
                                        <div className="text-white font-medium text-sm capitalize">
                                          {s.customer_name || "Anonymous"}
                                        </div>
                                        <div className="text-white/50 text-xs">
                                          {s.customer_phone || "N/A"}
                                        </div>
                                        <div className="text-white/40 text-xs">
                                          {new Date(
                                            s.sale_date
                                          ).toLocaleDateString()}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    <div className="text-white/70 text-xs">
                                      {s.shops_involved &&
                                      s.shops_involved.length > 0
                                        ? s.shops_involved.length === 1
                                          ? s.shops_involved[0]
                                          : `${s.shops_involved[0]} ${
                                              s.shops_involved.length > 1
                                                ? `+${
                                                    s.shops_involved.length - 1
                                                  } more`
                                                : ""
                                            }`
                                        : "N/A"}
                                    </div>
                                  </td>
                                  <td className="p-3 text-center">
                                    <span className="bg-indigo-600/20 text-indigo-300 px-2 py-1 rounded-full text-xs font-medium">
                                      {s.total_items || 0}
                                    </span>
                                  </td>
                                  <td className="p-3 text-center">
                                    <span className="bg-white/10 px-2 py-1 rounded-full text-xs">
                                      {s.total_quantity || 0}
                                    </span>
                                  </td>
                                  <td className="p-3 text-right font-bold text-green-400">
                                    ₹
                                    {Number(s.total_amount || 0).toLocaleString(
                                      "en-IN"
                                    )}
                                  </td>
                                  <td className="p-3 text-right">
                                    <div className="text-white font-medium">
                                      ₹
                                      {Number(
                                        s.customer_paid || 0
                                      ).toLocaleString("en-IN")}
                                    </div>
                                    {s.discount_amount &&
                                      parseFloat(s.discount_amount) > 0 && (
                                        <div className="text-orange-400 text-xs">
                                          -₹
                                          {Number(
                                            s.discount_amount
                                          ).toLocaleString("en-IN")}
                                        </div>
                                      )}
                                    <div
                                      className={
                                        s.rest_amount &&
                                        parseFloat(s.rest_amount) > 0
                                          ? "text-red-400 text-xs"
                                          : "text-white/60 text-xs"
                                      }
                                    >
                                      Due:{" "}
                                      {s.rest_amount &&
                                      parseFloat(s.rest_amount) > 0
                                        ? `₹${Number(
                                            s.rest_amount
                                          ).toLocaleString("en-IN")}`
                                        : "N/A"}
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    <div className="flex items-center space-x-1">
                                      <CreditCard
                                        size={12}
                                        className="text-white/40"
                                      />
                                      <span className="capitalize text-xs">
                                        {s.payment_method.toUpperCase() ||
                                          "N/A"}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-all border border-white/10"
                                        onClick={() => openEdit(s)}
                                        title="Edit Sale"
                                      >
                                        <Pencil size={14} />
                                      </button>
                                      <button
                                        className="px-2 py-1 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 hover:text-red-300 transition-all border border-red-600/20"
                                        onClick={() => openDelete(s)}
                                        title="Delete Sale"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                      <button
                                        className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-all border border-white/10"
                                        onClick={() => openDetails(s)}
                                        title="View Items"
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
                    currentPage={searchResults ? searchPagination.currentPage : pagination.currentPage}
                    totalPages={searchResults ? searchPagination.totalPages : pagination.totalPages}
                    onPageChange={(page) => {
                      if (searchResults && searchTerm) {
                        handleSearchPageChange(page);
                      } else {
                        loadSales(page);
                      }
                    }}
                    total={searchResults ? searchPagination.total : pagination.total}
                    limit={searchResults ? searchPagination.limit : pagination.limit}
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="w-full max-w-5xl bg-gradient-to-br from-[#0f1535] to-[#1a2048] text-white rounded-2xl border border-white/20 shadow-2xl my-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 p-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center">
                    <Pencil size={20} className="text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Edit Sale</h3>
                    <p className="text-white/60 text-xs">
                      Update sale items and payment information
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  {/* Grand Total Display */}
                  <div className="text-right">
                    <div className="text-xs text-white/60">Grand Total</div>
                    <div className="text-xl font-bold text-green-400">
                      ₹{editTotals.grandTotal.toLocaleString('en-IN')}
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                    onClick={() => setEditOpen(false)}
                  >
                    <span className="text-white/80 text-lg">✕</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Form Content */}
            <form 
              onSubmit={handleEdit} 
              className="p-4 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto"
              style={{
                scrollbarWidth: 'none', /* Firefox */
                msOverflowStyle: 'none', /* IE and Edge */
              }}
            >
              <style>{`
                form::-webkit-scrollbar {
                  display: none; /* Chrome, Safari, Opera */
                }
              `}</style>
              {/* Items Section */}
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Package size={16} className="text-indigo-400" />
                    <h4 className="font-semibold text-white text-sm">Sale Items</h4>
                    <span className="text-xs text-white/60">({editForm.items.length} {editForm.items.length === 1 ? 'item' : 'items'})</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {editForm.items.map((item, index) => (
                    <div key={item.id} className="bg-white/5 rounded-lg p-3 border border-white/10">
                      {/* Item Info */}
                      <div className="flex items-start space-x-2 mb-2">
                        <div className="w-8 h-8 bg-indigo-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Package size={14} className="text-indigo-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium capitalize text-white truncate text-sm mb-1">
                            {item.product_name}
                          </h5>
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="bg-blue-600/20 text-blue-300 px-2 py-0.5 rounded text-xs">
                              {item.brand}
                            </span>
                            <span className="bg-purple-600/20 text-purple-300 px-2 py-0.5 rounded text-xs">
                              {item.shop_name}
                            </span>
                            {item.dimensions && item.dimensions !== 'N/A' && (
                              <span className="bg-orange-600/20 text-orange-300 px-2 py-0.5 rounded text-xs">
                                📏 {item.dimensions}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Editable Fields */}
                      <div className="flex items-center justify-between space-x-2 bg-white/5 rounded-lg p-2 border border-white/5">
                        {/* Unit Price */}
                        <div className="flex-1 min-w-0 max-w-[140px]">
                          <div className="text-xs text-white/60 mb-1">Unit Price (₹)</div>
                          <div className="relative">
                            <DollarSign size={10} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white/40" />
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              className="w-full bg-white/10 border border-white/20 rounded pl-5 pr-2 py-1.5 text-xs text-white placeholder-white/40 focus:border-green-400 focus:ring-1 focus:ring-green-400/20 transition-all"
                              placeholder="0.00"
                              value={item.unit_price || ''}
                              onChange={(e) => handleEditItemPriceChange(item.id, parseFloat(e.target.value) || 0)}
                            />
                          </div>
                        </div>

                        {/* Quantity */}
                        <div className="flex-shrink-0">
                          <div className="text-xs text-white/60 mb-1">Quantity</div>
                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => handleEditItemQuantityChange(item.id, Math.max(1, item.quantity_sold - 1))}
                              className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                            >
                              <Minus size={12} />
                            </button>
                            
                            <div className="w-10 h-6 bg-white/10 rounded flex items-center justify-center">
                              <span className="text-xs font-medium">{item.quantity_sold}</span>
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => handleEditItemQuantityChange(item.id, item.quantity_sold + 1)}
                              className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>

                        {/* Item Total */}
                        <div className="flex-shrink-0 text-right">
                          <div className="text-xs text-white/60 mb-1">Item Total</div>
                          <div className="text-sm font-bold text-green-400">
                            ₹{(editTotals.itemTotals[item.id] || 0).toLocaleString('en-IN')}
                          </div>
                        </div>

                        {/* Delete Icon */}
                        <div className="flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => handleEditItemRemove(item.id)}
                            className="w-6 h-6 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 flex items-center justify-center transition-all"
                            title="Remove item"
                            disabled={editForm.items.length === 1}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {/* Customer Information Section */}
                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <div className="flex items-center space-x-2 mb-3">
                    <User size={16} className="text-purple-400" />
                    <h4 className="font-semibold text-white text-sm">Customer Information</h4>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="flex items-center space-x-1 text-xs text-white/70 mb-1">
                        <User size={12} />
                        <span>Customer Name</span>
                      </label>
                      <input
                        type="text"
                        className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-sm text-white placeholder-white/40 focus:border-purple-400 focus:ring-1 focus:ring-purple-400/20 transition-all"
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
                      <label className="flex items-center space-x-1 text-xs text-white/70 mb-1">
                        <Phone size={12} />
                        <span>Customer Phone</span>
                      </label>
                      <input
                        type="tel"
                        className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-sm text-white placeholder-white/40 focus:border-purple-400 focus:ring-1 focus:ring-purple-400/20 transition-all"
                        placeholder="Enter phone number"
                        value={editForm.customer_phone}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            customer_phone: e.target.value.replace(/[^0-9]/g, '').slice(0, 15),
                          })
                        }
                        inputMode="numeric"
                        pattern="[0-9]*"
                      />
                    </div>

                    <div>
                      <label className="flex items-center space-x-1 text-xs text-white/70 mb-1">
                        <Calendar size={12} />
                        <span>Sale Date & Time</span>
                      </label>
                      <input
                        type="datetime-local"
                        className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-sm text-white focus:border-purple-400 focus:ring-1 focus:ring-purple-400/20 transition-all"
                        value={editForm.sale_date}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            sale_date: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <label className="flex items-center space-x-1 text-xs text-white/70 mb-1">
                        <CreditCard size={12} />
                        <span>Payment Method</span>
                      </label>
                      <select
                        className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-sm text-white focus:border-purple-400 focus:ring-1 focus:ring-purple-400/20 transition-all"
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
                            <option
                              key={m}
                              value={m}
                              className="bg-[#0f1535] text-white"
                            >
                              {m.charAt(0).toUpperCase() +
                                m.slice(1).replace("_", " ")}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Payment Details Section */}
                <div className="bg-gradient-to-br from-green-600/10 to-emerald-600/10 rounded-xl p-3 border border-green-600/20">
                  <div className="flex items-center space-x-2 mb-3">
                    <CreditCard size={16} className="text-green-400" />
                    <h4 className="font-semibold text-white text-sm">Payment Details</h4>
                  </div>

                  <div className="space-y-2">
                    {/* Grand Total Display */}
                    <div className="bg-white/10 rounded-lg p-2 border border-white/20">
                      <div className="text-xs text-white/60 mb-1">Grand Total</div>
                      <div className="text-lg font-bold text-white">
                        ₹{editTotals.grandTotal.toLocaleString('en-IN')}
                      </div>
                    </div>

                    {/* Customer Paid Input */}
                    <div>
                      <label className="flex items-center space-x-1 text-xs text-white/70 mb-1">
                        <DollarSign size={12} />
                        <span>Amount Customer Paid</span>
                      </label>
                      <div className="relative">
                        <DollarSign size={10} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white/40" />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max={editTotals.grandTotal}
                          className="w-full bg-white/10 border border-white/20 rounded-lg pl-5 pr-2 py-2 text-sm text-white placeholder-white/40 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/20 transition-all font-medium"
                          placeholder="0.00"
                          value={editForm.customer_paid || ''}
                          onChange={(e) => {
                            const newPaid = parseFloat(e.target.value) || 0;
                            
                            // If customer paid equals grand total, clear discount and rest
                            if (newPaid === editTotals.grandTotal) {
                              setEditForm({
                                ...editForm,
                                customer_paid: newPaid,
                                discount_amount: 0,
                                rest_amount: 0
                              });
                            } else if (newPaid < editTotals.grandTotal) {
                              // If customer paid is less than grand total, recalculate with existing discount
                              const currentDiscount = parseFloat(editForm.discount_amount) || 0;
                              const maxDiscount = editTotals.grandTotal - newPaid;
                              const validDiscount = Math.min(currentDiscount, maxDiscount);
                              const newRest = Math.max(0, editTotals.grandTotal - newPaid - validDiscount);
                              
                              setEditForm({
                                ...editForm,
                                customer_paid: newPaid,
                                discount_amount: validDiscount,
                                rest_amount: newRest
                              });
                            } else {
                              // If somehow paid is more than total, just update paid amount
                              setEditForm({
                                ...editForm,
                                customer_paid: newPaid
                              });
                            }
                          }}
                        />
                      </div>
                    </div>

                    {/* Discount Amount Field */}
                    {editForm.customer_paid < editTotals.grandTotal && (
                      <div>
                        <label className="flex items-center space-x-1 text-xs text-white/70 mb-1">
                          <DollarSign size={12} />
                          <span>Discount Amount</span>
                        </label>
                        <div className="relative">
                          <DollarSign size={10} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white/40" />
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max={editTotals.grandTotal - editForm.customer_paid}
                            className="w-full bg-white/10 border border-white/20 rounded-lg pl-5 pr-2 py-2 text-sm text-white placeholder-white/40 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/20 transition-all"
                            placeholder="0.00"
                            value={editForm.discount_amount || ''}
                            onChange={(e) => {
                              const newDiscount = parseFloat(e.target.value) || 0;
                              const maxDiscount = editTotals.grandTotal - editForm.customer_paid;
                              const finalDiscount = Math.min(newDiscount, maxDiscount);
                              const newRest = Math.max(0, editTotals.grandTotal - editForm.customer_paid - finalDiscount);
                              setEditForm({
                                ...editForm,
                                discount_amount: finalDiscount,
                                rest_amount: newRest
                              });
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Rest Amount Display */}
                    <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                      <div className="text-xs text-white/60 mb-1">Rest Amount</div>
                      <div className="text-sm font-bold text-orange-300">
                        ₹{Math.max(0, editTotals.grandTotal - editForm.customer_paid - (parseFloat(editForm.discount_amount) || 0)).toLocaleString('en-IN')}
                      </div>
                    </div>

                    {/* Payment Summary */}
                    {editForm.customer_paid !== editTotals.grandTotal && (
                      <div className="bg-white/5 rounded-lg p-2 border border-white/10">
                        <div className="text-xs text-white/60 mb-1">Payment Breakdown:</div>
                        <div className="space-y-0.5 text-xs">
                          <div className="flex justify-between">
                            <span>Grand Total:</span>
                            <span className="font-medium">₹{editTotals.grandTotal.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Customer Paid:</span>
                            <span className="font-medium text-green-300">₹{editForm.customer_paid.toLocaleString('en-IN')}</span>
                          </div>
                          {editForm.discount_amount > 0 && (
                            <div className="flex justify-between">
                              <span>Discount:</span>
                              <span className="font-medium text-yellow-300">₹{parseFloat(editForm.discount_amount).toLocaleString('en-IN')}</span>
                            </div>
                          )}
                          <div className="flex justify-between border-t border-white/10 pt-0.5">
                            <span>Rest:</span>
                            <span className="font-medium text-orange-300">
                              ₹{Math.max(0, editTotals.grandTotal - editForm.customer_paid - (parseFloat(editForm.discount_amount) || 0)).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-3 border-t border-white/10 flex justify-end space-x-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all border border-white/10 text-sm"
                  onClick={() => setEditOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white transition-all flex items-center space-x-2 shadow-lg text-sm"
                  disabled={editForm.items.length === 0 || editForm.customer_paid <= 0}
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

      {/* Details Modal - Customer Transaction with Items */}
      {detailsOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3">
          <div className="w-full max-w-5xl max-h-[90vh] bg-gradient-to-br from-[#0f1535] to-[#1a2048] text-white rounded-2xl border border-white/20 shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-600/20 rounded-xl flex items-center justify-center">
                    <ShoppingCart size={24} className="text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      Transaction Details
                    </h3>
                    <p className="text-white/60 text-sm">
                      Customer Purchase Information
                    </p>
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
            <div className="p-6 flex-1 overflow-y-auto">
              {/* Transaction Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                {/* Customer Info */}
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="flex items-center space-x-2 mb-3">
                    <User size={20} className="text-purple-400" />
                    <h4 className="font-semibold text-white">Customer</h4>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="text-white/60 text-xs block mb-1">
                        Name
                      </span>
                      <span className="text-white capitalize text-sm font-medium">
                        {detailsSale?.customer_name || "Anonymous Customer"}
                      </span>
                    </div>

                    <div>
                      <span className="text-white/60 text-xs block mb-1">
                        Phone
                      </span>
                      <div className="flex items-center space-x-2">
                        <Phone size={12} className="text-white/40" />
                        <span className="text-white text-sm">
                          {detailsSale?.customer_phone || "N/A"}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-white/60 text-xs block mb-1">
                        Date & Time
                      </span>
                      <span className="text-white text-sm">
                        {detailsSale?.sale_date
                          ? new Date(detailsSale.sale_date).toLocaleString()
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Transaction Summary */}
                <div className="bg-gradient-to-br from-green-600/10 to-emerald-600/10 rounded-lg p-3 border border-green-600/20">
                  <div className="flex items-center space-x-2 mb-3">
                    <DollarSign size={20} className="text-green-400" />
                    <h4 className="font-semibold text-white">Payment</h4>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-white/60 text-xs">
                        Total Amount
                      </span>
                      <span className="text-green-400 font-bold text-base">
                        ₹
                        {Number(detailsSale?.total_amount || 0).toLocaleString(
                          "en-IN"
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-white/60 text-xs">Amount Paid</span>
                      <span className="text-white font-medium text-sm">
                        ₹
                        {Number(detailsSale?.customer_paid || 0).toLocaleString(
                          "en-IN"
                        )}
                      </span>
                    </div>

                    {detailsSale?.discount_amount &&
                      parseFloat(detailsSale.discount_amount) > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-white/60 text-xs">
                            Discount
                          </span>
                          <span className="text-orange-400 font-medium text-sm">
                            ₹
                            {Number(detailsSale.discount_amount).toLocaleString(
                              "en-IN"
                            )}
                          </span>
                        </div>
                      )}

                    <div className="flex items-center justify-between">
                      <span className="text-white/60 text-xs">Due Amount</span>
                      <span
                        className={
                          detailsSale?.rest_amount &&
                          parseFloat(detailsSale.rest_amount) > 0
                            ? "text-red-400 font-medium"
                            : "text-white/60"
                        }
                      >
                        {detailsSale?.rest_amount &&
                        parseFloat(detailsSale.rest_amount) > 0
                          ? `₹${Number(detailsSale.rest_amount).toLocaleString(
                              "en-IN"
                            )}`
                          : "N/A"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <span className="text-white/60 text-xs">
                        Payment Method
                      </span>
                      <div className="flex items-center space-x-2">
                        <CreditCard size={12} className="text-white/40" />
                        <span className="text-white capitalize text-sm">
                          {detailsSale?.payment_method.toUpperCase() || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="flex items-center space-x-2 mb-3">
                    <Package size={20} className="text-blue-400" />
                    <h4 className="font-semibold text-white">Order Summary</h4>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-white/60 text-xs">Total Items</span>
                      <span className="bg-indigo-600/20 text-indigo-300 px-3 py-1 rounded-full text-sm font-medium">
                        {detailsSale?.total_items || 0}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-white/60 text-xs">
                        Total Quantity
                      </span>
                      <span className="bg-white/10 px-3 py-1 rounded-full text-sm font-medium">
                        {detailsSale?.total_quantity || 0}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-white/60 text-xs">
                        Shops Involved
                      </span>
                      <span className="text-white font-medium text-sm">
                        {detailsSale?.shops_involved?.length || 0}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-white/10">
                      <span className="text-white/60 text-xs block mb-1">
                        Shop Names
                      </span>
                      <div className="space-y-1">
                        {detailsSale?.shops_involved?.map((shop, index) => (
                          <div
                            key={index}
                            className="text-white text-xs flex items-center space-x-2"
                          >
                            <Store size={10} className="text-white/40" />
                            <span>{shop}</span>
                          </div>
                        )) || (
                          <span className="text-white/40 text-xs">N/A</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center space-x-3 mb-4">
                  <Package size={20} className="text-indigo-400" />
                  <h4 className="font-semibold text-white">Items Purchased</h4>
                </div>

                <div className="overflow-x-auto max-h-80 scroll-y-invisible">
                  <table className="min-w-full text-sm">
                    <thead className="bg-white/5 text-white/70">
                      <tr>
                        <th className="text-left p-3 font-medium">Product</th>
                        <th className="text-left p-3 font-medium">Shop</th>
                        <th className="text-left p-3 font-medium">
                          Brand/Category
                        </th>
                        <th className="text-center p-3 w-20 font-medium">
                          Qty
                        </th>
                        <th className="text-right p-3 w-32 font-medium">
                          Unit Price
                        </th>
                        <th className="text-right p-3 w-32 font-medium">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailsSale?.items && detailsSale.items.length > 0 ? (
                        detailsSale.items.map((item, index) => (
                          <tr
                            key={item.id || index}
                            className="border-t border-white/10 hover:bg-white/5 transition-colors"
                          >
                            <td className="p-3">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-indigo-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <Package
                                    size={16}
                                    className="text-indigo-400"
                                  />
                                </div>
                                <div>
                                  <div className="text-white font-medium capitalize">
                                    {item?.product?.product_name || "N/A"}
                                  </div>
                                  <div className="text-white/40 text-xs">
                                    ID:{" "}
                                    {item?.product?.id ||
                                      item?.product_id ||
                                      "N/A"}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center space-x-2">
                                <Store size={14} className="text-white/40" />
                                <span className="text-white/70">
                                  {item?.shop?.shop_name || "N/A"}
                                </span>
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="space-y-1">
                                <div className="text-white/70 text-xs capitalize">
                                  <strong>Brand:</strong>{" "}
                                  {item?.product?.brand?.brand_name || "N/A"}
                                </div>
                                <div className="text-white/60 text-xs capitalize">
                                  <strong>Category:</strong>{" "}
                                  {item?.product?.category?.category_name ||
                                    "N/A"}
                                </div>
                                {item?.product?.length &&
                                  item?.product?.width && (
                                    <div className="text-white/50 text-xs">
                                      <strong>Size:</strong>{" "}
                                      {item.product.length} ×{" "}
                                      {item.product.width}
                                      {item?.product?.thickness &&
                                        ` × ${item.product.thickness}`}
                                    </div>
                                  )}
                                {item?.product?.weight && (
                                  <div className="text-white/50 text-xs">
                                    <strong>Weight:</strong>{" "}
                                    {item.product.weight} kg
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              <span className="bg-white/10 px-2 py-1 rounded-full text-xs font-medium">
                                {item?.quantity_sold || 0}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <span className="text-white font-medium">
                                {item?.unit_price != null
                                  ? `₹${Number(item.unit_price).toLocaleString(
                                      "en-IN"
                                    )}`
                                  : "N/A"}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <span className="text-green-400 font-bold">
                                ₹
                                {Number(item?.total_price || 0).toLocaleString(
                                  "en-IN"
                                )}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="6"
                            className="p-6 text-center text-white/40"
                          >
                            No items found in this transaction
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
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
