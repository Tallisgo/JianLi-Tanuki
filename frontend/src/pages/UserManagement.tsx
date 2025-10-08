import React, { useState, useEffect } from 'react';
import {
    Card,
    Table,
    Button,
    Input,
    Space,
    Tag,
    Avatar,
    Typography,
    message,
    Modal,
    Form,
    Select,
    Row,
    Col,
    Statistic,
    Popconfirm,
    Tooltip
} from 'antd';
import {
    UserOutlined,
    PlusOutlined,
    SearchOutlined,
    EditOutlined,
    DeleteOutlined,
    CrownOutlined,
    ReloadOutlined,
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;
const { Search } = Input;

interface User {
    id: number;
    username: string;
    email: string;
    full_name?: string;
    avatar?: string;
    phone?: string;
    role: string;
    status: string;
    last_login?: string;
    login_count: number;
    created_at: string;
    updated_at?: string;
}

interface UserStats {
    total_users: number;
    admin_users: number;
    regular_users: number;
    user_ratio: {
        admin: number;
        regular: number;
    };
}

const UserManagement: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [searchText, setSearchText] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [modalVisible, setModalVisible] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [form] = Form.useForm();

    // 检查是否为管理员
    const isAdmin = currentUser?.role === 'admin';

    useEffect(() => {
        if (isAdmin) {
            fetchUsers();
            fetchStats();
        }
    }, [isAdmin]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            // 这里应该调用实际的API
            // const response = await apiService.getUsers();
            // setUsers(response.users);

            // 模拟数据
            const mockUsers: User[] = [
                {
                    id: 1,
                    username: 'admin',
                    email: 'admin@jianli-tanuki.com',
                    full_name: '系统管理员',
                    role: 'admin',
                    status: 'active',
                    login_count: 15,
                    created_at: '2024-01-01T00:00:00Z',
                    last_login: '2024-01-15T10:30:00Z'
                },
                {
                    id: 2,
                    username: 'user1',
                    email: 'user1@example.com',
                    full_name: '张三',
                    phone: '13800138000',
                    role: 'user',
                    status: 'active',
                    login_count: 5,
                    created_at: '2024-01-10T00:00:00Z',
                    last_login: '2024-01-14T15:20:00Z'
                }
            ];
            setUsers(mockUsers);
        } catch (error) {
            message.error('获取用户列表失败');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            // 这里应该调用实际的API
            // const response = await apiService.getUserStats();
            // setStats(response.statistics);

            // 模拟数据
            const mockStats: UserStats = {
                total_users: 2,
                admin_users: 1,
                regular_users: 1,
                user_ratio: {
                    admin: 50,
                    regular: 50
                }
            };
            setStats(mockStats);
        } catch (error) {
            message.error('获取统计信息失败');
        }
    };

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        form.setFieldsValue(user);
        setModalVisible(true);
    };

    const handleDeleteUser = async (_userId: number) => {
        try {
            // 这里应该调用实际的API
            // await apiService.deleteUser(userId);
            message.success('用户删除成功');
            fetchUsers();
        } catch (error) {
            message.error('删除用户失败');
        }
    };

    const handleUpdateUser = async (_values: any) => {
        try {
            // 这里应该调用实际的API
            // await apiService.updateUser(editingUser!.id, values);
            message.success('用户更新成功');
            setModalVisible(false);
            setEditingUser(null);
            form.resetFields();
            fetchUsers();
        } catch (error) {
            message.error('更新用户失败');
        }
    };

    const getRoleTag = (role: string) => {
        switch (role) {
            case 'admin':
                return <Tag color="red" icon={<CrownOutlined />}>管理员</Tag>;
            case 'user':
                return <Tag color="blue">普通用户</Tag>;
            default:
                return <Tag>{role}</Tag>;
        }
    };

    const getStatusTag = (status: string) => {
        switch (status) {
            case 'active':
                return <Tag color="green">活跃</Tag>;
            case 'inactive':
                return <Tag color="orange">未激活</Tag>;
            case 'banned':
                return <Tag color="red">已禁用</Tag>;
            default:
                return <Tag>{status}</Tag>;
        }
    };

    const columns = [
        {
            title: '用户',
            key: 'user',
            render: (record: User) => (
                <Space>
                    <Avatar icon={<UserOutlined />} />
                    <div>
                        <div style={{ fontWeight: 500 }}>
                            {record.full_name || record.username}
                        </div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            @{record.username}
                        </Text>
                    </div>
                </Space>
            ),
        },
        {
            title: '邮箱',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: '角色',
            dataIndex: 'role',
            key: 'role',
            render: (role: string) => getRoleTag(role),
            filters: [
                { text: '管理员', value: 'admin' },
                { text: '普通用户', value: 'user' },
            ],
            onFilter: (value: any, record: User) => record.role === value,
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => getStatusTag(status),
            filters: [
                { text: '活跃', value: 'active' },
                { text: '未激活', value: 'inactive' },
                { text: '已禁用', value: 'banned' },
            ],
            onFilter: (value: any, record: User) => record.status === value,
        },
        {
            title: '登录次数',
            dataIndex: 'login_count',
            key: 'login_count',
            sorter: (a: User, b: User) => a.login_count - b.login_count,
        },
        {
            title: '最后登录',
            dataIndex: 'last_login',
            key: 'last_login',
            render: (lastLogin: string) =>
                lastLogin ? new Date(lastLogin).toLocaleString('zh-CN') : '-',
        },
        {
            title: '注册时间',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (createdAt: string) => new Date(createdAt).toLocaleString('zh-CN'),
            sorter: (a: User, b: User) =>
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        },
        {
            title: '操作',
            key: 'actions',
            render: (record: User) => (
                <Space>
                    <Tooltip title="编辑用户">
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => handleEditUser(record)}
                        />
                    </Tooltip>
                    {record.id !== currentUser?.id && (
                        <Tooltip title="删除用户">
                            <Popconfirm
                                title="确定要删除这个用户吗？"
                                onConfirm={() => handleDeleteUser(record.id)}
                                okText="确定"
                                cancelText="取消"
                            >
                                <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                />
                            </Popconfirm>
                        </Tooltip>
                    )}
                </Space>
            ),
        },
    ];

    const filteredUsers = users.filter(user => {
        const matchesSearch = !searchText ||
            user.username.toLowerCase().includes(searchText.toLowerCase()) ||
            user.email.toLowerCase().includes(searchText.toLowerCase()) ||
            (user.full_name && user.full_name.toLowerCase().includes(searchText.toLowerCase()));

        const matchesRole = !roleFilter || user.role === roleFilter;
        const matchesStatus = !statusFilter || user.status === statusFilter;

        return matchesSearch && matchesRole && matchesStatus;
    });

    if (!isAdmin) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <Title level={3}>权限不足</Title>
                <Text type="secondary">您没有权限访问用户管理页面</Text>
            </div>
        );
    }

    return (
        <div>
            <div style={{ marginBottom: '24px' }}>
                <Title level={2}>用户管理</Title>
                <Text type="secondary">管理系统用户和权限</Text>
            </div>

            {/* 统计卡片 */}
            {stats && (
                <Row gutter={16} style={{ marginBottom: '24px' }}>
                    <Col xs={24} sm={8}>
                        <Card>
                            <Statistic
                                title="总用户数"
                                value={stats.total_users}
                                prefix={<UserOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card>
                            <Statistic
                                title="管理员"
                                value={stats.admin_users}
                                prefix={<CrownOutlined />}
                                valueStyle={{ color: '#cf1322' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card>
                            <Statistic
                                title="普通用户"
                                value={stats.regular_users}
                                prefix={<UserOutlined />}
                                valueStyle={{ color: '#1890ff' }}
                            />
                        </Card>
                    </Col>
                </Row>
            )}

            {/* 用户列表 */}
            <Card>
                <div style={{ marginBottom: '16px' }}>
                    <Row gutter={16} align="middle">
                        <Col flex="auto">
                            <Space>
                                <Search
                                    placeholder="搜索用户..."
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                    style={{ width: 200 }}
                                    prefix={<SearchOutlined />}
                                />
                                <Select
                                    placeholder="角色筛选"
                                    value={roleFilter}
                                    onChange={setRoleFilter}
                                    style={{ width: 120 }}
                                    allowClear
                                >
                                    <Select.Option value="admin">管理员</Select.Option>
                                    <Select.Option value="user">普通用户</Select.Option>
                                </Select>
                                <Select
                                    placeholder="状态筛选"
                                    value={statusFilter}
                                    onChange={setStatusFilter}
                                    style={{ width: 120 }}
                                    allowClear
                                >
                                    <Select.Option value="active">活跃</Select.Option>
                                    <Select.Option value="inactive">未激活</Select.Option>
                                    <Select.Option value="banned">已禁用</Select.Option>
                                </Select>
                            </Space>
                        </Col>
                        <Col>
                            <Space>
                                <Button
                                    icon={<ReloadOutlined />}
                                    onClick={fetchUsers}
                                    loading={loading}
                                >
                                    刷新
                                </Button>
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={() => {
                                        setEditingUser(null);
                                        form.resetFields();
                                        setModalVisible(true);
                                    }}
                                >
                                    添加用户
                                </Button>
                            </Space>
                        </Col>
                    </Row>
                </div>

                <Table
                    columns={columns}
                    dataSource={filteredUsers}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                            `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                    }}
                />
            </Card>

            {/* 编辑用户模态框 */}
            <Modal
                title={editingUser ? '编辑用户' : '添加用户'}
                open={modalVisible}
                onCancel={() => {
                    setModalVisible(false);
                    setEditingUser(null);
                    form.resetFields();
                }}
                footer={null}
                width={600}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleUpdateUser}
                    autoComplete="off"
                >
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                label="用户名"
                                name="username"
                                rules={[
                                    { required: true, message: '请输入用户名' },
                                    { min: 3, max: 20, message: '用户名长度为3-20个字符' },
                                ]}
                            >
                                <Input disabled={!!editingUser} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label="邮箱"
                                name="email"
                                rules={[
                                    { required: true, message: '请输入邮箱' },
                                    { type: 'email', message: '请输入有效的邮箱地址' },
                                ]}
                            >
                                <Input />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                label="姓名"
                                name="full_name"
                            >
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label="手机号"
                                name="phone"
                            >
                                <Input />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                label="角色"
                                name="role"
                                rules={[{ required: true, message: '请选择角色' }]}
                            >
                                <Select>
                                    <Select.Option value="user">普通用户</Select.Option>
                                    <Select.Option value="admin">管理员</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label="状态"
                                name="status"
                                rules={[{ required: true, message: '请选择状态' }]}
                            >
                                <Select>
                                    <Select.Option value="active">活跃</Select.Option>
                                    <Select.Option value="inactive">未激活</Select.Option>
                                    <Select.Option value="banned">已禁用</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    {!editingUser && (
                        <Form.Item
                            label="密码"
                            name="password"
                            rules={[
                                { required: true, message: '请输入密码' },
                                { min: 6, message: '密码长度至少6位' },
                            ]}
                        >
                            <Input.Password />
                        </Form.Item>
                    )}

                    <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                        <Space>
                            <Button onClick={() => setModalVisible(false)}>
                                取消
                            </Button>
                            <Button type="primary" htmlType="submit">
                                {editingUser ? '更新' : '创建'}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default UserManagement;
