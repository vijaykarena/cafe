'use server';

import { supabaseServer, supabaseAdmin } from '@/lib/supabase-server';

export async function createUserAction(formData: FormData, creatorToken: string) {
  try {
    // 1. Verify the creator's identity and role using their token
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(creatorToken);
    
    if (authError || !user) {
      return { error: 'Unauthorized: Invalid token.' };
    }
    
    // Fetch creator's role from profiles using admin client to guarantee access
    const { data: creatorProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !creatorProfile) {
      return { error: 'Unauthorized: Could not verify user role.' };
    }
    
    const creatorRole = creatorProfile.role;
    const targetRole = formData.get('role') as string;
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    let manager_id = formData.get('manager_id') as string | null;

    if (!email || !password || !name || !targetRole) {
      return { error: 'All fields are required.' };
    }

    // 2. Enforce Role Hierarchy and Manager ID logic
    if (creatorRole === 'admin') {
      const allowedRoles = ['manager', 'cook', 'cashier', 'waiter'];
      if (!allowedRoles.includes(targetRole)) {
        return { error: `Admin cannot create role: ${targetRole}` };
      }
      
      // If admin creates an employee, they MUST assign a manager.
      if (['cook', 'cashier', 'waiter'].includes(targetRole)) {
        if (!manager_id) {
          return { error: 'You must select a Manager for this employee.' };
        }
      } else if (targetRole === 'manager') {
        manager_id = null; // Managers do not have a manager
      }
    } else if (creatorRole === 'manager') {
      const allowedRoles = ['cook', 'cashier', 'waiter'];
      if (!allowedRoles.includes(targetRole)) {
        return { error: `Manager cannot create role: ${targetRole}` };
      }
      // Manager implicitly sets themselves as the manager
      manager_id = user.id;
    } else {
      return { error: 'You do not have permission to create users.' };
    }

    // 3. Create the user using Supabase Admin API
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role: targetRole,
        ...(manager_id ? { manager_id } : {})
      }
    });

    if (error) {
      return { error: error.message };
    }

    return { success: true, message: `Successfully created ${targetRole}!` };
  } catch (error: any) {
    return { error: error.message || 'An unexpected error occurred.' };
  }
}
