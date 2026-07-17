export type Role = 'admin' | 'family' | 'volunteer';

export type Priority = 'Critical' | 'High' | 'Medium' | 'Low';
export type TaskStatus =
  | 'Not Started'
  | 'In Progress'
  | 'Waiting'
  | 'Blocked'
  | 'Completed'
  | 'Cancelled';

export interface Profile {
  id: string;
  full_name: string;
  role: Role;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface WeddingEvent {
  id: string;
  name: string;
  slug: string;
  color_key: 'mehendi' | 'haldi' | 'hasthmelap' | 'gruhshanti' | 'sangeet' | string;
  event_date: string | null;
  venue: string | null;
  description: string | null;
  is_archived: boolean;
  sort_order: number;
  created_at: string;
}

export interface Task {
  id: string;
  event_id: string | null;
  name: string;
  description: string | null;
  category: string | null;
  priority: Priority;
  status: TaskStatus;
  due_date: string | null;
  completion: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskAssignee {
  task_id: string;
  profile_id: string;
}

export interface ChecklistItem {
  id: string;
  task_id: string;
  label: string;
  is_done: boolean;
  sort_order: number;
}

export interface Comment {
  id: string;
  task_id: string;
  profile_id: string;
  body: string;
  created_at: string;
}

export interface ShoppingItem {
  id: string;
  event_id: string | null;
  category: string;
  name: string;
  quantity: number;
  budget_amount: number;
  actual_amount: number | null;
  store: string | null;
  purchased: boolean;
  assigned_to: string | null;
  receipt_url: string | null;
  created_at: string;
}

export interface BudgetLine {
  id: string;
  event_id: string | null;
  category: string;
  planned_amount: number;
  actual_amount: number;
  vendor_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface Guest {
  id: string;
  name: string;
  group_type: 'Family' | 'Friends' | 'VIP';
  side: 'Bride' | 'Groom' | 'Both';
  rsvp_status: 'Pending' | 'Confirmed' | 'Declined';
  invitation_sent: boolean;
  food_preference: 'Veg' | 'Non-Veg' | 'Jain' | 'Vegan';
  phone: string | null;
  notes: string | null;
  created_at: string;
}

export interface Vendor {
  id: string;
  name: string;
  category: string;
  phone: string | null;
  advance_paid: number;
  total_quote: number;
  balance: number;
  rating: number | null;
  notes: string | null;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  profile_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  created_at: string;
}

export type BookingStatus =
  | 'Not Booked'
  | 'Enquired'
  | 'Negotiating'
  | 'Booked'
  | 'Confirmed'
  | 'Cancelled';

export interface BookingCategory {
  key: string;
  label: string;
  lead_days: number;
  icon_key: string;
  is_custom: boolean;
  sort_order: number;
}

export interface VendorBooking {
  id: string;
  vendor_name: string;
  category_key: string;
  custom_category_label: string | null;
  event_id: string | null;
  status: BookingStatus;
  booking_date: string | null;
  contract_signed: boolean;
  advance_paid: number;
  total_amount: number;
  balance_due: number;
  final_payment_due_date: string | null;
  contact_person: string | null;
  contact_phone: string | null;
  trial_scheduled_date: string | null;
  fitting_dates: string[];
  notes: string | null;
  contract_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const BOOKING_STATUSES: BookingStatus[] = [
  'Not Booked',
  'Enquired',
  'Negotiating',
  'Booked',
  'Confirmed',
  'Cancelled',
];

export const EVENT_COLOR_MAP: Record<
  string,
  { from: string; to: string; label: string }
> = {
  mehendi: { from: '#3f7d3a', to: '#6fae52', label: 'Mehendi' },
  haldi: { from: '#e8a723', to: '#f4c95f', label: 'Haldi' },
  hasthmelap: { from: '#7d2436', to: '#bd7418', label: 'Hasthmelap' },
  gruhshanti: { from: '#c2185b', to: '#ff8a4c', label: 'Gruhshanti' },
  sangeet: { from: '#1a2456', to: '#8e97c4', label: 'Sangeet' },
};

export const TASK_STATUSES: TaskStatus[] = [
  'Not Started',
  'In Progress',
  'Waiting',
  'Blocked',
  'Completed',
  'Cancelled',
];

export const PRIORITIES: Priority[] = ['Critical', 'High', 'Medium', 'Low'];
