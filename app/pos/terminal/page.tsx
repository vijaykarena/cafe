'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Product, Category, Table, Customer, Floor } from '@/lib/types';
import { formatCurrency, calculateTaxAmount, formatDate } from '@/lib/utils';

interface CartItem {
  product: Product;
  quantity: number;
}

export default function PosTerminalPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Selection states
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);

  // UI state overlays
  const [showTableModal, setShowTableModal] = useState(true);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash' | 'card' | 'upi'>('cash');

  // Checkout forms
  const [cashReceived, setCashReceived] = useState('');
  const [cardRef, setCardRef] = useState('');
  const [receiptEmail, setReceiptEmail] = useState('');
  const [lastOrderDetails, setLastOrderDetails] = useState<any>(null);

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

      // 4. Fetch customers
      const custsRes = await fetch('/api/customers');
      const custs = await custsRes.json();
      setCustomers(custs || []);
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
  const discountTotal = (subtotal + taxTotal) * (discountPercent / 100);
  const total = subtotal + taxTotal - discountTotal;

  // Apply Coupon
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const res = await fetch('/api/promotions?type=coupons');
      const coupons = await res.json();
      
      const coupon = coupons.find((c: any) => c.code === couponCode.toUpperCase() && c.is_active);

      if (coupon) {
        if (coupon.discount_type === 'percentage') {
          setDiscountPercent(Number(coupon.value));
        } else {
          // fixed discount conversion to equivalent percentage for simpler cart flow
          const pct = (Number(coupon.value) / (subtotal + taxTotal)) * 105;
          setDiscountPercent(Math.min(pct, 100));
        }
        alert('Coupon applied successfully!');
      } else {
        alert('Invalid or expired coupon code.');
      }
    } catch (err) {
      // Offline fallback simple demo code
      if (couponCode.toUpperCase() === 'WELCOME10') {
        setDiscountPercent(10);
        alert('Mock Coupon WELCOME10 Applied: 10% Off!');
      } else {
        alert('Could not verify coupon.');
      }
    }
  };

  // Send to Kitchen
  const handleSendToKitchen = async () => {
    if (cart.length === 0) return;
    alert('Order sent to Kitchen Display System!');
  };

  // Complete Payment
  const handleCheckout = async () => {
    setActionLoading(true);
    try {
      if (!activeSessionId) {
        throw new Error('No active POS session. Please open a session first.');
      }

      const orderNum = 'ORD-' + Math.floor(Math.random() * 90000 + 10000);

      // Create order via API route
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: activeSessionId,
          table_id: selectedTable?.id || null,
          customer_id: selectedCustomer?.id || null,
          order_number: orderNum,
          subtotal,
          tax: taxTotal,
          discount_amount: discountTotal,
          total,
          status: 'paid',
          payment_method: selectedPaymentMethod,
          items: cart,
        }),
      });

      const orderResult = await res.json();
      if (orderResult.error) throw new Error(orderResult.error);

      // Assemble order details
      const orderPayload = {
        order_number: orderNum,
        table: selectedTable?.table_number || 'Takeaway',
        customer: selectedCustomer?.name || 'Guest',
        subtotal,
        tax: taxTotal,
        discount: discountTotal,
        total,
        payment_method: selectedPaymentMethod,
        items: cart,
        date: new Date().toISOString(),
      };

      setLastOrderDetails(orderPayload);
      setReceiptEmail(selectedCustomer?.email || '');

      // Reset cart and modals
      setCart([]);
      setDiscountPercent(0);
      setCouponCode('');
      setSelectedCustomer(null);
      setSelectedTable(null);
      setShowPaymentModal(false);
      setShowReceiptModal(true);
    } catch (err: any) {
      alert(`Checkout failed: ${err.message}`);
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const [actionLoading, setActionLoading] = useState(false);

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
            <span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span> Cafe POS Terminal
          </span>
          <button
            onClick={() => setShowTableModal(true)}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer border ${
              selectedTable 
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
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
            className="w-full px-4 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm"
          />
        </div>

        {/* User Action links */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/pos')}
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
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
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
                className="flex flex-col justify-between p-4 rounded-xl bg-zinc-900 border border-zinc-850 hover:border-amber-500/50 hover:bg-zinc-850/30 transition-all cursor-pointer group"
              >
                <div>
                  <h3 className="font-semibold text-white group-hover:text-amber-400 transition-colors">{prod.name}</h3>
                  <p className="text-zinc-500 text-xs mt-1 line-clamp-2">{prod.description || 'No description available.'}</p>
                </div>
                <div className="flex items-end justify-between mt-4">
                  <span className="text-xs text-zinc-400 font-medium">{prod.unit_of_measure}</span>
                  <span className="font-bold text-amber-500">{formatCurrency(Number(prod.price))}</span>
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
            <span className="font-bold text-white text-lg">Active Cart</span>
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
                <p className="text-sm">Cart is empty.</p>
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
              <div className="flex justify-between text-zinc-500">
                <span>Tax</span>
                <span>{formatCurrency(taxTotal)}</span>
              </div>
              {discountPercent > 0 && (
                <div className="flex justify-between text-green-500 font-medium">
                  <span>Discount ({discountPercent.toFixed(0)}%)</span>
                  <span>-{formatCurrency(discountTotal)}</span>
                </div>
              )}
              <div className="flex justify-between text-white font-bold text-base pt-1.5 border-t border-zinc-900">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Coupons & Customer Assignments */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => {
                  const code = prompt('Enter coupon code:');
                  if (code) {
                    setCouponCode(code);
                    setTimeout(() => handleApplyCoupon(), 100);
                  }
                }}
                className="py-2 rounded bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-zinc-300 font-semibold cursor-pointer text-center"
              >
                Promo Code
              </button>
              <button
                onClick={() => setShowCustomerModal(true)}
                className="py-2 rounded bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-zinc-300 font-semibold cursor-pointer text-center"
              >
                {selectedCustomer ? selectedCustomer.name : 'Add Customer'}
              </button>
            </div>

            {/* Main Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleSendToKitchen}
                disabled={cart.length === 0}
                className="flex-1 py-3 text-center text-xs font-semibold rounded bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                KDS Send
              </button>
              <button
                onClick={() => {
                  if (cart.length > 0) setShowPaymentModal(true);
                }}
                disabled={cart.length === 0}
                className="flex-1 py-3 text-center text-xs font-semibold rounded bg-amber-500 hover:bg-amber-600 text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Checkout / Pay
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
                        className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                          selectedTable?.id === table.id
                            ? 'bg-amber-500 border-amber-500 text-black font-bold'
                            : 'bg-zinc-950 border-zinc-850 text-zinc-300 hover:border-zinc-750'
                        }`}
                      >
                        <span className="text-base font-semibold">{table.table_number}</span>
                        <span className={`text-[10px] mt-0.5 ${selectedTable?.id === table.id ? 'text-black/70' : 'text-zinc-500'}`}>
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
                  <p className="text-xs mt-1">Please set up floors and tables in the admin dashboard.</p>
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
                    className="mt-4 px-4 py-2 bg-amber-500 text-black font-semibold rounded text-xs"
                  >
                    Use Demo Table
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Customer Selector Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Select Customer</h2>
              <button
                onClick={() => setShowCustomerModal(false)}
                className="text-zinc-500 hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2">
              {customers.map(cust => (
                <div
                  key={cust.id}
                  onClick={() => {
                    setSelectedCustomer(cust);
                    setShowCustomerModal(false);
                  }}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedCustomer?.id === cust.id
                      ? 'bg-amber-500 border-amber-500 text-black font-semibold'
                      : 'bg-zinc-950 border-zinc-850 text-zinc-300 hover:border-zinc-750'
                  }`}
                >
                  <p className="text-sm font-semibold">{cust.name}</p>
                  <p className={`text-xs mt-0.5 ${selectedCustomer?.id === cust.id ? 'text-black/70' : 'text-zinc-500'}`}>
                    {cust.phone || cust.email || 'No contact details'}
                  </p>
                </div>
              ))}

              {customers.length === 0 && (
                <div className="py-6 text-center text-zinc-500 text-sm">
                  No customers found. Assigning guest order.
                  <button
                    onClick={() => {
                      setSelectedCustomer({
                        id: 'c-guest',
                        name: 'Guest Customer',
                        email: 'guest@cafe.com',
                        phone: null,
                        created_at: '',
                      });
                      setShowCustomerModal(false);
                    }}
                    className="block mt-4 mx-auto px-4 py-2 bg-amber-500 text-black text-xs font-semibold rounded"
                  >
                    Select Guest
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Select Payment Method</h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-zinc-500 hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-850 flex justify-between items-center text-white">
              <span className="text-sm text-zinc-400">Total Amount Due</span>
              <span className="text-2xl font-bold text-amber-500">{formatCurrency(total)}</span>
            </div>

            {/* Payment Methods tabs */}
            <div className="grid grid-cols-3 gap-3">
              {(['cash', 'card', 'upi'] as const).map(method => (
                <button
                  key={method}
                  onClick={() => setSelectedPaymentMethod(method)}
                  className={`py-3 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer font-semibold uppercase text-xs tracking-wider ${
                    selectedPaymentMethod === method
                      ? 'bg-amber-500 border-amber-500 text-black font-bold'
                      : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-zinc-300'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>

            {/* Inputs based on payment method */}
            {selectedPaymentMethod === 'cash' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs text-zinc-400 font-semibold uppercase">Amount Received</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Enter cash amount"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm"
                  />
                </div>
                {Number(cashReceived) >= total && (
                  <div className="p-3 bg-green-500/10 border border-green-500/25 rounded-lg flex justify-between items-center text-green-400 text-sm font-semibold">
                    <span>Change Due</span>
                    <span>{formatCurrency(Number(cashReceived) - total)}</span>
                  </div>
                )}
              </div>
            )}

            {selectedPaymentMethod === 'upi' && (
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-850 flex flex-col items-center justify-center gap-4 text-center">
                <div className="w-40 h-40 bg-white rounded-lg flex items-center justify-center p-2">
                  {/* Mock QR representation */}
                  <div className="w-full h-full border-2 border-black flex flex-col items-center justify-center gap-1 text-black font-mono font-bold text-[10px]">
                    <span>QR CODE</span>
                    <span>{formatCurrency(total)}</span>
                    <span className="text-[6px] text-zinc-500 font-sans mt-1">cafe@ybl</span>
                  </div>
                </div>
                <p className="text-xs text-zinc-500">Scan this QR code on any UPI App to pay</p>
              </div>
            )}

            {selectedPaymentMethod === 'card' && (
              <div className="space-y-1">
                <label className="text-xs text-zinc-400 font-semibold uppercase">Transaction Reference Number</label>
                <input
                  type="text"
                  placeholder="e.g. TXN982348"
                  value={cardRef}
                  onChange={(e) => setCardRef(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm"
                />
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={selectedPaymentMethod === 'cash' && Number(cashReceived) < total}
              className="w-full py-3 text-sm font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-black disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              Complete Checkout
            </button>
          </div>
        </div>
      )}

      {/* 4. Receipt Screen Modal */}
      {showReceiptModal && lastOrderDetails && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-6">
            <h2 className="text-xl font-bold text-center text-white">Payment Successful!</h2>

            <div className="bg-white text-zinc-900 p-6 rounded-xl font-mono text-xs space-y-4 shadow-inner">
              <div className="text-center space-y-0.5">
                <h3 className="font-bold text-sm">CAFE POS TERMINAL</h3>
                <p className="text-zinc-500">123 Street Road, City</p>
                <p className="text-zinc-500">Tel: (555) 123-4567</p>
              </div>

              <div className="border-t border-dashed border-zinc-400 pt-2 space-y-1">
                <p>Order: {lastOrderDetails.order_number}</p>
                <p>Date: {formatDate(lastOrderDetails.date)}</p>
                <p>Table: {lastOrderDetails.table}</p>
                <p>Cashier: Cashier Profile</p>
                <p>Customer: {lastOrderDetails.customer}</p>
              </div>

              <div className="border-t border-dashed border-zinc-400 pt-2 space-y-2">
                {lastOrderDetails.items.map((item: any) => (
                  <div key={item.product.id} className="flex justify-between">
                    <span>
                      {item.product.name} x {item.quantity}
                    </span>
                    <span>{formatCurrency(item.product.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-zinc-400 pt-2 space-y-1 text-right">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(lastOrderDetails.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>{formatCurrency(lastOrderDetails.tax)}</span>
                </div>
                {lastOrderDetails.discount > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>Discount:</span>
                    <span>-{formatCurrency(lastOrderDetails.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold border-t border-zinc-300 pt-1 text-sm">
                  <span>TOTAL:</span>
                  <span>{formatCurrency(lastOrderDetails.total)}</span>
                </div>
              </div>

              <div className="text-center border-t border-dashed border-zinc-400 pt-3 text-[10px] text-zinc-500">
                Thank you for your visit!
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter customer email"
                  value={receiptEmail}
                  onChange={(e) => setReceiptEmail(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-lg bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <button
                  onClick={() => alert(`Receipt emailed to ${receiptEmail}`)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs font-semibold text-zinc-300 cursor-pointer"
                >
                  Email
                </button>
              </div>
              <button
                onClick={() => {
                  window.print();
                }}
                className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs font-semibold text-zinc-300 cursor-pointer"
              >
                Print Receipt
              </button>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-black text-sm font-semibold rounded-lg cursor-pointer"
              >
                New Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
