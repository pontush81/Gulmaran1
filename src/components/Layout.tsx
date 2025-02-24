import React from 'react';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { Home as HomeIcon, LogOut, Users, FileText, Menu, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { ThemeToggle } from './ThemeToggle';

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
      return;
    }
    
    const { data } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    setIsAdmin(data?.role === 'admin');
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Top navigation bar */}
      <nav className="bg-white dark:bg-gray-800 shadow-lg fixed w-full z-10 transition-colors">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <Link to="/" className="flex items-center">
              <HomeIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <span className="ml-2 text-gray-900 dark:text-gray-100 font-semibold hidden sm:inline">
                BRF Gulmåran
              </span>
              <span className="ml-2 text-gray-900 dark:text-gray-100 font-semibold sm:hidden">
                BRF Gulmåran
              </span>
            </Link>
            
            {/* Desktop navigation */}
            <div className="hidden sm:flex items-center space-x-4">
              <ThemeToggle />
              {isAdmin && (
                <>
                  <Link
                    to="/admin"
                    className={cn(
                      "flex items-center transition-colors",
                      location.pathname === '/admin'
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                    )}
                  >
                    <Users className="h-5 w-5" />
                    <span className="ml-2">Användare</span>
                  </Link>
                  <Link
                    to="/pages"
                    className={cn(
                      "flex items-center transition-colors",
                      location.pathname === '/pages'
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                    )}
                  >
                    <FileText className="h-5 w-5" />
                    <span className="ml-2">Sidor</span>
                  </Link>
                </>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span className="ml-2">Logga ut</span>
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="sm:hidden flex items-center space-x-2">
              <ThemeToggle />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          <div
            className={cn(
              "sm:hidden",
              isMobileMenuOpen ? "block" : "hidden"
            )}
          >
            <div className="pt-2 pb-3 space-y-1">
              {isAdmin && (
                <>
                  <Link
                    to="/admin"
                    className={cn(
                      "flex items-center w-full px-3 py-2 transition-colors",
                      location.pathname === '/admin'
                        ? "bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400"
                    )}
                  >
                    <Users className="h-5 w-5" />
                    <span className="ml-2">Användare</span>
                  </Link>
                  <Link
                    to="/pages"
                    className={cn(
                      "flex items-center w-full px-3 py-2 transition-colors",
                      location.pathname === '/pages'
                        ? "bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400"
                    )}
                  >
                    <FileText className="h-5 w-5" />
                    <span className="ml-2">Sidor</span>
                  </Link>
                </>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span className="ml-2">Logga ut</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-16">
        <Outlet />
      </div>
    </div>
  );
}