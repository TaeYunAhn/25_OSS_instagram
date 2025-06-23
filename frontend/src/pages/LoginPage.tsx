import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const LoginPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    username: '',
    password: ''
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
      // email 또는 username 중 하나만 보내도 됨
      await api.post('/login', form).then(res => {
        localStorage.setItem('token', res.data.access_token);
        navigate('/feeds');
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#fafafa' }}>
      <form onSubmit={handleSubmit} style={{ width: 350, padding: 32, background: '#fff', border: '1px solid #dbdbdb', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        <h1 style={{ textAlign: 'center', fontFamily: 'Grand Hotel, cursive', fontSize: 40, color: '#262626', marginBottom: 24 }}>Instagram</h1>
        <input name="email" type="email" placeholder="이메일 (또는 사용자명)" value={form.email} onChange={handleChange} style={inputStyle} />
        <input name="username" placeholder="사용자명 (또는 이메일)" value={form.username} onChange={handleChange} style={inputStyle} />
        <input name="password" type="password" placeholder="비밀번호" value={form.password} onChange={handleChange} required style={inputStyle} />
        {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
        <button type="submit" style={buttonStyle} disabled={loading}>{loading ? '로그인 중...' : '로그인'}</button>
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          계정이 없으신가요? <a href="/signup" style={{ color: '#0095f6' }}>회원가입</a>
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

export default LoginPage; 