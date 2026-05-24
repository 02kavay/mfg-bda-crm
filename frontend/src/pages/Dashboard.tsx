import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell 
} from 'recharts';
import { 
  LogOut, LayoutGrid, KanbanSquare, TrendingUp, IndianRupee, Target, Briefcase, 
  Sun, Moon, Users, ShoppingCart 
} from 'lucide-react';

interface StatsSummary {
  totalPipeline: number;
  totalDeals: number;
  wonPipeline: number;
  wonDeals: number;
  activePipeline: number;
  activeDeals: number;
  conversionRate: number;
}

interface StageData {
  stage: string;
  count: number;
  value: number;
}

interface ProductData {
  name: string;
  value: number;
  quantity: number;
}

interface LeaderboardItem {
  name: string;
  email: string;
  totalSales: number;
  dealsWon: number;
}

interface DashboardData {
  summary: StatsSummary;
  pipelineDistribution: StageData[];
  productDistribution: ProductData[];
  leaderboard: LeaderboardItem[];
}

const COLORS = ['#0f766e', '#14b8a6', '#0d9488', '#2dd4bf', '#5eead4', '#99f6e4'];

const Dashboard = () => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const navigate = useNavigate();
  
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const isManager = currentUser?.role === 'MANAGER' || currentUser?.role === 'ADMIN';

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/dashboard/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(response.data);
      } catch (err) {
        console.error('Failed to fetch dashboard metrics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [token]);

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-teal-700 dark:text-teal-400 font-semibold animate-pulse">Loading manufacturing analytics...</div>
      </div>
    );
  }

  const summary = data?.summary;

  return (
    <div className="flex h-screen flex-col bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      
      {/* Top Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <Briefcase className="h-6 w-6 text-teal-700 dark:text-teal-400" />
          <h1 className="text-xl font-extrabold tracking-tight text-teal-800 dark:text-teal-400">MfgCRM</h1>
          <span className="hidden sm:inline text-xs rounded bg-slate-100 px-2.5 py-0.5 font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            {currentUser?.role} Mode
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-1.5 mr-2">
            <Link to="/" className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">
              <LayoutGrid className="h-4 w-4" />
              Metrics
            </Link>
            <Link to="/pipeline" className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
              <KanbanSquare className="h-4 w-4" />
              Pipeline
            </Link>
          </nav>

          <button 
            onClick={toggleDarkMode}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <div className="flex items-center gap-3 border-l border-slate-200 pl-4 dark:border-slate-700">
            <div className="text-right hidden md:block">
              <p className="text-sm font-bold">{currentUser?.name}</p>
              <p className="text-xs text-slate-400">{currentUser?.email}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-700 dark:hover:text-red-400 p-2 text-slate-500 dark:bg-slate-800 dark:text-slate-400 transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Workspace Content */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
        
        {/* Welcome Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-teal-800 to-teal-950 p-6 rounded-2xl text-white shadow-lg">
          <div>
            <h2 className="text-2xl font-bold">Welcome back, {currentUser?.name}!</h2>
            <p className="text-sm text-teal-200/80 mt-1">
              {isManager 
                ? "Here is the sales tracking and pipeline performance dashboard for your manufacturing business."
                : "Manage your assigned manufacturing clients, log calls, follow-ups, and update your pipeline."
              }
            </p>
          </div>
          <Link 
            to="/pipeline" 
            className="self-start md:self-center px-4 py-2 bg-teal-500 hover:bg-teal-400 text-teal-950 font-bold rounded-lg shadow transition text-sm"
          >
            View Sales Pipeline
          </Link>
        </div>

        {/* Core KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          
          <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="rounded-lg bg-teal-50 p-3 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400">
              <IndianRupee className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Pipeline</p>
              <h3 className="text-xl font-bold mt-0.5">₹{summary?.totalPipeline.toLocaleString('en-IN')}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{summary?.totalDeals} Total Deals</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="rounded-lg bg-emerald-50 p-3 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Closed Won Sales</p>
              <h3 className="text-xl font-bold mt-0.5">₹{summary?.wonPipeline.toLocaleString('en-IN')}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{summary?.wonDeals} Closed Wins</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="rounded-lg bg-amber-50 p-3 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Pipeline</p>
              <h3 className="text-xl font-bold mt-0.5">₹{summary?.activePipeline.toLocaleString('en-IN')}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{summary?.activeDeals} Active Negotiations</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="rounded-lg bg-indigo-50 p-3 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400">
              <Target className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Conversion Win-Rate</p>
              <h3 className="text-xl font-bold mt-0.5">{summary?.conversionRate}%</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Won / Total Closed Leads</p>
            </div>
          </div>

        </div>

        {/* Charts & Graphs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Pipeline Stage Distribution */}
          <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-300 mb-6">Lead Pipeline Distribution by Value (₹)</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.pipelineDistribution || []} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                  <XAxis dataKey="stage" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="value" name="Deal Value (₹)" fill="#0f766e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Product Type Breakdown */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-300 mb-6">Sales Volume by Product</h3>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.productDistribution || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {(data?.productDistribution || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              {(data?.productDistribution || []).map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                  <span className="text-slate-500 dark:text-slate-400 truncate max-w-[100px]">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Manager-only Team Performance Metric Leaderboard */}
        {isManager && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2 mb-6">
              <Users className="h-5 w-5 text-teal-700 dark:text-teal-400" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">BDA Performance Leaderboard</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-400 uppercase tracking-wider dark:bg-slate-800">
                  <tr>
                    <th className="px-6 py-3 rounded-l-lg">Rank</th>
                    <th className="px-6 py-3">Associate Name</th>
                    <th className="px-6 py-3">Email Address</th>
                    <th className="px-6 py-3">Closed Won Deals</th>
                    <th className="px-6 py-3 rounded-r-lg text-right">Total Revenue Won</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data?.leaderboard && data.leaderboard.length > 0 ? (
                    data.leaderboard.map((item, index) => (
                      <tr key={item.email} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-6 py-4 font-bold text-teal-700 dark:text-teal-400">#{index + 1}</td>
                        <td className="px-6 py-4 font-semibold text-slate-800 dark:text-white">{item.name}</td>
                        <td className="px-6 py-4">{item.email}</td>
                        <td className="px-6 py-4">{item.dealsWon} Won</td>
                        <td className="px-6 py-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          ₹{item.totalSales.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-slate-400">No BDA sales data recorded yet. Set deals to "WON" stage to see leaderboard updates.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default Dashboard;
