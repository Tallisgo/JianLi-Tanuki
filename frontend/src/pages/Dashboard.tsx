import React, { useState, useEffect } from 'react';
import {
    Row,
    Col,
    Card,
    Statistic,
    Table,
    Button,
    Avatar,
    Typography,
    Space,
    Spin
} from 'antd';
import {
    UserOutlined,
    FileTextOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    EyeOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { apiService, type Candidate } from '../services/api';
import InspirationCard from '../components/InspirationCard';
import TodoList from '../components/TodoList';

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

    // 获取最近候选人（最多6个）
    const recentCandidates = candidates.slice(0, 6).map((candidate, index) => ({
        key: candidate.id || `candidate-${index}`,
        id: candidate.id,
        name: candidate.name || '未知姓名',
        position: typeof candidate.position === 'string' ? candidate.position : '未知职位',
        experience: typeof candidate.experience === 'string' ? candidate.experience : '未知',
        uploadTime: candidate.uploadTime || '未知时间',
        avatar: `https://api.dicebear.com/7.x/miniavs/svg?seed=${candidate.id || index}`,
    }));

    // 最近候选人表格列配置（移除状态列）
    const columns = [
        {
            title: '候选人',
            key: 'candidate',
            render: (record: any) => (
                <Space>
                    <Avatar src={record.avatar} size="small" />
                    <div>
                        <div style={{ fontWeight: 500, fontSize: '13px' }}>{record.name}</div>
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                            {record.position}
                        </Text>
                    </div>
                </Space>
            ),
        },
        {
            title: '上传时间',
            key: 'uploadTime',
            width: 100,
            render: (record: any) => (
                <Text style={{ fontSize: '12px' }}>
                    {typeof record.uploadTime === 'string' ? record.uploadTime : '未知时间'}
                </Text>
            ),
        },
        {
            title: '操作',
            key: 'action',
            width: 80,
            render: (record: any) => (
                <Button
                    type="link"
                    size="small"
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
                marginBottom: '20px',
                padding: '0 4px'
            }}>
                <Title level={2} style={{ margin: 0, color: 'var(--text-primary)' }}>
                    JianLi Tanuki (简狸) 仪表板
                </Title>
                <Button
                    icon={<UserOutlined />}
                    onClick={() => navigate('/candidates')}
                >
                    管理候选人
                </Button>
            </div>

            {/* 能量站区域 - 增大占位 */}
            <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
                <Col span={24}>
                    <InspirationCard
                        style={{
                            minHeight: '160px'
                        }}
                        enlarged={true}
                    />
                </Col>
            </Row>

            {/* 主要内容区域 - 两列布局 */}
            <Row gutter={[16, 16]} style={{ height: 'calc(100vh - 320px)' }}>
                {/* 左侧：统计卡片和最近候选人 */}
                <Col xs={24} lg={14}>
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        {/* 统计卡片 */}
                        <Row gutter={[12, 12]} style={{ marginBottom: '16px' }}>
                            <Col span={6}>
                                <Card size="small" style={{ height: '90px' }}>
                                    <Statistic
                                        title="候选人总数"
                                        value={candidates.length}
                                        prefix={<UserOutlined style={{ fontSize: '18px' }} />}
                                        valueStyle={{ color: '#3f8600', fontSize: '24px' }}
                                    />
                                </Card>
                            </Col>
                            <Col span={6}>
                                <Card size="small" style={{ height: '90px' }}>
                                    <Statistic
                                        title="本月新增"
                                        value={candidates.length}
                                        prefix={<FileTextOutlined style={{ fontSize: '18px' }} />}
                                        valueStyle={{ color: '#1890ff', fontSize: '24px' }}
                                    />
                                </Card>
                            </Col>
                            <Col span={6}>
                                <Card size="small" style={{ height: '90px' }}>
                                    <Statistic
                                        title="待处理"
                                        value={0}
                                        prefix={<ClockCircleOutlined style={{ fontSize: '18px' }} />}
                                        valueStyle={{ color: '#faad14', fontSize: '24px' }}
                                    />
                                </Card>
                            </Col>
                            <Col span={6}>
                                <Card size="small" style={{ height: '90px' }}>
                                    <Statistic
                                        title="已解析"
                                        value={candidates.length}
                                        prefix={<CheckCircleOutlined style={{ fontSize: '18px' }} />}
                                        valueStyle={{ color: '#52c41a', fontSize: '24px' }}
                                    />
                                </Card>
                            </Col>
                        </Row>

                        {/* 最近候选人 */}
                        <Card
                            title="最近候选人"
                            size="small"
                            style={{ flex: 1, overflow: 'hidden' }}
                            extra={
                                <Button type="link" size="small" onClick={() => navigate('/candidates')}>
                                    查看全部
                                </Button>
                            }
                            styles={{
                                body: {
                                    padding: '12px',
                                    height: 'calc(100% - 57px)',
                                    overflow: 'auto'
                                }
                            }}
                        >
                            <Spin spinning={loading}>
                                <Table
                                    columns={columns}
                                    dataSource={recentCandidates}
                                    rowKey="key"
                                    pagination={false}
                                    size="small"
                                    scroll={{ y: 'calc(100vh - 500px)' }}
                                />
                            </Spin>
                        </Card>
                    </div>
                </Col>

                {/* 右侧：待办事项 */}
                <Col xs={24} lg={10}>
                    <TodoList style={{ height: '100%' }} />
                </Col>
            </Row>
        </div>
    );
};

export default Dashboard;
