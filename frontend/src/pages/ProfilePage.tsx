import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

interface User {
  id: number;
  email: string;
  username: string;
  nickname?: string;
  profile_image?: string;
}

const ProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  // 내 정보 불러오기
  const fetchMe = async () => {
    try {
      const res = await api.get('/me');
      setCurrentUser(res.data);
    } catch {
      setCurrentUser(null);
    }
  };

  // 사용자 정보 불러오기
  const fetchUser = async () => {
    try {
      const res = await api.get(`/users/${userId}`);
      setUser(res.data);
    } catch {
      alert('사용자를 찾을 수 없습니다.');
      navigate('/feeds');
    }
  };

  // 팔로워/팔로잉 개수 불러오기
  const fetchFollowCounts = async () => {
    try {
      const [followerRes, followingRes] = await Promise.all([
        api.get(`/users/${userId}/followers/count`),
        api.get(`/users/${userId}/following/count`)
      ]);
      setFollowerCount(followerRes.data.count);
      setFollowingCount(followingRes.data.count);
    } catch {
      setFollowerCount(0);
      setFollowingCount(0);
    }
  };

  // 팔로우/언팔로우
  const handleFollow = async () => {
    try {
      await api.post(`/users/${userId}/follow`);
      setIsFollowing(!isFollowing);
      setFollowerCount(prev => isFollowing ? prev - 1 : prev + 1);
    } catch {
      alert('팔로우 처리에 실패했습니다.');
    }
  };

  useEffect(() => {
    fetchMe();
    fetchUser();
    fetchFollowCounts();
    setLoading(false);
  }, [userId]);

  if (loading) return <div>로딩 중...</div>;
  if (!user) return <div>사용자를 찾을 수 없습니다.</div>;

  return (
    <div style={{ background: '#fafafa', minHeight: '100vh' }}>
      <div style={{ maxWidth: 500, margin: '0 auto', padding: 16 }}>
        <div style={{ background: '#fff', border: '1px solid #dbdbdb', borderRadius: 8, padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#dbdbdb', marginRight: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {user.profile_image ? (
                <img src={user.profile_image} alt="프로필" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
              ) : (
                <span style={{ fontSize: 24, color: '#999' }}>👤</span>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: '0 0 8px 0', fontSize: 20 }}>{user.nickname || user.username}</h2>
              <div style={{ display: 'flex', gap: 24, marginBottom: 12 }}>
                <span><strong>{followerCount}</strong> 팔로워</span>
                <span><strong>{followingCount}</strong> 팔로잉</span>
              </div>
              {currentUser && currentUser.id !== user.id && (
                <button onClick={handleFollow} style={followButtonStyle}>
                  {isFollowing ? '언팔로우' : '팔로우'}
                </button>
              )}
            </div>
          </div>
          <div>
            <p style={{ margin: 0, color: '#262626' }}>@{user.username}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const followButtonStyle: React.CSSProperties = {
  background: '#0095f6',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  padding: '6px 16px',
  fontSize: 15,
  fontWeight: 600,
  cursor: 'pointer',
};

export default ProfilePage; 