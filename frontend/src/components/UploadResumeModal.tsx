import React, { useState } from 'react';
import {
    Modal,
    Upload,
    Button,
    message,
    Progress,
    Typography,
    Space,
    Card,
    Row,
    Col,
    Collapse,
    Select,
    notification,
    Table,
    Alert
} from 'antd';
import {
    UploadOutlined,
    InboxOutlined,
    FileTextOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    DeleteOutlined,
    InfoCircleOutlined,
    EyeOutlined,
    ExclamationCircleOutlined
} from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import { apiService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';

const { Dragger } = Upload;
const { Text } = Typography;
const { Option } = Select;

interface UploadResumeModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    onParsingStart?: () => void;
    onParsingComplete?: () => void;
}

interface UploadProgress {
    file: UploadFile;
    progress: number;
    status: 'uploading' | 'success' | 'error';
    message?: string;
}

interface DuplicateCandidate {
    id: number;
    name: string;
    phone?: string;
    email?: string;
    position?: string;
    created_at?: string;
    updated_at?: string;
}

const UploadResumeModal: React.FC<UploadResumeModalProps> = ({
    visible,
    onClose,
    onSuccess,
    onParsingStart,
    onParsingComplete
}) => {
    const navigate = useNavigate();
    const { addNotification } = useNotifications();
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('');

    // 重复检测相关状态
    const [duplicateModalVisible, setDuplicateModalVisible] = useState(false);
    const [duplicateCandidates, setDuplicateCandidates] = useState<DuplicateCandidate[]>([]);
    const [pendingFile, setPendingFile] = useState<UploadFile | null>(null);
    const [selectedDuplicateId, setSelectedDuplicateId] = useState<number | null>(null);

    // 默认职位分类配置
    const defaultPositionCategories = [
        { id: 'tech', name: '技术开发', color: '#1890ff' },
        { id: 'design', name: '产品设计', color: '#52c41a' },
        { id: 'marketing', name: '运营推广', color: '#fa8c16' },
        { id: 'sales', name: '销售商务', color: '#eb2f96' },
        { id: 'hr', name: '人力资源', color: '#722ed1' },
        { id: 'finance', name: '财务金融', color: '#13c2c2' },
        { id: 'admin', name: '管理行政', color: '#faad14' },
        { id: 'other', name: '其他职位', color: '#8c8c8c' }
    ];

    // 从localStorage获取职位分类配置
    const getPositionCategories = () => {
        const savedCategories = localStorage.getItem('positionCategories');
        if (savedCategories) {
            try {
                const parsed = JSON.parse(savedCategories);
                return parsed.length > 0 ? parsed : defaultPositionCategories;
            } catch (error) {
                return defaultPositionCategories;
            }
        }
        return defaultPositionCategories;
    };

    // 重置状态
    const resetState = () => {
        setFileList([]);
        setUploading(false);
        setUploadProgress([]);
        setSelectedCategory('');
        setDuplicateModalVisible(false);
        setDuplicateCandidates([]);
        setPendingFile(null);
        setSelectedDuplicateId(null);
    };

    // 处理单个文件上传
    const uploadSingleFile = async (file: UploadFile, index: number, forceUpdate: boolean = false) => {
        const formData = new FormData();
        formData.append('file', file.originFileObj as File);
        if (selectedCategory) {
            formData.append('category', selectedCategory);
        }

        try {
            // 模拟上传进度
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => prev.map((item, i) =>
                    i === index && item.status === 'uploading'
                        ? { ...item, progress: Math.min(item.progress + 10, 90) }
                        : item
                ));
            }, 200);

            const response = await apiService.uploadResume(formData, forceUpdate);

            clearInterval(progressInterval);

            setUploadProgress(prev => prev.map((item, i) =>
                i === index
                    ? { ...item, progress: 100, status: 'success', message: '上传成功，后台解析中...' }
                    : item
            ));

            return { ...response, fileName: file.name };
        } catch (error) {
            setUploadProgress(prev => prev.map((item, i) =>
                i === index
                    ? { ...item, status: 'error', message: '上传失败' }
                    : item
            ));
            throw error;
        }
    };

    // 更新已存在候选人的简历
    const updateExistingCandidate = async (candidateId: number, file: UploadFile) => {
        const formData = new FormData();
        formData.append('file', file.originFileObj as File);
        if (selectedCategory) {
            formData.append('category', selectedCategory);
        }

        try {
            const response = await apiService.updateCandidateResume(candidateId, formData);
            return { ...response, fileName: file.name };
        } catch (error) {
            throw error;
        }
    };

    // 处理文件上传
    const handleUpload = async () => {
        if (fileList.length === 0) {
            message.warning('请选择要上传的文件');
            return;
        }

        setUploading(true);
        const progressList: UploadProgress[] = fileList.map(file => ({
            file,
            progress: 0,
            status: 'uploading'
        }));
        setUploadProgress(progressList);

        try {
            const uploadPromises = fileList.map((file, index) =>
                uploadSingleFile(file, index, false)
            );

            const results = await Promise.all(uploadPromises);

            // 显示成功消息并开始后台解析监控
            message.success(`${fileList.length} 个文件上传成功，正在后台解析中...`);

            // 开始监控解析状态
            onParsingStart?.();
            startParsingMonitoring(results);

            resetState();
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error('上传失败:', error);
            message.error('上传失败，请重试');
        } finally {
            setUploading(false);
        }
    };

    // 处理重复确认 - 创建新记录
    const handleCreateNew = async () => {
        if (!pendingFile) return;

        setDuplicateModalVisible(false);
        setUploading(true);

        const progressList: UploadProgress[] = [{
            file: pendingFile,
            progress: 0,
            status: 'uploading'
        }];
        setUploadProgress(progressList);

        try {
            const result = await uploadSingleFile(pendingFile, 0, true);

            message.success('文件上传成功，正在后台解析中...');
            onParsingStart?.();
            startParsingMonitoring([result]);

            resetState();
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error('上传失败:', error);
            message.error('上传失败，请重试');
        } finally {
            setUploading(false);
        }
    };

    // 处理重复确认 - 更新已存在的候选人
    const handleUpdateExisting = async () => {
        if (!pendingFile || !selectedDuplicateId) {
            message.warning('请选择要更新的候选人');
            return;
        }

        setDuplicateModalVisible(false);
        setUploading(true);

        try {
            const result = await updateExistingCandidate(selectedDuplicateId, pendingFile);

            message.success('简历更新成功，正在后台解析中...');
            onParsingStart?.();
            startParsingMonitoring([result]);

            resetState();
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error('更新失败:', error);
            message.error('更新失败，请重试');
        } finally {
            setUploading(false);
        }
    };

    // 开始监控解析状态
    const startParsingMonitoring = (uploadResults: any[]) => {
        const taskIds = uploadResults.map(result => result.task_id);
        const fileNames = uploadResults.map(result => result.fileName || '未知文件');
        const totalFiles = taskIds.length;
        let processedFiles = 0;
        const completedCandidates: { id: string; name: string; fileName: string }[] = [];
        const duplicateCandidates: { taskId: string; fileName: string; duplicateInfo: any }[] = [];
        const processedTaskIds = new Set<string>();

        // 每3秒检查一次解析状态
        const checkInterval = setInterval(async () => {
            try {
                await Promise.all(
                    taskIds.map(async (taskId, index) => {
                        // 跳过已处理的任务
                        if (processedTaskIds.has(taskId)) return;

                        try {
                            const task = await apiService.getTaskStatus(taskId);
                            if (!task) return;

                            // 处理不同状态
                            if (task.status === 'completed') {
                                processedTaskIds.add(taskId);
                                processedFiles++;

                                // 获取候选人信息
                                const candidate = await apiService.getCandidate(taskId);
                                if (candidate) {
                                    completedCandidates.push({
                                        id: taskId,
                                        name: candidate.name || '未知候选人',
                                        fileName: fileNames[index]
                                    });
                                    showParsingCompleteNotification({
                                        id: taskId,
                                        name: candidate.name || '未知候选人',
                                        fileName: fileNames[index]
                                    });
                                }
                            } else if (task.status === 'duplicate') {
                                processedTaskIds.add(taskId);
                                processedFiles++;

                                // 解析重复信息
                                const duplicateInfo = task.error ? apiService.parseDuplicateInfo(task.error) : null;
                                if (duplicateInfo) {
                                    duplicateCandidates.push({
                                        taskId,
                                        fileName: fileNames[index],
                                        duplicateInfo
                                    });

                                    // 显示重复候选人通知
                                    notification.warning({
                                        message: '发现重复候选人',
                                        description: (
                                            <div>
                                                <p>文件 <strong>{fileNames[index]}</strong> 与已存在的候选人 <strong>{duplicateInfo.candidate_name}</strong> 重复</p>
                                                <p style={{ fontSize: 12, color: '#666' }}>
                                                    {duplicateInfo.candidate_phone && `电话: ${duplicateInfo.candidate_phone}`}
                                                    {duplicateInfo.candidate_email && ` | 邮箱: ${duplicateInfo.candidate_email}`}
                                                </p>
                                            </div>
                                        ),
                                        duration: 10,
                                        placement: 'topRight'
                                    });
                                }
                            } else if (task.status === 'failed') {
                                processedTaskIds.add(taskId);
                                processedFiles++;

                                notification.error({
                                    message: '解析失败',
                                    description: `文件 ${fileNames[index]} 解析失败: ${task.error || '未知错误'}`,
                                    duration: 10,
                                    placement: 'topRight'
                                });
                            }
                        } catch (error) {
                            console.warn(`检查任务 ${taskId} 状态失败:`, error);
                        }
                    })
                );

                // 如果所有文件都处理完成，停止监控
                if (processedFiles === totalFiles) {
                    clearInterval(checkInterval);

                    const successCount = completedCandidates.length;
                    const duplicateCount = duplicateCandidates.length;
                    const failedCount = totalFiles - successCount - duplicateCount;

                    // 显示汇总通知
                    if (successCount > 0 || duplicateCount > 0) {
                        notification.info({
                            message: '简历处理完成',
                            description: (
                                <div>
                                    <p>
                                        成功: {successCount} 个
                                        {duplicateCount > 0 && <span style={{ color: '#faad14' }}> | 重复: {duplicateCount} 个</span>}
                                        {failedCount > 0 && <span style={{ color: '#ff4d4f' }}> | 失败: {failedCount} 个</span>}
                                    </p>
                                    <Button
                                        type="link"
                                        size="small"
                                        icon={<EyeOutlined />}
                                        onClick={() => navigate('/candidates')}
                                        style={{ padding: 0 }}
                                    >
                                        查看候选人列表
                                    </Button>
                                </div>
                            ),
                            duration: 10,
                            placement: 'topRight'
                        });
                    }

                    // 尝试显示浏览器通知
                    if (successCount > 0) {
                        showBrowserNotification(
                            '简历处理完成',
                            `成功添加 ${successCount} 个候选人${duplicateCount > 0 ? `，${duplicateCount} 个重复` : ''}`
                        );
                    }

                    // 静默刷新候选人列表
                    onSuccess?.();
                    onParsingComplete?.();
                }
            } catch (error) {
                console.error('监控解析状态失败:', error);
            }
        }, 3000);

        // 30分钟后停止监控
        setTimeout(() => {
            clearInterval(checkInterval);
            if (processedFiles < totalFiles) {
                notification.warning({
                    message: '解析超时',
                    description: `已处理 ${processedFiles}/${totalFiles} 个文件`,
                    duration: 10
                });
            }
        }, 30 * 60 * 1000);
    };

    // 显示单个解析完成的通知
    const showParsingCompleteNotification = (candidate: { id: string; name: string; fileName: string }) => {
        // 添加到通知中心
        addNotification({
            type: 'success',
            title: '简历解析成功',
            message: `${candidate.fileName} 解析完成，候选人：${candidate.name}`,
            candidateId: candidate.id,
            candidateName: candidate.name
        });

        // 同时显示弹出通知
        notification.success({
            message: '简历解析成功',
            description: (
                <div>
                    <p style={{ marginBottom: 8 }}>
                        <strong>{candidate.fileName}</strong> 解析完成
                    </p>
                    <p style={{ marginBottom: 8, color: 'var(--text-secondary)' }}>
                        候选人：{candidate.name}
                    </p>
                    <Button
                        type="primary"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => navigate(`/candidates/${candidate.id}`)}
                    >
                        查看详情
                    </Button>
                </div>
            ),
            duration: 8,
            placement: 'topRight'
        });
    };

    // 显示浏览器通知
    const showBrowserNotification = (title: string, body: string) => {
        if ('Notification' in window) {
            if (Notification.permission === 'granted') {
                new window.Notification(title, {
                    body,
                    icon: '/favicon.ico',
                    tag: 'resume-parsing'
                });
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        new window.Notification(title, {
                            body,
                            icon: '/favicon.ico',
                            tag: 'resume-parsing'
                        });
                    }
                });
            }
        }
    };

    // 处理文件选择
    const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
        setFileList(newFileList);
    };

    // 处理文件移除
    const handleRemove = (file: UploadFile) => {
        setFileList(prev => prev.filter(item => item.uid !== file.uid));
        setUploadProgress(prev => prev.filter(item => item.file.uid !== file.uid));
    };

    // 自定义上传组件
    const customRequest = ({ onSuccess }: any) => {
        // 这里不执行实际上传，由handleUpload统一处理
        setTimeout(() => {
            onSuccess();
        }, 100);
    };

    // 文件验证
    const beforeUpload = (file: File) => {
        const isValidType = file.type === 'application/pdf' ||
            file.type === 'application/msword' ||
            file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            file.type === 'text/plain';

        if (!isValidType) {
            message.error('只支持 PDF、Word 和 TXT 格式的文件！');
            return false;
        }

        const isLt10M = file.size / 1024 / 1024 < 10;
        if (!isLt10M) {
            message.error('文件大小不能超过 10MB！');
            return false;
        }

        return false; // 阻止自动上传
    };

    // 重复候选人表格列
    const duplicateColumns = [
        {
            title: '选择',
            key: 'select',
            width: 60,
            render: (_: any, record: DuplicateCandidate) => (
                <input
                    type="radio"
                    name="duplicate"
                    checked={selectedDuplicateId === record.id}
                    onChange={() => setSelectedDuplicateId(record.id)}
                />
            )
        },
        {
            title: '姓名',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: '电话',
            dataIndex: 'phone',
            key: 'phone',
            render: (phone: string) => phone || '-'
        },
        {
            title: '邮箱',
            dataIndex: 'email',
            key: 'email',
            render: (email: string) => email || '-'
        },
        {
            title: '职位',
            dataIndex: 'position',
            key: 'position',
            render: (position: string) => position || '-'
        },
        {
            title: '更新时间',
            dataIndex: 'updated_at',
            key: 'updated_at',
            render: (date: string) => date ? new Date(date).toLocaleString('zh-CN') : '-'
        }
    ];

    return (
        <>
            <Modal
                title={
                    <Space>
                        <FileTextOutlined style={{ color: 'var(--primary-color)' }} />
                        <span>上传简历</span>
                    </Space>
                }
                open={visible}
                onCancel={onClose}
                width="90%"
                style={{ maxWidth: '800px' }}
                footer={[
                    <Button key="cancel" onClick={onClose} disabled={uploading}>
                        取消
                    </Button>,
                    <Button
                        key="upload"
                        type="primary"
                        icon={<UploadOutlined />}
                        onClick={handleUpload}
                        loading={uploading}
                        disabled={fileList.length === 0}
                    >
                        {uploading ? '上传中...' : '开始上传'}
                    </Button>
                ]}
                destroyOnHidden
                afterClose={resetState}
            >
                <div style={{ padding: '16px 0' }}>
                    {/* 职位分类选择 */}
                    <Card size="small" style={{ marginBottom: '16px' }}>
                        <Row align="middle" gutter={16}>
                            <Col>
                                <Text strong>职位分类：</Text>
                            </Col>
                            <Col flex="auto">
                                <Select
                                    placeholder="选择职位分类（可选，不选则由系统自动分类）"
                                    style={{ width: '100%' }}
                                    value={selectedCategory || undefined}
                                    onChange={(val) => setSelectedCategory(val || '')}
                                    allowClear
                                    size="middle"
                                >
                                    {getPositionCategories().map((cat: { id: string; name: string; color: string }) => (
                                        <Option key={cat.id} value={cat.name}>
                                            <span style={{ color: cat.color }}>{cat.name}</span>
                                        </Option>
                                    ))}
                                </Select>
                            </Col>
                        </Row>
                    </Card>

                    {/* 上传说明 - 可收起 */}
                    <Collapse
                        ghost
                        defaultActiveKey={[]}
                        style={{ marginBottom: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}
                        items={[
                            {
                                key: '1',
                                label: (
                                    <Space>
                                        <InfoCircleOutlined style={{ color: 'var(--primary-color)' }} />
                                        <span style={{ color: 'var(--text-secondary)' }}>上传说明</span>
                                    </Space>
                                ),
                                children: (
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                                        <p style={{ marginBottom: '4px' }}>• 支持 PDF、Word (.doc/.docx) 和 TXT 格式</p>
                                        <p style={{ marginBottom: '4px' }}>• 单个文件大小不超过 10MB</p>
                                        <p style={{ marginBottom: '4px' }}>• 支持批量上传多个文件</p>
                                        <p style={{ marginBottom: '4px' }}>• 文件上传后将在后台自动解析</p>
                                        <p style={{ marginBottom: '4px' }}>• 如果候选人已存在，可选择更新简历</p>
                                        <p style={{ marginBottom: 0 }}>• 解析完成后会通过通知提醒您</p>
                                    </div>
                                )
                            }
                        ]}
                    />

                    {/* 文件上传区域 */}
                    <Card size="small" style={{ marginBottom: '16px' }} styles={{ body: { padding: '8px' } }}>
                        <Dragger
                            name="files"
                            multiple
                            fileList={fileList}
                            onChange={handleChange}
                            customRequest={customRequest}
                            beforeUpload={beforeUpload}
                            showUploadList={false}
                            disabled={uploading}
                            style={{ padding: '16px 0' }}
                        >
                            <p className="ant-upload-drag-icon" style={{ marginBottom: '8px' }}>
                                <InboxOutlined style={{ fontSize: '24px', color: 'var(--primary-color)' }} />
                            </p>
                            <p className="ant-upload-text" style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>
                                点击或拖拽文件到此区域上传
                            </p>
                            <p className="ant-upload-hint" style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: 0 }}>
                                支持 PDF、Word、TXT 格式，可批量上传
                            </p>
                        </Dragger>
                    </Card>

                    {/* 文件列表 */}
                    {fileList.length > 0 && (
                        <Card title={`已选择文件 (${fileList.length})`} size="small">
                            <Space direction="vertical" style={{ width: '100%' }}>
                                {fileList.map((file) => {
                                    const progress = uploadProgress.find(p => p.file.uid === file.uid);
                                    return (
                                        <div
                                            key={file.uid}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                padding: '8px',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '6px',
                                                backgroundColor: 'var(--bg-primary)'
                                            }}
                                        >
                                            <FileTextOutlined style={{ marginRight: '8px', color: 'var(--primary-color)' }} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                                                    {file.name}
                                                </div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                    {(file.size! / 1024 / 1024).toFixed(2)} MB
                                                </div>
                                                {progress && (
                                                    <Progress
                                                        percent={progress.progress}
                                                        size="small"
                                                        status={progress.status === 'error' ? 'exception' : 'active'}
                                                        style={{ marginTop: '4px' }}
                                                    />
                                                )}
                                                {progress?.message && (
                                                    <div style={{
                                                        fontSize: '12px',
                                                        color: progress.status === 'success' ? 'var(--success-color)' : 'var(--error-color)',
                                                        marginTop: '4px'
                                                    }}>
                                                        {progress.status === 'success' && <CheckCircleOutlined />}
                                                        {progress.status === 'error' && <CloseCircleOutlined />}
                                                        {' '}{progress.message}
                                                    </div>
                                                )}
                                            </div>
                                            {!uploading && (
                                                <Button
                                                    type="text"
                                                    danger
                                                    icon={<DeleteOutlined />}
                                                    onClick={() => handleRemove(file)}
                                                    size="small"
                                                />
                                            )}
                                        </div>
                                    );
                                })}
                            </Space>
                        </Card>
                    )}

                    {/* 上传进度总览 */}
                    {uploading && uploadProgress.length > 0 && (
                        <Card title="上传进度" size="small" style={{ marginTop: '16px' }}>
                            <Space direction="vertical" style={{ width: '100%' }}>
                                {uploadProgress.map((progress, index) => (
                                    <div key={index} style={{ marginBottom: '8px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                            <Text strong>{progress.file.name}</Text>
                                            <Text>{progress.progress}%</Text>
                                        </div>
                                        <Progress
                                            percent={progress.progress}
                                            status={progress.status === 'error' ? 'exception' : 'active'}
                                        />
                                    </div>
                                ))}
                            </Space>
                        </Card>
                    )}
                </div>
            </Modal>

            {/* 重复候选人确认对话框 */}
            <Modal
                title={
                    <Space>
                        <ExclamationCircleOutlined style={{ color: '#faad14' }} />
                        <span>发现重复候选人</span>
                    </Space>
                }
                open={duplicateModalVisible}
                onCancel={() => {
                    setDuplicateModalVisible(false);
                    setPendingFile(null);
                    setSelectedDuplicateId(null);
                }}
                width={700}
                footer={[
                    <Button
                        key="cancel"
                        onClick={() => {
                            setDuplicateModalVisible(false);
                            setPendingFile(null);
                            setSelectedDuplicateId(null);
                        }}
                    >
                        取消
                    </Button>,
                    <Button
                        key="create"
                        onClick={handleCreateNew}
                    >
                        创建新记录
                    </Button>,
                    <Button
                        key="update"
                        type="primary"
                        onClick={handleUpdateExisting}
                        disabled={!selectedDuplicateId}
                    >
                        更新选中的候选人
                    </Button>
                ]}
            >
                <Alert
                    message="系统检测到以下候选人可能与当前上传的简历重复"
                    description="请选择要执行的操作：更新已存在候选人的简历，或创建新的候选人记录。"
                    type="warning"
                    showIcon
                    style={{ marginBottom: '16px' }}
                />

                <Table
                    columns={duplicateColumns}
                    dataSource={duplicateCandidates}
                    rowKey="id"
                    pagination={false}
                    size="small"
                />
            </Modal>
        </>
    );
};

export default UploadResumeModal;
