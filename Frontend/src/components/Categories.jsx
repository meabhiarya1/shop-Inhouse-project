import React, { useEffect, useMemo, useState } from "react";
import { Menu, Plus, Pencil, Trash2, Info, Search } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import Sidebar from "./Sidebar.jsx";
import Pagination from "./Pagination.jsx";
import { DashboardProvider } from "../context/DashboardContext.jsx";
import PeriodSelect from "./navbar/PeriodSelect.jsx";
import ShopDropdown from "./navbar/ShopDropdown.jsx";
import AvatarDropdown from "./navbar/AvatarDropdown.jsx";

function CategoriesInner() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination state - unified structure
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
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [activeCategory, setActiveCategory] = useState(null);
  const [formName, setFormName] = useState("");
  const [details, setDetails] = useState({ category: null, products: [] });
  const [searchTerm, setSearchTerm] = useState("");
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [detailsLoadingId, setDetailsLoadingId] = useState(null);

  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${localStorage.getItem("auth_token") || ""}`,
    }),
    []
  );

  const loadCategories = async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/categories", {
        headers,
        // Frontend-only search; do not send q
        params: { page, limit: 10 },
      });

      const list = Array.isArray(data?.data) ? data.data : [];
      const paginationData = data?.pagination || {
        currentPage: page,
        limit: 10,
        total: list.length,
        totalPages: Math.ceil(list.length / 10),
        hasNextPage: false,
        hasPrevPage: false,
      };

      // If current page exceeded after deletions, jump back to last page
      if (
        page > 1 &&
        list.length === 0 &&
        paginationData.totalPages &&
        paginationData.totalPages < page
      ) {
        setCurrentPage(paginationData.totalPages);
        setPagination((prev) => ({
          ...prev,
          currentPage: paginationData.totalPages,
        }));
        setLoading(false);
        return;
      }

      setCategories(list);
      setPagination(paginationData);
      setCurrentPage(paginationData.currentPage);
    } catch (e) {
      toast.error(
        e?.response?.data?.message || e.message || "Failed to load categories"
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    loadCategories(page);
  };

  useEffect(() => {
    loadCategories(currentPage);
  }, []);
  // Frontend-only search: filter locally from current state
  const filteredCategories = useMemo(() => {
    const q = (searchTerm || "").trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) =>
      (c?.category_name || "").toLowerCase().includes(q)
    );
  }, [categories, searchTerm]);

  const openCreate = () => {
    setFormName("");
    setCreateOpen(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      await axios.post(
        "/api/categories",
        { category_name: formName.toLowerCase() },
        { headers }
      );
      toast.success("Category created");
      setCreateOpen(false);
      setCurrentPage(1);
      loadCategories(1);
    } catch (e) {
      toast.error(
        e?.response?.data?.message || e.message || "Failed to create category"
      );
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (cat) => {
    setActiveCategory(cat);
    setFormName(cat.category_name);
    setEditOpen(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!activeCategory) return;
    try {
      setSaving(true);
      await axios.put(
        `/api/categories/${activeCategory.id}`,
        { category_name: formName.toLowerCase() },
        { headers }
      );
      toast.success("Category updated");
      setEditOpen(false);
      loadCategories(currentPage);
    } catch (e) {
      toast.error(
        e?.response?.data?.message || e.message || "Failed to update category"
      );
    } finally {
      setSaving(false);
    }
  };

  const openDelete = (cat) => {
    setActiveCategory(cat);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!activeCategory) return;
    try {
      setDeleting(true);
      await axios.delete(`/api/categories/${activeCategory.id}`, { headers });
      toast.success("Category deleted");
      setDeleteOpen(false);
      // If we deleted the last item on current page and it's not page 1, go to previous page
      const remainingItems = pagination.total - 1;
      const newTotalPages = Math.ceil(remainingItems / pagination.limit);
      const targetPage =
        currentPage > newTotalPages ? Math.max(1, newTotalPages) : currentPage;
      loadCategories(targetPage);
    } catch (e) {
      toast.error(
        e?.response?.data?.message || e.message || "Failed to delete category"
      );
    } finally {
      setDeleting(false);
    }
  };

  const openDetails = async (cat) => {
    try {
      setDetailsLoadingId(cat.id);
      const { data } = await axios.get(`/api/categories/${cat.id}/products`, {
        headers,
      });
      const payload = data?.data || { category: cat, products: [] };
      setDetails(payload);
      setDetailsOpen(true);
    } catch (e) {
      setDetails({ category: cat, products: [] });
      setDetailsOpen(true);
    } finally {
      setDetailsLoadingId(null);
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
                Categories
              </h1>
            </div>

            <div className="flex items-center space-x-4 max-[500px]:space-x-2">
              {/* Navbar kept consistent */}
              <PeriodSelect />
              <ShopDropdown />
              <AvatarDropdown />
            </div>
          </div>

          {/* Content */}
          <div className="p-4 lg:p-8 text-white">
            {/* Info note about categories scope (compact) */}
            <div className="mb-3 rounded-lg border border-indigo-400/30 bg-gradient-to-r from-indigo-500/10 via-blue-500/10 to-transparent p-2">
              <div className="flex items-start gap-2">
                <div className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300">
                  <Info size={14} />
                </div>
                <p className="text-[11px] sm:text-xs leading-snug text-white/90">
                  <span className="text-indigo-300 font-medium">Note:</span>{" "}
                  Categories are global and not tied to any shop. They can be
                  assigned to any product, while products themselves can be
                  associated with shops.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4 gap-3">
              <div className="text-white/70 text-sm">
                Total: {pagination.total} categories
                {pagination.total > 0 && (
                  <span className="ml-2">
                    (Page {pagination.currentPage} of {pagination.totalPages})
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="relative w-[240px] sm:w-[320px]">
                  <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center text-white/50">
                    <Search size={16} />
                  </div>
                  <input
                    className="w-full h-10 pl-9 pr-8 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Search categories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button
                      className="absolute inset-y-0 right-0 pr-2 flex items-center text-white/60 hover:text-white"
                      onClick={() => setSearchTerm("")}
                      title="Clear"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <button
                  onClick={openCreate}
                  className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded-lg text-sm whitespace-nowrap"
                >
                  <Plus size={16} />
                  <span>Create Category</span>
                </button>
              </div>
            </div>

            <div className="rounded-2xl p-5 bg-gradient-to-br from-[#121a3d] to-[#182057] border border-white/10">
              <div className="overflow-x-auto">
                {/* Scrollable region with sticky header; keeps columns aligned */}
                <div className="max-h-[440px] scroll-y-invisible overflow-y-auto rounded-lg">
                  <table className="min-w-full table-fixed text-sm">
                    <thead className="sticky top-0 z-10 bg-[#121a3d] text-white/70">
                      <tr>
                        <th className="text-left p-2 pr-4">Name</th>
                        <th className="text-left p-2 w-40">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        Array.from({ length: pagination.limit }).map((_, i) => (
                          <tr
                            key={`skeleton-${i}`}
                            className="border-t border-white/10"
                          >
                            <td className="p-2 pr-4">
                              <div className="h-4 w-1/2 sm:w-2/5 bg-white/10 rounded animate-pulse" />
                            </td>
                            <td className="p-2 w-40">
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-8 bg-white/10 rounded animate-pulse" />
                                <div className="h-6 w-8 bg-white/10 rounded animate-pulse" />
                                <div className="h-6 w-8 bg-white/10 rounded animate-pulse" />
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : filteredCategories.length === 0 ? (
                        <tr>
                          <td className="p-2" colSpan={2}>
                            No categories found
                          </td>
                        </tr>
                      ) : (
                        filteredCategories.map((c) => (
                          <tr
                            key={c.id}
                            className="border-t border-white/10 hover:bg-white/5"
                          >
                            <td
                              className="p-2 pr-4 cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis capitalize"
                              onClick={() => openDetails(c)}
                              title={c.category_name}
                            >
                              {c.category_name}
                            </td>
                            <td className="p-2 w-40">
                              <div className="flex items-center gap-2 min-w-[140px]">
                                <button
                                  className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 disabled:opacity-50"
                                  onClick={() => openEdit(c)}
                                  title="Edit"
                                  disabled={
                                    creating ||
                                    saving ||
                                    deleting ||
                                    detailsLoadingId === c.id
                                  }
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 disabled:opacity-50"
                                  onClick={() => openDelete(c)}
                                  title="Delete"
                                  disabled={
                                    creating ||
                                    saving ||
                                    deleting ||
                                    detailsLoadingId === c.id
                                  }
                                >
                                  <Trash2 size={14} />
                                </button>
                                <button
                                  className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 disabled:opacity-50"
                                  onClick={() => openDetails(c)}
                                  title="Details"
                                  disabled={creating || saving || deleting}
                                >
                                  {detailsLoadingId === c.id ? (
                                    <span className="inline-block h-4 w-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <Info size={14} />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
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
          <div className="w-full max-w-md bg-[#0f1535] text-white rounded-2xl border border-white/10 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Create Category</h3>
              <button
                className="text-white/60"
                onClick={() => setCreateOpen(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs text-white/60">Name</label>
                <input
                  className="w-full bg:white/10 border border:white/10 rounded p-2 mt-1"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="px-3 py-2 rounded bg-white/10 hover:bg-white/20 disabled:opacity-60"
                  onClick={() => setCreateOpen(false)}
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60"
                  disabled={creating}
                >
                  {creating ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-block h-4 w-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    "Create"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-3">
          <div className="w-full max-w-md bg-[#0f1535] text-white rounded-2xl border border-white/10 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Edit Category</h3>
              <button
                className="text-white/60"
                onClick={() => setEditOpen(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleEdit} className="space-y-3">
              <div>
                <label className="text-xs text-white/60">Name</label>
                <input
                  className="w-full bg:white/10 border border:white/10 rounded p-2 mt-1"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="px-3 py-2 rounded bg-white/10 hover:bg-white/20 disabled:opacity-60"
                  onClick={() => setEditOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60"
                  disabled={saving}
                >
                  {saving ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-block h-4 w-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    "Save"
                  )}
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
            <h3 className="font-semibold mb-2">Delete Category</h3>
            <p className="text-white/70 mb-4">
              Are you sure you want to delete this category?
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="px-3 py-2 rounded bg-white/10 hover:bg-white/20 disabled:opacity-60"
                onClick={() => setDeleteOpen(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="px-3 py-2 rounded bg-red-600 hover:bg-red-700 disabled:opacity-60"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-block h-4 w-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </span>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {detailsOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-3">
          <div className="w-full max-w-2xl bg-[#0f1535] text-white rounded-2xl border border-white/10 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Category Details</h3>
              <button
                className="text-white/60"
                onClick={() => setDetailsOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="mb-4">
              <p className="text-white/60 text-sm">Name</p>
              <p className="text-lg capitalize">
                {details?.category?.category_name || "-"}
              </p>
            </div>
            <div>
              <p className="text-white/60 text-sm mb-2">Products</p>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-white/70">
                    <tr>
                      <th className="text-left p-2">Product</th>
                      <th className="text-left p-2">Brand</th>
                      <th className="text-left p-2">Shop</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(details?.products || []).length === 0 ? (
                      <tr>
                        <td className="p-2" colSpan={3}>
                          No products
                        </td>
                      </tr>
                    ) : (
                      details.products.map((p) => (
                        <tr key={p.id} className="border-t border-white/10">
                          <td className="p-2 capitalize">{p.product_name}</td>
                          <td className="p-2 capitalize">
                            {p?.brand?.brand_name || "-"}
                          </td>
                          <td className="p-2 capitalize">
                            {p?.shop?.shop_name || "-"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Categories() {
  return (
    <DashboardProvider>
      <CategoriesInner />
    </DashboardProvider>
  );
}
