import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Send, Clock, Eye, MessageSquare, CheckCheck, Check } from 'lucide-react';

export default function Outbox({ currentUserId }) {
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOutbox();
  }, []);

  const fetchOutbox = async () => {
    try {
      const res = await api.get(`/letters/outbox.php?user_id=${currentUserId}`);
      if (res.data?.success) {
        setLetters(res.data.letters || []);
      }
    } catch (err) {
      console.error('Failed to fetch outbox:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-ink/60 font-serif">Loading outbox records...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold bg-gold/10 px-3 py-1 rounded-full mb-2">
            <Send className="w-3.5 h-3.5" /> SENT ARCHIVES
          </div>
          <h1 className="font-serif text-3xl text-ink">Outbox Letters</h1>
        </div>
      </div>

      {letters.length === 0 ? (
        <div className="bg-paper border-2 border-dashed border-envelope rounded-2xl p-12 text-center text-ink/50 space-y-2">
          <Send className="w-8 h-8 mx-auto text-ink/30" />
          <p className="font-serif text-lg text-ink/70">No letters sent yet.</p>
          <p className="text-xs">Letters you compose and deliver will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {letters.map((letter) => (
            <div
              key={letter.id}
              className="bg-paper border border-envelope hover:border-gold/60 rounded-2xl p-6 flex flex-col justify-between shadow-xs transition-all"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center font-serif font-bold text-ink text-xs">
                      {letter.recipient_name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-ink">To: @{letter.recipient_username}</h3>
                      <span className="text-[10px] text-ink/50">{letter.recipient_name}</span>
                    </div>
                  </div>

                  {/* Read Receipt Status */}
                  <div className="flex items-center gap-1 text-[11px] font-mono">
                    {letter.is_read ? (
                      <span className="inline-flex items-center gap-1 text-gold bg-gold/10 px-2 py-0.5 rounded-full font-semibold">
                        <CheckCheck className="w-3.5 h-3.5" /> Opened
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-ink/40 bg-envelope px-2 py-0.5 rounded-full">
                        <Check className="w-3.5 h-3.5" /> Delivered
                      </span>
                    )}
                  </div>
                </div>

                <Link to={`/letter/${letter.id}`} className="block">
                  <h2 className="font-serif text-xl text-ink hover:text-gold transition">
                    {letter.subject}
                  </h2>
                </Link>
              </div>

              <div className="mt-6 pt-3 border-t border-envelope/80 flex justify-between items-center text-xs text-ink/50">
                <div className="flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(letter.created_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>

                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-[11px] text-ink/60 font-semibold">
                    <MessageSquare className="w-3.5 h-3.5 text-gold" />
                    {letter.reply_count || 0} Replies
                  </span>

                  <Link
                    to={`/letter/${letter.id}`}
                    className="font-semibold text-ink/70 hover:text-ink transition flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}