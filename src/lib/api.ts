import func2url from '../../backend/func2url.json';

const URLS = func2url as Record<string, string>;

function getSessionId(): string {
  return localStorage.getItem('session_id') || '';
}

async function request(fn: string, params: Record<string, string>, options: RequestInit = {}): Promise<Response> {
  const qs = new URLSearchParams(params).toString();
  const url = `${URLS[fn]}${qs ? '?' + qs : ''}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  const sid = getSessionId();
  if (sid) headers['X-Session-Id'] = sid;

  return fetch(url, { ...options, headers });
}

// Auth
export async function apiLogin(email: string, password: string) {
  const res = await request('auth', { action: 'login' }, { method: 'POST', body: JSON.stringify({ email, password }) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка входа');
  return data as { session_id: string; user: User };
}

export async function apiLogout() {
  await request('auth', { action: 'logout' }, { method: 'POST' });
  localStorage.removeItem('session_id');
}

export async function apiGetMe() {
  const res = await request('auth', { action: 'me' });
  if (!res.ok) return null;
  const data = await res.json();
  return data.user as User;
}

export async function apiUpdateProfile(fields: Partial<User>) {
  const res = await request('auth', { action: 'profile' }, { method: 'PUT', body: JSON.stringify(fields) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data.user as User;
}

// Orders
export async function apiGetOrders() {
  const res = await request('orders', {});
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data.orders as Order[];
}

export async function apiGetOrder(id: number) {
  const res = await request('orders', { id: String(id) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data.order as Order;
}

export async function apiCreateOrder(payload: CreateOrderPayload) {
  const res = await request('orders', {}, { method: 'POST', body: JSON.stringify(payload) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data.order as Order;
}

export async function apiUpdateOrder(id: number, fields: Partial<Order>) {
  const res = await request('orders', { id: String(id) }, { method: 'PUT', body: JSON.stringify(fields) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data.order as Order;
}

export async function apiChangeStatus(id: number, status: string) {
  const res = await request('orders', { id: String(id), action: 'status' }, { method: 'PUT', body: JSON.stringify({ status }) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data.order as Order;
}

// Users
export async function apiGetUsers() {
  const res = await request('users', {});
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data.users as User[];
}

export async function apiCreateUser(payload: Partial<User> & { password?: string }) {
  const res = await request('users', {}, { method: 'POST', body: JSON.stringify(payload) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data.user as User;
}

export async function apiUpdateUser(id: number, fields: Partial<User> & { password?: string }) {
  const res = await request('users', { id: String(id) }, { method: 'PUT', body: JSON.stringify(fields) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data.user as User;
}

// Files
export async function apiGetFiles(orderId: number) {
  const res = await request('files', { order_id: String(orderId) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data.files as OrderFile[];
}

export async function apiUploadFile(orderId: number, file: File, fileType = 'receipt') {
  const data64 = await fileToBase64(file);
  const res = await request('files', {}, {
    method: 'POST',
    body: JSON.stringify({ order_id: orderId, filename: file.name, file_type: fileType, data: data64, content_type: file.type }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data.file as OrderFile;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Types
export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'master';
  speciality?: string;
  rating?: number;
  is_active?: boolean;
}

export interface Order {
  id: number;
  client_name: string;
  client_phone: string;
  address: string;
  work_type: string;
  description?: string;
  master_id?: number;
  master_name?: string;
  status: 'new' | 'accepted' | 'in_progress' | 'done' | 'cancelled';
  scheduled_at?: string;
  prepaid: number;
  parts_cost: number;
  final_amount: number;
  master_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateOrderPayload {
  client_name: string;
  client_phone: string;
  address: string;
  work_type: string;
  description?: string;
  master_id?: number;
  scheduled_at?: string;
  prepaid?: number;
}

export interface OrderFile {
  id: number;
  filename: string;
  file_url: string;
  file_type: string;
  created_at: string;
}
