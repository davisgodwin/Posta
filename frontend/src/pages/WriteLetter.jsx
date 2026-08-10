import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Send, CheckCircle2, AlertCircle, Loader2, Calendar, Clock } from 'lucide-react';

export default function WriteLetter() {
  const [recipient, setRecipient] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [theme, setTheme] = useState('classic');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState({ type: '', text: '' });
  const navigate = useNavigate();

  const handleSend = async (e) => {
    e.preventDefault();
    
    if (sending) return; 

    setStatus({ type: '', text: '' });

    if (!recipient.trim() || !subject.trim() || !message.trim()) {
      setStatus({ type: 'error', text: 'Please fill in all fields before sending.' });
      return;
    }

    if (isScheduled && !scheduledAt) {
      setStatus({ type: 'error', text: 'Please choose a date and time to schedule your delivery.' });
      return;
    }

    const formattedRecipient = recipient.trim().startsWith('@') 
      ? recipient.trim().slice(1) 
      : recipient.trim();

    setSending(true);
    try {
      const res = await api.post('/letters/send.php', {
        recipient: formattedRecipient,
        subject,
        message: message.trim(),
        theme,
        scheduled_at: isScheduled ? scheduledAt : null,
      });

      if (res.data.success) {
        setStatus({ type: 'success', text: res.data.message });
        setTimeout(() => navigate('/sent'), 1500);
      } else {
        setStatus({ type: 'error', text: res.data.message || 'Could not deliver letter.' });
      }
    } catch (err) {
      setStatus({
        type: 'error',
        text: err.response?.data?.message || 'Failed to send letter.',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6 text-center">
        <h1 className="font-serif text-3xl text-ink">Compose a Virtual Letter</h1>
        <p className="text-xs text-ink/60 mt-1">Take your time. Words carry weight here.</p>
      </div>

      {status.text && (
        <div
          className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
            status.type === 'success'
              ? 'bg-gold/10 border border-gold/30 text-gold'
              : 'bg-stampRed/10 border border-stampRed/30 text-stampRed'
          }`}
        >
          {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {status.text}
        </div>
      )}

      <form onSubmit={handleSend} className="space-y-6">
        <div className="bg-paper border-2 border-envelope rounded-2xl p-6 md:p-8 shadow-xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink/70 mb-1">To Username or Email</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="@username or email@example.com"
                required
                disabled={sending}
                className="w-full px-3.5 py-2 text-sm bg-envelope/30 border border-envelope rounded-lg focus:outline-none focus:border-gold disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink/70 mb-1">Letter Theme</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                disabled={sending}
                className="w-full px-3.5 py-2 text-sm bg-envelope/30 border border-envelope rounded-lg focus:outline-none focus:border-gold capitalize disabled:opacity-50"
              >
                <option value="classic">Classic Linen</option>
                <option value="warm">Warm Vintage</option>
                <option value="midnight">Midnight Ink</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink/70 mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="A gentle thought for your day..."
              required
              disabled={sending}
              className="w-full px-3.5 py-2 text-sm bg-envelope/30 border border-envelope rounded-lg focus:outline-none focus:border-gold font-serif text-lg disabled:opacity-50"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-ink/70">Your Letter</label>
              <span className="text-[11px] text-ink/40 font-mono">{message.length} chars</span>
            </div>
            <textarea
              rows={10}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Dear friend..."
              required
              disabled={sending}
              className="w-full p-4 text-sm bg-envelope/20 border border-envelope rounded-lg focus:outline-none focus:border-gold leading-relaxed font-sans resize-none disabled:opacity-50 whitespace-pre-wrap"
            ></textarea>
          </div>

          {/* Schedule Delivery Toggle Section */}
          <div className="bg-envelope/20 border border-envelope rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gold" />
                <span className="text-xs font-bold text-ink">Schedule Delivery</span>
              </div>
              <input
                type="checkbox"
                checked={isScheduled}
                onChange={(e) => setIsScheduled(e.target.checked)}
                disabled={sending}
                className="w-4 h-4 accent-gold cursor-pointer"
              />
            </div>

            {isScheduled && (
              <div className="pt-2 border-t border-envelope/40">
                <label className="block text-[11px] font-semibold text-ink/60 mb-1">
                  Deliver on (Date & Time):
                </label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  min={new Date().toISOString().slice(0, 16)}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  disabled={sending}
                  className="bg-paper border border-envelope rounded-lg px-3 py-2 text-xs text-ink focus:outline-none focus:border-gold w-full"
                  required={isScheduled}
                />
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={sending}
          className={`w-full py-3 bg-ink text-paper text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2 shadow-xs ${
            sending ? 'opacity-70 cursor-not-allowed' : 'hover:bg-ink/90'
          }`}
        >
          {sending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {isScheduled ? 'Scheduling Letter...' : 'Sealing & Delivering...'}
            </>
          ) : isScheduled ? (
            <>
              <Clock className="w-4 h-4" />
              Schedule Letter
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send Letter
            </>
          )}
        </button>
      </form>
    </div>
  );
}