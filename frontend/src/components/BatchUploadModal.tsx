import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    Modal,
    Button,
    message,
    Progress,
    Typography,
    Space,
    Card,
    Row,
    Col,
    Select,
    notification,
    Table,
    Tag,
    Tooltip,
    InputNumber,
    Switch,
    Divider,
    Badge,
    Statistic
} from 'antd';
import {
    UploadOutlined,
    FolderOpenOutlined,
    FileTextOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    DeleteOutlined,
    ReloadOutlined,
    PauseCircleOutlined,
    PlayCircleOutlined,
    ClearOutlined,
    HistoryOutlined,
    ExclamationCircleOutlined,
    LoadingOutlined,
    ClockCircleOutlined
} from '@ant-design/icons';
import { apiService } from '../services/api';

const { Text } = Typography;
const { Option } = Select;

interface BatchUploadModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

type FileStatus = 'pending' | 'uploading' | 'success' | 'error' | 'duplicate' | 'skipped';

interface UploadFileItem {
    id: string;
    file: File;
    name: string;
    size: number;
    status: FileStatus;
    progress: number;
    message?: string;
    category?: string;
    taskId?: string;
    duplicateInfo?: {
        candidateId: number;
        candidateName: string;
    };
}

interface UploadHistory {
    id: string;
    date: string;
    totalFiles: number;
    successCount: number;
    failedCount: number;
    files: {
        name: string;
        status: FileStatus;
        candidateName?: string;
    }[];
}

const BatchUploadModal: React.FC<BatchUploadModalProps> = ({
    visible,
    onClose,
    onSuccess
}) => {
    // 文件列表状态
    const [fileList, setFileList] = useState<UploadFileItem[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

    // 配置状态
    const [globalCategory, setGlobalCategory] = useState<string>('');
    const [concurrentLimit, setConcurrentLimit] = useState(3);
    const [skipDuplicates, setSkipDuplicates] = useState(false);
    const [isPreChecking, setIsPreChecking] = useState(false);

    // 历史记录
    const [showHistory, setShowHistory] = useState(false);
    const [uploadHistory, setUploadHistory] = useState<UploadHistory[]>([]);

    // 上传控制
    const uploadQueueRef = useRef<UploadFileItem[]>([]);
    const activeUploadsRef = useRef<number>(0);
    const isPausedRef = useRef(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const folderInputRef = useRef<HTMLInputElement>(null);

    // 拖拽状态
    const [isDragging, setIsDragging] = useState(false);
    const dropZoneRef = useRef<HTMLDivElement>(null);

    // 默认职位分类配置
    const defaultCategories = [
        { id: 'tech', name: '技术开发', color: '#1890ff' },
        { id: 'design', name: '产品设计', color: '#52c41a' },
        { id: 'marketing', name: '运营推广', color: '#fa8c16' },
        { id: 'sales', name: '销售商务', color: '#eb2f96' },
        { id: 'hr', name: '人力资源', color: '#722ed1' },
        { id: 'finance', name: '财务金融', color: '#13c2c2' },
        { id: 'admin', name: '管理行政', color: '#faad14' },
        { id: 'other', name: '其他职位', color: '#8c8c8c' }
    ];

    const getPositionCategories = () => {
        const saved = localStorage.getItem('positionCategories');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return parsed.length > 0 ? parsed : defaultCategories;
            } catch {
                return defaultCategories;
            }
        }
        return defaultCategories;
    };

    // 加载上传历史
    useEffect(() => {
        const saved = localStorage.getItem('batchUploadHistory');
        if (saved) {
            try {
                setUploadHistory(JSON.parse(saved));
            } catch {
                setUploadHistory([]);
            }
        }
    }, []);

    // 保存上传历史
    const saveHistory = (history: UploadHistory) => {
        const newHistory = [history, ...uploadHistory].slice(0, 20); // 保留最近20条
        setUploadHistory(newHistory);
        localStorage.setItem('batchUploadHistory', JSON.stringify(newHistory));
    };

    // 验证文件类型
    const isValidFile = (file: File): boolean => {
        const validTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
        ];
        const validExtensions = ['.pdf', '.doc', '.docx', '.txt'];
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        return validTypes.includes(file.type) || validExtensions.includes(ext);
    };

    // 递归读取文件夹中的文件
    const readDirectory = async (entry: FileSystemDirectoryEntry): Promise<File[]> => {
        const files: File[] = [];
        const reader = entry.createReader();

        const readEntries = (): Promise<FileSystemEntry[]> => {
            return new Promise((resolve, reject) => {
                reader.readEntries(resolve, reject);
            });
        };

        const getFile = (fileEntry: FileSystemFileEntry): Promise<File> => {
            return new Promise((resolve, reject) => {
                fileEntry.file(resolve, reject);
            });
        };

        let entries: FileSystemEntry[];
        do {
            entries = await readEntries();
            for (const entry of entries) {
                if (entry.isFile) {
                    try {
                        const file = await getFile(entry as FileSystemFileEntry);
                        if (isValidFile(file)) {
                            files.push(file);
                        }
                    } catch (e) {
                        console.warn('读取文件失败:', entry.name);
                    }
                } else if (entry.isDirectory) {
                    const subFiles = await readDirectory(entry as FileSystemDirectoryEntry);
                    files.push(...subFiles);
                }
            }
        } while (entries.length > 0);

        return files;
    };

    // 处理拖拽的文件和文件夹
    const handleDroppedItems = async (items: DataTransferItemList) => {
        const allFiles: File[] = [];
        const entries: FileSystemEntry[] = [];

        // 获取所有 entries
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.kind === 'file') {
                const entry = item.webkitGetAsEntry();
                if (entry) {
                    entries.push(entry);
                }
            }
        }

        // 处理每个 entry
        for (const entry of entries) {
            if (entry.isFile) {
                const fileEntry = entry as FileSystemFileEntry;
                try {
                    const file = await new Promise<File>((resolve, reject) => {
                        fileEntry.file(resolve, reject);
                    });
                    if (isValidFile(file)) {
                        allFiles.push(file);
                    }
                } catch (e) {
                    console.warn('读取文件失败:', entry.name);
                }
            } else if (entry.isDirectory) {
                const dirFiles = await readDirectory(entry as FileSystemDirectoryEntry);
                allFiles.push(...dirFiles);
            }
        }

        return allFiles;
    };

    // 拖拽事件处理
    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isUploading) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // 检查是否真的离开了拖放区域
        if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
            setIsDragging(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (isUploading) {
            message.warning('上传进行中，无法添加文件');
            return;
        }

        const items = e.dataTransfer.items;
        if (!items || items.length === 0) {
            return;
        }

        message.loading('正在读取文件...', 0);

        try {
            const files = await handleDroppedItems(items);
            message.destroy();

            if (files.length === 0) {
                message.warning('未找到支持的文件（PDF、Word、TXT）');
                return;
            }

            // 转换为 FileList 格式并处理
            const dataTransfer = new DataTransfer();
            files.forEach(file => dataTransfer.items.add(file));
            handleFileSelect(dataTransfer.files);
        } catch (error) {
            message.destroy();
            console.error('处理拖拽文件失败:', error);
            message.error('处理文件失败，请重试');
        }
    };

    // 处理文件选择
    const handleFileSelect = (files: FileList | null) => {
        if (!files) return;

        const newFiles: UploadFileItem[] = [];
        const existingNames = new Set(fileList.map(f => f.name));

        Array.from(files).forEach(file => {
            if (!isValidFile(file)) {
                message.warning(`跳过不支持的文件: ${file.name}`);
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                message.warning(`文件过大(>10MB): ${file.name}`);
                return;
            }
            if (existingNames.has(file.name)) {
                message.warning(`文件已存在: ${file.name}`);
                return;
            }

            newFiles.push({
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                file,
                name: file.name,
                size: file.size,
                status: 'pending',
                progress: 0,
                category: globalCategory || undefined
            });
        });

        if (newFiles.length > 0) {
            setFileList(prev => [...prev, ...newFiles]);
            message.success(`已添加 ${newFiles.length} 个文件`);
        }
    };

    // 选择文件
    const handleSelectFiles = () => {
        fileInputRef.current?.click();
    };

    // 选择文件夹
    const handleSelectFolder = () => {
        folderInputRef.current?.click();
    };

    // 清空列表
    const handleClearAll = () => {
        if (isUploading) {
            message.warning('上传进行中，无法清空');
            return;
        }
        setFileList([]);
    };

    // 删除单个文件
    const handleRemoveFile = (id: string) => {
        if (isUploading) {
            const file = fileList.find(f => f.id === id);
            if (file?.status === 'uploading') {
                message.warning('该文件正在上传中');
                return;
            }
        }
        setFileList(prev => prev.filter(f => f.id !== id));
    };

    // 更新单个文件分类
    const handleFileCategoryChange = (id: string, category: string) => {
        setFileList(prev => prev.map(f =>
            f.id === id ? { ...f, category } : f
        ));
    };

    // 全局分类变更时更新所有未设置分类的文件
    useEffect(() => {
        if (globalCategory) {
            setFileList(prev => prev.map(f => ({
                ...f,
                category: globalCategory
            })));
        }
    }, [globalCategory]);

    // 从文件名中提取候选人姓名
    const extractNameFromFilename = (filename: string): string => {
        // 移除文件扩展名
        const nameWithoutExt = filename.replace(/\.(pdf|doc|docx|txt)$/i, '');

        // 常见的文件命名模式：
        // "张三.pdf", "张三_简历.pdf", "张三-简历.pdf", "张三 简历.pdf"
        // "简历_张三.pdf", "简历-张三.pdf", "简历 张三.pdf"
        // "张三的简历.pdf", "张三个人简历.pdf"

        // 尝试多种模式
        const patterns = [
            // 模式1: 开头的中文名字（2-4个汉字）
            /^([\u4e00-\u9fa5]{2,4})(?:[_\-\s]|的|个人)?/,
            // 模式2: "简历_姓名" 或 "简历-姓名" 或 "简历 姓名"
            /简历[_\-\s]?([\u4e00-\u9fa5]{2,4})/,
            // 模式3: 姓名在末尾
            /[_\-\s]([\u4e00-\u9fa5]{2,4})$/,
            // 模式4: 英文名字 (First Last 或 FirstLast)
            /^([A-Z][a-z]+(?:\s?[A-Z][a-z]+)?)/,
            // 模式5: 纯英文开头到分隔符
            /^([A-Za-z]+)(?:[_\-\s]|$)/
        ];

        for (const pattern of patterns) {
            const match = nameWithoutExt.match(pattern);
            if (match && match[1]) {
                const name = match[1].trim();
                // 验证名字长度合理
                if (name.length >= 2 && name.length <= 20) {
                    return name;
                }
            }
        }

        // 如果没有匹配，返回去掉扩展名后的前几个字符（如果是汉字）
        const chineseMatch = nameWithoutExt.match(/^[\u4e00-\u9fa5]{2,4}/);
        if (chineseMatch) {
            return chineseMatch[0];
        }

        return '';
    };

    // 批量预检测重复
    const handlePreCheck = async () => {
        const pendingFiles = fileList.filter(f => f.status === 'pending');
        if (pendingFiles.length === 0) {
            message.info('没有待检测的文件');
            return;
        }

        setIsPreChecking(true);
        let duplicateCount = 0;
        let checkedCount = 0;

        try {
            for (const file of pendingFiles) {
                checkedCount++;
                // 从文件名提取可能的姓名
                const possibleName = extractNameFromFilename(file.name);

                if (possibleName && possibleName.length >= 2) {
                    try {
                        const result = await apiService.checkDuplicateCandidate(possibleName);
                        if (result.exists && result.candidates.length > 0) {
                            duplicateCount++;
                            setFileList(prev => prev.map(f =>
                                f.id === file.id ? {
                                    ...f,
                                    status: 'duplicate',
                                    duplicateInfo: {
                                        candidateId: result.candidates[0].id,
                                        candidateName: result.candidates[0].name
                                    },
                                    message: `可能与 ${result.candidates[0].name} 重复`
                                } : f
                            ));
                        }
                    } catch (e) {
                        console.warn(`检测 ${file.name} 失败:`, e);
                    }
                }

                // 每隔几个文件更新一下进度提示
                if (checkedCount % 5 === 0) {
                    message.loading(`正在检测... (${checkedCount}/${pendingFiles.length})`, 0);
                }
            }

            message.destroy();

            if (duplicateCount > 0) {
                message.warning(`检测到 ${duplicateCount} 个可能重复的文件`);
            } else {
                message.success('未检测到重复文件');
            }
        } catch (error) {
            message.destroy();
            console.error('预检测失败:', error);
            message.error('预检测失败');
        } finally {
            setIsPreChecking(false);
        }
    };

    // 监控单个任务的解析状态
    const monitorTaskStatus = async (fileId: string, taskId: string): Promise<void> => {
        const maxRetries = 60; // 最多检查60次（约3分钟）
        let retries = 0;

        const checkStatus = async (): Promise<void> => {
            if (retries >= maxRetries) {
                setFileList(prev => prev.map(f =>
                    f.id === fileId && f.status === 'success'
                        ? { ...f, message: '解析超时，请稍后刷新查看' }
                        : f
                ));
                return;
            }

            retries++;

            try {
                const task = await apiService.getTaskStatus(taskId);
                if (!task) {
                    setTimeout(checkStatus, 3000);
                    return;
                }

                if (task.status === 'completed') {
                    // 解析成功，获取候选人信息
                    const candidate = await apiService.getCandidate(taskId);
                    setFileList(prev => prev.map(f =>
                        f.id === fileId ? {
                            ...f,
                            status: 'success',
                            message: candidate ? `已添加: ${candidate.name}` : '解析完成'
                        } : f
                    ));
                    onSuccess?.();
                } else if (task.status === 'duplicate') {
                    // 发现重复
                    const duplicateInfo = task.error ? apiService.parseDuplicateInfo(task.error) : null;
                    setFileList(prev => prev.map(f =>
                        f.id === fileId ? {
                            ...f,
                            status: 'duplicate',
                            message: duplicateInfo
                                ? `重复: ${duplicateInfo.candidate_name}`
                                : '发现重复候选人',
                            duplicateInfo: duplicateInfo ? {
                                candidateId: duplicateInfo.candidate_id,
                                candidateName: duplicateInfo.candidate_name
                            } : undefined
                        } : f
                    ));
                } else if (task.status === 'failed') {
                    // 解析失败
                    setFileList(prev => prev.map(f =>
                        f.id === fileId ? {
                            ...f,
                            status: 'error',
                            message: task.error || '解析失败'
                        } : f
                    ));
                } else if (task.status === 'parsing' || task.status === 'uploaded') {
                    // 仍在处理中，继续监控
                    setTimeout(checkStatus, 3000);
                }
            } catch (error) {
                console.warn(`监控任务 ${taskId} 状态失败:`, error);
                setTimeout(checkStatus, 3000);
            }
        };

        // 开始检查
        setTimeout(checkStatus, 2000);
    };

    // 上传单个文件
    const uploadSingleFile = async (fileItem: UploadFileItem): Promise<void> => {
        // 更新状态为上传中
        setFileList(prev => prev.map(f =>
            f.id === fileItem.id ? { ...f, status: 'uploading', progress: 0 } : f
        ));

        try {
            const formData = new FormData();
            formData.append('file', fileItem.file);
            if (fileItem.category) {
                formData.append('category', fileItem.category);
            }

            // 模拟进度更新
            const progressInterval = setInterval(() => {
                setFileList(prev => prev.map(f =>
                    f.id === fileItem.id && f.status === 'uploading'
                        ? { ...f, progress: Math.min(f.progress + 15, 90) }
                        : f
                ));
            }, 300);

            const response = await apiService.uploadResume(formData, skipDuplicates);

            clearInterval(progressInterval);

            // 更新状态为成功（上传成功，开始解析）
            setFileList(prev => prev.map(f =>
                f.id === fileItem.id ? {
                    ...f,
                    status: 'success',
                    progress: 100,
                    taskId: response.task_id,
                    message: '上传成功，正在解析...'
                } : f
            ));

            // 开始监控解析状态
            monitorTaskStatus(fileItem.id, response.task_id);

        } catch (error: any) {
            // 更新状态为失败
            setFileList(prev => prev.map(f =>
                f.id === fileItem.id ? {
                    ...f,
                    status: 'error',
                    progress: 0,
                    message: error.message || '上传失败'
                } : f
            ));
        }
    };

    // 处理上传队列
    const processQueue = useCallback(async () => {
        while (uploadQueueRef.current.length > 0 && !isPausedRef.current) {
            if (activeUploadsRef.current >= concurrentLimit) {
                await new Promise(resolve => setTimeout(resolve, 100));
                continue;
            }

            const fileItem = uploadQueueRef.current.shift();
            if (!fileItem) break;

            // 跳过重复文件（如果启用）
            if (skipDuplicates && fileItem.status === 'duplicate') {
                setFileList(prev => prev.map(f =>
                    f.id === fileItem.id ? { ...f, status: 'skipped', message: '已跳过（重复）' } : f
                ));
                continue;
            }

            activeUploadsRef.current++;

            uploadSingleFile(fileItem).finally(() => {
                activeUploadsRef.current--;
            });

            // 小延迟避免过快触发
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }, [concurrentLimit, skipDuplicates]);

    // 开始上传
    const handleStartUpload = async () => {
        const pendingFiles = fileList.filter(f =>
            f.status === 'pending' || f.status === 'duplicate'
        );

        if (pendingFiles.length === 0) {
            message.warning('没有待上传的文件');
            return;
        }

        setIsUploading(true);
        setIsPaused(false);
        isPausedRef.current = false;

        // 初始化队列
        uploadQueueRef.current = [...pendingFiles];
        activeUploadsRef.current = 0;

        // 开始处理队列
        await processQueue();

        // 等待所有上传完成
        while (activeUploadsRef.current > 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        setIsUploading(false);

        // 统计结果
        const results = fileList.filter(f => pendingFiles.some(p => p.id === f.id));
        const successCount = results.filter(f => f.status === 'success').length;
        const failedCount = results.filter(f => f.status === 'error').length;

        // 保存历史记录
        const history: UploadHistory = {
            id: Date.now().toString(),
            date: new Date().toLocaleString('zh-CN'),
            totalFiles: pendingFiles.length,
            successCount,
            failedCount,
            files: fileList.filter(f => pendingFiles.some(p => p.id === f.id)).map(f => ({
                name: f.name,
                status: f.status,
                candidateName: f.message || (f.status === 'success' ? '上传成功' : undefined)
            }))
        };
        saveHistory(history);

        // 显示结果通知
        if (failedCount === 0) {
            notification.success({
                message: '批量上传完成',
                description: `成功上传 ${successCount} 个文件`
            });
        } else {
            notification.warning({
                message: '批量上传完成',
                description: `成功: ${successCount}, 失败: ${failedCount}`
            });
        }

        // 回调
        if (successCount > 0) {
            onSuccess?.();
        }
    };

    // 暂停/继续上传
    const handleTogglePause = () => {
        if (isPaused) {
            setIsPaused(false);
            isPausedRef.current = false;
            processQueue();
        } else {
            setIsPaused(true);
            isPausedRef.current = true;
        }
    };

    // 重试失败的文件
    const handleRetryFailed = () => {
        setFileList(prev => prev.map(f =>
            f.status === 'error' ? { ...f, status: 'pending', progress: 0, message: undefined } : f
        ));
    };

    // 重试单个文件
    const handleRetrySingle = (id: string) => {
        setFileList(prev => prev.map(f =>
            f.id === id ? { ...f, status: 'pending', progress: 0, message: undefined } : f
        ));
    };

    // 统计数据
    const stats = {
        total: fileList.length,
        pending: fileList.filter(f => f.status === 'pending').length,
        uploading: fileList.filter(f => f.status === 'uploading').length,
        success: fileList.filter(f => f.status === 'success').length,
        error: fileList.filter(f => f.status === 'error').length,
        duplicate: fileList.filter(f => f.status === 'duplicate').length,
        skipped: fileList.filter(f => f.status === 'skipped').length
    };

    // 获取状态标签
    const getStatusTag = (status: FileStatus, message?: string) => {
        const config: Record<FileStatus, { color: string; icon: React.ReactNode; text: string }> = {
            pending: { color: 'default', icon: <ClockCircleOutlined />, text: '等待上传' },
            uploading: { color: 'processing', icon: <LoadingOutlined />, text: '上传中' },
            success: { color: 'success', icon: <CheckCircleOutlined />, text: '成功' },
            error: { color: 'error', icon: <CloseCircleOutlined />, text: '失败' },
            duplicate: { color: 'warning', icon: <ExclamationCircleOutlined />, text: '可能重复' },
            skipped: { color: 'default', icon: <CloseCircleOutlined />, text: '已跳过' }
        };
        const { color, icon, text } = config[status];
        return (
            <Tooltip title={message}>
                <Tag color={color} icon={icon}>{text}</Tag>
            </Tooltip>
        );
    };

    // 格式化文件大小
    const formatSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    // 文件列表列配置
    const columns = [
        {
            title: '文件名',
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
            render: (name: string) => (
                <Space>
                    <FileTextOutlined style={{ color: '#1890ff' }} />
                    <Text ellipsis style={{ maxWidth: 200 }}>{name}</Text>
                </Space>
            )
        },
        {
            title: '大小',
            dataIndex: 'size',
            key: 'size',
            width: 80,
            render: (size: number) => <Text type="secondary">{formatSize(size)}</Text>
        },
        {
            title: '分类',
            key: 'category',
            width: 130,
            render: (_: any, record: UploadFileItem) => (
                <Select
                    size="small"
                    style={{ width: 120 }}
                    value={record.category || undefined}
                    onChange={(val) => handleFileCategoryChange(record.id, val)}
                    placeholder="选择分类"
                    allowClear
                    disabled={isUploading || !!globalCategory}
                >
                    {getPositionCategories().map((cat: any) => (
                        <Option key={cat.id} value={cat.name}>
                            <span style={{ color: cat.color }}>{cat.name}</span>
                        </Option>
                    ))}
                </Select>
            )
        },
        {
            title: '状态',
            key: 'status',
            width: 120,
            render: (_: any, record: UploadFileItem) => (
                <Space direction="vertical" size={0}>
                    {getStatusTag(record.status, record.message)}
                    {record.status === 'uploading' && (
                        <Progress percent={record.progress} size="small" style={{ width: 80 }} />
                    )}
                </Space>
            )
        },
        {
            title: '操作',
            key: 'action',
            width: 80,
            render: (_: any, record: UploadFileItem) => (
                <Space size="small">
                    {record.status === 'error' && (
                        <Tooltip title="重试">
                            <Button
                                type="text"
                                size="small"
                                icon={<ReloadOutlined />}
                                onClick={() => handleRetrySingle(record.id)}
                            />
                        </Tooltip>
                    )}
                    <Tooltip title="删除">
                        <Button
                            type="text"
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleRemoveFile(record.id)}
                            disabled={record.status === 'uploading'}
                        />
                    </Tooltip>
                </Space>
            )
        }
    ];

    // 历史记录列配置
    const historyColumns = [
        {
            title: '时间',
            dataIndex: 'date',
            key: 'date',
            width: 160
        },
        {
            title: '总数',
            dataIndex: 'totalFiles',
            key: 'totalFiles',
            width: 60
        },
        {
            title: '成功',
            dataIndex: 'successCount',
            key: 'successCount',
            width: 60,
            render: (count: number) => <Text type="success">{count}</Text>
        },
        {
            title: '失败',
            dataIndex: 'failedCount',
            key: 'failedCount',
            width: 60,
            render: (count: number) => count > 0 ? <Text type="danger">{count}</Text> : count
        }
    ];

    // 历史记录展开行渲染
    const expandedRowRender = (record: UploadHistory) => {
        const fileColumns = [
            {
                title: '文件名',
                dataIndex: 'name',
                key: 'name',
                ellipsis: true,
                render: (name: string) => (
                    <Space>
                        <FileTextOutlined style={{ color: '#1890ff' }} />
                        <Text ellipsis style={{ maxWidth: 200 }}>{name}</Text>
                    </Space>
                )
            },
            {
                title: '状态',
                dataIndex: 'status',
                key: 'status',
                width: 100,
                render: (status: FileStatus) => getStatusTag(status)
            },
            {
                title: '候选人',
                dataIndex: 'candidateName',
                key: 'candidateName',
                width: 150,
                render: (name: string) => name || '-'
            }
        ];

        return (
            <Table
                columns={fileColumns}
                dataSource={record.files}
                rowKey="name"
                size="small"
                pagination={false}
                style={{ margin: -16 }}
            />
        );
    };

    return (
        <>
            {/* 隐藏的文件输入 */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt"
                style={{ display: 'none' }}
                onChange={(e) => handleFileSelect(e.target.files)}
            />
            <input
                ref={folderInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt"
                style={{ display: 'none' }}
                {...{ webkitdirectory: '', directory: '' } as any}
                onChange={(e) => handleFileSelect(e.target.files)}
            />

            <Modal
                title={
                    <Space>
                        <UploadOutlined style={{ color: '#1890ff' }} />
                        <span>批量上传简历</span>
                        <Badge count={stats.total} style={{ backgroundColor: '#1890ff' }} />
                    </Space>
                }
                open={visible}
                onCancel={onClose}
                width={900}
                footer={null}
                destroyOnHidden
            >
                {/* 统计面板 */}
                <Card size="small" style={{ marginBottom: 16 }}>
                    <Row gutter={16}>
                        <Col span={4}>
                            <Statistic title="总计" value={stats.total} />
                        </Col>
                        <Col span={4}>
                            <Statistic title="等待" value={stats.pending} valueStyle={{ color: '#8c8c8c' }} />
                        </Col>
                        <Col span={4}>
                            <Statistic title="上传中" value={stats.uploading} valueStyle={{ color: '#1890ff' }} />
                        </Col>
                        <Col span={4}>
                            <Statistic title="成功" value={stats.success} valueStyle={{ color: '#52c41a' }} />
                        </Col>
                        <Col span={4}>
                            <Statistic title="失败" value={stats.error} valueStyle={{ color: '#ff4d4f' }} />
                        </Col>
                        <Col span={4}>
                            <Statistic title="重复" value={stats.duplicate} valueStyle={{ color: '#faad14' }} />
                        </Col>
                    </Row>
                </Card>

                {/* 操作栏 */}
                <Card size="small" style={{ marginBottom: 16 }}>
                    <Row gutter={[16, 16]} align="middle">
                        <Col>
                            <Space>
                                <Button
                                    icon={<UploadOutlined />}
                                    onClick={handleSelectFiles}
                                    disabled={isUploading}
                                >
                                    选择文件
                                </Button>
                                <Button
                                    icon={<FolderOpenOutlined />}
                                    onClick={handleSelectFolder}
                                    disabled={isUploading}
                                >
                                    选择文件夹
                                </Button>
                                <Button
                                    icon={<ClearOutlined />}
                                    onClick={handleClearAll}
                                    disabled={isUploading || fileList.length === 0}
                                >
                                    清空
                                </Button>
                            </Space>
                        </Col>
                        <Col flex="auto" />
                        <Col>
                            <Button
                                icon={<HistoryOutlined />}
                                onClick={() => setShowHistory(!showHistory)}
                            >
                                历史记录
                            </Button>
                        </Col>
                    </Row>

                    <Divider style={{ margin: '12px 0' }} />

                    <Row gutter={[16, 16]} align="middle">
                        <Col>
                            <Space>
                                <Text>统一分类:</Text>
                                <Select
                                    style={{ width: 140 }}
                                    value={globalCategory || undefined}
                                    onChange={setGlobalCategory}
                                    placeholder="不统一设置"
                                    allowClear
                                    disabled={isUploading}
                                >
                                    {getPositionCategories().map((cat: any) => (
                                        <Option key={cat.id} value={cat.name}>
                                            <span style={{ color: cat.color }}>{cat.name}</span>
                                        </Option>
                                    ))}
                                </Select>
                            </Space>
                        </Col>
                        <Col>
                            <Space>
                                <Text>并发数:</Text>
                                <InputNumber
                                    min={1}
                                    max={10}
                                    value={concurrentLimit}
                                    onChange={(val) => setConcurrentLimit(val || 3)}
                                    disabled={isUploading}
                                    style={{ width: 60 }}
                                />
                            </Space>
                        </Col>
                        <Col>
                            <Space>
                                <Text>跳过重复:</Text>
                                <Switch
                                    checked={skipDuplicates}
                                    onChange={setSkipDuplicates}
                                    disabled={isUploading}
                                />
                            </Space>
                        </Col>
                        <Col>
                            <Button
                                icon={<ExclamationCircleOutlined />}
                                onClick={handlePreCheck}
                                loading={isPreChecking}
                                disabled={isUploading || stats.pending === 0}
                            >
                                预检测重复
                            </Button>
                        </Col>
                    </Row>
                </Card>

                {/* 文件列表 / 拖拽区域 */}
                <div
                    ref={dropZoneRef}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    style={{
                        position: 'relative',
                        marginBottom: 16
                    }}
                >
                    {/* 拖拽覆盖层 */}
                    {isDragging && (
                        <div
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: 'rgba(24, 144, 255, 0.1)',
                                border: '2px dashed #1890ff',
                                borderRadius: 8,
                                zIndex: 10,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'column'
                            }}
                        >
                            <FolderOpenOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
                            <Text style={{ fontSize: 16, color: '#1890ff' }}>释放以添加文件或文件夹</Text>
                        </div>
                    )}

                    <Card
                        size="small"
                        styles={{ body: { padding: 0, maxHeight: 300, overflow: 'auto' } }}
                    >
                        {fileList.length === 0 ? (
                            <div
                                style={{
                                    padding: 40,
                                    textAlign: 'center',
                                    border: '2px dashed #d9d9d9',
                                    borderRadius: 8,
                                    margin: 8,
                                    cursor: 'pointer',
                                    transition: 'all 0.3s'
                                }}
                                onClick={handleSelectFolder}
                            >
                                <FolderOpenOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
                                <div>
                                    <Text type="secondary" style={{ fontSize: 14 }}>
                                        拖拽文件或文件夹到此处，或点击选择
                                    </Text>
                                </div>
                                <div style={{ marginTop: 8 }}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        支持 PDF、Word、TXT 格式，单文件最大 10MB
                                    </Text>
                                </div>
                            </div>
                        ) : (
                            <Table
                                columns={columns}
                                dataSource={fileList}
                                rowKey="id"
                                size="small"
                                pagination={false}
                            />
                        )}
                    </Card>
                </div>

                {/* 历史记录面板 */}
                {showHistory && (
                    <Card
                        size="small"
                        title="上传历史"
                        style={{ marginBottom: 16 }}
                        extra={
                            <Button
                                size="small"
                                type="link"
                                danger
                                onClick={() => {
                                    setUploadHistory([]);
                                    localStorage.removeItem('batchUploadHistory');
                                }}
                            >
                                清空历史
                            </Button>
                        }
                    >
                        {uploadHistory.length === 0 ? (
                            <Text type="secondary">暂无上传历史</Text>
                        ) : (
                            <Table
                                columns={historyColumns}
                                dataSource={uploadHistory}
                                rowKey="id"
                                size="small"
                                pagination={false}
                                expandable={{
                                    expandedRowRender,
                                    rowExpandable: (record) => record.files && record.files.length > 0
                                }}
                                style={{ maxHeight: 300, overflow: 'auto' }}
                            />
                        )}
                    </Card>
                )}

                {/* 底部操作 */}
                <Row justify="space-between" align="middle">
                    <Col>
                        {stats.error > 0 && !isUploading && (
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={handleRetryFailed}
                            >
                                重试失败 ({stats.error})
                            </Button>
                        )}
                    </Col>
                    <Col>
                        <Space>
                            <Button onClick={onClose} disabled={isUploading}>
                                关闭
                            </Button>
                            {isUploading && (
                                <Button
                                    icon={isPaused ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
                                    onClick={handleTogglePause}
                                >
                                    {isPaused ? '继续' : '暂停'}
                                </Button>
                            )}
                            <Button
                                type="primary"
                                icon={<UploadOutlined />}
                                onClick={handleStartUpload}
                                loading={isUploading && !isPaused}
                                disabled={stats.pending === 0 && stats.duplicate === 0}
                            >
                                {isUploading
                                    ? `上传中 (${stats.success + stats.error + stats.skipped}/${stats.total})`
                                    : '开始上传'}
                            </Button>
                        </Space>
                    </Col>
                </Row>
            </Modal>
        </>
    );
};

export default BatchUploadModal;

