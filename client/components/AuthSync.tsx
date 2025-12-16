'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function AuthSync() {
  useEffect(() => {
    const sync = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        try {
          await axios.post(`${API_URL}/auth/sync`, {
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Staff',
            role: 'STAFF'
          });
          // console.log('User synced:', session.user.email);
        } catch (e) {
          console.error('Failed to sync user:', e);
        }
      }
    };
    
    sync();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
       if (_event === 'SIGNED_IN' && session?.user) {
           sync();
       }
    });

    return () => subscription.unsubscribe();
  }, []);

  return null; // Render nothing
}
