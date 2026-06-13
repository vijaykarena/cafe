"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Product, Category, Table, Customer, Floor } from "@/lib/types";
import {
  formatCurrency,
  calculateTaxAmount,
  formatDate,
  cn,
} from "@/lib/utils";
import {
  Minus,
  Plus,
  Send,
  User,
  Tag,
  Search,
  ShoppingCart,
  RotateCcw,
  PlusSquare,
  Wifi,
  Menu,
  Banknote,
  Smartphone,
  CreditCard,
  X,
  Delete,
  Loader2,
  CheckCircle2,
} from "lucide-react";

interface CartItem {
  product: Product;
  quantity: number;
  customPrice?: number;
}

type PaymentMethod = "cash" | "upi" | "card";
type NumpadMode = "qty" | "disc" | "price";

export default function PosTerminalPage() {
  const router = useRouter();

  // Database state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Selector/Interaction state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );

  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [activeCartItemId, setActiveCartItemId] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);

  // Numpad state
  const [numpadBuffer, setNumpadBuffer] = useState("");
  const [numpadMode, setNumpadMode] = useState<NumpadMode>("qty");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");

  // Modals overlays
  const [showTableModal, setShowTableModal] = useState(true);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Action state
  const [actionLoading, setActionLoading] = useState(false);
  const [lastOrderDetails, setLastOrderDetails] = useState<any>(null);
  const [receiptEmail, setReceiptEmail] = useState("");
  const [cashReceived, setCashReceived] = useState("");
  const [cardRef, setCardRef] = useState("");

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Get active session
      const sessRes = await fetch("/api/sessions");
      const sessData = await sessRes.json();
      if (sessData.active) {
        setActiveSessionId(sessData.session.id);
      }

      // 1. Fetch categories
      const catsRes = await fetch("/api/categories");
      const cats = await catsRes.json();
      setCategories(cats || []);
      if (cats && cats.length > 0) setSelectedCategory(cats[0].id);

      // 2. Fetch products
      const prodsRes = await fetch("/api/products");
      const prods = await prodsRes.json();
      setProducts(prods || []);

      // 3. Fetch floors & tables
      const tablesRes = await fetch("/api/tables");
      const tablesData = await tablesRes.json();
      setFloors(tablesData.floors || []);
      setTables(tablesData.tables || []);

      // 4. Fetch customers
      const custsRes = await fetch("/api/customers");
      const custs = await custsRes.json();
      setCustomers(custs || []);
    } catch (err) {
      console.error("API connection error. Using mock fallback.", err);
    }
  };

  // Derived visible products
  const visibleProducts = useMemo(() => {
    const byCat = products.filter((p) => p.category_id === selectedCategory);
    if (!search.trim()) return byCat;
    return products.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [selectedCategory, products, search]);

  // Totals calculations
  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const price =
        item.customPrice !== undefined ? item.customPrice : item.product.price;
      return sum + price * item.quantity;
    }, 0);
  }, [cartItems]);

  const taxTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const price =
        item.customPrice !== undefined ? item.customPrice : item.product.price;
      return sum + calculateTaxAmount(price * item.quantity, parseFloat(item.product.tax));
    }, 0);
  }, [cartItems]);

  const discountTotal = useMemo(() => {
    return (subtotal + taxTotal) * (discount / 100);
  }, [subtotal, taxTotal, discount]);

  const total = Math.round(subtotal + taxTotal - discountTotal);

  // Cart operations
  const addToCart = (product: Product) => {
    if (!selectedTable) {
      setShowTableModal(true);
      return;
    }
    setCartItems((prev) => {
      const hit = prev.find((item) => item.product.id === product.id);
      let updated;
      if (hit) {
        updated = prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      } else {
        updated = [...prev, { product, quantity: 1 }];
      }
      // Set the active cart item for numpad adjustments
      setActiveCartItemId(product.id);
      return updated;
    });
  };

  const changeQty = (productId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity + delta }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
    if (delta < 0 && activeCartItemId === productId) {
      // check if item still exists
      const remains = cartItems.find((i) => i.product.id === productId);
      if (!remains || remains.quantity + delta <= 0) {
        setActiveCartItemId(null);
      }
    }
  };

  const clearCart = () => {
    setCartItems([]);
    setDiscount(0);
    setActiveCartItemId(null);
    setNumpadBuffer("");
  };

  // Numpad key input handler
  const handleNumpadKey = (key: string) => {
    if (key === "backspace") {
      const next = numpadBuffer.slice(0, -1);
      setNumpadBuffer(next);
      applyNumpadValue(next);
      return;
    }
    if (key === "+/-") return;
    const next = numpadBuffer + key;
    setNumpadBuffer(next);
    applyNumpadValue(next);
  };

  const applyNumpadValue = (valStr: string) => {
    const num = parseInt(valStr) || 0;
    if (numpadMode === "disc") {
      setDiscount(Math.min(num, 100));
    } else if (numpadMode === "qty" && activeCartItemId) {
      setCartItems((prev) =>
        prev.map((item) =>
          item.product.id === activeCartItemId
            ? { ...item, quantity: Math.max(num, 1) }
            : item,
        ),
      );
    } else if (numpadMode === "price" && activeCartItemId) {
      const floatVal = parseFloat(valStr) || 0;
      setCartItems((prev) =>
        prev.map((item) =>
          item.product.id === activeCartItemId
            ? { ...item, customPrice: floatVal > 0 ? floatVal : undefined }
            : item,
        ),
      );
    }
  };

  // Send draft to kitchen (KDS)
  const handleSendToKitchen = async () => {
    if (cartItems.length === 0) return;
    setActionLoading(true);
    try {
      if (!activeSessionId) {
        throw new Error("No active POS session. Please open a session first.");
      }
      const orderNum = "ORD-" + Math.floor(Math.random() * 90000 + 10000);

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: activeSessionId,
          table_id: selectedTable?.id || null,
          customer_id: selectedCustomer?.id || null,
          order_number: orderNum,
          subtotal,
          tax: taxTotal,
          discount_amount: discountTotal,
          total,
          status: "draft",
          payment_method: null,
          items: cartItems,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      alert(`Draft Order ${orderNum} successfully sent to kitchen!`);
      clearCart();
      setSelectedTable(null);
    } catch (err: any) {
      alert(`Failed to send to kitchen: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Checkout payment handler
  const checkout = async () => {
    if (cartItems.length === 0) return;
    setActionLoading(true);
    try {
      if (!activeSessionId) {
        throw new Error("No active POS session. Please open a session first.");
      }

      const orderNum = "ORD-" + Math.floor(Math.random() * 90000 + 10000);

      // Create order via API
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: activeSessionId,
          table_id: selectedTable?.id || null,
          customer_id: selectedCustomer?.id || null,
          order_number: orderNum,
          subtotal,
          tax: taxTotal,
          discount_amount: discountTotal,
          total,
          status: "paid",
          payment_method: paymentMethod,
          items: cartItems,
        }),
      });

      const orderResult = await res.json();
      if (orderResult.error) throw new Error(orderResult.error);

      const orderPayload = {
        order_number: orderNum,
        table: selectedTable?.table_number || "Takeaway",
        customer: selectedCustomer?.name || "Guest Customer",
        subtotal,
        tax: taxTotal,
        discount: discountTotal,
        total,
        payment_method: paymentMethod,
        items: cartItems,
        date: new Date().toISOString(),
      };

      setLastOrderDetails(orderPayload);
      setReceiptEmail(selectedCustomer?.email || "");

      // Reset cart and states
      setCartItems([]);
      setDiscount(0);
      setSelectedCustomer(null);
      setSelectedTable(null);
      setActiveCartItemId(null);
      setNumpadBuffer("");
      setShowReceiptModal(true);
    } catch (err: any) {
      alert(`Checkout failed: ${err.message}`);
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950 overflow-hidden font-sans select-none text-zinc-200">
      {/* ── TOP BAR ── */}
      <header className="flex items-center gap-3 px-6 py-3 bg-zinc-900 border-b border-zinc-800 shrink-0 text-white">
        <div className="flex items-center justify-center rounded-xl bg-[#F9F5F2] text-black font-bold text-xs px-4 py-2 shrink-0 select-none tracking-tight">
          CAFE POS
        </div>

        <button
          onClick={() => setShowTableModal(true)}
          className={cn(
            "px-4 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer",
            selectedTable
              ? "bg-[#F9F5F2]/10 border-[#F9F5F2]/30 text-[#F9F5F2]"
              : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-[#F9F5F2]/50",
          )}
        >
          {selectedTable
            ? `Table: ${selectedTable.table_number}`
            : "Select Table"}
        </button>

        <div className="relative flex-1 max-w-xs ml-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items…"
            className="w-full rounded-xl border border-gray-200 pl-4 pr-9 py-2 text-sm outline-none focus:border-[#F9F5F2] transition-colors bg-zinc-950 text-zinc-100"
          />
          <Search
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
        </div>

        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={clearCart}
            className="flex items-center justify-center rounded-xl border border-gray-200 p-2.5 text-gray-500 bg-zinc-900 hover:border-[#F9F5F2] hover:text-[#F9F5F2] transition-all cursor-pointer"
            title="Clear Cart"
          >
            <RotateCcw size={15} />
          </button>

          <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs text-zinc-350 bg-zinc-900">
            <Wifi size={13} className="text-[#F9F5F2]" />{" "}
            <span className="font-semibold">Terminal Connected</span>
          </div>
        </div>

        <div className="ml-auto flex gap-2">
          <button
            onClick={() => router.push("/cashier")}
            className="flex items-center justify-center rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-500 bg-zinc-900 hover:border-[#F9F5F2] hover:text-[#F9F5F2] transition-all cursor-pointer"
          >
            Leave Terminal
          </button>
        </div>
      </header>

      {/* ── BODY ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── PRODUCT PANEL ── */}
        <section className="flex gap-3 flex-1 p-4 overflow-hidden border-r border-zinc-800">
          {/* Category sidebar */}
          <aside className="flex flex-col gap-2 w-36 shrink-0 overflow-y-auto pr-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setSearch("");
                }}
                className={cn(
                  "rounded-xl px-4 py-3 text-xs font-bold text-left transition-all border cursor-pointer",
                  selectedCategory === cat.id && !search
                    ? "bg-[#F9F5F2] text-black border-[#F9F5F2] shadow-sm"
                    : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-[#F9F5F2] hover:text-[#F9F5F2]",
                )}
              >
                {cat.name}
              </button>
            ))}
          </aside>

          {/* Product grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto flex-1 content-start pr-1">
            {visibleProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="relative flex flex-col items-center justify-center rounded-2xl border px-3 py-5 text-center transition-all bg-zinc-900 border-zinc-800 hover:border-[#F9F5F2] hover:shadow-md cursor-pointer group"
              >
                <span className="absolute top-2.5 left-2.5 h-2 w-2 rounded-full bg-emerald-500" />
                <span className="mt-1 text-xs font-bold text-zinc-350 leading-tight group-hover:text-[#F9F5F2] transition-colors">
                  {product.name}
                </span>
                <span className="mt-2 text-xs font-extrabold text-[#F9F5F2]">
                  {formatCurrency(Number(product.price), "INR", "en-IN")}
                </span>
              </button>
            ))}
            {visibleProducts.length === 0 && (
              <p className="col-span-3 text-center text-gray-400 mt-16 text-sm">
                No products found.
              </p>
            )}
          </div>
        </section>

        {/* ── CART PANEL ── */}
        <section className="w-80 shrink-0 flex flex-col p-4 overflow-hidden border-r border-zinc-800 bg-zinc-900">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#F9F5F2] mb-3">
            Current Order
          </h2>

          {/* Items */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
            {cartItems.length === 0 && (
              <div className="flex flex-col items-center justify-center text-center text-gray-400 mt-16 text-xs gap-1.5">
                <ShoppingCart size={24} className="text-gray-300" />
                <p>Cart is empty</p>
                <p className="text-[10px] text-gray-400">
                  Select a table and choose menu items
                </p>
              </div>
            )}
            {cartItems.map((item) => {
              const price =
                item.customPrice !== undefined
                  ? item.customPrice
                  : item.product.price;
              const isActive = activeCartItemId === item.product.id;
              return (
                <div
                  key={item.product.id}
                  onClick={() => {
                    setActiveCartItemId(item.product.id);
                    setNumpadBuffer("");
                  }}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3 py-2.5 transition-all cursor-pointer border",
                    isActive
                      ? "bg-[#F9F5F2]/10 border-[#F9F5F2]/30 shadow-sm"
                      : "bg-zinc-950/50 border-zinc-850 hover:bg-zinc-800",
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-zinc-200 truncate">
                      {item.product.name}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {formatCurrency(price, "INR", "en-IN")}{" "}
                      {item.customPrice !== undefined && "(Custom)"}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        changeQty(item.product.id, -1);
                      }}
                      className="h-5 w-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center hover:border-[#F9F5F2] hover:text-[#F9F5F2] transition-colors cursor-pointer"
                    >
                      <Minus size={10} />
                    </button>
                    <span className="w-4 text-center text-xs font-bold">
                      {item.quantity}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        changeQty(item.product.id, 1);
                      }}
                      className="h-5 w-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center hover:border-[#F9F5F2] hover:text-[#F9F5F2] transition-colors cursor-pointer"
                    >
                      <Plus size={10} />
                    </button>
                  </div>

                  <span className="text-xs font-extrabold text-gray-700 w-16 text-right">
                    {formatCurrency(price * item.quantity, "INR", "en-IN")}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Cart footer */}
          <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
            <button
              onClick={handleSendToKitchen}
              disabled={!cartItems.length || actionLoading}
              className={cn(
                "w-full flex items-center justify-between rounded-xl px-4 py-2.5 font-semibold text-xs transition-all cursor-pointer",
                cartItems.length
                  ? "bg-[#F9F5F2] text-black hover:bg-[#e5e1de]"
                  : "bg-zinc-800 text-zinc-500 cursor-not-allowed",
              )}
            >
              <span>
                {actionLoading ? "Sending..." : "Send Draft to Kitchen (KDS)"}
              </span>
              <Send size={13} />
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => setShowCustomerModal(true)}
                className="flex-1 flex items-center justify-center gap-1 rounded-xl border border-gray-200 py-2 text-[10px] font-bold text-zinc-350 bg-zinc-900 hover:border-[#F9F5F2] hover:text-[#F9F5F2] transition-colors cursor-pointer"
              >
                <User size={11} />
                <span className="truncate max-w-[70px]">
                  {selectedCustomer ? selectedCustomer.name : "Guest"}
                </span>
              </button>

              <button
                onClick={() => {
                  setNumpadMode("disc");
                  setNumpadBuffer("");
                }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1 rounded-xl border py-2 text-[10px] font-bold transition-all cursor-pointer",
                  numpadMode === "disc"
                    ? "border-[#F9F5F2] text-[#F9F5F2] bg-[#F9F5F2]/10"
                    : "border-gray-200 text-gray-600 hover:border-[#F9F5F2] hover:text-[#F9F5F2]",
                )}
              >
                <Tag size={11} /> Discount {discount > 0 && `(${discount}%)`}
              </button>
            </div>

            {/* Totals */}
            <div className="rounded-xl bg-zinc-950 border border-zinc-800 px-4 py-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-zinc-400 font-semibold">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal, "INR", "en-IN")}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600 font-semibold">
                  <span>Discount ({discount}%)</span>
                  <span>− {formatCurrency(discountTotal, "INR", "en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between text-zinc-400 font-semibold">
                <span>Tax (GST)</span>
                <span>{formatCurrency(taxTotal, "INR", "en-IN")}</span>
              </div>
              <div className="flex justify-between font-extrabold text-zinc-100 border-t border-zinc-800 pt-1.5 text-sm">
                <span>Total</span>
                <span className="text-[#F9F5F2]">
                  {formatCurrency(total, "INR", "en-IN")}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── PAYMENT PANEL ── */}
        <section className="w-64 shrink-0 flex flex-col p-4 overflow-hidden bg-white border-r border-zinc-800">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#F9F5F2] mb-3">
            Payment Method
          </h2>

          {/* Methods */}
          <div className="space-y-2">
            {[
              { id: "cash" as PaymentMethod, label: "Cash", Icon: Banknote },
              { id: "upi" as PaymentMethod, label: "UPI QR", Icon: Smartphone },
              {
                id: "card" as PaymentMethod,
                label: "Card Swipe",
                Icon: CreditCard,
              },
            ].map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => {
                  setPaymentMethod(id);
                  if (id === "cash") setCashReceived("");
                }}
                className={cn(
                  "w-full flex items-center gap-3 rounded-xl border px-4 py-2.5 text-xs font-bold transition-all cursor-pointer",
                  paymentMethod === id
                    ? "bg-[#F9F5F2] text-black border-[#F9F5F2] shadow-sm"
                    : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-[#F9F5F2]",
                )}
              >
                <Icon size={14} />
                <span className="flex-1 text-left">{label}</span>
                {paymentMethod === id && <X size={11} />}
              </button>
            ))}
          </div>

          {/* Amount Display */}
          <div className="my-4 rounded-xl bg-zinc-950 border border-zinc-850 px-4 py-4 text-center">
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1">
              Payment Due
            </p>
            <p className="text-2xl font-extrabold text-[#F9F5F2]">
              {formatCurrency(total, "INR", "en-IN")}
            </p>
            <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase">
              {paymentMethod} checkout
            </p>
          </div>

          {/* Numpad Input Field */}
          {paymentMethod === "cash" && (
            <div className="mb-2 text-center text-xs space-y-1">
              <span className="text-gray-400 font-semibold uppercase text-[9px] block">
                Cash Received
              </span>
              <div className="text-sm font-extrabold px-3 py-1.5 bg-zinc-950 border rounded-lg border-zinc-800 font-mono text-white">
                {cashReceived
                  ? formatCurrency(Number(cashReceived), "INR", "en-IN")
                  : "₹0.00"}
              </div>
              {Number(cashReceived) >= total && (
                <div className="text-[10px] text-emerald-400 font-bold">
                  Change:{" "}
                  {formatCurrency(Number(cashReceived) - total, "INR", "en-IN")}
                </div>
              )}
            </div>
          )}

          {/* UPI QR Code helper */}
          {paymentMethod === "upi" && (
            <div className="mb-3 p-2 border border-dashed border-zinc-800 rounded-xl flex flex-col items-center gap-1.5 bg-zinc-950">
              <div className="w-24 h-24 bg-zinc-900 border border-zinc-800 rounded flex flex-col items-center justify-center p-1 text-white font-mono font-bold text-[8px] leading-tight select-none">
                <span className="text-[#F9F5F2] font-sans font-bold text-[9px] mb-1">
                  UPI QR
                </span>
                <span>{formatCurrency(total, "INR", "en-IN")}</span>
                <span className="text-[5px] text-gray-400 mt-1">cafe@ybl</span>
              </div>
              <p className="text-[9px] text-gray-500 font-bold">
                Scan to complete UPI
              </p>
            </div>
          )}

          {/* Numpad Grid */}
          <div className="grid grid-cols-4 gap-1 flex-1">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].map((k) => (
              <button
                key={k}
                onClick={() => {
                  if (paymentMethod === "cash") {
                    const next = cashReceived + k;
                    setCashReceived(next);
                  } else {
                    handleNumpadKey(k);
                  }
                }}
                className="rounded-xl border border-zinc-800 bg-zinc-900 py-2 text-xs font-bold text-zinc-300 hover:border-[#F9F5F2] hover:text-[#F9F5F2] transition-all cursor-pointer flex items-center justify-center"
              >
                {k}
              </button>
            ))}

            <button
              onClick={() => {
                if (paymentMethod === "cash") {
                  setCashReceived("");
                } else {
                  setNumpadBuffer("");
                  applyNumpadValue("");
                }
              }}
              className="rounded-xl border border-zinc-800 bg-zinc-800 py-2 text-xs font-bold text-zinc-300 hover:bg-zinc-700 transition-all cursor-pointer flex items-center justify-center"
            >
              C
            </button>

            <button
              onClick={() => {
                if (paymentMethod === "cash") {
                  const next = cashReceived.slice(0, -1);
                  setCashReceived(next);
                } else {
                  handleNumpadKey("backspace");
                }
              }}
              className="rounded-xl border border-zinc-800 bg-zinc-800 py-2 text-xs font-bold text-red-400 hover:bg-red-950/30 transition-all flex items-center justify-center cursor-pointer"
            >
              <Delete size={12} />
            </button>

            {(["price", "qty"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  setNumpadMode(mode);
                  setNumpadBuffer("");
                }}
                className={cn(
                  "rounded-xl border py-2 text-[10px] font-bold transition-all cursor-pointer uppercase",
                  numpadMode === mode
                    ? "bg-[#F9F5F2] text-black border-[#F9F5F2]"
                    : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-[#F9F5F2]",
                )}
              >
                {mode}
              </button>
            ))}

            <button
              onClick={checkout}
              disabled={
                !cartItems.length ||
                actionLoading ||
                (paymentMethod === "cash" && Number(cashReceived) < total)
              }
              className={cn(
                "col-span-2 rounded-xl py-2 text-xs font-bold transition-all cursor-pointer uppercase flex items-center justify-center",
                cartItems.length &&
                  !(paymentMethod === "cash" && Number(cashReceived) < total)
                  ? "bg-[#F9F5F2] text-black hover:bg-[#e5e1de]"
                  : "bg-zinc-800 text-zinc-500 cursor-not-allowed",
              )}
            >
              {actionLoading ? "Pay..." : "Pay"}
            </button>
          </div>
        </section>
      </div>

      {/* ==================== MODALS ==================== */}

      {/* 1. Floor Tables Plan Modal */}
      {showTableModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl max-h-[85vh] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
                <h2 className="text-lg font-bold text-zinc-100">
                  Select Floor Table Section
                </h2>
                {selectedTable && (
                  <button
                    onClick={() => setShowTableModal(false)}
                    className="text-zinc-400 hover:text-zinc-200 font-bold text-sm cursor-pointer"
                  >
                    Close [✕]
                  </button>
                )}
              </div>

              <div className="overflow-y-auto max-h-[55vh] space-y-6 pr-1">
                {floors.map((floor) => (
                  <div key={floor.id} className="space-y-3">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      {floor.name}
                    </h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {tables
                        .filter((t) => t.floor_id === floor.id)
                        .map((table) => (
                          <button
                            key={table.id}
                            onClick={() => {
                              setSelectedTable(table);
                              setShowTableModal(false);
                            }}
                            className={cn(
                              "p-4 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer",
                              selectedTable?.id === table.id
                                ? "bg-[#F9F5F2] border-[#F9F5F2] text-black font-bold"
                                : "bg-zinc-950 border-zinc-800 hover:border-[#F9F5F2] text-zinc-300 hover:bg-zinc-900",
                            )}
                          >
                            <span className="text-sm font-bold">
                              {table.table_number}
                            </span>
                            <span
                              className={cn(
                                "text-[9px] mt-0.5",
                                selectedTable?.id === table.id
                                  ? "text-white/80"
                                  : "text-gray-500",
                              )}
                            >
                              {table.seats} Seats
                            </span>
                          </button>
                        ))}
                    </div>
                  </div>
                ))}

                {floors.length === 0 && (
                  <div className="py-8 text-center text-gray-500">
                    <p className="text-sm">No floors or tables configured.</p>
                    <p className="text-xs mt-1 text-gray-400">
                      Please set up floors and tables in the manager dashboard.
                    </p>
                    <button
                      onClick={() => {
                        setSelectedTable({
                          id: "demo-t1",
                          floor_id: "demo-f1",
                          table_number: "T-1",
                          seats: 4,
                          is_active: true,
                          created_at: "",
                        });
                        setShowTableModal(false);
                      }}
                      className="mt-4 px-4 py-2 bg-[#F9F5F2] text-black font-bold rounded-xl text-xs cursor-pointer"
                    >
                      Use Demo Table 1
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Customer Selector Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-800">
              <h2 className="text-lg font-bold text-zinc-100">
                Select Customer Profile
              </h2>
              <button
                onClick={() => setShowCustomerModal(false)}
                className="text-zinc-400 hover:text-zinc-200 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {customers.map((cust) => (
                <button
                  key={cust.id}
                  onClick={() => {
                    setSelectedCustomer(cust);
                    setShowCustomerModal(false);
                  }}
                  className={cn(
                    "w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col",
                    selectedCustomer?.id === cust.id
                      ? "bg-[#F9F5F2]/10 border-[#F9F5F2] text-zinc-100"
                      : "bg-zinc-950 border-zinc-800 hover:border-[#F9F5F2] text-zinc-300 hover:bg-zinc-900",
                  )}
                >
                  <p className="text-xs font-bold">{cust.name}</p>
                  <p className="text-[10px] mt-0.5 text-gray-500">
                    {cust.phone || cust.email || "No contact details"}
                  </p>
                </button>
              ))}

              {customers.length === 0 && (
                <div className="py-6 text-center text-zinc-400 text-xs">
                  No customer profiles registered.
                  <button
                    onClick={() => {
                      setSelectedCustomer({
                        id: "c-guest",
                        name: "Guest Customer",
                        email: "guest@cafe.com",
                        phone: null,
                        created_at: "",
                      });
                      setShowCustomerModal(false);
                    }}
                    className="block mt-4 mx-auto px-4 py-2 bg-[#F9F5F2] text-black text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Select Guest
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Receipt Success Modal */}
      {showReceiptModal && lastOrderDetails && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-250">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-5">
            <h2 className="text-base font-extrabold text-center text-zinc-100 flex items-center justify-center gap-1.5">
              <CheckCircle2 className="text-emerald-500 w-5 h-5" /> Order
              Completed!
            </h2>

            {/* Paper Receipt Box */}
            <div className="bg-gray-50 border border-gray-200 text-zinc-800 p-6 rounded-xl font-mono text-[10px] space-y-4 shadow-sm select-text">
              <div className="text-center space-y-0.5">
                <h3 className="font-bold text-xs uppercase tracking-tight text-zinc-900">
                  CAFE POS SYSTEM
                </h3>
                <p className="text-zinc-500 text-[9px]">
                  123 Gourmet Lane, Food City
                </p>
                <p className="text-zinc-500 text-[9px]">Tel: 1800-CAFE-POS</p>
              </div>

              <div className="border-t border-dashed border-gray-300 pt-2 space-y-1">
                <p>Order Ref: {lastOrderDetails.order_number}</p>
                <p>Date: {formatDate(lastOrderDetails.date)}</p>
                <p>Table: {lastOrderDetails.table}</p>
                <p>Customer: {lastOrderDetails.customer}</p>
              </div>

              <div className="border-t border-dashed border-gray-300 pt-2 space-y-1.5">
                {lastOrderDetails.items.map((item: any) => {
                  const price =
                    item.customPrice !== undefined
                      ? item.customPrice
                      : item.product.price;
                  return (
                    <div key={item.product.id} className="flex justify-between">
                      <span>
                        {item.product.name} x {item.quantity}
                      </span>
                      <span>
                        {formatCurrency(price * item.quantity, "INR", "en-IN")}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-dashed border-gray-300 pt-2 space-y-1 text-right">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>
                    {formatCurrency(lastOrderDetails.subtotal, "INR", "en-IN")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tax Total:</span>
                  <span>
                    {formatCurrency(lastOrderDetails.tax, "INR", "en-IN")}
                  </span>
                </div>
                {lastOrderDetails.discount > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>Discount:</span>
                    <span>
                      -
                      {formatCurrency(
                        lastOrderDetails.discount,
                        "INR",
                        "en-IN",
                      )}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-bold border-t border-gray-300 pt-1 text-xs text-zinc-900">
                  <span>TOTAL PAID:</span>
                  <span>
                    {formatCurrency(lastOrderDetails.total, "INR", "en-IN")}
                  </span>
                </div>
              </div>

              <div className="text-center border-t border-dashed border-gray-300 pt-3 text-[9px] text-gray-500 uppercase tracking-wider">
                Thank you! Scan QR to review.
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={receiptEmail}
                  onChange={(e) => setReceiptEmail(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-xl bg-gray-50 border border-gray-200 text-zinc-900 focus:outline-none focus:border-zinc-400 placeholder:text-gray-400"
                />
                <button
                  onClick={() =>
                    alert(`Receipt has been emailed to ${receiptEmail}`)
                  }
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-xs font-bold text-zinc-300 cursor-pointer"
                >
                  Email
                </button>
              </div>

              <button
                onClick={() => window.print()}
                className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-xs font-bold text-zinc-300 cursor-pointer"
              >
                Print Receipt Invoice
              </button>

              <button
                onClick={() => setShowReceiptModal(false)}
                className="w-full py-2.5 bg-[#F9F5F2] hover:bg-[#e5e1de] text-black text-xs font-bold rounded-xl cursor-pointer transition-colors"
              >
                Start New Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
