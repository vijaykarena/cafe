'use client';

import React, { useState, useEffect } from 'react';
import { Table, Floor } from '@/lib/types';

export default function AdminTablesPage() {
  const [floors, setFloors] = useState<Floor[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [activeFloor, setActiveFloor] = useState<string | null>(null);

  // Modals/Forms
  const [showFloorForm, setShowFloorForm] = useState(false);
  const [showTableForm, setShowTableForm] = useState(false);

  // Inputs
  const [floorName, setFloorName] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [tableSeats, setTableSeats] = useState(2);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await fetch('/api/tables');
      const data = await res.json();
      
      setFloors(data.floors || []);
      setTables(data.tables || []);
      if (data.floors && data.floors.length > 0) {
        setActiveFloor(data.floors[0].id);
      }
    } catch (err) {
      console.error('Offline / DB error loading tables', err);
    }
  };

  const handleAddFloor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: floorName, type: 'floor' }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setFloors([...floors, data]);
      if (!activeFloor) setActiveFloor(data.id);
      setFloorName('');
      setShowFloorForm(false);
    } catch (err) {
      // Mock Fallback
      const newFloor: Floor = {
        id: 'mock-floor-' + Date.now(),
        name: floorName,
        created_at: new Date().toISOString(),
      };
      setFloors([...floors, newFloor]);
      setFloorName('');
      setShowFloorForm(false);
    }
  };

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFloor) return;
    try {
      const payload = {
        floor_id: activeFloor,
        table_number: tableNumber,
        seats: tableSeats,
        is_active: true,
      };

      const res = await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setTables([...tables, data]);
      resetTableForm();
    } catch (err) {
      // Mock Fallback
      const newTable: Table = {
        id: 'mock-tbl-' + Date.now(),
        floor_id: activeFloor,
        table_number: tableNumber,
        seats: tableSeats,
        is_active: true,
        created_at: new Date().toISOString(),
      };
      setTables([...tables, newTable]);
      resetTableForm();
    }
  };

  const resetTableForm = () => {
    setTableNumber('');
    setTableSeats(2);
    setShowTableForm(false);
  };

  const filteredTables = tables.filter(t => t.floor_id === activeFloor);

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Floors & Tables</h1>
          <p className="text-zinc-400 text-sm mt-1">Configure layout zones (floors) and seat capacities of restaurant tables</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowFloorForm(true)}
            className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-lg text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
          >
            Add Floor Zone
          </button>
          <button
            onClick={() => setShowTableForm(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 rounded-lg text-xs font-semibold text-black transition-colors cursor-pointer"
          >
            Add Table
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column: Floors List */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-bold text-white text-xs uppercase tracking-wider text-zinc-500">Floor Zones</h3>
          <div className="flex flex-col gap-2">
            {floors.map((floor) => (
              <button
                key={floor.id}
                onClick={() => setActiveFloor(floor.id)}
                className={`w-full text-left px-4 py-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                  activeFloor === floor.id
                    ? 'bg-zinc-900 border-amber-500/50 text-white font-semibold'
                    : 'bg-zinc-900/40 border-zinc-900/60 text-zinc-400 hover:bg-zinc-900'
                }`}
              >
                <span>{floor.name}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-zinc-950 text-zinc-500 font-bold">
                  {tables.filter(t => t.floor_id === floor.id).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Tables Grid */}
        <div className="lg:col-span-3 space-y-4">
          <h3 className="font-bold text-white text-xs uppercase tracking-wider text-zinc-500">
            Tables ({(floors.find(f => f.id === activeFloor)?.name) || 'None'})
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filteredTables.map((table) => (
              <div
                key={table.id}
                className="p-6 rounded-xl bg-zinc-900 border border-zinc-850 flex flex-col items-center justify-center text-center shadow-lg"
              >
                <span className="text-lg font-bold text-white">{table.table_number}</span>
                <span className="text-xs text-zinc-500 mt-1">{table.seats} Seats</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold bg-green-500/10 border border-green-500/20 text-green-400 mt-3">
                  Active Table
                </span>
              </div>
            ))}

            {filteredTables.length === 0 && (
              <div className="col-span-full py-16 text-center text-zinc-500 border border-dashed border-zinc-850 rounded-xl">
                <p className="text-sm">No tables configured for this floor.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ==================== FORMS / MODALS ==================== */}

      {/* 1. Floor Form */}
      {showFloorForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAddFloor} className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-white">Add Floor Zone</h2>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-zinc-400">Floor Name</label>
              <input
                type="text"
                required
                value={floorName}
                onChange={(e) => setFloorName(e.target.value)}
                placeholder="e.g. Balcony"
                className="w-full px-4 py-2 text-sm rounded bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div className="flex gap-2 pt-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setShowFloorForm(false)}
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

      {/* 2. Table Form */}
      {showTableForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAddTable} className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-white">Add Floor Table</h2>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-zinc-400">Table Number / Label</label>
              <input
                type="text"
                required
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="e.g. Table 5"
                className="w-full px-4 py-2 text-sm rounded bg-zinc-950 border border-zinc-800 text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-zinc-400">Seats Capacity</label>
              <input
                type="number"
                min="1"
                required
                value={tableSeats}
                onChange={(e) => setTableSeats(parseInt(e.target.value))}
                className="w-full px-4 py-2 text-sm rounded bg-zinc-950 border border-zinc-800 text-white focus:outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2 text-xs font-semibold">
              <button
                type="button"
                onClick={resetTableForm}
                className="flex-1 py-2 bg-zinc-850 border border-zinc-800 text-zinc-400 rounded text-center cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded text-center cursor-pointer"
              >
                Add Table
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
