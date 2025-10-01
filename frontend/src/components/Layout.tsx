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
    QuestionCircleOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Text } = Typography;

const { Sider } = AntLayout;

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

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
    ];

    const userMenuItems = [
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: '个人资料',
        },
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
                console.log('打开个人资料');
                // 可以导航到个人资料页面
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
                console.log('打开帮助中心');
                // 可以导航到帮助页面
                break;
            case 'logout':
                console.log('退出登录');
                // 处理退出登录逻辑
                break;
            default:
                break;
        }
    };

    return (
        <div style={{ minHeight: '100vh', position: 'relative' }}>
            {/* 顶部导航栏 - 固定在页面顶部 */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                height: '64px',
                background: '#fff',
                borderBottom: '1px solid #f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 24px',
                zIndex: 1000,
                boxShadow: '0 2px 8px 0 rgba(29,35,41,.05)'
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
                        color: '#1890ff',
                        fontSize: '20px',
                        fontWeight: 600
                    }}>
                        候选人管理系统
                    </h2>
                </div>

                {/* 右侧：个人中心功能区 */}
                <Space size="middle">
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
                                    backgroundColor: '#1890ff',
                                    marginRight: '8px'
                                }}
                            >
                                管
                            </Avatar>
                            <div style={{ textAlign: 'left' }}>
                                <div style={{
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    lineHeight: '20px'
                                }}>
                                    管理员
                                </div>
                                <Text type="secondary" style={{
                                    fontSize: '12px',
                                    lineHeight: '16px'
                                }}>
                                    猎头顾问
                                </Text>
                            </div>
                        </div>
                    </Dropdown>
                </Space>
            </div>

            {/* 侧边栏 - 固定在左侧 */}
            <Sider
                trigger={null}
                collapsible
                collapsed={collapsed}
                style={{
                    position: 'fixed',
                    left: 0,
                    top: '64px',
                    height: 'calc(100vh - 64px)',
                    background: '#fff',
                    boxShadow: '2px 0 8px 0 rgba(29,35,41,.05)',
                    zIndex: 999
                }}
            >
                <Menu
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    items={menuItems}
                    onClick={handleMenuClick}
                    style={{ borderRight: 0, marginTop: '16px' }}
                />
            </Sider>

            {/* 主内容区域 */}
            <div style={{
                marginLeft: collapsed ? '80px' : '200px',
                marginTop: '64px',
                padding: '24px',
                minHeight: 'calc(100vh - 64px)',
                background: '#f5f5f5',
                transition: 'margin-left 0.2s'
            }}>
                <div style={{
                    background: '#fff',
                    borderRadius: '8px',
                    minHeight: 'calc(100vh - 112px)',
                    padding: '24px'
                }}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Layout;
