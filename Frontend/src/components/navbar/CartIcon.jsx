import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../../context/CartContext.jsx';

export default function CartIcon() {
  const { totalItems, toggleCart } = useCart();

  return (
    <button
      onClick={toggleCart}
      className="relative w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow transition-all duration-200 hover:scale-105"
      title="View Cart"
    >
      <ShoppingCart size={18} />
      {totalItems > 0 && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
          {totalItems > 99 ? '99+' : totalItems}
        </div>
      )}
    </button>
  );
}
