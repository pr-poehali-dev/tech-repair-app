// Глобальное состояние приложения (in-memory store)
export type OrderStatus = 'new' | 'progress' | 'done' | 'cancelled' | 'sd';

export interface Order {
  id: string;
  client: string;
  phone: string;
  address: string;
  type: string;
  description: string;
  master: string;
  masterId: number;
  time: string;
  date: string;
  status: OrderStatus;
  prepaid: number;
  total: number;
  masterEarning: number;
}

export interface Master {
  id: number;
  name: string;
  phone: string;
  login: string;
  password: string;
  speciality: string;
  rating: number;
  orders: number;
  status: 'busy' | 'free' | 'offline';
  revenue: number;
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  desc: string;
  time: string;
  read: boolean;
}

let _orders: Order[] = [
  { id: '№1042', client: 'Петров А.В.', phone: '+7 (911) 222-33-44', address: 'ул. Ленина, 24, кв. 7', type: 'Замена смесителя', description: 'Клиент жалуется на текущий смеситель на кухне. Нужно заменить полностью. Доступ есть, ключи у консьержа.', master: 'Карпов И.', masterId: 1, time: '09:00', date: 'Сегодня', status: 'progress', prepaid: 1500, total: 4500, masterEarning: 1800 },
  { id: '№1041', client: 'Сидорова М.П.', phone: '+7 (912) 333-44-55', address: 'пр. Мира, 88, кв. 31', type: 'Прочистка канализации', description: 'Засор в ванной и на кухне. Клиент пробовал химией — не помогло. Предположительно тряпка в трубе.', master: 'Волков Д.', masterId: 2, time: '11:30', date: 'Сегодня', status: 'new', prepaid: 0, total: 3200, masterEarning: 1280 },
  { id: '№1040', client: 'Иванов С.Г.', phone: '+7 (913) 444-55-66', address: 'ул. Садовая, 5, кв. 2', type: 'Установка унитаза', description: 'Нужно установить новый унитаз. Клиент купил сам — Cersanit. Старый демонтировать и забрать.', master: 'Карпов И.', masterId: 1, time: '14:00', date: 'Сегодня', status: 'sd', prepaid: 2000, total: 6800, masterEarning: 2720 },
  { id: '№1039', client: 'Козлова Е.Н.', phone: '+7 (914) 555-66-77', address: 'ул. Пушкина, 12, кв. 19', type: 'Течь трубы', description: 'Лопнула труба под раковиной в ванной. Небольшая течь, клиент временно подставил ведро.', master: 'Новиков А.', masterId: 3, time: '16:00', date: 'Вчера', status: 'done', prepaid: 1000, total: 2800, masterEarning: 1120 },
  { id: '№1038', client: 'Морозов В.В.', phone: '+7 (915) 666-77-88', address: 'ул. Гагарина, 3, кв. 45', type: 'Замена радиатора', description: 'Радиатор отопления течёт в районе резьбового соединения. Радиатор старый, чугунный, клиент хочет заменить на биметалл.', master: 'Волков Д.', masterId: 2, time: '10:00', date: 'Вчера', status: 'cancelled', prepaid: 0, total: 8500, masterEarning: 0 },
  { id: '№1037', client: 'Алексеева Т.К.', phone: '+7 (916) 777-88-99', address: 'ул. Советская, 67, кв. 8', type: 'Монтаж счётчиков воды', description: 'Установить счётчики на горячую и холодную воду. Опломбировать. Нужны документы для управляющей компании.', master: 'Новиков А.', masterId: 3, time: '13:00', date: 'Вчера', status: 'done', prepaid: 500, total: 3600, masterEarning: 1440 },
];

let _masters: Master[] = [
  { id: 1, name: 'Карпов Иван Сергеевич', phone: '+7 (912) 345-67-89', login: 'karpov', password: 'karp2024', speciality: 'Сантехника', rating: 4.9, orders: 142, status: 'busy', revenue: 48600 },
  { id: 2, name: 'Волков Дмитрий Андреевич', phone: '+7 (903) 211-44-55', login: 'volkov', password: 'vlk2024', speciality: 'Сантехника / Отопление', rating: 4.7, orders: 98, status: 'busy', revenue: 32400 },
  { id: 3, name: 'Новиков Алексей Игоревич', phone: '+7 (916) 788-22-11', login: 'novikov', password: 'nov2024', speciality: 'Канализация', rating: 4.8, orders: 76, status: 'free', revenue: 27800 },
  { id: 4, name: 'Семёнов Пётр Вячеславович', phone: '+7 (926) 133-90-40', login: 'semenov', password: 'sem2024', speciality: 'Отопление', rating: 4.5, orders: 54, status: 'offline', revenue: 18200 },
];

let _notifications: Notification[] = [
  { id: 1, type: 'new', title: 'Новая заявка №1042', desc: 'Петров А.В. — замена смесителя, ул. Ленина, 24', time: '2 мин назад', read: false },
  { id: 2, type: 'status', title: 'Мастер прибыл', desc: 'Карпов И. принял заявку №1041 — Сидорова М.П.', time: '18 мин назад', read: false },
  { id: 3, type: 'payment', title: 'Поступила предоплата', desc: '2 000 ₽ от Иванова С.Г. по заявке №1040', time: '1 ч назад', read: false },
  { id: 4, type: 'done', title: 'Заявка выполнена', desc: '№1039 — Козлова Е.Н., Волков Д. завершил работу', time: '3 ч назад', read: true },
  { id: 5, type: 'review', title: 'Новый отзыв ⭐⭐⭐⭐⭐', desc: 'Фёдоров Н.А. оставил оценку по заявке №1036', time: '5 ч назад', read: true },
  { id: 6, type: 'new', title: 'Новая заявка №1038', desc: 'Морозов В.В. — замена радиатора, ул. Гагарина, 3', time: 'Вчера, 16:42', read: true },
];

let _nextId = 1043;

const listeners: Set<() => void> = new Set();

export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  listeners.forEach((fn) => fn());
}

export function getOrders() { return _orders; }
export function getMasters() { return _masters; }
export function getNotifications() { return _notifications; }

export function addOrder(order: Omit<Order, 'id'>) {
  const id = `№${_nextId++}`;
  _orders = [{ ...order, id }, ..._orders];
  _notifications = [{
    id: Date.now(),
    type: 'new',
    title: `Новая заявка ${id}`,
    desc: `${order.client} — ${order.type}, ${order.address}`,
    time: 'только что',
    read: false,
  }, ..._notifications];
  notify();
  return id;
}

export function updateOrderStatus(id: string, status: OrderStatus) {
  _orders = _orders.map((o) => o.id === id ? { ...o, status } : o);
  notify();
}

export function addMaster(master: Omit<Master, 'id' | 'orders' | 'status' | 'revenue' | 'rating'>) {
  const newMaster: Master = { ...master, id: Date.now(), orders: 0, status: 'offline', revenue: 0, rating: 5.0 };
  _masters = [..._masters, newMaster];
  notify();
}

export function deleteMaster(id: number) {
  _masters = _masters.filter((m) => m.id !== id);
  notify();
}

export function markAllNotificationsRead() {
  _notifications = _notifications.map((n) => ({ ...n, read: true }));
  notify();
}

export function markNotificationRead(id: number) {
  _notifications = _notifications.map((n) => n.id === id ? { ...n, read: true } : n);
  notify();
}
