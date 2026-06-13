'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Product, Category, Table, Customer, Floor } from '@/lib/types';
import { formatCurrency, calculateTaxAmount } from '@/lib/utils';

interface CartItem {
  product: Product;
  quantity: number;
}

export default function WaiterTerminalPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Selection states
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);

  // UI state overlays
  const [showTableModal, setShowTableModal] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Load Initial Data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Get active session
      const sessRes = await fetch('/api/sessions');
      const sessData = await sessRes.json();
      if (sessData.active) {
        setActiveSessionId(sessData.session.id);
      }

      // 1. Fetch categories
      const catsRes = await fetch('/api/categories');
      const cats = await catsRes.json();
      setCategories(cats || []);
      if (cats && cats.length > 0) setActiveCategory(cats[0].id);

      // 2. Fetch products
      const prodsRes = await fetch('/api/products');
      const prods = await prodsRes.json();
      setProducts(prods || []);

      // 3. Fetch floors & tables
      const tablesRes = await fetch('/api/tables');
      const tablesData = await tablesRes.json();
      setFloors(tablesData.floors || []);
      setTables(tablesData.tables || []);

    } catch (err) {
      console.error('API connection error. Using mock fallback.', err);
    }
  };

  // Cart operations
  const addToCart = (product: Product) => {
    if (!selectedTable) {
      setShowTableModal(true);
      return;
    }
    const existing = cart.find(item => item.product.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean) as CartItem[]);
  };

  // Totals calculations
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const taxTotal = cart.reduce((sum, item) => sum + calculateTaxAmount(item.product.price * item.quantity, item.product.tax), 0);
  const total = subtotal + taxTotal;

  // Send to Kitchen
  const handleSendToKitchen = async () => {
    if (cart.length === 0) return;
    setActionLoading(true);

    try {
      if (!activeSessionId) {
        throw new Error('No active store session. Please wait for the manager/cashier to open the store.');
      }
      if (!selectedTable) {
        throw new Error('Please select a table first.');
      }

      const orderNum = 'TBL-' + selectedTable.table_number + '-' + Math.floor(Math.random() * 9000 + 1000);

      // We create an unpaid order and send the items to the kitchen display
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: activeSessionId,
          table_id: selectedTable.id,
          customer_id: null,
          order_number: orderNum,
          subtotal,
          tax: taxTotal,
          discount_amount: 0,
          total,
          status: 'pending', // Unpaid, just placed by waiter
          payment_method: null,
          items: cart,
        }),
      });

      const orderResult = await res.json();
      if (orderResult.error) throw new Error(orderResult.error);

      alert('Order successfully sent to Kitchen!');
      setCart([]);
      setSelectedTable(null);
      setShowTableModal(true);

    } catch (err: any) {
      alert(`Failed to send order: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter products
  const filteredProducts = products.filter(prod => {
    const matchesCategory = activeCategory ? prod.category_id === activeCategory : true;
    const matchesSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col flex-1 h-screen bg-zinc-950 font-sans select-none">
      {/* 1. Header Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-6">
          <span className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-blue-500 rounded-full"></span> Waiter Terminal
          </span>
          <button
            onClick={() => setShowTableModal(true)}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer border ${selectedTable
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400'
              }`}
          >
            {selectedTable ? `Table: ${selectedTable.table_number}` : 'Select Table'}
          </button>
        </div>

        {/* Search Input */}
        <div className="flex-1 max-w-md mx-6">
          <input
            type="text"
            placeholder="Search products by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
          />
        </div>

        {/* User Action links */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/waiter')}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 cursor-pointer"
          >
            Leave Terminal
          </button>
        </div>
      </nav>

      {/* 2. Main content container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Section: Categories tabs & Products Grid */}
        <div className="flex flex-1 flex-col p-6 overflow-hidden">
          {/* Categories bar */}
          <div className="flex gap-2 pb-4 overflow-x-auto select-none no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${activeCategory === cat.id
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-zinc-900 text-zinc-400 border border-zinc-800/80 hover:bg-zinc-850'
                  }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pr-1">
            {filteredProducts.map((prod) => (
              <div
                key={prod.id}
                onClick={() => addToCart(prod)}
                className="flex flex-col justify-between p-4 rounded-xl bg-zinc-900 border border-zinc-850 hover:border-blue-500/50 hover:bg-zinc-850/30 transition-all cursor-pointer group"
              >
                <div>
                  <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">{prod.name}</h3>
                  <p className="text-zinc-500 text-xs mt-1 line-clamp-2">{prod.description || 'No description available.'}</p>
                </div>
                <div className="flex items-end justify-between mt-4">
                  <span className="text-xs text-zinc-400 font-medium">{prod.unit_of_measure}</span>
                  <span className="font-bold text-blue-400">{formatCurrency(Number(prod.price))}</span>
                </div>
              </div>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center text-zinc-500 py-20">
                <p className="text-sm">No products found in this category.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Sidebar Cart */}
        <div className="w-[400px] bg-zinc-900 border-l border-zinc-850 flex flex-col h-full">
          {/* Cart Header */}
          <div className="p-4 border-b border-zinc-850 flex items-center justify-between">
            <span className="font-bold text-white text-lg">Table Order</span>
            <span className="text-xs px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-zinc-400">
              {cart.reduce((sum, item) => sum + item.quantity, 0)} items
            </span>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.map((item) => (
              <div key={item.product.id} className="p-3 rounded-lg bg-zinc-950 border border-zinc-850 flex items-center justify-between">
                <div className="flex-1 min-w-0 pr-2">
                  <h4 className="text-sm font-semibold text-white truncate">{item.product.name}</h4>
                  <p className="text-xs text-zinc-500 mt-0.5">{formatCurrency(Number(item.product.price))}</p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateQuantity(item.product.id, -1)}
                    className="w-7 h-7 flex items-center justify-center rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 text-sm cursor-pointer"
                  >
                    -
                  </button>
                  <span className="text-sm font-bold text-white w-5 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product.id, 1)}
                    className="w-7 h-7 flex items-center justify-center rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 text-sm cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}

            {cart.length === 0 && (
              <div className="flex flex-col items-center justify-center text-zinc-600 h-full">
                <p className="text-sm">Order is empty.</p>
                <p className="text-xs mt-1">Select a table and click products to add.</p>
              </div>
            )}
          </div>

          {/* Cart Footer / Totals & Actions */}
          <div className="p-4 bg-zinc-950 border-t border-zinc-850 space-y-4">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-zinc-500">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-white font-bold text-base pt-1.5 border-t border-zinc-900">
                <span>Estimated Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Main Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleSendToKitchen}
                disabled={cart.length === 0 || actionLoading}
                className="w-full py-4 text-center text-sm font-bold rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-blue-500/20"
              >
                {actionLoading ? 'Sending...' : 'Send Order to Kitchen'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== MODALS ==================== */}

      {/* 1. Table Selector Floor Plan Modal */}
      {showTableModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <h2 className="text-xl font-bold text-white mb-4">Select Floor Table</h2>
            <div className="flex-1 overflow-y-auto space-y-6">
              {floors.map(floor => (
                <div key={floor.id} className="space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">{floor.name}</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {tables.filter(t => t.floor_id === floor.id).map(table => (
                      <div
                        key={table.id}
                        onClick={() => {
                          setSelectedTable(table);
                          setShowTableModal(false);
                        }}
                        className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${selectedTable?.id === table.id
                            ? 'bg-blue-500 border-blue-500 text-white font-bold'
                            : 'bg-zinc-950 border-zinc-850 text-zinc-300 hover:border-zinc-750'
                          }`}
                      >
                        <span className="text-base font-semibold">{table.table_number}</span>
                        <span className={`text-[10px] mt-0.5 ${selectedTable?.id === table.id ? 'text-white/70' : 'text-zinc-500'}`}>
                          {table.seats} Seats
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {floors.length === 0 && (
                <div className="py-8 text-center text-zinc-500">
                  <p className="text-sm">No floors or tables configured.</p>
                  <p className="text-xs mt-1">Please ask a manager to set up floors and tables.</p>
                  <button
                    onClick={() => {
                      // fallback for immediate demo without db configured
                      setSelectedTable({
                        id: 'demo-t1',
                        floor_id: 'demo-f1',
                        table_number: 'Table 1',
                        seats: 4,
                        is_active: true,
                        created_at: '',
                      });
                      setShowTableModal(false);
                    }}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white font-semibold rounded text-xs"
                  >
                    Use Demo Table
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
