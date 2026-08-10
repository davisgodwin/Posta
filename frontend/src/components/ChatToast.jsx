import React, { useEffect } from 'react';
import { MessageSquare, X } from 'lucide-react';

export default function ChatToast({ toast, onClose, onOpenChat }) {
  useEffect(() => {
    if (!toast) return;

    // Auto-dismiss the popup window after 5 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const handleToastClick = () => {
    if (onOpenChat) {
      onOpenChat(toast.letter_id || toast.id);
    }
    onClose();
  };

  return (
    <div
      className="fixed bottom-6 right-6 z-[100] max-w-sm w-full bg-paper border-2 border-gold/40 shadow-2xl rounded-2xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300 group hover:border-gold transition-all duration-200 cursor-pointer"
      onClick={handleToastClick}
    >
      {/* Visual Avatar Anchor Icon Circle */}
      <div className="w-9 h-9 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center shrink-0">
        <MessageSquare className="w-4 h-4 text-gold fill-gold/20" />
      </div>

      {/* Message Metadata Parameters block */}
      <div className="flex-1 min-w-0 text-xs">
        <div className="flex justify-between items-baseline mb-0.5">
          <span className="font-serif font-bold text-ink text-sm">
            @{toast.sender_name || 'Someone'} replied
          </span>
          <span className="text-[10px] text-ink/40 font-mono">Just now</span>
        </div>
        <p className="text-ink/70 truncate pr-2 italic font-sans">
          "{toast.message || 'New reply received'}"
        </p>
      </div>

      {/* Close Action Toggle */}
      <button
        onClick={(e) => {
          e.stopPropagation(); // Prevents triggering onOpenChat when closing
          onClose();
        }}
        className="text-ink/30 hover:text-ink/80 transition p-0.5 rounded-lg hover:bg-envelope/30 shrink-0"
        aria-label="Dismiss toast alert"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}