'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { createUserAction } from '@/app/manager/staff/create/actions';
import { Loader2, Plus, User, Mail, Shield } from 'lucide-react';

export default function CreateManagerPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [sessionToken, setSessionToken] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUser(session.user);
        setSessionToken(session.access_token);
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    // Explicitly set the role as 'manager'
    formData.set('role', 'manager');
    const result = await createUserAction(formData, sessionToken);

    if (result.error) {
      setMessage({ type: 'error', text: result.error });
    } else if (result.success) {
      setMessage({ type: 'success', text: result.message || 'Manager created successfully!' });
      (e.target as HTMLFormElement).reset();
    }
    
    setIsSubmitting(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4 font-sans text-zinc-50 relative">
      <button 
        onClick={() => window.location.href = '/admin/managers'}
        className="absolute top-8 left-8 px-4 py-2 text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
      >
        &larr; Back to Managers Directory
      </button>
      <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl">
        <div className="flex flex-col space-y-1.5 p-6 pb-4">
          <h3 className="font-semibold leading-none tracking-tight text-2xl">Register Restaurant Manager</h3>
          <p className="text-sm text-zinc-400 mt-1.5">
            Add a new manager to the system. Managers can configure products, tables, staff, and discounts for their stores.
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
              <label className="text-sm font-medium leading-none text-zinc-300">Manager Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                <input 
                  name="name" 
                  type="text" 
                  required 
                  placeholder="e.g. David Miller"
                  className="flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 pl-10 text-sm ring-offset-zinc-950 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 transition-all"
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
                  placeholder="e.g. david@cafe.local"
                  className="flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 pl-10 text-sm ring-offset-zinc-950 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none text-zinc-300">Temporary Password</label>
              <div className="relative">
                <Shield className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                <input 
                  name="password" 
                  type="password" 
                  required 
                  placeholder="••••••••"
                  className="flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 pl-10 text-sm ring-offset-zinc-950 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 transition-all"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="inline-flex h-10 w-full items-center justify-center whitespace-nowrap rounded-md bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-900 ring-offset-zinc-950 transition-colors hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Manager
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
