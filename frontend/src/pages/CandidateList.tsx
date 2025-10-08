import React, { useState, useEffect } from 'react';
import {
    Table,
    Button,
    Input,
    Select,
    Space,
    Tag,
    Card,
    Row,
    Col,
    message,
    Spin
} from 'antd';
import {
    SearchOutlined,
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
    DownloadOutlined,
    ReloadOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { apiService, type Candidate } from '../services/api';
import CandidateEditModal from '../components/CandidateEditModal';

const { Option } = Select;

const CandidateList: React.FC = () => {
    const navigate = useNavigate();
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);

    // 加载候选人数据
    const loadCandidates = async () => {
        setLoading(true);
        try {
            const data = await apiService.getCandidates();
            setCandidates(data);
        } catch (error) {
            message.error('加载候选人数据失败');
        } finally {
            setLoading(false);
        }
    };

    // 组件挂载时加载数据
    useEffect(() => {
        loadCandidates();
    }, []);

    // 处理编辑
    const handleEdit = (record: Candidate) => {
        setEditingCandidate(record);
        setEditModalVisible(true);
    };

    const handleEditSave = (updatedCandidate: Candidate) => {
        // 更新本地状态
        setCandidates(prev =>
            prev.map(candidate =>
                candidate.id === updatedCandidate.id ? updatedCandidate : candidate
            )
        );
        setEditModalVisible(false);
        setEditingCandidate(null);
    };

    const handleEditCancel = () => {
        setEditModalVisible(false);
        setEditingCandidate(null);
    };

    // 处理删除
    const handleDelete = (record: Candidate) => {
        console.log('删除按钮被点击', record);

        // 使用window.confirm作为备选方案
        const confirmed = window.confirm(`确定要删除候选人 ${record.name} 吗？`);

        if (confirmed) {
            console.log('用户确认删除', record.id);
            deleteCandidate(record.id, record.name);
        } else {
            console.log('用户取消删除');
        }
    };

    // 执行删除操作
    const deleteCandidate = async (id: string, name: string) => {
        try {
            console.log('开始删除候选人', id);
            await apiService.deleteCandidate(id);
            console.log('删除成功');

            message.success(`候选人 ${name} 删除成功`);
            loadCandidates(); // 重新加载数据
        } catch (error) {
            console.error('删除错误', error);
            message.error('删除失败，请检查网络连接');
        }
    };

    // 处理下载
    const handleDownload = async (record: Candidate) => {
        try {
            await apiService.downloadResume(record.id);
            message.success('简历下载成功');
        } catch (error) {
            message.error('简历下载失败');
        }
    };

    // 处理批量删除
    const handleBatchDelete = () => {
        console.log('批量删除按钮被点击', selectedRowKeys);

        if (selectedRowKeys.length === 0) {
            message.warning('请选择要删除的候选人');
            return;
        }

        // 使用window.confirm作为备选方案
        const confirmed = window.confirm(`确定要删除选中的 ${selectedRowKeys.length} 个候选人吗？`);

        if (confirmed) {
            console.log('用户确认批量删除', selectedRowKeys);
            batchDeleteCandidates(selectedRowKeys);
        } else {
            console.log('用户取消批量删除');
        }
    };

    // 执行批量删除操作
    const batchDeleteCandidates = async (ids: React.Key[]) => {
        try {
            console.log('开始批量删除候选人', ids);

            const deletePromises = ids.map(async (id) => {
                try {
                    await apiService.deleteCandidate(id as string);
                    return { success: true, id };
                } catch (error) {
                    console.error(`删除候选人 ${id} 失败:`, error);
                    return { success: false, id };
                }
            });

            const results = await Promise.all(deletePromises);
            console.log('批量删除结果', results);

            const successCount = results.filter(result => result.success).length;
            const failCount = results.length - successCount;

            if (failCount === 0) {
                message.success(`成功删除 ${successCount} 个候选人`);
            } else {
                message.warning(`成功删除 ${successCount} 个候选人，${failCount} 个删除失败`);
            }

            setSelectedRowKeys([]);
            loadCandidates(); // 重新加载数据
        } catch (error) {
            console.error('批量删除错误', error);
            message.error('批量删除失败，请检查网络连接');
        }
    };

    const columns = [
        {
            title: '姓名',
            dataIndex: 'name',
            key: 'name',
            render: (text: string, record: Candidate) => {
                // 只有有效的ID才允许导航
                const hasValidId = record.id && !record.id.startsWith('candidate-');
                return (
                    <Button
                        type="link"
                        onClick={() => {
                            if (hasValidId) {
                                navigate(`/candidates/${record.id}`);
                            } else {
                                message.warning('该候选人数据不完整，无法查看详情');
                            }
                        }}
                        style={{
                            color: hasValidId ? 'var(--primary-color)' : '#999',
                            fontWeight: 500,
                            cursor: hasValidId ? 'pointer' : 'not-allowed'
                        }}
                    >
                        {text}
                    </Button>
                );
            },
        },
        {
            title: '联系方式',
            key: 'contact',
            render: (record: Candidate) => (
                <div>
                    <div style={{ color: 'var(--text-primary)' }}>{record.phone}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{record.email}</div>
                </div>
            ),
        },
        {
            title: '职位',
            key: 'position',
            render: (record: Candidate) => {
                const position = typeof record.position === 'string' ? record.position : '未提供';
                return (
                    <span style={{ color: 'var(--text-primary)' }}>{position}</span>
                );
            },
        },
        {
            title: '教育背景',
            key: 'education',
            render: (record: Candidate) => {
                if (record.educationList && record.educationList.length > 0) {
                    const latestEdu = record.educationList[0];

                    // 格式化时间显示
                    const formatTimeRange = () => {
                        if (typeof latestEdu.start_year === 'string' && typeof latestEdu.end_year === 'string') {
                            return `${latestEdu.start_year} - ${latestEdu.end_year}`;
                        } else if (typeof latestEdu.start_year === 'string') {
                            return latestEdu.start_year;
                        } else if (typeof latestEdu.end_year === 'string') {
                            return latestEdu.end_year;
                        }
                        return null;
                    };

                    const timeRange = formatTimeRange();

                    return (
                        <div>
                            <div style={{ color: 'var(--text-primary)' }}>
                                {typeof latestEdu.institution === 'string' ? latestEdu.institution : '未知学校'}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                {typeof latestEdu.major === 'string' ? latestEdu.major :
                                    typeof latestEdu.degree === 'string' ? latestEdu.degree : '未知专业'}
                            </div>
                            {timeRange && (
                                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                                    {timeRange}
                                </div>
                            )}
                        </div>
                    );
                }
                const education = typeof record.education === 'string' ? record.education : '未提供';
                return (
                    <span style={{ color: 'var(--text-primary)' }}>
                        {education}
                    </span>
                );
            },
        },
        {
            title: '技能',
            dataIndex: 'skills',
            key: 'skills',
            render: (skills: string[]) => {
                const skillColors = ['var(--accent-blue)', 'var(--accent-green)', 'var(--accent-purple)', 'var(--accent-orange)', 'var(--accent-cyan)'];

                return (
                    <div>
                        {skills.slice(0, 2).map((skill, index) => (
                            <Tag
                                key={skill}
                                style={{
                                    backgroundColor: skillColors[index % skillColors.length],
                                    color: '#fff',
                                    border: 'none',
                                    fontSize: '11px'
                                }}
                            >
                                {skill}
                            </Tag>
                        ))}
                        {skills.length > 2 && (
                            <Tag style={{
                                backgroundColor: 'var(--bg-tertiary)',
                                color: 'var(--text-secondary)',
                                border: '1px solid var(--border-color)',
                                fontSize: '11px'
                            }}>
                                +{skills.length - 2}
                            </Tag>
                        )}
                    </div>
                );
            },
        },
        {
            title: '状态',
            key: 'status',
            render: (record: Candidate) => {
                const status = typeof record.status === 'string' ? record.status : '未知';
                let color = 'default';
                let style: React.CSSProperties = {};

                switch (status) {
                    case '已面试':
                        color = 'green';
                        style = {
                            backgroundColor: 'var(--success-color)',
                            color: '#fff',
                            border: 'none'
                        };
                        break;
                    case '待面试':
                        color = 'orange';
                        style = {
                            backgroundColor: 'var(--warning-color)',
                            color: '#fff',
                            border: 'none'
                        };
                        break;
                    case '初筛通过':
                        color = 'blue';
                        style = {
                            backgroundColor: 'var(--accent-blue)',
                            color: '#fff',
                            border: 'none'
                        };
                        break;
                    case '已录用':
                        color = 'purple';
                        style = {
                            backgroundColor: 'var(--accent-purple)',
                            color: '#fff',
                            border: 'none'
                        };
                        break;
                    default:
                        style = {
                            backgroundColor: 'var(--bg-tertiary)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-color)'
                        };
                }

                return <Tag color={color} style={style}>{status}</Tag>;
            },
        },
        {
            title: '上传时间',
            key: 'uploadTime',
            render: (record: Candidate) => {
                const uploadTime = typeof record.uploadTime === 'string' ? record.uploadTime : '未知';
                return (
                    <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{uploadTime}</span>
                );
            },
        },
        {
            title: '操作',
            key: 'action',
            render: (record: Candidate) => {
                const hasValidId = record.id && !record.id.startsWith('candidate-');
                return (
                    <Space size="small">
                        <Button
                            type="text"
                            icon={<EyeOutlined />}
                            onClick={() => {
                                if (hasValidId) {
                                    navigate(`/candidates/${record.id}`);
                                } else {
                                    message.warning('该候选人数据不完整，无法查看详情');
                                }
                            }}
                            style={{
                                color: hasValidId ? 'var(--primary-color)' : '#999',
                                cursor: hasValidId ? 'pointer' : 'not-allowed'
                            }}
                        />
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => {
                                if (hasValidId) {
                                    handleEdit(record);
                                } else {
                                    message.warning('该候选人数据不完整，无法编辑');
                                }
                            }}
                            style={{
                                color: hasValidId ? 'var(--primary-color)' : '#999',
                                cursor: hasValidId ? 'pointer' : 'not-allowed'
                            }}
                        />
                        <Button
                            type="text"
                            icon={<DownloadOutlined />}
                            onClick={() => {
                                if (hasValidId) {
                                    handleDownload(record);
                                } else {
                                    message.warning('该候选人数据不完整，无法下载');
                                }
                            }}
                            style={{
                                color: hasValidId ? 'var(--primary-color)' : '#999',
                                cursor: hasValidId ? 'pointer' : 'not-allowed'
                            }}
                        />
                        <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (hasValidId) {
                                    console.log('删除按钮点击事件触发', record);
                                    handleDelete(record);
                                } else {
                                    message.warning('该候选人数据不完整，无法删除');
                                }
                            }}
                            style={{
                                color: hasValidId ? 'var(--error-color)' : '#999',
                                cursor: hasValidId ? 'pointer' : 'not-allowed'
                            }}
                        />
                    </Space>
                );
            },
        },
    ];

    const rowSelection = {
        selectedRowKeys,
        onChange: setSelectedRowKeys,
    };

    const filteredCandidates = candidates.filter(candidate => {
        const matchesSearch = candidate.name.includes(searchText) ||
            (candidate.position && candidate.position.includes(searchText)) ||
            (candidate.skills && candidate.skills.some(skill => skill.includes(searchText)));
        const matchesStatus = !statusFilter || candidate.status === statusFilter;
        return matchesSearch && matchesStatus;
    }).map((candidate, index) => ({
        ...candidate,
        // 保持原始ID，但为Table的rowKey提供备用方案
        _tableKey: candidate.id || `candidate-${index}`, // 仅用于Table的rowKey
    }));

    return (
        <div style={{
            height: 'calc(100vh - 64px)',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--bg-secondary)'
        }}>
            {/* 搜索和操作区域 */}
            <Card
                size="small"
                style={{
                    marginBottom: '12px',
                    flex: '0 0 auto',
                    backgroundColor: 'var(--card-bg)',
                    borderColor: 'var(--border-color)',
                    boxShadow: 'var(--shadow)'
                }}
            >
                <Row gutter={[12, 8]}>
                    <Col xs={24} sm={12} md={8}>
                        <Input
                            placeholder="搜索筛选 - 姓名、职位或技能"
                            prefix={<SearchOutlined style={{ color: 'var(--text-secondary)' }} />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            size="small"
                            style={{
                                backgroundColor: 'var(--bg-primary)',
                                color: 'var(--text-primary)',
                                borderColor: 'var(--border-color)'
                            }}
                        />
                    </Col>
                    <Col xs={24} sm={12} md={4}>
                        <Select
                            placeholder="状态筛选"
                            style={{
                                width: '100%',
                                backgroundColor: 'var(--bg-primary)',
                                color: 'var(--text-primary)'
                            }}
                            value={statusFilter}
                            onChange={setStatusFilter}
                            allowClear
                            size="small"
                            styles={{
                                popup: {
                                    root: {
                                        backgroundColor: 'var(--card-bg)',
                                        borderColor: 'var(--border-color)',
                                        boxShadow: 'var(--shadow)',
                                        color: 'var(--text-primary)'
                                    }
                                }
                            }}
                            optionFilterProp="children"
                            getPopupContainer={(triggerNode) => triggerNode.parentNode}
                            virtual={false}
                            popupRender={(menu) => (
                                <div style={{
                                    backgroundColor: 'var(--card-bg)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '6px',
                                    boxShadow: 'var(--shadow)'
                                }}>
                                    {menu}
                                </div>
                            )}
                            className="status-filter-select"
                        >
                            <Option
                                value="初筛通过"
                                style={{
                                    backgroundColor: 'var(--card-bg)',
                                    color: 'var(--text-primary)',
                                    opacity: 1,
                                    visibility: 'visible',
                                    display: 'block'
                                }}
                            >
                                <span style={{ color: 'var(--text-primary)' }}>初筛通过</span>
                            </Option>
                            <Option
                                value="待面试"
                                style={{
                                    backgroundColor: 'var(--card-bg)',
                                    color: 'var(--text-primary)',
                                    opacity: 1,
                                    visibility: 'visible',
                                    display: 'block'
                                }}
                            >
                                <span style={{ color: 'var(--text-primary)' }}>待面试</span>
                            </Option>
                            <Option
                                value="已面试"
                                style={{
                                    backgroundColor: 'var(--card-bg)',
                                    color: 'var(--text-primary)',
                                    opacity: 1,
                                    visibility: 'visible',
                                    display: 'block'
                                }}
                            >
                                <span style={{ color: 'var(--text-primary)' }}>已面试</span>
                            </Option>
                            <Option
                                value="已录用"
                                style={{
                                    backgroundColor: 'var(--card-bg)',
                                    color: 'var(--text-primary)',
                                    opacity: 1,
                                    visibility: 'visible',
                                    display: 'block'
                                }}
                            >
                                <span style={{ color: 'var(--text-primary)' }}>已录用</span>
                            </Option>
                        </Select>
                    </Col>
                    <Col xs={24} sm={24} md={12}>
                        <Space size="small">
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => navigate('/upload')}
                                size="small"
                            >
                                上传简历
                            </Button>
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={loadCandidates}
                                loading={loading}
                                size="small"
                            >
                                刷新
                            </Button>
                            <Button
                                danger
                                disabled={selectedRowKeys.length === 0}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log('批量删除按钮点击事件触发', selectedRowKeys);
                                    handleBatchDelete();
                                }}
                                size="small"
                            >
                                批量删除
                            </Button>
                        </Space>
                    </Col>
                </Row>
            </Card>

            {/* 表格区域 */}
            <Card
                size="small"
                style={{
                    flex: '1 1 auto',
                    overflow: 'hidden',
                    backgroundColor: 'var(--card-bg)',
                    borderColor: 'var(--border-color)',
                    boxShadow: 'var(--shadow)'
                }}
                styles={{ body: { padding: '12px', height: 'calc(100% - 57px)', overflow: 'auto' } }}
            >
                <Spin spinning={loading}>
                    <Table
                        columns={columns}
                        dataSource={filteredCandidates}
                        rowSelection={rowSelection}
                        rowKey={(record) => record._tableKey || record.id || `candidate-${record.name || 'unknown'}`}
                        size="small"
                        scroll={{ y: 'calc(100vh - 200px)' }}
                        pagination={{
                            total: filteredCandidates.length,
                            pageSize: 20,
                            showSizeChanger: true,
                            showQuickJumper: true,
                            showTotal: (total, range) =>
                                `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
                            size: 'small',
                            style: {
                                marginTop: '16px',
                                textAlign: 'center'
                            },
                            itemRender: (_, type, originalElement) => {
                                if (type === 'prev') {
                                    return <Button size="small" style={{ color: 'var(--text-primary)' }}>上一页</Button>;
                                }
                                if (type === 'next') {
                                    return <Button size="small" style={{ color: 'var(--text-primary)' }}>下一页</Button>;
                                }
                                return originalElement;
                            }
                        }}
                    />
                </Spin>
            </Card>

            {/* 编辑模态框 */}
            <CandidateEditModal
                visible={editModalVisible}
                candidate={editingCandidate}
                onCancel={handleEditCancel}
                onSave={handleEditSave}
            />
        </div>
    );
};

export default CandidateList;
