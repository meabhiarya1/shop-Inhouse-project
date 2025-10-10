import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import {
  Menu,
  Plus,
  Pencil,
  Trash2,
  Info,
  CheckSquare,
  Square,
  Package,
  Tag,
  Store,
  Layers3,
  Weight,
  Ruler,
  Hash,
  Grid3X3,
  List,
  ShoppingCart,
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
import CartIcon from "./navbar/CartIcon.jsx";
import CartModal from "./CartModal.jsx";
import { CartProvider, useCart } from "../context/CartContext.jsx";

// BrandDropdown Component
function BrandDropdown({
  value,
  onChange,
  placeholder = "Select or type brand name",
  brands = [],
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredBrands, setFilteredBrands] = useState([]);

  // Filter brands based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredBrands(brands);
    } else {
      const filtered = brands.filter((brand) =>
        brand.brand_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredBrands(filtered);
    }
  }, [searchTerm, brands]);

  // Initialize filtered brands when brands are loaded
  useEffect(() => {
    setFilteredBrands(brands);
  }, [brands]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onChange(newValue); // Allow typing new brand names
    setIsOpen(true);
  };

  const handleBrandSelect = (brand) => {
    setSearchTerm(brand.brand_name);
    onChange(brand.brand_name, brand.id);
    setIsOpen(false);
  };

  const handleFocus = () => {
    setIsOpen(true);
    setSearchTerm(value);
  };

  const handleBlur = () => {
    // Delay closing to allow for clicks on dropdown items
    setTimeout(() => setIsOpen(false), 200);
  };

  return (
    <div className="relative">
      <input
        type="text"
        className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1"
        value={value}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        autoComplete="off"
      />

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-[#0f1535] border border-white/10 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filteredBrands.length > 0 ? (
            filteredBrands.map((brand) => (
              <div
                key={brand.id}
                className="px-3 py-2 hover:bg-white/10 cursor-pointer text-sm"
                onClick={() => handleBrandSelect(brand)}
              >
                {brand.brand_name}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-white/60 text-sm">
              {searchTerm.trim() ? "No brands found" : "No brands available"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// CategoryDropdown Component
function CategoryDropdown({
  value,
  onChange,
  placeholder = "Select or type category name",
  categories = [],
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCategories, setFilteredCategories] = useState([]);

  // Filter categories based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.filter((category) =>
        category.category_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCategories(filtered);
    }
  }, [searchTerm, categories]);

  // Initialize filtered categories when categories are loaded
  useEffect(() => {
    setFilteredCategories(categories);
  }, [categories]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onChange(newValue); // Allow typing new category names
    setIsOpen(true);
  };

  const handleCategorySelect = (category) => {
    setSearchTerm(category.category_name);
    onChange(category.category_name, category.id);
    setIsOpen(false);
  };

  const handleFocus = () => {
    setIsOpen(true);
    setSearchTerm(value);
  };

  const handleBlur = () => {
    // Delay closing to allow for clicks on dropdown items
    setTimeout(() => setIsOpen(false), 200);
  };

  return (
    <div className="relative">
      <input
        type="text"
        className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1"
        value={value}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        autoComplete="off"
      />

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-[#0f1535] border border-white/10 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((category) => (
              <div
                key={category.id}
                className="px-3 py-2 hover:bg-white/10 cursor-pointer text-sm"
                onClick={() => handleCategorySelect(category)}
              >
                {category.category_name}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-white/60 text-sm">
              {searchTerm.trim()
                ? "No categories found"
                : "No categories available"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ProductsInner() {
  const { selectedShop, period, shops } = useDashboard();
  const { addToCart } = useCart();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]); // Store all brands
  const [categories, setCategories] = useState([]); // Store all categories
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // Pagination state
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
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  const [activeProduct, setActiveProduct] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "list"
  const [addingToCart, setAddingToCart] = useState({}); // Track which items are being added to cart
  const searchTimeoutRef = useRef(null);

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
    category_id: "",
    brand_id: "",
    hasDimensions: false,
    hasWeight: false,
  });

  // Helper function to handle checkbox changes with validation
  const handleCheckboxChange = (checkboxType, checked) => {
    setForm((prevForm) => {
      const newForm = { ...prevForm };

      if (checkboxType === "dimensions") {
        newForm.hasDimensions = checked;
        // If unchecking dimensions in edit mode, handle different scenarios
        if (!checked) {
          // For edit mode: if the original product had no dimensions, clear values
          // For create mode: always clear when unchecking
          if (!activeProduct || 
              (!activeProduct.length && !activeProduct.width && !activeProduct.thickness)) {
            newForm.length = "";
            newForm.width = "";
            newForm.thickness = "";
          } else {
            // Product originally had dimensions but user is unchecking
            // Set to 0 to indicate user wants to remove dimensions
            newForm.length = 0;
            newForm.width = 0;
            newForm.thickness = 0;
          }
        } else {
          // When checking dimensions, restore original values if they exist
          if (activeProduct) {
            newForm.length = activeProduct.length ?? "";
            newForm.width = activeProduct.width ?? "";
            newForm.thickness = activeProduct.thickness ?? "";
          }
        }
      } else if (checkboxType === "weight") {
        newForm.hasWeight = checked;
        // If unchecking weight in edit mode, handle different scenarios
        if (!checked) {
          // For edit mode: if the original product had no weight, clear value
          // For create mode: always clear when unchecking
          if (!activeProduct || !activeProduct.weight) {
            newForm.weight = "";
          } else {
            // Product originally had weight but user is unchecking
            // Set to 0 to indicate user wants to remove weight
            newForm.weight = 0;
          }
        } else {
          // When checking weight, restore original value if it exists
          if (activeProduct) {
            newForm.weight = activeProduct.weight ?? "";
          }
        }
      }

      // Prevent unchecking both checkboxes - at least one must be selected
      if (!newForm.hasDimensions && !newForm.hasWeight) {
        // Show user feedback about the requirement
        toast.warning("At least one option (Dimensions or Weight) must be selected");
        
        // If trying to uncheck the last checked box, prevent it
        if (checkboxType === "dimensions" && prevForm.hasWeight) {
          newForm.hasDimensions = true; // Keep dimensions checked
          // Restore previous dimension values
          newForm.length = prevForm.length;
          newForm.width = prevForm.width;
          newForm.thickness = prevForm.thickness;
        } else if (checkboxType === "weight" && prevForm.hasDimensions) {
          newForm.hasWeight = true; // Keep weight checked
          // Restore previous weight value
          newForm.weight = prevForm.weight;
        } else {
          // Edge case: default to dimensions if somehow both were unchecked
          newForm.hasDimensions = true;
          if (activeProduct) {
            newForm.length = activeProduct.length ?? "";
            newForm.width = activeProduct.width ?? "";
            newForm.thickness = activeProduct.thickness ?? "";
          }
        }
      }

      return newForm;
    });
  };

  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${localStorage.getItem("auth_token") || ""}`,
    }),
    []
  );

  const loadBrands = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/brands", {
        headers,
      });

      const brandsList = Array.isArray(data?.data) ? data.data : [];
      setBrands(brandsList);
    } catch (error) {
      console.error("Error loading brands:", error);
      // Don't show error toast for brands as it's not critical
    }
  }, [headers]);

  const loadCategories = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/categories/dropdown", {
        headers,
      });

      const categoriesList = Array.isArray(data?.data) ? data.data : [];
      setCategories(categoriesList);
    } catch (error) {
      console.error("Error loading categories:", error);
      // Don't show error toast for categories as it's not critical
    }
  }, [headers]);

  const loadProducts = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = {
          period,
          page,
          limit: 12,
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

        // Always show the loaded products
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
            limit: 12,
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

  // Search products using API
  const searchProducts = useCallback(
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
        const { data } = await axios.get("/api/products/search", {
          params,
          headers,
        });

        const productsList = Array.isArray(data?.data?.products)
          ? data.data.products
          : [];

        setProducts(productsList);

        if (data?.pagination) {
          setPagination(data.pagination);
          setCurrentPage(data.pagination.currentPage);
        } else {
          const totalProducts =
            data?.data?.totalProducts || productsList.length;
          const totalPages = Math.ceil(totalProducts / 10);
          setPagination({
            currentPage: page,
            limit: 12,
            total: totalProducts,
            totalPages: totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
          });
          setCurrentPage(page);
        }
      } catch (e) {
        toast.error(
          e?.response?.data?.message || e.message || "Failed to search products"
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
      searchProducts(searchTerm, page);
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
    loadBrands(); // Load brands on component mount
    loadCategories(); // Load categories on component mount
  }, [selectedShop, period, loadProducts, loadBrands, loadCategories]);

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
      category_id: "",
      brand_id: "",
      hasDimensions: false,
      hasWeight: false,
    });
    setCreateOpen(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    // Validation
    const errors = [];

    // Always required fields
    if (!form.product_name.trim()) errors.push("Product name is required");
    if (!form.quantity || form.quantity === "")
      errors.push("Quantity is required");
    if (!form.brand_name.trim()) errors.push("Brand name is required");
    if (!form.category_name.trim()) errors.push("Category name is required");

    // At least one checkbox must be checked
    if (!form.hasDimensions && !form.hasWeight) {
      errors.push(
        "At least one option (Dimensions or Weight) must be selected"
      );
    }

    // Conditional validation based on checkboxes
    if (form.hasDimensions) {
      if (!form.length || form.length === "")
        errors.push("Length is required when Dimensions is checked");
      if (!form.width || form.width === "")
        errors.push("Width is required when Dimensions is checked");
      if (!form.thickness || form.thickness === "")
        errors.push("Thickness is required when Dimensions is checked");
    }

    if (form.hasWeight) {
      if (!form.weight || form.weight === "")
        errors.push("Weight is required when Weight is checked");
    }

    // Show validation errors
    if (errors.length > 0) {
      toast.error(errors.join(", "));
      return;
    }

    setCreateLoading(true);
    try {
      const payload = {
        ...form,
        length: form.hasDimensions ? Number(form.length) : 0,
        width: form.hasDimensions ? Number(form.width) : 0,
        thickness: form.hasDimensions ? Number(form.thickness) : 0,
        quantity: Number(form.quantity),
        weight: form.hasWeight ? Number(form.weight) : 0,
        brand_name: form.brand_id ? null : form.brand_name.toLowerCase(),
        brand_id: form.brand_id,
        shop_id: Number(form.shop_id),
        category_name: form.category_id
          ? null
          : form.category_name.toLowerCase(),
        category_id: form.category_id,
      };
      await axios.post("/api/products", payload, { headers });
      toast.success("Product created");
      setCreateOpen(false);
      loadProducts(currentPage);
    } catch (e) {
      toast.error(
        e?.response?.data?.errors[0]?.msg ||
          e.message ||
          "Failed to create product"
      );
    } finally {
      setCreateLoading(false);
    }
  };

  const openEdit = (prod) => {
    setActiveProduct(prod);
    
    // Determine initial checkbox states based on product data
    const hasValidDimensions = !!(
      (prod.length && prod.length > 0) || 
      (prod.width && prod.width > 0) || 
      (prod.thickness && prod.thickness > 0)
    );
    const hasValidWeight = !!(prod.weight && prod.weight > 0);
    
    // Handle edge case: if product has neither dimensions nor weight, default to dimensions
    let initialHasDimensions = hasValidDimensions;
    let initialHasWeight = hasValidWeight;
    
    // Ensure at least one checkbox is checked
    if (!hasValidDimensions && !hasValidWeight) {
      initialHasDimensions = true; // Default to dimensions if both are empty
    }
    
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
      category_id: prod.category?.id ?? prod.category_id ?? "",
      brand_id: prod.brand?.id ?? prod.brand_id ?? "",
      hasDimensions: initialHasDimensions,
      hasWeight: initialHasWeight,
    });
    setEditOpen(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();

    // Enhanced validation for edit mode
    const errors = [];

    // Always required fields
    if (!form.product_name.trim()) {
      errors.push("Product name is required");
    }
    
    if (!form.quantity || form.quantity === "" || Number(form.quantity) < 0) {
      errors.push("Valid quantity is required");
    }
    
    if (!form.brand_name.trim()) {
      errors.push("Brand name is required");
    }
    
    if (!form.category_name.trim()) {
      errors.push("Category name is required");
    }

    if (!form.shop_id) {
      errors.push("Shop selection is required");
    }

    // At least one checkbox must be checked
    if (!form.hasDimensions && !form.hasWeight) {
      errors.push("At least one option (Dimensions or Weight) must be selected");
    }

    // Enhanced conditional validation based on checkboxes
    if (form.hasDimensions) {
      // Check if all dimension fields are provided and valid
      const lengthVal = Number(form.length);
      const widthVal = Number(form.width);
      const thicknessVal = Number(form.thickness);
      
      if (!form.length || form.length === "" || lengthVal <= 0) {
        errors.push("Valid length is required when Dimensions is checked");
      }
      if (!form.width || form.width === "" || widthVal <= 0) {
        errors.push("Valid width is required when Dimensions is checked");
      }
      if (!form.thickness || form.thickness === "" || thicknessVal <= 0) {
        errors.push("Valid thickness is required when Dimensions is checked");
      }
    }

    if (form.hasWeight) {
      const weightVal = Number(form.weight);
      if (!form.weight || form.weight === "" || weightVal <= 0) {
        errors.push("Valid weight is required when Weight is checked");
      }
    }

    // Additional validation: Check if user is trying to remove both dimensions and weight
    const originalHadDimensions = !!(activeProduct.length || activeProduct.width || activeProduct.thickness);
    const originalHadWeight = !!activeProduct.weight;
    
    if (originalHadDimensions && originalHadWeight) {
      // Product originally had both, user can choose to keep one or both
      if (!form.hasDimensions && !form.hasWeight) {
        errors.push("Cannot remove both dimensions and weight from an existing product");
      }
    }

    // Show validation errors
    if (errors.length > 0) {
      toast.error(errors.join(", "));
      return;
    }

    setEditLoading(true);
    try {
      const payload = {
        ...form,
        length: form.hasDimensions ? Number(form.length) : 0,
        width: form.hasDimensions ? Number(form.width) : 0,
        thickness: form.hasDimensions ? Number(form.thickness) : 0,
        quantity: Number(form.quantity),
        weight: form.hasWeight ? Number(form.weight) : 0,
        brand_name: form.brand_id ? null : form.brand_name.toLowerCase(),
        brand_id: form.brand_id,
        shop_id: Number(form.shop_id),
        category_name: form.category_id
          ? null
          : form.category_name.toLowerCase(),
        category_id: form.category_id,
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
          searchProducts(query, 1);
        } else {
          // Clear search and reload normal products
          setSearchTerm("");
          setCurrentPage(1);
          loadProducts(1);
        }
      }, 500); // 500ms debounce delay
    },
    [searchProducts, loadProducts]
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

  // Cart functionality
  
  const handleAddToCart = async (product) => {
    try {
      // Set loading state for this specific product
      setAddingToCart(prev => ({ ...prev, [product.id]: true }));
      
      // Add product to cart context
      addToCart({
        id: product.id,
        product_name: product.product_name,
        brand: product.Brand?.brand_name || 'Unknown',
        category: product.Category?.category_name || 'Uncategorized',
        shop: product.Shop?.shop_name || 'Unknown Shop',
        dimensions: product.dimensions || 'N/A',
        weight: product.weight || 'N/A',
        quantity: product.quantity // Include the backend quantity for stock validation
      });
      
      // Brief loading state for better UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      toast.error("Failed to add item to cart. Please try again.");
      console.error("Error adding to cart:", error);
    } finally {
      // Clear loading state
      setAddingToCart(prev => ({ ...prev, [product.id]: false }));
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
              <CartIcon />
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
                  <div className="absolute right-0 inset-y-0 flex items-center pr-3">
                    {isSearching ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white/60"></div>
                    ) : searchTerm ? (
                      <button
                        onClick={() => {
                          setSearchTerm("");
                          setCurrentPage(1);
                          loadProducts(1);
                        }}
                        className="text-white/60 hover:text-white"
                        aria-label="Clear search"
                      >
                        ✕
                      </button>
                    ) : null}
                  </div>
                </div>

                {/* Right side - Action buttons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* View Toggle */}
                  <div className="hidden sm:flex items-center bg-white/10 rounded-lg p-1">
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

                  <button
                    onClick={openCreate}
                    className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-all"
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
              {loading || isSearching ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/60"></div>
                    <span className="text-white/70">
                      {isSearching ? "Searching..." : "Loading..."}
                    </span>
                  </div>
                </div>
              ) : products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Package size={48} className="text-white/20 mb-4" />
                  <p className="text-white/60 text-lg">No products found</p>
                  <p className="text-white/40 text-sm mt-2">
                    {searchTerm
                      ? "Try adjusting your search criteria"
                      : "Start by creating your first product"}
                  </p>
                </div>
              ) : (
                <>
                  {/* Select All Header */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={toggleSelectAll}
                        className={`p-2 rounded-lg border-2 transition-all duration-200 ${
                          selectedIds.length === products.length &&
                          products.length > 0
                            ? "bg-indigo-600 border-indigo-500 text-white"
                            : "bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/40"
                        }`}
                      >
                        {selectedIds.length === products.length &&
                        products.length > 0 ? (
                          <CheckSquare size={16} className="text-white" />
                        ) : selectedIds.length > 0 ? (
                          <CheckSquare size={16} className="text-indigo-400" />
                        ) : (
                          <Square size={16} className="text-white/60" />
                        )}
                      </button>
                      <span className="text-white/70 text-sm">
                        {selectedIds.length > 0
                          ? `${selectedIds.length} selected`
                          : "Select all"}
                      </span>
                    </div>
                  </div>

                  {/* Products Display */}
                  {viewMode === "grid" ? (
                    // Grid View
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[calc(100vh-400px)] overflow-y-auto">
                      {products.map((p) => (
                        <div
                          key={p.id}
                          className={`relative bg-gradient-to-br from-white/5 to-white/10 rounded-xl border border-white/10 p-4 hover:border-white/20 hover:shadow-lg transition-all duration-200 ${
                            selectedIds.includes(p.id)
                              ? "ring-2 ring-indigo-500 border-indigo-500/50"
                              : ""
                          }`}
                        >
                          {/* Selection Checkbox */}
                          <button
                            onClick={() => toggleSelected(p.id)}
                            className={`absolute top-3 left-3 p-1 rounded-md border-2 transition-all duration-200 z-10 ${
                              selectedIds.includes(p.id)
                                ? "bg-indigo-600 border-indigo-500 text-white"
                                : "bg-white/10 border-white/20 hover:bg-white/20 hover:border-white/40"
                            }`}
                          >
                            {selectedIds.includes(p.id) ? (
                              <CheckSquare size={14} className="text-white" />
                            ) : (
                              <Square size={14} className="text-white/60" />
                            )}
                          </button>

                          {/* Product Icon */}
                          <div className="flex justify-center mb-3 mt-2">
                            <div className="w-12 h-12 bg-indigo-600/20 rounded-full flex items-center justify-center">
                              <Package size={24} className="text-indigo-400" />
                            </div>
                          </div>

                          {/* Product Name */}
                          <h3 className="text-white font-medium text-center text-sm capitalize mb-3 truncate">
                            {p.product_name}
                          </h3>

                          {/* Product Details */}
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center space-x-2">
                              <Tag size={14} className="text-white/40" />
                              <span className="text-white/60 text-xs capitalize">
                                {p?.brand?.brand_name || "-"}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Store size={14} className="text-white/40" />
                              <span className="text-white/60 text-xs capitalize">
                                {p?.shop?.shop_name || "-"}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Layers3 size={14} className="text-white/40" />
                              <span className="text-white/60 text-xs capitalize">
                                {p?.category?.category_name || "-"}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Hash size={14} className="text-white/40" />
                              <span className={`text-xs ${
                                p.quantity <= 0 
                                  ? 'text-red-400' 
                                  : p.quantity <= 5 
                                    ? 'text-yellow-400' 
                                    : 'text-white/60'
                              }`}>
                                {p.quantity <= 0 ? 'Out of Stock' : `Qty: ${p.quantity}`}
                              </span>
                            </div>
                            {[p.length, p.width, p.thickness].some(v => v != null && v !== "") && (
                              <div className="flex items-center space-x-2">
                                <Ruler size={14} className="text-white/40" />
                                <span className="text-white/60 text-xs">
                                  {[p.length, p.width, p.thickness]
                                    .filter((v) => v != null && v !== "")
                                    .join(" × ")}
                                </span>
                              </div>
                            )}
                            {p.weight && (
                              <div className="flex items-center space-x-2">
                                <Weight size={14} className="text-white/40" />
                                <span className="text-white/60 text-xs">
                                  {p.weight}kg
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center justify-center gap-1">
                            <button
                              className="flex-1 px-2 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all text-xs flex items-center justify-center space-x-1"
                              onClick={() => openEdit(p)}
                              title="Edit Product"
                            >
                              <Pencil size={12} />
                              <span className="hidden sm:inline">Edit</span>
                            </button>
                            <button
                              className="flex-1 px-2 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all text-xs flex items-center justify-center space-x-1"
                              onClick={() => {
                                setActiveProduct(p);
                                setDetailsOpen(true);
                              }}
                              title="View Details"
                            >
                              <Info size={12} />
                              <span className="hidden sm:inline">Info</span>
                            </button>
                            <button
                              className={`flex-1 px-2 py-2 rounded-lg transition-all text-xs flex items-center justify-center space-x-1 border ${
                                addingToCart[p.id]
                                  ? "bg-green-600/20 border-green-500/30 text-green-300"
                                  : p.quantity <= 0
                                    ? "bg-gray-600/20 border-gray-500/30 text-gray-400 cursor-not-allowed"
                                    : "bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 hover:text-indigo-200 border-indigo-500/30"
                              }`}
                              onClick={() => handleAddToCart(p)}
                              disabled={addingToCart[p.id] || p.quantity <= 0}
                              title={
                                addingToCart[p.id] 
                                  ? "Adding to Cart..." 
                                  : p.quantity <= 0 
                                    ? "Out of Stock" 
                                    : "Add to Cart"
                              }
                            >
                              {addingToCart[p.id] ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-300"></div>
                              ) : (
                                <ShoppingCart size={12} />
                              )}
                              <span className="hidden sm:inline">
                                {addingToCart[p.id] ? "Adding..." : p.quantity <= 0 ? "Out of Stock" : "Cart"}
                              </span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    // List View (Table)
                    <div className="overflow-x-auto max-h-[calc(100vh-400px)] overflow-y-auto">
                      <table className="min-w-full text-xs md:text-sm">
                        <thead className="text-white/70 border-b border-white/10">
                          <tr>
                            <th className="text-left p-3">
                              <Square size={14} className="text-white/40" />
                            </th>
                            <th className="text-left p-3">Name</th>
                            <th className="text-left p-3 hidden md:table-cell">
                              Brand
                            </th>
                            <th className="text-left p-3 hidden md:table-cell">
                              Shop
                            </th>
                            <th className="text-left p-3 hidden md:table-cell">
                              Category
                            </th>
                            <th className="text-right p-3">Qty</th>
                            <th className="text-left p-3">Size (L×W×T)</th>
                            <th className="text-left p-3 hidden sm:table-cell">
                              Weight
                            </th>
                            <th className="text-left p-3">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {products.map((p) => (
                            <tr
                              key={p.id}
                              className={`border-t border-white/5 hover:bg-white/5 transition-colors ${
                                selectedIds.includes(p.id)
                                  ? "bg-indigo-600/10"
                                  : ""
                              }`}
                            >
                              <td className="p-3">
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
                              <td className="p-3 text-xs md:text-sm">
                                <div className="flex items-center space-x-2">
                                  <div className="w-8 h-8 bg-indigo-600/20 rounded-lg flex items-center justify-center">
                                    <Package size={14} className="text-indigo-400" />
                                  </div>
                                  <span className="capitalize">{p.product_name}</span>
                                </div>
                              </td>
                              <td className="p-3 text-xs md:text-sm hidden md:table-cell capitalize">
                                {p?.brand?.brand_name || "-"}
                              </td>
                              <td className="p-3 text-xs md:text-sm hidden md:table-cell capitalize">
                                {p?.shop?.shop_name || "-"}
                              </td>
                              <td className="p-3 text-xs md:text-sm hidden md:table-cell capitalize">
                                {p?.category?.category_name || "-"}
                              </td>
                              <td className="p-3 text-right text-xs md:text-sm">
                                <span className={`px-2 py-1 rounded-full ${
                                  p.quantity <= 0 
                                    ? 'bg-red-500/20 text-red-400' 
                                    : p.quantity <= 5 
                                      ? 'bg-yellow-500/20 text-yellow-400' 
                                      : 'bg-white/10 text-white'
                                }`}>
                                  {p.quantity <= 0 ? 'Out of Stock' : p.quantity}
                                </span>
                              </td>
                              <td className="p-3 text-xs md:text-sm">
                                {[p.length, p.width, p.thickness]
                                  .filter((v) => v != null && v !== "")
                                  .join(" × ")}
                              </td>
                              <td className="p-3 text-xs md:text-sm hidden sm:table-cell">
                                {p.weight ? `${p.weight}kg` : "-"}
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-1">
                                  <button
                                    className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
                                    onClick={() => openEdit(p)}
                                    title="Edit Product"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                  <button
                                    className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
                                    onClick={() => {
                                      setActiveProduct(p);
                                      setDetailsOpen(true);
                                    }}
                                    title="View Details"
                                  >
                                    <Info size={14} />
                                  </button>
                                  <button
                                    className={`px-2 py-1 rounded-lg transition-all border ${
                                      addingToCart[p.id]
                                        ? "bg-green-600/20 border-green-500/30 text-green-300"
                                        : p.quantity <= 0
                                          ? "bg-gray-600/20 border-gray-500/30 text-gray-400 cursor-not-allowed"
                                          : "bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 hover:text-indigo-200 border-indigo-500/30"
                                    }`}
                                    onClick={() => handleAddToCart(p)}
                                    disabled={addingToCart[p.id] || p.quantity <= 0}
                                    title={
                                      addingToCart[p.id] 
                                        ? "Adding to Cart..." 
                                        : p.quantity <= 0 
                                          ? "Out of Stock" 
                                          : "Add to Cart"
                                    }
                                  >
                                    {addingToCart[p.id] ? (
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-300"></div>
                                    ) : (
                                      <ShoppingCart size={14} />
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {/* Pagination - Always show if not loading */}
              {!loading && !isSearching && products.length > 0 && (
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

            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg flex items-center space-x-2">
                  <Package size={20} className="text-indigo-400" />
                  <span>Create New Product</span>
                </h3>
                <p className="text-xs text-white/60 mt-1">
                  Add a new product to your inventory. Choose measurement options below.
                </p>
              </div>
              <button
                className="text-white/60 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                onClick={() => setCreateOpen(false)}
                disabled={createLoading}
              >
                ✕
              </button>
            </div>

            {/* Product Measurement Options */}
            <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
              <p className="text-sm text-white/80 mb-3 flex items-center space-x-2">
                <Info size={16} className="text-blue-400" />
                <span>Select measurement types for this product:</span>
              </p>
              <div className="flex gap-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.hasDimensions}
                    onChange={(e) =>
                      handleCheckboxChange("dimensions", e.target.checked)
                    }
                    className="w-4 h-4 text-indigo-600 bg-white/10 border-white/20 rounded focus:ring-indigo-500 focus:ring-2 cursor-pointer"
                  />
                  <div className="flex items-center space-x-2">
                    <Ruler size={16} className="text-indigo-400" />
                    <span className="text-sm text-white/80">Dimensions (L×W×T)</span>
                  </div>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.hasWeight}
                    onChange={(e) =>
                      handleCheckboxChange("weight", e.target.checked)
                    }
                    className="w-4 h-4 text-indigo-600 bg-white/10 border-white/20 rounded focus:ring-indigo-500 focus:ring-2 cursor-pointer"
                  />
                  <div className="flex items-center space-x-2">
                    <Weight size={16} className="text-orange-400" />
                    <span className="text-sm text-white/80">Weight</span>
                  </div>
                </label>
              </div>
              
              {/* Status indicator */}
              <div className="mt-2 text-xs">
                {form.hasDimensions && form.hasWeight && (
                  <span className="text-green-400 flex items-center space-x-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    <span>Product will include both dimensions and weight</span>
                  </span>
                )}
                {form.hasDimensions && !form.hasWeight && (
                  <span className="text-blue-400 flex items-center space-x-1">
                    <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                    <span>Product will include dimensions only</span>
                  </span>
                )}
                {!form.hasDimensions && form.hasWeight && (
                  <span className="text-orange-400 flex items-center space-x-1">
                    <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                    <span>Product will include weight only</span>
                  </span>
                )}
                {!form.hasDimensions && !form.hasWeight && (
                  <span className="text-red-400 flex items-center space-x-1">
                    <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                    <span>⚠ Select at least one measurement type</span>
                  </span>
                )}
              </div>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              {/* Basic Information Section */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-white/80 flex items-center space-x-2 border-b border-white/10 pb-2">
                  <Package size={16} className="text-indigo-400" />
                  <span>Basic Information</span>
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-white/60 flex items-center space-x-1">
                      <Hash size={12} className="text-white/40" />
                      <span>Product Name</span>
                    </label>
                    <input
                      className="w-full bg-white/10 border border-white/10 rounded-lg p-2 mt-1 capitalize focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="Enter Product Name"
                      value={form.product_name}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          product_name: e.target.value.toLowerCase(),
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/60 flex items-center space-x-1">
                      <Hash size={12} className="text-white/40" />
                      <span>Quantity</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="w-full bg-white/10 border border-white/10 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="Enter Quantity (e.g: 25)"
                      value={form.quantity}
                      onChange={(e) =>
                        setForm({ ...form, quantity: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Category & Shop Information */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-white/80 flex items-center space-x-2 border-b border-white/10 pb-2">
                  <Store size={16} className="text-green-400" />
                  <span>Category & Location</span>
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-white/60 flex items-center space-x-1">
                      <Tag size={12} className="text-orange-400" />
                      <span>Brand Name</span>
                    </label>
                    <BrandDropdown
                      value={form.brand_name}
                      onChange={(name, id) =>
                        setForm({
                          ...form,
                          brand_name: name,
                          brand_id: id || null,
                        })
                      }
                      placeholder="Select or type brand name"
                      brands={brands}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/60 flex items-center space-x-1">
                      <Layers3 size={12} className="text-purple-400" />
                      <span>Category Name</span>
                    </label>
                    <CategoryDropdown
                      value={form.category_name}
                      onChange={(name, id) =>
                        setForm({
                          ...form,
                          category_name: name,
                          category_id: id || null,
                        })
                      }
                      placeholder="Select or type category name"
                      categories={categories}
                    />
                  </div>
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
              </div>

              {/* Measurements Section */}
              {(form.hasDimensions || form.hasWeight) && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-white/80 flex items-center space-x-2 border-b border-white/10 pb-2">
                    <Ruler size={16} className="text-yellow-400" />
                    <span>Product Measurements</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {form.hasDimensions && (
                      <>
                        <div>
                          <label className="text-xs text-white/60 flex items-center space-x-1">
                            <Ruler size={12} className="text-blue-400" />
                            <span>Length</span>
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="w-full bg-white/10 border border-white/10 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            placeholder="Enter size in ft/inches"
                            value={form.length}
                            onChange={(e) =>
                              setForm({ ...form, length: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <label className="text-xs text-white/60 flex items-center space-x-1">
                            <Ruler size={12} className="text-blue-400" />
                            <span>Width</span>
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="w-full bg-white/10 border border-white/10 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            placeholder="Enter size in ft/inches"
                            value={form.width}
                            onChange={(e) =>
                              setForm({ ...form, width: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <label className="text-xs text-white/60 flex items-center space-x-1">
                            <Ruler size={12} className="text-blue-400" />
                            <span>Thickness</span>
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="w-full bg-white/10 border border-white/10 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            placeholder="Enter in mm"
                            value={form.thickness}
                            onChange={(e) =>
                              setForm({ ...form, thickness: e.target.value })
                            }
                          />
                        </div>
                      </>
                    )}
                    {form.hasWeight && (
                      <div>
                        <label className="text-xs text-white/60 flex items-center space-x-1">
                          <Weight size={12} className="text-orange-400" />
                          <span>Weight</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="w-full bg-white/10 border border-white/10 rounded-lg p-2 mt-1 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                          placeholder="Enter in kg/grams"
                          value={form.weight}
                          onChange={(e) =>
                            setForm({ ...form, weight: e.target.value })
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Creation Summary */}
              <div className="mt-4 p-3 bg-white/5 rounded-lg">
                <h4 className="text-sm font-medium text-white/80 mb-2 flex items-center space-x-2">
                  <Info size={14} className="text-blue-400" />
                  <span>Product Summary:</span>
                </h4>
                <div className="text-xs text-white/60 space-y-1">
                  <div>
                    • {form.hasDimensions ? "✓" : "✗"} Dimensions will be {form.hasDimensions ? "included" : "skipped"}
                  </div>
                  <div>
                    • {form.hasWeight ? "✓" : "✗"} Weight will be {form.hasWeight ? "included" : "skipped"}
                  </div>
                  {!form.hasDimensions && !form.hasWeight && (
                    <div className="text-amber-400 flex items-center space-x-1">
                      <span>⚠</span>
                      <span>Please select at least one measurement type above</span>
                    </div>
                  )}
                  {form.hasDimensions && form.hasWeight && (
                    <div className="text-green-400">
                      ✨ Complete product with full specifications
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 transition-all"
                  onClick={() => setCreateOpen(false)}
                  disabled={createLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-all"
                  disabled={createLoading || (!form.hasDimensions && !form.hasWeight)}
                >
                  {createLoading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  <Plus size={16} />
                  <span>{createLoading ? "Creating Product..." : "Create Product"}</span>
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

            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">Edit Product</h3>
                <p className="text-xs text-white/60 mt-1">
                  Modify product details. At least one measurement type is required.
                </p>
              </div>
              <button
                className="text-white/60 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                onClick={() => setEditOpen(false)}
                disabled={editLoading}
              >
                ✕
              </button>
            </div>

            {/* Product Measurement Options */}
            <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
              <p className="text-sm text-white/80 mb-3">Choose measurement options:</p>
              <div className="flex gap-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.hasDimensions}
                    onChange={(e) =>
                      handleCheckboxChange("dimensions", e.target.checked)
                    }
                    className="w-4 h-4 text-indigo-600 bg-white/10 border-white/20 rounded focus:ring-indigo-500 focus:ring-2 cursor-pointer"
                  />
                  <div className="flex items-center space-x-2">
                    <Ruler size={16} className="text-indigo-400" />
                    <span className="text-sm text-white/80">Dimensions (L×W×T)</span>
                  </div>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.hasWeight}
                    onChange={(e) =>
                      handleCheckboxChange("weight", e.target.checked)
                    }
                    className="w-4 h-4 text-indigo-600 bg-white/10 border-white/20 rounded focus:ring-indigo-500 focus:ring-2 cursor-pointer"
                  />
                  <div className="flex items-center space-x-2">
                    <Weight size={16} className="text-orange-400" />
                    <span className="text-sm text-white/80">Weight</span>
                  </div>
                </label>
              </div>
              
              {/* Status indicator */}
              <div className="mt-2 text-xs">
                {form.hasDimensions && form.hasWeight && (
                  <span className="text-green-400 flex items-center space-x-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    <span>Both dimensions and weight will be saved</span>
                  </span>
                )}
                {form.hasDimensions && !form.hasWeight && (
                  <span className="text-blue-400 flex items-center space-x-1">
                    <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                    <span>Only dimensions will be saved</span>
                  </span>
                )}
                {!form.hasDimensions && form.hasWeight && (
                  <span className="text-orange-400 flex items-center space-x-1">
                    <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                    <span>Only weight will be saved</span>
                  </span>
                )}
              </div>
            </div>
            <form onSubmit={handleEdit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/60">Name</label>
                  <input
                    className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1 capitalize"
                    placeholder="Enter Product Name"
                    value={form.product_name}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        product_name: e.target.value.toLowerCase(),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs text-white/60">Brand Name</label>
                  <BrandDropdown
                    value={form.brand_name}
                    onChange={(name, id) =>
                      setForm({
                        ...form,
                        brand_name: name,
                        brand_id: id || null,
                      })
                    }
                    placeholder="Select or type brand name"
                    brands={brands}
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
                  <CategoryDropdown
                    value={form.category_name}
                    onChange={(name, id) =>
                      setForm({
                        ...form,
                        category_name: name,
                        category_id: id || null,
                      })
                    }
                    placeholder="Select or type category name"
                    categories={categories}
                  />
                </div>
                {form.hasDimensions && (
                  <>
                    <div>
                      <label className="text-xs text-white/60">Length</label>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1"
                        placeholder="Enter size in ft/inches"
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
                        placeholder="Enter size in ft/inches"
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
                        placeholder="Enter in mm"
                        value={form.thickness}
                        onChange={(e) =>
                          setForm({ ...form, thickness: e.target.value })
                        }
                      />
                    </div>
                  </>
                )}
                <div>
                  <label className="text-xs text-white/60">Quantity</label>
                  <input
                    type="number"
                    className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1"
                    placeholder="Enter Quantity (e.g:25)"
                    value={form.quantity}
                    onChange={(e) =>
                      setForm({ ...form, quantity: e.target.value })
                    }
                  />
                </div>
                {form.hasWeight && (
                  <div>
                    <label className="text-xs text-white/60 flex items-center justify-between">
                      <span>Weight</span>
                      {activeProduct?.weight && (
                        <span className="text-white/40">
                          (Original: {activeProduct.weight}kg)
                        </span>
                      )}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full bg-white/10 border border-white/10 rounded p-2 mt-1 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter in kg/grams"
                      value={form.weight}
                      onChange={(e) =>
                        setForm({ ...form, weight: e.target.value })
                      }
                    />
                  </div>
                )}
              </div>

              {/* Additional Info Section */}
              <div className="mt-4 p-3 bg-white/5 rounded-lg">
                <h4 className="text-sm font-medium text-white/80 mb-2">Edit Summary:</h4>
                <div className="text-xs text-white/60 space-y-1">
                  <div>
                    • {form.hasDimensions ? "✓" : "✗"} Dimensions will be {form.hasDimensions ? "saved" : "removed"}
                  </div>
                  <div>
                    • {form.hasWeight ? "✓" : "✗"} Weight will be {form.hasWeight ? "saved" : "removed"}
                  </div>
                  {!form.hasDimensions && !form.hasWeight && (
                    <div className="text-amber-400">
                      ⚠ At least one measurement type must be selected
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 transition-all"
                  onClick={() => setEditOpen(false)}
                  disabled={editLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-all"
                  disabled={editLoading || (!form.hasDimensions && !form.hasWeight)}
                >
                  {editLoading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  <Pencil size={16} />
                  <span>{editLoading ? "Updating Product..." : "Update Product"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {detailsOpen && activeProduct && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-3">
          <div className="w-full max-w-xl bg-[#0f1535] text-white rounded-2xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-indigo-600/20 rounded-full flex items-center justify-center">
                  <Package size={20} className="text-indigo-400" />
                </div>
                <h3 className="font-semibold text-lg">Product Details</h3>
              </div>
              <button
                className="text-white/60 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                onClick={() => setDetailsOpen(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Product Name */}
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <Package size={18} className="text-indigo-400" />
                  <div>
                    <p className="text-white/60 text-sm">Product Name</p>
                    <p className="text-white font-medium capitalize text-lg">
                      {activeProduct?.product_name}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Brand */}
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <Tag size={16} className="text-orange-400" />
                    <div>
                      <p className="text-white/60 text-sm">Brand</p>
                      <p className="text-white capitalize">
                        {activeProduct?.brand?.brand_name ||
                          activeProduct?.brand_name || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Shop */}
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <Store size={16} className="text-green-400" />
                    <div>
                      <p className="text-white/60 text-sm">Shop</p>
                      <p className="text-white capitalize">
                        {activeProduct?.shop?.shop_name || activeProduct?.shop_id || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Category */}
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <Layers3 size={16} className="text-purple-400" />
                    <div>
                      <p className="text-white/60 text-sm">Category</p>
                      <p className="text-white capitalize">
                        {activeProduct?.category?.category_name ||
                          activeProduct?.category_id || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quantity */}
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <Hash size={16} className="text-blue-400" />
                    <div>
                      <p className="text-white/60 text-sm">Quantity</p>
                      <p className="text-white font-medium text-lg">
                        {activeProduct?.quantity}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dimensions */}
                {[activeProduct?.length, activeProduct?.width, activeProduct?.thickness].some(v => v != null && v !== "") && (
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <Ruler size={16} className="text-yellow-400" />
                      <div>
                        <p className="text-white/60 text-sm">Dimensions (L×W×T)</p>
                        <p className="text-white font-medium">
                          {[
                            activeProduct?.length,
                            activeProduct?.width,
                            activeProduct?.thickness,
                          ]
                            .filter(v => v != null && v !== "")
                            .join(" × ")}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Weight */}
                {activeProduct?.weight && (
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <Weight size={16} className="text-red-400" />
                      <div>
                        <p className="text-white/60 text-sm">Weight</p>
                        <p className="text-white font-medium">
                          {activeProduct?.weight}kg
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-white/10">
                <button
                  onClick={() => {
                    setDetailsOpen(false);
                    openEdit(activeProduct);
                  }}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-all flex items-center justify-center space-x-2"
                >
                  <Pencil size={16} />
                  <span>Edit Product</span>
                </button>
                <button
                  onClick={() => setDetailsOpen(false)}
                  className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
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

export default function Products() {
  return (
    <DashboardProvider>
      <CartProvider>
        <ProductsInner />
        <CartModal />
      </CartProvider>
    </DashboardProvider>
  );
}
