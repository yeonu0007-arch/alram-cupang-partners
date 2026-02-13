import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  TrendingUp,
  ShoppingCart,
  MousePointer2,
  Activity,
  Zap,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  Sparkles,
  RefreshCcw,
  Layers,
  ChevronRight,
  Settings
} from 'lucide-react';

const getPerformanceInsights = async () => {
  return { title: "분석 불가", description: "서비스 파일이 없습니다." };
};


// Recharts는 브라우저 직접 실행 시 ESM 임포트가 까다로울 수 있어, 
// 우선 차트 영역을 제외한 나머지 로직을 안전하게 변환했습니다.
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

const App = () => {
  const [stats, setStats] = useState({
    clicks: 0,
    orders: 0,
    revenue: 0,
    commission: 0,
    conversionRate: 0
  });
  const [history, setHistory] = useState([]);
  const [insights, setInsights] = useState(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isInsightLoading, setIsInsightLoading] = useState(false);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [ntfyTopic, setNtfyTopic] = useState(localStorage.getItem('ntfy_topic') || '');
  const prevStatsRef = useRef(stats);

  useEffect(() => {
    localStorage.setItem('ntfy_topic', ntfyTopic);
  }, [ntfyTopic]);

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = (clientX / innerWidth - 0.5) * 2;
    const y = (clientY / innerHeight - 0.5) * 2;
    setMouse({ x, y });
  };

  const sendIphonePush = async (title, body) => {
    if (!ntfyTopic) return;
    try {
      await fetch(`https://ntfy.sh/${ntfyTopic}`, {
        method: 'POST',
        body: body,
        headers: { 'Title': title, 'Priority': 'high', 'Tags': 'chart_with_upwards_trend' }
      });
    } catch (error) {
      console.error('[Push Engine] Error:', error);
    }
  };

  useEffect(() => {
    const handleExtensionMessage = (event) => {
      if (event.data && event.data.type === 'PURPLE_VISION_SYNC') {
        const bridgeData = event.data.data;
        setStats({
          clicks: bridgeData.clicks || 0,
          orders: bridgeData.orders || 0,
          revenue: bridgeData.revenue || 0,
          commission: bridgeData.commission || 0,
          conversionRate: bridgeData.clicks > 0 ? (bridgeData.orders / bridgeData.clicks) * 100 : 0
        });
        setHistory(prev => [{
          timestamp: new Date(),
          type: 'DATA_UPDATE',
          amount: bridgeData.revenue,
          productName: `Bridge Sync: ${bridgeData.orders} orders`
        }, ...prev].slice(0, 20));
      }
    };
    window.addEventListener('message', handleExtensionMessage);
    return () => window.removeEventListener('message', handleExtensionMessage);
  }, []);

  // [핵심] 브라우저 직접 실행을 위해 JSX를 React.createElement로 변환
  // UI 구조가 매우 복잡하므로, 우선 화면이 뜨는지 확인하기 위해 메인 레이아웃을 생성합니다.
  return React.createElement('div', { 
    className: "min-h-screen bg-[#050811] text-white p-8",
    onMouseMove: handleMouseMove 
  }, 
    React.createElement('nav', { className: "glass-card p-5 mb-10 flex justify-between items-center" },
      React.createElement('h1', { className: "text-2xl font-bold purple-glow-text" }, "PURPLE VISION LIVE"),
      React.createElement('div', { className: "flex gap-4" },
        React.createElement('button', { 
          onClick: () => setIsMonitoring(!isMonitoring),
          className: `px-6 py-2 rounded-xl font-bold ${isMonitoring ? 'bg-violet-600' : 'bg-white/10'}`
        }, isMonitoring ? "Monitoring..." : "Start Engine")
      )
    ),
    React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" },
      // 스탯 카드들 (예시로 하나만 구성)
      React.createElement('div', { className: "glass-card p-6 rounded-3xl border border-white/10" },
        React.createElement('p', { className: "text-slate-500 text-xs uppercase" }, "Commission"),
        React.createElement('h2', { className: "text-3xl font-black" }, `${stats.commission.toLocaleString()}원`)
      )
    ),
    React.createElement('div', { className: "mt-10 p-10 glass-card rounded-[3rem] text-center" },
      React.createElement('p', { className: "text-slate-400" }, "현재 브라우저 직접 실행 모드로 변환 중입니다."),
      React.createElement('p', { className: "text-violet-400 font-bold" }, "확장 프로그램에서 데이터를 보내면 실시간으로 반영됩니다.")
    )
  );
};

export default App;
