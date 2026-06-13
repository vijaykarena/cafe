'use client';

import React, { useState, useEffect } from 'react';
import { PaymentMethod } from '@/lib/types';

export default function AdminSettingsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [upiId, setUpiId] = useState('cafe@ybl');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data && data.length > 0) {
        setMethods(data);
        const upi = data.find((m: any) => m.name === 'upi');
        if (upi?.upi_id) setUpiId(upi.upi_id);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_enabled: !currentStatus }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setMethods(methods.map(m => m.id === id ? { ...m, is_enabled: !currentStatus } : m));
    } catch (err) {
      setMethods(methods.map(m => m.id === id ? { ...m, is_enabled: !currentStatus } : m));
    }
  };

  const handleSaveUpi = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'upi', upi_id: upiId }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      alert('UPI configurations updated successfully!');
    } catch (err) {
      alert('UPI updated locally (mock simulation)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Payment Setup</h1>
        <p className="text-zinc-400 text-sm mt-1">Configure cash registers, card terminals, and dynamic UPI QR properties</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
        {/* Payment Toggles */}
        <div className="p-6 rounded-xl bg-zinc-900 border border-zinc-850 space-y-6">
          <h3 className="font-bold text-white text-xs uppercase tracking-wider text-zinc-500">Payment Toggles</h3>
          
          <div className="space-y-4">
            {methods.map((method) => (
              <div key={method.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-950 border border-zinc-850">
                <div>
                  <p className="text-sm font-semibold uppercase text-white">{method.name}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    {method.name === 'cash' && 'Cash collection and change calculator'}
                    {method.name === 'card' && 'Credit/Debit card transaction logging'}
                    {method.name === 'upi' && 'Dynamic QR payments code creator'}
                  </p>
                </div>

                <button
                  onClick={() => handleToggle(method.id, method.is_enabled)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                    method.is_enabled ? 'bg-amber-500' : 'bg-zinc-800'
                  }`}
                >
                  <div
                    className={`bg-zinc-950 w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                      method.is_enabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  ></div>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* UPI Configuration Form */}
        {methods.find(m => m.name === 'upi')?.is_enabled && (
          <div className="p-6 rounded-xl bg-zinc-900 border border-zinc-850 space-y-6">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider text-zinc-500">UPI Settings</h3>
            
            <form onSubmit={handleSaveUpi} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-zinc-400">Merchant UPI ID</label>
                <input
                  type="text"
                  required
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. merchant@ybl"
                  className="w-full px-4 py-2.5 text-sm rounded bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <p className="text-[10px] text-zinc-500 pt-1">
                  Required to generate UPI QR codes dynamically in checkout terminal screen
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black font-semibold rounded text-xs transition-colors cursor-pointer"
              >
                {loading ? 'Saving configs...' : 'Save UPI Configurations'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
