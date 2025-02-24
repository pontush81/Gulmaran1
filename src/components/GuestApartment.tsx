import React from 'react';
import { supabase } from '../lib/supabase';
import type { GuestApartmentBooking } from '../types';
import { sv } from 'date-fns/locale';
import { isWithinInterval, parseISO, startOfDay, endOfDay, format } from 'date-fns';
import { Calendar, Plus, X, Menu, User, Mail, Phone, Edit, Trash2, ChevronLeft, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

export function GuestApartment() {
  const [bookings, setBookings] = React.useState<GuestApartmentBooking[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const [showAddBooking, setShowAddBooking] = React.useState(false);
  const [showEditBooking, setShowEditBooking] = React.useState<string | null>(null);
  const [newBooking, setNewBooking] = React.useState({
    start_date: '',
    end_date: '',
    guest_name: '',
    guest_count: 1,
    phone: '',
    email: '',
    notes: ''
  });
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    try {
      const { data } = await supabase
        .from('guest_apartment_bookings')
        .select(`
          *,
          booked_by:users(email)
        `)
        .order('start_date');

      setBookings(data || []);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddBooking(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('guest_apartment_bookings')
        .insert([{
          ...newBooking,
          status: 'pending',
          payment_status: 'pending',
          total_price: 0
        }]);

      if (error) throw error;

      setShowAddBooking(false);
      setNewBooking({
        start_date: '',
        end_date: '',
        guest_name: '',
        guest_count: 1,
        phone: '',
        email: '',
        notes: ''
      });
      loadBookings();
    } catch (error: any) {
      setError('Kunde inte lägga till bokning: ' + error.message);
    }
  }

  async function handleUpdateBooking(e: React.FormEvent) {
    e.preventDefault();
    if (!showEditBooking) return;

    try {
      const { error } = await supabase
        .from('guest_apartment_bookings')
        .update({
          ...newBooking,
          updated_at: new Date().toISOString(),
          payment_status: 'pending',
          total_price: 0
        })
        .eq('id', showEditBooking);

      if (error) throw error;

      setShowEditBooking(null);
      setNewBooking({
        start_date: '',
        end_date: '',
        guest_name: '',
        guest_count: 1,
        phone: '',
        email: '',
        notes: ''
      });
      loadBookings();
    } catch (error: any) {
      setError('Kunde inte uppdatera bokning: ' + error.message);
    }
  }

  async function handleDeleteBooking(bookingId: string) {
    try {
      const { error } = await supabase
        .from('guest_apartment_bookings')
        .delete()
        .eq('id', bookingId);

      if (error) throw error;
      loadBookings();
    } catch (error: any) {
      setError('Kunde inte ta bort bokning: ' + error.message);
    }
  }

  const isDateBooked = (date: Date) => {
    return bookings
      .filter(booking => booking.status === 'approved')
      .some(booking => {
        const start = startOfDay(parseISO(booking.start_date));
        const end = endOfDay(parseISO(booking.end_date));
        return isWithinInterval(date, { start, end });
      });
  };

  const getBookingInfo = (date: Date) => {
    return bookings.find(booking => {
      const start = startOfDay(parseISO(booking.start_date));
      const end = endOfDay(parseISO(booking.end_date));
      return isWithinInterval(date, { start, end });
    });
  };

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDay.getDay() || 7; // 1-7 (måndag-söndag)
    const daysInMonth = lastDay.getDate();

    const days = [];
    const weeks = [];

    // Lägg till tomma dagar i början
    for (let i = 1; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Lägg till alla dagar i månaden
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push(date);
    }

    // Dela upp dagarna i veckor
    while (days.length > 0) {
      weeks.push(days.splice(0, 7));
    }

    // Fyll ut sista veckan med tomma dagar
    const lastWeek = weeks[weeks.length - 1];
    while (lastWeek.length < 7) {
      lastWeek.push(null);
    }

    return weeks;
  };

  const changeMonth = (delta: number) => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
      </div>
    );
  }

  const weeks = generateCalendarDays();
  const weekDays = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 mr-2 flex-shrink-0" />
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={() => setShowAddBooking(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          Boka gästlägenhet
        </button>
      </div>

      {/* Kalender */}
      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Bokningskalender</h2>
          <div className="flex items-center justify-between sm:justify-end gap-4">
            <button
              onClick={() => changeMonth(-1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            <span className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100 min-w-[140px] text-center">
              {format(currentMonth, 'MMMM yyyy', { locale: sv })}
            </span>
            <button
              onClick={() => changeMonth(1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            >
              <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-full">
              <div className="grid grid-cols-7 border-b dark:border-gray-700">
                {weekDays.map(day => (
                  <div
                    key={day}
                    className="py-2 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 text-center"
                  >
                    {day}
                  </div>
                ))}
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="grid grid-cols-7">
                    {week.map((date, dayIndex) => {
                      if (!date) {
                        return (
                          <div
                            key={`empty-${dayIndex}`}
                            className="border-r dark:border-gray-700 last:border-r-0 p-1 sm:p-2 h-16 sm:h-24"
                          />
                        );
                      }

                      const isBooked = isDateBooked(date);
                      const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                      const bookingInfo = getBookingInfo(date);

                      return (
                        <div
                          key={date.getTime()}
                          className={cn(
                            "border-r dark:border-gray-700 last:border-r-0 p-1 sm:p-2 h-16 sm:h-24",
                            isBooked && "bg-red-50 dark:bg-red-900/20"
                          )}
                        >
                          <div
                            className={cn(
                              "w-6 h-6 sm:w-8 sm:h-8 mx-auto flex items-center justify-center rounded-full text-sm sm:text-base text-gray-900 dark:text-gray-100",
                              isToday && "border-2 border-blue-600 dark:border-blue-400",
                              isBooked && "bg-red-600 text-white dark:text-white"
                            )}
                          >
                            {date.getDate()}
                          </div>
                          {bookingInfo && (
                            <div className="mt-1 text-xs text-gray-600 dark:text-gray-300 truncate">
                              {bookingInfo.guest_name || bookingInfo.booked_by?.email}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bokningslista */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Alla bokningar</h2>
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="border dark:border-gray-700 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center text-gray-900 dark:text-gray-100">
                    <Calendar className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />
                    {format(parseISO(booking.start_date), 'yyyy-MM-dd')} - {format(parseISO(booking.end_date), 'yyyy-MM-dd')}
                  </div>
                  <div className="flex items-center text-gray-900 dark:text-gray-100">
                    <User className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />
                    {booking.guest_name}
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Mail className="h-5 w-5 mr-2" />
                    {booking.email || booking.booked_by?.email}
                  </div>
                  {booking.phone && (
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Phone className="h-5 w-5 mr-2" />
                      {booking.phone}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setShowEditBooking(booking.id);
                      setNewBooking({
                        start_date: booking.start_date,
                        end_date: booking.end_date,
                        guest_name: booking.guest_name,
                        guest_count: booking.guest_count,
                        phone: booking.phone || '',
                        email: booking.email || '',
                        notes: booking.notes || ''
                      });
                    }}
                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteBooking(booking.id)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bokningsformulär */}
      {(showAddBooking || showEditBooking) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {showEditBooking ? 'Redigera bokning' : 'Boka gästlägenhet'}
              </h2>
              <button
                onClick={() => {
                  setShowAddBooking(false);
                  setShowEditBooking(null);
                  setNewBooking({
                    start_date: '',
                    end_date: '',
                    guest_name: '',
                    guest_count: 1,
                    phone: '',
                    email: '',
                    notes: ''
                  });
                }}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={showEditBooking ? handleUpdateBooking : handleAddBooking} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Från datum
                </label>
                <input
                  type="date"
                  value={newBooking.start_date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setNewBooking({ ...newBooking, start_date: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Till datum
                </label>
                <input
                  type="date"
                  value={newBooking.end_date}
                  min={newBooking.start_date || new Date().toISOString().split('T')[0]}
                  onChange={(e) => setNewBooking({ ...newBooking, end_date: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Namn
                </label>
                <input
                  type="text"
                  value={newBooking.guest_name}
                  onChange={(e) => setNewBooking({ ...newBooking, guest_name: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  E-post
                </label>
                <input
                  type="email"
                  value={newBooking.email}
                  onChange={(e) => setNewBooking({ ...newBooking, email: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Telefonnummer
                </label>
                <input
                  type="tel"
                  value={newBooking.phone}
                  onChange={(e) => setNewBooking({ ...newBooking, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Meddelande (valfritt)
                </label>
                <textarea
                  value={newBooking.notes}
                  onChange={(e) => setNewBooking({ ...newBooking, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-100"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddBooking(false);
                    setShowEditBooking(null);
                    setNewBooking({
                      start_date: '',
                      end_date: '',
                      guest_name: '',
                      guest_count: 1,
                      phone: '',
                      email: '',
                      notes: ''
                    });
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {showEditBooking ? 'Uppdatera' : 'Boka'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}