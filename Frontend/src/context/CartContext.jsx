import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from '../utils/axiosConfig';

const CartContext = createContext(null);

// Cart reducer for managing cart state
const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const { product, quantity = 1 } = action.payload;
      const existingItemIndex = state.items.findIndex(item => item.id === product.id);
      
      if (existingItemIndex >= 0) {
        // Item exists, update quantity
        const updatedItems = [...state.items];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + quantity
        };
        
        return {
          ...state,
          items: updatedItems,
          totalItems: state.totalItems + quantity
        };
      } else {
        // New item, add to cart
        const newItem = {
          id: product.id,
          product_name: product.product_name,
          brand: product.brand?.brand_name || 'Unknown Brand',
          shop: product.shop?.shop_name || 'Unknown Shop',
          shop_id: product.shop?.id || product.shop_id || null,
          category: product.category?.category_name || 'Unknown Category',
          dimensions: (() => {
            const parts = [];
            if (product.length && product.length !== "") parts.push(`${product.length}ft`);
            if (product.width && product.width !== "") parts.push(`${product.width}ft`);
            if (product.thickness && product.thickness !== "") parts.push(`${product.thickness}mm`);
            return parts.length > 0 ? parts.join(" × ") : 'N/A';
          })(),
          weight: product.weight ? `${product.weight}kg` : 'N/A',
          quantity: quantity,
          maxStock: product.quantity || 0, // Store available stock from backend
          addedAt: new Date().toISOString()
        };
        
        return {
          ...state,
          items: [...state.items, newItem],
          totalItems: state.totalItems + quantity
        };
      }
    }
    
    case 'UPDATE_QUANTITY': {
      const { productId, quantity } = action.payload;
      const updatedItems = state.items.map(item => 
        item.id === productId ? { ...item, quantity: Math.max(0, quantity) } : item
      ).filter(item => item.quantity > 0); // Remove items with 0 quantity
      
      const newTotalItems = updatedItems.reduce((total, item) => total + item.quantity, 0);
      
      return {
        ...state,
        items: updatedItems,
        totalItems: newTotalItems
      };
    }
    
    case 'REMOVE_FROM_CART': {
      const { productId } = action.payload;
      const itemToRemove = state.items.find(item => item.id === productId);
      const updatedItems = state.items.filter(item => item.id !== productId);
      
      return {
        ...state,
        items: updatedItems,
        totalItems: state.totalItems - (itemToRemove?.quantity || 0)
      };
    }
    
    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
        totalItems: 0
      };
    
    case 'LOAD_CART':
      return action.payload;
    
    default:
      return state;
  }
};

// Initial cart state
const initialCartState = {
  items: [],
  totalItems: 0,
  isOpen: false
};

// API helper functions
const getAuthHeaders = () => {
  const token = localStorage.getItem("auth_token");
  return {
    Authorization: `Bearer ${token || ""}`,
    'Content-Type': 'application/json'
  };
};

const cartAPI = {
  // Get all cart items from backend
  async getCartItems() {
    try {
      const response = await axios.get('/api/cart', {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching cart items:', error);
      throw error;
    }
  },

  // Add item to cart in backend
  async addToCart(productId, quantity = 1) {
    try {
      const response = await axios.post('/api/cart', {
        product_id: productId,
        quantity: quantity
      }, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  },

  // Update cart item quantity in backend
  async updateCartItem(cartItemId, quantity) {
    try {
      const response = await axios.put(`/api/cart/${cartItemId}`, {
        quantity: quantity
      }, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error updating cart item:', error);
      throw error;
    }
  },

  // Remove item from cart in backend
  async removeFromCart(cartItemId) {
    try {
      const response = await axios.delete(`/api/cart/${cartItemId}`, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  },

  // Clear entire cart in backend
  async clearCart() {
    try {
      const response = await axios.delete('/api/cart', {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  }
};

export function CartProvider({ children }) {
  const [cartState, dispatch] = useReducer(cartReducer, initialCartState);

  // Separate function to reload cart data (can be called anytime)
  const reloadCartFromBackend = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        // No auth token, load from localStorage as fallback
        const savedCart = localStorage.getItem('shopping_cart');
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          dispatch({ type: 'LOAD_CART', payload: parsedCart });
        }
        return;
      }

      const response = await cartAPI.getCartItems();
      if (response.success) {
        // Transform backend cart items to frontend format
        const transformedItems = response.data.items.map(item => ({
          id: item.product.id,
          cartItemId: item.id, // Store backend cart item ID for updates/deletes
          product_name: item.product.product_name,
          brand: item.product.brand?.brand_name || 'Unknown Brand',
          shop: item.product.shop?.shop_name || 'Unknown Shop',
          shop_id: item.product.shop?.id || item.product.shop_id || null,
          category: item.product.category?.category_name || 'Unknown Category',
          dimensions: (() => {
            const parts = [];
            if (item.product.length) parts.push(`${item.product.length}ft`);
            if (item.product.width) parts.push(`${item.product.width}ft`);
            if (item.product.thickness) parts.push(`${item.product.thickness}mm`);
            return parts.length > 0 ? parts.join(" × ") : 'N/A';
          })(),
          weight: item.product.weight ? `${item.product.weight}kg` : 'N/A',
          quantity: item.quantity,
          maxStock: item.product.stock || 0,
          addedAt: item.created_at
        }));

        const totalItems = response.data.summary.total_items || 0;

        dispatch({ 
          type: 'LOAD_CART', 
          payload: { 
            items: transformedItems, 
            totalItems: totalItems,
            isOpen: cartState.isOpen // Preserve current state
          } 
        });
      }
    } catch (error) {
      console.error('Error loading cart from backend:', error);
      // Fallback to localStorage if backend fails
      try {
        const savedCart = localStorage.getItem('shopping_cart');
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          dispatch({ type: 'LOAD_CART', payload: parsedCart });
        }
      } catch (localError) {
        console.error('Error loading cart from localStorage:', localError);
      }
    }
  };

  // Load cart from backend on mount
  useEffect(() => {
    reloadCartFromBackend();
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('shopping_cart', JSON.stringify(cartState));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [cartState]);

  // Cart actions
  const addToCart = async (product, quantity = 1) => {
    try {
      // Check if product has stock available (backend quantity)
      const backendQuantity = product.quantity;
      if (!backendQuantity || backendQuantity <= 0) {
        toast.error(
          <div className="flex flex-col">
            <span className="capitalize font-medium">{product.product_name}</span>
            <span className="text-sm">Out of stock!</span>
          </div>,
          { 
            duration: 2000,
            position: "top-center"
          }
        );
        return;
      }

      // Check if trying to add more than available stock
      const existingItem = cartState.items.find(item => item.id === product.id);
      const currentCartQuantity = existingItem ? existingItem.quantity : 0;
      const totalQuantityAfterAdd = currentCartQuantity + quantity;

      if (totalQuantityAfterAdd > backendQuantity) {
        const availableToAdd = backendQuantity - currentCartQuantity;
        
        if (availableToAdd <= 0) {
          toast.error(
            <div className="flex flex-col">
              <span className="capitalize font-medium">{product.product_name}</span>
              <span className="text-sm">Maximum quantity already in cart!</span>
            </div>,
            { 
              duration: 2000,
              position: "top-center"
            }
          );
          return;
        } else {
          toast.warning(
            <div className="flex flex-col">
              <span className="capitalize font-medium">{product.product_name}</span>
              <span className="text-sm">Only {availableToAdd} more available to add!</span>
            </div>,
            { 
              duration: 3000,
              position: "top-center"
            }
          );
          return;
        }
      }

      // Try to add to backend first
      const token = localStorage.getItem("auth_token");
      if (token) {
        const response = await cartAPI.addToCart(product.id, quantity);
        
        if (response.success) {
          // Reload entire cart from backend to get latest data
          await reloadCartFromBackend();

          toast.success(
            <div className="flex flex-col">
              <span className="capitalize font-medium">{product.product_name}</span>
              <span className="text-sm">{response.message}</span>
            </div>,
            { 
              duration: 2000,
              position: "top-center"
            }
          );
        }
      } else {
        // No auth token, use local storage only
        dispatch({ 
          type: 'ADD_TO_CART', 
          payload: { product, quantity } 
        });
        
        toast.success(
          <div className="flex flex-col">
            <span className="capitalize font-medium">{product.product_name}</span>
            <span className="text-sm">Added to cart!</span>
          </div>,
          { 
            duration: 2000,
            position: "top-center"
          }
        );
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      
      // Show appropriate error message
      if (error.response && error.response.data && error.response.data.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to add item to cart. Please try again.');
      }
    }
  };

  const updateQuantity = async (productId, quantity) => {
    try {
      // Find the item to check stock limits
      const item = cartState.items.find(item => item.id === productId);
      
      if (!item) {
        toast.error('Item not found in cart');
        return;
      }
      
      if (quantity > item.maxStock) {
        toast.warning(
          <div className="flex flex-col">
            <span className="capitalize font-medium">{item.product_name}</span>
            <span className="text-sm">Only {item.maxStock} available in stock!</span>
          </div>,
          { 
            duration: 2000,
            position: "top-center"
          }
        );
        return;
      }

      const token = localStorage.getItem("auth_token");
      if (token && item.cartItemId) {
        // Update in backend
        const response = await cartAPI.updateCartItem(item.cartItemId, quantity);
        
        if (response.success) {
          // Update local state
          dispatch({ 
            type: 'UPDATE_QUANTITY', 
            payload: { productId, quantity } 
          });
        }
      } else {
        // No auth token or cartItemId, update locally only
        dispatch({ 
          type: 'UPDATE_QUANTITY', 
          payload: { productId, quantity } 
        });
      }
    } catch (error) {
      console.error('Error updating cart quantity:', error);
      
      if (error.response && error.response.data && error.response.data.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to update quantity. Please try again.');
      }
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const item = cartState.items.find(item => item.id === productId);
      
      if (!item) {
        toast.error('Item not found in cart');
        return;
      }

      const token = localStorage.getItem("auth_token");
      if (token && item.cartItemId) {
        // Remove from backend
        const response = await cartAPI.removeFromCart(item.cartItemId);
        
        if (response.success) {
          // Update local state
          dispatch({ 
            type: 'REMOVE_FROM_CART', 
            payload: { productId } 
          });
          
          toast.info(`${item.product_name} removed from cart`);
        }
      } else {
        // No auth token or cartItemId, remove locally only
        dispatch({ 
          type: 'REMOVE_FROM_CART', 
          payload: { productId } 
        });
        
        toast.info(`${item.product_name} removed from cart`);
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      
      if (error.response && error.response.data && error.response.data.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to remove item from cart. Please try again.');
      }
    }
  };

  const clearCart = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (token) {
        // Clear from backend
        const response = await cartAPI.clearCart();
        
        if (response.success) {
          dispatch({ type: 'CLEAR_CART' });
          toast.info(response.message || 'Cart cleared');
        }
      } else {
        // No auth token, clear locally only
        dispatch({ type: 'CLEAR_CART' });
        toast.info('Cart cleared');
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      
      if (error.response && error.response.data && error.response.data.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to clear cart. Please try again.');
      }
    }
  };

  const toggleCart = () => {
    dispatch({ 
      type: 'LOAD_CART', 
      payload: { ...cartState, isOpen: !cartState.isOpen } 
    });
  };

  const getItemQuantity = (productId) => {
    const item = cartState.items.find(item => item.id === productId);
    return item?.quantity || 0;
  };

  const value = {
    ...cartState,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    toggleCart,
    getItemQuantity,
    reloadCartFromBackend, // Expose reload function
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
