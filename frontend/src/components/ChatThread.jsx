import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { Loader2, Send } from 'lucide-react';

export default function ChatThread({ letterId, currentUserId }) {
  const [replies, setReplies] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [sending, setSending] = useState(false);

  const chatContainerRef = useRef(null);
  const topObserverRef = useRef(null);
  const lastTypingTime = useRef(0);
  const LIMIT = 15;

  // Fetch older messages (Pagination)
  const fetchReplies = async (currentOffset) => {
    if (loading) return;
    setLoading(true);

    try {
      const container = chatContainerRef.current;
      const previousScrollHeight = container ? container.scrollHeight : 0;

      const res = await api.get(`/letters/replies.php?letter_id=${letterId}&limit=${LIMIT}&offset=${currentOffset}`);

      if (res.data.success) {
        const fetchedReplies = res.data.replies;
        setHasMore(res.data.has_more);

        setReplies((prev) => [...fetchedReplies, ...prev]);
        setOffset(currentOffset + LIMIT);

        requestAnimationFrame(() => {
          if (container) {
            if (isInitialLoad) {
              container.scrollTop = container.scrollHeight;
              setIsInitialLoad(false);
            } else {
              container.scrollTop = container.scrollHeight - previousScrollHeight;
            }
          }
        });
      }
    } catch (err) {
      console.error('Failed to load thread messages:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchReplies(0);
  }, [letterId]);

  // Infinite scroll observer setup
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !loading && !isInitialLoad) {
          fetchReplies(offset);
        }
      },
      { threshold: 0.5 }
    );

    const currentTopRef = topObserverRef.current;
    if (currentTopRef) observer.observe(currentTopRef);

    return () => {
      if (currentTopRef) observer.unobserve(currentTopRef);
    };
  }, [hasMore, loading, offset, isInitialLoad]);

  // --- Real-time Polling for New Messages & Typing State ---
  useEffect(() => {
    if (isInitialLoad) return;

    const interval = setInterval(async () => {
      try {
        const lastReplyId = replies.length > 0 ? replies[replies.length - 1].id : 0;
        const res = await api.get(`/letters/chat_status.php?letter_id=${letterId}&last_reply_id=${lastReplyId}`);

        if (res.data.success) {
          setIsOtherTyping(res.data.is_typing);

          if (res.data.new_replies && res.data.new_replies.length > 0) {
            setReplies((prev) => [...prev, ...res.data.new_replies]);
            
            // Auto scroll down to incoming message if container is near bottom
            const container = chatContainerRef.current;
            if (container) {
              const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 120;
              if (isNearBottom) {
                requestAnimationFrame(() => {
                  container.scrollTop = container.scrollHeight;
                });
              }
            }
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 3000); // Poll every 3s

    return () => clearInterval(interval);
  }, [letterId, replies, isInitialLoad]);

  // Handle typing heartbeat signal when user types
  const handleInputChange = (e) => {
    setNewMessage(e.target.value);

    const now = Date.now();
    if (now - lastTypingTime.current > 2000) {
      lastTypingTime.current = now;
      api.post('/letters/chat_status.php', { letter_id: letterId }).catch(() => {});
    }
  };

  // Handle Sending Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const res = await api.post('/letters/replies.php', {
        letter_id: letterId,
        message: newMessage.trim(),
      });

      if (res.data.success) {
        setNewMessage('');
        // Trigger manual check immediately after sending
        const lastReplyId = replies.length > 0 ? replies[replies.length - 1].id : 0;
        const checkRes = await api.get(`/letters/chat_status.php?letter_id=${letterId}&last_reply_id=${lastReplyId}`);
        
        if (checkRes.data.new_replies) {
          setReplies((prev) => [...prev, ...checkRes.data.new_replies]);
          requestAnimationFrame(() => {
            if (chatContainerRef.current) {
              chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
            }
          });
        }
      }
    } catch (err) {
      console.error('Failed to deliver message:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[550px] bg-paper border border-envelope rounded-2xl p-4">
      {/* Scrollable Container */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto space-y-4 px-2 custom-scrollbar">
        {/* Top Sentinel for Pagination */}
        <div ref={topObserverRef} className="h-4 flex items-center justify-center">
          {loading && !isInitialLoad && (
            <div className="flex items-center gap-2 text-xs text-ink/50 py-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Fetching previous messages...</span>
            </div>
          )}
        </div>

        {replies.map((reply) => {
          const isMe = reply.sender_id === currentUserId;
          return (
            <div key={reply.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                  isMe
                    ? 'bg-ink text-paper rounded-br-none'
                    : 'bg-envelope/40 text-ink border border-envelope rounded-bl-none'
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{reply.message}</p>
                <span className={`block text-[10px] mt-1 text-right ${isMe ? 'text-paper/60' : 'text-ink/40'}`}>
                  {new Date(reply.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}

        {/* Animated Typing Indicator */}
        {isOtherTyping && (
          <div className="flex justify-start">
            <div className="bg-envelope/40 border border-envelope rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-ink/40 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-ink/40 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 bg-ink/40 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
          </div>
        )}
      </div>

      {/* Input Field */}
      <form onSubmit={handleSendMessage} className="mt-3 flex items-center gap-2 pt-2 border-t border-envelope/50">
        <input
          type="text"
          value={newMessage}
          onChange={handleInputChange}
          placeholder="Write a reply..."
          disabled={sending}
          className="flex-1 bg-envelope/20 border border-envelope rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gold disabled:opacity-50 text-ink"
        />
        <button
          type="submit"
          disabled={sending || !newMessage.trim()}
          className="p-2.5 bg-ink text-paper rounded-xl disabled:opacity-40 hover:bg-ink/90 transition"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
}