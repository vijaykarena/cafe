'use client';

import React, { useState, useEffect } from 'react';
import { Product, Category } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Forms
  const [showProductForm, setShowProductForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  // Product Inputs
  const [prodName, setProdName] = useState('');
  const [prodCat, setProdCat] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodUnit, setProdUnit] = useState('piece');
  const [prodTax, setProdTax] = useState('5.00');
  const [prodDesc, setProdDesc] = useState('');

  // Category Inputs
  const [catName, setCatName] = useState('');
  const [catColor, setCatColor] = useState('#8B4513');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const catsRes = await fetch('/api/categories');
      const cats = await catsRes.json();
      setCategories(cats || []);
      if (cats && cats.length > 0) {
        setProdCat(cats[0].id);
        setActiveCategory(cats[0].id);
      }

      const prodsRes = await fetch('/api/products');
      const prods = await prodsRes.json();
      setProducts(prods || []);
    } catch (err) {
      console.error('API loading error in products page', err);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: catName, color: catColor }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setCategories([...categories, data]);
      setCatName('');
      setShowCategoryForm(false);
    } catch (err) {
      // Mock Fallback
      const newCat: Category = {
        id: 'mock-cat-' + Date.now(),
        name: catName,
        color: catColor,
        created_at: new Date().toISOString(),
      };
      setCategories([...categories, newCat]);
      setCatName('');
      setShowCategoryForm(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: prodName,
        category_id: prodCat || null,
        price: parseFloat(prodPrice),
        unit_of_measure: prodUnit,
        tax: parseFloat(prodTax),
        description: prodDesc || null,
      };

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setProducts([...products, data]);
      resetProductForm();
    } catch (err) {
      // Mock Fallback
      const newProd: Product = {
        id: 'mock-prod-' + Date.now(),
        name: prodName,
        category_id: prodCat || null,
        price: parseFloat(prodPrice) || 0,
        unit_of_measure: prodUnit,
        tax: parseFloat(prodTax) || 0,
        description: prodDesc,
        image_url: null,
        created_at: new Date().toISOString(),
      };
      setProducts([...products, newProd]);
      resetProductForm();
    }
  };

  const resetProductForm = () => {
    setProdName('');
    setProdPrice('');
    setProdDesc('');
    setShowProductForm(false);
  };

  const filteredProducts = products.filter(p => p.category_id === activeCategory);

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Products & Categories</h1>
          <p className="text-zinc-400 text-sm mt-1">Configure menu items, sizing, pricing, and category color themes</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowCategoryForm(true)}
            className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-lg text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
          >
            Add Category
          </button>
          <button
            onClick={() => setShowProductForm(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 rounded-lg text-xs font-semibold text-black transition-colors cursor-pointer"
          >
            Add Product
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left column: Categories List */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-bold text-white text-xs uppercase tracking-wider text-zinc-500">Categories</h3>
          <div className="flex flex-col gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`w-full text-left px-4 py-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-zinc-900 border-amber-500/50 text-white'
                    : 'bg-zinc-900/40 border-zinc-900/60 text-zinc-400 hover:bg-zinc-900'
                }`}
              >
                <span className="text-sm font-semibold">{cat.name}</span>
                <span
                  className="w-3.5 h-3.5 rounded-full border border-zinc-800"
                  style={{ backgroundColor: cat.color }}
                ></span>
              </button>
            ))}
          </div>
        </div>

        {/* Right column: Products list */}
        <div className="lg:col-span-3 space-y-4">
          <h3 className="font-bold text-white text-xs uppercase tracking-wider text-zinc-500">
            Products ({(categories.find(c => c.id === activeCategory)?.name) || 'None'})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProducts.map((prod) => (
              <div
                key={prod.id}
                className="p-4 bg-zinc-900 border border-zinc-850 rounded-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold text-white text-sm">{prod.name}</h4>
                    <span className="font-bold text-amber-500 text-sm">{formatCurrency(prod.price)}</span>
                  </div>
                  <p className="text-zinc-505 text-xs mt-2 line-clamp-2">{prod.description || 'No description.'}</p>
                </div>

                <div className="flex items-center justify-between border-t border-zinc-850 pt-3 mt-4 text-[10px] text-zinc-400">
                  <span>Unit: {prod.unit_of_measure}</span>
                  <span>Tax: {prod.tax}%</span>
                </div>
              </div>
            ))}

            {filteredProducts.length === 0 && (
              <div className="col-span-full py-16 text-center text-zinc-550 border border-dashed border-zinc-850 rounded-xl">
                <p className="text-sm">No products found in this category.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ==================== FORMS / MODALS ==================== */}

      {/* 1. Category Form */}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAddCategory} className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-white">Add Product Category</h2>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-zinc-400">Category Name</label>
              <input
                type="text"
                required
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="e.g. Pastries"
                className="w-full px-4 py-2 text-sm rounded bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-zinc-400">Theme Color</label>
              <input
                type="color"
                value={catColor}
                onChange={(e) => setCatColor(e.target.value)}
                className="w-full h-10 p-1 rounded bg-zinc-950 border border-zinc-800 focus:outline-none cursor-pointer"
              />
            </div>
            <div className="flex gap-2 pt-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setShowCategoryForm(false)}
                className="flex-1 py-2 bg-zinc-850 border border-zinc-800 text-zinc-400 rounded text-center cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded text-center cursor-pointer"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Product Form */}
      {showProductForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAddProduct} className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-white">Add Menu Product</h2>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-zinc-400">Product Name</label>
              <input
                type="text"
                required
                value={prodName}
                onChange={(e) => setProdName(e.target.value)}
                placeholder="e.g. Flat White"
                className="w-full px-4 py-2 text-sm rounded bg-zinc-950 border border-zinc-800 text-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-zinc-400">Category</label>
                <select
                  value={prodCat}
                  onChange={(e) => setProdCat(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded bg-zinc-950 border border-zinc-800 text-zinc-300 focus:outline-none"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-zinc-400">Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={prodPrice}
                  onChange={(e) => setProdPrice(e.target.value)}
                  placeholder="3.50"
                  className="w-full px-4 py-2 text-sm rounded bg-zinc-950 border border-zinc-800 text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-zinc-400">Unit of Measure</label>
                <input
                  type="text"
                  required
                  value={prodUnit}
                  onChange={(e) => setProdUnit(e.target.value)}
                  placeholder="piece, kg, etc"
                  className="w-full px-4 py-2 text-sm rounded bg-zinc-950 border border-zinc-800 text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-zinc-400">Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={prodTax}
                  onChange={(e) => setProdTax(e.target.value)}
                  className="w-full px-4 py-2 text-sm rounded bg-zinc-950 border border-zinc-800 text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-zinc-400">Description</label>
              <textarea
                value={prodDesc}
                onChange={(e) => setProdDesc(e.target.value)}
                placeholder="Product description..."
                className="w-full px-4 py-2 text-sm rounded bg-zinc-950 border border-zinc-800 text-white focus:outline-none h-20 resize-none"
              />
            </div>

            <div className="flex gap-2 pt-2 text-xs font-semibold">
              <button
                type="button"
                onClick={resetProductForm}
                className="flex-1 py-2 bg-zinc-850 border border-zinc-800 text-zinc-400 rounded text-center cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded text-center cursor-pointer"
              >
                Add Product
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
