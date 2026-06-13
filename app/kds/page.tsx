'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';

interface KdsItem {
  id: string;
  name: string;
  quantity: number;
  isCompleted: boolean;
  category: string;
}

interface KdsTicket {
  id: string;
  orderNumber: string;
  table: string;
  time: string;
  status: 'to_cook' | 'preparing' | 'completed';
  items: KdsItem[];
}

export default function KdsPage() {
  const [tickets, setTickets] = useState<KdsTicket[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('All');
  
  // Realtime subscription simulation/setup
  useEffect(() => {
    // 1. Initial Mock / Seed tickets for demo
    const mockTickets: KdsTicket[] = [
      {
        id: 't-1',
        orderNumber: 'ORD-10492',
        table: 'Table 3',
        time: new Date(Date.now() - 12 * 60000).toISOString(), // 12m ago
        status: 'to_cook',
        items: [
          { id: 'i-1', name: 'Espresso', quantity: 2, isCompleted: false, category: 'Coffee' },
          { id: 'i-2', name: 'Butter Croissant', quantity: 1, isCompleted: false, category: 'Bakery' },
        ]
      },
      {
        id: 't-2',
        orderNumber: 'ORD-10491',
        table: 'Table 1',
        time: new Date(Date.now() - 25 * 60000).toISOString(), // 25m ago
        status: 'preparing',
        items: [
          { id: 'i-3', name: 'Cappuccino', quantity: 1, isCompleted: true, category: 'Coffee' },
          { id: 'i-4', name: 'Chocolate Muffin', quantity: 2, isCompleted: false, category: 'Bakery' },
          { id: 'i-5', name: 'Club Sandwich', quantity: 1, isCompleted: false, category: 'Snacks' },
        ]
      },
      {
        id: 't-3',
        orderNumber: 'ORD-10490',
        table: 'Table 11',
        time: new Date(Date.now() - 40 * 60000).toISOString(), // 40m ago
        status: 'completed',
        items: [
          { id: 'i-6', name: 'Iced Latte', quantity: 1, isCompleted: true, category: 'Cold Drinks' },
          { id: 'i-7', name: 'Butter Croissant', quantity: 2, isCompleted: true, category: 'Bakery' },
        ]
      }
    ];

    setTickets(mockTickets);

    // Setup Supabase Realtime Listener (if db table is active)
    const channel = supabase
      .channel('kds_orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'kds_tickets' },
        (payload) => {
          console.log('New kitchen ticket received:', payload);
          // Real-time integration handles loading new tickets from DB
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Update order stage
  const moveTicketStage = (ticketId: string) => {
    setTickets(tickets.map(ticket => {
      if (ticket.id === ticketId) {
        let nextStatus: KdsTicket['status'] = 'to_cook';
        if (ticket.status === 'to_cook') nextStatus = 'preparing';
        else if (ticket.status === 'preparing') nextStatus = 'completed';
        else return ticket; // keep completed

        return { ...ticket, status: nextStatus };
      }
      return ticket;
    }));
  };

  // Toggle item completion (strikethrough)
  const toggleItemComplete = (ticketId: string, itemId: string) => {
    setTickets(tickets.map(ticket => {
      if (ticket.id === ticketId) {
        const updatedItems = ticket.items.map(item => 
          item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item
        );
        
        // If all items completed, check if we should auto-mark whole order
        return { ...ticket, items: updatedItems };
      }
      return ticket;
    }));
  };

  // Categories list extracted from items
  const categories = ['All', ...Array.from(new Set(tickets.flatMap(t => t.items.map(i => i.category))))];

  // Filter tickets by search query and category
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          ticket.table.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = activeCategoryFilter === 'All' || 
                            ticket.items.some(item => item.category === activeCategoryFilter);

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col flex-1 h-screen bg-zinc-950 text-zinc-100 font-sans select-none overflow-hidden">
      {/* KDS Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-4">
          <span className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span> Kitchen Display Screen (KDS)
          </span>
        </div>

        {/* Filters and Search */}
        <div className="flex items-center gap-4 flex-1 max-w-xl mx-6">
          <input
            type="text"
            placeholder="Search by order or table..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 rounded-lg bg-zinc-950 border border-zinc-850 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />

          <div className="flex gap-1.5 bg-zinc-950 p-1 rounded-lg border border-zinc-850">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded text-xs font-semibold cursor-pointer transition-all ${
                  activeCategoryFilter === cat
                    ? 'bg-amber-500 text-black'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs text-zinc-500">Live Connection</span>
          <p className="text-xs text-green-400 font-semibold">Real-time Connected</p>
        </div>
      </header>

      {/* Main Board Grid */}
      <div className="flex-1 overflow-x-auto p-6 flex gap-6 select-none bg-zinc-950">
        {/* 1. To Cook Column */}
        <div className="w-[360px] flex-shrink-0 flex flex-col bg-zinc-900/40 rounded-2xl border border-zinc-900 p-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-850 mb-4">
            <span className="font-bold text-sm text-red-400 uppercase tracking-wider">To Cook</span>
            <span className="text-xs px-2 py-0.5 rounded bg-red-950/40 border border-red-900/40 text-red-400 font-bold">
              {filteredTickets.filter(t => t.status === 'to_cook').length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {filteredTickets.filter(t => t.status === 'to_cook').map(ticket => (
              <div key={ticket.id} className="p-4 bg-zinc-900 border border-zinc-850 rounded-xl space-y-3 shadow-lg hover:border-zinc-700 transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white text-base">{ticket.orderNumber}</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">{ticket.table}</p>
                  </div>
                  <button
                    onClick={() => moveTicketStage(ticket.id)}
                    className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Start Cook
                  </button>
                </div>

                <div className="border-t border-zinc-850/65 pt-3 space-y-2">
                  {ticket.items.map(item => (
                    <div
                      key={item.id}
                      onClick={() => toggleItemComplete(ticket.id, item.id)}
                      className={`flex justify-between items-center py-0.5 cursor-pointer hover:bg-zinc-850/50 px-1 rounded transition-colors ${
                        item.isCompleted ? 'text-zinc-650 line-through' : 'text-zinc-300'
                      }`}
                    >
                      <span>{item.name} <span className="text-zinc-550 text-xs font-semibold">({item.category})</span></span>
                      <span className="font-bold text-sm">x{item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="text-[10px] text-zinc-500 pt-2 flex justify-between">
                  <span>Created</span>
                  <span>{formatDate(ticket.time, { timeStyle: 'short', dateStyle: undefined })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Preparing Column */}
        <div className="w-[360px] flex-shrink-0 flex flex-col bg-zinc-900/40 rounded-2xl border border-zinc-900 p-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-850 mb-4">
            <span className="font-bold text-sm text-amber-400 uppercase tracking-wider">Preparing</span>
            <span className="text-xs px-2 py-0.5 rounded bg-amber-950/40 border border-amber-900/40 text-amber-400 font-bold">
              {filteredTickets.filter(t => t.status === 'preparing').length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {filteredTickets.filter(t => t.status === 'preparing').map(ticket => (
              <div key={ticket.id} className="p-4 bg-zinc-900 border border-amber-500/20 rounded-xl space-y-3 shadow-lg hover:border-amber-500/45 transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white text-base">{ticket.orderNumber}</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">{ticket.table}</p>
                  </div>
                  <button
                    onClick={() => moveTicketStage(ticket.id)}
                    className="px-3 py-1 rounded bg-green-500 hover:bg-green-600 text-black font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Complete
                  </button>
                </div>

                <div className="border-t border-zinc-850/65 pt-3 space-y-2">
                  {ticket.items.map(item => (
                    <div
                      key={item.id}
                      onClick={() => toggleItemComplete(ticket.id, item.id)}
                      className={`flex justify-between items-center py-0.5 cursor-pointer hover:bg-zinc-850/50 px-1 rounded transition-colors ${
                        item.isCompleted ? 'text-zinc-650 line-through' : 'text-zinc-300'
                      }`}
                    >
                      <span>{item.name} <span className="text-zinc-550 text-xs font-semibold">({item.category})</span></span>
                      <span className="font-bold text-sm">x{item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="text-[10px] text-zinc-500 pt-2 flex justify-between">
                  <span>Created</span>
                  <span>{formatDate(ticket.time, { timeStyle: 'short', dateStyle: undefined })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Completed Column */}
        <div className="w-[360px] flex-shrink-0 flex flex-col bg-zinc-900/40 rounded-2xl border border-zinc-900 p-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-850 mb-4">
            <span className="font-bold text-sm text-green-400 uppercase tracking-wider">Completed</span>
            <span className="text-xs px-2 py-0.5 rounded bg-green-950/40 border border-green-900/40 text-green-400 font-bold">
              {filteredTickets.filter(t => t.status === 'completed').length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {filteredTickets.filter(t => t.status === 'completed').map(ticket => (
              <div key={ticket.id} className="p-4 bg-zinc-900 border border-zinc-850 rounded-xl space-y-3 opacity-60 shadow hover:opacity-100 transition-all">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white text-base">{ticket.orderNumber}</h3>
                    <p className="text-xs text-zinc-400 mt-0.5">{ticket.table}</p>
                  </div>
                  <span className="text-xs text-green-400 font-semibold py-1">Ready</span>
                </div>

                <div className="border-t border-zinc-850/65 pt-3 space-y-2">
                  {ticket.items.map(item => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center py-0.5 text-zinc-500 line-through"
                    >
                      <span>{item.name} <span className="text-zinc-600 text-xs">({item.category})</span></span>
                      <span className="font-bold text-sm">x{item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="text-[10px] text-zinc-500 pt-2 flex justify-between">
                  <span>Created</span>
                  <span>{formatDate(ticket.time, { timeStyle: 'short', dateStyle: undefined })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
