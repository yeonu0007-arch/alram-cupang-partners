
export interface PartnerStats {
  clicks: number;
  orders: number;
  revenue: number;
  commission: number;
  conversionRate: number;
}

export interface HistoryItem {
  timestamp: Date;
  type: 'CLICK' | 'ORDER' | 'DATA_UPDATE';
  amount?: number;
  productName?: string;
}

export interface AIInsight {
  title: string;
  description: string;
  suggestion: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}
