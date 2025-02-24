export interface Section {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  created_at: string;
}

export interface BoardMeeting {
  id: string;
  date: string;
  title: string;
  created_at: string;
  updated_at: string;
  documents?: BoardMeetingDocument[];
}

export interface BoardMeetingDocument {
  id: string;
  meeting_id: string;
  name: string;
  file_path: string;
  created_at: string;
  uploaded_by: string;
}

export interface GuestApartmentBooking {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  guest_name: string;
  guest_count: number;
  phone: string;
  email: string;
  total_price: number;
  payment_status: 'pending' | 'paid' | 'refunded';
  payment_method?: 'card' | 'bank_transfer';
  notes?: string;
  created_at: string;
  updated_at: string;
  booked_by?: User;
}