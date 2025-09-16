import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Menu,
  Plus,
  Pencil,
  Trash2,
  Info,
  CheckSquare,
  Square,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import Sidebar from "./Sidebar.jsx";
import Pagination from "./Pagination.jsx";
import {
  DashboardProvider,
  useDashboard,
} from "../context/DashboardContext.jsx";
import PeriodSelect from "./navbar/PeriodSelect.jsx";
import ShopDropdown from "./navbar/ShopDropdown.jsx";
import AvatarDropdown from "./navbar/AvatarDropdown.jsx";

function ProductsInner() {
  const { selectedShop, period, shops } = useDashboard();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]); // Store all fetched products
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  const [activeProduct, setActiveProduct] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const [form, setForm] = useState({
    product_name: "",
    length: "",
    width: "",
    thickness: "",
    quantity: "",
    weight: "",
    brand_name: "",
    shop_id: "",
    category_name: "",
  });

  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${localStorage.getItem("auth_token") || ""}`,
    }),
    []
  );

  const loadProducts = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = {
          period,
          page,
          limit: 10,
        };
        // Prefer shop-specific endpoint for clarity; supports 'all'
        const url = `/api/products/shop/${selectedShop || "all"}`;
        const { data } = await axios.get(url, { params, headers });

        // Handle different response structures
        const productsList = Array.isArray(data?.data?.products)
          ? data.data.products
          : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
          ? data
          : [];

        // Always store all products for page 1 for search capabilities
        if (page === 1) {
          setAllProducts(productsList);
        }

        // Always show the loaded products (no search filtering here)
        setProducts(productsList);

        // Set pagination data - always use server data when not searching
        if (data?.pagination) {
          // Use server pagination for normal browsing
          setPagination(data.pagination);
          setCurrentPage(data.pagination.currentPage);
        } else {
          // Fallback for legacy response
          const totalProducts =
            data?.data?.totalProducts || productsList.length;
          const totalPages = Math.ceil(totalProducts / 10);
          setPagination({
            currentPage: page,
            limit: 10,
            total: totalProducts,
            totalPages: totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
          });
          setCurrentPage(page);
        }
      } catch (e) {
        toast.error(
          e?.response?.data?.message || e.message || "Failed to load products"
        );
      } finally {
        setLoading(false);
      }
    },
    [selectedShop, period, headers]
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);

    // If we have a search term active, we're doing client-side pagination
    if (searchTerm) {
      // No need to reload from server, just update the current page
      setPagination((prev) => ({
        ...prev,
        currentPage: page,
      }));
    } else {
      // Normal server-side pagination
      loadProducts(page);
    }

    setSelectedIds([]); // Clear selections when changing pages
  };

  useEffect(() => {
    if (selectedShop) {
      setCurrentPage(1); // Reset to first page when shop/period changes
      loadProducts(1);
    }
  }, [selectedShop, period, loadProducts]);

  const openCreate = () => {
    setForm({
      product_name: "",
      length: "",
      width: "",
      thickness: "",
      quantity: "",
      weight: "",
      brand_name: "",
      shop_id:
        selectedShop && selectedShop !== "all"
          ? String(selectedShop)
          : shops[0]?.id
          ? String(shops[0].id)
          : "",
      category_name: "",
    });
    setCreateOpen(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      const payload = {
        ...form,
        length: Number(form.length),
        width: Number(form.width),
        thickness: form.thickness ? Number(form.thickness) : null,
        quantity: Number(form.quantity),
        weight: form.weight ? Number(form.weight) : null,
        brand_name: form.brand_name,
        shop_id: Number(form.shop_id),
        category_name: form.category_name,
      };
      await axios.post("/api/products", payload, { headers });
      toast.success("Product created");
      setCreateOpen(false);
      loadProducts(currentPage);
    } catch (e) {
      toast.error(
        e?.response?.data?.message || e.message || "Failed to create product"
      );
    } finally {
      setCreateLoading(false);
    }
  };

  const openEdit = (prod) => {
    setActiveProduct(prod);
    setForm({
      product_name: prod.product_name || "",
      length: prod.length ?? "",
      width: prod.width ?? "",
      thickness: prod.thickness ?? "",
      quantity: prod.quantity ?? "",
      weight: prod.weight ?? "",
      brand_name: prod.brand?.brand_name ?? prod.brand_name ?? "",
      shop_id: prod.shop?.id ?? prod.shop_id ?? "",
      category_name: prod.category?.category_name ?? prod.category_name ?? "",
    });
    setEditOpen(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      const payload = {
        ...form,
        length: Number(form.length),
        width: Number(form.width),
        thickness: form.thickness ? Number(form.thickness) : null,
        quantity: Number(form.quantity),
        weight: form.weight ? Number(form.weight) : null,
        brand_name: form.brand_name,
        shop_id: Number(form.shop_id),
        category_name: form.category_name,
      };
      await axios.put(`/api/products/${activeProduct.id}`, payload, {
        headers,
      });
      toast.success("Product updated");
      setEditOpen(false);
      loadProducts(currentPage);
    } catch (e) {
      toast.error(
        e?.response?.data?.message || e.message || "Failed to update product"
      );
    } finally {
      setEditLoading(false);
    }
  };

  const toggleSelected = (id) => {
    console.log("Toggling selection for ID:", id);
    console.log("Current selectedIds:", selectedIds);
    setSelectedIds((prev) => {
      const isSelected = prev.includes(id);
      const newSelection = isSelected
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      console.log("New selectedIds:", newSelection);
      return newSelection;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === products.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map((p) => p.id));
    }
  };

  // Function to filter products based on search term
  const filterProducts = (productsToFilter, term) => {
    if (!term) return productsToFilter;

    // Convert search term to lowercase for case-insensitive matching
    const searchLower = term.toLowerCase().trim();

    return productsToFilter.filter((p) => {
      // Helper function to safely check if a value contains the search term
      const containsSearch = (value) => {
        if (value === undefined || value === null) return false;
        return String(value).toLowerCase().includes(searchLower);
      };

      // Check all relevant fields
      return (
        containsSearch(p.product_name) ||
        containsSearch(p.brand?.brand_name) ||
        containsSearch(p.brand_name) ||
        containsSearch(p.shop?.shop_name) ||
        containsSearch(p.shop_id) ||
        containsSearch(p.category?.category_name) ||
        containsSearch(p.category_name) ||
        containsSearch(p.quantity) ||
        containsSearch(p.length) ||
        containsSearch(p.width) ||
        containsSearch(p.thickness) ||
        containsSearch(p.weight)
      );
    });
  };

  // Handle search input change
  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);

    if (term && term.trim()) {
      // Apply filter to all products when searching
      const filtered = filterProducts(allProducts, term);
      setProducts(filtered);

      // Update pagination but keep pagination UI visible
      setPagination((prev) => {
        const totalPages = Math.max(1, Math.ceil(filtered.length / prev.limit));
        return {
          ...prev,
          currentPage: 1,
          total: filtered.length,
          totalPages: totalPages,
          hasNextPage: filtered.length > prev.limit,
          hasPrevPage: false,
        };
      });
      setCurrentPage(1);
    } else {
      // When search is cleared (empty or just spaces), reload current page from server
      setSearchTerm(""); // Ensure it's completely empty
      loadProducts(currentPage);
    }
  };

  const handleDeleteMultiple = async () => {
    if (selectedIds.length === 0)
      return toast.info("Select at least one product");
    try {
      await axios.delete("/api/products/delete/multiple", {
        data: { productIds: selectedIds },
        headers,
      });
      toast.success("Deleted selected products");
      setSelectedIds([]);
      // If we deleted all items on current page and it's not page 1, go to previous page
      const remainingItems = pagination.total - selectedIds.length;
      const newTotalPages = Math.ceil(remainingItems / pagination.limit);
      const targetPage =
        currentPage > newTotalPages ? Math.max(1, newTotalPages) : currentPage;
      loadProducts(targetPage);
    } catch (e) {
      toast.error(
        e?.response?.data?.message || e.message || "Failed to delete products"
      );
    }
  };

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
              <h1 className="text-xl font-bold max-[500px]:text-lg">
                Products
              </h1>
            </div>

            <div className="flex items-center space-x-4 max-[500px]:space-x-2">
              <PeriodSelect />
              <ShopDropdown />
              <AvatarDropdown />
            </div>
          </div>

          {/* Content */}
          <div className="p-4 lg:p-8 text-white">
            <div className="mb-4">
              <div className="flex items-center justify-between gap-3">
                {/* Left side - Search bar */}
                <div className="relative w-full md:w-64 lg:w-72 flex items-center">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {searchTerm && (
                    <div className="absolute right-0 inset-y-0 flex items-center pr-3">
                      <button
                        onClick={() => {
                          setSearchTerm("");
                          loadProducts(currentPage);
                        }}
                        className="text-white/60 hover:text-white"
                        aria-label="Clear search"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                {/* Right side - Action buttons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={openCreate}
                    className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded-lg text-sm whitespace-nowrap"
                  >
                    <Plus size={16} />
                    <span className="hidden sm:inline">Create Product</span>
                  </button>
                  <button
                    onClick={handleDeleteMultiple}
                    disabled={selectedIds.length === 0}
                    className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-all whitespace-nowrap ${
                      selectedIds.length > 0
                        ? "bg-red-600 hover:bg-red-700 text-white"
                        : "bg-gray-600 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    <Trash2 size={16} />
                    <span className="hidden sm:inline">
                      Delete Selected{" "}
                      {selectedIds.length > 0 && `(${selectedIds.length})`}
                    </span>
                    <span className="sm:hidden">
                      {selectedIds.length > 0 && `(${selectedIds.length})`}
                    </span>
                  </button>
                </div>
              </div>

              {/* Total count below search */}
              <div className="text-white/70 text-sm mt-2">
                Total: {pagination.total} products
                {pagination.total > 0 && (
                  <span className="ml-2">
                    (Page {pagination.currentPage} of {pagination.totalPages})
                  </span>
                )}
                {searchTerm && (
                  <span className="ml-2 text-indigo-400">
                    (Filtered results for "{searchTerm}")
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-2xl p-5 bg-gradient-to-br from-[#121a3d] to-[#182057] border border-white/10">
              <div className="overflow-x-auto max-h-[calc(100vh-350px)] overflow-y-auto">
                <table className="min-w-full text-xs md:text-sm">
                  <thead className="text-white/70">
                    <tr>
                      <th className="text-left p-2 w-8">
                        <button
                          onClick={toggleSelectAll}
                          className={`p-1 rounded-lg border-2 transition-all duration-200 ${
                            selectedIds.length === products.length &&
                            products.length > 0
                              ? "bg-indigo-600 border-indigo-500 text-white"
                              : "bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/40"
                          }`}
                        >
                          {selectedIds.length === products.length &&
                          products.length > 0 ? (
                            <CheckSquare size={14} className="text-white" />
                          ) : selectedIds.length > 0 ? (
                            <CheckSquare
                              size={14}
                              className="text-indigo-400"
                            />
                          ) : (
                            <Square size={14} className="text-white/60" />
                          )}
                        </button>
                      </th>
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2 hidden md:table-cell">
                        Brand
                      </th>
                      <th className="text-left p-2 hidden md:table-cell">
                        Shop
                      </th>
                      <th className="text-left p-2 hidden md:table-cell">
                        Category
                      </th>
                      <th className="text-right p-2">Qty</th>
                      <th className="text-left p-2">Size (L×W×T)</th>
                      <th className="text-left p-2 hidden sm:table-cell">
                        Weight
                      </th>
                      <th className="text-left p-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td className="p-2 text-xs md:text-sm" colSpan={9}>
                          Loading...
                        </td>
                      </tr>
                    ) : products.length === 0 ? (
                      <tr>
                        <td className="p-2 text-xs md:text-sm" colSpan={9}>
                          No products found
                        </td>
                      </tr>
                    ) : (
                      products.map((p) => (
                        <tr
                          key={p.id}
                          className="border-t border-white/10 hover:bg-white/5"
                        >
                          <td className="p-2">
                            <button
                              onClick={() => toggleSelected(p.id)}
                              className={`p-1 rounded-lg border-2 transition-all duration-200 ${
                                selectedIds.includes(p.id)
                                  ? "bg-indigo-600 border-indigo-500 text-white"
                                  : "bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/40"
                              }`}
                            >
                              {selectedIds.includes(p.id) ? (
                                <CheckSquare size={14} className="text-white" />
                              ) : (
                                <Square size={14} className="text-white/60" />
                              )}
                            </button>
                          </td>
                          <td className="p-2 text-xs md:text-sm">
                            {p.product_name}
                          </td>
                          <td className="p-2 text-xs md:text-sm hidden md:table-cell">
                            {p?.brand?.brand_name || "-"}
                          </td>
                          <td className="p-2 text-xs md:text-sm hidden md:table-cell">
                            {p?.shop?.shop_name || "-"}
                          </td>
                          <td className="p-2 text-xs md:text-sm hidden md:table-cell">
                            {p?.category?.category_name || "-"}
                          </td>
                          <td className="p-2 text-right text-xs md:text-sm">
                            {p.quantity}
                          </td>
                          <td className="p-2 text-xs md:text-sm">
                            {[p.length, p.width, p.thickness]
                              .filter((v) => v != null && v !== "")
                              .join(" × ")}
                          </td>
                          <td className="p-2 text-xs md:text-sm hidden sm:table-cell">
                            {p.weight ?? "-"}
                          </td>
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <button
                                className="px-2 py-1 rounded bg-white/10 hover:bg-white/20"
                                onClick={() => openEdit(p)}
                                title="Edit"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                className="px-2 py-1 rounded bg-white/10 hover:bg-white/20"
                                onClick={() => {
                                  setActiveProduct(p);
                                  setDetailsOpen(true);
                                }}
                                title="Details"
                              >
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

              {/* Pagination - Always show if not loading */}
              {!loading && (
                <div className="mt-6 pt-4 border-t border-white/10">
                  <Pagination
                    currentPage={pagination.currentPage}
                    totalPages={Math.max(1, pagination.totalPages)}
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
          <div className="w-full max-w-lg bg-[#0f1535] text-white rounded-2xl border border-white/10 p-4 relative">
            {/* Loading Overlay */}
            {createLoading && (
              <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center z-10">
                <div className="flex items-center space-x-3 bg-[#0f1535] px-4 py-3 rounded-lg border border-white/10">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span className="text-sm">Creating product...</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Create Product</h3>
              <button
                className="text-white/60"
                onClick={() => setCreateOpen(false)}
                disabled={createLoading}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/60">Name</label>
                  <input
                    className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1"
                    value={form.product_name}
                    onChange={(e) =>
                      setForm({ ...form, product_name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs text-white/60">Brand Name</label>
                  <input
                    className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1"
                    value={form.brand_name}
                    onChange={(e) =>
                      setForm({ ...form, brand_name: e.target.value })
                    }
                    placeholder="Enter brand name"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/60">Shop</label>
                  <select
                    className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1"
                    value={form.shop_id}
                    onChange={(e) =>
                      setForm({ ...form, shop_id: e.target.value })
                    }
                  >
                    <option value="">Select Shop</option>
                    {shops.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.shop_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/60">Category Name</label>
                  <input
                    className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1"
                    value={form.category_name}
                    onChange={(e) =>
                      setForm({ ...form, category_name: e.target.value })
                    }
                    placeholder="Enter category name"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/60">Length</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1"
                    value={form.length}
                    onChange={(e) =>
                      setForm({ ...form, length: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs text-white/60">Width</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1"
                    value={form.width}
                    onChange={(e) =>
                      setForm({ ...form, width: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs text-white/60">Thickness</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1"
                    value={form.thickness}
                    onChange={(e) =>
                      setForm({ ...form, thickness: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs text-white/60">Quantity</label>
                  <input
                    type="number"
                    className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1"
                    value={form.quantity}
                    onChange={(e) =>
                      setForm({ ...form, quantity: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs text-white/60">Weight</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1"
                    value={form.weight}
                    onChange={(e) =>
                      setForm({ ...form, weight: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="px-3 py-2 rounded bg-white/10 hover:bg-white/20 disabled:opacity-50"
                  onClick={() => setCreateOpen(false)}
                  disabled={createLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  disabled={createLoading}
                >
                  {createLoading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  <span>{createLoading ? "Creating..." : "Create"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-3">
          <div className="w-full max-w-lg bg-[#0f1535] text-white rounded-2xl border border-white/10 p-4 relative">
            {/* Loading Overlay */}
            {editLoading && (
              <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center z-10">
                <div className="flex items-center space-x-3 bg-[#0f1535] px-4 py-3 rounded-lg border border-white/10">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span className="text-sm">Updating product...</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Edit Product</h3>
              <button
                className="text-white/60"
                onClick={() => setEditOpen(false)}
                disabled={editLoading}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleEdit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/60">Name</label>
                  <input
                    className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1"
                    value={form.product_name}
                    onChange={(e) =>
                      setForm({ ...form, product_name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs text-white/60">Brand Name</label>
                  <input
                    className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1"
                    value={form.brand_name}
                    onChange={(e) =>
                      setForm({ ...form, brand_name: e.target.value })
                    }
                    placeholder="Enter brand name"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/60">Shop</label>
                  <select
                    className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1"
                    value={form.shop_id}
                    onChange={(e) =>
                      setForm({ ...form, shop_id: e.target.value })
                    }
                  >
                    <option value="">Select Shop</option>
                    {shops.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.shop_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/60">Category Name</label>
                  <input
                    className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1"
                    value={form.category_name}
                    onChange={(e) =>
                      setForm({ ...form, category_name: e.target.value })
                    }
                    placeholder="Enter category name"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/60">Length</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1"
                    value={form.length}
                    onChange={(e) =>
                      setForm({ ...form, length: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs text-white/60">Width</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1"
                    value={form.width}
                    onChange={(e) =>
                      setForm({ ...form, width: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs text-white/60">Thickness</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1"
                    value={form.thickness}
                    onChange={(e) =>
                      setForm({ ...form, thickness: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs text-white/60">Quantity</label>
                  <input
                    type="number"
                    className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1"
                    value={form.quantity}
                    onChange={(e) =>
                      setForm({ ...form, quantity: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs text-white/60">Weight</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1"
                    value={form.weight}
                    onChange={(e) =>
                      setForm({ ...form, weight: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="px-3 py-2 rounded bg-white/10 hover:bg-white/20 disabled:opacity-50"
                  onClick={() => setEditOpen(false)}
                  disabled={editLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  disabled={editLoading}
                >
                  {editLoading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  <span>{editLoading ? "Updating..." : "Update"}</span>
                </button>
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
              <button
                className="text-white/60"
                onClick={() => setDetailsOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-white/60">Name</p>
                <p>{activeProduct?.product_name}</p>
              </div>
              <div>
                <p className="text-white/60">Brand</p>
                <p>
                  {activeProduct?.brand?.brand_name ||
                    activeProduct?.brand_name}
                </p>
              </div>
              <div>
                <p className="text-white/60">Shop</p>
                <p>
                  {activeProduct?.shop?.shop_name || activeProduct?.shop_id}
                </p>
              </div>
              <div>
                <p className="text-white/60">Category</p>
                <p>
                  {activeProduct?.category?.category_name ||
                    activeProduct?.category_id}
                </p>
              </div>
              <div>
                <p className="text-white/60">Quantity</p>
                <p>{activeProduct?.quantity}</p>
              </div>
              <div>
                <p className="text-white/60">Size</p>
                <p>
                  {[
                    activeProduct?.length,
                    activeProduct?.width,
                    activeProduct?.thickness,
                  ]
                    .filter(Boolean)
                    .join(" × ")}
                </p>
              </div>
              <div>
                <p className="text-white/60">Weight</p>
                <p>{activeProduct?.weight ?? "-"}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Products() {
  return (
    <DashboardProvider>
      <ProductsInner />
    </DashboardProvider>
  );
}
