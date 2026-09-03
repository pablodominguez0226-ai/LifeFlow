const API_BASE = '/api';

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Error desconocido en la red' }));
    throw new Error(errorData.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Dashboard
  getDashboard: (date?: string) =>
    fetchApi<any>(`/dashboard${date ? `?date=${encodeURIComponent(date)}` : ''}`),

  // Calendar
  getCalendar: (start?: string, end?: string) =>
    fetchApi<any[]>(
      `/calendar?start=${encodeURIComponent(start || '')}&end=${encodeURIComponent(end || '')}`
    ),
  createBlock: (data: any) =>
    fetchApi<any>('/calendar/block', { method: 'POST', body: JSON.stringify(data) }),
  updateBlock: (id: string, data: any) =>
    fetchApi<any>(`/calendar/block/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteBlock: (id: string) =>
    fetchApi<any>(`/calendar/block/${id}`, { method: 'DELETE' }),

  // Recurring Rules (Horarios Fijos / Cursadas recurrentes)
  getRecurringRules: () => fetchApi<any[]>('/recurring-rules'),
  createRecurringRule: (data: any) =>
    fetchApi<any>('/recurring-rules', { method: 'POST', body: JSON.stringify(data) }),
  updateRecurringRule: (id: string, data: any) =>
    fetchApi<any>(`/recurring-rules/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteRecurringRule: (id: string) =>
    fetchApi<any>(`/recurring-rules/${id}`, { method: 'DELETE' }),

  // Subjects & Academic
  getSubjects: (date?: string) =>
    fetchApi<any[]>(`/subjects${date ? `?date=${encodeURIComponent(date)}` : ''}`),
  getSubjectById: (id: string) => fetchApi<any>(`/subjects/${id}`),
  createSubject: (data: any) =>
    fetchApi<any>('/subjects', { method: 'POST', body: JSON.stringify(data) }),
  getExams: (date?: string) =>
    fetchApi<any[]>(`/exams${date ? `?date=${encodeURIComponent(date)}` : ''}`),
  createExam: (data: any) =>
    fetchApi<any>('/exams', { method: 'POST', body: JSON.stringify(data) }),
  getTasks: (subjectId?: string) =>
    fetchApi<any[]>(`/tasks${subjectId ? `?subjectId=${subjectId}` : ''}`),
  createTask: (data: any) =>
    fetchApi<any>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (id: string, data: any) =>
    fetchApi<any>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTask: (id: string) => fetchApi<any>(`/tasks/${id}`, { method: 'DELETE' }),
  updateTopicStatus: (id: string, status: string) =>
    fetchApi<any>(`/topics/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // Planning Engine
  generateWeek: (options: { mondayDate?: string; enableRugby?: boolean; enableMarket?: boolean; gymSessionsTarget?: number }) =>
    fetchApi<any>('/planning/generate-week', { method: 'POST', body: JSON.stringify(options) }),
  applyWeek: (proposal: any) =>
    fetchApi<any>('/planning/apply-week', { method: 'POST', body: JSON.stringify({ proposal }) }),
  planDay: (date?: string) =>
    fetchApi<any>('/planning/plan-day', { method: 'POST', body: JSON.stringify({ date }) }),
  replanTask: (taskId: string, date?: string) =>
    fetchApi<any>('/planning/replan', { method: 'POST', body: JSON.stringify({ taskId, date }) }),

  // Habits & Health
  getHabits: () => fetchApi<any[]>('/habits'),
  toggleHabit: (id: string, increment: boolean) =>
    fetchApi<any>(`/habits/${id}/toggle`, { method: 'PATCH', body: JSON.stringify({ increment }) }),
  createCheckin: (data: any) =>
    fetchApi<any>('/checkin', { method: 'POST', body: JSON.stringify(data) }),
  getCheckinHistory: () => fetchApi<any[]>('/checkin/history'),

  // Recommendations & Stats
  getRecommendations: () => fetchApi<any[]>('/recommendations'),
  dismissRecommendation: (id: string) =>
    fetchApi<any>(`/recommendations/${id}/dismiss`, { method: 'PATCH' }),
  getStatistics: (date?: string) =>
    fetchApi<any>(`/statistics${date ? `?date=${encodeURIComponent(date)}` : ''}`),
};
