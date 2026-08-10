import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Camera, MapPin, Globe, Calendar, 
  Edit3, MessageSquare, Heart, Loader2, 
  CheckCircle, AlertCircle, Send, Trash2 
} from 'lucide-react';

const Profile = () => {
  const [activeTab, setActiveTab] = useState('timeline');
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Interactive Post States
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [commentsMap, setCommentsMap] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [loadingComments, setLoadingComments] = useState({});

  // Edit Form States
  const [formData, setFormData] = useState({ name: '', bio: '', location: '', website: '' });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const res = await axios.get('http://localhost/posta/backend/api/profile/get.php', { withCredentials: true });
      if (res.data.success) {
        const u = res.data.user;
        setUser(u);
        setFormData({
          name: u.name || '',
          bio: u.bio || '',
          location: u.location || '',
          website: u.website || '',
        });
        if (u.avatar) setAvatarPreview(`http://localhost/posta/backend/${u.avatar}`);
        if (u.cover_photo) setCoverPreview(`http://localhost/posta/backend/${u.cover_photo}`);
      }

      const postsRes = await axios.get('http://localhost/posta/backend/api/posts/index.php', { withCredentials: true });
      if (postsRes.data.success) {
        setPosts(postsRes.data.posts.filter(p => p.user_id === res.data.user.id));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Delete Post Handler
  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      const res = await axios.post(
        'http://localhost/posta/backend/api/posts/delete.php',
        { post_id: postId },
        { withCredentials: true }
      );

      if (res.data.success) {
        setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
      } else {
        alert(res.data.message || 'Failed to delete post.');
      }
    } catch (err) {
      console.error('Error deleting post:', err);
      alert('An error occurred while deleting the post.');
    }
  };

  const handleLikeToggle = async (postId) => {
    try {
      const res = await axios.post(
        'http://localhost/posta/backend/api/likes/toggle.php',
        { post_id: postId },
        { withCredentials: true }
      );
      if (res.data.success) {
        setPosts(prevPosts =>
          prevPosts.map(post => {
            if (post.id === postId) {
              const isLiked = res.data.liked;
              return {
                ...post,
                user_liked: isLiked,
                likes_count: isLiked ? post.likes_count + 1 : Math.max(0, post.likes_count - 1)
              };
            }
            return post;
          })
        );
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const fetchComments = async (postId) => {
    setLoadingComments(prev => ({ ...prev, [postId]: true }));
    try {
      const res = await axios.get(`http://localhost/posta/backend/api/comments/index.php?post_id=${postId}`, {
        withCredentials: true
      });
      if (res.data.success) {
        setCommentsMap(prev => ({ ...prev, [postId]: res.data.comments }));
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoadingComments(prev => ({ ...prev, [postId]: false }));
    }
  };

  const toggleComments = (postId) => {
    if (activeCommentPostId === postId) {
      setActiveCommentPostId(null);
    } else {
      setActiveCommentPostId(postId);
      if (!commentsMap[postId]) {
        fetchComments(postId);
      }
    }
  };

  const handleAddComment = async (e, postId) => {
    e.preventDefault();
    const commentText = commentInputs[postId]?.trim();
    if (!commentText) return;

    try {
      const res = await axios.post(
        'http://localhost/posta/backend/api/comments/create.php',
        { post_id: postId, comment: commentText },
        { withCredentials: true }
      );

      if (res.data.success) {
        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
        fetchComments(postId);
        setPosts(prevPosts =>
          prevPosts.map(post =>
            post.id === postId ? { ...post, comments_count: post.comments_count + 1 } : post
          )
        );
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  const handleFileChange = (e, setFile, setPreview) => {
    const file = e.target.files[0];
    if (file) {
      setFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMessage({ type: '', text: '' });

    const data = new FormData();
    data.append('name', formData.name);
    data.append('bio', formData.bio);
    data.append('location', formData.location);
    data.append('website', formData.website);
    if (avatarFile) data.append('avatar', avatarFile);
    if (coverFile) data.append('cover_photo', coverFile);

    try {
      const res = await axios.post('http://localhost/posta/backend/api/profile/update.php', data, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        setStatusMessage({ type: 'success', text: 'Profile updated successfully!' });
        fetchProfileData();
      } else {
        setStatusMessage({ type: 'error', text: res.data.message || 'Failed to update.' });
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'An error occurred during saving.';
      setStatusMessage({ type: 'error', text: errorMsg });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-700" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans pb-12">
      {/* Header & Banner */}
      <div className="bg-white shadow">
        <div className="max-w-6xl mx-auto">
          <div className="relative h-64 md:h-80 w-full bg-gradient-to-r from-slate-200 to-slate-300 rounded-b-lg overflow-hidden group">
            {coverPreview ? (
              <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-slate-300" />
            )}
            <label className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-gray-800 text-xs font-semibold px-3 py-2 rounded-md cursor-pointer flex items-center gap-2 shadow transition">
              <Camera className="w-4 h-4" /> Edit Cover Photo
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={(e) => handleFileChange(e, setCoverFile, setCoverPreview)} 
              />
            </label>
          </div>

          <div className="px-6 pb-4 flex flex-col md:flex-row items-center md:items-end justify-between -mt-16 md:-mt-8 gap-4 border-b border-gray-200">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-4 text-center md:text-left">
              <div className="relative w-36 h-36 rounded-full border-4 border-white overflow-hidden bg-gray-200 shadow-md">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-4xl text-gray-600">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                )}
                <label className="absolute bottom-1 right-1 p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full cursor-pointer shadow border border-gray-300">
                  <Camera className="w-4 h-4" />
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => handleFileChange(e, setAvatarFile, setAvatarPreview)} 
                  />
                </label>
              </div>

              <div className="mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{user?.name}</h1>
                <p className="text-sm font-medium text-gray-500">@{user?.username || user?.email?.split('@')[0]}</p>
                <p className="text-xs text-gray-600 mt-1">{posts.length} Posts</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => setActiveTab('settings')}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md font-semibold text-sm flex items-center gap-2 transition"
              >
                <Edit3 className="w-4 h-4" /> Edit Profile
              </button>
            </div>
          </div>

          <div className="flex px-4 gap-1 text-sm font-semibold text-gray-600">
            {['timeline', 'about', 'settings'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-4 capitalize border-b-2 transition ${
                  activeTab === tab 
                    ? 'border-gray-900 text-gray-900 font-bold' 
                    : 'border-transparent hover:bg-gray-100 text-gray-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto mt-4 px-4">
        {activeTab === 'timeline' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Intro Sidebar */}
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 space-y-3">
                <h2 className="text-lg font-bold text-gray-900">Intro</h2>
                <p className="text-sm text-gray-700 text-center italic">{user?.bio || 'No bio added yet.'}</p>
                <hr className="border-gray-200" />
                <div className="space-y-2 text-sm text-gray-600">
                  {user?.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" /> Lives in <span className="font-semibold text-gray-800">{user.location}</span>
                    </div>
                  )}
                  {user?.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-gray-400" /> <a href={user.website} target="_blank" rel="noreferrer" className="text-gray-800 hover:underline truncate">{user.website}</a>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" /> Joined {new Date(user?.created_at || Date.now()).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            {/* User Posts Column */}
            <div className="md:col-span-2 space-y-4">
              {posts.length === 0 ? (
                <div className="bg-white p-8 rounded-lg shadow-sm text-center border border-gray-200 text-gray-500">
                  No posts published yet.
                </div>
              ) : (
                posts.map((post) => (
                  <div key={post.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
                    {/* Header: Avatar, Name, and Delete Button */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center font-bold text-gray-600">
                          {avatarPreview ? <img src={avatarPreview} alt="" className="w-full h-full object-cover" /> : user?.name?.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-gray-900 leading-tight">{user?.name}</h4>
                          <span className="text-xs text-gray-400">@{user?.username || user?.email?.split('@')[0]}</span>
                        </div>
                      </div>

                      {/* Delete Option */}
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 transition"
                        title="Delete Post"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    {/* Body Text */}
                    <p className="text-sm text-gray-800">{post.content}</p>

                    {/* Media */}
                    {post.media_url && (
                      <div className="rounded-lg overflow-hidden max-h-96 bg-black flex items-center justify-center">
                        <img src={`http://localhost/posta/backend/${post.media_url}`} alt="Post content" className="object-cover max-h-96 w-full" />
                      </div>
                    )}

                    {/* Feed Style Footer: Left Actions + Right Timestamp */}
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <button 
                          onClick={() => handleLikeToggle(post.id)}
                          className={`flex items-center gap-1.5 transition ${post.user_liked ? 'text-red-500 font-semibold' : 'hover:text-gray-700'}`}
                        >
                          <Heart className={`w-4 h-4 ${post.user_liked ? 'fill-red-500 text-red-500' : ''}`} />
                          <span>{post.likes_count ?? 0}</span>
                        </button>

                        <button 
                          onClick={() => toggleComments(post.id)}
                          className="flex items-center gap-1.5 hover:text-gray-700 transition"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>{post.comments_count ?? 0}</span>
                        </button>
                      </div>

                      <span className="text-xs text-gray-400">
                        {new Date(post.created_at).toLocaleString()}
                      </span>
                    </div>

                    {/* Collapsible Comments */}
                    {activeCommentPostId === post.id && (
                      <div className="pt-3 border-t border-gray-100 space-y-3">
                        <form onSubmit={(e) => handleAddComment(e, post.id)} className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Write a comment..."
                            value={commentInputs[post.id] || ''}
                            onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                            className="flex-1 px-3 py-1.5 text-xs bg-gray-100 border border-gray-200 rounded-full focus:outline-none focus:bg-white focus:ring-1 focus:ring-gray-400"
                          />
                          <button
                            type="submit"
                            className="p-1.5 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </form>

                        {loadingComments[post.id] ? (
                          <div className="flex justify-center py-2">
                            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {(commentsMap[post.id] || []).length === 0 ? (
                              <p className="text-xs text-gray-400 text-center py-1">No comments yet.</p>
                            ) : (
                              commentsMap[post.id].map(comment => (
                                <div key={comment.id} className="bg-gray-50 p-2 rounded-lg text-xs">
                                  <span className="font-semibold text-gray-900 mr-2">{comment.name || comment.username}</span>
                                  <span className="text-gray-700">{comment.comment}</span>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">Edit Profile Details</h2>
            
            {statusMessage.text && (
              <div className={`mb-4 p-3 rounded-md flex items-center gap-2 text-sm ${statusMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {statusMessage.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {statusMessage.text}
              </div>
            )}

            <form onSubmit={handleProfileSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-gray-400 focus:outline-none" 
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Bio</label>
                <textarea 
                  rows="3" 
                  value={formData.bio} 
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-gray-400 focus:outline-none" 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Location</label>
                <input 
                  type="text" 
                  value={formData.location} 
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-gray-400 focus:outline-none" 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Website</label>
                <input 
                  type="url" 
                  value={formData.website} 
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-gray-400 focus:outline-none" 
                />
              </div>

              <button 
                type="submit" 
                disabled={submitting}
                className="w-full py-2.5 bg-gray-900 text-white font-semibold rounded-md hover:bg-gray-800 transition flex justify-center items-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;