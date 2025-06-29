import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type User = {
  username: string;
  role: string;
};

type AuthContextType = {
  user: User | null;
  login: (username: string, role: string) => void;
  logout: () => void;
  isAdmin: boolean;
  isInitialized: boolean; // 添加初始化状态标志
};

// 创建带有默认值的AuthContext
const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
  isAdmin: false,
  isInitialized: false
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // 初始化时从localStorage恢复用户状态
  useEffect(() => {
    const initializeAuth = () => {
      const username = localStorage.getItem('username');
      const role = localStorage.getItem('userRole');
      
      if (username && role) {
        setUser({ username, role });
        setIsAdmin(role === 'admin');
      }
      
      // 标记认证状态已初始化
      setIsInitialized(true);
    };

    initializeAuth();
  }, []);

  const login = (username: string, role: string) => {
    // 设置内存中的状态
    setUser({ username, role });
    setIsAdmin(role === 'admin');
    
    // 将用户信息存储到localStorage中
    localStorage.setItem('username', username);
    localStorage.setItem('userRole', role);
  };

  const logout = () => {
    // 清除内存中的状态
    setUser(null);
    setIsAdmin(false);
    
    // 清除localStorage中的用户信息
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');
  };

  // 提供上下文值
  const contextValue: AuthContextType = {
    user,
    login,
    logout,
    isAdmin,
    isInitialized
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
