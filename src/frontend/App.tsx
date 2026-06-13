import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Menu from "./pages/Menu";
import Orders from "./pages/Orders";
import { LayoutDashboard, Coffee, ClipboardList, Store, User } from "lucide-react";

function NavigationLink({ to, label, icon: Icon }: { to: string; label: string; icon: any }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="flex h-screen bg-slate-50/50 dark:bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200/80 bg-white/80 dark:bg-card/80 backdrop-blur-md p-6 flex flex-col gap-8 h-full">
        {/* Brand Logo */}
        <div className="flex items-center gap-2.5 px-2">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-md shadow-primary/20">
            <Store className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent dark:from-white dark:to-slate-300">
            Cafe POS
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 flex flex-col gap-1.5">
          <NavigationLink to="/" label="Dashboard" icon={LayoutDashboard} />
          <NavigationLink to="/menu" label="Menu Items" icon={Coffee} />
          <NavigationLink to="/orders" label="Active Orders" icon={ClipboardList} />
        </nav>

        {/* User Info / Footer */}
        <div className="border-t border-slate-100 dark:border-border pt-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-accent flex items-center justify-center text-slate-600 dark:text-accent-foreground">
            <User className="h-5 w-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold truncate">Alex Cashier</span>
            <span className="text-xs text-muted-foreground truncate">Role: Cashier</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Header */}
        <header className="h-16 border-b border-slate-200/80 bg-white/80 dark:bg-card/80 backdrop-blur-md px-8 flex justify-between items-center z-10 shrink-0">
          <div className="text-sm text-muted-foreground font-medium">{today}</div>
          <div className="flex items-center gap-4">
            <span className="text-xs px-2.5 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 font-semibold flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              Register Open
            </span>
          </div>
        </header>

        {/* Page Container */}
        <main className="flex-1 p-8 overflow-y-auto min-w-0 relative">
          {children}
        </main>
      </div>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/orders" element={<Orders />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
