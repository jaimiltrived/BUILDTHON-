export interface DashboardMetrics {
  revenue: number;
  revenue_formatted: string;
  revenue_delta: string;
  profit: number;
  profit_formatted: string;
  profit_delta: string;
  margin: number;
  margin_formatted: string;
  margin_delta: string;
  health_score: number;
  health_status: string;
  health_delta: string;
  total_customers?: number;
  total_revenue?: number;
  total_profit?: number;
  risk_score?: string;
  financial_health?: number;
}

export interface MonthlyChartDataPoint {
  name: string;
  raw_month?: string;
  revenue: number;
  profit: number;
  orders?: number;
  revenue_formatted?: string;
  profit_formatted?: string;
}

export interface RiskItem {
  id: string;
  category: string;
  level: string;
  score: number;
  impact_amount: number;
  impact_formatted: string;
  probability: number;
  trend: string;
  description: string;
  root_cause: string;
  affected_segment: string;
  mitigation: string;
  confidence: number;
}

export interface LedgerItem {
  id: string;
  question: string;
  proposed_action: string;
  ai_recommendation: string;
  expected_profit: string;
  risk: string;
  confidence: number;
  status: string;
  date: string;
  similar_to?: string;
}

export interface PredictionEvaluation {
  id: string;
  title: string;
  category: string;
  date: string;
  predicted: {
    revenue?: number;
    profit?: number;
    churn?: number;
    revenue_change_pct?: string;
    profit_change_pct?: string;
    churn_pct?: string;
  };
  actual: {
    revenue?: number;
    profit?: number;
    churn?: number;
    revenue_change_pct?: string;
    profit_change_pct?: string;
    churn_pct?: string;
  };
  accuracy: {
    overall_accuracy: number;
    revenue_accuracy?: number;
    profit_accuracy?: number;
    churn_accuracy?: number;
  };
  observed_outcome: string;
  ai_lesson: string;
}

export interface PredictionVsRealityData {
  overall_prediction_accuracy: number;
  revenue_prediction_accuracy: number;
  profit_prediction_accuracy: number;
  churn_prediction_accuracy: number;
  tracked_decisions_count: number;
  recent_evaluations: PredictionEvaluation[];
}

export interface AuditTrailItem {
  step: number;
  title: string;
  timestamp: string;
  actor: string;
  details: string;
  evidence_tag?: string;
}
