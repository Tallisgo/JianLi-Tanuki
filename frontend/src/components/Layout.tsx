import React, { useState } from 'react';
import { Layout as AntLayout, Menu, Avatar, Dropdown, Button, Space, Typography } from 'antd';
import {
    DashboardOutlined,
    UserOutlined,
    UploadOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    LogoutOutlined,
    SettingOutlined,
    BellOutlined,
    QuestionCircleOutlined,
    SunOutlined,
    MoonOutlined,
    TeamOutlined,
    CrownOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const { Text } = Typography;

const { Sider } = AntLayout;

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();
    const { user, logout } = useAuth();

    const menuItems = [
        {
            key: '/',
            icon: <DashboardOutlined />,
            label: '仪表板',
        },
        {
            key: '/candidates',
            icon: <UserOutlined />,
            label: '候选人管理',
        },
        {
            key: '/upload',
            icon: <UploadOutlined />,
            label: '简历上传',
        },
        ...(user?.role === 'admin' ? [{
            key: '/users',
            icon: <TeamOutlined />,
            label: '用户管理',
        }] : []),
    ];

    const userMenuItems = [
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: '个人资料',
        },
        ...(user?.role === 'admin' ? [{
            key: 'users',
            icon: <TeamOutlined />,
            label: '用户管理',
        }] : []),
        {
            key: 'settings',
            icon: <SettingOutlined />,
            label: '系统设置',
        },
        {
            key: 'notifications',
            icon: <BellOutlined />,
            label: '消息通知',
        },
        {
            key: 'help',
            icon: <QuestionCircleOutlined />,
            label: '帮助中心',
        },
        {
            type: 'divider' as const,
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: '退出登录',
            danger: true,
        },
    ];

    const handleMenuClick = ({ key }: { key: string }) => {
        navigate(key);
    };

    const handleUserMenuClick = ({ key }: { key: string }) => {
        switch (key) {
            case 'profile':
                navigate('/profile');
                break;
            case 'users':
                navigate('/users');
                break;
            case 'settings':
                console.log('打开系统设置');
                // 可以导航到系统设置页面
                break;
            case 'notifications':
                console.log('打开消息通知');
                // 可以导航到通知页面
                break;
            case 'help':
                navigate('/help');
                break;
            case 'logout':
                logout();
                navigate('/login');
                break;
            default:
                break;
        }
    };

    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            {/* 顶部导航栏 */}
            <div style={{
                height: '64px',
                background: 'var(--header-bg)',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 24px',
                zIndex: 1000,
                boxShadow: 'var(--shadow)',
                flexShrink: 0
            }}>
                {/* 左侧：应用标题和菜单按钮 */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Button
                        type="text"
                        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={() => setCollapsed(!collapsed)}
                        style={{ fontSize: '16px', width: 64, height: 64, marginRight: '16px' }}
                    />
                    <h2 style={{
                        margin: 0,
                        color: 'var(--primary-color)',
                        fontSize: '20px',
                        fontWeight: 600
                    }}>
                        JianLi Tanuki (简狸) 🦝
                    </h2>
                </div>

                {/* 右侧：个人中心功能区 */}
                <Space size="middle">
                    {/* 主题切换按钮 */}
                    <Button
                        type="text"
                        icon={theme === 'light' ? <MoonOutlined /> : <SunOutlined />}
                        onClick={toggleTheme}
                        style={{
                            fontSize: '16px',
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: theme === 'light' ? '#1890ff' : '#faad14'
                        }}
                        title={theme === 'light' ? '切换到暗色主题' : '切换到亮色主题'}
                    />

                    {/* 通知按钮 */}
                    <Button
                        type="text"
                        icon={<BellOutlined />}
                        className="notification-button"
                        style={{
                            fontSize: '16px',
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    />

                    {/* 个人中心下拉菜单 */}
                    <Dropdown
                        menu={{
                            items: userMenuItems,
                            onClick: handleUserMenuClick
                        }}
                        placement="bottomRight"
                        trigger={['click']}
                    >
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'pointer',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            transition: 'all 0.2s',
                            border: '1px solid transparent'
                        }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#f5f5f5';
                                e.currentTarget.style.borderColor = '#d9d9d9';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.borderColor = 'transparent';
                            }}
                        >
                            <Avatar
                                size="small"
                                style={{
                                    backgroundColor: user?.role === 'admin' ? '#f5222d' : '#1890ff',
                                    marginRight: '8px'
                                }}
                            >
                                {user?.role === 'admin' ? <CrownOutlined /> : <UserOutlined />}
                            </Avatar>
                            <div style={{ textAlign: 'left' }}>
                                <div style={{
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    lineHeight: '20px'
                                }}>
                                    {user?.full_name || user?.username || '用户'}
                                </div>
                                <Text type="secondary" style={{
                                    fontSize: '12px',
                                    lineHeight: '16px'
                                }}>
                                    {user?.role === 'admin' ? '管理员' : '普通用户'}
                                </Text>
                            </div>
                        </div>
                    </Dropdown>
                </Space>
            </div>

            {/* 主体区域 */}
            <div style={{
                display: 'flex',
                flex: 1,
                overflow: 'hidden'
            }}>
                {/* 侧边栏 */}
                <Sider
                    trigger={null}
                    collapsible
                    collapsed={collapsed}
                    style={{
                        background: 'var(--sidebar-bg)',
                        boxShadow: 'var(--shadow)',
                        height: '100%'
                    }}
                >
                    <Menu
                        mode="inline"
                        selectedKeys={[location.pathname]}
                        items={menuItems}
                        onClick={handleMenuClick}
                        style={{
                            borderRight: 0,
                            marginTop: '16px',
                            height: '100%'
                        }}
                    />
                </Sider>

                {/* 主内容区域 */}
                <div style={{
                    flex: 1,
                    padding: '24px',
                    background: 'var(--bg-secondary)',
                    overflow: 'auto',
                    height: '100%'
                }}>
                    <div style={{
                        background: 'var(--card-bg)',
                        borderRadius: '12px',
                        minHeight: '100%',
                        padding: '32px',
                        boxShadow: 'var(--shadow)'
                    }}>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Layout;
