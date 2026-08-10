import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Mail, Clock, Sparkles, MessageSquare, Send, X, Archive, Trash2, CheckCheck, Check } from 'lucide-react';
import ChatToast from '../components/ChatToast';

export default function Inbox({ currentUserId }) {
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [replies, setReplies] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [activeChatToast, setActiveChatToast] = useState(null);

  const initialFetchDone = useRef(false);
  const chatEndRef = useRef(null);
  const selectedLetterRef = useRef(null);
  const previousRepliesCountRef = useRef({});

  useEffect(() => {
    selectedLetterRef.current = selectedLetter;
  }, [selectedLetter]);

  useEffect(() => {
    fetchInbox();

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const inboxInterval = setInterval(() => fetchInbox(true), 8000);
    const chatInterval = setInterval(() => {
      if (selectedLetterRef.current?.id) {
        fetchReplies(selectedLetterRef.current.id, true);
      }
    }, 3000);

    return () => {
      clearInterval(inboxInterval);
      clearInterval(chatInterval);
    };
  }, []);

  useEffect(() => {
    if (selectedLetter) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [replies, selectedLetter]);

  const fetchInbox = async (isBackground = false) => {
    try {
      const res = await api.get('/letters/inbox.php');
      if (res.data?.success) {
        // Filter out soft-deleted / archived items
        const fetchedLetters = (res.data.letters || []).filter(
          (l) => !l.is_archived && !l.is_deleted
        );

        if (isBackground && initialFetchDone.current) {
          const currentIds = new Set(letters.map((l) => l.id));
          const newLetter = fetchedLetters.find((l) => !currentIds.has(l.id) && !l.is_read);

          if (newLetter && Notification.permission === 'granted') {
            new Notification(`New Letter from @${newLetter.sender_username}`, {
              body: newLetter.subject || 'You have received a new letter!',
              icon: '/favicon.ico',
            });
          }
        }

        setLetters(fetchedLetters);
        initialFetchDone.current = true;
      }
    } catch (err) {
      console.error('Failed to fetch letters:', err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const markAsRead = async (letterId) => {
    try {
      await api.post('/letters/read.php', { letter_id: letterId, user_id: currentUserId });
      setLetters((prev) =>
        prev.map((l) => (l.id === letterId ? { ...l, is_read: 1 } : l))
      );
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleOpenChat = (e, letter) => {
    e.preventDefault();
    setSelectedLetter(letter);
    fetchReplies(letter.id);
    if (!letter.is_read) {
      markAsRead(letter.id);
    }
  };

  const fetchReplies = async (letterId, isSilent = false) => {
    try {
      const res = await api.get(`/letters/replies.php?letter_id=${letterId}`);
      if (res.data?.success) {
        const currentReplies = res.data.replies || [];

        if (isSilent) {
          const prevCount = previousRepliesCountRef.current[letterId] || 0;
          if (currentReplies.length > prevCount && prevCount > 0) {
            const newestMessage = currentReplies[currentReplies.length - 1];
            if (Number(newestMessage.sender_id) !== Number(currentUserId)) {
              setActiveChatToast(newestMessage);
              if (Notification.permission === 'granted') {
                new Notification(`New message from @${newestMessage.sender_name}`, {
                  body: newestMessage.message,
                  icon: '/favicon.ico',
                });
              }
            }
          }
        }

        previousRepliesCountRef.current[letterId] = currentReplies.length;
        setReplies(currentReplies);
      }
    } catch (err) {
      if (!isSilent) console.error('Failed syncing conversation context logs:', err);
    }
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
        fetchInbox(true);
      }
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setSendingReply(false);
    }
  };

  const handleArchiveDelete = async (e, letterId, action) => {
    e.stopPropagation();
    try {
      const res = await api.post('/letters/archive.php', { letter_id: letterId, action });
      if (res.data?.success) {
        setLetters((prev) => prev.filter((l) => l.id !== letterId));
        if (selectedLetter?.id === letterId) setSelectedLetter(null);
      }
    } catch (err) {
      console.error(`Failed to ${action} letter:`, err);
    }
  };

  const handleDeleteReply = async (replyId) => {
    try {
      const res = await api.post('/letters/delete_reply.php', { reply_id: replyId });
      if (res.data?.success) {
        setReplies((prev) => prev.filter((r) => r.id !== replyId));
      }
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  const unreadCount = letters.filter((l) => !l.is_read).length;

  if (loading) {
    return <div className="text-center py-12 text-ink/60 font-serif">Fetching mail from post office...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 relative">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold bg-gold/10 px-3 py-1 rounded-full mb-2">
            <Sparkles className="w-3.5 h-3.5" /> POSTBOX INBOX
          </div>
          <h1 className="font-serif text-3xl text-ink">Received Letters</h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-ink/60 bg-envelope px-3 py-1.5 rounded-lg border border-gold/20 flex items-center gap-2">
            {unreadCount > 0 && <span className="w-2 h-2 rounded-full bg-stampRed animate-pulse" />}
            {unreadCount} Unread
          </span>
        </div>
      </div>

      {letters.length === 0 ? (
        <div className="bg-paper border-2 border-dashed border-envelope rounded-2xl p-12 text-center text-ink/50 space-y-2">
          <Mail className="w-8 h-8 mx-auto text-ink/30" />
          <p className="font-serif text-lg text-ink/70">Your postbox is empty.</p>
          <p className="text-xs">When someone sends you a virtual letter, it will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {letters.map((letter) => (
            <div
              key={letter.id}
              className={`group relative rounded-2xl border transition-all duration-200 p-6 flex flex-col justify-between ${
                letter.is_read
                  ? 'bg-paper border-envelope hover:border-gold/60 shadow-xs'
                  : 'bg-envelope/60 border-gold/50 shadow-md ring-1 ring-gold/30'
              }`}
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center font-serif font-bold text-ink text-xs">
                      {letter.sender_name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-ink">@{letter.sender_username}</h3>
                      <span className="text-[10px] text-ink/50">{letter.sender_name}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!letter.is_read ? (
                      <span className="px-2.5 py-0.5 bg-stampRed text-paper text-[10px] font-bold rounded-full shadow-xs animate-pulse">
                        SEALED
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-ink/40 uppercase tracking-wider">
                        OPENED
                      </span>
                    )}

                    {/* Action Controls */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                      <button
                        onClick={(e) => handleArchiveDelete(e, letter.id, 'archive')}
                        title="Archive letter"
                        className="p-1 text-ink/40 hover:text-gold rounded hover:bg-gold/10 transition"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleArchiveDelete(e, letter.id, 'delete')}
                        title="Delete letter"
                        className="p-1 text-ink/40 hover:text-red-500 rounded hover:bg-red-50 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <Link
                  to={`/letter/${letter.id}`}
                  onClick={() => !letter.is_read && markAsRead(letter.id)}
                  className="block"
                >
                  <h2 className="font-serif text-xl text-ink group-hover:text-gold transition">
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
                  <button
                    onClick={(e) => handleOpenChat(e, letter)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gold/10 hover:bg-gold/20 text-ink text-[11px] font-semibold transition"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-gold" />
                    <span>Chat ({letter.reply_count || 0})</span>
                  </button>

                  <Link
                    to={`/letter/${letter.id}`}
                    onClick={() => !letter.is_read && markAsRead(letter.id)}
                    className="font-semibold text-ink/70 hover:text-ink group-hover:translate-x-0.5 transition-transform"
                  >
                    Read →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Embedded Slide-over Chat Modal */}
      {selectedLetter && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex justify-end">
          <div className="w-full max-w-md bg-[#FDFBF7] h-full shadow-2xl border-l border-[#EBE3D5] flex flex-col justify-between p-0 relative">
            
            {/* Header Bar */}
            <div className="bg-paper border-b border-[#EBE3D5] p-4 flex items-center justify-between shadow-2xs z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gold/20 flex items-center justify-center font-serif font-bold text-ink text-xs border border-gold/30">
                  {selectedLetter.sender_username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="min-w-0">
                  <h3 className="font-serif font-bold text-sm text-ink truncate">{selectedLetter.subject}</h3>
                  <p className="text-[11px] text-ink/60 truncate">
                    @{selectedLetter.sender_username}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedLetter(null)}
                className="p-1.5 text-ink/40 hover:text-ink rounded-lg hover:bg-envelope/40 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sealed Letter Context Banner */}
            <div className="px-4 py-2.5 bg-[#F5EFE6] border-b border-[#EBE3D5] text-[11px] text-ink/70 flex items-center justify-between">
              <span className="font-medium truncate italic pr-2">
                "{selectedLetter.message ? selectedLetter.message.substring(0, 80) + '...' : 'Original Letter Body'}"
              </span>
              <span className="px-2 py-0.5 bg-gold/15 text-ink font-semibold rounded-md text-[10px] shrink-0 border border-gold/20">
                Letter Context
              </span>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FDFBF7]">
              {replies.length === 0 ? (
                <div className="text-center my-8 text-xs text-ink/50 font-serif">
                  No replies yet. Send a message below to chat with this letter!
                </div>
              ) : (
                replies.map((reply) => {
                  const isMe =
                    currentUserId !== undefined &&
                    currentUserId !== null &&
                    String(reply.sender_id) === String(currentUserId);

                  return (
                    <div
                      key={reply.id}
                      className={`group/msg flex w-full items-start gap-2.5 ${
                        isMe ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {!isMe && (
                        <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center font-serif font-bold text-ink text-xs border border-gold/30 shrink-0 mt-0.5">
                          {(reply.sender_name || selectedLetter.sender_username)?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}

                      <div className={`flex flex-col max-w-[78%] ${isMe ? 'items-end' : 'items-start'}`}>
                        {/* Bubble Container */}
                        <div className="relative group/bubble flex items-center gap-1.5">
                          {/* Delete Button for Sender */}
                          {isMe && (
                            <button
                              onClick={() => handleDeleteReply(reply.id)}
                              title="Delete message"
                              className="opacity-0 group-hover/bubble:opacity-100 text-ink/30 hover:text-red-500 transition p-1 rounded"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}

                          <div
                            className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                              isMe
                                ? 'bg-[#2C2C2C] text-white rounded-tr-xs'
                                : 'bg-[#E3D8C4] text-ink rounded-tl-xs border border-[#D5C7B0]'
                            }`}
                          >
                            {!isMe && (
                              <span className="font-bold block text-[11px] text-ink/80 mb-1">
                                {reply.sender_name || selectedLetter.sender_username}
                              </span>
                            )}
                            <p className="break-words text-[12px]">{reply.message}</p>
                          </div>
                        </div>

                        {/* Read Receipts & Timestamp */}
                        <div className="flex items-center gap-1 mt-1 px-1 text-[10px] text-ink/40 font-mono">
                          <span>
                            {new Date(reply.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                            })}
                          </span>
                          {isMe && (
                            <span>
                              {reply.is_read ? (
                                <CheckCheck className="w-3 h-3 text-gold inline" title="Read" />
                              ) : (
                                <Check className="w-3 h-3 text-ink/40 inline" title="Sent" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Footer */}
            <form
              onSubmit={handleSendReply}
              className="p-3 bg-[#FDFBF7] border-t border-[#EBE3D5] flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Reply to this letter..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="flex-1 bg-[#F5EFE6] text-xs text-ink px-4 py-2.5 rounded-xl border border-[#EBE3D5] focus:outline-none focus:ring-1 focus:ring-gold/60 placeholder:text-ink/40"
              />
              <button
                type="submit"
                disabled={sendingReply || !replyText.trim()}
                className="bg-[#2C2C2C] hover:bg-slate-800 text-white w-10 h-10 rounded-xl transition disabled:opacity-50 flex items-center justify-center shrink-0 shadow-2xs"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      <ChatToast
        toast={activeChatToast}
        onClose={() => setActiveChatToast(null)}
      />
    </div>
  );
}