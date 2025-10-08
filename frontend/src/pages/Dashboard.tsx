import React, { useState, useEffect } from 'react';
import {
    Row,
    Col,
    Card,
    Statistic,
    Table,
    Tag,
    Button,
    Progress,
    List,
    Avatar,
    Typography,
    Space,
    Badge,
    Spin
} from 'antd';
import {
    UserOutlined,
    FileTextOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    EyeOutlined,
    PlusOutlined,
    CalendarOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { apiService, type Candidate } from '../services/api';
import InspirationCard from '../components/InspirationCard';

const { Title, Text } = Typography;

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(false);

    // 加载候选人数据
    const loadCandidates = async () => {
        setLoading(true);
        try {
            const data = await apiService.getCandidates();
            setCandidates(data);
        } catch (error) {
            console.error('加载候选人数据失败:', error);
        } finally {
            setLoading(false);
        }
    };

    // 组件挂载时加载数据
    useEffect(() => {
        loadCandidates();
    }, []);

    // 获取最近候选人（最多4个）
    const recentCandidates = candidates.slice(0, 4).map((candidate, index) => ({
        key: candidate.id || `candidate-${index}`, // 确保有唯一的 key
        id: candidate.id,
        name: candidate.name || '未知姓名',
        position: typeof candidate.position === 'string' ? candidate.position : '未知职位',
        experience: typeof candidate.experience === 'string' ? candidate.experience : '未知',
        status: typeof candidate.status === 'string' ? candidate.status : '未知',
        uploadTime: candidate.uploadTime || '未知时间',
        avatar: `https://api.dicebear.com/7.x/miniavs/svg?seed=${candidate.id || index}`,
    }));

    // 计算热门技能
    const skillCounts: { [key: string]: number } = {};
    candidates.forEach(candidate => {
        if (candidate.skills) {
            candidate.skills.forEach(skill => {
                skillCounts[skill] = (skillCounts[skill] || 0) + 1;
            });
        }
    });

    const topSkills = Object.entries(skillCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, count], index) => ({
            name,
            count,
            color: ['#1890ff', '#52c41a', '#faad14', '#722ed1', '#13c2c2'][index]
        }));

    const upcomingInterviews = [
        {
            name: '陈七',
            position: '前端开发工程师',
            time: '今天 14:00',
            type: '技术面试',
        },
        {
            name: '刘八',
            position: '产品经理',
            time: '明天 10:00',
            type: '综合面试',
        },
        {
            name: '周九',
            position: 'Java工程师',
            time: '明天 15:30',
            type: '技术面试',
        },
    ];

    const monthlyStats = [
        { month: '1月', candidates: 45, hired: 8 },
        { month: '2月', candidates: 52, hired: 12 },
        { month: '3月', candidates: 38, hired: 6 },
        { month: '4月', candidates: 61, hired: 15 },
        { month: '5月', candidates: 48, hired: 9 },
        { month: '6月', candidates: 55, hired: 11 },
    ];

    const columns = [
        {
            title: '候选人',
            key: 'candidate',
            render: (record: any) => (
                <Space>
                    <Avatar src={record.avatar} size="small" />
                    <div>
                        <div style={{ fontWeight: 500 }}>{record.name}</div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            {record.position}
                        </Text>
                    </div>
                </Space>
            ),
        },
        {
            title: '状态',
            key: 'status',
            render: (record: any) => {
                const status = typeof record.status === 'string' ? record.status : '未知';
                const color = status === '已面试' ? 'green' :
                    status === '待面试' ? 'orange' :
                        status === '已录用' ? 'blue' : 'default';
                return <Tag color={color}>{status}</Tag>;
            },
        },
        {
            title: '上传时间',
            key: 'uploadTime',
            render: (record: any) => (
                <span>{typeof record.uploadTime === 'string' ? record.uploadTime : '未知时间'}</span>
            ),
        },
        {
            title: '操作',
            key: 'action',
            render: (record: any) => (
                <Button
                    type="link"
                    icon={<EyeOutlined />}
                    onClick={() => navigate(`/candidates/${record.id}`)}
                >
                    查看
                </Button>
            ),
        },
    ];

    return (
        <div style={{ height: 'calc(100vh - 64px)', overflow: 'auto' }}>
            {/* 页面标题和快速操作 */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                padding: '0 4px'
            }}>
                <Title level={2} style={{ margin: 0, color: 'var(--text-primary)' }}>JianLi Tanuki (简狸) 仪表板</Title>
                <Space>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => navigate('/upload')}
                    >
                        上传简历
                    </Button>
                    <Button
                        icon={<UserOutlined />}
                        onClick={() => navigate('/candidates')}
                    >
                        管理候选人
                    </Button>
                </Space>
            </div>

            {/* 激励语区域 */}
            <Row gutter={[12, 12]} style={{ marginBottom: '16px' }}>
                <Col span={24}>
                    <InspirationCard />
                </Col>
            </Row>

            {/* 主要内容区域 - 三列布局 */}
            <Row gutter={[12, 12]} style={{ height: 'calc(100vh - 240px)' }}>
                {/* 左侧：统计卡片和热门技能 */}
                <Col xs={24} lg={8}>
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        {/* 统计卡片 */}
                        <Row gutter={[8, 8]} style={{ marginBottom: '12px' }}>
                            <Col span={12}>
                                <Card size="small" style={{ height: '80px' }}>
                                    <Statistic
                                        title="候选人总数"
                                        value={candidates.length}
                                        prefix={<UserOutlined style={{ fontSize: '16px' }} />}
                                        valueStyle={{ color: '#3f8600', fontSize: '20px' }}
                                    />
                                </Card>
                            </Col>
                            <Col span={12}>
                                <Card size="small" style={{ height: '80px' }}>
                                    <Statistic
                                        title="本月新增"
                                        value={candidates.length}
                                        prefix={<FileTextOutlined style={{ fontSize: '16px' }} />}
                                        valueStyle={{ color: '#1890ff', fontSize: '20px' }}
                                    />
                                </Card>
                            </Col>
                            <Col span={12}>
                                <Card size="small" style={{ height: '80px' }}>
                                    <Statistic
                                        title="待处理"
                                        value={0}
                                        prefix={<ClockCircleOutlined style={{ fontSize: '16px' }} />}
                                        valueStyle={{ color: '#faad14', fontSize: '20px' }}
                                    />
                                </Card>
                            </Col>
                            <Col span={12}>
                                <Card size="small" style={{ height: '80px' }}>
                                    <Statistic
                                        title="已解析"
                                        value={candidates.length}
                                        prefix={<CheckCircleOutlined style={{ fontSize: '16px' }} />}
                                        valueStyle={{ color: '#52c41a', fontSize: '20px' }}
                                    />
                                </Card>
                            </Col>
                        </Row>

                        {/* 热门技能 */}
                        <Card
                            title="热门技能"
                            size="small"
                            style={{ flex: '1 1 auto', overflow: 'hidden' }}
                            styles={{ body: { padding: '12px', height: 'calc(100% - 57px)', overflow: 'auto' } }}
                        >
                            {topSkills.length > 0 ? (
                                <List
                                    size="small"
                                    dataSource={topSkills}
                                    renderItem={(skill, index) => (
                                        <List.Item key={`skill-${index}`} style={{ padding: '4px 0' }}>
                                            <div style={{ width: '100%' }}>
                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    marginBottom: '4px'
                                                }}>
                                                    <Text strong style={{ fontSize: '12px' }}>{skill.name}</Text>
                                                    <Text style={{ fontSize: '11px' }}>{skill.count}人</Text>
                                                </div>
                                                <Progress
                                                    percent={(skill.count / Math.max(...topSkills.map(s => s.count))) * 100}
                                                    strokeColor={skill.color}
                                                    showInfo={false}
                                                    size="small"
                                                />
                                            </div>
                                        </List.Item>
                                    )}
                                />
                            ) : (
                                <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                                    <Text type="secondary">暂无技能数据</Text>
                                </div>
                            )}
                        </Card>
                    </div>
                </Col>

                {/* 中间：最近候选人 */}
                <Col xs={24} lg={10}>
                    <Card
                        title="最近候选人"
                        size="small"
                        style={{ height: '100%' }}
                        extra={
                            <Button type="link" size="small" onClick={() => navigate('/candidates')}>
                                查看全部
                            </Button>
                        }
                        styles={{ body: { padding: '12px', height: 'calc(100% - 57px)', overflow: 'auto' } }}
                    >
                        <Spin spinning={loading}>
                            <Table
                                columns={columns}
                                dataSource={recentCandidates}
                                rowKey="key"
                                pagination={false}
                                size="small"
                                scroll={{ y: 'calc(100vh - 300px)' }}
                            />
                        </Spin>
                    </Card>
                </Col>

                {/* 右侧：即将面试和月度统计 */}
                <Col xs={24} lg={6}>
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        {/* 即将面试 */}
                        <Card
                            title="即将面试"
                            size="small"
                            style={{ flex: '0 0 auto', marginBottom: '12px' }}
                            extra={<Badge count={upcomingInterviews.length} size="small" />}
                            styles={{ body: { padding: '8px', maxHeight: '200px', overflow: 'auto' } }}
                        >
                            <List
                                size="small"
                                dataSource={upcomingInterviews}
                                renderItem={(item, index) => (
                                    <List.Item key={`interview-${index}`} style={{ padding: '4px 0' }}>
                                        <List.Item.Meta
                                            avatar={<Avatar icon={<CalendarOutlined />} size="small" />}
                                            title={<Text style={{ fontSize: '12px' }}>{item.name}</Text>}
                                            description={
                                                <div>
                                                    <Text style={{ fontSize: '11px' }}>{item.position}</Text>
                                                    <br />
                                                    <Text type="secondary" style={{ fontSize: '10px' }}>{item.time}</Text>
                                                    <Tag style={{ marginLeft: '4px', fontSize: '9px' }}>
                                                        {item.type}
                                                    </Tag>
                                                </div>
                                            }
                                        />
                                    </List.Item>
                                )}
                            />
                        </Card>

                        {/* 月度统计 */}
                        <Card
                            title="月度统计"
                            size="small"
                            style={{ flex: '1 1 auto', overflow: 'hidden' }}
                            styles={{ body: { padding: '8px', height: 'calc(100% - 57px)', overflow: 'auto' } }}
                        >
                            <List
                                size="small"
                                dataSource={monthlyStats}
                                renderItem={(stat, index) => (
                                    <List.Item key={`stat-${index}`} style={{ padding: '4px 0' }}>
                                        <div style={{ width: '100%' }}>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: '4px'
                                            }}>
                                                <Text strong style={{ fontSize: '12px' }}>{stat.month}</Text>
                                                <Space size="small">
                                                    <Text type="secondary" style={{ fontSize: '10px' }}>候选人: {stat.candidates}</Text>
                                                    <Text type="secondary" style={{ fontSize: '10px' }}>录用: {stat.hired}</Text>
                                                </Space>
                                            </div>
                                            <Progress
                                                percent={(stat.hired / stat.candidates) * 100}
                                                strokeColor="#52c41a"
                                                showInfo={false}
                                                size="small"
                                            />
                                        </div>
                                    </List.Item>
                                )}
                            />
                        </Card>
                    </div>
                </Col>
            </Row>
        </div>
    );
};

export default Dashboard;
