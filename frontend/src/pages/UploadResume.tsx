import React, { useState } from 'react';

// API配置函数
const getApiBaseUrl = (): string => {
    if (process.env.NODE_ENV === 'production') {
        return `${window.location.protocol}//${window.location.hostname}:8001/api/v1`;
    } else {
        return 'http://localhost:8001/api/v1';
    }
};

const getUploadUrl = (): string => {
    return `${getApiBaseUrl()}/upload/`;
};

const getTaskStatusUrl = (taskId: string): string => {
    return `${getApiBaseUrl()}/tasks/${taskId}`;
};

const getFileDownloadUrl = (taskId: string): string => {
    return `${getApiBaseUrl()}/upload/download/${taskId}`;
};
import {
    Upload,
    message,
    Card,
    Progress,
    List,
    Tag,
    Typography,
    Empty,
    Button
} from 'antd';
import {
    InboxOutlined,
    FileTextOutlined,
    CheckCircleOutlined,
    ExclamationCircleOutlined,
    ClockCircleOutlined
} from '@ant-design/icons';
import type { UploadProps, UploadFile } from 'antd';

// 简化的布局样式
const layoutStyles = {
    container: {
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column' as const,
        overflow: 'hidden',
        padding: '16px',
        boxSizing: 'border-box' as const
    },
    header: {
        flex: '0 0 auto',
        marginBottom: '16px'
    },
    mainContent: {
        flex: '1 1 auto',
        display: 'flex',
        gap: '16px',
        overflow: 'hidden',
        minHeight: 0
    },
    leftPanel: {
        flex: '0 0 25%',
        minWidth: '250px',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '12px'
    },
    rightPanel: {
        flex: '1 1 auto',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '12px'
    }
};

const { Dragger } = Upload;
const { Title, Text } = Typography;

interface UploadTask {
    id: string;
    fileName: string;
    status: 'uploading' | 'parsing' | 'completed' | 'failed' | 'error';
    progress: number;
    result?: any;
    error?: string;
    fileObject?: File; // 原始文件对象，用于本地预览
}

const UploadResume: React.FC = () => {
    const [uploadTasks, setUploadTasks] = useState<UploadTask[]>([]);
    const [uploading, setUploading] = useState(false);
    const [selectedTask, setSelectedTask] = useState<UploadTask | null>(null);

    const uploadProps: UploadProps = {
        name: 'file',
        multiple: true,
        accept: '.pdf,.doc,.docx,.jpg,.jpeg,.png',
        beforeUpload: (file) => {
            const isValidType = ['application/pdf', 'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'image/jpeg', 'image/jpg', 'image/png'].includes(file.type);

            if (!isValidType) {
                message.error('只支持 PDF、Word 文档和图片格式！');
                return false;
            }

            const isLt10M = file.size / 1024 / 1024 < 10;
            if (!isLt10M) {
                message.error('文件大小不能超过 10MB！');
                return false;
            }

            return false; // 阻止自动上传
        },
        onChange: (info) => {
            if (info.fileList.length > 0) {
                handleUpload(info.fileList);
            }
        },
    };

    const handleUpload = async (fileList: UploadFile[]) => {
        setUploading(true);

        for (const file of fileList) {
            if (file.originFileObj) {
                const taskId = Date.now().toString() + Math.random().toString(36).substr(2, 9);

                // 添加上传任务
                const newTask: UploadTask = {
                    id: taskId,
                    fileName: file.name,
                    status: 'uploading',
                    progress: 0,
                    fileObject: file.originFileObj, // 保存原始文件对象用于预览
                };

                setUploadTasks(prev => {
                    const updatedTasks = [...prev, newTask];
                    // 自动选中新添加的文件进行预览
                    setSelectedTask(newTask);
                    return updatedTasks;
                });

                // 模拟上传和解析过程
                await simulateUploadAndParse(taskId, file.originFileObj);
            }
        }

        setUploading(false);
    };

    const uploadToBackend = async (file: File): Promise<any> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(getUploadUrl(), {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || '上传失败');
        }

        return await response.json();
    };

    const checkTaskStatus = async (taskId: string): Promise<any> => {
        const response = await fetch(getTaskStatusUrl(taskId));

        if (!response.ok) {
            throw new Error('获取任务状态失败');
        }

        return await response.json();
    };

    const simulateUploadAndParse = async (taskId: string, file: File) => {
        try {
            // 上传文件到后端
            setUploadTasks(prev =>
                prev.map(task =>
                    task.id === taskId
                        ? { ...task, status: 'uploading', progress: 10 }
                        : task
                )
            );

            // 更新选中任务状态
            setSelectedTask(prev => prev && prev.id === taskId ? { ...prev, status: 'uploading', progress: 10 } : prev);

            const uploadResult = await uploadToBackend(file);
            const backendTaskId = uploadResult.task_id;

            // 更新任务ID为后端返回的ID，但保留fileObject
            setUploadTasks(prev =>
                prev.map(task =>
                    task.id === taskId
                        ? { ...task, id: backendTaskId, status: 'parsing', progress: 30 }
                        : task
                )
            );

            // 更新选中任务状态
            setSelectedTask(prev => prev && prev.id === taskId ? { ...prev, id: backendTaskId, status: 'parsing', progress: 30 } : prev);

            // 轮询检查任务状态
            const pollStatus = async () => {
                try {
                    const statusResult = await checkTaskStatus(backendTaskId);

                    setUploadTasks(prev =>
                        prev.map(task =>
                            task.id === backendTaskId
                                ? {
                                    ...task,
                                    status: statusResult.status,
                                    progress: statusResult.progress || 0,
                                    result: statusResult.result,
                                    error: statusResult.error
                                    // fileObject 会自动保留
                                }
                                : task
                        )
                    );

                    // 更新选中任务的状态（如果当前选中的是这个任务）
                    setSelectedTask(prev => {
                        if (prev && (prev.id === backendTaskId || prev.id === taskId)) {
                            return {
                                ...prev,
                                id: backendTaskId,
                                status: statusResult.status,
                                progress: statusResult.progress || 0,
                                result: statusResult.result,
                                error: statusResult.error
                            };
                        }
                        return prev;
                    });

                    if (statusResult.status === 'completed') {
                        message.success(`${file.name} 解析成功！`);
                        return;
                    } else if (statusResult.status === 'failed') {
                        message.error(`${file.name} 解析失败: ${statusResult.error}`);
                        return;
                    } else if (statusResult.status === 'parsing') {
                        // 解析中状态，显示进度提示
                        message.loading(`${file.name} 正在解析中...`, 1);
                    } else if (statusResult.status === 'uploaded' || statusResult.status === 'parsing') {
                        // 继续轮询，缩短轮询间隔
                        setTimeout(pollStatus, 1500);
                    } else {
                        // 其他状态也继续轮询
                        setTimeout(pollStatus, 1500);
                    }
                } catch (error) {
                    console.error('检查任务状态失败:', error);
                    setUploadTasks(prev =>
                        prev.map(task =>
                            task.id === backendTaskId
                                ? {
                                    ...task,
                                    status: 'error',
                                    error: '检查任务状态失败'
                                    // fileObject 会自动保留
                                }
                                : task
                        )
                    );

                    // 更新选中任务的状态
                    setSelectedTask(prev => {
                        if (prev && (prev.id === backendTaskId || prev.id === taskId)) {
                            return {
                                ...prev,
                                status: 'error',
                                error: '检查任务状态失败'
                            };
                        }
                        return prev;
                    });

                    message.error(`${file.name} 解析失败！`);
                }
            };

            // 开始轮询，缩短初始延迟
            setTimeout(pollStatus, 500);

        } catch (error) {
            console.error('上传失败:', error);
            setUploadTasks(prev =>
                prev.map(task =>
                    task.id === taskId
                        ? {
                            ...task,
                            status: 'error',
                            error: error instanceof Error ? error.message : '上传失败'
                        }
                        : task
                )
            );

            setSelectedTask(prev => prev && prev.id === taskId ? {
                ...prev,
                status: 'error',
                error: error instanceof Error ? error.message : '上传失败'
            } : prev);

            message.error(`${file.name} 上传失败！`);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'uploading':
                return <ClockCircleOutlined style={{ color: '#1890ff' }} />;
            case 'parsing':
                return <ClockCircleOutlined style={{ color: '#faad14' }} />;
            case 'completed':
                return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
            case 'failed':
            case 'error':
                return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
            default:
                return <FileTextOutlined style={{ color: '#d9d9d9' }} />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'uploading':
                return 'processing';
            case 'parsing':
                return 'warning';
            case 'completed':
                return 'success';
            case 'failed':
            case 'error':
                return 'error';
            default:
                return 'default';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'uploading':
                return '上传中';
            case 'parsing':
                return '解析中';
            case 'completed':
                return '已完成';
            case 'failed':
                return '解析失败';
            case 'error':
                return '上传失败';
            default:
                return '未知状态';
        }
    };

    // 简历文件预览组件
    const ResumePreview: React.FC<{ task: UploadTask }> = ({ task }) => {
        // 清理URL对象，避免内存泄漏
        React.useEffect(() => {
            return () => {
                if (task.fileObject) {
                    URL.revokeObjectURL(URL.createObjectURL(task.fileObject));
                }
            };
        }, [task.fileObject]);

        const getFileType = (fileName: string) => {
            const extension = fileName.split('.').pop()?.toLowerCase();
            return extension;
        };

        const getFileIcon = (fileName: string) => {
            const fileType = getFileType(fileName);
            switch (fileType) {
                case 'pdf':
                    return <FileTextOutlined style={{ fontSize: '24px', color: '#ff4d4f' }} />;
                case 'doc':
                case 'docx':
                    return <FileTextOutlined style={{ fontSize: '24px', color: '#1890ff' }} />;
                case 'jpg':
                case 'jpeg':
                case 'png':
                    return <FileTextOutlined style={{ fontSize: '24px', color: '#52c41a' }} />;
                default:
                    return <FileTextOutlined style={{ fontSize: '24px', color: '#d9d9d9' }} />;
            }
        };

        const renderFilePreview = () => {
            const fileType = getFileType(task.fileName);

            // 如果有本地文件对象，优先使用本地预览
            if (task.fileObject) {
                const fileUrl = URL.createObjectURL(task.fileObject);

                switch (fileType) {
                    case 'pdf':
                        return (
                            <div style={{ height: '100%', width: '100%', minHeight: '500px' }}>
                                <iframe
                                    src={fileUrl}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        minHeight: '500px',
                                        border: 'none',
                                        borderRadius: '6px'
                                    }}
                                    title={`PDF预览 - ${task.fileName}`}
                                />
                            </div>
                        );

                    case 'jpg':
                    case 'jpeg':
                    case 'png':
                        return (
                            <div style={{
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#f5f5f5',
                                borderRadius: '6px'
                            }}>
                                <img
                                    src={fileUrl}
                                    alt={`图片预览 - ${task.fileName}`}
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '100%',
                                        objectFit: 'contain'
                                    }}
                                />
                            </div>
                        );

                    case 'doc':
                    case 'docx':
                        return (
                            <div style={{
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#f5f5f5',
                                borderRadius: '6px'
                            }}>
                                <div style={{ textAlign: 'center' }}>
                                    {getFileIcon(task.fileName)}
                                    <div style={{ marginTop: '16px' }}>
                                        <Title level={4}>Word文档预览</Title>
                                        <Text type="secondary">Word文档暂不支持在线预览</Text>
                                    </div>
                                </div>
                            </div>
                        );
                }
            }

            // 如果没有本地文件对象，尝试从服务器获取（用于已上传完成的文件）
            if (task.status === 'completed') {
                switch (fileType) {
                    case 'pdf':
                        return (
                            <div style={{ height: '100%', width: '100%', minHeight: '500px' }}>
                                <iframe
                                    src={getFileDownloadUrl(task.id)}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        minHeight: '500px',
                                        border: 'none',
                                        borderRadius: '6px'
                                    }}
                                    title={`PDF预览 - ${task.fileName}`}
                                />
                            </div>
                        );

                    case 'jpg':
                    case 'jpeg':
                    case 'png':
                        return (
                            <div style={{
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#f5f5f5',
                                borderRadius: '6px'
                            }}>
                                <img
                                    src={getFileDownloadUrl(task.id)}
                                    alt={`图片预览 - ${task.fileName}`}
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '100%',
                                        objectFit: 'contain'
                                    }}
                                />
                            </div>
                        );
                }
            }

            // 默认显示不支持预览
            return (
                <div style={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '6px'
                }}>
                    <div style={{ textAlign: 'center' }}>
                        {getFileIcon(task.fileName)}
                        <div style={{ marginTop: '16px' }}>
                            <Title level={4}>文件预览</Title>
                            <Text type="secondary">正在处理文件，请稍候...</Text>
                        </div>
                    </div>
                </div>
            );
        };

        return (
            <div style={{ padding: '4px', height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* 文件信息 - 简化显示 */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px',
                    marginBottom: '8px',
                    flex: '0 0 auto'
                }}>
                    {getFileIcon(task.fileName)}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <Text
                            strong
                            style={{
                                fontSize: '14px',
                                color: 'var(--text-primary)'
                            }}
                            title={task.fileName}
                        >
                            {task.fileName}
                        </Text>
                    </div>
                    <Tag color={getStatusColor(task.status)} style={{ fontSize: '10px' }}>
                        {getStatusText(task.status)}
                    </Tag>
                </div>

                {/* 文件预览 - 占据剩余空间 */}
                <div style={{ flex: '1 1 auto', overflow: 'auto' }}>
                    {renderFilePreview()}
                </div>
            </div>
        );
    };

    return (
        <div style={{
            ...layoutStyles.container,
            backgroundColor: 'var(--bg-secondary)'
        }}>
            {/* 页面标题 */}
            <div style={layoutStyles.header}>
                <Title level={2} style={{ margin: 0, color: 'var(--text-primary)' }}>JianLi Tanuki (简狸) - 简历上传与解析</Title>
            </div>

            {/* 主要内容区域 - 两列布局 */}
            <div style={layoutStyles.mainContent}>
                {/* 左侧：上传和控制区域 */}
                <div style={layoutStyles.leftPanel}>
                    {/* 文件上传区域 */}
                    <Card title="上传简历文件" size="small" style={{ flex: '0 0 auto' }}>
                        <Dragger {...uploadProps} disabled={uploading} style={{ minHeight: '120px' }}>
                            <p className="ant-upload-drag-icon">
                                <InboxOutlined style={{ fontSize: '32px', color: 'var(--primary-color)' }} />
                            </p>
                            <p className="ant-upload-text" style={{ fontSize: '16px', color: 'var(--text-primary)' }}>点击或拖拽文件上传</p>
                            <p className="ant-upload-hint" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                                支持 PDF、Word、图片格式，最大 10MB
                            </p>
                        </Dragger>
                    </Card>

                    {/* 当前文件信息 */}
                    {selectedTask && (
                        <Card title="当前文件" size="small" style={{ flex: '0 0 auto' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {getStatusIcon(selectedTask.status)}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <Text strong style={{ fontSize: '14px', display: 'block', color: 'var(--text-primary)' }} title={selectedTask.fileName}>
                                        {selectedTask.fileName}
                                    </Text>
                                    <Tag color={getStatusColor(selectedTask.status)} style={{ marginTop: '4px' }}>
                                        {getStatusText(selectedTask.status)}
                                    </Tag>
                                </div>
                            </div>

                            {/* 进度条 */}
                            {(selectedTask.status === 'uploading' || selectedTask.status === 'parsing') && (
                                <div style={{ marginTop: '12px' }}>
                                    <Progress
                                        percent={selectedTask.progress}
                                        status={selectedTask.status === 'parsing' ? 'active' : 'normal'}
                                        showInfo={true}
                                    />
                                </div>
                            )}


                            {selectedTask.status === 'error' && (
                                <div style={{ marginTop: '12px' }}>
                                    <Button
                                        danger
                                        size="small"
                                        icon={<ExclamationCircleOutlined />}
                                        onClick={() => {
                                            console.log('重新上传', selectedTask);
                                        }}
                                    >
                                        重新上传
                                    </Button>
                                </div>
                            )}
                        </Card>
                    )}

                    {/* 上传历史 */}
                    {uploadTasks.length > 1 && (
                        <Card title="上传历史" size="small" style={{ flex: '1 1 auto', overflow: 'hidden' }}>
                            <div style={{ height: 'calc(100% - 57px)', overflow: 'auto' }}>
                                <List
                                    size="small"
                                    dataSource={uploadTasks.slice(0, 5)}
                                    renderItem={(task) => (
                                        <List.Item
                                            style={{
                                                cursor: 'pointer',
                                                backgroundColor: selectedTask?.id === task.id ? 'var(--primary-color-light)' : 'transparent',
                                                borderRadius: '4px',
                                                padding: '8px'
                                            }}
                                            onClick={() => setSelectedTask(task)}
                                        >
                                            <List.Item.Meta
                                                avatar={getStatusIcon(task.status)}
                                                title={
                                                    <Text
                                                        style={{
                                                            fontSize: '12px',
                                                            maxWidth: '150px',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                            display: 'block',
                                                            color: 'var(--text-primary)'
                                                        }}
                                                        title={task.fileName}
                                                    >
                                                        {task.fileName}
                                                    </Text>
                                                }
                                                description={
                                                    <Tag color={getStatusColor(task.status)} style={{ fontSize: '10px' }}>
                                                        {getStatusText(task.status)}
                                                    </Tag>
                                                }
                                            />
                                        </List.Item>
                                    )}
                                />
                            </div>
                        </Card>
                    )}
                </div>

                {/* 右侧：预览和结果区域 */}
                <div style={layoutStyles.rightPanel}>
                    {/* 文件预览 */}
                    <Card
                        title="文件预览"
                        size="small"
                        style={{ flex: '1 1 auto', overflow: 'hidden', minHeight: '80vh' }}
                        styles={{ body: { padding: 0, height: 'calc(100% - 57px)', overflow: 'auto' } }}
                    >
                        {selectedTask ? (
                            <ResumePreview task={selectedTask} />
                        ) : (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '100%',
                                flexDirection: 'column'
                            }}>
                                <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description={
                                        <div>
                                            <Text type="secondary" style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>请上传简历文件</Text>
                                            <br />
                                            <Text type="secondary" style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>
                                                上传后即可预览内容和解析结果
                                            </Text>
                                        </div>
                                    }
                                />
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default UploadResume;