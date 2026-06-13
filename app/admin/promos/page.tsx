'use client';

import React, { useState, useEffect } from 'react';
import { Coupon, Promotion, Product } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

export default function AdminPromosPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Modals/Forms
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [showPromoForm, setShowPromoForm] = useState(false);

  // Coupon Inputs
  const [couponCode, setCouponCode] = useState('');
  const [couponType, setCouponType] = useState<'percentage' | 'fixed'>('percentage');
  const [couponValue, setCouponValue] = useState('');

  // Promo Inputs
  const [promoName, setPromoName] = useState('');
  const [promoType, setPromoType] = useState<'product' | 'order'>('product');
  const [promoTriggerProduct, setPromoTriggerProduct] = useState('');
  const [promoMinQty, setPromoMinQty] = useState('');
  const [promoMinAmount, setPromoMinAmount] = useState('');
  const [promoDiscountType, setPromoDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [promoValue, setPromoValue] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await fetch('/api/promotions');
      const data = await res.json();
      setCoupons(data.coupons || []);
      setPromotions(data.promotions || []);

      const prodsRes = await fetch('/api/products');
      const prods = await prodsRes.json();
      setProducts(prods || []);
      if (prods && prods.length > 0) setPromoTriggerProduct(prods[0].id);
    } catch (err) {
      console.error('Error loading promotions:', err);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        code: couponCode.toUpperCase(),
        discount_type: couponType,
        value: parseFloat(couponValue),
        type: 'coupon',
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
        id: 'mock-c-' + Date.now(),
        code: couponCode.toUpperCase(),
        discount_type: couponType,
        value: parseFloat(couponValue) || 0,
        is_active: true,
        created_at: new Date().toISOString(),
      };
      setCoupons([...coupons, newCoupon]);
      resetCouponForm();
    }
  };

  const resetCouponForm = () => {
    setCouponCode('');
    setCouponValue('');
    setShowCouponForm(false);
  };

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: promoName,
        promo_type: promoType,
        trigger_product_id: promoType === 'product' ? (promoTriggerProduct || null) : null,
        min_quantity: promoType === 'product' ? (parseInt(promoMinQty) || 1) : null,
        min_order_amount: promoType === 'order' ? (parseFloat(promoMinAmount) || 0) : null,
        discount_type: promoDiscountType,
        value: parseFloat(promoValue),
        type: 'promo',
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
        id: 'mock-p-' + Date.now(),
        name: promoName,
        type: promoType,
        trigger_product_id: promoType === 'product' ? (promoTriggerProduct || null) : null,
        min_quantity: promoType === 'product' ? (parseInt(promoMinQty) || 1) : null,
        min_order_amount: promoType === 'order' ? (parseFloat(promoMinAmount) || 0) : null,
        discount_type: promoDiscountType,
        value: parseFloat(promoValue) || 0,
        is_active: true,
        created_at: new Date().toISOString(),
      };
      setPromotions([...promotions, newPromo]);
      resetPromoForm();
    }
  };

  const resetPromoForm = () => {
    setPromoName('');
    setPromoMinQty('');
    setPromoMinAmount('');
    setPromoValue('');
    setShowPromoForm(false);
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Coupons & Promotions</h1>
          <p className="text-zinc-400 text-sm mt-1">Configure active promotional codes and automated checkout discounts</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowCouponForm(true)}
            className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-lg text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
          >
            New Coupon Code
          </button>
          <button
            onClick={() => setShowPromoForm(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 rounded-lg text-xs font-semibold text-black transition-colors cursor-pointer"
          >
            Add Auto Promotion
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 1. Coupon Codes Table */}
        <div className="p-6 rounded-xl bg-zinc-900 border border-zinc-850 space-y-4">
          <h3 className="font-bold text-white text-xs uppercase tracking-wider text-zinc-500">Coupon Codes</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-855 text-zinc-505 font-semibold uppercase tracking-wider">
                  <th className="pb-3">Code</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3 text-right">Value</th>
                  <th className="pb-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c, idx) => (
                  <tr key={idx} className="border-b border-zinc-850/50 text-zinc-350 hover:bg-zinc-850/10 transition-all">
                    <td className="py-3 font-mono font-bold text-white text-sm">{c.code}</td>
                    <td className="py-3 capitalize">{c.discount_type}</td>
                    <td className="py-3 text-right text-amber-500 font-semibold">
                      {c.discount_type === 'percentage' ? `${c.value}%` : formatCurrency(c.value)}
                    </td>
                    <td className="py-3 text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-green-500/10 text-green-400 font-semibold border border-green-500/20">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}

                {coupons.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-zinc-550">No coupons active.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. Automated Promotions Table */}
        <div className="p-6 rounded-xl bg-zinc-900 border border-zinc-850 space-y-4">
          <h3 className="font-bold text-white text-xs uppercase tracking-wider text-zinc-500">Automated Promotions</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-855 text-zinc-505 font-semibold uppercase tracking-wider">
                  <th className="pb-3">Promo Rule</th>
                  <th className="pb-3">Trigger Condition</th>
                  <th className="pb-3 text-right">Discount</th>
                </tr>
              </thead>
              <tbody>
                {promotions.map((p, idx) => (
                  <tr key={idx} className="border-b border-zinc-850/50 text-zinc-350 hover:bg-zinc-850/10 transition-all">
                    <td className="py-3 font-semibold text-white">{p.name}</td>
                    <td className="py-3">
                      {p.type === 'product'
                        ? `Product Qty >= ${p.min_quantity}`
                        : `Order Total >= ${formatCurrency(p.min_order_amount || 0)}`}
                    </td>
                    <td className="py-3 text-right text-amber-500 font-semibold">
                      {p.discount_type === 'percentage' ? `${p.value}%` : formatCurrency(p.value)}
                    </td>
                  </tr>
                ))}

                {promotions.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-zinc-550">No automated rules.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ==================== MODALS ==================== */}

      {/* 1. Coupon Modal */}
      {showCouponForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateCoupon} className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-white">Create Coupon Code</h2>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-zinc-400">Coupon Code</label>
              <input
                type="text"
                required
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="e.g. SAVE20"
                className="w-full px-4 py-2 text-sm rounded bg-zinc-950 border border-zinc-800 text-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-zinc-400">Discount Type</label>
                <select
                  value={couponType}
                  onChange={(e) => setCouponType(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm rounded bg-zinc-955 border border-zinc-800 text-zinc-300 focus:outline-none"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-zinc-400">Discount Value</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={couponValue}
                  onChange={(e) => setCouponValue(e.target.value)}
                  placeholder="20"
                  className="w-full px-4 py-2 text-sm rounded bg-zinc-950 border border-zinc-800 text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 text-xs font-semibold">
              <button
                type="button"
                onClick={resetCouponForm}
                className="flex-1 py-2 bg-zinc-850 border border-zinc-800 text-zinc-400 rounded text-center cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded text-center cursor-pointer"
              >
                Create Coupon
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Automated Promo Modal */}
      {showPromoForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreatePromo} className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-white">Create Automated Promotion</h2>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-zinc-400">Promo Label / Name</label>
              <input
                type="text"
                required
                value={promoName}
                onChange={(e) => setPromoName(e.target.value)}
                placeholder="e.g. Bulk Coffee Discount"
                className="w-full px-4 py-2 text-sm rounded bg-zinc-950 border border-zinc-800 text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-zinc-400">Trigger Target</label>
              <select
                value={promoType}
                onChange={(e) => setPromoType(e.target.value as any)}
                className="w-full px-3 py-2 text-sm rounded bg-zinc-950 border border-zinc-800 text-zinc-300 focus:outline-none"
              >
                <option value="product">Specific Product Quantity</option>
                <option value="order">Minimum Order Total</option>
              </select>
            </div>

            {promoType === 'product' ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-zinc-400">Product</label>
                  <select
                    value={promoTriggerProduct}
                    onChange={(e) => setPromoTriggerProduct(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded bg-zinc-955 border border-zinc-800 text-zinc-300 focus:outline-none"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-zinc-400">Min Quantity</label>
                  <input
                    type="number"
                    required
                    value={promoMinQty}
                    onChange={(e) => setPromoMinQty(e.target.value)}
                    placeholder="3"
                    className="w-full px-4 py-2 text-sm rounded bg-zinc-955 border border-zinc-800 text-white focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-zinc-400">Minimum Order Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={promoMinAmount}
                  onChange={(e) => setPromoMinAmount(e.target.value)}
                  placeholder="50.00"
                  className="w-full px-4 py-2 text-sm rounded bg-zinc-950 border border-zinc-800 text-white focus:outline-none"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-zinc-400">Discount Type</label>
                <select
                  value={promoDiscountType}
                  onChange={(e) => setPromoDiscountType(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm rounded bg-zinc-955 border border-zinc-800 text-zinc-300 focus:outline-none"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
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
                  placeholder="10"
                  className="w-full px-4 py-2 text-sm rounded bg-zinc-950 border border-zinc-800 text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 text-xs font-semibold">
              <button
                type="button"
                onClick={resetPromoForm}
                className="flex-1 py-2 bg-zinc-850 border border-zinc-800 text-zinc-400 rounded text-center cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded text-center cursor-pointer"
              >
                Create Promo Rule
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
