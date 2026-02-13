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

// [검열/수정 1] 타입 정의 임포트 시 확장자 명시 (브라우저 직접 실행 최적화)
import { PartnerStats, HistoryItem, AIInsight } from './types.js';

// [검열/수정 2] 치명적 오류 해결: 'services/' 폴더 경로 제거 (현재 파일 구조 반영)
// 빌드 로그 에러 원인: "./services/geminiService" -> "./geminiService.js"
import { getPerformanceInsights } from './geminiService.js';

import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

// [검열/수정 3] TypeScript 전용 문법(React.FC) 제거 (JS 파일로 전환 시 에러 방지)
const App = () => {
  // [검열/수정 4] 제네릭 타입 문법(<...>) 제거
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

  // [검열/수정 5] 404를 유발하던 API Fetch 로직 제거 (확장 프로그램 연동에 집중)
  useEffect(() => {
    if (!isMonitoring) return;
    // 브라우저 확장 프로그램의 메시지를 기다리는 방식으로 대체됨
  }, [isMonitoring, notificationsEnabled]);

  const fetchInsights = async () => {
    setIsInsightLoading(true);
    const result = await getPerformanceInsights(stats);
    setInsights(result);
    setIsInsightLoading(false);
  };

  useEffect(() => {
    const handleExtensionMessage = (event) => {
      if (event.data && event.data.type === 'PURPLE_VISION_SYNC') {
        const bridgeData = event.data.data;
        console.log('[Purple Vision Bridge] 데이터 수신 성공:', bridgeData);

        setStats({
          clicks: bridgeData.clicks || 0,
          orders: bridgeData.orders || 0,
          revenue: bridgeData.revenue || 0,
          commission: bridgeData.commission || 0,
          conversionRate: bridgeData.clicks > 0 ? (bridgeData.orders / bridgeData.clicks) * 100 : 0
        });

        setHistory(prev => [
          {
            timestamp: new Date(),
            type: 'DATA_UPDATE',
            amount: bridgeData.revenue,
            productName: `확장 프로그램 동기화: ${bridgeData.orders}건 감지`
          },
          ...prev
        ].slice(0, 20));

        if (notificationsEnabled) {
          sendPushNotification('🔗 Bridge 동기화 완료', '브라우저 확장 프로그램으로부터 실시간 데이터를 받았습니다.');
        }
      }
    };

    window.addEventListener('message', handleExtensionMessage);
    return () => window.removeEventListener('message', handleExtensionMessage);
  }, [notificationsEnabled]);

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

  // 스타일 관련 코드 생략 (기존과 동일)
  return (
    // ... 기존 return 문 유지
  );
};

export default App;
