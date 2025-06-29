import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, TextField, Button, Paper, Typography, Box, MenuItem } from '@mui/material';
import axios from 'axios';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [role, setRole] = useState('user');

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/register', {
        username,
        password,
        role: role
      });
      
      if (response.data.message === "Registration successful") {
        navigate('/login');
      } else {
        setError(response.data.message || '注册失败');
      }
    } catch (err) {
      setError('注册请求失败，请检查网络连接');
      console.error('Register error:', err);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} sx={{ padding: 4, marginTop: 8 }}>
        <Typography component="h1" variant="h5" align="center">
          注册
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
          />
          <TextField
            fullWidth
            margin="normal"
            label="密码"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <TextField
            fullWidth
            margin="normal"
            label="确认密码"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <TextField
            select
            fullWidth
            margin="normal"
            label="角色"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <MenuItem value="user">普通用户</MenuItem>
            <MenuItem value="admin">管理员</MenuItem>
          </TextField>
          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 3 }}
            onClick={handleRegister}
          >
            注册
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Register;
