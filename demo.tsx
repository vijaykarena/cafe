"use client";

import { useState, useMemo } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils"; // shadcn utility — adjust path if needed

// ─── Types ────────────────────────────────────────────────────────────────────

interface Category {
  id: string;
  label: string;
}
interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  available: boolean;
}
interface CartItem {
  product: Product;
  quantity: number;
}
type PaymentMethod = "cash" | "upi" | "card";
type NumpadMode = "qty" | "disc" | "price";

// ─── Data ─────────────────────────────────────────────────────────────────────

const CATEGORIES: Category[] = [
  { id: "beverages", label: "Beverages" },
  { id: "chaat", label: "Chaat" },
  { id: "meals", label: "Meals" },
  { id: "dessert", label: "Dessert" },
  { id: "snacks", label: "Snacks" },
];

const PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Masala Tea",
    price: 30,
    category: "beverages",
    available: true,
  },
  {
    id: "p2",
    name: "Cold Coffee",
    price: 80,
    category: "beverages",
    available: true,
  },
  {
    id: "p3",
    name: "Lassi",
    price: 60,
    category: "beverages",
    available: false,
  },
  {
    id: "p4",
    name: "Lemonade",
    price: 40,
    category: "beverages",
    available: true,
  },
  {
    id: "p5",
    name: "Mango Shake",
    price: 90,
    category: "beverages",
    available: true,
  },
  {
    id: "p6",
    name: "Green Tea",
    price: 35,
    category: "beverages",
    available: false,
  },
  {
    id: "p7",
    name: "Pani Puri",
    price: 50,
    category: "chaat",
    available: true,
  },
  {
    id: "p8",
    name: "Bhel Puri",
    price: 60,
    category: "chaat",
    available: true,
  },
  { id: "p9", name: "Sev Puri", price: 55, category: "chaat", available: true },
  {
    id: "p10",
    name: "Dahi Puri",
    price: 70,
    category: "chaat",
    available: false,
  },
  {
    id: "p11",
    name: "Ragda Pattis",
    price: 80,
    category: "chaat",
    available: true,
  },
  { id: "p12", name: "Thali", price: 150, category: "meals", available: true },
  {
    id: "p13",
    name: "Dal Rice",
    price: 100,
    category: "meals",
    available: true,
  },
  {
    id: "p14",
    name: "Paneer Curry",
    price: 140,
    category: "meals",
    available: true,
  },
  {
    id: "p15",
    name: "Roti Sabzi",
    price: 80,
    category: "meals",
    available: false,
  },
  {
    id: "p16",
    name: "Biryani",
    price: 180,
    category: "meals",
    available: true,
  },
  {
    id: "p17",
    name: "Gulab Jamun",
    price: 40,
    category: "dessert",
    available: true,
  },
  {
    id: "p18",
    name: "Jalebi",
    price: 35,
    category: "dessert",
    available: true,
  },
  {
    id: "p19",
    name: "Kheer",
    price: 50,
    category: "dessert",
    available: false,
  },
  {
    id: "p20",
    name: "Ice Cream",
    price: 60,
    category: "dessert",
    available: true,
  },
  { id: "p21", name: "Samosa", price: 20, category: "snacks", available: true },
  {
    id: "p22",
    name: "Kachori",
    price: 25,
    category: "snacks",
    available: true,
  },
  {
    id: "p23",
    name: "Vada Pav",
    price: 30,
    category: "snacks",
    available: true,
  },
  {
    id: "p24",
    name: "Bread Pakoda",
    price: 35,
    category: "snacks",
    available: false,
  },
];

const PAYMENT_METHODS: {
  id: PaymentMethod;
  label: string;
  Icon: React.ElementType;
}[] = [
  { id: "cash", label: "Cash", Icon: Banknote },
  { id: "upi", label: "UPI", Icon: Smartphone },
  { id: "card", label: "Card", Icon: CreditCard },
];

const GST = 0.05;

// ─── Main Component ───────────────────────────────────────────────────────────

export default function POSSystem() {
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0].id);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");
  const [numpadBuffer, setNumpadBuffer] = useState("");
  const [numpadMode, setNumpadMode] = useState<NumpadMode>("qty");
  const [discount, setDiscount] = useState(0);
  const [search, setSearch] = useState("");

  // ── Derived ───────────────────────────────────────────────────────────────

  const visibleProducts = useMemo(() => {
    const byCat = PRODUCTS.filter((p) => p.category === selectedCategory);
    if (!search.trim()) return byCat;
    return PRODUCTS.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [selectedCategory, search]);

  const subtotal = cartItems.reduce(
    (s, i) => s + i.product.price * i.quantity,
    0,
  );
  const discountAmount = Math.round((subtotal * discount) / 100);
  const afterDiscount = subtotal - discountAmount;
  const tax = Math.round(afterDiscount * GST);
  const total = afterDiscount + tax;

  // ── Cart helpers ──────────────────────────────────────────────────────────

  const addToCart = (product: Product) => {
    if (!product.available) return;
    setCartItems((prev) => {
      const hit = prev.find((i) => i.product.id === product.id);
      return hit
        ? prev.map((i) =>
            i.product.id === product.id
              ? { ...i, quantity: i.quantity + 1 }
              : i,
          )
        : [...prev, { product, quantity: 1 }];
    });
  };

  const changeQty = (productId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((i) =>
          i.product.id === productId
            ? { ...i, quantity: i.quantity + delta }
            : i,
        )
        .filter((i) => i.quantity > 0),
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setDiscount(0);
    setNumpadBuffer("");
  };

  // ── Numpad ────────────────────────────────────────────────────────────────

  const handleNumpadKey = (key: string) => {
    if (key === "backspace") {
      const next = numpadBuffer.slice(0, -1);
      setNumpadBuffer(next);
      if (numpadMode === "disc")
        setDiscount(Math.min(parseInt(next) || 0, 100));
      return;
    }
    if (key === "+/-") return;
    const next = numpadBuffer + key;
    setNumpadBuffer(next);
    if (numpadMode === "disc") setDiscount(Math.min(parseInt(next) || 0, 100));
  };

  // ── Actions ───────────────────────────────────────────────────────────────

  const sendToKitchen = () => {
    if (!cartItems.length) return;
    alert(
      "Sent to kitchen!\n" +
        cartItems.map((i) => `${i.product.name} ×${i.quantity}`).join("\n"),
    );
  };

  const checkout = () => {
    if (!cartItems.length) return;
    alert(`₹${total} paid via ${paymentMethod.toUpperCase()} ✓`);
    clearCart();
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-screen bg-[#F9F5F2] overflow-hidden font-sans">
      {/* ── TOP BAR ── */}
      <header className="flex items-center gap-3 px-4 py-2.5 bg-white border-b border-gray-100 shrink-0">
        <div className="flex items-center justify-center rounded-xl bg-[#F87060] text-white font-bold text-sm px-4 py-2 shrink-0 select-none">
          Logo
        </div>

        <div className="relative flex-1 max-w-xs">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items…"
            className="w-full rounded-xl border border-gray-200 pl-4 pr-9 py-2 text-sm outline-none focus:border-[#F87060] transition-colors bg-white"
          />
          <Search
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
        </div>

        <div className="flex items-center gap-2">
          {[
            { Icon: ShoppingCart, active: true, onClick: undefined },
            { Icon: RotateCcw, active: false, onClick: clearCart },
            { Icon: PlusSquare, active: false, onClick: undefined },
          ].map(({ Icon, active, onClick }, i) => (
            <button
              key={i}
              onClick={onClick}
              className={cn(
                "flex items-center justify-center rounded-xl border p-2.5 transition-all",
                active
                  ? "bg-[#F87060] border-[#F87060] text-white"
                  : "border-gray-200 text-gray-500 bg-white hover:border-[#F87060] hover:text-[#F87060]",
              )}
            >
              <Icon size={15} />
            </button>
          ))}

          <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-600 bg-white">
            <Wifi size={13} /> <span className="font-medium">12 V</span>
          </div>
        </div>

        <div className="ml-auto flex gap-2">
          {[User, Menu].map((Icon, i) => (
            <button
              key={i}
              className="flex items-center justify-center rounded-xl border border-gray-200 p-2.5 text-gray-500 bg-white hover:border-[#F87060] hover:text-[#F87060] transition-all"
            >
              <Icon size={15} />
            </button>
          ))}
        </div>
      </header>

      {/* ── BODY ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── PRODUCT PANEL ── */}
        <section className="flex gap-3 flex-1 p-4 overflow-hidden border-r border-gray-100">
          {/* Category sidebar */}
          <aside className="flex flex-col gap-2 w-28 shrink-0">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setSearch("");
                }}
                className={cn(
                  "rounded-xl px-3 py-2.5 text-sm font-medium text-left transition-all border",
                  selectedCategory === cat.id && !search
                    ? "bg-[#F87060] text-white border-[#F87060] shadow-sm"
                    : "bg-white text-gray-600 border-gray-200 hover:border-[#F87060] hover:text-[#F87060]",
                )}
              >
                {cat.label}
              </button>
            ))}
          </aside>

          {/* Product grid */}
          <div className="grid grid-cols-3 gap-3 overflow-y-auto flex-1 content-start pr-1">
            {visibleProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={!product.available}
                className={cn(
                  "relative flex flex-col items-center justify-center rounded-2xl border px-3 py-4 text-center transition-all",
                  product.available
                    ? "bg-white border-gray-200 hover:border-[#F87060] hover:shadow-md cursor-pointer"
                    : "bg-gray-50 border-gray-100 cursor-not-allowed opacity-55",
                )}
              >
                <span
                  className={cn(
                    "absolute top-2.5 left-2.5 h-2.5 w-2.5 rounded-full",
                    product.available ? "bg-green-500" : "bg-red-400",
                  )}
                />
                <span className="mt-1 text-sm font-semibold text-gray-800 leading-tight">
                  {product.name}
                </span>
                <span className="mt-1 text-sm font-bold text-[#F87060]">
                  ₹{product.price}
                </span>
              </button>
            ))}
            {visibleProducts.length === 0 && (
              <p className="col-span-3 text-center text-gray-400 mt-16 text-sm">
                No products found.
              </p>
            )}
          </div>

          <p className="sr-only">Product</p>
        </section>

        {/* ── CART PANEL ── */}
        <section className="w-80 shrink-0 flex flex-col p-4 overflow-hidden border-r border-gray-100">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#F87060] mb-3">
            Cart
          </h2>

          {/* Items */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
            {cartItems.length === 0 && (
              <p className="text-center text-gray-400 mt-16 text-sm">
                Add items from the menu
              </p>
            )}
            {cartItems.map((item) => (
              <div
                key={item.product.id}
                className="flex items-center gap-2 rounded-xl bg-[#FFF5F0] px-3 py-2.5"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {item.product.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    ₹{item.product.price} each
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => changeQty(item.product.id, -1)}
                    className="h-6 w-6 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:border-[#F87060] transition-colors"
                  >
                    <Minus size={11} />
                  </button>
                  <span className="w-5 text-center text-sm font-semibold">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => changeQty(item.product.id, 1)}
                    className="h-6 w-6 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:border-[#F87060] transition-colors"
                  >
                    <Plus size={11} />
                  </button>
                </div>

                <span className="text-sm font-bold text-gray-800 w-14 text-right">
                  ₹{item.product.price * item.quantity}
                </span>
              </div>
            ))}
          </div>

          {/* Cart footer */}
          <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
            <button
              onClick={sendToKitchen}
              disabled={!cartItems.length}
              className={cn(
                "w-full flex items-center justify-between rounded-xl px-4 py-2.5 font-semibold text-sm transition-all",
                cartItems.length
                  ? "bg-[#FFE4DC] text-[#F87060] hover:bg-[#F87060] hover:text-white"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed",
              )}
            >
              <span>Send to Kitchen</span>
              <Send size={15} />
            </button>

            <div className="flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-1 rounded-xl border border-gray-200 py-2 text-xs text-gray-600 hover:border-[#F87060] hover:text-[#F87060] transition-colors">
                <User size={12} /> Customer
              </button>
              <button
                onClick={() => setNumpadMode("disc")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1 rounded-xl border py-2 text-xs transition-colors",
                  numpadMode === "disc"
                    ? "border-[#F87060] text-[#F87060] bg-[#FFF5F0]"
                    : "border-gray-200 text-gray-600 hover:border-[#F87060] hover:text-[#F87060]",
                )}
              >
                <Tag size={12} /> Discount {discount > 0 && `(${discount}%)`}
              </button>
            </div>

            {/* Totals */}
            <div className="rounded-xl bg-gray-50 px-4 py-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Sub total</span>
                <span>₹{subtotal}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({discount}%)</span>
                  <span>− ₹{discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-500">
                <span>Tax (GST 5%)</span>
                <span>₹{tax}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1.5">
                <span>Total</span>
                <span>₹{total}</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── PAYMENT PANEL ── */}
        <section className="w-60 shrink-0 flex flex-col p-4 overflow-hidden">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#F87060] mb-3">
            Payment
          </h2>

          {/* Methods */}
          <div className="space-y-2">
            {PAYMENT_METHODS.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setPaymentMethod(id)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all",
                  paymentMethod === id
                    ? "bg-[#F87060] text-white border-[#F87060] shadow-sm"
                    : "bg-white text-gray-600 border-gray-200 hover:border-[#F87060]",
                )}
              >
                <Icon size={16} />
                <span className="flex-1 text-left">{label}</span>
                {paymentMethod === id && <X size={13} />}
              </button>
            ))}
          </div>

          {/* Amount */}
          <div className="my-4 rounded-xl bg-gray-50 px-4 py-4 text-center">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">
              Amount
            </p>
            <p className="text-3xl font-extrabold text-[#F87060]">₹{total}</p>
            <p className="text-[10px] text-gray-400 mt-1 uppercase">
              {paymentMethod}
            </p>
          </div>

          {/* Numpad */}
          <div className="grid grid-cols-4 gap-1.5 flex-1">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].map((k) => (
              <button
                key={k}
                onClick={() => handleNumpadKey(k)}
                className="rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-700 hover:border-[#F87060] hover:text-[#F87060] transition-all"
              >
                {k}
              </button>
            ))}

            <button
              onClick={() => handleNumpadKey("+/-")}
              className="rounded-xl border border-blue-200 bg-blue-50 py-2.5 text-xs font-semibold text-blue-500 hover:bg-blue-100 transition-all"
            >
              +/−
            </button>
            <button
              onClick={() => handleNumpadKey("backspace")}
              className="rounded-xl border border-red-200 bg-red-50 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-100 transition-all flex items-center justify-center"
            >
              <Delete size={14} />
            </button>

            {(["price", "disc", "qty"] as NumpadMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  setNumpadMode(mode);
                  setNumpadBuffer("");
                }}
                className={cn(
                  "rounded-xl border py-2.5 text-xs font-semibold transition-all",
                  numpadMode === mode
                    ? "bg-[#F87060] text-white border-[#F87060]"
                    : "bg-white text-gray-600 border-gray-200 hover:border-[#F87060]",
                )}
              >
                {mode === "price" ? "Price" : mode === "disc" ? "Disc." : "Qty"}
              </button>
            ))}

            <button
              onClick={checkout}
              disabled={!cartItems.length}
              className={cn(
                "rounded-xl py-2.5 text-xs font-bold transition-all",
                cartItems.length
                  ? "bg-[#F87060] text-white hover:bg-[#e5614f]"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed",
              )}
            >
              Pay
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
