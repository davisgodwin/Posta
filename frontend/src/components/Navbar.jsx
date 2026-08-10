import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Inbox, PenTool, Send, User, LogOut, Home } from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';
import InstallButton from './InstallButton';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Hide nav on auth pages if preferred
  const isAuthPage = ['/login', '/register'].includes(location.pathname);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (isAuthPage) return null;

  return (
    <>
      {/* Minimal Top Bar for Branding, PWA Install & Notifications */}
      <header className="bg-paper border-b border-envelope/60 sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
        <NavLink to="/dashboard" className="flex items-center gap-2 font-serif text-xl font-bold text-ink">
          <div className="w-8 h-8 bg-ink text-paper rounded-lg flex items-center justify-center">
            <Mail className="w-4 h-4" />
          </div>
          <span>POSTA</span>
        </NavLink>

        {user && (
          <div className="flex items-center gap-2">
            {/* PWA Install Button Prompt */}
            <InstallButton />

            {/* Real-time Notification Bell & Dropdown */}
            <NotificationDropdown />

            <button
              onClick={handleLogout}
              className="text-xs text-stampRed font-semibold flex items-center gap-1 hover:opacity-80 transition ml-2"
              title="Logout"
            >
              <LogOut className="w-4 h-4" /> 
            </button>
          </div>
        )}
      </header>

      {/* Fixed Bottom Navigation Bar */}
      {user && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-paper/95 backdrop-blur-md border-t border-envelope/80 shadow-lg px-2 py-2">
          <div className="max-w-md mx-auto flex items-center justify-around">
            
            {/* Dashboard / Home */}
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 text-[11px] font-semibold transition ${
                  isActive ? 'text-gold font-bold scale-105' : 'text-ink/60 hover:text-ink'
                }`
              }
            >
              <Home className="w-5 h-5" />
              <span>Home</span>
            </NavLink>

            {/* Inbox */}
            <NavLink
              to="/inbox"
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 text-[11px] font-semibold transition ${
                  isActive ? 'text-gold font-bold scale-105' : 'text-ink/60 hover:text-ink'
                }`
              }
            >
              <Inbox className="w-5 h-5" />
              <span>Inbox</span>
            </NavLink>

            {/* Write Action (Center Floating Pill Button) */}
            <NavLink
              to="/write"
              className={({ isActive }) =>
                `flex items-center justify-center w-12 h-12 bg-ink text-paper rounded-full shadow-md transform transition hover:scale-110 -mt-5 border-4 border-paper ${
                  isActive ? 'bg-gold text-ink' : ''
                }`
              }
            >
              <PenTool className="w-5 h-5" />
            </NavLink>

            {/* Sent */}
            <NavLink
              to="/sent"
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 text-[11px] font-semibold transition ${
                  isActive ? 'text-gold font-bold scale-105' : 'text-ink/60 hover:text-ink'
                }`
              }
            >
              <Send className="w-5 h-5" />
              <span>Sent</span>
            </NavLink>

            {/* Profile */}
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 text-[11px] font-semibold transition ${
                  isActive ? 'text-gold font-bold scale-105' : 'text-ink/60 hover:text-ink'
                }`
              }
            >
              {user?.avatar ? (
                <img
                  src={
                    user.avatar.startsWith('http') 
                      ? user.avatar 
                      : `http://localhost/posta/backend/${user.avatar.replace(/^\//, '')}`
                  }
                  alt="Profile"
                  className="w-5 h-5 rounded-full object-cover border border-envelope"
                />
              ) : (
                <User className="w-5 h-5" />
              )}
              <span>Profile</span>
            </NavLink>

          </div>
        </nav>
      )}
    </>
  );
}