import React, { useState } from 'react';
import {
    Card,
    Form,
    Input,
    Button,
    Avatar,
    Typography,
    message,
    Row,
    Col,
    Divider,
    Space,
    Tag,
    Modal,
} from 'antd';
import {
    UserOutlined,
    MailOutlined,
    PhoneOutlined,
    EditOutlined,
    LockOutlined,
    CrownOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;

const Profile: React.FC = () => {
    const { user, updateProfile, changePassword } = useAuth();
    const [profileLoading, setProfileLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordModalVisible, setPasswordModalVisible] = useState(false);
    const [profileForm] = Form.useForm();
    const [passwordForm] = Form.useForm();

    // 初始化表单数据
    React.useEffect(() => {
        if (user) {
            profileForm.setFieldsValue({
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                phone: user.phone,
            });
        }
    }, [user, profileForm]);

    const handleProfileUpdate = async (values: any) => {
        try {
            setProfileLoading(true);
            await updateProfile(values);
            message.success('资料更新成功！');
        } catch (error: any) {
            message.error(error.message || '更新失败，请重试');
        } finally {
            setProfileLoading(false);
        }
    };

    const handlePasswordChange = async (values: any) => {
        try {
            setPasswordLoading(true);
            await changePassword(values.old_password, values.new_password);
            message.success('密码修改成功！');
            setPasswordModalVisible(false);
            passwordForm.resetFields();
        } catch (error: any) {
            message.error(error.message || '密码修改失败，请重试');
        } finally {
            setPasswordLoading(false);
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

    if (!user) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <Text type="secondary">用户信息加载中...</Text>
            </div>
        );
    }

    const profileTab = (
        <Row gutter={[24, 24]}>
            <Col xs={24} lg={8}>
                <Card title="个人信息" style={{ height: '100%' }}>
                    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                        <Avatar
                            size={80}
                            icon={<UserOutlined />}
                            style={{ backgroundColor: '#1890ff' }}
                        />
                        <div style={{ marginTop: '16px' }}>
                            <Title level={4} style={{ margin: 0 }}>
                                {user.full_name || user.username}
                            </Title>
                            <Text type="secondary">@{user.username}</Text>
                        </div>
                        <div style={{ marginTop: '16px' }}>
                            {getRoleTag(user.role)}
                            {getStatusTag(user.status)}
                        </div>
                    </div>

                    <Divider />

                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                        <div>
                            <Text strong>用户ID</Text>
                            <br />
                            <Text type="secondary">{user.id}</Text>
                        </div>
                        <div>
                            <Text strong>注册时间</Text>
                            <br />
                            <Text type="secondary">
                                {new Date(user.created_at).toLocaleString('zh-CN')}
                            </Text>
                        </div>
                        {user.last_login && (
                            <div>
                                <Text strong>最后登录</Text>
                                <br />
                                <Text type="secondary">
                                    {new Date(user.last_login).toLocaleString('zh-CN')}
                                </Text>
                            </div>
                        )}
                        <div>
                            <Text strong>登录次数</Text>
                            <br />
                            <Text type="secondary">{user.login_count} 次</Text>
                        </div>
                    </Space>
                </Card>
            </Col>

            <Col xs={24} lg={16}>
                <Card title="编辑资料" extra={<EditOutlined />}>
                    <Form
                        form={profileForm}
                        layout="vertical"
                        onFinish={handleProfileUpdate}
                        autoComplete="off"
                    >
                        <Row gutter={16}>
                            <Col xs={24} sm={12}>
                                <Form.Item
                                    label="用户名"
                                    name="username"
                                    rules={[
                                        { required: true, message: '请输入用户名' },
                                        { min: 3, max: 20, message: '用户名长度为3-20个字符' },
                                        { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字、下划线' },
                                    ]}
                                >
                                    <Input prefix={<UserOutlined />} disabled />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Form.Item
                                    label="邮箱"
                                    name="email"
                                    rules={[
                                        { required: true, message: '请输入邮箱' },
                                        { type: 'email', message: '请输入有效的邮箱地址' },
                                    ]}
                                >
                                    <Input prefix={<MailOutlined />} />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={16}>
                            <Col xs={24} sm={12}>
                                <Form.Item
                                    label="姓名"
                                    name="full_name"
                                    rules={[
                                        { max: 50, message: '姓名长度不能超过50个字符' },
                                    ]}
                                >
                                    <Input prefix={<UserOutlined />} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Form.Item
                                    label="手机号"
                                    name="phone"
                                    rules={[
                                        { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' },
                                    ]}
                                >
                                    <Input prefix={<PhoneOutlined />} />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item>
                            <Space>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={profileLoading}
                                    icon={<EditOutlined />}
                                >
                                    更新资料
                                </Button>
                                <Button
                                    icon={<LockOutlined />}
                                    onClick={() => setPasswordModalVisible(true)}
                                >
                                    修改密码
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Card>
            </Col>
        </Row>
    );

    const passwordModal = (
        <Modal
            title="修改密码"
            open={passwordModalVisible}
            onCancel={() => {
                setPasswordModalVisible(false);
                passwordForm.resetFields();
            }}
            footer={null}
            width={400}
        >
            <Form
                form={passwordForm}
                layout="vertical"
                onFinish={handlePasswordChange}
                autoComplete="off"
            >
                <Form.Item
                    label="当前密码"
                    name="old_password"
                    rules={[
                        { required: true, message: '请输入当前密码' },
                    ]}
                >
                    <Input.Password prefix={<LockOutlined />} />
                </Form.Item>

                <Form.Item
                    label="新密码"
                    name="new_password"
                    rules={[
                        { required: true, message: '请输入新密码' },
                        { min: 6, message: '密码长度至少6位' },
                        { pattern: /^(?=.*[A-Za-z])(?=.*\d)/, message: '密码必须包含字母和数字' },
                    ]}
                >
                    <Input.Password prefix={<LockOutlined />} />
                </Form.Item>

                <Form.Item
                    label="确认新密码"
                    name="confirm_password"
                    dependencies={['new_password']}
                    rules={[
                        { required: true, message: '请确认新密码' },
                        ({ getFieldValue }) => ({
                            validator(_, value) {
                                if (!value || getFieldValue('new_password') === value) {
                                    return Promise.resolve();
                                }
                                return Promise.reject(new Error('两次输入的密码不一致'));
                            },
                        }),
                    ]}
                >
                    <Input.Password prefix={<LockOutlined />} />
                </Form.Item>

                <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                    <Space>
                        <Button onClick={() => setPasswordModalVisible(false)}>
                            取消
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={passwordLoading}
                        >
                            确认修改
                        </Button>
                    </Space>
                </Form.Item>
            </Form>
        </Modal>
    );

    return (
        <div>
            <div style={{ marginBottom: '24px' }}>
                <Title level={2}>个人资料</Title>
                <Text type="secondary">管理您的个人信息和账户设置</Text>
            </div>

            {profileTab}
            {passwordModal}
        </div>
    );
};

export default Profile;
