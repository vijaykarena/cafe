'use client';

import React, { useState, useEffect } from 'react';
import { Coupon, Promotion, Product } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

export default function ManagerPromosPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Tab view selection
  const [activeTab, setActiveTab] = useState<'coupons' | 'promotions'>('coupons');

  // Form modals state
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [showPromoForm, setShowPromoForm] = useState(false);

  // Coupon inputs
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscType, setCouponDiscType] = useState<'percentage' | 'fixed'>('percentage');
  const [couponValue, setCouponValue] = useState('');
  const [couponActive, setCouponActive] = useState(true);

  // Promotion inputs
  const [promoName, setPromoName] = useState('');
  const [promoType, setPromoType] = useState<'product' | 'order'>('order');
  const [promoTriggerProd, setPromoTriggerProd] = useState('');
  const [promoMinQty, setPromoMinQty] = useState('');
  const [promoMinOrderAmt, setPromoMinOrderAmt] = useState('');
  const [promoDiscType, setPromoDiscType] = useState<'percentage' | 'fixed'>('percentage');
  const [promoValue, setPromoValue] = useState('');
  const [promoActive, setPromoActive] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load coupons & promotions
      const res = await fetch('/api/promotions');
      const data = await res.json();
      setCoupons(data.coupons || []);
      setPromotions(data.promotions || []);

      // Load products for dropdown
      const prodRes = await fetch('/api/products');
      const prodData = await prodRes.json();
      setProducts(prodData || []);
      if (prodData && prodData.length > 0) {
        setPromoTriggerProd(prodData[0].id);
      }
    } catch (err) {
      console.error('Error loading promotions/products data:', err);
    }
  };

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim() || !couponValue.trim()) return;

    try {
      const payload = {
        type: 'coupon',
        code: couponCode.toUpperCase().trim(),
        discount_type: couponDiscType,
        value: parseFloat(couponValue),
        is_active: couponActive,
      };

      const res = await fetch('/api/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setCoupons([...coupons, data]);
      resetCouponForm();
    } catch (err) {
      // Mock Fallback
      const newCoupon: Coupon = {
        id: 'mock-coupon-' + Date.now(),
        code: couponCode.toUpperCase().trim(),
        discount_type: couponDiscType,
        value: parseFloat(couponValue) || 0,
        is_active: couponActive,
        created_at: new Date().toISOString(),
      };
      setCoupons([...coupons, newCoupon]);
      resetCouponForm();
    }
  };

  const resetCouponForm = () => {
    setCouponCode('');
    setCouponDiscType('percentage');
    setCouponValue('');
    setCouponActive(true);
    setShowCouponForm(false);
  };

  const handleAddPromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoName.trim() || !promoValue.trim()) return;

    try {
      const payload = {
        type: 'promotion',
        name: promoName,
        promo_type: promoType,
        trigger_product_id: promoType === 'product' ? promoTriggerProd || null : null,
        min_quantity: promoType === 'product' ? (parseInt(promoMinQty) || null) : null,
        min_order_amount: promoType === 'order' ? (parseFloat(promoMinOrderAmt) || null) : null,
        discount_type: promoDiscType,
        value: parseFloat(promoValue),
        is_active: promoActive,
      };

      const res = await fetch('/api/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setPromotions([...promotions, data]);
      resetPromoForm();
    } catch (err) {
      // Mock Fallback
      const newPromo: Promotion = {
        id: 'mock-promo-' + Date.now(),
        name: promoName,
        type: promoType,
        trigger_product_id: promoType === 'product' ? promoTriggerProd || null : null,
        min_quantity: promoType === 'product' ? (parseInt(promoMinQty) || null) : null,
        min_order_amount: promoType === 'order' ? (parseFloat(promoMinOrderAmt) || null) : null,
        discount_type: promoDiscType,
        value: parseFloat(promoValue) || 0,
        is_active: promoActive,
        created_at: new Date().toISOString(),
      };
      setPromotions([...promotions, newPromo]);
      resetPromoForm();
    }
  };

  const resetPromoForm = () => {
    setPromoName('');
    setPromoType('order');
    setPromoMinQty('');
    setPromoMinOrderAmt('');
    setPromoDiscType('percentage');
    setPromoValue('');
    setPromoActive(true);
    setShowPromoForm(false);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Coupons & Campaigns</h1>
          <p className="text-zinc-400 text-sm mt-1">Configure discount codes, product bundle promos, and order thresholds</p>
        </div>

        <div>
          {activeTab === 'coupons' ? (
            <button
              onClick={() => setShowCouponForm(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 rounded-lg text-xs font-semibold text-black transition-colors cursor-pointer"
            >
              Add Coupon Code
            </button>
          ) : (
            <button
              onClick={() => setShowPromoForm(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 rounded-lg text-xs font-semibold text-black transition-colors cursor-pointer"
            >
              Add Promo Campaign
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-900 gap-6">
        <button
          onClick={() => setActiveTab('coupons')}
          className={`pb-3 text-sm font-semibold tracking-tight transition-all border-b-2 cursor-pointer ${
            activeTab === 'coupons'
              ? 'border-amber-500 text-white'
              : 'border-transparent text-zinc-500 hover:text-zinc-350'
          }`}
        >
          Coupon Codes
        </button>
        <button
          onClick={() => setActiveTab('promotions')}
          className={`pb-3 text-sm font-semibold tracking-tight transition-all border-b-2 cursor-pointer ${
            activeTab === 'promotions'
              ? 'border-amber-500 text-white'
              : 'border-transparent text-zinc-500 hover:text-zinc-350'
          }`}
        >
          Automated Promotions
        </button>
      </div>

      {/* Content Grid */}
      {activeTab === 'coupons' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coupons.map((coupon) => (
            <div
              key={coupon.id}
              className={`p-6 bg-zinc-900 border border-zinc-850 rounded-2xl flex flex-col justify-between h-40 relative overflow-hidden transition-all hover:border-zinc-800 ${
                !coupon.is_active && 'opacity-60 bg-zinc-950 border-zinc-900'
              }`}
            >
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-mono">Coupon Code</span>
                    <h4 className="font-mono font-bold text-white text-lg tracking-wider mt-0.5">{coupon.code}</h4>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                      coupon.is_active
                        ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400'
                        : 'bg-zinc-800 border border-zinc-750 text-zinc-400'
                    }`}
                  >
                    {coupon.is_active ? 'Active' : 'Disabled'}
                  </span>
                </div>
                
                <p className="text-zinc-400 text-xs mt-3">
                  Offers <span className="font-semibold text-white">
                    {coupon.discount_type === 'percentage' 
                      ? `${coupon.value}% off` 
                      : `${formatCurrency(coupon.value)} off`
                    }
                  </span> your total order.
                </p>
              </div>

              <div className="border-t border-zinc-850/60 pt-3 text-[10px] text-zinc-500 flex justify-between">
                <span>Type: {coupon.discount_type} discount</span>
                <span>ID: {coupon.id.substring(0, 8)}</span>
              </div>

              {/* Decorative dash pattern border at the bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-dashed bg-repeat-x bg-[length:8px_2px] opacity-25" style={{ backgroundImage: 'linear-gradient(to right, #f59e0b 50%, transparent 50%)' }}></div>
            </div>
          ))}

          {coupons.length === 0 && (
            <div className="col-span-full py-20 text-center text-zinc-550 border border-dashed border-zinc-850 rounded-xl">
              <p className="text-sm">No coupon codes configured yet.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {promotions.map((promo) => {
            const triggerProd = products.find(p => p.id === promo.trigger_product_id);
            return (
              <div
                key={promo.id}
                className={`p-6 bg-zinc-900 border border-zinc-850 rounded-2xl flex flex-col justify-between h-48 transition-all hover:border-zinc-800 ${
                  !promo.is_active && 'opacity-60 bg-zinc-950 border-zinc-900'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider">Campaign</span>
                      <h4 className="font-semibold text-white text-base mt-0.5">{promo.name}</h4>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                        promo.is_active
                          ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400'
                          : 'bg-zinc-800 border border-zinc-750 text-zinc-400'
                      }`}
                    >
                      {promo.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </div>

                  <div className="text-zinc-400 text-xs mt-3.5 space-y-1">
                    <p>
                      Trigger: <span className="text-zinc-200">
                        {promo.type === 'product' 
                          ? `Buy ${promo.min_quantity || 1}x of ${triggerProd?.name || 'Product'}` 
                          : `Spend at least ${formatCurrency(promo.min_order_amount || 0)}`
                        }
                      </span>
                    </p>
                    <p>
                      Reward: <span className="text-amber-500 font-semibold">
                        {promo.discount_type === 'percentage' 
                          ? `${promo.value}% discount` 
                          : `${formatCurrency(promo.value)} discount`
                        }
                      </span>
                    </p>
                  </div>
                </div>

                <div className="border-t border-zinc-850/60 pt-3 text-[10px] text-zinc-550 flex justify-between">
                  <span>Scope: {promo.type}-level</span>
                  <span>ID: {promo.id.substring(0, 8)}</span>
                </div>
              </div>
            );
          })}

          {promotions.length === 0 && (
            <div className="col-span-full py-20 text-center text-zinc-550 border border-dashed border-zinc-850 rounded-xl">
              <p className="text-sm">No automated promotions configured yet.</p>
            </div>
          )}
        </div>
      )}

      {/* ==================== FORMS / MODALS ==================== */}

      {/* 1. Coupon Modal */}
      {showCouponForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-250">
          <form
            onSubmit={handleAddCoupon}
            className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4"
          >
            <h2 className="text-lg font-bold text-white">Create Coupon Code</h2>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-zinc-400">Coupon Code</label>
              <input
                type="text"
                required
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="e.g. SUMMER50"
                className="w-full px-4 py-2 text-sm rounded bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-zinc-400">Discount Type</label>
                <select
                  value={couponDiscType}
                  onChange={(e) => setCouponDiscType(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm rounded bg-zinc-950 border border-zinc-800 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Cash ($)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-zinc-400">Value</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={couponValue}
                  onChange={(e) => setCouponValue(e.target.value)}
                  placeholder={couponDiscType === 'percentage' ? '10' : '5.00'}
                  className="w-full px-4 py-2 text-sm rounded bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-semibold uppercase text-zinc-400">Active Campaign</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={couponActive}
                  onChange={(e) => setCouponActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500 peer-checked:after:bg-black peer-checked:after:border-transparent"></div>
              </label>
            </div>

            <div className="flex gap-2 pt-2 text-xs font-semibold">
              <button
                type="button"
                onClick={resetCouponForm}
                className="flex-1 py-2 bg-zinc-850 border border-zinc-800 text-zinc-400 rounded text-center cursor-pointer hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded text-center cursor-pointer transition-colors"
              >
                Create Coupon
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Promotion Modal */}
      {showPromoForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-250">
          <form
            onSubmit={handleAddPromotion}
            className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4"
          >
            <h2 className="text-lg font-bold text-white">Add Promotion Campaign</h2>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-zinc-400">Campaign Name</label>
              <input
                type="text"
                required
                value={promoName}
                onChange={(e) => setPromoName(e.target.value)}
                placeholder="e.g. Free Coffee Promo, Summer Spend Boost"
                className="w-full px-4 py-2 text-sm rounded bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-zinc-400">Trigger Scope</label>
                <select
                  value={promoType}
                  onChange={(e) => setPromoType(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm rounded bg-zinc-950 border border-zinc-800 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
                >
                  <option value="order">Minimum Order Amount</option>
                  <option value="product">Product Quantity</option>
                </select>
              </div>

              <div className="space-y-1">
                {promoType === 'order' ? (
                  <>
                    <label className="text-xs font-semibold uppercase text-zinc-400">Min. Spend ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={promoMinOrderAmt}
                      onChange={(e) => setPromoMinOrderAmt(e.target.value)}
                      placeholder="20.00"
                      className="w-full px-4 py-2 text-sm rounded bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
                    />
                  </>
                ) : (
                  <>
                    <label className="text-xs font-semibold uppercase text-zinc-400">Min. Quantity</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={promoMinQty}
                      onChange={(e) => setPromoMinQty(e.target.value)}
                      placeholder="2"
                      className="w-full px-4 py-2 text-sm rounded bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
                    />
                  </>
                )}
              </div>
            </div>

            {promoType === 'product' && (
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-zinc-400">Trigger Menu Item</label>
                <select
                  value={promoTriggerProd}
                  onChange={(e) => setPromoTriggerProd(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded bg-zinc-950 border border-zinc-800 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                  {products.length === 0 && (
                    <option value="" disabled>No products configured.</option>
                  )}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-zinc-400">Discount Type</label>
                <select
                  value={promoDiscType}
                  onChange={(e) => setPromoDiscType(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm rounded bg-zinc-950 border border-zinc-800 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Cash ($)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-zinc-400">Value</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={promoValue}
                  onChange={(e) => setPromoValue(e.target.value)}
                  placeholder="5"
                  className="w-full px-4 py-2 text-sm rounded bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-semibold uppercase text-zinc-400">Active Campaign</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={promoActive}
                  onChange={(e) => setPromoActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500 peer-checked:after:bg-black peer-checked:after:border-transparent"></div>
              </label>
            </div>

            <div className="flex gap-2 pt-2 text-xs font-semibold">
              <button
                type="button"
                onClick={resetPromoForm}
                className="flex-1 py-2 bg-zinc-850 border border-zinc-800 text-zinc-400 rounded text-center cursor-pointer hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded text-center cursor-pointer transition-colors"
              >
                Create Promo
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
