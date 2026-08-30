import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient';
import type { DashboardMetrics, MonthlyChartDataPoint, PredictionVsRealityData, AuditTrailItem } from './mockData';

// Query Keys
export const queryKeys = {
  dashboard: (orgId: string, role: string) => ['dashboard', orgId, role] as const,
  liveBaseline: ['live-baseline'] as const,
  monthlyTrend: ['monthly-trend'] as const,
  engineStatus: ['engine-status'] as const,
  risks: (orgId: string) => ['risks', orgId] as const,
  ledger: (orgId: string) => ['ledger', orgId] as const,
  predictionVsReality: (orgId: string) => ['predictionVsReality', orgId] as const,
  memory: (orgId: string) => ['memory', orgId] as const,
  auditTrail: (orgId: string) => ['auditTrail', orgId] as const,
  users: (orgId: string) => ['users', orgId] as const,
  organizations: ['organizations'] as const,
};

// 1. Dashboard & Financial Metrics Queries
export function useDashboardQuery(orgId: string = 'default-org', role: string = 'CFO') {
  return useQuery({
    queryKey: queryKeys.dashboard(orgId, role),
    queryFn: () => apiClient.get<DashboardMetrics>('/api/data/dashboard-metrics'),
    staleTime: 10000,
    refetchInterval: 15000,
  });
}

export function useLiveBaselineQuery() {
  return useQuery({
    queryKey: queryKeys.liveBaseline,
    queryFn: () => apiClient.get<any>('/api/data/live-baseline'),
    staleTime: 10000,
    refetchInterval: 15000,
  });
}

export function useMonthlyTrendQuery() {
  return useQuery({
    queryKey: queryKeys.monthlyTrend,
    queryFn: () => apiClient.get<MonthlyChartDataPoint[]>('/api/data/monthly-trend'),
    staleTime: 15000,
  });
}

// 2. Engine Status Query (Live Ollama / Llama 3 Telemetry)
export function useEngineStatusQuery() {
  return useQuery({
    queryKey: queryKeys.engineStatus,
    queryFn: () => apiClient.get<{ is_llm: boolean; mode: string; label: string; subtext: string; model_name?: string }>('/api/ai/status'),
    refetchInterval: 5000,
  });
}

// 3. Simulation Mutation
export function useSimulationMutation() {
  return useMutation({
    mutationFn: async ({
      percentage_increase,
      decision_type,
      custom_text,
    }: {
      percentage_increase: number;
      decision_type: string;
      custom_text?: string;
    }) => {
      const [simRes, aiRes] = await Promise.all([
        apiClient.post<any>('/api/simulations/simulate-price', {
          percentage_increase,
          decision_type,
          custom_text,
        }),
        apiClient.post<any>('/api/ai/analyze', {
          decision_type,
          parameter_value: percentage_increase,
          description: custom_text,
        }),
      ]);
      return { simulation: simRes, analysis: aiRes };
    },
  });
}

// 3b. Autonomous Market & Financial Research Mutation (Live LLaMA 3)
export function useResearchMutation() {
  return useMutation({
    mutationFn: async ({
      topic,
      focus_area,
    }: {
      topic: string;
      focus_area?: string;
    }) => {
      return apiClient.post<any>('/api/ai/research', { topic, focus_area });
    },
  });
}

// 4. Decision War Room Query
export function useWarRoomQuery() {
  return useQuery({
    queryKey: ['war-room'],
    queryFn: () => apiClient.get<any>('/api/war-room/compare'),
    staleTime: 10000,
  });
}

// 5. Risk Center Query
export function useRiskQuery(orgId: string = 'default-org') {
  return useQuery({
    queryKey: queryKeys.risks(orgId),
    queryFn: () => apiClient.get<any>('/api/risk/center'),
    staleTime: 15000,
  });
}

// 6. Decision Ledger Query & Mutations
export function useLedgerQuery(orgId: string = 'default-org') {
  return useQuery({
    queryKey: queryKeys.ledger(orgId),
    queryFn: () => apiClient.get<any[]>('/api/ledger/'),
    staleTime: 10000,
    refetchInterval: 10000,
  });
}

export function useUpdateLedgerStatusMutation(orgId: string = 'default-org') {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.patch(`/api/ledger/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ledger(orgId) });
    },
  });
}

export function useLogDecisionMutation(orgId: string = 'default-org') {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (decision: {
      question: string;
      proposed_action: string;
      ai_recommendation: string;
      expected_profit: string;
      risk: string;
      confidence: number;
    }) => apiClient.post('/api/ledger/', decision),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ledger(orgId) });
    },
  });
}

// 7. Prediction vs Reality Query & Outcome Mutation
export function usePredictionVsRealityQuery(orgId: string = 'default-org') {
  return useQuery({
    queryKey: queryKeys.predictionVsReality(orgId),
    queryFn: () => apiClient.get<PredictionVsRealityData>('/api/memory/prediction-vs-reality'),
    staleTime: 15000,
  });
}

export function useRecordActualMutation(orgId: string = 'default-org') {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      decision_id: string;
      actual_revenue: number;
      actual_profit: number;
      actual_churn: number;
      notes: string;
    }) => apiClient.post('/api/memory/record-actual', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.predictionVsReality(orgId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.memory(orgId) });
    },
  });
}

// 8. AI Memory Query
export function useAIMemoryQuery(orgId: string = 'default-org') {
  return useQuery({
    queryKey: queryKeys.memory(orgId),
    queryFn: () => apiClient.get<any[]>('/api/memory/history'),
    staleTime: 15000,
  });
}

// 9. Audit Trail Query (Real DB Lineage & Causal Execution)
export function useAuditTrailQuery(orgId: string = 'default-org') {
  return useQuery({
    queryKey: queryKeys.auditTrail(orgId),
    queryFn: () => apiClient.get<AuditTrailItem[]>('/api/audit/timeline'),
    staleTime: 15000,
  });
}

// 10. Admin Queries
export function useUsersQuery(orgId: string = 'default-org') {
  return useQuery({
    queryKey: queryKeys.users(orgId),
    queryFn: () => apiClient.get<any[]>('/api/users/'),
  });
}

export function useOrganizationsQuery() {
  return useQuery({
    queryKey: queryKeys.organizations,
    queryFn: () => apiClient.get<any[]>('/api/organizations/'),
  });
}

// 11. AI Finance Controller & Reconciliation Queries (Track 04)
export function useReconciliationBatchQuery() {
  return useQuery({
    queryKey: ['reconciliation-batch'],
    queryFn: () => apiClient.get<any>('/api/reconciliation/batch'),
    staleTime: 60000,
  });
}

export function useReconciliationRunQuery() {
  return useQuery({
    queryKey: ['reconciliation-run'],
    queryFn: () => apiClient.get<any>('/api/reconciliation/run'),
    staleTime: 30000,
  });
}

export function useReconciliationAIQuery() {
  return useQuery({
    queryKey: ['reconciliation-ai'],
    queryFn: () => apiClient.post<any>('/api/reconciliation/analyze'),
    staleTime: 30000,
  });
}

export function useRunReconciliationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params?: { force_new_batch?: boolean }) =>
      apiClient.post<any>(`/api/reconciliation/run?force_new_batch=${params?.force_new_batch ? 'true' : 'false'}`),
    onSuccess: (data) => {
      queryClient.setQueryData(['reconciliation-run'], data);
      queryClient.invalidateQueries({ queryKey: ['reconciliation-batch'] });
      queryClient.invalidateQueries({ queryKey: ['reconciliation-ai'] });
      queryClient.invalidateQueries({ queryKey: ['cash-forecast'] });
    },
  });
}

export function useAnalyzeReconciliationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post<any>('/api/reconciliation/analyze'),
    onSuccess: (data) => {
      queryClient.setQueryData(['reconciliation-ai'], data);
    },
  });
}

export function useResolveExceptionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { exception_id: string; resolution_action: string; notes?: string }) =>
      apiClient.post<any>('/api/reconciliation/resolve-exception', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconciliation-run'] });
      queryClient.invalidateQueries({ queryKey: ['reconciliation-batch'] });
      queryClient.invalidateQueries({ queryKey: ['reconciliation-ai'] });
      queryClient.invalidateQueries({ queryKey: ['cash-forecast'] });
    },
  });
}

export function useCashForecastQuery() {
  return useQuery({
    queryKey: ['cash-forecast'],
    queryFn: () => apiClient.get<any>('/api/reconciliation/cash-forecast'),
    staleTime: 30000,
  });
}

// 12. Enterprise Machine Learning Queries & Mutations
export function useMLMetricsQuery() {
  return useQuery({
    queryKey: ['ml-metrics'],
    queryFn: () => apiClient.get<any>('/api/ml/metrics'),
    staleTime: 30000,
  });
}

export function useOptimizePriceQuery() {
  return useQuery({
    queryKey: ['ml-optimize-price'],
    queryFn: () => apiClient.post<any>('/api/ml/optimize-price', {}),
    staleTime: 60000,
  });
}

export function usePredictChurnMutation() {
  return useMutation({
    mutationFn: (params: { price_delta_percentage: number }) =>
      apiClient.post<any>('/api/ml/predict-churn', params),
  });
}

export function useRetrainMLMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post<any>('/api/ml/retrain', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ml-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['ml-optimize-price'] });
    },
  });
}


