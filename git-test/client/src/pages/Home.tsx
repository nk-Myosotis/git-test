import React, { useState, useEffect } from 'react';
import { Typography, Box, Card, CardContent, CardMedia, Paper, Stack, Chip, Alert, Button } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import axios from 'axios';

// 配置axios默认设置
axios.defaults.withCredentials = false; // 跨域请求不发送cookies

interface MonitoringData {
  timestamp: string;
  camera_id: string;
  location: string;
  environment: {
    water_temperature: number;
    depth: number;
    visibility: string;
    dissolved_oxygen: number;
    pH: number;
  };
  fish_activity: {
    count: number;
    main_species: string;
    movement_level: string;
    health_status: string;
  };
  alerts: Array<{
    type: string;
    level: string;
    message: string;
  }>;
}

const Home: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [monitoringData, setMonitoringData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 实时时钟更新
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // 从后端获取监控数据
  const fetchMonitoringData = async () => {
    try {
      setLoading(true);
      console.log("正在请求监控数据...");
      const response = await axios.get('http://localhost:5000/api/monitoring-data');
      console.log("收到监控数据:", response.data);
      setMonitoringData(response.data);
      setError(null);
    } catch (err: any) {
      console.error('获取监控数据失败:', err);
      let errorMessage = '获取监控数据失败，请稍后重试';
      if (err.response) {
        // 服务器返回了错误响应
        console.error('错误状态码:', err.response.status);
        console.error('错误数据:', err.response.data);
        errorMessage += ` (错误: ${err.response.status})`;
      } else if (err.request) {
        // 请求发出但没有收到响应
        console.error('未收到响应:', err.request);
        errorMessage += ' (无响应)';
      } else {
        // 请求设置时发生错误
        console.error('请求错误:', err.message);
        errorMessage += ` (${err.message})`;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // 测试API连接
  const testApiConnection = async () => {
    try {
      console.log("测试API连接...");
      const response = await axios.get('http://localhost:5000/api/test');
      console.log("API测试响应:", response.data);
      alert(`API连接成功: ${response.data.message}`);
    } catch (err: any) {
      console.error('API测试失败:', err);
      alert(`API连接失败: ${err.message}`);
    }
  };
  
  // 初始加载和定期刷新数据
  useEffect(() => {
    fetchMonitoringData();
    
    // 每30秒自动刷新一次数据
    const dataRefreshTimer = setInterval(() => {
      fetchMonitoringData();
    }, 30000);
    
    return () => clearInterval(dataRefreshTimer);
  }, []);

  return (
    <div>
      <Typography variant="h2" align="center" gutterBottom>
        智慧海洋牧场可视化系统
      </Typography>
      
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <Button 
          variant="contained" 
          onClick={testApiConnection}
          sx={{ mr: 2 }}
        >
          测试API连接
        </Button>
        <Button 
          variant="outlined" 
          onClick={fetchMonitoringData}
        >
          刷新监控数据
        </Button>
      </Box>
      
      <Box sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 2, bgcolor: '#f5f5f5' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" component="div" sx={{ display: 'flex', alignItems: 'center' }}>
              <VideocamIcon sx={{ mr: 1 }} /> 
              {monitoringData ? `海洋监控摄像头 #${monitoringData.camera_id}` : '海洋监控摄像头'}
            </Typography>
            <Stack direction="row" spacing={2}>
              <Chip 
                icon={<FiberManualRecordIcon sx={{ color: '#f44336!important' }} />} 
                label={loading ? "数据加载中..." : "实时监控"} 
                color="error" 
                size="small"
                sx={{ '& .MuiChip-label': { fontWeight: 'bold' } }}
              />
              <Chip 
                label={currentTime.toLocaleTimeString()} 
                variant="outlined" 
                size="small" 
              />
            </Stack>
          </Box>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          )}
          
          <Card sx={{ bgcolor: '#000', position: 'relative' }}>
            <CardMedia
              component="video"
              controls
              src="/data/fish_test.webm"
              sx={{ width: '100%', maxHeight: '500px' }}
            />
            <Box 
              sx={{ 
                position: 'absolute', 
                top: 10, 
                left: 10, 
                color: 'white', 
                bgcolor: 'rgba(0,0,0,0.5)', 
                px: 1,
                borderRadius: 1,
                fontSize: '0.8rem',
                fontFamily: 'monospace'
              }}
            >
              {monitoringData ? 
                `水深: ${monitoringData.environment.depth}m | 温度: ${monitoringData.environment.water_temperature}°C | 可见度: ${monitoringData.environment.visibility} | 溶氧: ${monitoringData.environment.dissolved_oxygen}mg/L | pH: ${monitoringData.environment.pH}`
                : 
                '数据加载中...'
              }
            </Box>
            <Box 
              sx={{ 
                position: 'absolute', 
                bottom: 50, 
                right: 10, 
                color: 'white', 
                bgcolor: 'rgba(0,0,0,0.5)', 
                px: 1,
                borderRadius: 1,
                fontSize: '0.8rem',
                fontFamily: 'monospace'
              }}
            >
              {monitoringData ? monitoringData.timestamp : currentTime.toLocaleString()}
            </Box>
          </Card>
          
          <CardContent>
            {monitoringData && (
              <>
                <Typography variant="subtitle1" gutterBottom>
                  鱼群状态分析:
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  当前鱼群数量约 {monitoringData.fish_activity.count} 条，主要鱼种: {monitoringData.fish_activity.main_species}，
                  活动度: {monitoringData.fish_activity.movement_level}，健康状态: {monitoringData.fish_activity.health_status}
                </Typography>
                
                {monitoringData.alerts.length > 0 && (
                  <>
                    <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                      系统警报:
                    </Typography>
                    {monitoringData.alerts.map((alert, index) => (
                      <Alert 
                        key={index} 
                        severity={alert.level === 'critical' ? 'error' : alert.level === 'warning' ? 'warning' : 'info'}
                        sx={{ mb: 1 }}
                      >
                        {alert.message}
                      </Alert>
                    ))}
                  </>
                )}
              </>
            )}
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              实时监控鱼类活动情况与海洋环境参数，用于评估鱼群健康状态和生长情况。该监控数据对于海洋牧场管理和水产养殖决策至关重要。
            </Typography>
          </CardContent>
        </Paper>
      </Box>
    </div>
  );
};

export default Home;