import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Snackbar,
  Alert,
  SelectChangeEvent
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import styled from 'styled-components';

// 定义用户类型
interface User {
  id: number;
  username: string;
  role: string;
}

// 定义表单数据类型
interface FormData {
  username: string;
  password: string;
  role: string;
}

const PageContainer = styled.div`
  padding: 2rem;
`;

const TableHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const AdminManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<FormData>({
    username: '',
    password: '',
    role: 'user'
  });
  const [alertInfo, setAlertInfo] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

  // 获取所有用户
  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else {
        throw new Error('获取用户列表失败');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showAlert('获取用户列表失败', 'error');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 处理文本框输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // 处理下拉框选择变化
  const handleSelectChange = (event: SelectChangeEvent) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 显示提示信息
  const showAlert = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setAlertInfo({
      open: true,
      message,
      severity
    });
  };

  // 添加用户
  const handleAddUser = async () => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setOpenAddDialog(false);
        resetForm();
        fetchUsers();
        showAlert('用户添加成功');
      } else {
        const error = await response.json();
        throw new Error(error.message || '添加用户失败');
      }
    } catch (error: any) {
      console.error('Error adding user:', error);
      showAlert(error.message || '添加用户失败', 'error');
    }
  };

  // 编辑用户
  const handleEditUser = async () => {
    if (!currentUser) return;

    try {
      const response = await fetch(`/api/users/${currentUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setOpenEditDialog(false);
        resetForm();
        fetchUsers();
        showAlert('用户更新成功');
      } else {
        const error = await response.json();
        throw new Error(error.message || '更新用户失败');
      }
    } catch (error: any) {
      console.error('Error updating user:', error);
      showAlert(error.message || '更新用户失败', 'error');
    }
  };

  // 删除用户
  const handleDeleteUser = async () => {
    if (!currentUser) return;

    try {
      const response = await fetch(`/api/users/${currentUser.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setOpenDeleteDialog(false);
        fetchUsers();
        showAlert('用户删除成功');
      } else {
        const error = await response.json();
        throw new Error(error.message || '删除用户失败');
      }
    } catch (error: any) {
      console.error('Error deleting user:', error);
      showAlert(error.message || '删除用户失败', 'error');
    }
  };

  // 重置表单
  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      role: 'user'
    });
    setCurrentUser(null);
  };

  // 打开编辑对话框
  const openEditUserDialog = (user: User) => {
    setCurrentUser(user);
    setFormData({
      username: user.username,
      password: '', // 密码不回填
      role: user.role
    });
    setOpenEditDialog(true);
  };

  // 打开删除对话框
  const openDeleteUserDialog = (user: User) => {
    setCurrentUser(user);
    setOpenDeleteDialog(true);
  };

  return (
    <PageContainer>
      <TableHeader>
        <Typography variant="h4" component="h1">
          用户管理
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<Add />}
          onClick={() => setOpenAddDialog(true)}
        >
          添加用户
        </Button>
      </TableHeader>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>用户名</TableCell>
              <TableCell>角色</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.id}</TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.role === 'admin' ? '管理员' : '普通用户'}</TableCell>
                <TableCell>
                  <IconButton 
                    color="primary" 
                    onClick={() => openEditUserDialog(user)}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton 
                    color="error" 
                    onClick={() => openDeleteUserDialog(user)}
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 添加用户对话框 */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)}>
        <DialogTitle>添加新用户</DialogTitle>
        <DialogContent>
          <Box sx={{ width: 400, mt: 2 }}>
            <TextField
              fullWidth
              margin="normal"
              name="username"
              label="用户名"
              value={formData.username}
              onChange={handleInputChange}
            />
            <TextField
              fullWidth
              margin="normal"
              name="password"
              label="密码"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>角色</InputLabel>
              <Select
                name="role"
                value={formData.role}
                label="角色"
                onChange={handleSelectChange}
              >
                <MenuItem value="user">普通用户</MenuItem>
                <MenuItem value="admin">管理员</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>取消</Button>
          <Button 
            onClick={handleAddUser} 
            color="primary" 
            disabled={!formData.username || !formData.password}
          >
            添加
          </Button>
        </DialogActions>
      </Dialog>

      {/* 编辑用户对话框 */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)}>
        <DialogTitle>编辑用户</DialogTitle>
        <DialogContent>
          <Box sx={{ width: 400, mt: 2 }}>
            <TextField
              fullWidth
              margin="normal"
              name="username"
              label="用户名"
              value={formData.username}
              onChange={handleInputChange}
            />
            <TextField
              fullWidth
              margin="normal"
              name="password"
              label="密码 (留空则不修改)"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>角色</InputLabel>
              <Select
                name="role"
                value={formData.role}
                label="角色"
                onChange={handleSelectChange}
              >
                <MenuItem value="user">普通用户</MenuItem>
                <MenuItem value="admin">管理员</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>取消</Button>
          <Button 
            onClick={handleEditUser} 
            color="primary" 
            disabled={!formData.username}
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>

      {/* 删除用户确认对话框 */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <Typography>
            确定要删除用户 "{currentUser?.username}" 吗？此操作不可撤销。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>取消</Button>
          <Button onClick={handleDeleteUser} color="error">
            删除
          </Button>
        </DialogActions>
      </Dialog>

      {/* 提示信息 */}
      <Snackbar 
        open={alertInfo.open} 
        autoHideDuration={3000} 
        onClose={() => setAlertInfo({...alertInfo, open: false})}
      >
        <Alert 
          onClose={() => setAlertInfo({...alertInfo, open: false})} 
          severity={alertInfo.severity}
        >
          {alertInfo.message}
        </Alert>
      </Snackbar>
    </PageContainer>
  );
};

export default AdminManagement;
