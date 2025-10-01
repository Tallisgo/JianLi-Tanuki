import React, { useState } from 'react';
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
        flex: '0 0 40%',
        minWidth: '350px',
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

        const response = await fetch('http://localhost:8001/api/v1/upload/', {
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
        const response = await fetch(`http://localhost:8001/api/v1/tasks/${taskId}`);

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
                        ? { ...task, status: 'uploading', progress: 0 }
                        : task
                )
            );

            const uploadResult = await uploadToBackend(file);
            const backendTaskId = uploadResult.task_id;

            // 更新任务ID为后端返回的ID，但保留fileObject
            setUploadTasks(prev =>
                prev.map(task =>
                    task.id === taskId
                        ? { ...task, id: backendTaskId, status: 'parsing', progress: 0 }
                        : task
                )
            );

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

                    if (statusResult.status === 'completed') {
                        message.success(`${file.name} 解析成功！`);
                        return;
                    } else if (statusResult.status === 'failed') {
                        message.error(`${file.name} 解析失败: ${statusResult.error}`);
                        return;
                    } else if (statusResult.status === 'uploaded' || statusResult.status === 'parsing') {
                        // 继续轮询
                        setTimeout(pollStatus, 2000);
                    } else {
                        // 其他状态也继续轮询
                        setTimeout(pollStatus, 2000);
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
                    message.error(`${file.name} 解析失败！`);
                }
            };

            // 开始轮询
            setTimeout(pollStatus, 1000);

        } catch (error) {
            console.error('上传失败:', error);
            setUploadTasks(prev =>
                prev.map(task =>
                    task.id === taskId
                        ? {
                            ...task,
                            status: 'error',
                            error: error instanceof Error ? error.message : '上传失败'
                            // fileObject 会自动保留
                        }
                        : task
                )
            );
            message.error(`${file.name} 上传失败！`);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'uploading':
            case 'parsing':
                return <ClockCircleOutlined style={{ color: '#1890ff' }} />;
            case 'success':
                return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
            case 'error':
                return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
            default:
                return <FileTextOutlined />;
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'uploading':
                return '上传中';
            case 'uploaded':
                return '已上传';
            case 'parsing':
                return '解析中';
            case 'completed':
                return '解析成功';
            case 'failed':
            case 'error':
                return '解析失败';
            default:
                return status || '未知状态';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'uploading':
            case 'uploaded':
            case 'parsing':
                return 'processing';
            case 'completed':
                return 'success';
            case 'failed':
            case 'error':
                return 'error';
            default:
                return 'default';
        }
    };


    // 简历文件预览组件
    const ResumePreview: React.FC<{ task: UploadTask }> = ({ task }) => {
        // 清理URL对象，避免内存泄漏
        React.useEffect(() => {
            return () => {
                if (task.fileObject) {
                    const fileUrl = URL.createObjectURL(task.fileObject);
                    URL.revokeObjectURL(fileUrl);
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
                    return <FileTextOutlined style={{ color: '#ff4d4f' }} />;
                case 'doc':
                case 'docx':
                    return <FileTextOutlined style={{ color: '#1890ff' }} />;
                case 'jpg':
                case 'jpeg':
                case 'png':
                    return <FileTextOutlined style={{ color: '#52c41a' }} />;
                default:
                    return <FileTextOutlined />;
            }
        };

        const renderFilePreview = () => {
            const fileType = getFileType(task.fileName);

            // 优先使用本地文件对象进行预览
            if (task.fileObject) {
                const fileUrl = URL.createObjectURL(task.fileObject);

                switch (fileType) {
                    case 'pdf':
                        return (
                            <div style={{ height: '100%', width: '100%' }}>
                                <iframe
                                    src={fileUrl}
                                    style={{
                                        width: '100%',
                                        height: '100%',
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
                                flexDirection: 'column',
                                backgroundColor: '#f5f5f5',
                                borderRadius: '6px'
                            }}>
                                <div style={{ textAlign: 'center' }}>
                                    {getFileIcon(task.fileName)}
                                    <div style={{ marginTop: '16px' }}>
                                        <Title level={4}>Word 文档</Title>
                                        <Text type="secondary">浏览器不支持直接预览 Word 文档</Text>
                                        <br />
                                        <Text type="secondary">请下载后使用 Microsoft Word 打开</Text>
                                    </div>
                                    <div style={{ marginTop: '16px' }}>
                                        <a
                                            href={fileUrl}
                                            download={task.fileName}
                                            style={{
                                                color: '#1890ff',
                                                textDecoration: 'none'
                                            }}
                                        >
                                            <FileTextOutlined /> 下载文件
                                        </a>
                                    </div>
                                </div>
                            </div>
                        );

                    default:
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
                                        <Title level={4}>不支持预览</Title>
                                        <Text type="secondary">该文件类型暂不支持在线预览</Text>
                                    </div>
                                    <div style={{ marginTop: '16px' }}>
                                        <a
                                            href={fileUrl}
                                            download={task.fileName}
                                            style={{
                                                color: '#1890ff',
                                                textDecoration: 'none'
                                            }}
                                        >
                                            <FileTextOutlined /> 下载文件
                                        </a>
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
                            <div style={{ height: '100%', width: '100%' }}>
                                <iframe
                                    src={`http://localhost:8001/api/v1/upload/download/${task.id}`}
                                    style={{
                                        width: '100%',
                                        height: '100%',
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
                                    src={`http://localhost:8001/api/v1/upload/download/${task.id}`}
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
            <div style={{ padding: '8px' }}>
                {/* 文件信息 */}
                <Card size="small" style={{ marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {getFileIcon(task.fileName)}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <Text
                                strong
                                style={{
                                    fontSize: '12px',
                                    maxWidth: '180px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    display: 'block'
                                }}
                                title={task.fileName}
                            >
                                {task.fileName}
                            </Text>
                            <Text
                                type="secondary"
                                style={{
                                    fontSize: '10px',
                                    display: 'block',
                                    marginTop: '2px'
                                }}
                            >
                                文件类型: {getFileType(task.fileName)?.toUpperCase()}
                            </Text>
                        </div>
                        <Tag color={getStatusColor(task.status)} style={{ fontSize: '9px' }}>
                            {getStatusText(task.status)}
                        </Tag>
                    </div>
                </Card>

                {/* 文件预览 */}
                <div style={{ height: '100%', overflow: 'auto' }}>
                    {renderFilePreview()}
                </div>
            </div>
        );
    };

    return (
        <div style={layoutStyles.container}>
            {/* 页面标题 */}
            <div style={layoutStyles.header}>
                <Title level={2} style={{ margin: 0 }}>简历上传与解析</Title>
            </div>

            {/* 主要内容区域 - 两列布局 */}
            <div style={layoutStyles.mainContent}>
                {/* 左侧：上传和控制区域 */}
                <div style={layoutStyles.leftPanel}>
                    {/* 文件上传区域 */}
                    <Card title="上传简历文件" size="small" style={{ flex: '0 0 auto' }}>
                        <Dragger {...uploadProps} disabled={uploading} style={{ minHeight: '120px' }}>
                            <p className="ant-upload-drag-icon">
                                <InboxOutlined style={{ fontSize: '32px' }} />
                            </p>
                            <p className="ant-upload-text" style={{ fontSize: '16px' }}>点击或拖拽文件上传</p>
                            <p className="ant-upload-hint" style={{ fontSize: '14px' }}>
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
                                    <Text strong style={{ fontSize: '14px', display: 'block' }} title={selectedTask.fileName}>
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

                            {/* 操作按钮 */}
                            {selectedTask.status === 'completed' && (
                                <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                                    <Button
                                        type="primary"
                                        size="small"
                                        icon={<FileTextOutlined />}
                                        onClick={() => {
                                            const link = document.createElement('a');
                                            link.href = `http://localhost:8001/api/v1/upload/download/${selectedTask.id}`;
                                            link.download = selectedTask.fileName;
                                            link.click();
                                        }}
                                    >
                                        下载
                                    </Button>
                                    <Button
                                        size="small"
                                        icon={<CheckCircleOutlined />}
                                        onClick={() => {
                                            console.log('查看详细信息', selectedTask);
                                        }}
                                    >
                                        详情
                                    </Button>
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
                                                backgroundColor: selectedTask?.id === task.id ? '#f0f8ff' : 'transparent',
                                                borderRadius: '4px',
                                                padding: '8px',
                                                margin: '2px 0'
                                            }}
                                            onClick={() => setSelectedTask(task)}
                                        >
                                            <List.Item.Meta
                                                avatar={getStatusIcon(task.status)}
                                                title={
                                                    <Text
                                                        style={{
                                                            fontSize: '12px',
                                                            maxWidth: '200px',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                            display: 'block'
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
                        style={{ flex: '1 1 auto', overflow: 'hidden' }}
                        bodyStyle={{ padding: 0, height: 'calc(100% - 57px)', overflow: 'auto' }}
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
                                            <Text type="secondary" style={{ fontSize: '16px' }}>请上传简历文件</Text>
                                            <br />
                                            <Text type="secondary" style={{ fontSize: '14px' }}>
                                                上传后即可预览内容和解析结果
                                            </Text>
                                        </div>
                                    }
                                />
                            </div>
                        )}
                    </Card>

                    {/* 解析结果 */}
                    {selectedTask && selectedTask.status === 'completed' && selectedTask.result && (
                        <Card
                            title="解析结果"
                            size="small"
                            style={{ flex: '0 0 300px', overflow: 'hidden' }}
                            bodyStyle={{ padding: '12px', height: 'calc(100% - 57px)', overflow: 'auto' }}
                        >
                            <div style={{ maxHeight: '100%', overflow: 'auto' }}>
                                {/* 基本信息 */}
                                <div style={{ marginBottom: '16px' }}>
                                    <Text strong style={{ fontSize: '14px' }}>基本信息</Text>
                                    <div style={{ marginTop: '8px' }}>
                                        {selectedTask.result.name && (
                                            <div style={{ marginBottom: '4px' }}>
                                                <Text style={{ fontSize: '13px' }}>姓名: {selectedTask.result.name}</Text>
                                            </div>
                                        )}
                                        {selectedTask.result.contact?.phone && (
                                            <div style={{ marginBottom: '4px' }}>
                                                <Text style={{ fontSize: '13px' }}>电话: {selectedTask.result.contact.phone}</Text>
                                            </div>
                                        )}
                                        {selectedTask.result.contact?.email && (
                                            <div style={{ marginBottom: '4px' }}>
                                                <Text style={{ fontSize: '13px' }}>邮箱: {selectedTask.result.contact.email}</Text>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 工作经历 */}
                                {selectedTask.result.experience && selectedTask.result.experience.length > 0 && (
                                    <div style={{ marginBottom: '16px' }}>
                                        <Text strong style={{ fontSize: '14px' }}>工作经历</Text>
                                        <div style={{ marginTop: '8px' }}>
                                            {selectedTask.result.experience.slice(0, 2).map((exp: any, index: number) => (
                                                <div key={index} style={{ marginBottom: '8px', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                                                    <Text strong style={{ fontSize: '13px' }}>{exp.title}</Text>
                                                    <br />
                                                    <Text style={{ fontSize: '12px' }}>{exp.company}</Text>
                                                    <br />
                                                    <Text type="secondary" style={{ fontSize: '11px' }}>
                                                        {exp.start_date} - {exp.end_date || '至今'}
                                                    </Text>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* 技能标签 */}
                                {selectedTask.result.skills && selectedTask.result.skills.length > 0 && (
                                    <div style={{ marginBottom: '16px' }}>
                                        <Text strong style={{ fontSize: '14px' }}>技能标签</Text>
                                        <div style={{ marginTop: '8px' }}>
                                            {selectedTask.result.skills.slice(0, 8).map((skill: string, index: number) => (
                                                <Tag key={index} style={{ marginBottom: '4px', fontSize: '11px', padding: '2px 6px' }}>
                                                    {skill}
                                                </Tag>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* 教育背景 */}
                                {selectedTask.result.education && selectedTask.result.education.length > 0 && (
                                    <div style={{ marginBottom: '16px' }}>
                                        <Text strong style={{ fontSize: '14px' }}>教育背景</Text>
                                        <div style={{ marginTop: '8px' }}>
                                            {selectedTask.result.education.slice(0, 1).map((edu: any, index: number) => (
                                                <div key={index} style={{ padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                                                    <Text strong style={{ fontSize: '13px' }}>{edu.institution}</Text>
                                                    <br />
                                                    <Text style={{ fontSize: '12px' }}>{edu.degree} · {edu.major}</Text>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UploadResume;
