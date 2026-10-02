const API_BASE = '/api';

export function getStoredToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('lifeflow_token');
  }
  return null;
}

export function setStoredToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('lifeflow_token', token);
  }
}

export function removeStoredToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('lifeflow_token');
  }
}

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Error desconocido en la red' }));
    throw new Error(errorData.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Auth
  login: async (credentials: { email: string; password: string }) => {
    const res = await fetchApi<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (res.token) {
      setStoredToken(res.token);
    }
    return res;
  },
  register: async (data: { name: string; email: string; password: string }) => {
    const res = await fetchApi<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.token) {
      setStoredToken(res.token);
    }
    return res;
  },
  getMe: () => fetchApi<{ user: any }>('/auth/me'),
  logout: () => removeStoredToken(),
  getToken: getStoredToken,
  // Dashboard
  getDashboard: (date: string = new Date().toISOString()) =>
    fetchApi<any>(`/dashboard?date=${encodeURIComponent(date)}`),

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
  getSubjects: (date: string = new Date().toISOString()) =>
    fetchApi<any[]>(`/subjects?date=${encodeURIComponent(date)}`),
  getSubjectById: (id: string) => fetchApi<any>(`/subjects/${id}`),
  createSubject: (data: any) =>
    fetchApi<any>('/subjects', { method: 'POST', body: JSON.stringify(data) }),
  getExams: (date: string = new Date().toISOString()) =>
    fetchApi<any[]>(`/exams?date=${encodeURIComponent(date)}`),
  createExam: (data: any) =>
    fetchApi<any>('/exams', { method: 'POST', body: JSON.stringify(data) }),
  updateExam: (id: string, data: any) =>
    fetchApi<any>(`/exams/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteExam: (id: string) =>
    fetchApi<any>(`/exams/${id}`, { method: 'DELETE' }),
  getTasks: (subjectId?: string) =>
    fetchApi<any[]>(`/tasks${subjectId ? `?subjectId=${subjectId}` : ''}`),
  createTask: (data: any) =>
    fetchApi<any>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (id: string, data: any) =>
    fetchApi<any>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTask: (id: string) => fetchApi<any>(`/tasks/${id}`, { method: 'DELETE' }),
  // Academic Units & Topics (Hierarchical Spaced Repetition)
  createUnit: (subjectId: string, data: { title: string; unitNumber?: number }) =>
    fetchApi<any>(`/subjects/${subjectId}/units`, { method: 'POST', body: JSON.stringify(data) }),
  getUnits: (subjectId: string) => fetchApi<any[]>(`/subjects/${subjectId}/units`),
  deleteUnit: (unitId: string) => fetchApi<any>(`/units/${unitId}`, { method: 'DELETE' }),
  createTopic: (unitId: string, data: { title: string; status?: string }) =>
    fetchApi<any>(`/units/${unitId}/topics`, { method: 'POST', body: JSON.stringify(data) }),
  updateTopic: (topicId: string, data: any) =>
    fetchApi<any>(`/topics/${topicId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTopic: (topicId: string) => fetchApi<any>(`/topics/${topicId}`, { method: 'DELETE' }),
  recordStudySession: (topicId: string, options?: { force?: boolean; action?: string }) =>
    fetchApi<any>(`/topics/${topicId}/study-session`, { method: 'POST', body: JSON.stringify(options || {}) }),
  getGuidedStudy: () => fetchApi<any>('/academic/guided-study'),
  updateTopicStatus: (id: string, status: string) =>
    fetchApi<any>(`/topics/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  logFocusSession: (subjectId: string, data: { minutes: number; taskId?: string; examId?: string; notes?: string }) =>
    fetchApi<any>(`/subjects/${subjectId}/log-focus-session`, { method: 'POST', body: JSON.stringify(data) }),

  // Planning Engine
  generateWeek: (options: { mondayDate?: string; enableRugby?: boolean; enableMarket?: boolean; gymSessionsTarget?: number }) =>
    fetchApi<any>('/planning/generate-week', { method: 'POST', body: JSON.stringify(options) }),
  applyWeek: (proposal: any) =>
    fetchApi<any>('/planning/apply-week', { method: 'POST', body: JSON.stringify({ proposal }) }),
  planDay: (date: string = new Date().toISOString()) =>
    fetchApi<any>('/planning/plan-day', { method: 'POST', body: JSON.stringify({ date }) }),
  replanTask: (taskId: string, date: string = new Date().toISOString()) =>
    fetchApi<any>('/planning/replan', { method: 'POST', body: JSON.stringify({ taskId, date }) }),

  // Habits & Health
  getHabits: () => fetchApi<any[]>('/habits'),
  createHabit: (data: any) =>
    fetchApi<any>('/habits', { method: 'POST', body: JSON.stringify(data) }),
  updateHabit: (id: string, data: any) =>
    fetchApi<any>(`/habits/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteHabit: (id: string) =>
    fetchApi<any>(`/habits/${id}`, { method: 'DELETE' }),
  toggleHabitDay: (id: string, date: string) =>
    fetchApi<any>(`/habits/${id}/toggle-date`, { method: 'PATCH', body: JSON.stringify({ date }) }),
  toggleHabit: (id: string, increment: boolean) =>
    fetchApi<any>(`/habits/${id}/toggle`, { method: 'PATCH', body: JSON.stringify({ increment }) }),
  createCheckin: (data: any) =>
    fetchApi<any>('/checkin', { method: 'POST', body: JSON.stringify(data) }),
  getCheckinHistory: () => fetchApi<any[]>('/checkin/history'),
  getPriorityTasks: (date?: string) =>
    fetchApi<any>(`/checkin/priority-tasks${date ? `?date=${encodeURIComponent(date)}` : ''}`),
  togglePriorityTask: (taskId: string, completed?: boolean) =>
    fetchApi<any>(`/checkin/priority-tasks/${taskId}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ completed }),
    }),
  addPriorityTask: (text: string) =>
    fetchApi<any>('/checkin/priority-tasks', {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),

  // Books & Reading
  getBooks: () => fetchApi<any[]>('/books'),
  createBook: (data: any) =>
    fetchApi<any>('/books', { method: 'POST', body: JSON.stringify(data) }),
  updateBook: (id: string, data: any) =>
    fetchApi<any>(`/books/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  startReadingBook: (id: string) =>
    fetchApi<any>(`/books/${id}/start`, { method: 'PATCH' }),
  deleteBook: (id: string) =>
    fetchApi<any>(`/books/${id}`, { method: 'DELETE' }),

  // Recommendations & Stats
  getRecommendations: () => fetchApi<any[]>('/recommendations'),
  dismissRecommendation: (id: string) =>
    fetchApi<any>(`/recommendations/${id}/dismiss`, { method: 'PATCH' }),
  getStatistics: (date: string = new Date().toISOString()) =>
    fetchApi<any>(`/statistics?date=${encodeURIComponent(date)}`),

  // AI Copilot
  getDailyBriefing: (date: string = new Date().toISOString()) =>
    fetchApi<any>(`/ai/daily-briefing?date=${encodeURIComponent(date)}`),
};
