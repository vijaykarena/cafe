'use client';

import React, { useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import { ShoppingBag, Coffee, Pizza, Wine, Sparkles, CheckCircle2 } from 'lucide-react';

export default function WaiterDashboard() {
  const [selectedTable, setSelectedTable] = useState<string>('T-1');
  const [cart, setCart] = useState<{ id: string; name: string; price: number; qty: number }[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Mock Menu items
  const menuItems = [
    { id: '1', name: 'Caramel Macchiato', price: 4.50, category: 'Coffee' },
    { id: '2', name: 'Iced Americano', price: 3.50, category: 'Coffee' },
    { id: '3', name: 'Choco Lava Cake', price: 5.00, category: 'Dessert' },
    { id: '4', name: 'Blueberry Muffin', price: 3.80, category: 'Dessert' },
    { id: '5', name: 'Spicy Paneer Pizza', price: 8.50, category: 'Snacks' },
    { id: '6', name: 'Cheese Garlic Bread', price: 4.20, category: 'Snacks' },
  ];

  // Mock Tables
  const tables = [
    { number: 'T-1', seats: 4, status: 'occupied' },
    { number: 'T-2', seats: 2, status: 'empty' },
    { number: 'T-3', seats: 6, status: 'occupied' },
    { number: 'T-4', seats: 4, status: 'empty' },
    { number: 'T-5', seats: 2, status: 'occupied' },
    { number: 'T-6', seats: 4, status: 'empty' },
  ];

  const addToCart = (item: any) => {
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      setCart(cart.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { ...item, qty: 1 }]);
    }
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(c => c.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  const handleSendToKds = () => {
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      clearCart();
    }, 2000);
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 overflow-hidden">
      
      {/* Middle/Left Column: Floor map & Menu Selector */}
      <div className="lg:col-span-8 flex flex-col gap-6 overflow-y-auto pr-2">
        {/* Table Selector */}
        <div className="p-5 bg-zinc-900 border border-zinc-850 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider">Restaurant Floor Plan (Simulated)</h3>
            <span className="text-[10px] text-amber-500 font-semibold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
              Waiter Active Session
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {tables.map((tbl) => (
              <button
                key={tbl.number}
                onClick={() => setSelectedTable(tbl.number)}
                className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  selectedTable === tbl.number
                    ? 'bg-amber-500/10 border-amber-500 text-white shadow-lg shadow-amber-500/5'
                    : tbl.status === 'occupied'
                      ? 'bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                      : 'bg-zinc-950/40 border-zinc-900 text-zinc-550 hover:border-zinc-800'
                }`}
              >
                <span className="text-sm font-bold">{tbl.number}</span>
                <span className="text-[9px] opacity-75">{tbl.seats} Seats</span>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  tbl.status === 'occupied' ? 'bg-amber-500' : 'bg-zinc-700'
                }`}></span>
              </button>
            ))}
          </div>
        </div>

        {/* Menu items Selector */}
        <div className="p-5 bg-zinc-900 border border-zinc-850 rounded-2xl flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider">Menu catalog</h3>
            <span className="text-[10px] text-zinc-400">Tap to add items to cart</span>
          </div>

          {/* Quick Category Chips */}
          <div className="flex gap-2 pb-2">
            <span className="px-3 py-1 bg-zinc-950 text-amber-400 border border-amber-500/25 rounded-full text-xs font-semibold flex items-center gap-1.5">
              <Coffee className="w-3.5 h-3.5" /> All Items
            </span>
            <span className="px-3 py-1 bg-zinc-950/40 hover:bg-zinc-950 text-zinc-400 border border-zinc-900 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
              <Pizza className="w-3.5 h-3.5" /> Hot Snacks
            </span>
            <span className="px-3 py-1 bg-zinc-950/40 hover:bg-zinc-950 text-zinc-400 border border-zinc-900 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
              <Wine className="w-3.5 h-3.5" /> Beverages
            </span>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => addToCart(item)}
                className="p-4 bg-zinc-950/50 border border-zinc-900 hover:border-zinc-800 rounded-xl text-left flex flex-col justify-between h-28 cursor-pointer transition-all hover:bg-zinc-950"
              >
                <div>
                  <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">{item.category}</span>
                  <h4 className="font-semibold text-white text-sm mt-0.5">{item.name}</h4>
                </div>
                <div className="flex justify-between items-center w-full border-t border-zinc-900/60 pt-2">
                  <span className="text-amber-500 font-bold text-sm">{formatCurrency(item.price)}</span>
                  <span className="text-[9px] text-zinc-400 font-semibold px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded-full">
                    + Add
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Active Cart and Actions */}
      <div className="lg:col-span-4 flex flex-col h-full bg-zinc-900 border border-zinc-850 rounded-2xl p-5 overflow-hidden justify-between">
        
        {/* Cart Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-850">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-amber-500" />
              Table {selectedTable} Cart
            </h3>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-[10px] text-zinc-500 hover:text-zinc-350 font-bold cursor-pointer"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
            {cart.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/60 border border-zinc-900"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{item.name}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">{formatCurrency(item.price)} each</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/15">
                    {item.qty}x
                  </span>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-[10px] font-bold text-red-500 hover:text-red-400 cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}

            {cart.length === 0 && (
              <div className="py-12 text-center text-zinc-550 flex flex-col items-center justify-center gap-2">
                <p className="text-xs">No items added to this table's cart yet.</p>
                <p className="text-[10px] text-zinc-600 max-w-[200px]">Select a table, click on menu items to begin building order.</p>
              </div>
            )}
          </div>
        </div>

        {/* Cart Total and Action Buttons */}
        <div className="border-t border-zinc-850 pt-4 space-y-4">
          <div className="flex justify-between items-center text-sm">
            <span className="font-semibold text-zinc-400">Total Amount:</span>
            <span className="font-extrabold text-lg text-white">{formatCurrency(subtotal)}</span>
          </div>

          <div className="p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
            <p className="text-[10px] text-zinc-400 leading-normal">
              <span className="font-semibold text-white">Notice: </span> Waiters can only build carts and send drafts to KDS. Checkout and payments are restricted to Cashiers.
            </p>
          </div>

          <button
            onClick={handleSendToKds}
            disabled={cart.length === 0 || isSubmitted}
            className="w-full h-11 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-xs font-bold text-black flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            {isSubmitted ? (
              <>
                <CheckCircle2 className="w-4 h-4" /> Sent to Kitchen!
              </>
            ) : (
              'Send Draft Order to Kitchen'
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
