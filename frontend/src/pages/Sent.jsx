import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { Clock, MessageSquare, Send, X, AlertCircle } from 'lucide-react';

export default function SentLetters({ currentUserId }) {
  const [sentLetters, setSentLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [replies, setReplies] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [error, setError] = useState(null);

  const selectedLetterRef = useRef(null);
  const chatEndRef = useRef(null);

  // Sync ref with selected state to keep interval closure parameters current
  useEffect(() => {
    selectedLetterRef.current = selectedLetter;
  }, [selectedLetter]);

  useEffect(() => {
    fetchSentLetters();

    // Poll Active Chat Thread background updates every 3s
    const chatInterval = setInterval(() => {
      if (selectedLetterRef.current) {
        fetchReplies(selectedLetterRef.current.id, true);
      }
    }, 3000);

    return () => clearInterval(chatInterval);
  }, []);

  // Maintain fluid anchor scrolling positioning on message receipt
  useEffect(() => {
    if (selectedLetter) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [replies, selectedLetter]);

  const fetchSentLetters = async () => {
    try {
      // 💡 Replace with your exact sent collection API file endpoint route path if distinct
      const res = await api.get('/letters/sent.php'); 
      if (res.data?.success) {
        setSentLetters(res.data.letters || []);
      }
    } catch (err) {
      console.error('Failed to load sent letters registry:', err);
      setError('Unable to fetch your outbox ledger records.');
    } finally {
      setLoading(false);
    }
  };

  const fetchReplies = async (letterId, isSilent = false) => {
    try {
      const res = await api.get(`/letters/replies.php?letter_id=${letterId}`);
      if (res.data?.success) {
        setReplies(res.data.replies || []);
      }
    } catch (err) {
      if (!isSilent) console.error('Failed syncing conversation context logs:', err);
    }
  };

  const handleOpenChat = (letter) => {
    setSelectedLetter(letter);
    fetchReplies(letter.id);
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedLetter) return;

    setSendingReply(true);
    try {
      const res = await api.post('/letters/replies.php', {
        letter_id: selectedLetter.id,
        message: replyText.trim(),
      });

      if (res.data?.success) {
        setReplyText('');
        await fetchReplies(selectedLetter.id);
      }
    } catch (err) {
      console.error('Reply transmission failed:', err);
    } finally {
      setSendingReply(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-ink/60 font-serif">Loading your sent log ledger...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 relative">
      <h1 className="font-serif text-3xl text-ink mb-6">Sent Letters</h1>

      {error && (
        <div className="mb-6 p-4 bg-stampRed/10 border border-stampRed/30 rounded-xl text-stampRed text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {sentLetters.length === 0 ? (
        <div className="text-center py-12 text-ink/40 bg-paper border border-dashed border-envelope rounded-2xl">
          No sent records found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sentLetters.map((letter) => (
            <div key={letter.id} className="bg-paper border border-envelope rounded-2xl p-6 flex flex-col justify-between shadow-xs">
              <div className="space-y-2">
                <div className="flex justify-between items-start text-xs">
                  <span className="font-mono text-ink/60 font-bold">
                    To: @{letter.recipient_username || letter.receiver_username || 'Recipient'}
                  </span>
                  <span className="px-2 py-0.5 bg-gold/10 text-gold font-medium rounded-full text-[10px]">
                    ✓ Read by Recipient
                  </span>
                </div>
                <h2 className="font-serif text-xl text-ink font-bold pt-1">{letter.subject}</h2>
              </div>

              <div className="mt-6 pt-3 border-t border-envelope/80 flex justify-between items-center text-xs text-ink/50">
                <div className="flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(letter.created_at).toLocaleDateString()}
                </div>

                <div className="flex items-center gap-3">
                  {/* CHANGED: Swapped static text out for active modal toggler button */}
                  <button
                    onClick={() => handleOpenChat(letter)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ink text-paper font-semibold hover:bg-ink/90 transition text-[11px]"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-gold fill-gold" />
                    <span>View Copy & Chat ({letter.reply_count || 0})</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Slide-over Embedded Chat Thread Module Panel */}
      {selectedLetter && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex justify-end">
          <div className="w-full max-w-md bg-[#FDFBF7] h-full shadow-2xl border-l border-[#EBE3D5] flex flex-col justify-between p-6">
            <div>
              <div className="flex justify-between items-center pb-4 border-b border-[#EBE3D5]">
                <div>
                  <h3 className="font-serif font-bold text-lg text-slate-900">{selectedLetter.subject}</h3>
                  <p className="text-xs text-gray-500">
                    Conversation with <span className="font-semibold text-slate-800">@{selectedLetter.recipient_username || selectedLetter.receiver_username}</span>
                  </p>
                </div>
                <button onClick={() => setSelectedLetter(null)} className="p-1.5 text-gray-400 hover:text-slate-800 rounded-lg transition">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="my-4 p-3.5 bg-[#F5EFE6] rounded-xl border border-[#EBE3D5] text-xs text-slate-700 italic">
                "{selectedLetter.message || 'Original Letter Body'}"
              </div>
            </div>

            <div className="flex-1 overflow-y-auto my-2 space-y-3 pr-1">
              {replies.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-400 font-serif">
                  No chat history yet. Type a message below to start the conversation!
                </div>
              ) : (
                replies.map((reply) => {
                  const isMe = Number(reply.sender_id) === Number(currentUserId);
                  return (
                    <div key={reply.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[85%] text-xs px-3.5 py-2 rounded-2xl ${isMe ? 'bg-[#2C2C2C] text-white rounded-br-none' : 'bg-[#E3D8C4] text-slate-900 rounded-bl-none'}`}>
                        <span className={`font-bold block text-[10px] mb-0.5 ${isMe ? 'text-gray-300' : 'text-gray-700'}`}>
                          {reply.sender_name}
                        </span>
                        {reply.message}
                      </div>
                      <span className="text-[9px] text-gray-400 mt-1 px-1">
                        {new Date(reply.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendReply} className="pt-3 border-t border-[#EBE3D5] flex gap-2">
              <input
                type="text"
                placeholder="Write a message..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="flex-1 bg-[#F5EFE6] text-xs text-slate-800 px-3.5 py-2.5 rounded-xl border border-[#EBE3D5] focus:outline-none focus:ring-1 focus:ring-[#C8B89A]"
              />
              <button
                type="submit"
                disabled={sendingReply || !replyText.trim()}
                className="bg-[#2C2C2C] hover:bg-slate-800 text-white px-3 py-2.5 rounded-xl transition disabled:opacity-50 flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
