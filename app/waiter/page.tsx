'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { formatCurrency } from '@/lib/utils';
import { ShoppingBag, Coffee, Pizza, Wine, Sparkles, CheckCircle2, Plus, Minus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  price: number;
  tax: number;
  category_id: string;
  is_available: boolean;
}

interface Category {
  id: string;
  name: string;
}

interface Table {
  id: string;
  floor_id: string;
  table_number: string;
  seats: number;
  is_active: boolean;
}

interface OrderItem {
  product: Product;
  quantity: number;
}

export default function WaiterDashboard() {
  const [loading, setLoading] = useState(true);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Database loaded states
  const [dbTables, setDbTables] = useState<Table[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);

  // Selection states
  const [selectedGridNum, setSelectedGridNum] = useState<number>(1);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [cart, setCart] = useState<OrderItem[]>([]);
  
  // UI States
  const [actionLoading, setActionLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // 1–16 Grid numbers
  const gridTableNumbers = useMemo(() => Array.from({ length: 16 }, (_, i) => i + 1), []);

  // Fetch initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Fetch session
      const sessRes = await fetch('/api/sessions');
      const sessData = await sessRes.json();
      let sessionId = null;
      if (sessData.active) {
        setActiveSessionId(sessData.session.id);
        sessionId = sessData.session.id;
      } else {
        toast.warning('No active POS session. Please ask cashier/manager to open a shift.');
      }

      // Fetch categories
      const catsRes = await fetch('/api/categories');
      const cats = await catsRes.json();
      setCategories(cats || []);

      // Fetch products
      const prodsRes = await fetch('/api/products');
      const prods = await prodsRes.json();
      setProducts(prods || []);

      // Fetch tables
      const tablesRes = await fetch('/api/tables');
      const tablesData = await tablesRes.json();
      setDbTables(tablesData.tables || []);

      // Fetch active session orders to check table occupancy
      if (sessionId) {
        const ordersRes = await fetch(`/api/orders?session_id=${sessionId}`);
        const orders = await ordersRes.json();
        setActiveOrders(orders || []);
      }
    } catch (err) {
      console.error('Error loading waiter data:', err);
      toast.error('Failed to connect to database APIs.');
    } finally {
      setLoading(false);
    }
  };

  // Helper: Find DB Table mapping for grid number
  const dbTableForSelectedNum = useMemo(() => {
    const num = selectedGridNum;
    return dbTables.find(t => {
      const match = t.table_number.match(/\d+/);
      return match ? parseInt(match[0], 10) === num : t.table_number === String(num);
    });
  }, [dbTables, selectedGridNum]);

  // Helper: Find active draft order for a given DB Table
  const activeOrderForTable = useMemo(() => {
    if (!dbTableForSelectedNum) return null;
    return activeOrders.find(o => o.table_id === dbTableForSelectedNum.id && o.status === 'draft');
  }, [activeOrders, dbTableForSelectedNum]);

  // Sync cart when table selection changes
  useEffect(() => {
    if (activeOrderForTable) {
      // Map database order_items to cart structure
      const items = (activeOrderForTable.order_items || []).map((oi: any) => {
        // Resolve full product details
        const prod = products.find(p => p.id === oi.product_id) || {
          id: oi.product_id,
          name: oi.products?.name || 'Unknown Item',
          price: Number(oi.unit_price),
          tax: Number(oi.tax_rate),
          category_id: '',
          is_available: true
        };
        return {
          product: prod,
          quantity: oi.quantity
        };
      });
      setCart(items);
    } else {
      setCart([]);
    }
  }, [selectedGridNum, activeOrderForTable, products]);

  // Check if a specific grid number table has an active draft order
  const checkOccupied = (num: number) => {
    const table = dbTables.find(t => {
      const match = t.table_number.match(/\d+/);
      return match ? parseInt(match[0], 10) === num : t.table_number === String(num);
    });
    if (!table) return false;
    return activeOrders.some(o => o.table_id === table.id && o.status === 'draft');
  };

  // Cart operations
  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.product.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const updateQty = (productId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        const nextQty = item.quantity + delta;
        return nextQty > 0 ? { ...item, quantity: nextQty } : null;
      }
      return item;
    }).filter(Boolean) as OrderItem[]);
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const taxTotal = cart.reduce((sum, item) => sum + ((item.product.price * item.quantity * (item.product.tax || 0)) / 100), 0);
  const total = subtotal + taxTotal;

  // Book Order (Submit to Kitchen)
  const handleSendToKds = async () => {
    if (cart.length === 0) return;
    setActionLoading(true);

    try {
      if (!activeSessionId) {
        throw new Error('No active store shift session open.');
      }

      // If DB table is not mapped, we create a temporary table mapping to support checkout
      let tableId = dbTableForSelectedNum?.id || null;
      if (!tableId) {
        // Fallback or alert
        toast.info('Table record not found in database. Setting order as takeaway.');
      }

      // We determine if we need to POST (create new order) or PUT (append to existing)
      if (activeOrderForTable) {
        // Find which items in the current cart are actually NEW or modified
        // To be safe and simple, the PUT route takes the full cart list to append,
        // but wait! The PUT route expects the items that are ADDED.
        // Let's filter the cart items to find which ones are newly added.
        // If an item was already present in database draft with qty Q, and cart has qty C,
        // then we append (C - Q) if C > Q. If C <= Q, we don't append it to kitchen again.
        const dbItems = activeOrderForTable.order_items || [];
        const itemsToAppend: OrderItem[] = [];

        cart.forEach(cartItem => {
          const dbItem = dbItems.find((di: any) => di.product_id === cartItem.product.id);
          const dbQty = dbItem ? dbItem.quantity : 0;
          if (cartItem.quantity > dbQty) {
            itemsToAppend.push({
              product: cartItem.product,
              quantity: cartItem.quantity - dbQty
            });
          }
        });

        if (itemsToAppend.length === 0) {
          toast.success('Kitchen order is already up to date!');
          setActionLoading(false);
          return;
        }

        const res = await fetch('/api/orders', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: activeOrderForTable.id,
            items: itemsToAppend,
          }),
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error);

      } else {
        // Create a new draft order
        const orderNum = 'ORD-' + Math.floor(Math.random() * 90000 + 10000);
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: activeSessionId,
            table_id: tableId,
            customer_id: null,
            order_number: orderNum,
            subtotal,
            tax: taxTotal,
            discount_amount: 0,
            total,
            status: 'draft',
            payment_method: null,
            items: cart.map(item => ({
              product: item.product,
              quantity: item.quantity
            })),
          }),
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error);
      }

      toast.success('Draft order successfully sent to kitchen!');
      setIsSubmitted(true);
      
      // Reload active orders
      const ordersRes = await fetch(`/api/orders?session_id=${activeSessionId}`);
      const orders = await ordersRes.json();
      setActiveOrders(orders || []);

      setTimeout(() => {
        setIsSubmitted(false);
      }, 2000);

    } catch (err: any) {
      toast.error(`Order Booking failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (activeCategory === 'all') return true;
      return p.category_id === activeCategory;
    });
  }, [products, activeCategory]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-950">
        <Loader2 className="w-8 h-8 animate-spin text-[#F9F5F2]" />
      </div>
    );
  }

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 overflow-hidden bg-zinc-950 text-zinc-100 font-sans">
      
      {/* Middle/Left Column: Floor map & Menu Selector */}
      <div className="lg:col-span-8 flex flex-col gap-6 overflow-y-auto pr-2">
        {/* Table Selector (1-16 Grid) */}
        <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider">Restaurant Floor Plan</h3>
            <span className="text-[10px] text-[#F9F5F2] font-semibold px-2.5 py-1 rounded bg-[#F9F5F2]/10 border border-[#F9F5F2]/20">
              Waiter Active Session
            </span>
          </div>

          <div className="grid grid-cols-4 gap-3 max-w-lg mx-auto sm:max-w-none">
            {gridTableNumbers.map((num) => {
              const isOccupied = checkOccupied(num);
              const isSelected = selectedGridNum === num;
              return (
                <button
                  key={num}
                  onClick={() => setSelectedGridNum(num)}
                  className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#F9F5F2] text-black border-[#F9F5F2] shadow-lg shadow-[#F9F5F2]/10 font-bold scale-[1.02]'
                      : isOccupied
                        ? 'bg-red-950/20 border-red-500/50 text-red-200 hover:border-red-400'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <span className="text-lg font-extrabold">{num}</span>
                  <span className={`text-[9px] ${isSelected ? 'text-black/70' : isOccupied ? 'text-red-400' : 'text-zinc-550'}`}>
                    {isOccupied ? 'Occupied' : 'Empty'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Menu items Selector */}
        <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl flex-1 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider">Menu Catalog</h3>
            <span className="text-[10px] text-zinc-450">Tap to add items to cart</span>
          </div>

          {/* Quick Category Chips */}
          <div className="flex gap-2 pb-2 overflow-x-auto select-none no-scrollbar">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                activeCategory === 'all'
                  ? 'bg-[#F9F5F2] text-black border-[#F9F5F2] font-bold shadow-sm'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-900'
              }`}
            >
              <Coffee className="w-3.5 h-3.5" /> All Items
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                  activeCategory === cat.id
                    ? 'bg-[#F9F5F2] text-black border-[#F9F5F2] font-bold shadow-sm'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-900'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((prod) => (
              <button
                key={prod.id}
                onClick={() => addToCart(prod)}
                className="p-4 bg-zinc-950 border border-zinc-850 hover:border-[#F9F5F2]/50 rounded-xl text-left flex flex-col justify-between h-28 cursor-pointer transition-all hover:bg-zinc-900 group"
              >
                <div>
                  <h4 className="font-bold text-white text-sm group-hover:text-[#F9F5F2] transition-colors">{prod.name}</h4>
                </div>
                <div className="flex justify-between items-center w-full border-t border-zinc-900/60 pt-2">
                  <span className="text-[#F9F5F2] font-bold text-sm">{formatCurrency(prod.price)}</span>
                  <span className="text-[9px] text-zinc-300 font-bold px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded-full group-hover:bg-[#F9F5F2] group-hover:text-black transition-colors">
                    + Add
                  </span>
                </div>
              </button>
            ))}
            {filteredProducts.length === 0 && (
              <p className="col-span-full text-center text-zinc-500 py-12 text-sm">
                No products found in this category.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Active Cart and Actions */}
      <div className="lg:col-span-4 flex flex-col h-full bg-zinc-900 border border-zinc-800 rounded-2xl p-5 overflow-hidden justify-between shadow-2xl">
        
        {/* Cart Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#F9F5F2]" />
              Table {selectedGridNum} Order
            </h3>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-[10px] text-zinc-500 hover:text-zinc-300 font-bold cursor-pointer transition-colors"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
            {cart.map((item) => (
              <div
                key={item.product.id}
                className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-850"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <p className="text-xs font-bold text-white truncate">{item.product.name}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">{formatCurrency(item.product.price)} each</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateQty(item.product.id, -1)}
                      className="w-5 h-5 flex items-center justify-center rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 text-xs cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold text-white w-4 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQty(item.product.id, 1)}
                      className="w-5 h-5 flex items-center justify-center rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 text-xs cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-[10px] font-bold text-red-500 hover:text-red-400 cursor-pointer transition-colors ml-1"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}

            {cart.length === 0 && (
              <div className="py-12 text-center text-zinc-500 flex flex-col items-center justify-center gap-2">
                <p className="text-xs">No items added to this table's cart yet.</p>
                <p className="text-[10px] text-zinc-600 max-w-[200px]">Select a table, click on menu items to begin building order.</p>
              </div>
            )}
          </div>
        </div>

        {/* Cart Total and Action Buttons */}
        <div className="border-t border-zinc-800 pt-4 space-y-4">
          <div className="flex justify-between items-center text-sm">
            <span className="font-semibold text-zinc-450">Estimated Total:</span>
            <span className="font-extrabold text-lg text-white">{formatCurrency(total)}</span>
          </div>

          <div className="p-3 bg-[#F9F5F2]/5 border border-[#F9F5F2]/15 rounded-xl flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-[#F9F5F2] shrink-0 mt-0.5 animate-pulse" />
            <p className="text-[10px] text-zinc-450 leading-normal">
              <span className="font-semibold text-white">Notice: </span> Waiters can only build carts and send drafts to KDS. Checkout and payments are restricted to Cashiers.
            </p>
          </div>

          <button
            onClick={handleSendToKds}
            disabled={cart.length === 0 || actionLoading || isSubmitted}
            className="w-full h-11 bg-[#F9F5F2] hover:bg-[#e5e1de] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-xs font-bold text-black flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            {actionLoading ? (
              'Sending to Kitchen...'
            ) : isSubmitted ? (
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
