import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import { 
  Menu, 
  Plus, 
  Pencil, 
  Trash2, 
  Info, 
  Search,
  Grid3X3,
  List,
  Tag,
  Package
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import Sidebar from "./Sidebar.jsx";
import Pagination from "./Pagination.jsx";
import { DashboardProvider } from "../context/DashboardContext.jsx";
import PeriodSelect from "./navbar/PeriodSelect.jsx";
import ShopDropdown from "./navbar/ShopDropdown.jsx";
import AvatarDropdown from "./navbar/AvatarDropdown.jsx";
import CartIcon from "./navbar/CartIcon.jsx";

function CategoriesInner() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination state - unified structure
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    limit: 12,
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
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef(null);
  
  // View mode state
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "list"

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
        params: { page, limit: 12 },
      });

      const list = Array.isArray(data?.data) ? data.data : [];
      const paginationData = data?.pagination || {
        currentPage: page,
        limit: 12,
        total: list.length,
        totalPages: Math.ceil(list.length / 12),
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

  // Search categories using API
  const searchCategories = useCallback(
    async (query, page = 1) => {
      if (!query || query.trim().length === 0) {
        return;
      }

      setIsSearching(true);
      try {
        const params = {
          q: query.trim(),
          page,
          limit: 12,
        };
        const { data } = await axios.get("/api/categories/search", {
          params,
          headers,
        });

        const categoriesList = Array.isArray(data?.data?.categories)
          ? data.data.categories
          : [];

        setCategories(categoriesList);

        if (data?.pagination) {
          setPagination(data.pagination);
          setCurrentPage(data.pagination.currentPage);
        } else {
          const totalCategories =
            data?.data?.totalCategories || categoriesList.length;
          const totalPages = Math.ceil(totalCategories / 12);
          setPagination({
            currentPage: page,
            limit: 12,
            total: totalCategories,
            totalPages: totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
          });
          setCurrentPage(page);
        }
      } catch (e) {
        toast.error(
          e?.response?.data?.message ||
            e.message ||
            "Failed to search categories"
        );
      } finally {
        setIsSearching(false);
      }
    },
    [headers]
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);

    // If we have a search term active, use search API pagination
    if (searchTerm) {
      searchCategories(searchTerm, page);
    } else {
      // Normal server-side pagination
      loadCategories(page);
    }
  };

  useEffect(() => {
    loadCategories(currentPage);
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback(
    (query) => {
      // Clear existing timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // Set new timeout
      searchTimeoutRef.current = setTimeout(() => {
        if (query && query.trim()) {
          searchCategories(query, 1);
        } else {
          // Clear search and reload normal categories
          setSearchTerm("");
          setCurrentPage(1);
          loadCategories(1);
        }
      }, 500); // 500ms debounce delay
    },
    [searchCategories, loadCategories]
  );

  // Handle search input change
  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    debouncedSearch(term);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

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
      console.log(e);
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
              <CartIcon />
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

            <div className="mb-4">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="text-white/70 text-sm">
                  Total: {pagination.total} categories
                  {pagination.total > 0 && (
                    <span className="ml-2">
                      (Page {pagination.currentPage} of {pagination.totalPages})
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
                      placeholder="Search categories..."
                      value={searchTerm}
                      onChange={handleSearch}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                      {isSearching ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white/60"></div>
                      ) : searchTerm ? (
                        <button
                          onClick={() => {
                            setSearchTerm("");
                            setCurrentPage(1);
                            loadCategories(1);
                          }}
                          className="text-white/60 hover:text-white"
                          title="Clear"
                        >
                          ✕
                        </button>
                      ) : null}
                    </div>
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
            </div>

            <div className="rounded-2xl p-5 bg-gradient-to-br from-[#121a3d] to-[#182057] border border-white/10">
              {loading || isSearching ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto mb-4"></div>
                    <p className="text-white/60">
                      {isSearching ? "Searching categories..." : "Loading categories..."}
                    </p>
                  </div>
                </div>
              ) : categories.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
                    <Tag size={32} className="text-white/40" />
                  </div>
                  <h3 className="text-lg font-medium text-white/80 mb-2">No categories found</h3>
                  <p className="text-white/60 text-center">
                    {searchTerm ? "Try adjusting your search terms." : "Create your first category to get started."}
                  </p>
                </div>
              ) : (
                <>
                  {viewMode === "grid" ? (
                    // Grid View
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {categories.map((c) => (
                        <div
                          key={c.id}
                          className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all group cursor-pointer"
                          onClick={() => openDetails(c)}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="w-12 h-12 bg-indigo-600/20 rounded-lg flex items-center justify-center">
                              <Tag size={20} className="text-indigo-400" />
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEdit(c);
                                }}
                                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100"
                                title="Edit Category"
                                disabled={creating || saving || deleting || detailsLoadingId === c.id}
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDelete(c);
                                }}
                                className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-all opacity-0 group-hover:opacity-100"
                                title="Delete Category"
                                disabled={creating || saving || deleting || detailsLoadingId === c.id}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          <div className="mb-3">
                            <h3 className="font-medium capitalize text-white truncate mb-1">
                              {c.category_name}
                            </h3>
                            <div className="flex items-center space-x-2">
                              <Package size={14} className="text-white/40" />
                              <span className="text-white/60 text-xs">
                                Category ID: {c.id}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-center gap-1 pt-2 border-t border-white/10">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openDetails(c);
                              }}
                              className="flex-1 px-2 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all text-xs flex items-center justify-center space-x-1"
                              disabled={creating || saving || deleting}
                            >
                              {detailsLoadingId === c.id ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white/60"></div>
                              ) : (
                                <Info size={12} />
                              )}
                              <span className="hidden sm:inline">
                                {detailsLoadingId === c.id ? "Loading..." : "Details"}
                              </span>
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
                              <th className="text-left p-3 font-medium">Category</th>
                              <th className="text-left p-3 w-32 font-medium">ID</th>
                              <th className="text-center p-3 w-40 font-medium">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {categories.map((c) => (
                              <tr
                                key={c.id}
                                className="border-t border-white/10 hover:bg-white/5 transition-colors"
                              >
                                <td className="p-3">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-indigo-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                      <Tag size={16} className="text-indigo-400" />
                                    </div>
                                    <div
                                      className="cursor-pointer capitalize font-medium hover:text-indigo-300 transition-colors"
                                      onClick={() => openDetails(c)}
                                      title={c.category_name}
                                    >
                                      {c.category_name}
                                    </div>
                                  </div>
                                </td>
                                <td className="p-3 text-white/60">
                                  #{c.id}
                                </td>
                                <td className="p-3">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-all border border-white/10"
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
                                      className="px-2 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-all border border-red-500/30"
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
                                      className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-all border border-white/10"
                                      onClick={() => openDetails(c)}
                                      title="Details"
                                      disabled={creating || saving || deleting}
                                    >
                                      {detailsLoadingId === c.id ? (
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white/60"></div>
                                      ) : (
                                        <Info size={14} />
                                      )}
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

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
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
                </>
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
