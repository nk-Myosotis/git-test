import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Container, TextField, Button, Paper, Typography, Box } from '@mui/material';
import axios from 'axios';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth(); // 使用AuthContext中的login
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/login', {
        username,
        password
      });

      // 明确检查状态码
      if (response.status === 200) {
        // 使用AuthContext提供的login函数
        login(response.data.username, response.data.role);
        
        // 根据角色跳转
        const targetPath = response.data.role === 'admin' ? '/admin' : '/main-info';
        console.log('登录成功，跳转到:', targetPath);
        navigate(targetPath);
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        // 处理服务器返回的错误
        if (err.response) {
          switch (err.response.status) {
            case 401:
              setError('账号或密码错误');
              break;
            case 500:
              setError('服务器错误，请稍后重试');
              break;
            default:
              setError('登录失败，请检查输入');
          }
        } else {
          // 处理网络错误
          setError('网络连接失败，请检查网络');
        }
      } else {
        setError('发生未知错误');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} sx={{ padding: 4, marginTop: 8 }}>
        <Typography component="h1" variant="h5" align="center">
          登录
        </Typography>
        {error && (
          <Box color="error.main" textAlign="center" mt={2}>
            {error}
          </Box>
        )}
        <Box component="form" noValidate sx={{ mt: 3 }}>
          <TextField
            fullWidth
            margin="normal"
            label="用户名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading}
          />
          <TextField
            fullWidth
            margin="normal"
            label="密码"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 3 }}
            onClick={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? '登录中...' : '登录'}
          </Button>
          <Button
            fullWidth
            sx={{ mt: 2 }}
            onClick={() => navigate('/register')}
            disabled={isLoading}
          >
            还没有账号？注册
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;
