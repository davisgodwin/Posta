import React, { useEffect } from 'react';
import { Heart, MessageSquare, X } from 'lucide-react';

export default function Toast({ notification, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // Auto-dismiss after 5 seconds
    return () => clearTimeout(timer);
  }, [notification, onClose]);

  if (!notification) return null;

  return (
    <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-paper border border-gold shadow-2xl rounded-2xl p-4 max-w-sm animate-bounce-in">
      <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center shrink-0">
        {notification.actor_avatar ? (
          <img
            src={`http://localhost/posta/backend/${notification.actor_avatar}`}
            alt={notification.actor_name}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <span className="font-bold text-xs text-ink">
            {notification.actor_name?.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      <div className="flex-1 text-xs">
        <p className="text-ink">
          <span className="font-bold">{notification.actor_name}</span>{' '}
          {notification.type === 'like' ? 'liked your post.' : 'commented on your post.'}
        </p>
      </div>

      {notification.type === 'like' ? (
        <Heart className="w-4 h-4 text-stampRed fill-stampRed shrink-0" />
      ) : (
        <MessageSquare className="w-4 h-4 text-gold fill-gold shrink-0" />
      )}

      <button onClick={onClose} className="text-ink/40 hover:text-ink transition ml-1">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}