"use client";

import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { useDebouncer } from "@/hooks/debounce";
import { useRouter } from "next/navigation";
import {
  DndContext,
  useDraggable,
  useDroppable,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  Search,
  Wifi,
  LogOut,
  Pencil,
  Grid,
  ChevronLeft,
  ChevronRight,
  GripHorizontal,
  X,
} from "lucide-react";

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
  status: "to_cook" | "preparing" | "completed";
  items: KdsItem[];
}

const MOCK_TICKETS: KdsTicket[] = [
  {
    id: "mock-1",
    orderNumber: "#2205",
    table: "Table 1",
    time: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    status: "to_cook",
    items: [
      {
        id: "mi-1",
        name: "Masala Tea",
        quantity: 3,
        isCompleted: false,
        category: "Drink",
      },
      {
        id: "mi-2",
        name: "Lassi",
        quantity: 3,
        isCompleted: false,
        category: "Drink",
      },
      {
        id: "mi-3",
        name: "Coffee",
        quantity: 3,
        isCompleted: false,
        category: "Drink",
      },
      {
        id: "mi-4",
        name: "Water",
        quantity: 3,
        isCompleted: true,
        category: "Drink",
      },
    ],
  },
  {
    id: "mock-2",
    orderNumber: "#2206",
    table: "Table 3",
    time: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    status: "to_cook",
    items: [
      {
        id: "mi-5",
        name: "Burger",
        quantity: 2,
        isCompleted: false,
        category: "Quick Bites",
      },
      {
        id: "mi-6",
        name: "Pizza",
        quantity: 1,
        isCompleted: false,
        category: "Quick Bites",
      },
    ],
  },
  {
    id: "mock-3",
    orderNumber: "#2207",
    table: "Table 5",
    time: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    status: "preparing",
    items: [
      {
        id: "mi-7",
        name: "Coffee",
        quantity: 2,
        isCompleted: true,
        category: "Drink",
      },
      {
        id: "mi-8",
        name: "Desert Cake",
        quantity: 1,
        isCompleted: false,
        category: "Desert",
      },
    ],
  },
  {
    id: "mock-4",
    orderNumber: "#2208",
    table: "Table 2",
    time: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    status: "completed",
    items: [
      {
        id: "mi-9",
        name: "Masala Tea",
        quantity: 1,
        isCompleted: true,
        category: "Drink",
      },
    ],
  },
];

// ── DRAGGABLE TICKET CARD ──
function DraggableTicketCard({
  ticket,
  onToggleItem,
}: {
  ticket: KdsTicket;
  onToggleItem: (ticketId: string, itemId: string, currentVal: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: ticket.id,
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-4 bg-[#E9ECEF] rounded-xl flex flex-col justify-between min-h-[160px] shadow-sm transition-all border ${
        isDragging
          ? "opacity-40 border-[#F9F5F2] bg-[#F9F5F2]/10"
          : "border-transparent hover:border-gray-300"
      }`}
    >
      {/* Header Info - Serves as specific drag handle */}
      <div className="flex justify-between items-start select-none pb-2 border-b border-gray-300/40">
        <div>
          <h4 className="font-extrabold text-zinc-200 text-lg leading-tight tracking-tight">
            {ticket.orderNumber}
          </h4>
          <p className="text-[10px] text-gray-500 font-bold mt-0.5 uppercase tracking-wide">
            {ticket.table}
          </p>
        </div>

        {/* Drag handle dots */}
        <div
          {...listeners}
          {...attributes}
          className="p-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 rounded bg-white/50 border border-gray-200"
          title="Drag to change status"
        >
          <GripHorizontal size={14} />
        </div>
      </div>

      {/* Items List - Clickable check-off */}
      <div className="py-3 space-y-2 flex-1">
        {ticket.items.map((item) => (
          <div
            key={item.id}
            onClick={() => onToggleItem(ticket.id, item.id, item.isCompleted)}
            className={`flex justify-between items-center py-1 px-1.5 rounded cursor-pointer transition-all hover:bg-white/40 text-xs font-semibold ${
              item.isCompleted
                ? "text-gray-400 line-through decoration-2"
                : "text-gray-700"
            }`}
          >
            <span>
              {item.name}{" "}
              <span className="text-[9px] text-gray-400 font-normal">
                ({item.category})
              </span>
            </span>
            <span className="font-extrabold text-sm ml-2">
              x{item.quantity}
            </span>
          </div>
        ))}
      </div>

      {/* Footer Timestamp */}
      <div className="text-[9px] text-gray-400 border-t border-gray-300/40 pt-2 flex justify-between select-none">
        <span>Created</span>
        <span>
          {formatDate(ticket.time, {
            timeStyle: "short",
            dateStyle: undefined,
          })}
        </span>
      </div>
    </div>
  );
}

// ── DROPPABLE COLUMN ──
function DroppableColumn({
  id,
  title,
  count,
  titleColor,
  countBg,
  countText,
  children,
}: {
  id: string;
  title: string;
  count: number;
  titleColor: string;
  countBg: string;
  countText: string;
  children: React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`w-72 flex-shrink-0 flex flex-col bg-white rounded-2xl border p-4 transition-colors min-h-[500px] ${
        isOver
          ? "bg-[#F9F5F2]/10 border-[#F9F5F2]/30"
          : "bg-white border-gray-150"
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4 select-none">
        <span
          className={`font-extrabold text-xs uppercase tracking-wider ${titleColor}`}
        >
          {title}
        </span>
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${countBg} ${countText}`}
        >
          {count}
        </span>
      </div>

      {/* Cards Holder */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-0.5 no-scrollbar">
        {children}
      </div>
    </div>
  );
}

export default function KdsPage() {
  const router = useRouter();

  // State
  const [tickets, setTickets] = useState<KdsTicket[]>([]);
  const [searchQuery, setSearchQuery, debouncedSearchQuery] = useDebouncer("", 300);
  const [selectedProductFilter, setSelectedProductFilter] = useState<
    string | null
  >(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<
    string | null
  >(null);

  useEffect(() => {
    fetchTickets();

    // Setup Supabase Realtime Listener
    const channel = supabase
      .channel("kds_orders_live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "kds_tickets" },
        () => {
          fetchTickets();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await fetch("/api/kds");
      const data = await res.json();

      if (data && data.length > 0 && !data.error) {
        setTickets(data);
      } else {
        // Fallback to Mock Tickets if empty or error
        setTickets(MOCK_TICKETS);
      }
    } catch (err) {
      console.error("Error fetching kitchen queue, loading mocks:", err);
      setTickets(MOCK_TICKETS);
    }
  };

  // Toggle item strike-through
  const handleToggleItem = async (
    ticketId: string,
    itemId: string,
    currentCompleted: boolean,
  ) => {
    const nextCompleted = !currentCompleted;

    // Optimistic Update
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          return {
            ...t,
            items: t.items.map((item) =>
              item.id === itemId
                ? { ...item, isCompleted: nextCompleted }
                : item,
            ),
          };
        }
        return t;
      }),
    );

    // Call API (will only update if it is a real DB item)
    if (!ticketId.startsWith("mock-")) {
      try {
        await fetch("/api/kds", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            item_id: itemId,
            is_completed: nextCompleted,
          }),
        });
      } catch (err) {
        console.error("Error syncing item checklist:", err);
      }
    }
  };

  // Drag and Drop End Handler
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const ticketId = active.id as string;
    const newStatus = over.id as KdsTicket["status"];

    // Optimistic Update
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t)),
    );

    // Call API (will only update if it is a real DB ticket)
    if (!ticketId.startsWith("mock-")) {
      try {
        await fetch("/api/kds", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ticket_id: ticketId,
            status: newStatus,
          }),
        });
      } catch (err) {
        console.error("Error syncing ticket stage:", err);
      }
    }
  };

  // Logout handler
  const handleLogout = async () => {
    await supabase.auth.signOut();
    document.cookie = "sb-access-token=; path=/; max-age=0; SameSite=Lax";
    router.push("/login");
  };

  // Unique Products & Categories list extracted dynamically from tickets for sidebar filtering
  const allProducts = useMemo(() => {
    const list = tickets.flatMap((t) => t.items.map((i) => i.name));
    return Array.from(new Set(list));
  }, [tickets]);

  const allCategories = useMemo(() => {
    const list = tickets.flatMap((t) => t.items.map((i) => i.category));
    return Array.from(new Set(list));
  }, [tickets]);

  // Filters Clear handler
  const clearFilters = () => {
    setSelectedProductFilter(null);
    setSelectedCategoryFilter(null);
    setSearchQuery("");
  };

  // Filter tickets by Search query, Product selection, and Category selection
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesSearch =
        ticket.orderNumber.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        ticket.table.toLowerCase().includes(debouncedSearchQuery.toLowerCase());

      const matchesProduct =
        !selectedProductFilter ||
        ticket.items.some((item) => item.name === selectedProductFilter);

      const matchesCategory =
        !selectedCategoryFilter ||
        ticket.items.some((item) => item.category === selectedCategoryFilter);

      return matchesSearch && matchesProduct && matchesCategory;
    });
  }, [tickets, debouncedSearchQuery, selectedProductFilter, selectedCategoryFilter]);

  // Column specific counts
  const toCookCount = filteredTickets.filter(
    (t) => t.status === "to_cook",
  ).length;
  const preparingCount = filteredTickets.filter(
    (t) => t.status === "preparing",
  ).length;
  const completedCount = filteredTickets.filter(
    (t) => t.status === "completed",
  ).length;

  return (
    <div className="flex flex-col h-screen bg-zinc-950 overflow-hidden text-zinc-200 font-sans select-none">
      {/* ── TOP BAR (KDS) ── */}
      <header className="flex items-center gap-3 px-6 py-2.5 bg-zinc-900 border-b border-zinc-800 shrink-0 text-white">
        <div className="flex items-center justify-center rounded-xl bg-[#F9F5F2] text-black font-extrabold text-sm px-4 py-2 shrink-0 select-none">
          Logo
        </div>
        <span className="text-base font-bold text-white pl-1">KDS</span>

        {/* Quick Nav Buttons */}
        <div className="flex items-center gap-2 ml-6">
          <button
            onClick={() => router.push("/cashier")}
            className="flex items-center justify-center rounded-xl border border-zinc-850 p-2 text-zinc-400 bg-zinc-900 hover:border-[#F9F5F2] hover:text-[#F9F5F2] transition-all cursor-pointer"
            title="Launch Cashier"
          >
            <Grid size={15} />
          </button>
          <button
            onClick={() => router.push("/manager")}
            className="flex items-center justify-center rounded-xl border border-zinc-850 p-2 text-zinc-400 bg-zinc-900 hover:border-[#F9F5F2] hover:text-[#F9F5F2] transition-all cursor-pointer"
            title="Manager Portal"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center rounded-xl border border-zinc-850 p-2 text-red-400 bg-zinc-900 hover:border-red-500/50 hover:bg-red-950/20 transition-all cursor-pointer"
            title="Sign Out"
          >
            <LogOut size={15} />
          </button>
        </div>

        {/* Live Network Status Indicator */}
        <div className="ml-auto flex items-center gap-1.5 rounded-xl border border-zinc-850 px-3 py-2 text-[10px] text-zinc-400 bg-zinc-900 font-bold uppercase tracking-wider select-none">
          <Wifi size={12} className="text-emerald-500 animate-pulse" /> Live
          Connected
        </div>
      </header>

      {/* ── FILTER & SEARCH BAR ── */}
      <div className="flex items-center justify-between px-6 py-3 bg-zinc-900 border-b border-zinc-800 shrink-0 text-white flex-wrap gap-4">
        {/* Stages chips filters */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">
            Stages
          </span>
          <div className="flex gap-1">
            <span className="px-2.5 py-1.5 bg-zinc-950 text-zinc-300 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-zinc-800">
              All{" "}
              <span className="bg-zinc-800 text-zinc-200 px-1.5 py-0.5 rounded text-[10px]">
                {filteredTickets.length}
              </span>
            </span>
            <span className="px-2.5 py-1.5 bg-red-950/20 text-red-400 border border-red-900/30 rounded-lg text-xs font-bold flex items-center gap-1.5">
              To Cook{" "}
              <span className="bg-red-500 text-white px-1.5 py-0.5 rounded text-[10px]">
                {toCookCount}
              </span>
            </span>
            <span className="px-2.5 py-1.5 bg-amber-550/10 text-amber-500 border border-amber-500/20 rounded-lg text-xs font-bold flex items-center gap-1.5">
              Preparing{" "}
              <span className="bg-amber-500 text-black px-1.5 py-0.5 rounded text-[10px]">
                {preparingCount}
              </span>
            </span>
            <span className="px-2.5 py-1.5 bg-green-50 text-green-600 border border-green-200/50 rounded-lg text-xs font-bold flex items-center gap-1.5">
              Completed{" "}
              <span className="bg-green-500 text-white px-1.5 py-0.5 rounded text-[10px]">
                {completedCount}
              </span>
            </span>
          </div>
        </div>

        {/* Search Input and Pagination mock */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-56 rounded-xl border border-gray-200 pl-4 pr-9 py-1.5 text-xs outline-none focus:border-[#F9F5F2] transition-colors bg-zinc-950 text-zinc-200 border-zinc-800 font-semibold"
            />
            <Search
              size={12}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>

          {/* Pagination selectors from mockup */}
          <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-2 py-1 bg-white select-none">
            <span className="text-[10px] font-bold text-gray-500">
              1-{filteredTickets.length}
            </span>
            <div className="flex gap-0.5 border-l pl-2 border-gray-150">
              <button className="p-0.5 hover:text-[#F9F5F2] text-zinc-400 cursor-pointer">
                <ChevronLeft size={14} />
              </button>
              <button className="p-0.5 hover:text-[#F9F5F2] text-zinc-400 cursor-pointer">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN KITCHEN SPACE ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* 1. Left Sidebar Filters (Products & Categories) */}
        <aside className="w-48 border-r border-gray-100 bg-white p-4 flex flex-col justify-between select-none">
          <div className="space-y-6 overflow-y-auto">
            {/* Clear Filter button */}
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <button
                onClick={clearFilters}
                className="text-xs font-extrabold text-[#F9F5F2] hover:text-[#e5e1de] flex items-center gap-1 cursor-pointer"
              >
                Clear Filter <X size={12} />
              </button>
            </div>

            {/* Product filters list */}
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">
                Product
              </span>
              <div className="flex flex-col gap-1">
                {allProducts.map((p) => (
                  <button
                    key={p}
                    onClick={() =>
                      setSelectedProductFilter(
                        p === selectedProductFilter ? null : p,
                      )
                    }
                    className={cn(
                      "text-left text-xs font-bold py-1.5 px-2.5 rounded-lg border transition-all cursor-pointer truncate",
                      p === selectedProductFilter
                        ? "bg-[#F9F5F2]/10 border-[#F9F5F2]/30 text-[#F9F5F2]"
                        : "bg-transparent border-transparent text-gray-600 hover:bg-gray-50",
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Category filters list */}
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">
                Category
              </span>
              <div className="flex flex-col gap-1">
                {allCategories.map((c) => (
                  <button
                    key={c}
                    onClick={() =>
                      setSelectedCategoryFilter(
                        c === selectedCategoryFilter ? null : c,
                      )
                    }
                    className={cn(
                      "text-left text-xs font-bold py-1.5 px-2.5 rounded-lg border transition-all cursor-pointer truncate",
                      c === selectedCategoryFilter
                        ? "bg-[#F9F5F2]/10 border-[#F9F5F2]/30 text-[#F9F5F2]"
                        : "bg-transparent border-transparent text-gray-600 hover:bg-gray-50",
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* 2. Dnd-Kit columns grid area */}
        <main className="flex-1 overflow-x-auto p-6 bg-[#F9F5F2]">
          <DndContext onDragEnd={handleDragEnd}>
            <div className="flex gap-6 h-full items-start">
              {/* To Cook Droppable Column */}
              <DroppableColumn
                id="to_cook"
                title="To Cook"
                count={toCookCount}
                titleColor="text-red-500"
                countBg="bg-red-50"
                countText="text-red-500"
              >
                {filteredTickets
                  .filter((t) => t.status === "to_cook")
                  .map((ticket) => (
                    <DraggableTicketCard
                      key={ticket.id}
                      ticket={ticket}
                      onToggleItem={handleToggleItem}
                    />
                  ))}
              </DroppableColumn>

              {/* Preparing Droppable Column */}
              <DroppableColumn
                id="preparing"
                title="Preparing"
                count={preparingCount}
                titleColor="text-amber-500"
                countBg="bg-amber-50"
                countText="text-amber-500"
              >
                {filteredTickets
                  .filter((t) => t.status === "preparing")
                  .map((ticket) => (
                    <DraggableTicketCard
                      key={ticket.id}
                      ticket={ticket}
                      onToggleItem={handleToggleItem}
                    />
                  ))}
              </DroppableColumn>

              {/* Completed Droppable Column */}
              <DroppableColumn
                id="completed"
                title="Completed"
                count={completedCount}
                titleColor="text-green-600"
                countBg="bg-green-50"
                countText="text-green-600"
              >
                {filteredTickets
                  .filter((t) => t.status === "completed")
                  .map((ticket) => (
                    <DraggableTicketCard
                      key={ticket.id}
                      ticket={ticket}
                      onToggleItem={handleToggleItem}
                    />
                  ))}
              </DroppableColumn>
            </div>
          </DndContext>
        </main>
      </div>
    </div>
  );
}
