import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const SignupPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    username: '',
    password: '',
    nickname: '',
    profile_image: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/signup', form);
      alert('회원가입이 완료되었습니다!');
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.detail || '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#fafafa' }}>
      <form onSubmit={handleSubmit} style={{ width: 350, padding: 32, background: '#fff', border: '1px solid #dbdbdb', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        <h1 style={{ textAlign: 'center', fontFamily: 'Grand Hotel, cursive', fontSize: 40, color: '#262626', marginBottom: 24 }}>Instagram</h1>
        <input name="email" type="email" placeholder="이메일" value={form.email} onChange={handleChange} required style={inputStyle} />
        <input name="username" placeholder="사용자명" value={form.username} onChange={handleChange} required style={inputStyle} />
        <input name="nickname" placeholder="닉네임" value={form.nickname} onChange={handleChange} required style={inputStyle} />
        <input name="profile_image" placeholder="프로필 이미지 URL" value={form.profile_image} onChange={handleChange} style={inputStyle} />
        <input name="password" type="password" placeholder="비밀번호" value={form.password} onChange={handleChange} required style={inputStyle} />
        {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
        <button type="submit" style={buttonStyle} disabled={loading}>{loading ? '가입 중...' : '가입'}</button>
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          계정이 있으신가요? <a href="/login" style={{ color: '#0095f6' }}>로그인</a>
        </div>
      </form>
    </div>
  );
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  marginBottom: 10,
  border: '1px solid #dbdbdb',
  borderRadius: 4,
  fontSize: 16,
  background: '#fafafa',
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

export default SignupPage; 