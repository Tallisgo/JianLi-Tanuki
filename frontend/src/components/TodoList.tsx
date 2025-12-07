import React, { useState, useEffect } from 'react';
import {
    Card,
    List,
    Input,
    Button,
    Checkbox,
    Space,
    Typography,
    DatePicker,
    Popover,
    Tag,
    Empty,
    message,
    Tooltip
} from 'antd';
import {
    PlusOutlined,
    DeleteOutlined,
    BellOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    EditOutlined,
    SaveOutlined,
    CloseOutlined
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';

const { Text } = Typography;

interface TodoItem {
    id: string;
    content: string;
    completed: boolean;
    reminder?: string; // ISO date string
    createdAt: string;
}

interface TodoListProps {
    style?: React.CSSProperties;
}

const TodoList: React.FC<TodoListProps> = ({ style }) => {
    const [todos, setTodos] = useState<TodoItem[]>([]);
    const [newTodo, setNewTodo] = useState('');
    const [reminderDate, setReminderDate] = useState<Dayjs | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingContent, setEditingContent] = useState('');

    // 从 localStorage 加载待办事项
    useEffect(() => {
        const savedTodos = localStorage.getItem('dashboard_todos');
        if (savedTodos) {
            try {
                const parsed = JSON.parse(savedTodos);
                setTodos(parsed);
            } catch (error) {
                console.error('加载待办事项失败:', error);
            }
        }
    }, []);

    // 保存到 localStorage
    useEffect(() => {
        localStorage.setItem('dashboard_todos', JSON.stringify(todos));
    }, [todos]);

    // 检查提醒
    useEffect(() => {
        const checkReminders = () => {
            const now = dayjs();
            todos.forEach(todo => {
                if (todo.reminder && !todo.completed) {
                    const reminderTime = dayjs(todo.reminder);
                    // 如果提醒时间已到（在前后5分钟内）
                    if (Math.abs(reminderTime.diff(now, 'minute')) <= 5) {
                        // 检查是否已经提醒过
                        const notifiedKey = `todo_notified_${todo.id}_${todo.reminder}`;
                        if (!localStorage.getItem(notifiedKey)) {
                            showNotification(todo);
                            localStorage.setItem(notifiedKey, 'true');
                        }
                    }
                }
            });
        };

        // 每分钟检查一次
        const interval = setInterval(checkReminders, 60000);
        checkReminders(); // 立即检查一次

        return () => clearInterval(interval);
    }, [todos]);

    // 显示提醒通知
    const showNotification = (todo: TodoItem) => {
        message.info({
            content: `⏰ 提醒：${todo.content}`,
            duration: 10,
            icon: <BellOutlined style={{ color: '#faad14' }} />
        });

        // 尝试显示浏览器通知
        if ('Notification' in window && Notification.permission === 'granted') {
            new window.Notification('待办事项提醒', {
                body: todo.content,
                icon: '/favicon.ico',
                tag: `todo-${todo.id}`
            });
        }
    };

    // 请求通知权限
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    // 添加待办事项
    const handleAddTodo = () => {
        if (!newTodo.trim()) {
            message.warning('请输入待办内容');
            return;
        }

        const todo: TodoItem = {
            id: Date.now().toString(),
            content: newTodo.trim(),
            completed: false,
            reminder: reminderDate?.toISOString(),
            createdAt: new Date().toISOString()
        };

        setTodos([todo, ...todos]);
        setNewTodo('');
        setReminderDate(null);
        message.success('添加成功');
    };

    // 切换完成状态
    const handleToggleComplete = (id: string) => {
        setTodos(todos.map(todo =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
        ));
    };

    // 删除待办事项
    const handleDelete = (id: string) => {
        setTodos(todos.filter(todo => todo.id !== id));
        message.success('已删除');
    };

    // 开始编辑
    const handleStartEdit = (todo: TodoItem) => {
        setEditingId(todo.id);
        setEditingContent(todo.content);
    };

    // 保存编辑
    const handleSaveEdit = (id: string) => {
        if (!editingContent.trim()) {
            message.warning('内容不能为空');
            return;
        }
        setTodos(todos.map(todo =>
            todo.id === id ? { ...todo, content: editingContent.trim() } : todo
        ));
        setEditingId(null);
        setEditingContent('');
    };

    // 取消编辑
    const handleCancelEdit = () => {
        setEditingId(null);
        setEditingContent('');
    };

    // 设置/更新提醒
    const handleSetReminder = (id: string, date: Dayjs | null) => {
        setTodos(todos.map(todo =>
            todo.id === id ? { ...todo, reminder: date?.toISOString() } : todo
        ));
        if (date) {
            message.success(`提醒已设置：${date.format('MM-DD HH:mm')}`);
        } else {
            message.info('提醒已取消');
        }
    };

    // 格式化提醒时间
    const formatReminder = (reminder?: string) => {
        if (!reminder) return null;
        const reminderTime = dayjs(reminder);
        const now = dayjs();

        if (reminderTime.isBefore(now)) {
            return <Text type="danger" style={{ fontSize: '11px' }}>已过期</Text>;
        }

        const diffDays = reminderTime.diff(now, 'day');
        if (diffDays === 0) {
            return <Text type="warning" style={{ fontSize: '11px' }}>今天 {reminderTime.format('HH:mm')}</Text>;
        } else if (diffDays === 1) {
            return <Text style={{ fontSize: '11px', color: '#1890ff' }}>明天 {reminderTime.format('HH:mm')}</Text>;
        } else {
            return <Text style={{ fontSize: '11px', color: '#52c41a' }}>{reminderTime.format('MM-DD HH:mm')}</Text>;
        }
    };

    // 提醒设置弹窗内容
    const renderReminderPopover = (todo: TodoItem) => (
        <div style={{ width: 220 }}>
            <DatePicker
                showTime={{ format: 'HH:mm' }}
                format="YYYY-MM-DD HH:mm"
                placeholder="选择提醒时间"
                style={{ width: '100%' }}
                value={todo.reminder ? dayjs(todo.reminder) : null}
                onChange={(date) => handleSetReminder(todo.id, date)}
                disabledDate={(current) => current && current < dayjs().startOf('day')}
            />
            {todo.reminder && (
                <Button
                    type="link"
                    danger
                    size="small"
                    onClick={() => handleSetReminder(todo.id, null)}
                    style={{ padding: '4px 0', marginTop: '8px' }}
                >
                    取消提醒
                </Button>
            )}
        </div>
    );

    // 分离未完成和已完成的待办
    const pendingTodos = todos.filter(t => !t.completed);
    const completedTodos = todos.filter(t => t.completed);

    return (
        <Card
            title={
                <Space>
                    <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '18px' }} />
                    <span style={{ fontSize: '16px', fontWeight: 'bold' }}>待办事项</span>
                    {pendingTodos.length > 0 && (
                        <Tag color="blue" style={{ marginLeft: '8px' }}>{pendingTodos.length} 项待完成</Tag>
                    )}
                </Space>
            }
            size="small"
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                ...style
            }}
            styles={{
                body: {
                    padding: '12px',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }
            }}
        >
            {/* 添加新待办 */}
            <div style={{ marginBottom: '12px' }}>
                <Space.Compact style={{ width: '100%' }}>
                    <Input
                        placeholder="添加新待办..."
                        value={newTodo}
                        onChange={(e) => setNewTodo(e.target.value)}
                        onPressEnter={handleAddTodo}
                        style={{ flex: 1 }}
                    />
                    <Popover
                        content={
                            <DatePicker
                                showTime={{ format: 'HH:mm' }}
                                format="YYYY-MM-DD HH:mm"
                                placeholder="设置提醒"
                                value={reminderDate}
                                onChange={setReminderDate}
                                disabledDate={(current) => current && current < dayjs().startOf('day')}
                            />
                        }
                        trigger="click"
                        title="设置提醒时间"
                    >
                        <Tooltip title="设置提醒">
                            <Button
                                icon={<ClockCircleOutlined />}
                                style={{
                                    color: reminderDate ? '#1890ff' : undefined
                                }}
                            />
                        </Tooltip>
                    </Popover>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleAddTodo}
                    >
                        添加
                    </Button>
                </Space.Compact>
                {reminderDate && (
                    <Text type="secondary" style={{ fontSize: '12px', marginTop: '4px', display: 'block' }}>
                        提醒时间：{reminderDate.format('MM-DD HH:mm')}
                    </Text>
                )}
            </div>

            {/* 待办列表 */}
            <div style={{ flex: 1, overflow: 'auto' }}>
                {todos.length === 0 ? (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="暂无待办事项"
                        style={{ marginTop: '40px' }}
                    />
                ) : (
                    <>
                        {/* 未完成的待办 */}
                        <List
                            size="small"
                            dataSource={pendingTodos}
                            renderItem={(todo) => (
                                <List.Item
                                    key={todo.id}
                                    style={{
                                        padding: '8px 0',
                                        borderBottom: '1px solid var(--border-color)'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'flex-start', width: '100%', gap: '8px' }}>
                                        <Checkbox
                                            checked={todo.completed}
                                            onChange={() => handleToggleComplete(todo.id)}
                                            style={{ marginTop: '4px' }}
                                        />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            {editingId === todo.id ? (
                                                <Space.Compact style={{ width: '100%' }}>
                                                    <Input
                                                        size="small"
                                                        value={editingContent}
                                                        onChange={(e) => setEditingContent(e.target.value)}
                                                        onPressEnter={() => handleSaveEdit(todo.id)}
                                                        autoFocus
                                                    />
                                                    <Button
                                                        size="small"
                                                        type="primary"
                                                        icon={<SaveOutlined />}
                                                        onClick={() => handleSaveEdit(todo.id)}
                                                    />
                                                    <Button
                                                        size="small"
                                                        icon={<CloseOutlined />}
                                                        onClick={handleCancelEdit}
                                                    />
                                                </Space.Compact>
                                            ) : (
                                                <>
                                                    <Text
                                                        style={{
                                                            fontSize: '13px',
                                                            display: 'block',
                                                            wordBreak: 'break-word'
                                                        }}
                                                    >
                                                        {todo.content}
                                                    </Text>
                                                    {todo.reminder && (
                                                        <Space size={4} style={{ marginTop: '4px' }}>
                                                            <BellOutlined style={{ fontSize: '11px', color: '#faad14' }} />
                                                            {formatReminder(todo.reminder)}
                                                        </Space>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                        {editingId !== todo.id && (
                                            <Space size={4}>
                                                <Tooltip title="编辑">
                                                    <Button
                                                        type="text"
                                                        size="small"
                                                        icon={<EditOutlined />}
                                                        onClick={() => handleStartEdit(todo)}
                                                        style={{ color: 'var(--text-secondary)' }}
                                                    />
                                                </Tooltip>
                                                <Popover
                                                    content={renderReminderPopover(todo)}
                                                    trigger="click"
                                                    title="设置提醒"
                                                >
                                                    <Tooltip title="设置提醒">
                                                        <Button
                                                            type="text"
                                                            size="small"
                                                            icon={<BellOutlined />}
                                                            style={{
                                                                color: todo.reminder ? '#faad14' : 'var(--text-secondary)'
                                                            }}
                                                        />
                                                    </Tooltip>
                                                </Popover>
                                                <Tooltip title="删除">
                                                    <Button
                                                        type="text"
                                                        size="small"
                                                        danger
                                                        icon={<DeleteOutlined />}
                                                        onClick={() => handleDelete(todo.id)}
                                                    />
                                                </Tooltip>
                                            </Space>
                                        )}
                                    </div>
                                </List.Item>
                            )}
                        />

                        {/* 已完成的待办 */}
                        {completedTodos.length > 0 && (
                            <>
                                <Text
                                    type="secondary"
                                    style={{
                                        fontSize: '12px',
                                        display: 'block',
                                        margin: '12px 0 8px 0'
                                    }}
                                >
                                    已完成 ({completedTodos.length})
                                </Text>
                                <List
                                    size="small"
                                    dataSource={completedTodos}
                                    renderItem={(todo) => (
                                        <List.Item
                                            key={todo.id}
                                            style={{
                                                padding: '6px 0',
                                                opacity: 0.6
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '8px' }}>
                                                <Checkbox
                                                    checked={todo.completed}
                                                    onChange={() => handleToggleComplete(todo.id)}
                                                />
                                                <Text
                                                    delete
                                                    type="secondary"
                                                    style={{
                                                        flex: 1,
                                                        fontSize: '12px'
                                                    }}
                                                >
                                                    {todo.content}
                                                </Text>
                                                <Button
                                                    type="text"
                                                    size="small"
                                                    danger
                                                    icon={<DeleteOutlined />}
                                                    onClick={() => handleDelete(todo.id)}
                                                />
                                            </div>
                                        </List.Item>
                                    )}
                                />
                            </>
                        )}
                    </>
                )}
            </div>
        </Card>
    );
};

export default TodoList;

