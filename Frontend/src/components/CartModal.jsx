import React, { useState, useMemo, useEffect } from 'react';
import { X, Plus, Minus, Trash2, ShoppingCart, Package, DollarSign, User, Phone, Calendar, CreditCard, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { toast } from 'react-toastify';
import axios from '../utils/axiosConfig';

// Helper function to get current local datetime in the format required by datetime-local input
const getCurrentLocalDateTime = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

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
    sale_date: getCurrentLocalDateTime(), // Current date-time in local format
    customer_paid: 0, // Amount actually paid by customer
    rest_amount: '', // Remaining amount to be paid later
    discount_amount: 0 // Discount given by seller
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

  const handlePhoneChange = (value) => {
    // Only allow numeric values for phone number
    const numericValue = value.replace(/[^0-9]/g, '');
    
    // Limit to reasonable phone number length (e.g., 15 digits)
    const limitedValue = numericValue.slice(0, 15);
    
    setCheckoutForm({...checkoutForm, customer_phone: limitedValue});
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

    const goToCheckout = () => {
    // Check if all products have unit prices
    const missingPrices = items.some(item => !unitPrices[item.id] || parseFloat(unitPrices[item.id]) <= 0);
    if (missingPrices) {
      toast.error('Please enter unit prices for all products', {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }

    setCurrentModal('checkout');
    
    // Always recalculate payment amounts based on current cart total
    // This ensures that if user went back to cart and changed values, the payment amounts are updated
    setCheckoutForm(prev => ({
      ...prev,
      sale_date: getCurrentLocalDateTime(), // Set to current date and time in local timezone
      customer_paid: totals.total, // Reset to full amount
      rest_amount: 0, // Reset rest amount 
      discount_amount: 0 // Reset discount amount
    }));
    
    // Set the baseline total when entering checkout
    setLastKnownTotal(totals.total);
  };

  // Keep track of the last known total when entering checkout
  const [lastKnownTotal, setLastKnownTotal] = useState(0);

  // Watch for changes in cart total while in checkout mode
  // This helps detect if user made changes after entering checkout
  useEffect(() => {
    if (currentModal === 'checkout' && items.length > 0) {
      const currentTotal = totals.total;
      
      // Only update if this is a significant change from the last known total
      // and not just user editing the form fields
      if (lastKnownTotal > 0 && Math.abs(currentTotal - lastKnownTotal) > 1) {
        toast.info('Cart total changed! Payment amounts have been recalculated.', {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        
        // Auto-update the payment amounts
        setCheckoutForm(prev => ({
          ...prev,
          customer_paid: currentTotal, // Set to new total
          rest_amount: 0, // Reset rest amount 
          discount_amount: 0 // Reset discount amount
        }));
      }
      
      // Update the last known total
      setLastKnownTotal(currentTotal);
    }
  }, [currentModal, totals.total, items.length, lastKnownTotal]);

  const handleFinalCheckout = async () => {
    // Validate form - customer name and phone are now optional
    if (checkoutForm.customer_paid <= 0) {
      toast.error('Customer paid amount must be greater than 0', {
        position: "top-center",
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
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }

    // Calculate amounts with new discount logic
    const paidAmount = checkoutForm.customer_paid;
    const grandTotal = totals.total;
    const discountAmount = parseFloat(checkoutForm.discount_amount) || 0;
    
    // Validate discount amount
    if (discountAmount > (grandTotal - paidAmount)) {
      toast.error('Discount amount cannot be greater than the remaining balance', {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }

    let restAmount;
    
    if (paidAmount === grandTotal) {
      // Full payment: no rest amount, no discount
      restAmount = 0;
    } else {
      // Partial payment: calculate rest amount after discount
      restAmount = Math.max(0, grandTotal - paidAmount - discountAmount);
      
      // Validate that rest amount is acceptable (either 0 or they've provided sufficient payment + discount)
      if (paidAmount + discountAmount + restAmount !== grandTotal) {
        // This shouldn't happen with our calculation, but just in case
        toast.error('Payment calculation error. Please check your amounts.', {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        return;
      }

      // If rest amount is 0, that means discount covers the remaining balance - which is valid
      // If rest amount > 0, customer will pay later - also valid
    }

    // Prepare the payload for the API
    const salePayload = {
      items: items.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        unit_price: parseFloat(unitPrices[item.id]) || 0,
        total: totals.itemTotals[item.id],
        shop_id: item.shop_id
      })),
      customer: {
        customer_name: checkoutForm.customer_name.trim() || null,
        customer_phone: checkoutForm.customer_phone.trim() || null,
        payment_method: checkoutForm.payment_method,
        sale_date: checkoutForm.sale_date,
        customer_paid: checkoutForm.customer_paid
      },
      totals: {
        ...totals,
        customer_paid: paidAmount,
        discount_amount: discountAmount > 0 ? discountAmount : null,
        rest_amount: restAmount > 0 ? restAmount : null
      }
    };

    console.log('Final Checkout Data:', salePayload);

    try {
      // Show loading toast
      const loadingToast = toast.loading('Processing sale...', {
        position: "top-center"
      });

      // Get the auth token from localStorage
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast.dismiss(loadingToast);
        toast.error('Authentication required. Please login again.', {
          position: "top-center",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        return;
      }

      // Make API call to create sale
      const response = await axios.post(`/api/sales`, salePayload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const result = response.data;

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      if (response.status === 201 && result.success) {
        // Success
        toast.success(`Sale completed successfully! ${result.data.transaction_summary.total_items} items sold for ₹${result.data.transaction_summary.customer_paid.toLocaleString('en-IN')}`, {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });

        console.log('Sale Success Response:', result);

        // Dispatch custom event to refresh sales data
        window.dispatchEvent(new CustomEvent('saleCompleted', { 
          detail: { 
            saleData: result.data,
            timestamp: new Date().toISOString()
          } 
        }));

        // Clear the cart after successful sale
        clearCart();
        
        // Close the modal
        toggleCart();

        // Reset checkout form
        setCheckoutForm({
          customer_name: '',
          customer_phone: '',
          payment_method: 'cash',
          sale_date: getCurrentLocalDateTime(),
          customer_paid: 0,
          rest_amount: '',
          discount_amount: 0
        });

        // Reset unit prices
        setUnitPrices({});

        // Reset to cart view for next transaction
        setCurrentModal('cart');

      } else {
        // Error from API
        console.error('Sale API Error:', result);
        toast.error(result.message || 'Failed to complete sale. Please try again.', {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }

    } catch (error) {
      console.error('Sale Request Error:', error);
      toast.error('Network error. Please check your connection and try again.', {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  const goBackToCart = () => {
    setCurrentModal('cart');
    // Note: Payment amounts will be recalculated when user goes back to checkout
    // This ensures fresh calculations based on any cart changes
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
                  {checkoutForm.customer_paid !== totals.total && (
                    <div className="space-y-1">
                      <div className="text-xs text-orange-400">
                        Rest: ₹{(checkoutForm.rest_amount || (totals.total - checkoutForm.customer_paid)).toLocaleString('en-IN')}
                      </div>
                      {(() => {
                        const restAmt = parseFloat(checkoutForm.rest_amount) || (totals.total - checkoutForm.customer_paid);
                        const discountAmt = totals.total - checkoutForm.customer_paid - restAmt;
                        return discountAmt > 0 ? (
                          <div className="text-xs text-yellow-400">
                            Discount: ₹{discountAmt.toLocaleString('en-IN')}
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}
                  {checkoutForm.customer_paid === totals.total && (
                    <div className="text-xs text-green-400">
                      Full Payment • No Rest • No Discount
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
                      {/* First Line: Product Info in Flex Layout */}
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-indigo-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Package size={20} className="text-indigo-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium capitalize text-white truncate mb-2">
                            {item.product_name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="bg-blue-600/20 text-blue-300 px-2 py-1 rounded-md text-xs font-medium">
                              Brand: {item.brand}
                            </span>
                            <span className="bg-purple-600/20 text-purple-300 px-2 py-1 rounded-md text-xs font-medium">
                              Shop: {item.shop}
                            </span>
                            <span className="bg-green-600/20 text-green-300 px-2 py-1 rounded-md text-xs font-medium">
                              Category: {item.category}
                            </span>
                            {item.dimensions && item.dimensions !== 'N/A' && (
                              <span className="bg-orange-600/20 text-orange-300 px-2 py-1 rounded-md text-xs font-medium">
                                📏 {item.dimensions}
                              </span>
                            )}
                            {item.weight && item.weight !== 'N/A' && (
                              <span className="bg-red-600/20 text-red-300 px-2 py-1 rounded-md text-xs font-medium">
                                ⚖️ {item.weight}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Second Line: Stock, Unit Price, Quantity, Item Total, Delete Icon */}
                      <div className="flex items-center justify-between space-x-4 bg-white/5 rounded-lg p-3 border border-white/5">
                        {/* Stock Info */}
                        <div className="flex-shrink-0">
                          <div className="text-xs text-white/60 mb-1">Stock</div>
                          <div className={`text-sm font-medium px-2 py-1 rounded ${
                            item.maxStock > 10 
                              ? 'bg-green-600/20 text-green-300' 
                              : item.maxStock > 5 
                                ? 'bg-yellow-600/20 text-yellow-300' 
                                : 'bg-red-600/20 text-red-300'
                          }`}>
                            {item.maxStock} available
                          </div>
                        </div>

                        {/* Unit Price */}
                        <div className="flex-1 min-w-0 max-w-[140px]">
                          <div className={`text-xs mb-1 ${
                            !unitPrices[item.id] || parseFloat(unitPrices[item.id]) <= 0
                              ? 'text-red-400'
                              : 'text-white/60'
                          }`}>
                            Unit Price (₹) *
                            {(!unitPrices[item.id] || parseFloat(unitPrices[item.id]) <= 0) && (
                              <span className="ml-1 text-red-400">⚠️</span>
                            )}
                          </div>
                          <div className="relative">
                            <DollarSign size={12} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white/40" />
                            <input
                              type="text"
                              inputMode="decimal"
                              pattern="[0-9]*\.?[0-9]*"
                              className={`w-full bg-white/10 rounded-md pl-6 pr-2 py-1.5 text-sm text-white placeholder-white/40 transition-all ${
                                !unitPrices[item.id] || parseFloat(unitPrices[item.id]) <= 0
                                  ? 'border-2 border-red-500 focus:border-red-400 focus:ring-1 focus:ring-red-400/20'
                                  : 'border border-white/20 focus:border-green-400 focus:ring-1 focus:ring-green-400/20'
                              }`}
                              placeholder="0.00"
                              value={unitPrices[item.id] || ''}
                              onChange={(e) => handleUnitPriceChange(item.id, e.target.value)}
                            />
                          </div>
                          {(!unitPrices[item.id] || parseFloat(unitPrices[item.id]) <= 0) && (
                            <div className="text-xs text-red-400 mt-1">Required</div>
                          )}
                        </div>

                        {/* Quantity */}
                        <div className="flex-shrink-0">
                          <div className="text-xs text-white/60 mb-1">Quantity</div>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              className="w-7 h-7 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                              disabled={item.quantity <= 1}
                            >
                              <Minus size={12} />
                            </button>
                            
                            <div className="w-10 h-7 bg-white/10 rounded-md flex items-center justify-center">
                              <span className="text-sm font-medium">{item.quantity}</span>
                            </div>
                            
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${
                                item.quantity >= item.maxStock
                                  ? 'bg-white/5 text-white/30 cursor-not-allowed'
                                  : 'bg-white/10 hover:bg-white/20'
                              }`}
                              disabled={item.quantity >= item.maxStock}
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>

                        {/* Item Total */}
                        <div className="flex-shrink-0 text-right">
                          <div className="text-xs text-white/60 mb-1">Item Total</div>
                          <div className="text-lg font-bold text-green-400">
                            ₹{(totals.itemTotals[item.id] || 0).toLocaleString('en-IN')}
                          </div>
                        </div>

                        {/* Delete Icon */}
                        <div className="flex-shrink-0">
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="w-8 h-8 rounded-md bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 flex items-center justify-center transition-all"
                            title="Remove from cart"
                          >
                            <Trash2 size={14} />
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
            <div className="max-w-4xl mx-auto">
              {/* Checkout Details Header */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Checkout Details</h2>
                <p className="text-white/60">Complete your sale with customer and payment information</p>
              </div>

              <div className="space-y-6">
                {/* Customer Information Section */}
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h3 className="text-base font-semibold mb-4 flex items-center">
                    <User size={16} className="mr-2 text-purple-400" />
                    Customer Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="flex items-center space-x-1 text-xs text-white/70 mb-1">
                        <User size={12} />
                        <span>Customer Name</span>
                      </label>
                      <input
                        type="text"
                        className="w-full bg-white/10 border border-white/20 rounded-md p-2 text-sm text-white placeholder-white/40 focus:border-purple-400 focus:ring-1 focus:ring-purple-400/20 transition-all"
                        placeholder="Enter customer name"
                        value={checkoutForm.customer_name}
                        onChange={(e) => setCheckoutForm({...checkoutForm, customer_name: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="flex items-center space-x-1 text-xs text-white/70 mb-1">
                        <Phone size={12} />
                        <span>Customer Phone</span>
                      </label>
                      <input
                        type="tel"
                        className="w-full bg-white/10 border border-white/20 rounded-md p-2 text-sm text-white placeholder-white/40 focus:border-purple-400 focus:ring-1 focus:ring-purple-400/20 transition-all"
                        placeholder="Enter phone number (numbers only)"
                        value={checkoutForm.customer_phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
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
                        className="w-full bg-white/10 border border-white/20 rounded-md p-2 text-sm text-white focus:border-purple-400 focus:ring-1 focus:ring-purple-400/20 transition-all"
                        value={checkoutForm.sale_date}
                        onChange={(e) => setCheckoutForm({...checkoutForm, sale_date: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Details Section */}
                <div className="bg-gradient-to-br from-green-600/10 to-emerald-600/10 rounded-lg p-4 border border-green-600/20">
                  <h3 className="text-base font-semibold mb-4 flex items-center">
                    <CreditCard size={16} className="mr-2 text-green-400" />
                    Payment Details
                  </h3>

                  <div className="flex flex-col lg:flex-row gap-4">
                    {/* Left Column: Payment Method & Grand Total */}
                    <div className="flex-1 space-y-3">
                      <div>
                        <label className="flex items-center space-x-1 text-xs text-white/70 mb-1">
                          <CreditCard size={12} />
                          <span>Payment Method</span>
                        </label>
                        <select
                          className="w-full bg-white/10 border border-white/20 rounded-md p-2 text-sm text-white focus:border-green-400 focus:ring-1 focus:ring-green-400/20 transition-all"
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
                      <div className="bg-white/10 rounded-md p-3 border border-white/20">
                        <div className="text-xs text-white/60 mb-1">Grand Total (for reference)</div>
                        <div className="text-xl font-bold text-white">
                          ₹{totals.total.toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Payment Amounts */}
                    <div className="flex-1 space-y-3">

                    {/* Customer Paid Input */}
                    <div>
                      <label className="flex items-center space-x-1 text-xs text-white/70 mb-1">
                        <DollarSign size={12} />
                        <span>Amount Customer Paid</span>
                      </label>
                      <div className="relative">
                        <DollarSign size={12} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white/40" />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max={totals.total}
                          className="w-full bg-white/10 border border-white/20 rounded-md pl-6 pr-2 py-2 text-sm text-white placeholder-white/40 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/20 transition-all font-medium"
                          placeholder="0.00"
                          value={checkoutForm.customer_paid || ''}
                          onChange={(e) => setCheckoutForm({...checkoutForm, customer_paid: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                      <div className="text-xs text-white/50 mt-1">
                        This amount will be recorded in the sale
                      </div>
                    </div>

                    {/* Rest Amount Field - Always show when customer paid is different from total */}
                    <div>
                      <label className="flex items-center space-x-1 text-xs text-white/70 mb-1">
                        <DollarSign size={12} />
                        <span>Rest Amount {checkoutForm.customer_paid < totals.total && (!checkoutForm.discount_amount || checkoutForm.discount_amount === 0) ? '*' : ''}</span>
                      </label>
                      <div className="relative">
                        <DollarSign size={12} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white/40" />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max={totals.total - checkoutForm.customer_paid - (parseFloat(checkoutForm.discount_amount) || 0)}
                          className={`w-full bg-white/10 rounded-md pl-6 pr-2 py-2 text-sm text-white placeholder-white/40 transition-all ${
                            checkoutForm.customer_paid === totals.total 
                              ? 'border border-white/20 cursor-not-allowed opacity-60'
                              : 'border border-white/20 focus:border-orange-400 focus:ring-1 focus:ring-orange-400/20'
                          }`}
                          placeholder="0.00"
                          value={checkoutForm.customer_paid === totals.total ? 0 : (checkoutForm.rest_amount || Math.max(0, totals.total - checkoutForm.customer_paid - (parseFloat(checkoutForm.discount_amount) || 0)))}
                          onChange={(e) => {
                            const newRestAmount = parseFloat(e.target.value) || 0;
                            setCheckoutForm({...checkoutForm, rest_amount: newRestAmount});
                          }}
                          disabled={checkoutForm.customer_paid === totals.total}
                        />
                      </div>
                      <div className="text-xs text-white/50 mt-1">
                        {checkoutForm.customer_paid === totals.total 
                          ? 'Full payment received - no rest amount needed'
                          : 'Amount to be paid later (auto-calculated after discount)'
                        }
                      </div>
                    </div>

                    {/* Discount Amount Field - Show when customer paid is less than total */}
                    {checkoutForm.customer_paid < totals.total && (
                      <div>
                        <label className="flex items-center space-x-1 text-xs text-white/70 mb-1">
                          <DollarSign size={12} />
                          <span>Discount Amount (Optional)</span>
                        </label>
                        <div className="relative">
                          <DollarSign size={12} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white/40" />
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max={totals.total - checkoutForm.customer_paid}
                            className="w-full bg-white/10 border border-white/20 rounded-md pl-6 pr-2 py-2 text-sm text-white placeholder-white/40 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/20 transition-all"
                            placeholder="0.00"
                            value={checkoutForm.discount_amount || ''}
                            onChange={(e) => {
                              const newDiscountAmount = parseFloat(e.target.value) || 0;
                              const maxDiscount = totals.total - checkoutForm.customer_paid;
                              const finalDiscount = Math.min(newDiscountAmount, maxDiscount);
                              const newRestAmount = Math.max(0, totals.total - checkoutForm.customer_paid - finalDiscount);
                              setCheckoutForm({
                                ...checkoutForm, 
                                discount_amount: finalDiscount,
                                rest_amount: newRestAmount
                              });
                            }}
                          />
                        </div>
                        <div className="text-xs text-white/50 mt-1">
                          Seller discount - reduces rest amount automatically
                        </div>
                      </div>
                    )}

                    {/* Payment Summary Display */}
                    <div className="space-y-2">
                      {/* Payment Breakdown Summary */}
                      {checkoutForm.customer_paid !== totals.total && (
                        <div className="bg-white/5 rounded-md p-2 border border-white/10">
                          <div className="text-xs text-white/60 mb-2">Payment Breakdown:</div>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span>Grand Total:</span>
                              <span className="font-medium">₹{totals.total.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Customer Paid:</span>
                              <span className="font-medium text-green-300">₹{checkoutForm.customer_paid.toLocaleString('en-IN')}</span>
                            </div>
                            {checkoutForm.discount_amount > 0 && (
                              <div className="flex justify-between">
                                <span>Discount Given:</span>
                                <span className="font-medium text-yellow-300">₹{parseFloat(checkoutForm.discount_amount).toLocaleString('en-IN')}</span>
                              </div>
                            )}
                            <div className="flex justify-between border-t border-white/10 pt-1">
                              <span>Rest Amount:</span>
                              <span className="font-medium text-orange-300">
                                ₹{Math.max(0, totals.total - checkoutForm.customer_paid - (parseFloat(checkoutForm.discount_amount) || 0)).toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Discount Display - when discount is given */}
                      {checkoutForm.discount_amount > 0 && (
                        <div className="p-2 rounded-md border bg-yellow-600/10 border-yellow-600/20 text-yellow-300">
                          <div className="text-xs">✨ Seller Discount Applied</div>
                          <div className="font-bold text-sm">
                            ₹{parseFloat(checkoutForm.discount_amount).toLocaleString('en-IN')} off
                          </div>
                        </div>
                      )}

                      {/* Rest Amount Display */}
                      {checkoutForm.customer_paid !== totals.total && Math.max(0, totals.total - checkoutForm.customer_paid - (parseFloat(checkoutForm.discount_amount) || 0)) > 0 && (
                        <div className="p-2 rounded-md border bg-orange-600/10 border-orange-600/20 text-orange-300">
                          <div className="text-xs">Remaining Amount (To be paid later)</div>
                          <div className="font-bold text-sm">
                            ₹{Math.max(0, totals.total - checkoutForm.customer_paid - (parseFloat(checkoutForm.discount_amount) || 0)).toLocaleString('en-IN')}
                          </div>
                        </div>
                      )}

                      {/* Full Payment Display */}
                      {checkoutForm.customer_paid === totals.total && (
                        <div className="p-2 rounded-md border bg-green-600/10 border-green-600/20 text-green-300">
                          <div className="text-xs">Payment Status</div>
                          <div className="font-bold text-sm">Full Payment Received</div>
                          <div className="text-xs mt-1">No rest amount • No discount</div>
                        </div>
                      )}

                      {/* Zero Rest Amount Display (when discount covers remaining amount) */}
                      {checkoutForm.customer_paid < totals.total && Math.max(0, totals.total - checkoutForm.customer_paid - (parseFloat(checkoutForm.discount_amount) || 0)) === 0 && (
                        <div className="p-2 rounded-md border bg-green-600/10 border-green-600/20 text-green-300">
                          <div className="text-xs">🎉 Transaction Complete</div>
                          <div className="font-bold text-sm">No remaining amount</div>
                          <div className="text-xs mt-1">Discount covers the rest</div>
                        </div>
                      )}
                    </div>
                    </div>
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
                  onClick={goToCheckout}
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
