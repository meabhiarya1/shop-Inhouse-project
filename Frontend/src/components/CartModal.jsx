import React from 'react';
import { X, Plus, Minus, Trash2, ShoppingCart, Package } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';

export default function CartModal() {
  const { 
    items, 
    totalItems, 
    isOpen, 
    toggleCart, 
    updateQuantity, 
    removeFromCart, 
    clearCart 
  } = useCart();

  if (!isOpen) return null;

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-2xl bg-[#0f1535] text-white rounded-2xl border border-white/10 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-600/20 rounded-full flex items-center justify-center">
              <ShoppingCart size={20} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Shopping Cart</h2>
              <p className="text-sm text-white/60">
                {totalItems} {totalItems === 1 ? 'item' : 'items'} in your cart
              </p>
            </div>
          </div>
          <button
            onClick={toggleCart}
            className="text-white/60 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4">
                <ShoppingCart size={32} className="text-white/40" />
              </div>
              <h3 className="text-lg font-medium text-white/80 mb-2">Your cart is empty</h3>
              <p className="text-white/60 text-center">
                Add some products to get started with your shopping.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all"
                >
                  <div className="flex items-start space-x-4">
                    {/* Product Icon */}
                    <div className="w-12 h-12 bg-indigo-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package size={20} className="text-indigo-400" />
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium capitalize text-white truncate">
                        {item.product_name}
                      </h3>
                      <div className="mt-1 space-y-1">
                        <div className="flex items-center space-x-4 text-xs text-white/60">
                          <span>Brand: {item.brand}</span>
                          <span>Shop: {item.shop}</span>
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-white/60">
                          <span>Category: {item.category}</span>
                          {item.dimensions !== 'N/A' && (
                            <span>Size: {item.dimensions}</span>
                          )}
                          {item.weight !== 'N/A' && (
                            <span>Weight: {item.weight}</span>
                          )}
                        </div>
                        <div className="text-xs text-white/50 mt-1">
                          Stock: {item.maxStock} available
                        </div>
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                        disabled={item.quantity <= 1}
                      >
                        <Minus size={14} />
                      </button>
                      
                      <div className="w-12 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-medium">{item.quantity}</span>
                      </div>
                      
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                          item.quantity >= item.maxStock
                            ? 'bg-white/5 text-white/30 cursor-not-allowed'
                            : 'bg-white/10 hover:bg-white/20'
                        }`}
                        disabled={item.quantity >= item.maxStock}
                        title={item.quantity >= item.maxStock ? 'Maximum stock reached' : 'Increase quantity'}
                      >
                        <Plus size={14} />
                      </button>
                      
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="w-8 h-8 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 flex items-center justify-center transition-all ml-2"
                        title="Remove from cart"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-semibold">
                Total Items: {totalItems}
              </div>
              <button
                onClick={clearCart}
                className="text-red-400 hover:text-red-300 text-sm flex items-center space-x-1 transition-colors"
              >
                <Trash2 size={14} />
                <span>Clear All</span>
              </button>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={toggleCart}
                className="flex-1 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
              >
                Continue Shopping
              </button>
              <button
                className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-all font-medium"
                onClick={() => {
                  // TODO: Implement checkout functionality
                  alert('Checkout functionality will be implemented next!');
                }}
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
