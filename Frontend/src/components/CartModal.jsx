import React, { useState, useMemo } from 'react';
import { X, Plus, Minus, Trash2, ShoppingCart, Package, DollarSign, User, Phone, Calendar, CreditCard, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { toast } from 'react-toastify';

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

  // Modal state - 'cart' or 'checkout'
  const [currentModal, setCurrentModal] = useState('cart');

  // Checkout form state
  const [checkoutForm, setCheckoutForm] = useState({
    customer_name: '',
    customer_phone: '',
    payment_method: 'cash',
    sale_date: new Date().toISOString().slice(0, 16), // Current date-time in local format
    customer_paid: 0 // Amount actually paid by customer
  });

  // Unit prices state for each product
  const [unitPrices, setUnitPrices] = useState({});

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  const handleUnitPriceChange = (productId, price) => {
    // Only allow numeric values (including decimals)
    const numericValue = price.replace(/[^0-9.]/g, '');
    
    // Prevent multiple decimal points
    const parts = numericValue.split('.');
    const cleanValue = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : numericValue;
    
    setUnitPrices(prev => ({
      ...prev,
      [productId]: cleanValue
    }));
  };

  // Calculate totals
  const totals = useMemo(() => {
    let subtotal = 0;
    const itemTotals = {};
    
    items.forEach(item => {
      const unitPrice = parseFloat(unitPrices[item.id]) || 0;
      const itemTotal = unitPrice * item.quantity;
      itemTotals[item.id] = itemTotal;
      subtotal += itemTotal;
    });

    return {
      itemTotals,
      subtotal,
      total: subtotal // Can add taxes, discounts etc. here later
    };
  }, [items, unitPrices]);

  const proceedToCheckout = () => {
    // Check if all products have unit prices
    const missingPrices = items.filter(item => !unitPrices[item.id] || parseFloat(unitPrices[item.id]) <= 0);
    if (missingPrices.length > 0) {
      toast.error('Please enter unit prices for all products', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }

    if (totals.total <= 0) {
      toast.error('Total amount must be greater than 0', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }

    // Set default customer paid amount to grand total (only if not already set)
    setCheckoutForm(prev => ({
      ...prev,
      customer_paid: prev.customer_paid || totals.total
    }));

    setCurrentModal('checkout');
  };

  const handleFinalCheckout = () => {
    // Validate form - customer name and phone are now optional
    if (checkoutForm.customer_paid <= 0) {
      toast.error('Customer paid amount must be greater than 0', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }

    if (checkoutForm.customer_paid > totals.total) {
      toast.error('Customer paid amount cannot be greater than Grand Total', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }

    // TODO: Will implement API call for multiple products checkout
    toast.info('Checkout functionality will be implemented when the API is updated to handle multiple products!', {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
    
    console.log('Final Checkout Data:', {
      items: items.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        unit_price: parseFloat(unitPrices[item.id]) || 0,
        total: totals.itemTotals[item.id]
      })),
      customer: checkoutForm,
      totals: {
        ...totals,
        customer_paid: checkoutForm.customer_paid,
        discount: totals.total - checkoutForm.customer_paid
      }
    });
  };

  const goBackToCart = () => {
    setCurrentModal('cart');
  };

  // Early return after all hooks are defined
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-4xl bg-gradient-to-br from-[#0f1535] to-[#1a2048] text-white rounded-2xl border border-white/20 shadow-2xl max-h-[95vh] flex flex-col">
        
        {currentModal === 'cart' ? (
          // CART ITEMS MODAL
          <>
            {/* Cart Header */}
            <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-indigo-600/20 rounded-xl flex items-center justify-center">
                    <ShoppingCart size={24} className="text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Shopping Cart</h2>
                    <p className="text-sm text-white/60">
                      {totalItems} {totalItems === 1 ? 'item' : 'items'} in your cart
                    </p>
                  </div>
                </div>
                
                {/* Grand Total */}
                <div className="text-right">
                  <div className="text-sm text-white/60">Grand Total</div>
                  <div className="text-3xl font-bold text-green-400">
                    ₹{totals.total.toLocaleString('en-IN')}
                  </div>
                </div>
                
                <button
                  onClick={toggleCart}
                  className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          // CHECKOUT DETAILS MODAL
          <>
            {/* Checkout Header */}
            <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-600/20 rounded-xl flex items-center justify-center">
                    <CreditCard size={24} className="text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Checkout Details</h2>
                    <p className="text-sm text-white/60">
                      Complete your sale with customer information
                    </p>
                  </div>
                </div>
                
                {/* Customer Paid vs Grand Total */}
                <div className="text-right space-y-1">
                  <div className="text-sm text-white/60">Grand Total: ₹{totals.total.toLocaleString('en-IN')}</div>
                  <div className="text-2xl font-bold text-green-400">
                    Paid: ₹{checkoutForm.customer_paid.toLocaleString('en-IN')}
                  </div>
                  {checkoutForm.customer_paid < totals.total && (
                    <div className="text-xs text-yellow-400">
                      Discount: ₹{(totals.total - checkoutForm.customer_paid).toLocaleString('en-IN')}
                    </div>
                  )}
                </div>
                
                <button
                  onClick={toggleCart}
                  className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </>
        )}

        {currentModal === 'cart' ? (
          // CART ITEMS VIEW
          <div className="flex-1 overflow-y-auto">
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
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold">Review Your Items</h3>
                  <button
                    onClick={clearCart}
                    className="text-red-400 hover:text-red-300 text-sm flex items-center space-x-1 transition-colors px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20"
                  >
                    <Trash2 size={14} />
                    <span>Clear All</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        {/* Product Info - 5 columns */}
                        <div className="md:col-span-5 flex items-start space-x-3">
                          <div className="w-12 h-12 bg-indigo-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Package size={20} className="text-indigo-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium capitalize text-white truncate mb-1">
                              {item.product_name}
                            </h3>
                            <div className="text-xs space-y-2">
                              <div className="flex flex-wrap items-center gap-1">
                                <span className="bg-blue-600/20 text-blue-300 px-2 py-0.5 rounded text-xs font-medium">
                                  {item.brand}
                                </span>
                                <span className="bg-purple-600/20 text-purple-300 px-2 py-0.5 rounded text-xs font-medium">
                                  {item.shop}
                                </span>
                                <span className="bg-green-600/20 text-green-300 px-2 py-0.5 rounded text-xs font-medium">
                                  {item.category}
                                </span>
                              </div>
                              
                              {/* Dimensions - More Prominent */}
                              {item.dimensions && item.dimensions !== 'N/A' && (
                                <div className="bg-orange-600/20 border border-orange-600/30 rounded-lg px-2 py-1">
                                  <div className="flex flex-col">
                                    <span className="text-orange-300 text-xs flex items-center">
                                      <span className="mr-1">📏</span> Dimensions
                                    </span>
                                    <span className="text-orange-200 font-medium text-xs mt-0.5">{item.dimensions}</span>
                                  </div>
                                </div>
                              )}
                              
                              <div className="flex items-center justify-between text-white/50">
                                <span>Stock: {item.maxStock} available</span>
                                {item.weight && item.weight !== 'N/A' && (
                                  <div className="flex items-center space-x-1">
                                    <span>⚖️</span>
                                    <span>{item.weight}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Unit Price - 2 columns */}
                        <div className="md:col-span-2">
                          <label className="text-xs text-white/60 block mb-1">Unit Price (₹) *</label>
                          <div className="relative">
                            <DollarSign size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" />
                            <input
                              type="text"
                              inputMode="decimal"
                              pattern="[0-9]*\.?[0-9]*"
                              className="w-full bg-white/10 border border-white/20 rounded-lg pl-8 pr-3 py-2 text-white placeholder-white/40 focus:border-green-400 focus:ring-2 focus:ring-green-400/20 transition-all"
                              placeholder="0.00"
                              value={unitPrices[item.id] || ''}
                              onChange={(e) => handleUnitPriceChange(item.id, e.target.value)}
                            />
                          </div>
                        </div>

                        {/* Quantity - 2 columns */}
                        <div className="md:col-span-2">
                          <label className="text-xs text-white/60 block mb-1">Quantity</label>
                          <div className="flex items-center space-x-1">
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
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Total & Actions - 3 columns */}
                        <div className="md:col-span-3 flex items-center justify-between">
                          <div className="text-right">
                            <div className="text-xs text-white/60">Item Total</div>
                            <div className="text-xl font-bold text-green-400">
                              ₹{(totals.itemTotals[item.id] || 0).toLocaleString('en-IN')}
                            </div>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="w-10 h-10 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 flex items-center justify-center transition-all ml-4"
                            title="Remove from cart"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          // CHECKOUT DETAILS VIEW
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Information */}
                <div className="bg-white/5 rounded-xl p-6 border border-white/10 h-fit">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <User size={18} className="mr-2 text-purple-400" />
                    Customer Information
                  </h3>

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
                        value={checkoutForm.customer_name}
                        onChange={(e) => setCheckoutForm({...checkoutForm, customer_name: e.target.value})}
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
                        value={checkoutForm.customer_phone}
                        onChange={(e) => setCheckoutForm({...checkoutForm, customer_phone: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="flex items-center space-x-2 text-sm text-white/70 mb-2">
                        <Calendar size={14} />
                        <span>Sale Date & Time</span>
                      </label>
                      <input
                        type="datetime-local"
                        className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                        value={checkoutForm.sale_date}
                        onChange={(e) => setCheckoutForm({...checkoutForm, sale_date: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="bg-gradient-to-br from-green-600/10 to-emerald-600/10 rounded-xl p-6 border border-green-600/20 h-fit">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <CreditCard size={18} className="mr-2 text-green-400" />
                    Payment Details
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center space-x-2 text-sm text-white/70 mb-2">
                        <CreditCard size={14} />
                        <span>Payment Method</span>
                      </label>
                      <select
                        className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white focus:border-green-400 focus:ring-2 focus:ring-green-400/20 transition-all"
                        value={checkoutForm.payment_method}
                        onChange={(e) => setCheckoutForm({...checkoutForm, payment_method: e.target.value})}
                      >
                        <option value="cash" className="bg-[#0f1535]">Cash</option>
                        <option value="card" className="bg-[#0f1535]">Card</option>
                        <option value="upi" className="bg-[#0f1535]">UPI</option>
                        <option value="bank_transfer" className="bg-[#0f1535]">Bank Transfer</option>
                        <option value="credit" className="bg-[#0f1535]">Credit</option>
                      </select>
                    </div>

                    {/* Grand Total Display */}
                    <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                      <div className="text-sm text-white/60 mb-2">Grand Total (for reference)</div>
                      <div className="text-2xl font-bold text-white">
                        ₹{totals.total.toLocaleString('en-IN')}
                      </div>
                    </div>

                    {/* Customer Paid Input */}
                    <div>
                      <label className="flex items-center space-x-2 text-sm text-white/70 mb-2">
                        <DollarSign size={14} />
                        <span>Amount Customer Paid</span>
                      </label>
                      <div className="relative">
                        <DollarSign size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max={totals.total}
                          className="w-full bg-white/10 border border-white/20 rounded-lg pl-8 pr-3 py-3 text-white placeholder-white/40 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 transition-all text-lg font-semibold"
                          placeholder="0.00"
                          value={checkoutForm.customer_paid || ''}
                          onChange={(e) => setCheckoutForm({...checkoutForm, customer_paid: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                      <div className="text-xs text-white/50 mt-1">
                        This amount will be recorded in the sale
                      </div>
                    </div>

                    {/* Discount Display */}
                    {checkoutForm.customer_paid < totals.total && checkoutForm.customer_paid > 0 && (
                      <div className="p-3 rounded-lg border bg-yellow-600/10 border-yellow-600/20 text-yellow-300">
                        <div className="text-sm">
                          Discount Given
                        </div>
                        <div className="font-bold">
                          ₹{(totals.total - checkoutForm.customer_paid).toLocaleString('en-IN')}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-white/10 p-6">
            {currentModal === 'cart' ? (
              // Cart Footer
              <div className="flex gap-4">
                <button
                  onClick={toggleCart}
                  className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10"
                >
                  Continue Shopping
                </button>
                <button
                  onClick={proceedToCheckout}
                  className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white transition-all font-medium shadow-lg flex items-center justify-center space-x-2"
                  disabled={totals.total <= 0}
                >
                  <ArrowRight size={18} />
                  <span>Proceed to Checkout - ₹{totals.total.toLocaleString('en-IN')}</span>
                </button>
              </div>
            ) : (
              // Checkout Footer
              <div className="flex gap-4">
                <button
                  onClick={goBackToCart}
                  className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10 flex items-center space-x-2"
                >
                  <ArrowRight size={18} className="rotate-180" />
                  <span>Back to Cart</span>
                </button>
                <button
                  onClick={handleFinalCheckout}
                  className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white transition-all font-medium shadow-lg flex items-center justify-center space-x-2"
                  disabled={checkoutForm.customer_paid <= 0}
                >
                  <ShoppingCart size={18} />
                  <span>Complete Sale - ₹{checkoutForm.customer_paid.toLocaleString('en-IN')}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
