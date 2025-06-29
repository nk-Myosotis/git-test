import { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { Upload, Button, message, Input } from 'antd';
import { InboxOutlined, EnvironmentOutlined } from '@ant-design/icons';

const Container = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
  height: calc(100vh - 160px);
  padding: px;
  background:rgb(255, 255, 255);
`;

// ========== 智能问答区域 ==========
const ChatSection = styled.div`
  background:rgb(255, 255, 255);
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
`;

const ChatHeader = styled.h2`
  text-align: center;
  margin: 0 0 16px 0;
  color: #1890ff;
`;

const ChatMessages = styled.div`
  flex: 1;
  overflow-y: auto;
  margin-bottom: 16px;
  padding: 8px;
  border: 1px solidrgb(79, 128, 202);
  border-radius: 4px;
`;

const MessageBubble = styled.div<{ $isAssistant: boolean }>`
  max-width: 80%;
  padding: 8px 12px;
  margin: 8px;
  border-radius: ${props => 
    props.$isAssistant ? '12px 12px 12px 0' : '12px 12px 0 12px'};
  background: ${props => 
    props.$isAssistant ? '#f5f5f5' : '#1890ff'};
  color: ${props => 
    props.$isAssistant ? '#333' : 'white'};
  align-self: ${props => 
    props.$isAssistant ? 'flex-start' : 'flex-end'};
`;

const ChatInputArea = styled.div`
  display: flex;
  gap: 8px;

  input {
    flex: 1;
    padding: 8px;
    border: 1px solidrgb(47, 121, 168);
    border-radius: 4px;
  }
`;

// ========== 图片识别区域 ==========
const ImageSection = styled.div`
  background:rgb(255, 255, 255);
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
`;

const PreviewImage = styled.img`
  max-width: 100%;
  max-height: 10000px;
  margin: 16px 0;
  border: 2px dashed #e8e8e8;
`;

const ResultBox = styled.div`
  width: 80%;
  padding: 10px;
  background: #fafafa;
  border-radius: 4px;
  min-height: 0px;
  margin-top: 16px;
  word-wrap: break-word;
  white-space: pre-wrap;
`;

// ========== 天气区域 ==========
const WeatherSection = styled.div`
  background:rgb(255, 255, 255);
  border-radius: 8px;
  padding: 16px;
`;

const WeatherInputArea = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
`;

const WeatherCard = styled.div`
  padding: 16px;
  background: #1890ff;
  border-radius: 8px;
  color: white;
  text-align: center;
  margin: 16px 0;
`;

const AlertBox = styled.div`
  padding: 12px;
  background:rgb(233, 239, 128);
  border: 1px solidrgb(71, 19, 126);
  border-radius: 4px;
  color: #333;
`;

const IntelligentCenter: React.FC = () => {
  // ========== 聊天状态 ==========
  const [messages, setMessages] = useState<Array<{
    content: string;
    isAssistant: boolean;
  }>>([]);
  const [inputMessage, setInputMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ========== 图像识别状态 ==========
  const [previewImage, setPreviewImage] = useState<string>();
  const [recognitionResult, setRecognitionResult] = useState('');

  // ========== 天气状态 ==========
  const [selectedCity, setSelectedCity] = useState('');
  const [weatherData, setWeatherData] = useState<any>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  // 自动滚动到底部
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  useEffect(() => {
  // 自动触发定位
    handleGetLocation();
  }, []);
  // ========== 聊天功能处理 ==========
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    setMessages(prev => [...prev, {
      content: inputMessage,
      isAssistant: false
    }]);

    try {
      const response = await fetch('/intelligent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          type: 'chat',
          message: inputMessage 
        })
      });

      const data = await response.json();
      
      if (data.type === 'chat') {
        setMessages(prev => [...prev, {
          content: data.reply,
          isAssistant: true
        }]);
      }
    } catch (error) {
      message.error('发送消息失败');
    }

    setInputMessage('');
  };

  // ========== 图像识别处理 ==========
  const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('只能上传图片文件');
    }
    return isImage;
  };

  const handleImageUpload = async (file: File) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setPreviewImage(reader.result as string);
    };
  };

  const handleRecognition = async () => {
    if (!previewImage) return;

    try {
      const formData = new FormData();
      formData.append('type', 'image');
      formData.append('file', dataURLtoFile(previewImage, 'image.jpg'));

      const response = await fetch('/intelligent', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (data.type === 'image') {
        setRecognitionResult(data.result);
      }
    } catch (error) {
      message.error('识别失败');
    }
  };

  const dataURLtoFile = (dataurl: string, filename: string) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  // ========== 天气功能处理 ==========
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      message.error('浏览器不支持定位功能');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // 通过后端代理获取城市信息
          // const response = await fetch(`/intelligent`, {
          //   method: 'POST',
          //   headers: {
          //     'Content-Type': 'application/json',
          //   },
          //   body: JSON.stringify({
          //     type: 'location',
          //     lat: position.coords.latitude,
          //     lng: position.coords.longitude
          //   })
          // });
          
          // const data = await response.json();
          // if (data.type === 'location') {
          //   setSelectedCity(data.city);
          //   // 自动触发天气查询
          //   handleGetWeather(data.city);
          // }
          const apiKey = '1ef2b09e54904ea6bf07404436dec7a5 ';
          const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${position.coords.latitude}+${position.coords.longitude}&key=${apiKey}`);
          const data = await response.json();
          const city = data.results[0].components.city;
          setSelectedCity(city);
          handleGetWeather(city);
        } catch (error) {
          message.error('获取位置失败');
        } finally {
          setGettingLocation(false);
        }
      },
      (error) => {
        message.error('获取位置失败: ' + error.message);
        setGettingLocation(false);
      }
    );
  };

  const handleGetWeather = async (city?: string) => {
    const targetCity = city || selectedCity;
    if (!targetCity.trim()) {
      message.error('请输入城市名称');
      return;
    }

    setLoadingWeather(true);
    try {
      // const response = await fetch('/intelligent', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     type: 'weather',
      //     city: targetCity
      //   })
      // });
      //   if (!response.ok) {
      //     throw new Error('获取天气信息失败');
      //   }
      //   const data = await response.json();
      //   if (data.type === 'weather') {
      //     setWeatherData(data.data);
      //   }
      // } catch (error) {
      //   message.error('获取天气失败');
      // } finally {
      //   setLoadingWeather(false);
      // }
      const apiKey = '16c686206982413cb7a51625251605 ';
      const response = await fetch(`http://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${targetCity}&aqi=no`);
      if (!response.ok) {
        throw new Error('获取天气信息失败');
      }
      const data = await response.json();
      if (data.location && data.current) {
        setWeatherData(data.current);
      }
    } catch (error) {
      message.error('获取天气失败');
    } finally {
      setLoadingWeather(false);
    }
  };

  const generateWeatherAlert = () => {
    if (weatherData.temp_c > 35) {
      return '高温警告：请注意防暑降温';
    }
    if (weatherData.humidity > 80) {
      return '高湿警告：请注意设备防潮';
    }
    if (weatherData.wind_kph > 30) {
      return '大风警告：请注意航行安全';
    }
    return '天气条件适宜海洋作业';
  };

  return (
    <Container>
      {/* 左侧聊天区域 */}
      <ChatSection>
        <ChatHeader>智能问答小助手</ChatHeader>
        <ChatMessages>
          {messages.map((msg, index) => (
            <MessageBubble 
              key={index}
              $isAssistant={msg.isAssistant}
            >
              {msg.content}
            </MessageBubble>
          ))}
          <div ref={chatEndRef} />
        </ChatMessages>

        <ChatInputArea>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="输入消息..."
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <Button 
            type="primary"
            onClick={handleSendMessage}
          >
            发送
          </Button>
        </ChatInputArea>
      </ChatSection>

      {/* 中间图像识别区域 */}
      <ImageSection>
        <Upload.Dragger
          accept="image/*"
          beforeUpload={beforeUpload}
          customRequest={({ file }) => handleImageUpload(file as File)}
          showUploadList={false}
        >
          <p><InboxOutlined style={{ fontSize: 30 }} /></p>
          <p>点击或拖拽图片到此区域</p>
        </Upload.Dragger>

        {previewImage && <PreviewImage src={previewImage} />}

        <Button
          type="primary"
          onClick={handleRecognition}
          disabled={!previewImage}
          style={{ marginTop: 16 }}
        >
          识别
        </Button>

        <ResultBox>
          {recognitionResult||'识别结果'}
        </ResultBox>
      </ImageSection>

      {/* 右侧天气区域 */}
      <WeatherSection>
        <WeatherInputArea>
          <Input
            placeholder="输入城市"
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            onPressEnter={() => handleGetWeather()}
          />
          <Button 
            type="primary"
            onClick={() => handleGetWeather()}
            loading={loadingWeather}
          >
            确定
          </Button>
          <Button 
            type="primary"
            icon={<EnvironmentOutlined />}
            onClick={handleGetLocation}
            loading={gettingLocation}
          >
          </Button>
        </WeatherInputArea>

        {weatherData && (
          <>
            <WeatherCard>
              <h3>{selectedCity}</h3>
              <p>温度: {weatherData.temp_c}°C</p>
              <p>湿度: {weatherData.humidity}%</p>
              <p>风速: {weatherData.wind_kph} km/h</p>
              <p>天气状况: {weatherData.condition.text}</p>
            </WeatherCard>

            <AlertBox>
              {generateWeatherAlert()}
            </AlertBox>
          </>
        )}
      </WeatherSection>
    </Container>
  );
};

export default IntelligentCenter;