'use client';

import React, { useState, useEffect } from 'react';
import { Floor, Table } from '@/lib/types';

export default function ManagerTablesPage() {
  const [floors, setFloors] = useState<Floor[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [activeFloor, setActiveFloor] = useState<string | null>(null);

  // Modals/Forms State
  const [showFloorForm, setShowFloorForm] = useState(false);
  const [showTableForm, setShowTableForm] = useState(false);

  // Floor inputs
  const [floorName, setFloorName] = useState('');

  // Table inputs
  const [tableNumber, setTableNumber] = useState('');
  const [tableSeats, setTableSeats] = useState('4');
  const [tableActive, setTableActive] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await fetch('/api/tables');
      const data = await res.json();
      
      const floorsData = data.floors || [];
      const tablesData = data.tables || [];
      
      setFloors(floorsData);
      setTables(tablesData);

      if (floorsData.length > 0) {
        setActiveFloor(floorsData[0].id);
      }
    } catch (err) {
      console.error('Error loading tables/floors data:', err);
    }
  };

  const handleAddFloor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!floorName.trim()) return;

    try {
      const res = await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'floor', name: floorName }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setFloors([...floors, data]);
      if (!activeFloor) {
        setActiveFloor(data.id);
      }
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
      if (!activeFloor) {
        setActiveFloor(newFloor.id);
      }
      setFloorName('');
      setShowFloorForm(false);
    }
  };

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFloor || !tableNumber.trim()) return;

    try {
      const res = await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'table',
          floor_id: activeFloor,
          table_number: tableNumber,
          seats: parseInt(tableSeats),
          is_active: tableActive,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setTables([...tables, data]);
      resetTableForm();
    } catch (err) {
      // Mock Fallback
      const newTable: Table = {
        id: 'mock-table-' + Date.now(),
        floor_id: activeFloor,
        table_number: tableNumber,
        seats: parseInt(tableSeats) || 2,
        is_active: tableActive,
        created_at: new Date().toISOString(),
      };
      setTables([...tables, newTable]);
      resetTableForm();
    }
  };

  const resetTableForm = () => {
    setTableNumber('');
    setTableSeats('4');
    setTableActive(true);
    setShowTableForm(false);
  };

  const filteredTables = tables.filter((t) => t.floor_id === activeFloor);
  const currentFloorName = floors.find((f) => f.id === activeFloor)?.name || 'None';

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Floor & Table Builder</h1>
          <p className="text-zinc-400 text-sm mt-1">Configure restaurant layout, sections (floors), and layout table availability</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowFloorForm(true)}
            className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-lg text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
          >
            Add Floor Section
          </button>
          <button
            onClick={() => setShowTableForm(true)}
            disabled={!activeFloor}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-semibold text-black transition-colors cursor-pointer"
          >
            Add Table
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left column: Floors list */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-bold text-white text-xs uppercase tracking-wider text-zinc-500">Floor Sections</h3>
          <div className="flex flex-col gap-2">
            {floors.map((floor) => (
              <button
                key={floor.id}
                onClick={() => setActiveFloor(floor.id)}
                className={`w-full text-left px-4 py-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                  activeFloor === floor.id
                    ? 'bg-zinc-900 border-amber-500/50 text-white'
                    : 'bg-zinc-900/40 border-zinc-900/60 text-zinc-400 hover:bg-zinc-900'
                }`}
              >
                <span className="text-sm font-semibold">{floor.name}</span>
                <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-mono">
                  {tables.filter((t) => t.floor_id === floor.id).length} Tables
                </span>
              </button>
            ))}

            {floors.length === 0 && (
              <div className="py-8 text-center text-zinc-550 border border-dashed border-zinc-850 rounded-xl">
                <p className="text-xs">No floors configured.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Tables grid */}
        <div className="lg:col-span-3 space-y-4">
          <h3 className="font-bold text-white text-xs uppercase tracking-wider text-zinc-500">
            Tables in {currentFloorName}
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredTables.map((table) => (
              <div
                key={table.id}
                className={`p-5 rounded-xl border transition-all flex flex-col justify-between h-36 ${
                  table.is_active
                    ? 'bg-zinc-900 border-zinc-800 hover:border-amber-550/30'
                    : 'bg-zinc-950 border-zinc-900 opacity-60'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Table</span>
                    <h4 className="font-bold text-white text-xl leading-none mt-1">{table.table_number}</h4>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      table.is_active
                        ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400'
                        : 'bg-zinc-800 border border-zinc-700 text-zinc-400'
                    }`}
                  >
                    {table.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-zinc-850/60 pt-3 text-xs text-zinc-400">
                  <span className="font-medium">{table.seats} Seats</span>
                  <span className="text-[10px] text-zinc-550">ID: {table.id.substring(0, 6)}</span>
                </div>
              </div>
            ))}

            {filteredTables.length === 0 && (
              <div className="col-span-full py-16 text-center text-zinc-550 border border-dashed border-zinc-850 rounded-xl">
                <p className="text-sm">No tables found on this floor section.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ==================== FORMS / MODALS ==================== */}

      {/* 1. Floor Modal */}
      {showFloorForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <form
            onSubmit={handleAddFloor}
            className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4"
          >
            <h2 className="text-lg font-bold text-white">Add Floor Section</h2>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-zinc-400">Floor Name</label>
              <input
                type="text"
                required
                value={floorName}
                onChange={(e) => setFloorName(e.target.value)}
                placeholder="e.g. Ground Floor, Terrace"
                className="w-full px-4 py-2 text-sm rounded bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
              />
            </div>
            <div className="flex gap-2 pt-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setFloorName('');
                  setShowFloorForm(false);
                }}
                className="flex-1 py-2 bg-zinc-850 border border-zinc-800 text-zinc-400 rounded text-center cursor-pointer hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded text-center cursor-pointer transition-colors"
              >
                Create Section
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Table Modal */}
      {showTableForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <form
            onSubmit={handleAddTable}
            className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-4"
          >
            <h2 className="text-lg font-bold text-white">Add Restaurant Table</h2>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-zinc-400">Table Number / Label</label>
              <input
                type="text"
                required
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="e.g. T-12, VIP-1"
                className="w-full px-4 py-2 text-sm rounded bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-zinc-400">Seats Capacity</label>
              <input
                type="number"
                min="1"
                required
                value={tableSeats}
                onChange={(e) => setTableSeats(e.target.value)}
                className="w-full px-4 py-2 text-sm rounded bg-zinc-950 border border-zinc-800 text-white focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-semibold uppercase text-zinc-400">Available / Active</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={tableActive}
                  onChange={(e) => setTableActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500 peer-checked:after:bg-black peer-checked:after:border-transparent"></div>
              </label>
            </div>

            <div className="flex gap-2 pt-2 text-xs font-semibold">
              <button
                type="button"
                onClick={resetTableForm}
                className="flex-1 py-2 bg-zinc-850 border border-zinc-800 text-zinc-400 rounded text-center cursor-pointer hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-black rounded text-center cursor-pointer transition-colors"
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
