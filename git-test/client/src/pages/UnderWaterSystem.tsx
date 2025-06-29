import React, { useEffect, useState, useRef } from "react";
import DownloadIcon from '@mui/icons-material/Download';
import { toPng } from 'html-to-image';
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  ButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Box,
} from "@mui/material";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
} from "recharts";
import { styled } from "@mui/system";
type Fish = {
  id: number;
  species: string;
  weight: number;
  length1: number;
  length2: number;
  length3: number;
  height: number;
  width: number;
};

// ...其他import...
type HydroData = {
  id: number;
  location: string;
  basin: string;
  section_name: string;
  date: string;
  water_temperature: number;
  pH: number;
  dissolved_oxygen: number;
  conductivity: number;
  turbidity: number;
  permanganate_index: number;
  ammonia_nitrogen: number;
  total_phosphorus: number;
  total_nitrogen: number;
  site_condition: string;
};

// 生成正态分布的随机数
function randomNormal(mean: number, std: number) {
  let u = 0, v = 0;
  while(u === 0) u = Math.random();
  while(v === 0) v = Math.random();
  return mean + std * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function getScoreByStandard(metric: string, value: number | null | undefined): number {
  if (value == null) return 0;
  switch (metric) {
    case "溶解氧":
      if (value >= 7.5) return 5;
      if (value >= 6) return 4;
      if (value >= 5) return 3;
      if (value >= 3) return 2;
      if (value >= 2) return 1;
      return 0;
    case "高锰酸盐指数":
      if (value <= 2) return 5;
      if (value <= 4) return 4;
      if (value <= 6) return 3;
      if (value <= 10) return 2;
      if (value <= 15) return 1;
      return 0;
    case "化学需氧量 COD":
      if (value <= 15) return 5;
      if (value <= 20) return 4;
      if (value <= 30) return 3;
      if (value <= 40) return 2;
      return 1;
    case "五日生化需氧量 BOD₅":
      if (value <= 3) return 5;
      if (value <= 4) return 4;
      if (value <= 6) return 3;
      if (value <= 10) return 2;
      return 1;
    case "氨氮":
      if (value <= 0.15) return 5;
      if (value <= 0.5) return 4;
      if (value <= 1.0) return 3;
      if (value <= 1.5) return 2;
      if (value <= 2.0) return 1;
      return 0;
    case "总磷":
      if (value <= 0.01) return 5;
      if (value <= 0.025) return 4;
      if (value <= 0.05) return 3;
      if (value <= 0.1) return 2;
      if (value <= 0.2) return 1;
      return 0;
    case "总氮":
      if (value <= 0.2) return 5;
      if (value <= 0.5) return 4;
      if (value <= 1.0) return 3;
      if (value <= 1.5) return 2;
      if (value <= 2.0) return 1;
      return 0;
    default:
      return 0;
  }
}


const SectionCard = styled(Card)(({ theme }) => ({
  background: "rgba(255,255,255,0.13)",
  borderRadius: '1.5rem',
  boxShadow: '0 8px 32px 0 rgba(2, 119, 189, 0.25)',
  color: '#fff',
  border: '2px solid',
  borderImage: 'linear-gradient(135deg, #4fc3f7 0%, #01579b 100%) 1',
  backdropFilter: 'blur(8px)',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  transition: 'transform 0.2s, box-shadow 0.2s',
  '&:hover': {
    transform: 'scale(1.03)',
    boxShadow: '0 16px 48px 0 rgba(2, 119, 189, 0.35)',
    borderImage: 'linear-gradient(135deg, #81d4fa 0%, #0288d1 100%) 1',
  },
}));

const ChartBox = styled(Box)({ height: 250, width: '100%' });
const COLORS = ['#0288d1', '#03a9f4', '#b3e5fc', '#81d4fa'];

const UnderWaterSystem: React.FC = () => {
  const [hydroList, setHydroList] = useState<HydroData[]>([]);
  const [selectedHydroId, setSelectedHydroId] = useState<number | "">("");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [selectedBasin, setSelectedBasin] = useState<string>("");
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedWqMetric, setSelectedWqMetric] = useState<string>("pH");
  const chartRef = useRef<HTMLDivElement>(null);
  const pieChartRef = useRef<HTMLDivElement>(null);
  const barChartRef = useRef<HTMLDivElement>(null);
  const radarChartRef = useRef<HTMLDivElement>(null);
  const wqChartRef = useRef<HTMLDivElement>(null);
  const envScoreChartRef = useRef<HTMLDivElement>(null);

  const handleDownloadRadar = () => {
    if (radarChartRef.current) {
      toPng(radarChartRef.current, { backgroundColor: '#182848' }).then((dataUrl) => {
        const link = document.createElement('a');
        link.download = '水质雷达图.png';
        link.href = dataUrl;
        link.click();
      });
    }
  };
  const handleDownloadChart = () => {
    if (chartRef.current) {
      toPng(chartRef.current, { backgroundColor: '#182848' }).then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `${selectedSpecies || '鱼群'}属性分布.png`;
        link.href = dataUrl;
        link.click();
      });
    }
  };
  const handleDownloadPie = () => {
    if (pieChartRef.current) {
      toPng(pieChartRef.current, { backgroundColor: '#182848' }).then((dataUrl) => {
        const link = document.createElement('a');
        link.download = '鱼类品种分布.png';
        link.href = dataUrl;
        link.click();
      });
    }
  };
  const handleDownloadBar = () => {
    if (barChartRef.current) {
      toPng(barChartRef.current, { backgroundColor: '#182848' }).then((dataUrl) => {
        const link = document.createElement('a');
        link.download = '各鱼种数量柱状图.png';
        link.href = dataUrl;
        link.click();
      });
    }
  };
  const handleDownloadWqChart = () => {
    if (wqChartRef.current) {
      toPng(wqChartRef.current, { backgroundColor: '#182848' }).then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `${selectedWqMetric || '水质指标'}变化.png`;
        link.href = dataUrl;
        link.click();
      });
    }
  };
  const handleDownloadEnvScoreChart = () => {
    if (envScoreChartRef.current) {
      toPng(envScoreChartRef.current, { backgroundColor: '#182848' }).then((dataUrl) => {
        const link = document.createElement('a');
        link.download = '环境评分变化.png';
        link.href = dataUrl;
        link.click();
      });
    }
  };
  useEffect(() => {
    fetch("/api/hydrodata")
      .then(res => res.json())
      .then((data: HydroData[]) => setHydroList(data));
  }, []);
  const [fishData, setFishData] = useState<Fish[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<'weight' | 'length1' | 'length2' | 'length3' | 'height' | 'width'>('weight');
  const [selectedSpecies, setSelectedSpecies] = useState<string>("");

// 只保留如下 useEffect，不要自动设置 selectedSpecies
  useEffect(() => {
    fetch("/api/fish")
      .then(res => res.json())
      .then((data: Fish[]) => {
        setFishData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div>加载中...</div>;
  if (fishData.length === 0) return <div>暂无鱼类数据</div>;
  const selectedHydro = hydroList.find(h =>
    (!selectedLocation || h.location === selectedLocation) &&
    (!selectedBasin || h.basin === selectedBasin) &&
    (!selectedSection || h.section_name === selectedSection) &&
    (!selectedDate || h.date === selectedDate)
  );

  const waterQualityData = selectedHydro ? [
    { label: "水温", value: selectedHydro.water_temperature },
    { label: "pH", value: selectedHydro.pH },
    { label: "溶解氧", value: selectedHydro.dissolved_oxygen },
    { label: "电导率", value: selectedHydro.conductivity },
    { label: "浊度", value: selectedHydro.turbidity },
    { label: "高锰酸盐指数", value: selectedHydro.permanganate_index },
    { label: "氨氮", value: selectedHydro.ammonia_nitrogen },
    { label: "总磷", value: selectedHydro.total_phosphorus },
    { label: "总氮", value: selectedHydro.total_nitrogen },
  ] : [];
  const calculateScore = () => {
    const sum = waterQualityData.reduce((acc, item) => acc + item.value, 0);
    return parseFloat((sum / waterQualityData.length).toFixed(2));
  };
  const makeDistribution = (metric: keyof Fish, data: Fish[]) => {
    // 1. 找到最小最大值
    const values = data.map(f => Number(f[metric]));
    if (values.length === 0) return [];
    const min = Math.floor(Math.min(...values));
    const max = Math.ceil(Math.max(...values));
    const step = metric === 'weight' ? 0.2 : 2; // 体重用0.2kg，其他用2cm为步长
    const buckets: { x: number, count: number }[] = [];
    for (let x = min; x <= max; x += step) {
      buckets.push({ x: Number(x.toFixed(2)), count: 0 });
    }
    // 2. 统计每个区间数量
    values.forEach(val => {
      const idx = Math.floor((val - min) / step);
      if (buckets[idx]) buckets[idx].count += 1;
    });
    return buckets;
  };

  const overallDist = makeDistribution(selectedMetric, fishData);
  const speciesDist = fishData.filter(f => f.species === selectedSpecies);
  const pieData = fishData.reduce((acc: Record<string, number>, f) => { acc[f.species] = (acc[f.species] || 0) + 1; return acc; }, {});
  const pieChartData = Object.entries(pieData).map(([name, value]) => ({ name, value }));

  // 计算各属性均值
  const avg = (arr: number[]) => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2) : '--';

  const barChartData = [
    { name: '体重', value: avg(fishData.map(f => f.weight)) },
    { name: '体长1', value: avg(fishData.map(f => f.length1)) },
    { name: '体长2', value: avg(fishData.map(f => f.length2)) },
    { name: '体长3', value: avg(fishData.map(f => f.length3)) },
    { name: '高度', value: avg(fishData.map(f => f.height)) },
    { name: '宽度', value: avg(fishData.map(f => f.width)) },
  ];
  // 各鱼种数量柱状图数据
  const speciesBarData = Array.from(
    Object.entries(
      fishData.reduce((acc: Record<string, number>, f) => {
        acc[f.species] = (acc[f.species] || 0) + 1;
        return acc;
      }, {})
    )
  ).map(([name, value]) => ({ name, value }));
  // 选中地点的所有历史数据，按日期排序
  const selectedHydroSeries = hydroList
    .filter(h =>
      (!selectedLocation || h.location === selectedLocation) &&
      (!selectedBasin || h.basin === selectedBasin) &&
      (!selectedSection || h.section_name === selectedSection)
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  // 计算每个时间点的环境评分
  const envScoreLineData = selectedHydroSeries.map(h => {
    // 只对有标准的指标评分
    const metrics = [
      { label: "溶解氧", value: h.dissolved_oxygen },
      { label: "高锰酸盐指数", value: h.permanganate_index },
      { label: "化学需氧量 COD", value: h.conductivity }, // 如果你有COD字段，替换为h.cod
      { label: "五日生化需氧量 BOD₅", value: h.turbidity }, // 如果你有BOD5字段，替换为h.bod5
      { label: "氨氮", value: h.ammonia_nitrogen },
      { label: "总磷", value: h.total_phosphorus },
      { label: "总氮", value: h.total_nitrogen }
    ];
    // 只对有值的项评分
    const scores = metrics.map(m => getScoreByStandard(m.label, m.value)).filter(s => s > 0);
    const avgScore = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    return {
      date: h.date,
      score: Number(avgScore.toFixed(2))
    };
  });
  const score = envScoreLineData.length ? envScoreLineData[envScoreLineData.length - 1].score : 0;
  // 当前选中指标的历史曲线数据
  const wqLineData = selectedHydroSeries.map(h => ({
    date: h.date,
    value: (() => {
      switch (selectedWqMetric) {
        case "水温": return h.water_temperature;
        case "pH": return h.pH;
        case "溶解氧": return h.dissolved_oxygen;
        case "电导率": return h.conductivity;
        case "浊度": return h.turbidity;
        case "高锰酸盐指数": return h.permanganate_index;
        case "氨氮": return h.ammonia_nitrogen;
        case "总磷": return h.total_phosphorus;
        case "总氮": return h.total_nitrogen;
        default: return null;
      }
    })()
  }));
  return (
    <>
      <div className="bubble-bg">
        {Array.from({length: 18}).map((_,i)=>(
          <span key={i} className="bubble" style={{
            left: `${Math.random()*100}%`,
            animationDuration: `${4+Math.random()*6}s`,
            animationDelay: `${Math.random()*6}s`,
            width: `${10+Math.random()*20}px`,
            height: `${10+Math.random()*20}px`,
            opacity: 0.3+Math.random()*0.5
          }} />
        ))}
      </div>
      <Grid container spacing={2} sx={{ flex: 1, height: "100%", margin: 0 }}>
        {/* 第一行：左-中-右 */}
        <Grid item xs={12} md={4}>
          <SectionCard>
            <CardContent>
              <Typography
                variant="h6"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mb: 1,
                  color: '#e3f2fd',
                  fontWeight: 700,
                }}
              >
                <svg width="24" height="18" viewBox="0 0 24 18" style={{ marginLeft: 8 }} fill="none">
                  <ellipse cx="18" cy="9" rx="3" ry="2.5" fill="#4fc3f7" />
                  <path d="M2 9c3-4 10-7 17-4v8C12 16 5 13 2 9Z" fill="#4fc3f7" fillOpacity="0.7"/>
                  <circle cx="6" cy="9" r="1" fill="#01579b"/>
                </svg>
                鱼群属性分布
              </Typography>
              <FormControl size="small" sx={{ ml: 2, minWidth: 120, background: 'rgba(33,150,243,0.10)', borderRadius: 1 }}>
                {/* 不要 InputLabel */}
                <Select
                  value={selectedSpecies}
                  onChange={e => setSelectedSpecies(e.target.value)}
                  displayEmpty
                  sx={{
                    color: '#e3f2fd',
                    '.MuiOutlinedInput-notchedOutline': { borderColor: '#4fc3f7' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#0288d1' },
                    '.MuiSvgIcon-root': { color: '#4fc3f7' }
                  }}
                  renderValue={val => val ? val : <span style={{ color: '#b3e5fc' }}>请选择鱼种</span>}
                >
                  <MenuItem value="">
                    <em>请选择鱼种</em>
                  </MenuItem>
                  {Array.from(new Set(fishData.map(f => f.species))).map(sp =>
                    <MenuItem key={sp} value={sp}>{sp}</MenuItem>
                  )}
                </Select>
              </FormControl>
              {selectedSpecies ? (
                <>
                  <ButtonGroup size="small" sx={{ mb: 1 }}>
                    {(['weight', 'length1', 'length2', 'length3', 'height', 'width'] as const).map(m => (
                      <Button
                        key={m}
                        variant={selectedMetric === m ? "contained" : "outlined"}
                        onClick={() => setSelectedMetric(m)}
                        sx={{
                          color: selectedMetric === m ? '#fff' : '#4fc3f7',
                          background: selectedMetric === m ? 'linear-gradient(90deg,#0288d1,#4fc3f7)' : 'none',
                          borderColor: '#4fc3f7'
                        }}
                      >
                        {m === 'weight'
                          ? '体重'
                          : m === 'length1'
                          ? '体长1'
                          : m === 'length2'
                          ? '体长2'
                          : m === 'length3'
                          ? '体长3'
                          : m === 'height'
                          ? '高度'
                          : '宽度'}
                      </Button>
                    ))}
                  </ButtonGroup>
                  <Box sx={{ position: 'relative' }}>
                    <Box ref={chartRef}>
                      <ChartBox>
                        <ResponsiveContainer>
                          <LineChart data={makeDistribution(selectedMetric, fishData.filter(f => f.species === selectedSpecies))}>
                            <XAxis dataKey="x" stroke="#b3e5fc" type="number" domain={['auto', 'auto']} tickCount={8} />
                            <YAxis stroke="#b3e5fc" />
                            <Tooltip
                              contentStyle={{ background: "rgba(2,119,189,0.8)", border: "none", color: "#fff" }}
                              labelStyle={{ color: "#fff" }}
                              itemStyle={{ color: "#fff" }}
                            />
                            <Line type="monotone" dataKey="count" stroke="#4fc3f7" strokeWidth={3} dot={{ r: 5, fill: "#0288d1" }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </ChartBox>
                    </Box>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<DownloadIcon />}
                      sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2, color: '#4fc3f7', borderColor: '#4fc3f7', background: 'rgba(0,0,0,0.12)' }}
                      onClick={handleDownloadChart}
                    >
                      下载图表
                    </Button>
                  </Box>
                  {/* 统计区 */}
                  <Box sx={{
                    mt: 2,
                    display: 'flex',
                    justifyContent: 'space-around',
                    background: 'rgba(33,150,243,0.10)',
                    borderRadius: 2,
                    py: 1
                  }}>
                    {(() => {
                      const current = fishData.filter(f => f.species === selectedSpecies);
                      const values = current.map(f => Number(f[selectedMetric]));
                      const avg = values.length ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2) : '--';
                      const min = values.length ? Math.min(...values).toFixed(2) : '--';
                      const max = values.length ? Math.max(...values).toFixed(2) : '--';
                      return (
                        <>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography sx={{ color: '#4fc3f7', fontWeight: 600, fontSize: 15 }}>均值</Typography>
                            <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>{avg}</Typography>
                          </Box>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography sx={{ color: '#4fc3f7', fontWeight: 600, fontSize: 15 }}>最小值</Typography>
                            <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>{min}</Typography>
                          </Box>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography sx={{ color: '#4fc3f7', fontWeight: 600, fontSize: 15 }}>最大值</Typography>
                            <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>{max}</Typography>
                          </Box>
                        </>
                      );
                    })()}
                  </Box>
                </>
              ) : (
                <Box sx={{ color: '#b3e5fc', textAlign: 'center', py: 6, fontSize: 18 }}>
                  请选择鱼种后查看分布与统计
                </Box>
              )}
            </CardContent>
          </SectionCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <SectionCard>
            <CardContent
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 360,
                background: 'transparent',
                position: 'relative',
                overflow: 'hidden',
                p: 3
              }}
            >
              {/* 波浪底部装饰 */}
              <svg width="100%" height="48" viewBox="0 0 300 48" fill="none" style={{ position: 'absolute', bottom: 0, left: 0, zIndex: 0 }}>
                <path d="M0 24 Q75 48 150 24 T300 24 V48 H0Z" fill="#4fc3f7" fillOpacity="0.18"/>
                <path d="M0 36 Q75 24 150 36 T300 36 V48 H0Z" fill="#0288d1" fillOpacity="0.10"/>
              </svg>
              {/* 多条鱼装饰 */}
              <svg width="60" height="28" style={{ position: 'absolute', top: 18, left: 24, zIndex: 1, opacity: 0.22 }}>
                <g>
                  <ellipse cx="14" cy="14" rx="12" ry="5" fill="#4fc3f7" />
                  <polygon points="28,14 36,11 36,17" fill="#0288d1" />
                </g>
                <g>
                  <ellipse cx="46" cy="20" rx="6" ry="2.5" fill="#b3e5fc" />
                  <polygon points="52,20 56,18 56,22" fill="#81d4fa" />
                </g>
              </svg>
              <svg width="36" height="16" style={{ position: 'absolute', top: 60, right: 32, zIndex: 1, opacity: 0.15 }}>
                <ellipse cx="18" cy="8" rx="16" ry="6" fill="#81d4fa" />
                <polygon points="32,8 36,6 36,10" fill="#0288d1" />
              </svg>
              {/* 水泡装饰 */}
              <svg width="40" height="40" style={{ position: 'absolute', top: 30, right: 40, zIndex: 1, opacity: 0.18 }}>
                <circle cx="20" cy="20" r="20" fill="#b3e5fc" />
              </svg>
              {/* 欢迎标语 */}
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 900,
                  letterSpacing: 4,
                  mb: 1,
                  mt: 1,
                  fontSize: { xs: 28, md: 44, lg: 54 },
                  background: 'linear-gradient(90deg,#4fc3f7 20%,#0288d1 80%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 8px 36px #0288d1, 0 2px 0 #fff',
                  zIndex: 2,
                  lineHeight: 1.1
                }}
              >
                欢迎来到水下世界！
              </Typography>
              {/* 您已养殖 + 波浪icon */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, zIndex: 2 }}>
                <Typography
                  sx={{
                    fontSize: 28,
                    color: '#b3e5fc',
                    fontWeight: 700,
                    letterSpacing: 2,
                    textShadow: '0 2px 12px #0288d1'
                  }}
                >
                  您已养殖
                </Typography>
                <svg width="48" height="18" viewBox="0 0 48 18" style={{ marginLeft: 8 }} fill="none">
                  <path d="M0 9 Q12 0 24 9 T48 9" stroke="#4fc3f7" strokeWidth="3" fill="none" />
                </svg>
              </Box>
              {/* 大表盘进度条 */}
              <Box sx={{ position: 'relative', width: 200, height: 200, mb: 1 }}>
                {/* 外圈渐变光晕 */}
                <svg width="200" height="200" style={{ position: 'absolute', top: 0, left: 0, zIndex: 0 }}>
                  <defs>
                    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#b3e5fc" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="#0288d1" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  <circle cx="100" cy="100" r="95" fill="url(#glow)" />
                </svg>
                {/* 主表盘 */}
                <svg width="200" height="200" style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}>
                  <defs>
                    <linearGradient id="progressBg" x1="0" y1="0" x2="200" y2="0" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#b3e5fc" />
                      <stop offset="1" stopColor="#7c4dff" />
                    </linearGradient>
                    <linearGradient id="progressBig" x1="0" y1="0" x2="200" y2="0" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#4f3ff7" />
                      <stop offset="0.3" stopColor="#7c4dff" />
                      <stop offset="0.7" stopColor="#0288d1" />
                      <stop offset="1" stopColor="#01579b" />
                    </linearGradient>
                    <linearGradient id="numGrad" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
                      <stop offset="0%" stopColor="#4fc3f7" />
                      <stop offset="60%" stopColor="#7c4dff" />
                      <stop offset="100%" stopColor="#0288d1" />
                    </linearGradient>
                  </defs>
                  {/* 底环 */}
                  <circle
                    cx="100"
                    cy="100"
                    r="85"
                    stroke="url(#progressBg)"
                    strokeWidth="18"
                    fill="none"
                    opacity={0.18}
                  />
                  {/* 主进度环 */}
                  <circle
                    cx="100"
                    cy="100"
                    r="85"
                    stroke="url(#progressBig)"
                    strokeWidth="18"
                    fill="none"
                    strokeDasharray={534}
                    strokeDashoffset={534 - 534 * Math.min(fishData.length / 1000, 1)}
                    strokeLinecap="round"
                    style={{
                      filter: 'drop-shadow(0 0 8px #7c4dff) drop-shadow(0 0 4px #0288d1)',
                      transition: 'stroke-dashoffset 1s'
                    }}
                  />
                  {/* 刻度线 */}
                  {Array.from({ length: 10 }).map((_, i) => {
                    const angle = (i / 10) * 2 * Math.PI - Math.PI / 2;
                    const x1 = 100 + Math.cos(angle) * 75;
                    const y1 = 100 + Math.sin(angle) * 75;
                    const x2 = 100 + Math.cos(angle) * 85;
                    const y2 = 100 + Math.sin(angle) * 85;
                    return (
                      <line
                        key={i}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="#7c4dff"
                        strokeWidth={2}
                        opacity={0.85}
                        style={{ filter: 'drop-shadow(0 0 2px #4fc3f7)' }}
                      />
                    );
                  })}
                  {/* 中心数字 */}
                  <text
                    x="100"
                    y="120"
                    textAnchor="middle"
                    fontSize="64"
                    fontWeight="bold"
                    fill="url(#numGrad)"
                    style={{ textShadow: '0 0 24px #7c4dff, 0 2px 0 #fff' }}
                  >
                    {fishData.length}
                  </text>
                  {/* 单位 */}
                  <text
                    x="100"
                    y="150"
                    textAnchor="middle"
                    fontSize="24"
                    fontWeight="bold"
                    fill="#4fc3f7"
                    opacity={0.85}
                  >
                    / 1000 条
                  </text>
                  {/* 小鱼icon */}
                  <g>
                    <ellipse cx="160" cy="60" rx="10" ry="4" fill="#7c4dff" opacity="0.7"/>
                    <polygon points="170,60 178,57 178,63" fill="#0288d1" opacity="0.7"/>
                  </g>
                  <g>
                    <ellipse cx="50" cy="160" rx="7" ry="3" fill="#b3e5fc" opacity="0.5"/>
                    <polygon points="57,160 62,158 62,162" fill="#81d4fa" opacity="0.5"/>
                  </g>
                </svg>
              </Box>
              {/* 波浪icon再点缀一层 */}
              <svg width="140" height="28" style={{ marginTop: 8, zIndex: 2 }}>
                <path d="M0 14 Q35 0 70 14 T140 14" stroke="#4fc3f7" strokeWidth="4" fill="none" />
              </svg>
            </CardContent>
          </SectionCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <SectionCard>
            <CardContent sx={{ textAlign: 'center', p: 2 }}>
              <Typography
                variant="h6"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2,
                  color: '#e3f2fd',
                  fontWeight: 700,
                }}
              >
                <svg width="24" height="18" viewBox="0 0 24 18" style={{ marginLeft: 8 }} fill="none">
                  <ellipse cx="18" cy="9" rx="3" ry="2.5" fill="#4fc3f7" />
                  <path d="M2 9c3-4 10-7 17-4v8C12 16 5 13 2 9Z" fill="#4fc3f7" fillOpacity="0.7"/>
                  <circle cx="6" cy="9" r="1" fill="#01579b"/>
                </svg>
                鱼类总体信息
              </Typography>
              <Typography sx={{ color: '#b3e5fc', fontSize: 14, mb: 2 }}>
                展示当前水体内鱼类的整体分布与种群数量。
              </Typography>
              {/* 品种分布饼图 */}
              <Box sx={{ width: '100%', height: 180, mb: 2, position: 'relative' }}>
                <Box ref={pieChartRef} sx={{ width: '100%', height: 180 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        fill="#4fc3f7"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieChartData.map((entry, idx) => (
                          <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<DownloadIcon />}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    zIndex: 2,
                    color: '#4fc3f7',
                    borderColor: '#4fc3f7',
                    background: 'rgba(0,0,0,0.12)'
                  }}
                  onClick={handleDownloadPie}
                >
                  下载饼图
                </Button>
              </Box>
              {/* 平均值柱状图 */}
              {/* 各鱼种数量柱状图 */}
              <Box sx={{ width: '100%', height: 120, mb: 2, position: 'relative'  }}>
                <Box ref={barChartRef} sx={{ width: '100%', height: 120 }}>
                  <ResponsiveContainer>
                    <BarChart data={speciesBarData}>
                      <XAxis dataKey="name" stroke="#b3e5fc" />
                      <YAxis stroke="#b3e5fc" allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#0288d1" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<DownloadIcon />}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    zIndex: 2,
                    color: '#4fc3f7',
                    borderColor: '#4fc3f7',
                    background: 'rgba(0,0,0,0.12)'
                  }}
                  onClick={handleDownloadBar}
                >
                  下载柱状图
                </Button>
              </Box>
            </CardContent>
          </SectionCard>
        </Grid>
        {/* 第二行：左-中-右 */}
        <Grid item xs={12} md={4}>
          <SectionCard>
            <CardContent>
              <Typography
                variant="h6"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mb: 1,
                  color: '#e3f2fd', // 更亮的字体色
                  fontWeight: 700,
                }}
              >
                <span style={{ marginRight: 8 }}>水质雷达图</span>
                <svg width="32" height="12" viewBox="0 0 32 12" fill="none">
                  <path d="M0 6 Q8 0 16 6 T32 6" stroke="#4fc3f7" strokeWidth="2" fill="none" />
                </svg>
                <svg width="20" height="20" style={{ marginLeft: 8 }} viewBox="0 0 20 20" fill="none">
                  <ellipse cx="10" cy="15" rx="6" ry="3" fill="#4fc3f7" fillOpacity="0.3"/>
                  <path d="M10 2 C13 7, 16 11, 10 18 C4 11, 7 7, 10 2 Z" fill="#4fc3f7" fillOpacity="0.7"/>
                </svg>
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <Select
                    value={selectedLocation}
                    onChange={e => setSelectedLocation(e.target.value)}
                    displayEmpty
                    renderValue={val => val ? val : <span style={{ color: '#b3e5fc' }}>请选择省份</span>}
                    sx={{
                      color: '#e3f2fd',
                      '.MuiOutlinedInput-notchedOutline': { borderColor: '#4fc3f7' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#0288d1' },
                      '.MuiSvgIcon-root': { color: '#4fc3f7' }
                    }}
                  >
                    <MenuItem value="">
                      <em>请选择省份</em>
                    </MenuItem>
                    {Array.from(new Set(hydroList.map(h => h.location))).map(loc =>
                      <MenuItem key={loc} value={loc}>{loc}</MenuItem>
                    )}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <Select
                    value={selectedBasin}
                    onChange={e => setSelectedBasin(e.target.value)}
                    displayEmpty
                    renderValue={val => val ? val : <span style={{ color: '#b3e5fc' }}>请选择流域</span>}
                    sx={{
                      color: '#e3f2fd',
                      '.MuiOutlinedInput-notchedOutline': { borderColor: '#4fc3f7' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#0288d1' },
                      '.MuiSvgIcon-root': { color: '#4fc3f7' }
                    }}
                  >
                    <MenuItem value="">
                      <em>请选择流域</em>
                    </MenuItem>
                    {Array.from(new Set(hydroList.filter(h => !selectedLocation || h.location === selectedLocation).map(h => h.basin))).map(basin =>
                      <MenuItem key={basin} value={basin}>{basin}</MenuItem>
                    )}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <Select
                    value={selectedSection}
                    onChange={e => setSelectedSection(e.target.value)}
                    displayEmpty
                    renderValue={val => val ? val : <span style={{ color: '#b3e5fc' }}>请选择断面名称</span>}
                    sx={{
                      color: '#e3f2fd',
                      '.MuiOutlinedInput-notchedOutline': { borderColor: '#4fc3f7' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#0288d1' },
                      '.MuiSvgIcon-root': { color: '#4fc3f7' }
                    }}
                  >
                    <MenuItem value="">
                      <em>请选择断面名称</em>
                    </MenuItem>
                    {Array.from(new Set(hydroList.filter(h => (!selectedLocation || h.location === selectedLocation) && (!selectedBasin || h.basin === selectedBasin)).map(h => h.section_name))).map(sec =>
                      <MenuItem key={sec} value={sec}>{sec}</MenuItem>
                    )}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <Select
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    displayEmpty
                    renderValue={val => val ? val : <span style={{ color: '#b3e5fc' }}>请选择日期</span>}
                    sx={{
                      color: '#e3f2fd',
                      '.MuiOutlinedInput-notchedOutline': { borderColor: '#4fc3f7' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#0288d1' },
                      '.MuiSvgIcon-root': { color: '#4fc3f7' }
                    }}
                  >
                    <MenuItem value="">
                      <em>请选择日期</em>
                    </MenuItem>
                    {Array.from(new Set(hydroList.filter(h =>
                      (!selectedLocation || h.location === selectedLocation) &&
                      (!selectedBasin || h.basin === selectedBasin) &&
                      (!selectedSection || h.section_name === selectedSection)
                    ).map(h => h.date))).map(date =>
                      <MenuItem key={date} value={date}>{date}</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Box>
              {selectedLocation && selectedBasin && selectedSection && selectedDate ? (
                <>
                  <Box sx={{ position: 'relative' }}>
                    <Box ref={radarChartRef}>
                      <ChartBox>
                        <ResponsiveContainer>
                          <RadarChart data={waterQualityData}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="label" stroke="#e3f2fd" fontSize={12} />
                            <PolarRadiusAxis stroke="#b3e5fc" tick={{ fill: "#b3e5fc", fontSize: 12 }} />
                            <Radar dataKey="value" stroke="#4fc3f7" fill="#0288d1" fillOpacity={0.5} />
                            <Tooltip
                              contentStyle={{ background: "rgba(2,119,189,0.8)", border: "none", color: "#fff" }}
                              labelStyle={{ color: "#fff" }}
                              itemStyle={{ color: "#fff" }}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </ChartBox>
                    </Box>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<DownloadIcon />}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        zIndex: 2,
                        color: '#4fc3f7',
                        borderColor: '#4fc3f7',
                        background: 'rgba(0,0,0,0.12)'
                      }}
                      onClick={handleDownloadRadar}
                    >
                      下载雷达图
                    </Button>
                  </Box>
                  {/* 指标文字展示 */}
                  <Box sx={{ mt: 2 }}>
                    <Typography sx={{ color: '#b3e5fc', fontWeight: 500, fontSize: 15, mb: 1 }}>
                      当前各项指标：
                    </Typography>
                    <Grid container spacing={1}>
                      {waterQualityData.map((item) => (
                        <Grid item xs={6} key={item.label}>
                          <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            background: 'rgba(33,150,243,0.15)',
                            borderRadius: '8px',
                            px: 1,
                            py: 0.5,
                            mb: 0.5,
                          }}>
                            <span style={{ color: '#4fc3f7', fontWeight: 600, marginRight: 6 }}>{item.label}：</span>
                            <span style={{ color: '#fff', fontWeight: 600 }}>{item.value}</span>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                  {/* 其它指标展示... */}
                </>
              ) : (
                <Box sx={{ color: '#b3e5fc', textAlign: 'center', py: 6, fontSize: 18 }}>
                  请选择省份、流域、断面名称和日期后查看水质数据
                </Box>
              )}
            </CardContent>
          </SectionCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <SectionCard>
            <CardContent>
              <Typography
                variant="h6"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mb: 1,
                  color: '#e3f2fd',
                  fontWeight: 700,
                }}
              >
                <span style={{ marginRight: 8 }}>水质指标变化</span>
                <svg width="32" height="12" viewBox="0 0 32 12" fill="none">
                  <path d="M0 6 Q8 0 16 6 T32 6" stroke="#4fc3f7" strokeWidth="2" fill="none" />
                </svg>
                <svg width="20" height="20" style={{ marginLeft: 8 }} viewBox="0 0 20 20" fill="none">
                  <ellipse cx="10" cy="15" rx="6" ry="3" fill="#4fc3f7" fillOpacity="0.3"/>
                  <path d="M10 2 C13 7, 16 11, 10 18 C4 11, 7 7, 10 2 Z" fill="#4fc3f7" fillOpacity="0.7"/>
                </svg>
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <Select
                    value={selectedLocation}
                    onChange={e => setSelectedLocation(e.target.value)}
                    displayEmpty
                    renderValue={val => val ? val : <span style={{ color: '#b3e5fc' }}>请选择省份</span>}
                    sx={{
                      color: '#e3f2fd',
                      '.MuiOutlinedInput-notchedOutline': { borderColor: '#4fc3f7' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#0288d1' },
                      '.MuiSvgIcon-root': { color: '#4fc3f7' }
                    }}
                  >
                    <MenuItem value="">
                      <em>请选择省份</em>
                    </MenuItem>
                    {Array.from(new Set(hydroList.map(h => h.location))).map(loc =>
                      <MenuItem key={loc} value={loc}>{loc}</MenuItem>
                    )}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <Select
                    value={selectedBasin}
                    onChange={e => setSelectedBasin(e.target.value)}
                    displayEmpty
                    renderValue={val => val ? val : <span style={{ color: '#b3e5fc' }}>请选择流域</span>}
                    sx={{
                      color: '#e3f2fd',
                      '.MuiOutlinedInput-notchedOutline': { borderColor: '#4fc3f7' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#0288d1' },
                      '.MuiSvgIcon-root': { color: '#4fc3f7' }
                    }}
                  >
                    <MenuItem value="">
                      <em>请选择流域</em>
                    </MenuItem>
                    {Array.from(new Set(hydroList.filter(h => !selectedLocation || h.location === selectedLocation).map(h => h.basin))).map(basin =>
                      <MenuItem key={basin} value={basin}>{basin}</MenuItem>
                    )}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <Select
                    value={selectedSection}
                    onChange={e => setSelectedSection(e.target.value)}
                    displayEmpty
                    renderValue={val => val ? val : <span style={{ color: '#b3e5fc' }}>请选择断面名称</span>}
                    sx={{
                      color: '#e3f2fd',
                      '.MuiOutlinedInput-notchedOutline': { borderColor: '#4fc3f7' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#0288d1' },
                      '.MuiSvgIcon-root': { color: '#4fc3f7' }
                    }}
                  >
                    <MenuItem value="">
                      <em>请选择断面名称</em>
                    </MenuItem>
                    {Array.from(new Set(hydroList.filter(h => (!selectedLocation || h.location === selectedLocation) && (!selectedBasin || h.basin === selectedBasin)).map(h => h.section_name))).map(sec =>
                      <MenuItem key={sec} value={sec}>{sec}</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Box>
              <Typography sx={{ color: '#e3f2fd', fontSize: 14, mb: 1 }}>
                选择指标，查看其随时间的变化趋势，并对照水质标准分级。
              </Typography>
              {selectedLocation && selectedBasin && selectedSection ? (
                <>
                  {/* 指标选择按钮组 */}
                  <ButtonGroup size="small" sx={{ mb: 2 }}>
                    {waterQualityData.map((item, idx) => (
                      <Button
                        key={item.label}
                        variant={selectedWqMetric === item.label ? "contained" : "outlined"}
                        onClick={() => setSelectedWqMetric(item.label)}
                        sx={{
                          color: selectedWqMetric === item.label ? '#fff' : '#4fc3f7',
                          background: selectedWqMetric === item.label ? 'linear-gradient(90deg,#0288d1,#4fc3f7)' : 'none',
                          borderColor: '#4fc3f7'
                        }}
                      >
                        {item.label}
                      </Button>
                    ))}
                  </ButtonGroup>
                  <Box sx={{ position: 'relative' }}>
                    <Box ref={wqChartRef}>
                      <ChartBox>
                        <ResponsiveContainer>
                          <LineChart data={wqLineData}>
                            <XAxis dataKey="date" stroke="#b3e5fc" />
                            <YAxis stroke="#b3e5fc" />
                            <Tooltip
                              contentStyle={{ background: "rgba(2,119,189,0.8)", border: "none", color: "#fff" }}
                              labelStyle={{ color: "#fff" }}
                              itemStyle={{ color: "#fff" }}
                            />
                            {/* 指标标准区域/线条 */}
                            {selectedWqMetric === '溶解氧' && (
                              <>
                                <ReferenceArea y1={7.5} y2={100} strokeOpacity={0.1} fill="#81d4fa" fillOpacity={0.18} /> {/* I类 */}
                                <ReferenceArea y1={6} y2={7.5} strokeOpacity={0.1} fill="#4fc3f7" fillOpacity={0.12} />   {/* II类 */}
                                <ReferenceArea y1={5} y2={6} strokeOpacity={0.1} fill="#0288d1" fillOpacity={0.08} />     {/* III类 */}
                                <ReferenceArea y1={3} y2={5} strokeOpacity={0.1} fill="#01579b" fillOpacity={0.06} />     {/* IV类 */}
                                <ReferenceArea y1={2} y2={3} strokeOpacity={0.1} fill="#004d40" fillOpacity={0.04} />     {/* V类 */}
                                <ReferenceLine y={7.5} stroke="#81d4fa" strokeDasharray="3 3" />
                                <ReferenceLine y={6} stroke="#4fc3f7" strokeDasharray="3 3" />
                                <ReferenceLine y={5} stroke="#0288d1" strokeDasharray="3 3" />
                                <ReferenceLine y={3} stroke="#01579b" strokeDasharray="3 3" />
                                <ReferenceLine y={2} stroke="#004d40" strokeDasharray="3 3" />
                              </>
                            )}
                            {selectedWqMetric === '高锰酸盐指数' && (
                              <>
                                <ReferenceArea y1={0} y2={2} fill="#81d4fa" fillOpacity={0.18} />
                                <ReferenceArea y1={2} y2={4} fill="#4fc3f7" fillOpacity={0.12} />
                                <ReferenceArea y1={4} y2={6} fill="#0288d1" fillOpacity={0.08} />
                                <ReferenceArea y1={6} y2={10} fill="#01579b" fillOpacity={0.06} />
                                <ReferenceArea y1={10} y2={15} fill="#004d40" fillOpacity={0.04} />
                                <ReferenceLine y={2} stroke="#81d4fa" strokeDasharray="3 3" />
                                <ReferenceLine y={4} stroke="#4fc3f7" strokeDasharray="3 3" />
                                <ReferenceLine y={6} stroke="#0288d1" strokeDasharray="3 3" />
                                <ReferenceLine y={10} stroke="#01579b" strokeDasharray="3 3" />
                                <ReferenceLine y={15} stroke="#004d40" strokeDasharray="3 3" />
                              </>
                            )}
                            {selectedWqMetric === '化学需氧量 COD' && (
                              <>
                                <ReferenceArea y1={0} y2={15} fill="#81d4fa" fillOpacity={0.18} />
                                <ReferenceArea y1={15} y2={20} fill="#4fc3f7" fillOpacity={0.12} />
                                <ReferenceArea y1={20} y2={30} fill="#0288d1" fillOpacity={0.08} />
                                <ReferenceArea y1={30} y2={40} fill="#01579b" fillOpacity={0.06} />
                                <ReferenceLine y={15} stroke="#81d4fa" strokeDasharray="3 3" />
                                <ReferenceLine y={20} stroke="#4fc3f7" strokeDasharray="3 3" />
                                <ReferenceLine y={30} stroke="#0288d1" strokeDasharray="3 3" />
                                <ReferenceLine y={40} stroke="#01579b" strokeDasharray="3 3" />
                              </>
                            )}
                            {selectedWqMetric === '五日生化需氧量 BOD₅' && (
                              <>
                                <ReferenceArea y1={0} y2={3} fill="#81d4fa" fillOpacity={0.18} />
                                <ReferenceArea y1={3} y2={4} fill="#4fc3f7" fillOpacity={0.12} />
                                <ReferenceArea y1={4} y2={6} fill="#0288d1" fillOpacity={0.08} />
                                <ReferenceArea y1={6} y2={10} fill="#01579b" fillOpacity={0.06} />
                                <ReferenceLine y={3} stroke="#81d4fa" strokeDasharray="3 3" />
                                <ReferenceLine y={4} stroke="#4fc3f7" strokeDasharray="3 3" />
                                <ReferenceLine y={6} stroke="#0288d1" strokeDasharray="3 3" />
                                <ReferenceLine y={10} stroke="#01579b" strokeDasharray="3 3" />
                              </>
                            )}
                            {selectedWqMetric === '氨氮' && (
                              <>
                                <ReferenceArea y1={0} y2={0.15} fill="#81d4fa" fillOpacity={0.18} />
                                <ReferenceArea y1={0.15} y2={0.5} fill="#4fc3f7" fillOpacity={0.12} />
                                <ReferenceArea y1={0.5} y2={1.0} fill="#0288d1" fillOpacity={0.08} />
                                <ReferenceArea y1={1.0} y2={1.5} fill="#01579b" fillOpacity={0.06} />
                                <ReferenceArea y1={1.5} y2={2.0} fill="#004d40" fillOpacity={0.04} />
                                <ReferenceLine y={0.15} stroke="#81d4fa" strokeDasharray="3 3" />
                                <ReferenceLine y={0.5} stroke="#4fc3f7" strokeDasharray="3 3" />
                                <ReferenceLine y={1.0} stroke="#0288d1" strokeDasharray="3 3" />
                                <ReferenceLine y={1.5} stroke="#01579b" strokeDasharray="3 3" />
                                <ReferenceLine y={2.0} stroke="#004d40" strokeDasharray="3 3" />
                              </>
                            )}
                            {selectedWqMetric === '总磷' && (
                              <>
                                <ReferenceArea y1={0} y2={0.01} fill="#81d4fa" fillOpacity={0.18} />
                                <ReferenceArea y1={0.01} y2={0.025} fill="#4fc3f7" fillOpacity={0.12} />
                                <ReferenceArea y1={0.025} y2={0.05} fill="#0288d1" fillOpacity={0.08} />
                                <ReferenceArea y1={0.05} y2={0.1} fill="#01579b" fillOpacity={0.06} />
                                <ReferenceArea y1={0.1} y2={0.2} fill="#004d40" fillOpacity={0.04} />
                                <ReferenceLine y={0.01} stroke="#81d4fa" strokeDasharray="3 3" />
                                <ReferenceLine y={0.025} stroke="#4fc3f7" strokeDasharray="3 3" />
                                <ReferenceLine y={0.05} stroke="#0288d1" strokeDasharray="3 3" />
                                <ReferenceLine y={0.1} stroke="#01579b" strokeDasharray="3 3" />
                                <ReferenceLine y={0.2} stroke="#004d40" strokeDasharray="3 3" />
                              </>
                            )}
                            {selectedWqMetric === '总氮' && (
                              <>
                                <ReferenceArea y1={0} y2={0.2} fill="#81d4fa" fillOpacity={0.18} />
                                <ReferenceArea y1={0.2} y2={0.5} fill="#4fc3f7" fillOpacity={0.12} />
                                <ReferenceArea y1={0.5} y2={1.0} fill="#0288d1" fillOpacity={0.08} />
                                <ReferenceArea y1={1.0} y2={1.5} fill="#01579b" fillOpacity={0.06} />
                                <ReferenceArea y1={1.5} y2={2.0} fill="#004d40" fillOpacity={0.04} />
                                <ReferenceLine y={0.2} stroke="#81d4fa" strokeDasharray="3 3" />
                                <ReferenceLine y={0.5} stroke="#4fc3f7" strokeDasharray="3 3" />
                                <ReferenceLine y={1.0} stroke="#0288d1" strokeDasharray="3 3" />
                                <ReferenceLine y={1.5} stroke="#01579b" strokeDasharray="3 3" />
                                <ReferenceLine y={2.0} stroke="#004d40" strokeDasharray="3 3" />
                              </>
                            )}
                            <Line type="monotone" dataKey="value" stroke="#4fc3f7" strokeWidth={3} dot={{ r: 5, fill: "#0288d1" }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </ChartBox>
                    </Box>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<DownloadIcon />}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        zIndex: 2,
                        color: '#4fc3f7',
                        borderColor: '#4fc3f7',
                        background: 'rgba(0,0,0,0.12)'
                      }}
                      onClick={handleDownloadWqChart}
                    >
                      下载图表
                    </Button>
                  </Box>
                  <Box sx={{ mt: 2, color: '#b3e5fc', fontSize: 14 }}>
                    <Typography sx={{ fontWeight: 500, mb: 1 }}>
                      环境评分标准说明：
                    </Typography>
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      <li>每项指标按国家标准分级，I类得5分，II类4分，III类3分，IV类2分，V类1分，超V类0分。</li>
                      <li>最终评分为各项得分的平均值。</li>
                    </ul>
                  </Box>
                </>
              ) : (
                <Box sx={{ color: '#b3e5fc', textAlign: 'center', py: 6, fontSize: 18 }}>
                  请选择省份、流域、断面名称后查看水质指标变化
                </Box>
              )}
            </CardContent>
          </SectionCard>
        </Grid>
        <Grid item xs={12} md={4}>
          <SectionCard>
            <CardContent>
              <Typography
                variant="h6"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mb: 1,
                  color: '#e3f2fd',
                  fontWeight: 700,
                }}
              >
                <span style={{ marginRight: 8 }}>环境评分</span>
                <svg width="32" height="12" viewBox="0 0 32 12" fill="none">
                  <path d="M0 6 Q8 0 16 6 T32 6" stroke="#4fc3f7" strokeWidth="2" fill="none" />
                </svg>
                <svg width="20" height="20" style={{ marginLeft: 8 }} viewBox="0 0 20 20" fill="none">
                  <ellipse cx="10" cy="15" rx="6" ry="3" fill="#4fc3f7" fillOpacity="0.3"/>
                  <path d="M10 2 C13 7, 16 11, 10 18 C4 11, 7 7, 10 2 Z" fill="#4fc3f7" fillOpacity="0.7"/>
                </svg>
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <Select
                    value={selectedLocation}
                    onChange={e => setSelectedLocation(e.target.value)}
                    displayEmpty
                    renderValue={val => val ? val : <span style={{ color: '#b3e5fc' }}>请选择省份</span>}
                    sx={{
                      color: '#e3f2fd',
                      '.MuiOutlinedInput-notchedOutline': { borderColor: '#4fc3f7' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#0288d1' },
                      '.MuiSvgIcon-root': { color: '#4fc3f7' }
                    }}
                  >
                    <MenuItem value="">
                      <em>请选择省份</em>
                    </MenuItem>
                    {Array.from(new Set(hydroList.map(h => h.location))).map(loc =>
                      <MenuItem key={loc} value={loc}>{loc}</MenuItem>
                    )}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <Select
                    value={selectedBasin}
                    onChange={e => setSelectedBasin(e.target.value)}
                    displayEmpty
                    renderValue={val => val ? val : <span style={{ color: '#b3e5fc' }}>请选择流域</span>}
                    sx={{
                      color: '#e3f2fd',
                      '.MuiOutlinedInput-notchedOutline': { borderColor: '#4fc3f7' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#0288d1' },
                      '.MuiSvgIcon-root': { color: '#4fc3f7' }
                    }}
                  >
                    <MenuItem value="">
                      <em>请选择流域</em>
                    </MenuItem>
                    {Array.from(new Set(hydroList.filter(h => !selectedLocation || h.location === selectedLocation).map(h => h.basin))).map(basin =>
                      <MenuItem key={basin} value={basin}>{basin}</MenuItem>
                    )}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <Select
                    value={selectedSection}
                    onChange={e => setSelectedSection(e.target.value)}
                    displayEmpty
                    renderValue={val => val ? val : <span style={{ color: '#b3e5fc' }}>请选择断面名称</span>}
                    sx={{
                      color: '#e3f2fd',
                      '.MuiOutlinedInput-notchedOutline': { borderColor: '#4fc3f7' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#0288d1' },
                      '.MuiSvgIcon-root': { color: '#4fc3f7' }
                    }}
                  >
                    <MenuItem value="">
                      <em>请选择断面名称</em>
                    </MenuItem>
                    {Array.from(new Set(hydroList.filter(h => (!selectedLocation || h.location === selectedLocation) && (!selectedBasin || h.basin === selectedBasin)).map(h => h.section_name))).map(sec =>
                      <MenuItem key={sec} value={sec}>{sec}</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Box>
              <Typography sx={{ color: '#e3f2fd', fontSize: 14, mb: 1 }}>
                展示环境评分随时间的变化趋势，便于动态监控水体健康状况。
              </Typography>
              {selectedLocation && selectedBasin && selectedSection ? (
                <>
                  <Box sx={{ position: 'relative' }}>
                    <Box ref={envScoreChartRef}>
                      <ChartBox>
                        <ResponsiveContainer>
                          <LineChart data={envScoreLineData}>
                            <XAxis dataKey="date" stroke="#b3e5fc" />
                            <YAxis stroke="#b3e5fc" domain={[2, 5]} />
                            <Tooltip
                              contentStyle={{ background: "rgba(2,119,189,0.8)", border: "none", color: "#fff" }}
                              labelStyle={{ color: "#fff" }}
                              itemStyle={{ color: "#fff" }}
                            />
                            <Line type="monotone" dataKey="score" stroke="#4fc3f7" strokeWidth={3} dot={{ r: 5, fill: "#0288d1" }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </ChartBox>
                    </Box>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<DownloadIcon />}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        zIndex: 2,
                        color: '#4fc3f7',
                        borderColor: '#4fc3f7',
                        background: 'rgba(0,0,0,0.12)'
                      }}
                      onClick={handleDownloadEnvScoreChart}
                    >
                      下载图表
                    </Button>
                  </Box>
                  <Box sx={{ mt: 2, color: '#b3e5fc', fontSize: 14 }}>
                    <Typography sx={{ fontWeight: 500, mb: 1 }}>
                      环境评分标准说明：
                    </Typography>
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      <li>每项指标按国家标准分级，I类得5分，II类4分，III类3分，IV类2分，V类1分，超V类0分。</li>
                      <li>最终评分为各项得分的平均值。</li>
                    </ul>
                  </Box>
                </>
              ) : (
                <Box sx={{ color: '#b3e5fc', textAlign: 'center', py: 6, fontSize: 18 }}>
                  请选择省份、流域、断面名称后查看环境评分变化
                </Box>
              )}
            </CardContent>
          </SectionCard>
        </Grid>
      </Grid>
    </>
  );
};

    export default UnderWaterSystem;