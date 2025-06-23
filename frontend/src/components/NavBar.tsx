import React from 'react';
import { useNavigate } from 'react-router-dom';

const NavBar = () => {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav style={{
      width: '100%',
      background: '#fff',
      borderBottom: '1px solid #dbdbdb',
      padding: '12px 0',
      marginBottom: 32,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 10
    }}>
      <div style={{ fontFamily: 'Grand Hotel, cursive', fontSize: 32, color: '#262626', cursor: 'pointer' }} onClick={() => navigate('/feeds')}>
        Instagram
      </div>
      <div style={{ position: 'absolute', right: 32 }}>
        {isLoggedIn ? (
          <button onClick={handleLogout} style={logoutButtonStyle}>로그아웃</button>
        ) : (
          <>
            <button onClick={() => navigate('/login')} style={navButtonStyle}>로그인</button>
            <button onClick={() => navigate('/signup')} style={navButtonStyle}>회원가입</button>
          </>
        )}
      </div>
    </nav>
  );
};

const navButtonStyle: React.CSSProperties = {
  marginLeft: 8,
  background: '#0095f6',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  padding: '6px 16px',
  fontSize: 15,
  fontWeight: 600,
  cursor: 'pointer',
};

const logoutButtonStyle: React.CSSProperties = {
  ...navButtonStyle,
  background: '#ed4956',
};

export default NavBar; 