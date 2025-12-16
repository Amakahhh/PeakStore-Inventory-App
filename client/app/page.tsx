'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Store, User, Mail, Lock, ArrowRight } from 'lucide-react';

// Use local validation or env var for API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        // LOGIN FLOW
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push('/dashboard');
      } else {
        // SIGNUP FLOW
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: name }
          }
        });

        if (error) throw error;
        
        if (data.user) {
            // Sync with backend - attempt but don't block login strictly if it's a network blip
            // Ideally we want it to succeed, but if the main auth worked, the user exists in Supabase.
            try {
                await axios.post(`${API_URL}/auth/sync`, {
                    id: data.user.id,
                    email: data.user.email,
                    name: name,
                    role: 'STAFF' // Default role
                });
            } catch (syncErr) {
                console.error("Backend sync failed but Supabase auth succeeded:", syncErr);
                // Optional: Show a warning or just proceed if the backend can lazy-create
            }
            
            router.push('/dashboard');
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans animate-fade-in">
      <div className="bg-white p-8 md:p-10 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100 relative overflow-hidden">
        
        {/* Decorative Background Blob */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-gray-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gray-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

        <div className="text-center mb-10 relative z-10">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-black text-white rounded-xl mb-4 shadow-lg">
                <Store className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-gray-900 mb-2">Peak<span className="text-blue-600">Store</span></h1>
            <h2 className="text-lg font-bold text-gray-700">
                {isLogin ? 'Welcome Back' : ' '}
            </h2>
            <p className="text-sm font-medium text-gray-400">
                {isLogin ? 'Enter your credentials to access the dashboard' : 'Create your secure account to get started'}
            </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm font-bold flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5 relative z-10">
          {!isLogin && (
             <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-black transition-colors" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-transparent rounded-xl focus:outline-none focus:border-black/5 focus:bg-white focus:ring-2 focus:ring-black/5 font-bold text-gray-900 placeholder:text-gray-400 transition-all shadow-sm"
                      required={!isLogin}
                    />
                </div>
             </div>
          )}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Email Address</label>
            <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-black transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-transparent rounded-xl focus:outline-none focus:border-black/5 focus:bg-white focus:ring-2 focus:ring-black/5 font-bold text-gray-900 placeholder:text-gray-400 transition-all shadow-sm"
                  required
                />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">Password</label>
             <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-black transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-transparent rounded-xl focus:outline-none focus:border-black/5 focus:bg-white focus:ring-2 focus:ring-black/5 font-bold text-gray-900 placeholder:text-gray-400 transition-all shadow-sm"
                  required
                />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-4 rounded-xl hover:bg-gray-800 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transform active:scale-[0.98] transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed mt-8"
          >
            {loading ? (
                <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> PROCESSING...</span>
            ) : (
                <span className="flex items-center gap-2">{isLogin ? 'SIGN IN' : 'CREATE ACCOUNT'} <ArrowRight className="h-4 w-4" /></span>
            )}
          </button>
        </form>

        <div className="mt-8 text-center relative z-10">
            <button 
                onClick={() => {
                    setIsLogin(!isLogin);
                    setError(null);
                }}
                className="text-gray-500 hover:text-black font-bold text-sm transition-colors flex items-center justify-center gap-1 mx-auto"
            >
                {isLogin ? (
                    <>New here? <span className="text-black underline">Create an account</span></>
                ) : (
                    <>Already a member? <span className="text-black underline">Sign in</span></>
                )}
            </button>
        </div>
      </div>
    </div>
  );
}
