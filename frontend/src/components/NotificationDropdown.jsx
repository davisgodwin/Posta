import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Bell, Heart, MessageSquare, Mail } from 'lucide-react';
import Toast from './Toast';

export default function NotificationDropdown() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [latestToast, setLatestToast] = useState(null);
  
  const previousIdsRef = useRef(new Set());
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // 💡 CHOOSE ONE: Get your user auth data or token here
  // const { user } = useAuth(); // Example context hook
  // const token = localStorage.getItem('token'); 

  useEffect(() => {
    let isMounted = true;
    
    const fetchNotifications = async () => {
      // 🚨 Guard Clause: If your app hasn't loaded the user or token yet, 
      // halt execution to prevent throwing recurring 400 Bad Request errors.
      // if (!token || !user?.id) return; 

      try {
        // 💡 CONFIGURATION: If your PHP backend expects specific URL query values 
        // instead of an Auth Header, attach them via the params config block:
        // const config = { params: { user_id: user.id } };
        // const res = await api.get('/notifications/index.php', config);
        
        const res = await api.get('/notifications/index.php');
        
        if (res.data?.success && isMounted) {
          const fetched = res.data.notifications || [];
          
          if (previousIdsRef.current.size > 0) {
            const newNotif = fetched.find((n) => !previousIdsRef.current.has(n.id));
            if (newNotif && Number(newNotif.is_read) === 0) {
              setLatestToast(newNotif);
            }
          }

          previousIdsRef.current = new Set(fetched.map((n) => n.id));
          setNotifications(fetched);
        }
      } catch (err) {
        if (err.response?.status === 401) {
          console.warn('Authentication expired. Halting notification polls.');
        } else if (err.response?.status === 400) {
          // Gracefully log the bad request parameters without breaking application flows
          console.warn('Notification configuration mismatch:', err.response?.data?.message);
        } else {
          console.error('Notification fetch error:', err.response?.data?.message || err.message);
        }
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []); // 🚨 Add dependencies here (like [user.id] or [token]) if you enable the guard clauses above

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenToggle = async () => {
    const nextState = !isOpen;
    setIsOpen(nextState);

    if (nextState && unreadCount > 0) {
      try {
        // 🚨 Note: Your backend error says "All fields are required". 
        // POST endpoints typically expect data payloads. If it fails here, pass an object:
        // await api.post('/notifications/index.php', { user_id: user.id });
        await api.post('/notifications/index.php');
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      } catch (err) {
        console.error('Failed to mark notifications as read:', err);
      }
    }
  };

  const handleNotificationClick = (n) => {
    setIsOpen(false);
    if (n.type === 'letter') {
      navigate(n.letter_id ? `/inbox?letter=${n.letter_id}` : '/inbox');
    } else if (n.post_id) {
      navigate(`/dashboard#post-${n.post_id}`);
    }
  };

  const unreadCount = notifications.filter((n) => Number(n.is_read) === 0).length;

  return (
    <>
      <Toast notification={latestToast} onClose={() => setLatestToast(null)} />

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={handleOpenToggle}
          className="relative p-2 rounded-xl text-ink/80 hover:text-ink hover:bg-envelope/40 transition"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-stampRed text-paper text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-paper border border-envelope shadow-xl rounded-2xl overflow-hidden z-50">
            <div className="px-4 py-3 border-b border-envelope bg-envelope/20 font-bold text-xs text-ink flex justify-between items-center">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] text-stampRed font-semibold">
                  {unreadCount} unread
                </span>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-envelope/40">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-xs text-ink/50">No notifications yet.</div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-3 flex items-start gap-3 cursor-pointer transition ${
                      Number(n.is_read) === 0 ? 'bg-gold/10 hover:bg-gold/20' : 'hover:bg-envelope/10'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-gold/20 border border-gold flex items-center justify-center shrink-0 font-bold text-xs text-ink overflow-hidden">
                      {n.actor_avatar ? (
                        <img
                          src={
                            n.actor_avatar.startsWith('http')
                              ? n.actor_avatar
                              : `http://localhost/posta/backend/${n.actor_avatar}`
                          }
                          alt={n.actor_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        n.actor_name?.charAt(0).toUpperCase()
                      )}
                    </div>

                    <div className="flex-1 text-xs">
                      <p className="text-ink leading-snug">
                        <span className="font-bold">{n.actor_name}</span>{' '}
                        {n.type === 'letter'
                          ? 'sent you a new letter.'
                          : n.type === 'like'
                          ? 'liked your post.'
                          : 'commented on your post.'}
                      </p>
                      <span className="text-[10px] text-ink/40 block mt-0.5">
                        {new Date(n.created_at).toLocaleString()}
                      </span>
                    </div>

                    {n.type === 'letter' ? (
                      <Mail className="w-3.5 h-3.5 text-amber-600 fill-amber-100 shrink-0 mt-0.5" />
                    ) : n.type === 'like' ? (
                      <Heart className="w-3.5 h-3.5 text-stampRed fill-stampRed shrink-0 mt-0.5" />
                    ) : (
                      <MessageSquare className="w-3.5 h-3.5 text-gold fill-gold shrink-0 mt-0.5" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
