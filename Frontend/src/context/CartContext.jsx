import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { toast } from 'react-toastify';

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

export function CartProvider({ children }) {
  const [cartState, dispatch] = useReducer(cartReducer, initialCartState);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('shopping_cart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        dispatch({ type: 'LOAD_CART', payload: parsedCart });
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
    }
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
  const addToCart = (product, quantity = 1) => {
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
          position: "top-right"
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
            position: "top-right"
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
            position: "top-right"
          }
        );
        return;
      }
    }

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
        position: "top-right"
      }
    );
  };

  const updateQuantity = (productId, quantity) => {
    // Find the item to check stock limits
    const item = cartState.items.find(item => item.id === productId);
    
    if (item && quantity > item.maxStock) {
      toast.warning(
        <div className="flex flex-col">
          <span className="capitalize font-medium">{item.product_name}</span>
          <span className="text-sm">Only {item.maxStock} available in stock!</span>
        </div>,
        { 
          duration: 2000,
          position: "top-right"
        }
      );
      return;
    }

    dispatch({ 
      type: 'UPDATE_QUANTITY', 
      payload: { productId, quantity } 
    });
  };

  const removeFromCart = (productId) => {
    const item = cartState.items.find(item => item.id === productId);
    dispatch({ 
      type: 'REMOVE_FROM_CART', 
      payload: { productId } 
    });
    
    if (item) {
      toast.info(`${item.product_name} removed from cart`);
    }
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
    toast.info('Cart cleared');
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
