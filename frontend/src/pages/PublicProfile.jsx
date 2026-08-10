import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Heart, MessageSquare, Lock, Unlock, Volume2, VolumeX, Calendar, User as UserIcon, Send, AlertCircle } from 'lucide-react';

function ReelVideo({ src }) {
  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play().catch((err) => console.log('Autoplay blocked:', err));
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.6 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  const toggleMute = (e) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="relative w-full max-w-xs mx-auto aspect-[9/16] bg-black rounded-2xl overflow-hidden shadow-lg border border-envelope/40 my-2">
      <video
        ref={videoRef}
        src={src}
        autoPlay
        loop
        muted={isMuted}
        playsInline
        className="w-full h-full object-cover"
      />
      <button
        type="button"
        onClick={toggleMute}
        className="absolute bottom-3 right-3 p-2 rounded-full bg-black/60 text-paper backdrop-blur-md hover:bg-black/80 transition z-10"
      >
        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>
    </div>
  );
}

export default function PublicProfile() {
  const { username } = useParams();
  const { user: currentUser } = useAuth();

  const [profileUser, setProfileUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // Comments state
  const [activeCommentsPostId, setActiveCommentsPostId] = useState(null);
  const [commentsMap, setCommentsMap] = useState({});
  const [commentInputs, setCommentInputs] = useState({});

  useEffect(() => {
    if (username) {
      fetchUserProfile();
    }
  }, [username]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await api.get(`/posts/user.php?username=${username}`);
      if (res.data.success) {
        setProfileUser(res.data.user);
        setPosts(res.data.posts || []);
      } else {
        setErrorMsg(res.data.message || 'User not found');
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      setErrorMsg(err.response?.data?.message || 'Could not load profile.');
    } finally {
      setLoading(false);
    }
  };

  // Like Action
  const handleLike = async (postId) => {
    try {
      const res = await api.post('/posts/like.php', { post_id: postId });
      if (res.data.success) {
        setPosts((prev) =>
          prev.map((p) => {
            if (Number(p.id) === Number(postId)) {
              const liked = res.data.liked;
              const currentLikes = Number(p.likes_count || 0);
              return {
                ...p,
                user_liked: liked ? 1 : 0,
                likes_count: liked ? currentLikes + 1 : Math.max(0, currentLikes - 1),
              };
            }
            return p;
          })
        );
      }
    } catch (err) {
      console.error('Failed to like post', err);
    }
  };

  // Toggle & Fetch Comments
  const toggleComments = async (postId) => {
    if (activeCommentsPostId === postId) {
      setActiveCommentsPostId(null);
      return;
    }
    setActiveCommentsPostId(postId);
    fetchComments(postId);
  };

  const fetchComments = async (postId) => {
    try {
      const res = await api.get(`/posts/comment.php?post_id=${postId}`);
      if (res.data.success) {
        setCommentsMap((prev) => ({ ...prev, [postId]: res.data.comments }));
      }
    } catch (err) {
      console.error('Failed to load comments', err);
    }
  };

  // Add Comment Action
  const handleAddComment = async (e, postId) => {
    e.preventDefault();
    const commentText = commentInputs[postId]?.trim();
    if (!commentText) return;

    try {
      const res = await api.post('/posts/comment.php', {
        post_id: postId,
        comment: commentText,
      });
      if (res.data.success) {
        setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
        fetchComments(postId);
        setPosts((prev) =>
          prev.map((p) =>
            Number(p.id) === Number(postId)
              ? { ...p, comments_count: Number(p.comments_count || 0) + 1 }
              : p
          )
        );
      }
    } catch (err) {
      alert('Failed to post comment');
    }
  };

  if (loading) return <div className="p-12 text-center text-xs text-ink/60">Loading profile...</div>;

  if (errorMsg || !profileUser) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-paper border border-envelope rounded-2xl text-center space-y-2">
        <AlertCircle className="w-8 h-8 text-stampRed mx-auto" />
        <h3 className="font-serif font-bold text-ink">User Profile Unavailable</h3>
        <p className="text-xs text-ink/60">{errorMsg || "User '@" + username + "' could not be found."}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Profile Header */}
      <div className="bg-paper border border-envelope/80 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center space-y-3">
        <div className="w-20 h-20 rounded-full bg-gold/20 border-2 border-gold flex items-center justify-center overflow-hidden font-serif text-2xl font-bold text-ink">
          {profileUser.avatar ? (
            <img src={`http://localhost/posta/backend/${profileUser.avatar}`} alt={profileUser.name} className="w-full h-full object-cover" />
          ) : (
            profileUser.name?.charAt(0).toUpperCase()
          )}
        </div>
        <div>
          <h1 className="text-lg font-bold font-serif text-ink">{profileUser.name}</h1>
          <p className="text-xs text-ink/50">@{profileUser.username}</p>
        </div>
        {profileUser.bio && <p className="text-xs text-ink/80 max-w-md leading-relaxed">{profileUser.bio}</p>}
        <div className="flex items-center gap-1 text-[11px] text-ink/40">
          <Calendar className="w-3.5 h-3.5" />
          <span>Joined {new Date(profileUser.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Profile Post Feed */}
      <div className="space-y-4">
        <h2 className="font-serif text-base font-bold text-ink flex items-center gap-2">
          <UserIcon className="w-4 h-4 text-gold" /> Posts by {profileUser.name}
        </h2>

        {posts.length === 0 ? (
          <p className="text-xs text-ink/40 text-center py-6 italic">No posts published yet.</p>
        ) : (
          posts.map((post) => {
            const isLocked = post.post_type === 'time_capsule' && new Date(post.unlock_at) > new Date();
            const isOwner = currentUser?.id === post.user_id;
            const isLiked = Number(post.user_liked) === 1;

            return (
              <div key={post.id} className="bg-paper border border-envelope/80 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold flex items-center justify-center overflow-hidden text-xs font-bold font-serif text-ink">
                      {post.avatar ? (
                        <img src={`http://localhost/posta/backend/${post.avatar}`} alt={post.name} className="w-full h-full object-cover" />
                      ) : (
                        post.name?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-ink">{post.name}</p>
                      <p className="text-[10px] text-ink/50">@{post.username}</p>
                    </div>
                  </div>

                  {post.post_type === 'time_capsule' && (
                    <span className={`text-[10px] px-2 py-1 rounded-full border font-semibold flex items-center gap-1 ${
                      isLocked ? 'bg-stampRed/10 text-stampRed border-stampRed/30' : 'bg-gold/20 text-ink border-gold/40'
                    }`}>
                      {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                      {isLocked ? `Unlocks ${new Date(post.unlock_at).toLocaleDateString()}` : 'Time Capsule Unlocked'}
                    </span>
                  )}
                </div>

                {isLocked && !isOwner ? (
                  <div className="p-4 bg-envelope/30 border border-dashed border-envelope rounded-xl text-center space-y-1">
                    <Lock className="w-6 h-6 text-ink/40 mx-auto" />
                    <p className="text-xs font-semibold text-ink/60">This Time Capsule is sealed</p>
                    <p className="text-[11px] text-ink/40">Unlocks on {new Date(post.unlock_at).toLocaleString()}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {post.content && <p className="text-sm text-ink/90 font-sans leading-relaxed">{post.content}</p>}
                    {post.media_url && (
                      <div>
                        {post.media_type === 'video' ? (
                          <ReelVideo src={`http://localhost/posta/backend/${post.media_url}`} />
                        ) : (
                          <div className="rounded-xl overflow-hidden border border-envelope/60 bg-black/5 flex justify-center">
                            <img src={`http://localhost/posta/backend/${post.media_url}`} alt="Attachment" className="w-full max-h-96 object-cover rounded-xl" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Likes & Comments Toolbar */}
                <div className="pt-2 border-t border-envelope/40 flex items-center justify-between text-xs text-ink/60">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-1.5 transition ${isLiked ? 'text-stampRed font-semibold' : 'hover:text-ink'}`}
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-stampRed text-stampRed' : ''}`} />
                      <span>{Number(post.likes_count) || 0}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleComments(post.id)}
                      className="flex items-center gap-1.5 hover:text-ink transition"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>{Number(post.comments_count) || 0}</span>
                    </button>
                  </div>

                  <span className="text-[10px] text-ink/40">{new Date(post.created_at).toLocaleString()}</span>
                </div>

                {/* Active Comments Section */}
                {activeCommentsPostId === post.id && (
                  <div className="pt-2 space-y-3 border-t border-dashed border-envelope">
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {(commentsMap[post.id] || []).length === 0 ? (
                        <p className="text-[11px] text-ink/40 italic">No comments yet.</p>
                      ) : (
                        commentsMap[post.id].map((c) => (
                          <div key={c.id} className="flex gap-2 text-xs bg-envelope/20 p-2 rounded-xl border border-envelope/40">
                            <div className="w-6 h-6 rounded-full bg-gold/20 border border-gold flex items-center justify-center shrink-0 font-bold text-[10px]">
                              {c.avatar ? (
                                <img src={`http://localhost/posta/backend/${c.avatar}`} alt={c.name} className="w-full h-full object-cover rounded-full" />
                              ) : (
                                c.name?.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div>
                              <span className="font-bold text-ink mr-1.5">{c.name}</span>
                              <span className="text-ink/80">{c.comment}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {currentUser && (
                      <form onSubmit={(e) => handleAddComment(e, post.id)} className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Write a comment..."
                          value={commentInputs[post.id] || ''}
                          onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                          className="flex-1 bg-paper border border-envelope text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-gold text-ink"
                        />
                        <button
                          type="submit"
                          className="px-3 py-1.5 bg-ink text-paper text-xs font-semibold rounded-xl hover:bg-gold hover:text-ink transition flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" /> Send
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}