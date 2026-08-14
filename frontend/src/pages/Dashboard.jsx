import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Clock, Send, Lock, Unlock, Sparkles, Image, Video, X, Heart, MessageSquare, Volume2, VolumeX } from 'lucide-react';

// Dedicated Reel Video Component for Autoplay & Vertical Layout
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

export default function Dashboard() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState('public');
  const [unlockDate, setUnlockDate] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Comment section state
  const [activeCommentsPostId, setActiveCommentsPostId] = useState(null);
  const [commentsMap, setCommentsMap] = useState({});
  const [commentInputs, setCommentInputs] = useState({});

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    try {
      const res = await api.get('/posts/index.php');
      if (res.data.success) {
        setPosts(res.data.posts);
      }
    } catch (err) {
      console.error('Failed to load feed', err);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const clearMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!content.trim() && !mediaFile) return;

    const formData = new FormData();
    formData.append('content', content);
    formData.append('post_type', postType);
    if (postType === 'time_capsule' && unlockDate) {
      formData.append('unlock_at', unlockDate);
    }
    if (mediaFile) {
      formData.append('media', mediaFile);
    }

    try {
      setLoading(true);
      // Route to create.php and let Axios handle boundary headers automatically
      const res = await api.post('/posts/create.php', formData);

      if (res.data.success) {
        setContent('');
        setUnlockDate('');
        setPostType('public');
        clearMedia();
        fetchFeed();
      } else {
        alert(res.data.message || 'Failed to share post');
      }
    } catch (err) {
      console.error('Post submission error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to share post';
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Toggle Like
  const handleLike = async (postId) => {
    try {
      const res = await api.post('/posts/like.php', { post_id: postId });
      if (res.data.success) {
        setPosts((prevPosts) =>
          prevPosts.map((p) => {
            if (p.id === postId) {
              const liked = res.data.liked;
              return {
                ...p,
                user_liked: liked ? 1 : 0,
                likes_count: liked ? Number(p.likes_count) + 1 : Number(p.likes_count) - 1,
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

  // Toggle Comment Thread
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

  // Submit Comment
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
            p.id === postId ? { ...p, comments_count: Number(p.comments_count) + 1 } : p
          )
        );
      }
    } catch (err) {
      alert('Failed to post comment');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Composer */}
      <div className="bg-envelope/40 border border-envelope/80 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gold/20 border border-gold flex items-center justify-center overflow-hidden font-bold font-serif text-ink">
            {user?.avatar ? (
              <img src={`http://localhost/posta/backend/${user.avatar}`} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              user?.name?.charAt(0).toUpperCase()
            )}
          </div>
          <span className="text-xs font-semibold text-ink">What's on your mind, {user?.name}?</span>
        </div>

        <form onSubmit={handleCreatePost} className="space-y-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              postType === 'time_capsule'
                ? "Write a time capsule message to be unsealed in the future..."
                : "Share a memory, update, image, or video with the feed..."
            }
            className="w-full bg-paper border border-envelope rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold text-ink resize-none h-24"
          />

          {mediaPreview && (
            <div className="relative rounded-xl overflow-hidden border border-envelope bg-black/5 max-h-80 flex items-center justify-center p-2">
              <button
                type="button"
                onClick={clearMedia}
                className="absolute top-2 right-2 bg-ink/70 text-paper rounded-full p-1 hover:bg-ink transition z-10"
              >
                <X className="w-4 h-4" />
              </button>
              {mediaFile?.type.startsWith('video') ? (
                <div className="w-full max-w-xs aspect-[9/16] bg-black rounded-xl overflow-hidden">
                  <video src={mediaPreview} controls className="w-full h-full object-cover" />
                </div>
              ) : (
                <img src={mediaPreview} alt="Upload preview" className="max-h-60 object-contain rounded-xl" />
              )}
            </div>
          )}

          {postType === 'time_capsule' && (
            <div className="flex items-center gap-2 bg-gold/10 p-2.5 rounded-xl border border-gold/30">
              <Clock className="w-4 h-4 text-gold" />
              <label className="text-xs font-medium text-ink">Unlock Date:</label>
              <input
                type="datetime-local"
                value={unlockDate}
                onChange={(e) => setUnlockDate(e.target.value)}
                required={postType === 'time_capsule'}
                className="bg-paper border border-envelope text-xs rounded-lg p-1.5 focus:outline-none text-ink"
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPostType('public')}
                className={`px-3 py-1.5 text-xs rounded-lg border transition ${
                  postType === 'public'
                    ? 'bg-ink text-paper font-semibold border-ink'
                    : 'bg-paper text-ink/70 border-envelope hover:bg-envelope/30'
                }`}
              >
                Public Post
              </button>
              
              <button
                type="button"
                onClick={() => setPostType('time_capsule')}
                className={`px-3 py-1.5 text-xs rounded-lg border flex items-center gap-1 transition ${
                  postType === 'time_capsule'
                    ? 'bg-gold text-ink font-semibold border-gold'
                    : 'bg-paper text-ink/70 border-envelope hover:bg-envelope/30'
                }`}
              >
                <Clock className="w-3.5 h-3.5" /> Time Capsule
              </button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,video/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 rounded-lg border border-envelope text-ink/70 hover:text-ink hover:bg-envelope/30 transition flex items-center gap-1 text-xs"
                title="Attach photo or video"
              >
                <Image className="w-4 h-4 text-gold" />
                <Video className="w-4 h-4 text-gold" />
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 bg-ink text-paper text-xs font-semibold rounded-xl hover:bg-gold hover:text-ink transition flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" /> Post
            </button>
          </div>
        </form>
      </div>

      {/* Feed List */}
      <div className="space-y-4">
        <h2 className="font-serif text-lg font-bold text-ink flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-gold" /> Posta Feed
        </h2>

        {posts.map((post) => {
          const isLocked =
            post.post_type === 'time_capsule' &&
            new Date(post.unlock_at) > new Date();
          const isOwner = user?.id === post.user_id;

          return (
            <div key={post.id} className="bg-paper border border-envelope/80 rounded-2xl p-4 shadow-sm space-y-3">
              {/* Author Bar */}
              <div className="flex items-center justify-between">
                <Link to={`/user/${post.username}`} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold flex items-center justify-center overflow-hidden text-xs font-bold font-serif text-ink">
                    {post.avatar ? (
                      <img src={`http://localhost/posta/backend/${post.avatar}`} alt={post.name} className="w-full h-full object-cover" />
                    ) : (
                      post.name?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-ink hover:underline">{post.name}</p>
                    <p className="text-[10px] text-ink/50">@{post.username}</p>
                  </div>
                </Link>

                {post.post_type === 'time_capsule' && (
                  <span className={`text-[10px] px-2 py-1 rounded-full border font-semibold flex items-center gap-1 ${
                    isLocked ? 'bg-stampRed/10 text-stampRed border-stampRed/30' : 'bg-gold/20 text-ink border-gold/40'
                  }`}>
                    {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    {isLocked ? `Unlocks ${new Date(post.unlock_at).toLocaleDateString()}` : 'Time Capsule Unlocked'}
                  </span>
                )}
              </div>

              {/* Content / Media */}
              {isLocked && !isOwner ? (
                <div className="p-4 bg-envelope/30 border border-dashed border-envelope rounded-xl text-center space-y-1">
                  <Lock className="w-6 h-6 text-ink/40 mx-auto" />
                  <p className="text-xs font-semibold text-ink/60">This Time Capsule is sealed</p>
                  <p className="text-[11px] text-ink/40">
                    Unlocks on {new Date(post.unlock_at).toLocaleString()}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {post.content && (
                    <p className="text-sm text-ink/90 font-sans leading-relaxed">{post.content}</p>
                  )}

                  {post.media_url && (
                    <div>
                      {post.media_type === 'video' ? (
                        <ReelVideo src={`http://localhost/posta/backend/${post.media_url}`} />
                      ) : (
                        <div className="rounded-xl overflow-hidden border border-envelope/60 bg-black/5 flex justify-center">
                          <img
                            src={`http://localhost/posta/backend/${post.media_url}`}
                            alt="Post attachment"
                            className="w-full max-h-96 object-cover rounded-xl"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Actions Bar: Like & Comment Controls */}
              <div className="pt-2 border-t border-envelope/40 flex items-center justify-between text-xs text-ink/60">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-1.5 transition ${
                      post.user_liked ? 'text-stampRed font-semibold' : 'hover:text-ink'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${post.user_liked ? 'fill-stampRed text-stampRed' : ''}`} />
                    <span>{post.likes_count || 0}</span>
                  </button>

                  <button
                    onClick={() => toggleComments(post.id)}
                    className="flex items-center gap-1.5 hover:text-ink transition"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{post.comments_count || 0}</span>
                  </button>
                </div>

                <span className="text-[10px] text-ink/40">{new Date(post.created_at).toLocaleString()}</span>
              </div>

              {/* Comment Thread */}
              {activeCommentsPostId === post.id && (
                <div className="pt-2 space-y-3 border-t border-dashed border-envelope">
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {(commentsMap[post.id] || []).length === 0 ? (
                      <p className="text-[11px] text-ink/40 italic">No comments yet. Be the first to comment!</p>
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
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}