import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Send, Heart, Sparkles, ArrowRight, Clock, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    try {
      const response = await fetch('http://localhost/posta/backend/api/letters/feed.php');
      const data = await response.json();
      if (data.success) {
        setPosts(data.letters || []);
      }
    } catch (err) {
      console.error('Failed to connect to feed endpoint:', err);
    } finally {
      setLoading(false);
    }
  };

  const getAvatarUrl = (path) => {
    if (!path) return null;
    return path.startsWith('http') ? path : `http://localhost/posta/backend/${path.replace(/^\//, '')}`;
  };

  return (
    <div className="bg-paper min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-4 pt-16 pb-12 text-center flex flex-col justify-center items-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-envelope border border-gold/30 rounded-full text-xs font-medium text-gold mb-6 shadow-xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>A Digital Post Office Experience</span>
        </div>

        <h1 className="font-serif text-5xl md:text-6xl text-ink leading-tight max-w-3xl">
          Deliver More Than Messages.
        </h1>

        <p className="mt-4 text-base md:text-lg text-ink/70 max-w-xl font-sans leading-relaxed">
          “Sometimes a message should feel like more than a notification.”
        </p>

        {/* Hero Envelope Illustration */}
        <div className="my-10 relative group cursor-default">
          <div className="w-64 h-40 bg-envelope border-2 border-ink/20 rounded-xl shadow-md flex flex-col justify-between p-4 relative overflow-hidden transition transform group-hover:-translate-y-1">
            <div className="flex justify-between items-start">
              <div className="w-8 h-10 border-2 border-dashed border-stampRed/60 bg-stampRed/5 rounded-xs flex items-center justify-center">
                <span className="text-[10px] font-serif text-stampRed font-bold">POSTA</span>
              </div>
              <Mail className="w-6 h-6 text-gold/80" />
            </div>
            <div className="text-left">
              <div className="h-1.5 w-24 bg-ink/20 rounded-full mb-1"></div>
              <div className="h-1.5 w-16 bg-ink/10 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs justify-center">
          {user ? (
            <Link
              to="/dashboard"
              className="px-6 py-3 bg-ink text-paper text-sm font-semibold rounded-lg hover:bg-ink/90 transition flex items-center justify-center gap-2 shadow-sm"
            >
              Go to Your Postbox <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="px-6 py-3 bg-ink text-paper text-sm font-semibold rounded-lg hover:bg-ink/90 transition flex items-center justify-center gap-2 shadow-sm"
              >
                Write a Letter <Send className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="px-6 py-3 bg-envelope border border-ink/10 text-ink text-sm font-semibold rounded-lg hover:bg-envelope/80 transition flex items-center justify-center"
              >
                Open Your Inbox
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Public Activity Feed Section */}
      <section className="border-t border-envelope/80 py-12 px-4 bg-paper">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-serif text-2xl font-bold text-center text-ink mb-2">
            Public Letters & Dispatch Feed
          </h2>
          <p className="text-xs text-center text-ink/60 mb-8">
            Explore recent digital dispatches sent across POSTA
          </p>

          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-ink"></div>
            </div>
          ) : posts.length === 0 ? (
            <p className="text-center text-ink/50 text-sm py-6">No public letters dispatched yet.</p>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <article
                  key={post.id}
                  className="bg-paper border border-envelope rounded-xl p-5 shadow-xs hover:border-gold/50 transition space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-envelope/40 pb-3">
                    <Link to={`/user/${post.sender_username}`} className="flex items-center gap-2.5 group">
                      {post.sender_avatar ? (
                        <img
                          src={getAvatarUrl(post.sender_avatar)}
                          alt={post.sender_username}
                          className="w-8 h-8 rounded-full object-cover border border-envelope"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-envelope/60 flex items-center justify-center text-ink">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                      <span className="font-semibold text-sm text-ink group-hover:text-gold transition">
                        @{post.sender_username}
                      </span>
                    </Link>

                    <span className="text-[11px] text-ink/50 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-serif font-bold text-base text-ink mb-1">{post.subject}</h3>
                    <p className="text-xs text-ink/80 leading-relaxed line-clamp-3">{post.message}</p>
                  </div>

                  <div className="pt-1 text-right">
                    <Link
                      to={`/letter/${post.id}`}
                      className="text-xs font-bold text-gold hover:underline inline-flex items-center gap-1"
                    >
                      Read Letter →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How POSTA Works Section */}
      <section className="bg-envelope/30 border-t border-envelope py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-2xl md:text-3xl text-center text-ink mb-10">
            How POSTA Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-paper p-6 rounded-xl border border-envelope shadow-xs text-center space-y-3">
              <div className="w-10 h-10 bg-gold/10 text-gold rounded-full flex items-center justify-center mx-auto">
                <Send className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg text-ink">1. Write & Compose</h3>
              <p className="text-xs text-ink/70 leading-relaxed">
                Pick paper themes, express your thoughts, and seal your digital envelope.
              </p>
            </div>

            <div className="bg-paper p-6 rounded-xl border border-envelope shadow-xs text-center space-y-3">
              <div className="w-10 h-10 bg-gold/10 text-gold rounded-full flex items-center justify-center mx-auto">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg text-ink">2. Deliver</h3>
              <p className="text-xs text-ink/70 leading-relaxed">
                Your letter arrives safely in your recipient’s virtual postbox.
              </p>
            </div>

            <div className="bg-paper p-6 rounded-xl border border-envelope shadow-xs text-center space-y-3">
              <div className="w-10 h-10 bg-gold/10 text-gold rounded-full flex items-center justify-center mx-auto">
                <Heart className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg text-ink">3. Unfold & Read</h3>
              <p className="text-xs text-ink/70 leading-relaxed">
                The recipient unlocks and opens the envelope to reveal your message.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-envelope py-6 text-center text-xs text-ink/50">
        <p>© 2026 POSTA. Digital Letter Messaging.</p>
      </footer>
    </div>
  );
}