import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

interface Feed {
  id: number;
  user_id: number;
  content?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

interface User {
  id: number;
  email: string;
  username: string;
  nickname?: string;
  profile_image?: string;
}

interface Comment {
  id: number;
  feed_id: number;
  user_id: number;
  content: string;
  created_at: string;
}

interface LikeState {
  [feedId: number]: {
    count: number;
    liked: boolean;
  };
}

const FeedsPage = () => {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [comments, setComments] = useState<{ [feedId: number]: Comment[] }>({});
  const [commentInputs, setCommentInputs] = useState<{ [feedId: number]: string }>({});
  const [likes, setLikes] = useState<LikeState>({});

  // 로그인 체크
  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
    }
  }, [navigate]);

  // 피드 목록 불러오기
  const fetchFeeds = async () => {
    try {
      const res = await api.get('/feeds');
      setFeeds(res.data);
    } catch (err) {
      setError('피드 불러오기에 실패했습니다.');
    }
  };

  // 내 정보 불러오기
  const fetchMe = async () => {
    try {
      const res = await api.get('/me');
      setCurrentUser(res.data);
    } catch {
      setCurrentUser(null);
    }
  };

  // 댓글 불러오기
  const fetchComments = async (feedId: number) => {
    try {
      const res = await api.get(`/feeds/${feedId}/comments`);
      setComments(prev => ({ ...prev, [feedId]: res.data }));
    } catch {
      setComments(prev => ({ ...prev, [feedId]: [] }));
    }
  };

  // 댓글 작성
  const handleCommentSubmit = async (feedId: number, e: React.FormEvent) => {
    e.preventDefault();
    const content = commentInputs[feedId];
    if (!content) return;
    try {
      await api.post('/comments', { feed_id: feedId, content });
      setCommentInputs(prev => ({ ...prev, [feedId]: '' }));
      fetchComments(feedId);
    } catch {
      alert('댓글 작성에 실패했습니다.');
    }
  };

  // 댓글 삭제
  const handleCommentDelete = async (feedId: number, commentId: number) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/comments/${commentId}`);
      fetchComments(feedId);
    } catch {
      alert('댓글 삭제에 실패했습니다.');
    }
  };

  // 좋아요 개수 및 상태 불러오기
  const fetchLikes = async (feedId: number) => {
    try {
      const res = await api.get(`/feeds/${feedId}/likes`);
      // 내가 좋아요 했는지 확인
      let liked = false;
      if (currentUser) {
        const likeRes = await api.get(`/feeds/${feedId}/likes`);
        // 좋아요 개수만 반환하므로, liked는 토글 후에만 신뢰 가능. 프론트에서 토글 상태 관리
        liked = likes[feedId]?.liked || false;
      }
      setLikes(prev => ({ ...prev, [feedId]: { count: res.data.count, liked: prev[feedId]?.liked || false } }));
    } catch {
      setLikes(prev => ({ ...prev, [feedId]: { count: 0, liked: false } }));
    }
  };

  // 좋아요 토글
  const handleLike = async (feedId: number) => {
    try {
      await api.post(`/feeds/${feedId}/like`);
      setLikes(prev => ({
        ...prev,
        [feedId]: {
          count: prev[feedId]?.liked ? (prev[feedId]?.count || 1) - 1 : (prev[feedId]?.count || 0) + 1,
          liked: !prev[feedId]?.liked
        }
      }));
    } catch {
      alert('좋아요 처리에 실패했습니다.');
    }
  };

  // 피드 목록 불러올 때 댓글과 좋아요 정보도 같이 불러오기
  const fetchFeedsAndCommentsAndLikes = async () => {
    await fetchFeeds();
    setTimeout(() => {
      feeds.forEach(feed => {
        fetchComments(feed.id);
        fetchLikes(feed.id);
      });
    }, 100);
  };

  useEffect(() => {
    fetchMe();
    fetchFeedsAndCommentsAndLikes();
    // eslint-disable-next-line
  }, []);

  // 피드 작성
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('content', content);
      if (image) formData.append('image', image);
      await api.post('/feeds', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setContent('');
      setImage(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchFeeds();
    } catch (err: any) {
      setError(err.response?.data?.detail || '피드 작성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 피드 삭제
  const handleDelete = async (id: number) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/feeds/${id}`);
      setFeeds(feeds.filter(feed => feed.id !== id));
    } catch {
      alert('삭제에 실패했습니다.');
    }
  };

  return (
    <div style={{ background: '#fafafa', minHeight: '100vh' }}>
      <div style={{ maxWidth: 500, margin: '0 auto', padding: 16 }}>
        <h2 style={{ fontFamily: 'Grand Hotel, cursive', fontSize: 36, color: '#262626', textAlign: 'center', margin: '32px 0' }}>Instagram</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8, background: '#fff', border: '1px solid #dbdbdb', borderRadius: 8, padding: 16, marginBottom: 24 }}>
          <textarea
            placeholder="무슨 생각을 하고 계신가요?"
            value={content}
            onChange={e => setContent(e.target.value)}
            style={{ resize: 'none', border: '1px solid #dbdbdb', borderRadius: 4, padding: 8, fontSize: 16, minHeight: 60 }}
          />
          <input type="file" accept="image/*" ref={fileInputRef} onChange={e => setImage(e.target.files?.[0] || null)} />
          {error && <div style={{ color: 'red' }}>{error}</div>}
          <button type="submit" style={buttonStyle} disabled={loading}>{loading ? '업로드 중...' : '게시'}</button>
        </form>
        <div>
          {feeds.map(feed => (
            <div key={feed.id} style={{ background: '#fff', border: '1px solid #dbdbdb', borderRadius: 8, marginBottom: 24, padding: 16 }}>
              {feed.image_url && <img src={feed.image_url} alt="피드 이미지" style={{ width: '100%', borderRadius: 8, marginBottom: 8 }} />}
              <div style={{ fontWeight: 600, marginBottom: 4 }}>user_{feed.user_id}</div>
              <div style={{ marginBottom: 8 }}>{feed.content}</div>
              <div style={{ fontSize: 12, color: '#999' }}>{new Date(feed.created_at).toLocaleString()}</div>
              {currentUser && feed.user_id === currentUser.id && (
                <button onClick={() => handleDelete(feed.id)} style={deleteButtonStyle}>삭제</button>
              )}
              {/* 좋아요 버튼 및 개수 */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                <button
                  onClick={() => handleLike(feed.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: likes[feed.id]?.liked ? '#ed4956' : '#262626',
                    fontSize: 22,
                    marginRight: 8
                  }}
                >
                  ♥
                </button>
                <span style={{ fontWeight: 500, fontSize: 15 }}>{likes[feed.id]?.count || 0}명</span>
              </div>
              {/* 댓글 목록 */}
              <div style={{ marginTop: 12 }}>
                {comments[feed.id]?.map(comment => (
                  <div key={comment.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontWeight: 500, marginRight: 8, fontSize: 15 }}>user_{comment.user_id}</span>
                    <span style={{ fontSize: 15 }}>{comment.content}</span>
                    <span style={{ fontSize: 12, color: '#bbb', marginLeft: 8 }}>{new Date(comment.created_at).toLocaleTimeString()}</span>
                    {currentUser && comment.user_id === currentUser.id && (
                      <button onClick={() => handleCommentDelete(feed.id, comment.id)} style={commentDeleteButtonStyle}>삭제</button>
                    )}
                  </div>
                ))}
              </div>
              {/* 댓글 작성 폼 */}
              <form onSubmit={e => handleCommentSubmit(feed.id, e)} style={{ display: 'flex', marginTop: 8 }}>
                <input
                  type="text"
                  placeholder="댓글 달기..."
                  value={commentInputs[feed.id] || ''}
                  onChange={e => setCommentInputs(prev => ({ ...prev, [feed.id]: e.target.value }))}
                  style={{ flex: 1, border: '1px solid #dbdbdb', borderRadius: 4, padding: 6, fontSize: 15 }}
                />
                <button type="submit" style={commentButtonStyle}>게시</button>
              </form>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const buttonStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 0',
  background: '#0095f6',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  fontWeight: 600,
  fontSize: 16,
  cursor: 'pointer',
};

const deleteButtonStyle: React.CSSProperties = {
  marginTop: 8,
  background: '#ed4956',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  padding: '6px 12px',
  fontSize: 14,
  cursor: 'pointer',
};

const commentButtonStyle: React.CSSProperties = {
  marginLeft: 8,
  background: '#0095f6',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  padding: '6px 12px',
  fontSize: 15,
  fontWeight: 600,
  cursor: 'pointer',
};

const commentDeleteButtonStyle: React.CSSProperties = {
  marginLeft: 8,
  background: '#ed4956',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  padding: '2px 8px',
  fontSize: 12,
  cursor: 'pointer',
};

export default FeedsPage; 