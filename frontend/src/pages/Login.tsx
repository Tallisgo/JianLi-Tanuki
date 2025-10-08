import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, message, Tabs } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const { Title, Text } = Typography;

const Login: React.FC = () => {
    const [loginLoading, setLoginLoading] = useState(false);
    const [registerLoading, setRegisterLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('login');
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);

    const { login, register } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = (location.state as any)?.from?.pathname || '/';

    // 检测屏幕尺寸
    useEffect(() => {
        const checkScreenSize = () => {
            const width = window.innerWidth;
            setIsMobile(width < 768);
            setIsTablet(width >= 768 && width < 1024);
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);

        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const handleLogin = async (values: any) => {
        try {
            setLoginLoading(true);
            await login(values.username_or_email, values.password);
            message.success('登录成功！');
            navigate(from, { replace: true });
        } catch (error: any) {
            message.error(error.message || '登录失败，请重试');
        } finally {
            setLoginLoading(false);
        }
    };

    const handleRegister = async (values: any) => {
        try {
            setRegisterLoading(true);
            await register(
                values.username,
                values.email,
                values.password,
                values.full_name,
                values.phone
            );
            message.success('注册成功！请登录');
            setActiveTab('login');
        } catch (error: any) {
            message.error(error.message || '注册失败，请重试');
        } finally {
            setRegisterLoading(false);
        }
    };

    const loginForm = (
        <Form
            name="login"
            onFinish={handleLogin}
            autoComplete="off"
            size="large"
        >
            <Form.Item
                name="username_or_email"
                rules={[
                    { required: true, message: '请输入用户名或邮箱' },
                ]}
            >
                <Input
                    prefix={<UserOutlined />}
                    placeholder="用户名或邮箱"
                />
            </Form.Item>

            <Form.Item
                name="password"
                rules={[
                    { required: true, message: '请输入密码' },
                ]}
            >
                <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="密码"
                />
            </Form.Item>

            <Form.Item>
                <Button
                    type="primary"
                    htmlType="submit"
                    loading={loginLoading}
                    block
                >
                    登录
                </Button>
            </Form.Item>
        </Form>
    );

    const registerForm = (
        <Form
            name="register"
            onFinish={handleRegister}
            autoComplete="off"
            size="large"
        >
            <Form.Item
                name="username"
                rules={[
                    { required: true, message: '请输入用户名' },
                    { min: 3, max: 20, message: '用户名长度为3-20个字符' },
                    { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字、下划线' },
                ]}
            >
                <Input
                    prefix={<UserOutlined />}
                    placeholder="用户名"
                />
            </Form.Item>

            <Form.Item
                name="email"
                rules={[
                    { required: true, message: '请输入邮箱' },
                    { type: 'email', message: '请输入有效的邮箱地址' },
                ]}
            >
                <Input
                    prefix={<MailOutlined />}
                    placeholder="邮箱"
                />
            </Form.Item>

            <Form.Item
                name="full_name"
                rules={[
                    { max: 50, message: '姓名长度不能超过50个字符' },
                ]}
            >
                <Input
                    prefix={<UserOutlined />}
                    placeholder="姓名（可选）"
                />
            </Form.Item>

            <Form.Item
                name="phone"
                rules={[
                    { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' },
                ]}
            >
                <Input
                    prefix={<PhoneOutlined />}
                    placeholder="手机号（可选）"
                />
            </Form.Item>

            <Form.Item
                name="password"
                rules={[
                    { required: true, message: '请输入密码' },
                    { min: 6, message: '密码长度至少6位' },
                    { pattern: /^(?=.*[A-Za-z])(?=.*\d)/, message: '密码必须包含字母和数字' },
                ]}
            >
                <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="密码"
                />
            </Form.Item>

            <Form.Item
                name="confirm_password"
                dependencies={['password']}
                rules={[
                    { required: true, message: '请确认密码' },
                    ({ getFieldValue }) => ({
                        validator(_, value) {
                            if (!value || getFieldValue('password') === value) {
                                return Promise.resolve();
                            }
                            return Promise.reject(new Error('两次输入的密码不一致'));
                        },
                    }),
                ]}
            >
                <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="确认密码"
                />
            </Form.Item>

            <Form.Item>
                <Button
                    type="primary"
                    htmlType="submit"
                    loading={registerLoading}
                    block
                >
                    注册
                </Button>
            </Form.Item>
        </Form>
    );

    // 响应式样式
    const containerStyle = {
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: isMobile ? 'flex-start' : 'center',
        justifyContent: 'center',
        padding: isMobile ? '10px' : '20px',
        position: 'relative' as const,
        overflow: isMobile ? 'auto' : 'hidden'
    };

    const mainContentStyle: React.CSSProperties = {
        width: '100%',
        maxWidth: isMobile ? '100%' : isTablet ? '800px' : '1000px',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: isMobile ? '20px' : isTablet ? '40px' : '80px',
        zIndex: 10,
        marginTop: isMobile ? '20px' : '0'
    };

    const brandSectionStyle: React.CSSProperties = {
        flex: isMobile ? 'none' : '0 0 500px',
        width: isMobile ? '100%' : 'auto',
        color: 'white',
        textAlign: isMobile ? 'center' : 'left',
        order: isMobile ? 2 : 1
    };

    const loginSectionStyle = {
        flex: isMobile ? 'none' : '0 0 auto',
        width: isMobile ? '100%' : '420px',
        maxWidth: isMobile ? '400px' : '420px',
        order: isMobile ? 1 : 2
    };

    const cardStyle = {
        width: '100%',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
        borderRadius: isMobile ? '16px' : '20px',
        border: 'none',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)'
    };

    const cardBodyStyle = {
        padding: isMobile ? '24px' : '48px'
    };

    return (
        <div style={containerStyle}>
            {/* 背景装饰 - 移动端简化 */}
            {!isMobile && (
                <>
                    <div style={{
                        position: 'absolute',
                        top: '10%',
                        left: '10%',
                        width: '200px',
                        height: '200px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '50%',
                        filter: 'blur(40px)'
                    }} />
                    <div style={{
                        position: 'absolute',
                        bottom: '10%',
                        right: '10%',
                        width: '300px',
                        height: '300px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '50%',
                        filter: 'blur(60px)'
                    }} />
                </>
            )}

            {/* 主要内容区域 */}
            <div style={mainContentStyle}>
                {/* 品牌介绍区域 */}
                <div style={brandSectionStyle}>
                    <Title level={1} style={{
                        color: 'white',
                        marginBottom: isMobile ? '16px' : '24px',
                        fontSize: isMobile ? '32px' : isTablet ? '40px' : '48px',
                        fontWeight: 700,
                        textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                    }}>
                        JianLi Tanuki 🦝
                    </Title>

                    <Text style={{
                        fontSize: isMobile ? '18px' : isTablet ? '20px' : '24px',
                        color: 'rgba(255, 255, 255, 0.95)',
                        display: 'block',
                        marginBottom: isMobile ? '12px' : '20px',
                        fontWeight: 500
                    }}>
                        🚀 智能简历解析系统
                    </Text>

                    <Text style={{
                        fontSize: isMobile ? '14px' : '18px',
                        color: 'rgba(255, 255, 255, 0.85)',
                        display: 'block',
                        marginBottom: isMobile ? '20px' : '40px',
                        lineHeight: '1.6'
                    }}>
                        让AI助力您的招聘工作<br />
                        快速解析简历，智能匹配候选人<br />
                        提升招聘效率，让人才发现更简单
                    </Text>

                    {/* 功能特色 - 移动端简化显示 */}
                    {!isMobile && (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '20px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{
                                    fontSize: '32px',
                                    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
                                }}>📄</div>
                                <div>
                                    <Text style={{
                                        color: 'rgba(255, 255, 255, 0.95)',
                                        fontSize: '18px',
                                        fontWeight: 500,
                                        display: 'block'
                                    }}>
                                        智能解析
                                    </Text>
                                    <Text style={{
                                        color: 'rgba(255, 255, 255, 0.7)',
                                        fontSize: '14px'
                                    }}>
                                        自动提取简历关键信息
                                    </Text>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{
                                    fontSize: '32px',
                                    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
                                }}>🎯</div>
                                <div>
                                    <Text style={{
                                        color: 'rgba(255, 255, 255, 0.95)',
                                        fontSize: '18px',
                                        fontWeight: 500,
                                        display: 'block'
                                    }}>
                                        精准匹配
                                    </Text>
                                    <Text style={{
                                        color: 'rgba(255, 255, 255, 0.7)',
                                        fontSize: '14px'
                                    }}>
                                        智能推荐合适候选人
                                    </Text>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{
                                    fontSize: '32px',
                                    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
                                }}>📊</div>
                                <div>
                                    <Text style={{
                                        color: 'rgba(255, 255, 255, 0.95)',
                                        fontSize: '18px',
                                        fontWeight: 500,
                                        display: 'block'
                                    }}>
                                        数据分析
                                    </Text>
                                    <Text style={{
                                        color: 'rgba(255, 255, 255, 0.7)',
                                        fontSize: '14px'
                                    }}>
                                        深度洞察招聘趋势
                                    </Text>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 移动端功能特色 - 横向显示 */}
                    {isMobile && (
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '20px',
                            marginTop: '20px'
                        }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '24px', marginBottom: '4px' }}>📄</div>
                                <Text style={{
                                    color: 'rgba(255, 255, 255, 0.9)',
                                    fontSize: '12px'
                                }}>
                                    智能解析
                                </Text>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '24px', marginBottom: '4px' }}>🎯</div>
                                <Text style={{
                                    color: 'rgba(255, 255, 255, 0.9)',
                                    fontSize: '12px'
                                }}>
                                    精准匹配
                                </Text>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '24px', marginBottom: '4px' }}>📊</div>
                                <Text style={{
                                    color: 'rgba(255, 255, 255, 0.9)',
                                    fontSize: '12px'
                                }}>
                                    数据分析
                                </Text>
                            </div>
                        </div>
                    )}
                </div>

                {/* 登录区域 */}
                <div style={loginSectionStyle}>
                    <Card
                        style={cardStyle}
                        styles={{ body: cardBodyStyle }}
                    >
                        <div style={{ textAlign: 'center', marginBottom: isMobile ? '24px' : '32px' }}>
                            <Title level={3} style={{
                                margin: 0,
                                color: '#1890ff',
                                fontSize: isMobile ? '20px' : '24px',
                                fontWeight: 600
                            }}>
                                欢迎回来
                            </Title>
                            <Text type="secondary" style={{
                                fontSize: isMobile ? '12px' : '14px',
                                color: '#666'
                            }}>
                                请登录您的账户
                            </Text>
                        </div>

                        <Tabs
                            activeKey={activeTab}
                            onChange={setActiveTab}
                            centered
                            size={isMobile ? 'middle' : 'large'}
                            items={[
                                {
                                    key: 'login',
                                    label: '登录',
                                    children: loginForm,
                                },
                                {
                                    key: 'register',
                                    label: '注册',
                                    children: registerForm,
                                },
                            ]}
                        />
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Login;