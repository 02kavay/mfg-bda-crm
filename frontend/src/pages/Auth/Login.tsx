import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-100 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold text-teal-800 dark:text-teal-400">MfgCRM</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manufacturing BDA Sales Portal
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950/20 dark:text-red-400">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleLogin}>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Email Address</label>
            <input
              type="email"
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              placeholder="e.g. aditya@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Password</label>
            <input
              type="password"
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-teal-700 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 focus:outline-none disabled:opacity-50 dark:bg-teal-600 dark:hover:bg-teal-500"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="text-center text-sm">
          <Link to="/register" className="font-medium text-teal-700 hover:underline dark:text-teal-400">
            Create an account
          </Link>
        </div>

        <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
          <p className="text-xs text-center text-slate-400">
            Demo BDA: <span className="font-semibold">aditya@gmail.com</span><br/>
            Demo Manager: <span className="font-semibold">manager@gmail.com</span><br/>
            Password: <span className="font-semibold">password123</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
