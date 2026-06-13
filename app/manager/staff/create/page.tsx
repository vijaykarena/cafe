'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { createUserAction } from './actions';
import { Loader2, Plus, User, Mail, Shield, Building2, Eye, EyeOff } from 'lucide-react';

export default function CreateUserPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [sessionToken, setSessionToken] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [managers, setManagers] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUser(session.user);
        setSessionToken(session.access_token);
        
        // Fetch role from profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
          
        if (profile) {
          setUserRole(profile.role);
          
          // If admin, fetch all existing managers for the assignment dropdown
          if (profile.role === 'admin') {
            const { data: managersData } = await supabase
              .from('profiles')
              .select('id, name')
              .eq('role', 'manager');
            if (managersData) setManagers(managersData);
          }
        }
      }
      setLoading(false);
    };
    fetchSession();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-white">
        <p className="text-xl font-medium text-zinc-400">Please log in to access this page.</p>
      </div>
    );
  }

  const role = userRole;
  
  if (role !== 'admin' && role !== 'manager') {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-white">
        <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-8 text-center shadow-lg">
          <Shield className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h2 className="text-2xl font-semibold text-red-500">Access Denied</h2>
          <p className="mt-2 text-zinc-400">You do not have permission to create users.</p>
        </div>
      </div>
    );
  }

  const allowedRoles = role === 'admin' 
    ? ['manager', 'cook', 'cashier', 'waiter'] 
    : ['cook', 'cashier', 'waiter'];

  const needsManagerSelection = role === 'admin' && !!selectedRole && selectedRole !== 'manager';

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const result = await createUserAction(formData, sessionToken);

    if (result.error) {
      setMessage({ type: 'error', text: result.error });
    } else if (result.success) {
      setMessage({ type: 'success', text: result.message || 'User created successfully!' });
      (e.target as HTMLFormElement).reset();
      setSelectedRole('');
    }
    
    setIsSubmitting(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4 font-sans text-zinc-50 relative">
      <button 
        onClick={() => window.location.href = '/manager/staff'}
        className="absolute top-8 left-8 px-4 py-2 text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
      >
        &larr; Back to Staff List
      </button>
      <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl">
        <div className="flex flex-col space-y-1.5 p-6 pb-4">
          <h3 className="font-semibold leading-none tracking-tight text-2xl">Create Team Member</h3>
          <p className="text-sm text-zinc-400 mt-1.5">
            Add a new employee to your organization. Logged in as <span className="font-medium text-blue-400 capitalize">{role}</span>.
          </p>
        </div>

        <div className="p-6 pt-0">
          {message && (
            <div className={`mb-6 flex items-center gap-2 rounded-md p-4 text-sm font-medium border ${message.type === 'error' ? 'border-red-900/50 bg-red-950/50 text-red-400' : 'border-emerald-900/50 bg-emerald-950/50 text-emerald-400'}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none text-zinc-300">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                <input 
                  name="name" 
                  type="text" 
                  required 
                  placeholder="e.g. John Doe"
                  className="flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 pl-10 text-sm ring-offset-zinc-950 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none text-zinc-300">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                <input 
                  name="email" 
                  type="email" 
                  required 
                  placeholder="e.g. john@cafe.local"
                  className="flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 pl-10 text-sm ring-offset-zinc-950 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 focus-visible:ring-offset-2 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none text-zinc-300">Temporary Password</label>
              <div className="relative">
                <Shield className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                <input 
                  name="password" 
                  type={showPassword ? "text" : "password"} 
                  required 
                  placeholder="••••••••"
                  className="flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 pl-10 pr-10 text-sm ring-offset-zinc-950 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 focus-visible:ring-offset-2 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-300 transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none text-zinc-300">Job Role</label>
              <select 
                name="role" 
                required 
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm ring-offset-zinc-950 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>option]:bg-zinc-900 transition-all capitalize"
              >
                <option value="" disabled>Select a role...</option>
                {allowedRoles.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {needsManagerSelection && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="text-sm font-medium leading-none text-blue-400">Assign to Manager (Restaurant)</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 h-4 w-4 text-blue-500" />
                  <select 
                    name="manager_id" 
                    required 
                    defaultValue=""
                    className="flex h-10 w-full items-center justify-between rounded-md border border-blue-900/50 bg-blue-950/20 px-3 py-2 pl-10 text-sm text-blue-100 ring-offset-zinc-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 [&>option]:bg-zinc-900 transition-all"
                  >
                    <option value="" disabled>Select a manager...</option>
                    {managers.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                    {managers.length === 0 && (
                      <option value="" disabled>No managers found. Create a manager first!</option>
                    )}
                  </select>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isSubmitting || (needsManagerSelection && managers.length === 0)}
              className="inline-flex h-10 w-full items-center justify-center whitespace-nowrap rounded-md bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-900 ring-offset-zinc-950 transition-colors hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create User
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
