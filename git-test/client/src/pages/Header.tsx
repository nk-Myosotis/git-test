import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { BellOutlined, SettingOutlined } from '@ant-design/icons';
import { useAuth } from '../auth/AuthContext'; // 导入useAuth

// 类型定义
interface HeaderButton {
  id: string;
  text: string;
  path: string;
}

interface HeaderProps {
  isAuthenticated: boolean;
}

const HeaderContainer = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: rgb(30, 162, 215); /* 天蓝色 */
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
`;

const Section = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
`;

const LeftSection = styled(Section)`
  justify-content: flex-start;
  gap: 0.1rem;
`;

const CenterSection = styled.div`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
`;

const RightSection = styled(Section)`
  justify-content: flex-end;
  gap: 2rem;
`;

const SystemTitle = styled.h1`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 500;
  letter-spacing: 1px;
  white-space: nowrap;
`;

const TimeDisplay = styled.div`
  font-family: 'Roboto Mono', monospace;
  font-size: 1.1rem;
`;

const NavButton = styled.button`
  background: none;
  border: none;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 1.1rem;
  display: flex;
  align-items: center;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  &:active {
    transform: scale(0.98);
  }
`;

const LogoutButton = styled(NavButton)`
  color: #ff4d4f;
  &:hover {
    background-color: rgba(255, 77, 79, 0.1);
  }
`;

const AdminButton = styled.button`
  background: none;
  border: none;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  &:active {
    transform: scale(0.98);
  }
`;

const Header: React.FC<HeaderProps> = ({ isAuthenticated }) => {
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth(); // 使用AuthContext
  const [currentTime, setCurrentTime] = useState<string>('');
  
  // 更新时间
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const formattedTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')} ${now.getFullYear()}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getDate().toString().padStart(2, '0')}`;
      setCurrentTime(formattedTime);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 导航按钮配置
  const navButtons: HeaderButton[] = [
    { id: 'main-info', text: '主要信息', path: '/main-info' },
    { id: 'underwater', text: '水下系统', path: '/underwater' },
    { id: 'data-center', text: '数据中心', path: '/data-center' },
    { id: 'intelligent', text: '智能中心', path: '/intelligent' }
  ];

  // 处理导航点击
  const handleNavigation = (path: string) => {
    if (user) { // 检查用户是否已登录
      navigate(path);
    } else {
      navigate('/login');
    }
  };

  // 处理退出登录
  const handleLogout = () => {
    logout(); // 使用AuthContext提供的logout方法
    navigate('/login');
  };

  // 处理登录按钮点击
  const handleLoginClick = () => {
    navigate('/login');
  };

  // 处理注册按钮点击
  const handleRegisterClick = () => {
    navigate('/register');
  };

  // 处理管理员按钮点击
  const handleAdminClick = () => {
    if (isAdmin) {
      navigate('/admin');
    } else {
      alert('无管理员权限');
    }
  };

  return (
    <HeaderContainer>
      {/* 左侧导航区 */}
      <LeftSection>
        {navButtons.map((button) => (
          <NavButton
            key={button.id}
            onClick={() => handleNavigation(button.path)}
          >
            {button.text}
          </NavButton>
        ))}
      </LeftSection>

      {/* 中间标题 */}
      <CenterSection>
        <SystemTitle>智慧海洋牧场可视化系统</SystemTitle>
      </CenterSection>

      {/* 右侧功能区 */}
      <RightSection>
        <TimeDisplay>{currentTime}</TimeDisplay>
        
        {/* 根据登录状态显示不同的内容 */}
        {user ? (
          <>
            {user.username && <span>欢迎，{user.username}</span>}
            <LogoutButton onClick={handleLogout}>退出系统</LogoutButton>
            {isAdmin && (
              <AdminButton onClick={handleAdminClick}>
                <SettingOutlined /> 
                用户管理
              </AdminButton>
            )}
          </>
        ) : (
          <>
            <NavButton onClick={handleLoginClick}>登录</NavButton>
            <NavButton onClick={handleRegisterClick}>注册</NavButton>
          </>
        )}
      </RightSection>
    </HeaderContainer>
  );
};

export default Header;
