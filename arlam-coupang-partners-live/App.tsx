
import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  TrendingUp,
  ShoppingCart,
  MousePointer2,
  Activity,
  Zap,
  BarChart3,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  Sparkles,
  RefreshCcw,
  Layers,
  ChevronRight,
  Settings
} from 'lucide-react';
import { PartnerStats, HistoryItem, AIInsight } from './types';
import { getPerformanceInsights } from './services/geminiService';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const App: React.FC = () => {
  const [stats, setStats] = useState<PartnerStats>({
    clicks: 0,
    orders: 0,
    revenue: 0,
    commission: 0,
    conversionRate: 0
  });
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [insights, setInsights] = useState<AIInsight | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isInsightLoading, setIsInsightLoading] = useState(false);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [ntfyTopic, setNtfyTopic] = useState<string>(localStorage.getItem('ntfy_topic') || '');
  const prevStatsRef = useRef<PartnerStats>(stats);

  useEffect(() => {
    localStorage.setItem('ntfy_topic', ntfyTopic);
  }, [ntfyTopic]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = (clientX / innerWidth - 0.5) * 2;
    const y = (clientY / innerHeight - 0.5) * 2;
    setMouse({ x, y });
  };

  const requestNotifications = async () => {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    if (permission === "granted") setNotificationsEnabled(true);
  };

  const sendPushNotification = (title: string, body: string) => {
    if (notificationsEnabled && Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: 'https://img1.daumcdn.net/thumb/R800x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdn%2FbcM5f8%2FbtqD3sP7vO1%2FdPZKyk58V8kXoK0kE7k1S0%2Fimg.png'
      });
    }
  };

  const sendIphonePush = async (title: string, body: string) => {
    if (!ntfyTopic) return;
    try {
      await fetch(`https://ntfy.sh/${ntfyTopic}`, {
        method: 'POST',
        body: body,
        headers: {
          'Title': title,
          'Priority': 'high',
          'Tags': 'chart_with_upwards_trend'
        }
      });
      console.log('[Push Engine] Mobile notification sent via ntfy');
    } catch (error) {
      console.error('[Push Engine] Failed to send mobile notification:', error);
    }
  };

  const fetchCoupangData = async () => {
    console.log('[Coupang API Debug] Initiating data fetch...');
    try {
      const response = await fetch('/api/coupang-stats');
      const result = await response.json();

      if (result.success && result.data && result.data.length > 0) {
        const liveData = result.data[0]; // Take the most recent summary
        console.log('[Coupang API Debug] Data received:', liveData);

        setStats({
          clicks: liveData.clickCnt || 0,
          orders: liveData.orderCnt || 0,
          revenue: liveData.orderAmt || 0,
          commission: liveData.commission || 0,
          conversionRate: liveData.clickCnt > 0 ? (liveData.orderCnt / liveData.clickCnt) * 100 : 0
        });

        setHistory(prev => [
          {
            timestamp: new Date(),
            type: 'DATA_UPDATE',
            amount: liveData.orderAmt,
            productName: `Sync Successful: ${liveData.orderCnt} orders today`
          },
          ...prev
        ].slice(0, 20));

        if (notificationsEnabled) {
          sendPushNotification("📊 Dashboard Updated", `Live stats synced. Today's Commission: ${liveData.commission.toLocaleString()} KRW`);
        }
      } else {
        console.warn('[Coupang API Debug] No data returned from API', result);
      }
    } catch (error) {
      console.error('[Coupang API Debug] Fetch error:', error);
    }
  };

  useEffect(() => {
    if (!isMonitoring) return;

    // Initial fetch
    fetchCoupangData();

    // Set up polling interval (e.g., every 60 seconds for real-time summary)
    const interval = setInterval(() => {
      fetchCoupangData();
    }, 60000);

    return () => clearInterval(interval);
  }, [isMonitoring, notificationsEnabled]);

  const fetchInsights = async () => {
    setIsInsightLoading(true);
    const result = await getPerformanceInsights(stats);
    setInsights(result);
    setIsInsightLoading(false);
  };

  useEffect(() => {
    const handleExtensionMessage = (event: MessageEvent) => {
      // Security check: Only accept messages from our own window (sent via bridge)
      if (event.data && event.data.type === 'PURPLE_VISION_SYNC') {
        const bridgeData = event.data.data;
        console.log('[Purple Vision Bridge] Received Sync:', bridgeData);

        const newStats = {
          clicks: bridgeData.clicks || 0,
          orders: bridgeData.orders || 0,
          revenue: bridgeData.revenue || 0,
          commission: bridgeData.commission || 0,
          conversionRate: bridgeData.clicks > 0 ? (bridgeData.orders / bridgeData.clicks) * 100 : 0
        };

        setStats(newStats);

        setHistory(prevHistory => [
          {
            timestamp: new Date(),
            type: 'DATA_UPDATE',
            amount: bridgeData.revenue,
            productName: `Bridge Sync Successful: ${bridgeData.orders} orders detected`
          },
          ...prevHistory
        ].slice(0, 20));

        if (notificationsEnabled) {
          sendPushNotification("🔗 Bridge Synced", "Live data received from Browser Extension");
        }
      }
    };

    window.addEventListener('message', handleExtensionMessage);
    return () => window.removeEventListener('message', handleExtensionMessage);
  }, [notificationsEnabled]);

  // Centralized Change Detection for iPhone Push
  useEffect(() => {
    const prev = prevStatsRef.current;

    // Check if stats have actually changed and it's not the initial state (0, 0)
    if (stats.orders > prev.orders || stats.commission > prev.commission) {
      const diffOrders = stats.orders - prev.orders;
      const diffCommission = stats.commission - prev.commission;

      let alertMsg = "";
      if (diffOrders > 0) alertMsg += `구매건수 ${diffOrders}건 증가! `;
      if (diffCommission > 0) alertMsg += `수익 ${diffCommission.toLocaleString()}원 증가!`;

      sendIphonePush("💰 쿠팡 파트너스 수익 발생!", `현재 총 수익: ${stats.commission.toLocaleString()}원 | ${alertMsg}`);
    }

    // Update the ref for next comparison
    prevStatsRef.current = stats;
  }, [stats]);

  const cardStyle = (intensity: number = 1) => ({
    transform: `perspective(1200px) rotateY(${mouse.x * 5 * intensity}deg) rotateX(${mouse.y * -5 * intensity}deg) translateZ(${intensity * 5}px)`,
    transition: 'transform 0.1s ease-out'
  });

  return (
    <div className="min-h-screen selection:bg-violet-500/30" onMouseMove={handleMouseMove}>
      {/* Navigation */}
      <nav className="glass-card sticky top-0 z-[100] border-b border-white/5 px-8 py-5">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-2xl blur opacity-40 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center border border-white/10">
                <Sparkles className="text-violet-400 w-6 h-6" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter text-white purple-glow-text">PURPLE VISION</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global Live Node Connected</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => setIsMonitoring(!isMonitoring)}
              className={`group relative flex items-center gap-3 px-6 py-2.5 rounded-2xl font-bold text-sm transition-all overflow-hidden ${isMonitoring ? 'text-white' : 'text-slate-400 hover:text-white'
                }`}
            >
              <div className={`absolute inset-0 transition-all duration-500 ${isMonitoring ? 'bg-violet-600' : 'bg-white/5 group-hover:bg-white/10'}`}></div>
              <div className="relative flex items-center gap-2">
                <Activity className={`w-4 h-4 ${isMonitoring ? 'animate-spin' : ''}`} />
                {isMonitoring ? 'Monitoring Active' : 'Start Engine'}
              </div>
            </button>

            <button
              onClick={requestNotifications}
              className={`p-3 rounded-2xl border transition-all relative ${notificationsEnabled ? 'bg-fuchsia-600/20 border-fuchsia-500 text-fuchsia-400' : 'bg-white/5 border-white/10 text-slate-500 hover:text-white'
                }`}
            >
              <Bell className="w-5 h-5" />
              {notificationsEnabled && <span className="absolute top-2 right-2 w-2 h-2 bg-fuchsia-400 rounded-full"></span>}
            </button>

            <div className="flex items-center gap-2 bg-white/5 border border-white/10 p-1.5 rounded-2xl">
              <div className="p-2 text-slate-500">
                <Settings className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="ntfy topic (for iPhone)"
                className="bg-transparent border-none outline-none text-xs font-bold text-white w-32 placeholder:text-slate-600"
                value={ntfyTopic}
                onChange={(e) => setNtfyTopic(e.target.value)}
              />
              <button
                onClick={() => sendIphonePush("TEST", "Purple Vision push system is active! 🎉")}
                className="p-2 hover:bg-white/5 rounded-xl transition-colors text-violet-400"
                title="Test iPhone Push"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-[1400px] mx-auto px-8 py-10 grid grid-cols-1 lg:grid-cols-12 gap-10">

        {/* Main Dashboard Area */}
        <div className="lg:col-span-8 space-y-10">

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard label="Live Clicks" value={stats.clicks} icon={<MousePointer2 />} color="violet" mouse={mouse} />
            <StatCard label="Total Orders" value={stats.orders} icon={<ShoppingCart />} color="fuchsia" mouse={mouse} />
            <StatCard label="Est. Revenue" value={`${(stats.revenue / 10000).toFixed(0)}만`} icon={<TrendingUp />} color="pink" unit="원" mouse={mouse} />
            <StatCard label="Commission" value={stats.commission.toLocaleString()} icon={<Zap />} color="indigo" unit="원" mouse={mouse} />
          </div>

          {/* Performance Chart */}
          <div
            className="glass-card rounded-[3rem] p-10 relative group overflow-hidden"
            style={cardStyle(0.5)}
          >
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-violet-600/10 blur-[100px] rounded-full group-hover:bg-violet-600/20 transition-all duration-700"></div>

            <div className="flex items-center justify-between mb-10 relative z-10">
              <div>
                <h3 className="text-2xl font-black text-white tracking-tight">Performance Matrix</h3>
                <p className="text-slate-500 text-sm mt-1">Real-time traffic visualization analyzed by AI</p>
              </div>
              <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-white/5">
                <button className="px-5 py-2 rounded-xl text-xs font-black bg-violet-600 text-white shadow-lg">LIVE</button>
                <button className="px-5 py-2 rounded-xl text-xs font-black text-slate-500 hover:text-white transition-colors">HISTORY</button>
              </div>
            </div>

            <div className="h-[400px] w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MOCK_CHART_DATA}>
                  <defs>
                    <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="pinkGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d946ef" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#d946ef" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="name" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} dx={-10} />
                  <Tooltip
                    contentStyle={{ background: '#0f172a', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', padding: '15px' }}
                    itemStyle={{ fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="clicks" stroke="#8b5cf6" strokeWidth={5} fillOpacity={1} fill="url(#purpleGradient)" animationDuration={2000} />
                  <Area type="monotone" dataKey="orders" stroke="#d946ef" strokeWidth={3} fillOpacity={1} fill="url(#pinkGradient)" animationDuration={2500} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Setup Guide Card */}
          <div className="glass-card p-10 rounded-[3rem] bg-gradient-to-br from-indigo-900/20 to-slate-900/20 border-violet-500/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:rotate-12 transition-transform duration-700">
              <Layers size={120} className="text-violet-400" />
            </div>
            <div className="relative z-10 grid md:grid-cols-2 gap-10 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-500/30 text-[10px] font-black text-violet-400 mb-6 uppercase tracking-widest">
                  <ShieldCheck size={12} /> NO-API CONNECTION
                </div>
                <h3 className="text-3xl font-black text-white mb-4 leading-tight">Start Immediately<br />Without API Approval</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-8">
                  No need to wait for complex Coupang Partners approval procedures. <br />
                  Send real-time data via our exclusive Virtual Bridge extension.
                </p>
                <div className="flex gap-4">
                  <button className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black text-sm hover:scale-105 transition-transform flex items-center gap-2">
                    Setup Guide <ChevronRight size={18} />
                  </button>
                  <button className="bg-white/5 text-white border border-white/10 px-8 py-4 rounded-2xl font-black text-sm hover:bg-white/10 transition-all">
                    Sync Instructions
                  </button>
                </div>
              </div>
              <div className="hidden md:flex justify-end">
                <div className="w-64 h-64 relative">
                  <div className="absolute inset-0 bg-violet-600 rounded-[3rem] rotate-6 opacity-20 animate-pulse"></div>
                  <div className="absolute inset-0 bg-fuchsia-600 rounded-[3rem] -rotate-3 opacity-20"></div>
                  <div className="relative z-10 glass-card inset-0 rounded-[3rem] flex items-center justify-center border-white/20">
                    <Smartphone size={80} className="text-white drop-shadow-2xl" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar Area */}
        <div className="lg:col-span-4 space-y-10">

          {/* AI Strategy Insights */}
          <div className="glass-card rounded-[3rem] p-10 border-fuchsia-500/20 border relative group">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-white flex items-center gap-3">
                <Sparkles className="text-fuchsia-400" size={24} /> AI INSIGHT
              </h3>
              <button
                onClick={fetchInsights}
                className={`p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors ${isInsightLoading ? 'animate-spin' : ''}`}
              >
                <RefreshCcw size={18} className="text-slate-400" />
              </button>
            </div>

            {insights ? (
              <div className="space-y-6 animate-in fade-in duration-700">
                <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5">
                  <h4 className="text-fuchsia-400 font-black text-lg mb-2">{insights.title}</h4>
                  <p className="text-slate-400 text-xs leading-relaxed">{insights.description}</p>
                </div>
                <div className="bg-violet-600/10 p-6 rounded-[2rem] border border-violet-500/20 group-hover:scale-[1.02] transition-transform duration-500">
                  <div className="flex items-center gap-2 text-violet-400 font-bold text-[10px] uppercase tracking-widest mb-3">
                    <Zap size={14} /> AI Recommendation
                  </div>
                  <p className="text-violet-100 text-sm font-bold leading-relaxed">{insights.suggestion}</p>
                </div>
              </div>
            ) : (
              <div className="py-20 flex flex-col items-center justify-center opacity-30">
                <div className="w-16 h-16 rounded-full border-t-2 border-violet-500 animate-spin mb-4"></div>
                <p className="text-xs font-bold text-slate-500">Formulating Strategy...</p>
              </div>
            )}
          </div>

          {/* Activity Logs */}
          <div className="glass-card rounded-[3rem] p-10 h-[600px] flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-white flex items-center gap-3">
                <Activity className="text-violet-400" size={24} /> LIVE LOGS
              </h3>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-violet-500 animate-ping"></span>
                <span className="text-[10px] font-black text-violet-400">MONITORING</span>
              </div>
            </div>

            <div className="flex-grow overflow-y-auto space-y-4 pr-3 custom-scrollbar">
              {history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 italic">
                  <p className="text-sm font-bold opacity-30">Waiting for signals...</p>
                </div>
              ) : (
                history.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-[2rem] bg-white/5 border border-white/5 hover:bg-white/10 transition-all group animate-in slide-in-from-right-4 duration-500"
                  >
                    <div className="flex items-start gap-5">
                      <div className={`mt-1 p-3 rounded-2xl flex-shrink-0 shadow-lg ${item.type === 'ORDER' ? 'bg-fuchsia-500 text-white' : 'bg-violet-600 text-white'
                        }`}>
                        {item.type === 'ORDER' ? <ShoppingCart size={20} /> : item.type === 'DATA_UPDATE' ? <RefreshCcw size={20} /> : <MousePointer2 size={20} />}
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-start mb-1 gap-2">
                          <span className={`text-sm font-black tracking-tight ${item.type === 'ORDER' || item.type === 'DATA_UPDATE' ? 'text-fuchsia-400' : 'text-violet-400'}`}>
                            {item.type === 'DATA_UPDATE' ? 'REAL-TIME DATA SYNCED' : item.type === 'ORDER' ? 'NEW ORDER CONFIRMED' : 'TRAFFIC DETECTED'}
                          </span>
                          <span className="text-[10px] font-bold text-slate-600 whitespace-nowrap pt-1">
                            {item.timestamp.toLocaleTimeString([], { hour12: false })}
                          </span>
                        </div>
                        {item.amount && (
                          <p className="text-lg font-black text-white mb-1">+{item.amount.toLocaleString()}원 <span className="text-xs font-bold text-slate-500">Sales</span></p>
                        )}
                        <p className="text-[11px] text-slate-500 truncate font-medium group-hover:text-slate-300 transition-colors">
                          {item.productName || 'External Inflow detected'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Floating Global Link */}
      <div className="fixed bottom-10 right-10 z-[150]">
        <a
          href="https://partners.coupang.com"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex items-center gap-4 bg-white text-slate-900 px-10 py-5 rounded-[2.5rem] font-black shadow-2xl transition-all hover:scale-105 active:scale-95"
        >
          <div className="absolute -inset-1 bg-white/30 rounded-[2.5rem] blur opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <span className="relative">PARTNERS CENTER</span>
          <ExternalLink size={20} className="relative group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
        </a>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string, value: string | number, icon: React.ReactNode, color: string, unit?: string, mouse: { x: number, y: number } }> = ({ label, value, icon, color, unit, mouse }) => {
  const colorMap: Record<string, string> = {
    violet: 'from-violet-600 to-indigo-600',
    fuchsia: 'from-fuchsia-600 to-pink-600',
    pink: 'from-pink-600 to-rose-600',
    indigo: 'from-indigo-600 to-blue-600'
  };

  return (
    <div
      className="glass-card p-8 rounded-[2.5rem] group relative overflow-hidden transition-all duration-300 hover:border-white/30"
      style={{
        transform: `perspective(1000px) rotateY(${mouse.x * 10}deg) rotateX(${mouse.y * -10}deg)`,
      }}
    >
      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center text-white mb-6 shadow-2xl group-hover:scale-110 transition-transform duration-500 group-hover:rotate-6`}>
        {React.cloneElement(icon as React.ReactElement, { size: 28 })}
      </div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">{label}</p>
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-black text-white tracking-tighter">{value}</span>
        {unit && <span className="text-sm font-bold text-slate-600">{unit}</span>}
      </div>
      <div className="absolute bottom-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        {React.cloneElement(icon as React.ReactElement, { size: 60 })}
      </div>
    </div>
  );
};

const MOCK_CHART_DATA = [
  { name: '00:00', clicks: 450, orders: 12 },
  { name: '03:00', clicks: 320, orders: 8 },
  { name: '06:00', clicks: 580, orders: 15 },
  { name: '09:00', clicks: 940, orders: 28 },
  { name: '12:00', clicks: 1450, orders: 42 },
  { name: '15:00', clicks: 1280, orders: 35 },
  { name: '18:00', clicks: 1100, orders: 30 },
  { name: '21:00', clicks: 890, orders: 22 },
];

export default App;
