import React, { useState, useEffect } from 'react';
import { Layout as AntLayout, Menu, Avatar, Dropdown, Button, Space, Typography, Badge, Popover, List, Empty } from 'antd';
import {
    DashboardOutlined,
    UserOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    LogoutOutlined,
    SettingOutlined,
    BellOutlined,
    QuestionCircleOutlined,
    SunOutlined,
    MoonOutlined,
    TeamOutlined,
    CrownOutlined,
    LaptopOutlined,
    AntDesignOutlined,
    RiseOutlined,
    ShakeOutlined,
    UsergroupAddOutlined,
    DollarOutlined,
    FileTextOutlined,
    ToolOutlined,
    CheckCircleOutlined,
    InfoCircleOutlined,
    WarningOutlined,
    CloseCircleOutlined,
    DeleteOutlined,
    EyeOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications, type NotificationItem } from '../contexts/NotificationContext';
import PositionCategoryManager from './PositionCategoryManager';

const { Text } = Typography;

const { Sider } = AntLayout;

interface LayoutProps {
    children: React.ReactNode;
}

interface PositionCategory {
    id: string;
    name: string;
    key: string;
    icon: string;
    color: string;
    keywords: string[];
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const [collapsed, setCollapsed] = useState(false);
    const [positionCategories, setPositionCategories] = useState<PositionCategory[]>([]);
    const [categoryManagerVisible, setCategoryManagerVisible] = useState(false);
    const [openKeys, setOpenKeys] = useState<string[]>([]);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();
    const { user, logout } = useAuth();
    const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, clearAll } = useNotifications();

    // 获取通知图标
    const getNotificationIcon = (type: NotificationItem['type']) => {
        switch (type) {
            case 'success': return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
            case 'warning': return <WarningOutlined style={{ color: '#faad14' }} />;
            case 'error': return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
            default: return <InfoCircleOutlined style={{ color: '#1890ff' }} />;
        }
    };

    // 格式化时间
    const formatTime = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - new Date(date).getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return '刚刚';
        if (minutes < 60) return `${minutes}分钟前`;
        if (hours < 24) return `${hours}小时前`;
        if (days < 7) return `${days}天前`;
        return new Date(date).toLocaleDateString();
    };

    // 处理通知点击
    const handleNotificationClick = (item: NotificationItem) => {
        markAsRead(item.id);
        if (item.candidateId) {
            setNotificationOpen(false);
            navigate(`/candidates/${item.candidateId}`);
        }
    };

    // 通知面板内容
    const notificationContent = (
        <div style={{ width: 360 }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                borderBottom: '1px solid var(--border-color)'
            }}>
                <span style={{ fontWeight: 600, fontSize: '15px' }}>消息通知</span>
                <Space size="small">
                    {unreadCount > 0 && (
                        <Button type="link" size="small" onClick={markAllAsRead}>
                            全部已读
                        </Button>
                    )}
                    {notifications.length > 0 && (
                        <Button type="link" size="small" danger onClick={clearAll}>
                            清空
                        </Button>
                    )}
                </Space>
            </div>
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="暂无消息"
                        style={{ padding: '40px 0' }}
                    />
                ) : (
                    <List
                        dataSource={notifications}
                        renderItem={(item) => (
                            <List.Item
                                style={{
                                    padding: '12px 16px',
                                    cursor: item.candidateId ? 'pointer' : 'default',
                                    backgroundColor: item.read ? 'transparent' : 'var(--bg-secondary)',
                                    borderBottom: '1px solid var(--border-color)'
                                }}
                                onClick={() => handleNotificationClick(item)}
                            >
                                <List.Item.Meta
                                    avatar={getNotificationIcon(item.type)}
                                    title={
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{
                                                fontWeight: item.read ? 400 : 600,
                                                fontSize: '13px'
                                            }}>
                                                {item.title}
                                            </span>
                                            <Space size={4}>
                                                {item.candidateId && (
                                                    <Button
                                                        type="text"
                                                        size="small"
                                                        icon={<EyeOutlined />}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleNotificationClick(item);
                                                        }}
                                                        style={{ fontSize: '12px', color: 'var(--primary-color)' }}
                                                    />
                                                )}
                                                <Button
                                                    type="text"
                                                    size="small"
                                                    icon={<DeleteOutlined />}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeNotification(item.id);
                                                    }}
                                                    style={{ fontSize: '12px', color: 'var(--text-secondary)' }}
                                                />
                                            </Space>
                                        </div>
                                    }
                                    description={
                                        <div>
                                            <div style={{
                                                fontSize: '12px',
                                                color: 'var(--text-secondary)',
                                                marginBottom: 4
                                            }}>
                                                {item.message}
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                                                {formatTime(item.time)}
                                            </div>
                                        </div>
                                    }
                                />
                            </List.Item>
                        )}
                    />
                )}
            </div>
            {notifications.length > 0 && (
                <div style={{
                    padding: '8px 16px',
                    textAlign: 'center',
                    borderTop: '1px solid var(--border-color)'
                }}>
                    <Button
                        type="link"
                        size="small"
                        onClick={() => {
                            setNotificationOpen(false);
                            navigate('/candidates');
                        }}
                    >
                        查看全部候选人
                    </Button>
                </div>
            )}
        </div>
    );

    // 默认职位分类
    const defaultCategories: PositionCategory[] = [
        {
            id: 'tech',
            name: '技术开发',
            key: 'tech',
            icon: 'LaptopOutlined',
            color: '#1890ff',
            keywords: ['开发', '工程师', '程序员', '架构师', '技术', '前端', '后端', '全栈', '移动端', 'iOS', 'Android', 'Java', 'Python', 'JavaScript', 'React', 'Vue', 'Node.js', 'Spring', 'Django', 'Flask', 'Go', 'C++', 'C#', '.NET', 'PHP', 'Ruby', 'Swift', 'Kotlin', 'TypeScript', 'Angular', 'Vue.js', '小程序', 'H5', 'Web', 'App', 'API', '微服务', 'DevOps', '运维', '测试', 'QA', '自动化', '性能', '算法', '数据结构', '机器学习', 'AI', '人工智能', '大数据', '云计算', '区块链', '物联网', 'IoT']
        },
        {
            id: 'design',
            name: '产品设计',
            key: 'design',
            icon: 'AntDesignOutlined',
            color: '#52c41a',
            keywords: ['产品', '设计', 'UI', 'UX', '交互', '视觉', '平面', '美工', '设计师', '产品经理', 'PM', '原型', 'Figma', 'Sketch', 'Photoshop', 'Illustrator', 'Axure', '墨刀', '蓝湖', '用户体验', '用户研究', '需求分析', '竞品分析', '产品规划', '产品运营', '增长', '数据产品', 'B端产品', 'C端产品']
        },
        {
            id: 'marketing',
            name: '运营推广',
            key: 'marketing',
            icon: 'RiseOutlined',
            color: '#fa8c16',
            keywords: ['运营', '推广', '营销', '市场', '新媒体', '内容', '编辑', '文案', '策划', '活动', '品牌', '公关', 'SEO', 'SEM', '广告', '投放', '转化', '用户运营', '社群', '直播', '短视频', '抖音', '快手', '小红书', '微博', '微信', '公众号', '小程序', '电商', '淘宝', '京东', '拼多多', '增长黑客', '裂变', '获客', '留存', '活跃', '付费']
        },
        {
            id: 'sales',
            name: '销售商务',
            key: 'sales',
            icon: 'ShakeOutlined',
            color: '#eb2f96',
            keywords: ['销售', '商务', '客户', 'BD', '渠道', '代理商', '经销商', '招商', '合作', '商务拓展', '客户经理', '销售经理', '大客户', 'KA', '渠道经理', '区域经理', '城市经理', '业务员', '销售代表', '客户代表', '商务代表', '招商经理', '合作经理', 'BD经理', '销售总监', '商务总监', '销售VP', '商务VP']
        },
        {
            id: 'hr',
            name: '人力资源',
            key: 'hr',
            icon: 'UsergroupAddOutlined',
            color: '#722ed1',
            keywords: ['人事', 'HR', '招聘', '培训', '薪酬', '绩效', '员工关系', '组织发展', '人才发展', '招聘经理', '招聘专员', 'HRBP', 'HRD', 'CHO', '人事经理', '人事专员', '培训经理', '培训师', '薪酬福利', '绩效考核', '员工关系', '劳动关系', '社保', '公积金', '福利', '企业文化', '组织架构', '人才盘点', '继任计划']
        },
        {
            id: 'finance',
            name: '财务金融',
            key: 'finance',
            icon: 'DollarOutlined',
            color: '#13c2c2',
            keywords: ['财务', '会计', '出纳', '审计', '税务', '成本', '预算', '资金', '投资', '融资', '风控', '合规', '财务经理', '财务总监', 'CFO', '会计经理', '总账会计', '成本会计', '税务会计', '出纳', '审计经理', '内审', '外审', '财务分析', '财务规划', '资金管理', '投资管理', '风险管理', '合规管理', '财务BP']
        },
        {
            id: 'admin',
            name: '管理行政',
            key: 'admin',
            icon: 'FileTextOutlined',
            color: '#faad14',
            keywords: ['管理', '行政', '助理', '秘书', '文员', '前台', '后勤', '总务', '办公室', '总经理', '副总', '总监', '经理', '主管', '组长', '团队', '项目管理', 'PMO', '流程', '制度', '规范', '标准', '质量', 'ISO', '内控', '法务', '合规', '风险', '安全', '环保', '社会责任', 'CSR']
        },
        {
            id: 'other',
            name: '其他职位',
            key: 'other',
            icon: 'ToolOutlined',
            color: '#8c8c8c',
            keywords: ['其他', '未分类', '待定', '实习', '兼职', '临时', '外包', '咨询', '顾问', '专家', '学者', '研究员', '分析师', '翻译', '客服', '售后', '技术支持', '运维', 'DBA', '系统管理员', '网络工程师', '安全工程师', '测试工程师', '质量工程师', '工艺工程师', '生产', '制造', '供应链', '采购', '物流', '仓储', '配送']
        }
    ];

    // 初始化职位分类
    useEffect(() => {
        const savedCategories = localStorage.getItem('positionCategories');
        if (savedCategories) {
            try {
                setPositionCategories(JSON.parse(savedCategories));
            } catch (error) {
                console.error('解析职位分类数据失败:', error);
                setPositionCategories(defaultCategories);
            }
        } else {
            setPositionCategories(defaultCategories);
        }
    }, []);

    // 保存职位分类到本地存储
    const handleSaveCategories = (categories: PositionCategory[]) => {
        setPositionCategories(categories);
        localStorage.setItem('positionCategories', JSON.stringify(categories));
    };

    // 根据职位分类生成菜单项
    const generateCategoryMenuItems = () => {
        return positionCategories.map(category => ({
            key: `/candidates/${category.key}`,
            label: category.name,
            icon: getIconComponent(category.icon)
        }));
    };

    // 获取图标组件
    const getIconComponent = (iconName: string) => {
        const iconMap: Record<string, React.ReactNode> = {
            'LaptopOutlined': <LaptopOutlined />,
            'AntDesignOutlined': <AntDesignOutlined />,
            'RiseOutlined': <RiseOutlined />,
            'ShakeOutlined': <ShakeOutlined />,
            'UsergroupAddOutlined': <UsergroupAddOutlined />,
            'DollarOutlined': <DollarOutlined />,
            'FileTextOutlined': <FileTextOutlined />,
            'ToolOutlined': <ToolOutlined />
        };
        return iconMap[iconName] || <UserOutlined />;
    };

    const menuItems = [
        {
            key: '/',
            icon: <DashboardOutlined />,
            label: '仪表板',
        },
        {
            key: 'candidates-group',
            icon: <UserOutlined />,
            label: (
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        navigate('/candidates');
                    }}
                    style={{ cursor: 'pointer' }}
                >
                    候选人管理
                </div>
            ),
            children: [
                {
                    key: '/candidates',
                    label: '全部候选人',
                },
                ...generateCategoryMenuItems(),
                {
                    key: 'manage-categories',
                    label: '管理分类',
                    icon: <SettingOutlined />
                }
            ],
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
        if (key === 'manage-categories') {
            setCategoryManagerVisible(true);
        } else if (key === 'candidates-group') {
            // 点击候选人管理父菜单时，导航到全部候选人页面
            navigate('/candidates');
        } else {
            navigate(key);
        }
    };

    // 获取当前选中的菜单项
    const getSelectedKeys = () => {
        const path = location.pathname;
        if (path.startsWith('/candidates')) {
            return [path];
        }
        return [path];
    };

    // 处理菜单展开/收起
    const handleOpenChange = (keys: string[]) => {
        setOpenKeys(keys);
    };

    // 初始化展开状态
    useEffect(() => {
        const path = location.pathname;
        if (path.startsWith('/candidates')) {
            setOpenKeys(['candidates-group']);
        }
    }, [location.pathname]);

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
                    <Popover
                        content={notificationContent}
                        trigger="click"
                        open={notificationOpen}
                        onOpenChange={setNotificationOpen}
                        placement="bottomRight"
                        arrow={false}
                        overlayStyle={{ padding: 0 }}
                        overlayInnerStyle={{
                            padding: 0,
                            borderRadius: '8px',
                            boxShadow: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)'
                        }}
                    >
                        <Badge count={unreadCount} size="small" offset={[-2, 2]}>
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
                        </Badge>
                    </Popover>

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
                        selectedKeys={getSelectedKeys()}
                        openKeys={openKeys}
                        onOpenChange={handleOpenChange}
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

            {/* 职位分类管理组件 */}
            <PositionCategoryManager
                visible={categoryManagerVisible}
                onClose={() => setCategoryManagerVisible(false)}
                onSave={handleSaveCategories}
                categories={positionCategories}
            />
        </div>
    );
};

export default Layout;
