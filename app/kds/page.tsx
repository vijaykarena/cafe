"use client";

import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";
import { useDebouncer } from "@/hooks/debounce";
import { useRouter } from "next/navigation";
import {
  DndContext,
  useDraggable,
  useDroppable,
  DragEndEvent,
  DragOverlay,
} from "@dnd-kit/core";
import { createPortal } from "react-dom";
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

// ── DRAGGABLE TICKET CARD ──
function DraggableTicketCard({
  ticket,
  onToggleItem,
  isOverlay = false,
}: {
  ticket: KdsTicket;
  onToggleItem: (ticketId: string, itemId: string, currentVal: boolean) => void;
  isOverlay?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: ticket.id,
    disabled: isOverlay,
  });

  const style =
    !isOverlay && isDragging
      ? {
          opacity: 0.15,
        }
      : undefined;

  return (
    <div
      ref={isOverlay ? undefined : setNodeRef}
      style={style}
      className={`p-4 bg-zinc-950 rounded-xl flex flex-col justify-between min-h-[160px] shadow-sm transition-all border ${
        isOverlay
          ? "border-[#F9F5F2]/40 bg-zinc-900 shadow-xl shadow-black/80 cursor-grabbing"
          : isDragging
            ? "border-zinc-950 bg-zinc-950/20 pointer-events-none"
            : "border-zinc-850 hover:border-zinc-750"
      }`}
    >
      {/* Header Info - Serves as specific drag handle */}
      <div className="flex justify-between items-start select-none pb-2 border-b border-zinc-850/60">
        <div>
          <h4 className="font-extrabold text-white text-lg leading-tight tracking-tight">
            {ticket.orderNumber}
          </h4>
          <p className="text-[10px] text-zinc-450 font-bold mt-0.5 uppercase tracking-wide">
            {ticket.table}
          </p>
        </div>

        {/* Drag handle dots */}
        <div
          {...(isOverlay ? {} : listeners)}
          {...(isOverlay ? {} : attributes)}
          className={`p-1 rounded bg-zinc-900 border border-zinc-800 ${
            isOverlay
              ? "cursor-grabbing text-zinc-500"
              : "cursor-grab active:cursor-grabbing text-zinc-400 hover:text-zinc-200"
          }`}
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
            onClick={() =>
              !isOverlay && onToggleItem(ticket.id, item.id, item.isCompleted)
            }
            className={`flex justify-between items-center py-1 px-1.5 rounded transition-all text-xs font-semibold ${
              isOverlay
                ? "pointer-events-none"
                : "cursor-pointer hover:bg-zinc-900"
            } ${
              item.isCompleted
                ? "text-zinc-550 line-through decoration-zinc-700 decoration-2"
                : "text-zinc-200"
            }`}
          >
            <span>
              {item.name}{" "}
              <span className="text-[9px] text-zinc-500 font-normal">
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
      <div className="text-[9px] text-zinc-500 border-t border-zinc-850/60 pt-2 flex justify-between select-none">
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
      className={`w-72 flex-shrink-0 flex flex-col bg-zinc-900 rounded-2xl border p-4 transition-colors min-h-[500px] ${
        isOver
          ? "bg-zinc-800 border-[#F9F5F2]/30"
          : "bg-zinc-900 border-zinc-850"
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-850 mb-4 select-none">
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
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery, debouncedSearchQuery] = useDebouncer(
    "",
    300,
  );
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

      if (Array.isArray(data)) {
        setTickets(data);
      } else {
        console.error(
          "API returned error or invalid format:",
          data?.error || data,
        );
        setTickets([]);
      }
    } catch (err) {
      console.error("Error fetching kitchen queue:", err);
      setTickets([]);
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

  // Drag and Drop Start Handler
  const handleDragStart = (event: any) => {
    setActiveId(event.active.id as string);
  };

  // Drag and Drop End Handler
  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
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
        ticket.orderNumber
          .toLowerCase()
          .includes(debouncedSearchQuery.toLowerCase()) ||
        ticket.table.toLowerCase().includes(debouncedSearchQuery.toLowerCase());

      const matchesProduct =
        !selectedProductFilter ||
        ticket.items.some((item) => item.name === selectedProductFilter);

      const matchesCategory =
        !selectedCategoryFilter ||
        ticket.items.some((item) => item.category === selectedCategoryFilter);

      return matchesSearch && matchesProduct && matchesCategory;
    });
  }, [
    tickets,
    debouncedSearchQuery,
    selectedProductFilter,
    selectedCategoryFilter,
  ]);

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

        {/* Live Network Status Indicator */}
        <div className="ml-auto flex items-center gap-1.5 rounded-xl border border-zinc-850 px-3 py-2 text-[10px] text-zinc-400 bg-zinc-900 font-bold uppercase tracking-wider select-none">
          <Wifi size={12} className="text-emerald-500 animate-pulse" /> Live
          Connected
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center rounded-xl border border-zinc-850 p-2 text-red-400 bg-zinc-900 hover:border-red-500/50 hover:bg-red-950/20 transition-all cursor-pointer"
            title="Sign Out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {/* ── FILTER & SEARCH BAR ── */}

      {/* ── MAIN KITCHEN SPACE ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* 2. Dnd-Kit columns grid area */}
        <main className="flex-1 overflow-x-auto p-6 bg-zinc-950">
          <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex gap-6 h-full items-start">
              {/* To Cook Droppable Column */}
              <DroppableColumn
                id="to_cook"
                title="To Cook"
                count={toCookCount}
                titleColor="text-red-400"
                countBg="bg-red-950/40 border border-red-900/30"
                countText="text-red-400"
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
                titleColor="text-amber-400"
                countBg="bg-amber-950/40 border border-amber-900/30"
                countText="text-amber-400"
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
                titleColor="text-emerald-400"
                countBg="bg-green-950/40 border border-green-900/30"
                countText="text-emerald-400"
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
            {typeof document !== "undefined" &&
              createPortal(
                <DragOverlay adjustScale={false}>
                  {activeId ? (
                    <div className="w-[256px]">
                      <DraggableTicketCard
                        ticket={tickets.find((t) => t.id === activeId)!}
                        onToggleItem={handleToggleItem}
                        isOverlay
                      />
                    </div>
                  ) : null}
                </DragOverlay>,
                document.body,
              )}
          </DndContext>
        </main>
      </div>
    </div>
  );
}
