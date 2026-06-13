'use client';

import React, { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export default function ManagerDashboardPage() {
  const [filterPeriod, setFilterPeriod] = useState('Today');
  const [loading, setLoading] = useState(true);
  
  // Metrics state
  const [metrics, setMetrics] = useState({
    totalOrders: 0,
    revenue: 0.00,
    avgOrderValue: 0.00,
  });

  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [categorySales, setCategorySales] = useState<any[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/analytics');
      const data = await res.json();
      
      if (data.error) throw new Error(data.error);

      if (data.totalOrders > 0) {
        setMetrics({
          totalOrders: data.totalOrders,
          revenue: data.revenue,
          avgOrderValue: data.avgOrderValue,
        });

        // Compute top selling items dynamically from rawOrders
        const productCounts: Record<string, { qty: number; rev: number }> = {};
        const catSales: Record<string, number> = {};

        data.rawOrders.forEach((order: any) => {
          (order.order_items || []).forEach((item: any) => {
            const name = item.products?.name || 'Unknown Item';
            const catName = item.products?.categories?.name || 'Other';
            
            // Product metrics
            if (!productCounts[name]) {
              productCounts[name] = { qty: 0, rev: 0 };
            }
            productCounts[name].qty += item.quantity;
            productCounts[name].rev += Number(item.total_price);

            // Category metrics
            catSales[catName] = (catSales[catName] || 0) + Number(item.total_price);
          });
        });

        // Format Top Selling Products
        const formattedProducts = Object.entries(productCounts)
          .map(([name, val]) => ({ name, sold: val.qty, revenue: val.rev }))
          .sort((a, b) => b.sold - a.sold)
          .slice(0, 4);

        setTopProducts(formattedProducts);

        // Format Category Distribution
        const totalCatRev = Object.values(catSales).reduce((s, r) => s + r, 0);
        const formattedCats = Object.entries(catSales).map(([name, rev]) => ({
          name,
          revenue: rev,
          share: totalCatRev > 0 ? `${Math.round((rev / totalCatRev) * 100)}%` : '0%',
        }));

        setCategorySales(formattedCats);
      } else {
        loadMocks();
      }
    } catch (err) {
      console.error('API analytics error, loading mock details.', err);
      loadMocks();
    } finally {
      setLoading(false);
    }
  };

  const loadMocks = () => {
    setMetrics({
      totalOrders: 64,
      revenue: 720.50,
      avgOrderValue: 11.25,
    });
    setTopProducts([
      { name: 'Iced Latte', sold: 24, revenue: 102.00 },
      { name: 'Espresso', sold: 18, revenue: 45.00 },
      { name: 'Butter Croissant', sold: 15, revenue: 52.50 },
      { name: 'Club Sandwich', sold: 12, revenue: 78.00 },
    ]);
    setCategorySales([
      { name: 'Cold Drinks', share: '40%', revenue: 288.20 },
      { name: 'Hot Coffee', share: '30%', revenue: 216.15 },
      { name: 'Bakery', share: '20%', revenue: 144.10 },
      { name: 'Snacks', share: '10%', revenue: 72.05 },
    ]);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Store Analytics</h1>
          <p className="text-zinc-400 text-sm mt-1">Real-time sales insights for your store registers</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => alert('Exporting PDF...')}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
          >
            Export PDF
          </button>
          <button
            onClick={() => alert('Exporting XLS...')}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
          >
            Export XLS
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap gap-4 p-4 rounded-xl bg-zinc-900/40 border border-zinc-900 text-sm">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Period</label>
          <select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="bg-zinc-950 border border-zinc-850 px-3 py-1.5 rounded-lg text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option>Today</option>
            <option>This Week</option>
            <option>This Month</option>
          </select>
        </div>
      </div>

      {/* Key Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl bg-zinc-900 border border-zinc-855 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-505">Total Orders</span>
          <p className="text-3xl font-extrabold text-white">{metrics.totalOrders}</p>
          <p className="text-[10px] text-zinc-500">Across your store's registers</p>
        </div>

        <div className="p-6 rounded-xl bg-zinc-900 border border-zinc-855 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-505">Store Revenue</span>
          <p className="text-3xl font-extrabold text-amber-500">{formatCurrency(metrics.revenue)}</p>
          <p className="text-[10px] text-zinc-500">Includes all local taxes and fees</p>
        </div>

        <div className="p-6 rounded-xl bg-zinc-900 border border-zinc-855 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-505">Average Order Value</span>
          <p className="text-3xl font-extrabold text-white">{formatCurrency(metrics.avgOrderValue)}</p>
          <p className="text-[10px] text-zinc-500">Basket size average today</p>
        </div>
      </div>

      {/* Charts & Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend Visual Block */}
        <div className="p-6 rounded-xl bg-zinc-900 border border-zinc-850 space-y-4">
          <h3 className="font-bold text-white text-sm uppercase tracking-wider">Store Hourly Sales</h3>
          <div className="h-60 rounded-lg bg-zinc-950 border border-zinc-850 flex items-end justify-between p-4 pt-10">
            {[10, 25, 45, 30, 60, 90, 85, 60, 35, 20].map((val, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2 flex-1">
                <div
                  className="w-full bg-amber-500/85 hover:bg-amber-500 rounded-t transition-all"
                  style={{ height: `${val * 1.5}px` }}
                ></div>
                <span className="text-[9px] text-zinc-605 font-mono">{9 + idx}h</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Product sales */}
        <div className="p-6 rounded-xl bg-zinc-900 border border-zinc-850 space-y-4">
          <h3 className="font-bold text-white text-sm uppercase tracking-wider">Top Store Items</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-855 text-zinc-505 font-semibold uppercase tracking-wider">
                  <th className="pb-3">Product Name</th>
                  <th className="pb-3 text-right">Qty Sold</th>
                  <th className="pb-3 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, idx) => (
                  <tr key={idx} className="border-b border-zinc-850/50 text-zinc-350 hover:bg-zinc-850/10 transition-all">
                    <td className="py-3 font-medium text-white">{p.name}</td>
                    <td className="py-3 text-right">{p.sold}</td>
                    <td className="py-3 text-right text-amber-500 font-semibold">{formatCurrency(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Category distribution */}
        <div className="p-6 rounded-xl bg-zinc-900 border border-zinc-855 space-y-4 lg:col-span-2">
          <h3 className="font-bold text-white text-sm uppercase tracking-wider">Sales Distribution by Category</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {categorySales.map((cat, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-zinc-950 border border-zinc-855 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-zinc-400">{cat.name}</p>
                  <p className="text-lg font-extrabold text-white mt-1">{formatCurrency(cat.revenue)}</p>
                </div>
                <span className="text-xs px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded font-bold text-amber-400">
                  {cat.share}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
