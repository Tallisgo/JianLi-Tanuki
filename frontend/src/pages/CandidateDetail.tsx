import React, { useState, useEffect } from 'react';
import {
    Card,
    Descriptions,
    Tag,
    Timeline,
    Button,
    Space,
    Divider,
    Typography,
    Row,
    Col,
    Spin,
    message
} from 'antd';
import {
    EditOutlined,
    DownloadOutlined,
    PhoneOutlined,
    MailOutlined,
    EnvironmentOutlined,
    CalendarOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService, type Candidate } from '../services/api';
import CandidateEditModal from '../components/CandidateEditModal';

const { Title, Paragraph } = Typography;

const CandidateDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [candidate, setCandidate] = useState<Candidate | null>(null);
    const [loading, setLoading] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);

    // 加载候选人详情
    const loadCandidate = async () => {
        if (!id) return;

        setLoading(true);
        try {
            const data = await apiService.getCandidate(id);
            setCandidate(data);
        } catch (error) {
            message.error('加载候选人详情失败');
        } finally {
            setLoading(false);
        }
    };

    // 组件挂载时加载数据
    useEffect(() => {
        loadCandidate();
    }, [id]);

    // 处理编辑
    const handleEdit = () => {
        setEditModalVisible(true);
    };

    const handleEditSave = (updatedCandidate: Candidate) => {
        setCandidate(updatedCandidate);
        setEditModalVisible(false);
    };

    const handleEditCancel = () => {
        setEditModalVisible(false);
    };

    // 处理下载
    const handleDownload = async () => {
        if (!candidate) return;

        try {
            const success = await apiService.downloadResume(candidate.id, `${candidate.name}_简历.pdf`);
            if (success) {
                message.success('简历下载成功');
            } else {
                message.error('简历下载失败');
            }
        } catch (error) {
            message.error('简历下载失败');
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!candidate) {
        return (
            <div>
                <div style={{ marginBottom: '16px' }}>
                    <Button onClick={() => navigate('/candidates')}>← 返回列表</Button>
                </div>
                <Card>
                    <div style={{ textAlign: 'center', padding: '50px' }}>
                        <Title level={4}>候选人不存在</Title>
                        <Paragraph>请检查链接是否正确</Paragraph>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            padding: '16px',
            backgroundColor: 'var(--bg-secondary)'
        }}>
            {/* 顶部操作栏 */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                padding: '12px 16px',
                backgroundColor: 'var(--card-bg)',
                borderRadius: '8px',
                boxShadow: 'var(--shadow)'
            }}>
                <Button onClick={() => navigate('/candidates')} size="small">← 返回列表</Button>
                <Space size="small">
                    <Button type="primary" icon={<EditOutlined />} onClick={handleEdit} size="small">编辑</Button>
                    <Button icon={<DownloadOutlined />} onClick={handleDownload} size="small">下载简历</Button>
                </Space>
            </div>

            {/* 主要内容区域 - 响应式布局 */}
            <Row gutter={[16, 16]}>
                {/* 左侧：基本信息 */}
                <Col xs={24} lg={8}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* 基本信息 */}
                        <Card title="基本信息" size="small" style={{ boxShadow: 'var(--shadow)' }}>
                            <Descriptions column={1} size="small">
                                <Descriptions.Item label="姓名">{candidate.name}</Descriptions.Item>
                                <Descriptions.Item label="电话">
                                    <Space size="small">
                                        <PhoneOutlined style={{ fontSize: '12px' }} />
                                        {candidate.phone || '未提供'}
                                    </Space>
                                </Descriptions.Item>
                                <Descriptions.Item label="邮箱">
                                    <Space size="small">
                                        <MailOutlined style={{ fontSize: '12px' }} />
                                        {candidate.email || '未提供'}
                                    </Space>
                                </Descriptions.Item>
                                <Descriptions.Item label="地址">
                                    <Space size="small">
                                        <EnvironmentOutlined style={{ fontSize: '12px' }} />
                                        {candidate.address || '未提供'}
                                    </Space>
                                </Descriptions.Item>
                                <Descriptions.Item label="期望职位">{candidate.position || '未提供'}</Descriptions.Item>
                                <Descriptions.Item label="工作经验">{candidate.experience || '未提供'}</Descriptions.Item>
                                <Descriptions.Item label="状态">
                                    <Tag color="green" style={{ fontSize: '11px' }}>{candidate.status}</Tag>
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>

                        {/* 教育背景 */}
                        <Card title="教育背景" size="small" style={{ boxShadow: 'var(--shadow)' }}>
                            <Descriptions column={1} size="small">
                                <Descriptions.Item label="学历">{candidate.education || '未提供'}</Descriptions.Item>
                                <Descriptions.Item label="专业">{candidate.major || '未提供'}</Descriptions.Item>
                                <Descriptions.Item label="学校">{candidate.school || '未提供'}</Descriptions.Item>
                                <Descriptions.Item label="毕业时间">未提供</Descriptions.Item>
                            </Descriptions>
                        </Card>

                        {/* 技能标签 */}
                        <Card title="技能标签" size="small" style={{ boxShadow: 'var(--shadow)' }}>
                            {candidate.skills && candidate.skills.length > 0 ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                    {candidate.skills.map(skill => (
                                        <Tag key={skill} color="blue" style={{ fontSize: '11px', margin: '2px' }}>
                                            {skill}
                                        </Tag>
                                    ))}
                                </div>
                            ) : (
                                <span style={{ color: '#999', fontSize: '12px' }}>未提供技能信息</span>
                            )}
                        </Card>
                    </div>
                </Col>

                {/* 右侧：工作经历和项目经历 */}
                <Col xs={24} lg={16}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* 工作经历 */}
                        <Card title="工作经历" size="small" style={{ boxShadow: 'var(--shadow)' }}>
                            {candidate.workExperience && candidate.workExperience.length > 0 ? (
                                <Timeline>
                                    {candidate.workExperience
                                        .sort((a, b) => {
                                            // 按时间排序，从最近的开始
                                            // 提取开始年份进行比较
                                            const getStartYear = (duration: string) => {
                                                const match = duration.match(/(\d{4})/);
                                                return match ? parseInt(match[1]) : 0;
                                            };

                                            const yearA = getStartYear(a.duration);
                                            const yearB = getStartYear(b.duration);

                                            // 降序排列（最新的在前）
                                            return yearB - yearA;
                                        })
                                        .map((work, index) => (
                                            <Timeline.Item key={index}>
                                                <div>
                                                    <Title level={5} style={{ margin: 0, fontSize: '14px' }}>
                                                        {work.position} - {work.company}
                                                    </Title>
                                                    <Paragraph style={{ color: '#666', margin: '4px 0', fontSize: '12px' }}>
                                                        <CalendarOutlined style={{ fontSize: '11px' }} /> {work.duration}
                                                    </Paragraph>
                                                    <Paragraph style={{ margin: 0, fontSize: '12px', lineHeight: '1.6' }}>
                                                        {work.description}
                                                    </Paragraph>
                                                </div>
                                            </Timeline.Item>
                                        ))}
                                </Timeline>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                                    <span style={{ fontSize: '12px' }}>暂无工作经历信息</span>
                                </div>
                            )}
                        </Card>

                        {/* 项目经历 */}
                        <Card title="项目经历" size="small" style={{ boxShadow: 'var(--shadow)' }}>
                            {candidate.projects && candidate.projects.length > 0 ? (
                                <div>
                                    {candidate.projects
                                        .sort((a, b) => {
                                            // 按时间排序，从最近的开始
                                            // 如果有时间信息，按时间排序；否则保持原顺序
                                            if (a.start_date && b.start_date) {
                                                const dateA = new Date(a.start_date);
                                                const dateB = new Date(b.start_date);
                                                return dateB.getTime() - dateA.getTime();
                                            }
                                            return 0;
                                        })
                                        .map((project, index) => (
                                            <div key={index} style={{ marginBottom: '16px' }}>
                                                <Title level={5} style={{ margin: 0, fontSize: '14px' }}>
                                                    {project.name}
                                                </Title>
                                                <Paragraph style={{ margin: '6px 0', fontSize: '12px', lineHeight: '1.6' }}>
                                                    {project.description}
                                                </Paragraph>
                                                <div style={{ marginTop: '8px' }}>
                                                    {project.technologies.map(tech => (
                                                        <Tag key={tech} style={{ marginBottom: '4px', fontSize: '10px' }}>
                                                            {tech}
                                                        </Tag>
                                                    ))}
                                                </div>
                                                {index < (candidate.projects?.length || 0) - 1 && <Divider style={{ margin: '12px 0' }} />}
                                            </div>
                                        ))}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                                    <span style={{ fontSize: '12px' }}>暂无项目经历信息</span>
                                </div>
                            )}
                        </Card>
                    </div>
                </Col>
            </Row>

            {/* 备注信息 */}
            <Card title="备注信息" size="small" style={{ marginTop: '16px', boxShadow: 'var(--shadow)' }}>
                <Paragraph style={{ fontSize: '12px', margin: 0, lineHeight: '1.6' }}>
                    {candidate.notes || '暂无备注信息'}
                </Paragraph>
            </Card>

            {/* 编辑模态框 */}
            <CandidateEditModal
                visible={editModalVisible}
                candidate={candidate}
                onCancel={handleEditCancel}
                onSave={handleEditSave}
            />
        </div>
    );
};

export default CandidateDetail;
