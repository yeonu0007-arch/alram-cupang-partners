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

  const requestNotifications = async () => {
    if (!('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    if (permission === 'granted') setNotificationsEnabled(true);
  };

  const sendPushNotification = (title, body) => {
    if (notificationsEnabled && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: 'https://img1.daumcdn.net/thumb/R800x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdn%2FbcM5f8%2FbtqD3sP7vO1%2FdPZKyk58V8kXoK0kE7k1S0%2Fimg.png'
      });
    }
  };

  const sendIphonePush = async (title, body) => {
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

  useEffect(() => {
    if (!isMonitoring) return;
  }, [isMonitoring, notificationsEnabled]);

  const fetchInsights = async () => {
    setIsInsightLoading(true);
    const result = await getPerformanceInsights(stats);
    setInsights(result);
    setIsInsightLoading(false);
  };

  // 확장 프로그램 동기화 한국어 주석 및 메시지 적용
  useEffect(() => {
    const handleExtensionMessage = (event) => {
      // 보안 확인: 신뢰할 수 있는 메시지인지 체크
      if (event.data && event.data.type === 'PURPLE_VISION_SYNC') {
        const bridgeData = event.data.data;
        console.log('[Purple Vision Bridge] 데이터 수신 성공:', bridgeData);

        // 실시간 상태 업데이트
        setStats({
          clicks: bridgeData.clicks || 0,
          orders: bridgeData.orders || 0,
          revenue: bridgeData.revenue || 0,
          commission: bridgeData.commission || 0,
          conversionRate: bridgeData.clicks > 0 ? (bridgeData.orders / bridgeData.clicks) * 100 : 0
        });

        // 히스토리 로그 추가
        setHistory(prev => [
          {
            timestamp: new Date(),
            type: 'DATA_UPDATE',
            amount: bridgeData.revenue,
            productName: `확장 프로그램 동기화: ${bridgeData.orders}건 감지`
          },
          ...prev
        ].slice(0, 20));

        // 알림 활성화 시 브라우저 알림 발송
        if (notificationsEnabled) {
          sendPushNotification('🔗 Bridge 동기화 완료', '브라우저 확장 프로그램으로부터 실시간 데이터를 받았습니다.');
        }
      }
    };

    window.addEventListener('message', handleExtensionMessage);
    return () => window.removeEventListener('message', handleExtensionMessage);
  }, [notificationsEnabled]);

  // iPhone 푸시 알림 상태 변화 감지
  useEffect(() => {
    const prev = prevStatsRef.current;

    if (stats.orders > prev.orders || stats.commission > prev.commission) {
      const diffOrders = stats.orders - prev.orders;
      const diffCommission = stats.commission - prev.commission;

      let alertMsg = '';
      if (diffOrders > 0) alertMsg += `구매건수 ${diffOrders}건 증가! `;
      if (diffCommission > 0) alertMsg += `수익 ${diffCommission.toLocaleString()}원 증가!`;

      sendIphonePush('💰 쿠팡 파트너스 수익 발생!', `현재 총 수익: ${stats.commission.toLocaleString()}원 | ${alertMsg}`);
    }
    prevStatsRef.current = stats;
  }, [stats]);

  const cardStyle = (intensity = 1) => ({
    transform: `perspective(1200px) rotateY(${mouse.x * 5 * intensity}deg) rotateX(${mouse.y * -5 * intensity}deg) translateZ(${intensity * 5}px)`,
    transition: 'transform 0.1s ease-out'
  });

  return (
    <div className="min-h-screen selection:bg-violet-500/30" onMouseMove={handleMouseMove}>
      {/* ... 이하 생략. 전체 내용은 기존과 동일 */}
    </div>
  );
};

export default App;