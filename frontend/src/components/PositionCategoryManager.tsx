import React, { useState } from 'react';
import {
    Modal,
    Form,
    Input,
    Button,
    Space,
    message,
    Popconfirm,
    Tooltip,
    Tag
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    ArrowUpOutlined,
    ArrowDownOutlined,
    LaptopOutlined,
    AntDesignOutlined,
    RiseOutlined,
    ShakeOutlined,
    UsergroupAddOutlined,
    DollarOutlined,
    FileTextOutlined,
    ToolOutlined,
    CodeOutlined,
    BankOutlined,
    ShopOutlined,
    CustomerServiceOutlined,
    BookOutlined,
    MedicineBoxOutlined,
    CarOutlined,
    GlobalOutlined,
    SafetyOutlined,
    ExperimentOutlined,
    CameraOutlined,
    SoundOutlined,
    RocketOutlined,
    TrophyOutlined,
    HeartOutlined,
    ThunderboltOutlined,
    AppstoreOutlined,
    CloudOutlined,
    DatabaseOutlined,
    ApiOutlined,
    BulbOutlined,
    HomeOutlined,
    EnvironmentOutlined,
    PhoneOutlined,
    MailOutlined,
    StarOutlined,
    FlagOutlined,
    FireOutlined,
    CoffeeOutlined,
    GiftOutlined,
    SmileOutlined,
    TeamOutlined
} from '@ant-design/icons';

interface PositionCategory {
    id: string;
    name: string;
    key: string;
    icon: string;
    color: string;
    keywords: string[];
}

interface PositionCategoryManagerProps {
    visible: boolean;
    onClose: () => void;
    onSave: (categories: PositionCategory[]) => void;
    categories: PositionCategory[];
}

const AVAILABLE_ICONS: { name: string; icon: React.ReactNode; label: string }[] = [
    { name: 'LaptopOutlined', icon: <LaptopOutlined />, label: '电脑' },
    { name: 'CodeOutlined', icon: <CodeOutlined />, label: '代码' },
    { name: 'AntDesignOutlined', icon: <AntDesignOutlined />, label: '设计' },
    { name: 'BulbOutlined', icon: <BulbOutlined />, label: '创意' },
    { name: 'RiseOutlined', icon: <RiseOutlined />, label: '增长' },
    { name: 'ShakeOutlined', icon: <ShakeOutlined />, label: '社交' },
    { name: 'UsergroupAddOutlined', icon: <UsergroupAddOutlined />, label: '人员' },
    { name: 'TeamOutlined', icon: <TeamOutlined />, label: '团队' },
    { name: 'DollarOutlined', icon: <DollarOutlined />, label: '财务' },
    { name: 'BankOutlined', icon: <BankOutlined />, label: '银行' },
    { name: 'FileTextOutlined', icon: <FileTextOutlined />, label: '文件' },
    { name: 'ToolOutlined', icon: <ToolOutlined />, label: '工具' },
    { name: 'ShopOutlined', icon: <ShopOutlined />, label: '商店' },
    { name: 'CustomerServiceOutlined', icon: <CustomerServiceOutlined />, label: '客服' },
    { name: 'BookOutlined', icon: <BookOutlined />, label: '教育' },
    { name: 'MedicineBoxOutlined', icon: <MedicineBoxOutlined />, label: '医疗' },
    { name: 'CarOutlined', icon: <CarOutlined />, label: '交通' },
    { name: 'GlobalOutlined', icon: <GlobalOutlined />, label: '国际' },
    { name: 'SafetyOutlined', icon: <SafetyOutlined />, label: '安全' },
    { name: 'ExperimentOutlined', icon: <ExperimentOutlined />, label: '研究' },
    { name: 'CameraOutlined', icon: <CameraOutlined />, label: '媒体' },
    { name: 'SoundOutlined', icon: <SoundOutlined />, label: '音频' },
    { name: 'RocketOutlined', icon: <RocketOutlined />, label: '快速' },
    { name: 'TrophyOutlined', icon: <TrophyOutlined />, label: '成就' },
    { name: 'HeartOutlined', icon: <HeartOutlined />, label: '关爱' },
    { name: 'ThunderboltOutlined', icon: <ThunderboltOutlined />, label: '能源' },
    { name: 'AppstoreOutlined', icon: <AppstoreOutlined />, label: '应用' },
    { name: 'CloudOutlined', icon: <CloudOutlined />, label: '云端' },
    { name: 'DatabaseOutlined', icon: <DatabaseOutlined />, label: '数据' },
    { name: 'ApiOutlined', icon: <ApiOutlined />, label: 'API' },
    { name: 'HomeOutlined', icon: <HomeOutlined />, label: '家居' },
    { name: 'EnvironmentOutlined', icon: <EnvironmentOutlined />, label: '地理' },
    { name: 'PhoneOutlined', icon: <PhoneOutlined />, label: '通讯' },
    { name: 'MailOutlined', icon: <MailOutlined />, label: '邮件' },
    { name: 'StarOutlined', icon: <StarOutlined />, label: '收藏' },
    { name: 'FlagOutlined', icon: <FlagOutlined />, label: '标记' },
    { name: 'FireOutlined', icon: <FireOutlined />, label: '热门' },
    { name: 'CoffeeOutlined', icon: <CoffeeOutlined />, label: '休闲' },
    { name: 'GiftOutlined', icon: <GiftOutlined />, label: '礼物' },
    { name: 'SmileOutlined', icon: <SmileOutlined />, label: '满意' },
];

const PRESET_COLORS = [
    '#1890ff', '#52c41a', '#fa8c16', '#eb2f96',
    '#722ed1', '#13c2c2', '#faad14', '#f5222d',
    '#2f54eb', '#a0d911', '#fa541c', '#9254de',
    '#36cfc9', '#ffc53d', '#ff7a45', '#597ef7',
    '#73d13d', '#ff85c0', '#8c8c8c', '#bfbfbf',
];

const PositionCategoryManager: React.FC<PositionCategoryManagerProps> = ({
    visible,
    onClose,
    onSave,
    categories
}) => {
    const [form] = Form.useForm();
    const [editingCategory, setEditingCategory] = useState<PositionCategory | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [localCategories, setLocalCategories] = useState<PositionCategory[]>(categories);
    const [selectedIcon, setSelectedIcon] = useState<string>('LaptopOutlined');
    const [selectedColor, setSelectedColor] = useState<string>('#1890ff');

    const defaultCategories: PositionCategory[] = [
        { id: 'tech', name: '技术开发', key: 'tech', icon: 'LaptopOutlined', color: '#1890ff', keywords: ['开发', '工程师', '程序员', '架构师', '技术', '前端', '后端', '全栈', '移动端', 'iOS', 'Android', 'Java', 'Python', 'JavaScript', 'React', 'Vue', 'Node.js', 'Go', 'C++', 'DevOps', '运维', '测试', 'QA', '算法', 'AI', '人工智能', '大数据', '云计算'] },
        { id: 'design', name: '产品设计', key: 'design', icon: 'AntDesignOutlined', color: '#52c41a', keywords: ['产品', '设计', 'UI', 'UX', '交互', '视觉', '平面', '设计师', '产品经理', 'PM', 'Figma', 'Sketch'] },
        { id: 'marketing', name: '运营推广', key: 'marketing', icon: 'RiseOutlined', color: '#fa8c16', keywords: ['运营', '推广', '营销', '市场', '新媒体', '内容', '编辑', '文案', '策划', '活动', '品牌', '公关', 'SEO', 'SEM'] },
        { id: 'sales', name: '销售商务', key: 'sales', icon: 'ShakeOutlined', color: '#eb2f96', keywords: ['销售', '商务', '客户', 'BD', '渠道', '大客户', 'KA', '区域'] },
        { id: 'hr', name: '人力资源', key: 'hr', icon: 'UsergroupAddOutlined', color: '#722ed1', keywords: ['人事', 'HR', '招聘', '培训', '薪酬', '绩效', 'HRBP'] },
        { id: 'finance', name: '财务金融', key: 'finance', icon: 'DollarOutlined', color: '#13c2c2', keywords: ['财务', '会计', '出纳', '审计', '税务', '投资', '融资', '风控'] },
        { id: 'admin', name: '管理行政', key: 'admin', icon: 'FileTextOutlined', color: '#faad14', keywords: ['管理', '行政', '助理', '秘书', '总经理', '总监', '经理', '项目管理', 'PMO'] },
        { id: 'other', name: '其他职位', key: 'other', icon: 'ToolOutlined', color: '#8c8c8c', keywords: ['其他', '实习', '兼职', '顾问', '客服'] }
    ];

    React.useEffect(() => {
        if (categories.length === 0) {
            setLocalCategories(defaultCategories);
        } else {
            setLocalCategories(categories);
        }
    }, [categories]);

    const getRecommendedColor = (): string => {
        const usedColors = new Set(localCategories.map(c => c.color));
        return PRESET_COLORS.find(c => !usedColors.has(c)) || PRESET_COLORS[0];
    };

    const handleAdd = () => {
        setEditingCategory(null);
        setIsEditing(true);
        const recommendedColor = getRecommendedColor();
        const defaultIcon = 'LaptopOutlined';
        setSelectedIcon(defaultIcon);
        setSelectedColor(recommendedColor);
        form.resetFields();
        form.setFieldsValue({
            icon: defaultIcon,
            color: recommendedColor,
            key: `cat_${Date.now()}`
        });
    };

    const handleEdit = (category: PositionCategory) => {
        setEditingCategory(category);
        setIsEditing(true);
        setSelectedIcon(category.icon);
        setSelectedColor(category.color);
        form.setFieldsValue({
            name: category.name,
            key: category.key,
            icon: category.icon,
            color: category.color,
            keywords: category.keywords.join(', ')
        });
    };

    const handleDelete = (categoryId: string) => {
        const updatedCategories = localCategories.filter(cat => cat.id !== categoryId);
        setLocalCategories(updatedCategories);
        message.success('分类删除成功');
    };

    const handleMoveUp = (index: number) => {
        if (index <= 0) return;
        const updated = [...localCategories];
        [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
        setLocalCategories(updated);
    };

    const handleMoveDown = (index: number) => {
        if (index >= localCategories.length - 1) return;
        const updated = [...localCategories];
        [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
        setLocalCategories(updated);
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            const keywords = values.keywords
                ? values.keywords.split(/[,，]/).map((k: string) => k.trim()).filter((k: string) => k)
                : [];

            const categoryData: PositionCategory = {
                id: editingCategory?.id || `category_${Date.now()}`,
                name: values.name,
                key: values.key,
                icon: selectedIcon,
                color: selectedColor,
                keywords
            };

            let updatedCategories;
            if (editingCategory) {
                updatedCategories = localCategories.map(cat =>
                    cat.id === editingCategory.id ? categoryData : cat
                );
            } else {
                updatedCategories = [...localCategories, categoryData];
            }

            setLocalCategories(updatedCategories);
            setIsEditing(false);
            setEditingCategory(null);
            form.resetFields();
            message.success(editingCategory ? '分类更新成功' : '分类创建成功');
        } catch (error) {
            console.error('保存分类失败:', error);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditingCategory(null);
        form.resetFields();
    };

    const handleConfirmSave = () => {
        onSave(localCategories);
        onClose();
    };

    const getIconNode = (iconName: string): React.ReactNode => {
        const found = AVAILABLE_ICONS.find(i => i.name === iconName);
        return found ? found.icon : <ToolOutlined />;
    };

    return (
        <Modal
            title="职位分类管理"
            open={visible}
            onCancel={onClose}
            width={800}
            footer={[
                <Button key="cancel" onClick={onClose}>
                    取消
                </Button>,
                <Button key="save" type="primary" onClick={handleConfirmSave}>
                    保存配置
                </Button>
            ]}
        >
            <div style={{ marginBottom: 16 }}>
                <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={handleAdd}
                    style={{ width: '100%' }}
                >
                    添加新分类
                </Button>
            </div>

            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {localCategories.map((category, index) => (
                    <div
                        key={category.id}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '12px',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            marginBottom: '8px',
                            backgroundColor: 'var(--bg-primary)'
                        }}
                    >
                        <div style={{
                            width: 32, height: 32, borderRadius: '6px',
                            backgroundColor: category.color + '1a',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: category.color, fontSize: 16, marginRight: 12, flexShrink: 0
                        }}>
                            {getIconNode(category.icon)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                                <Tag color={category.color} style={{ margin: 0, marginRight: '8px' }}>
                                    {category.name}
                                </Tag>
                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                    {category.key}
                                </span>
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {category.keywords.slice(0, 5).join(', ')}
                                {category.keywords.length > 5 && ` ...共${category.keywords.length}个`}
                            </div>
                        </div>
                        <Space size={2}>
                            <Tooltip title="上移">
                                <Button
                                    type="text"
                                    icon={<ArrowUpOutlined />}
                                    onClick={() => handleMoveUp(index)}
                                    size="small"
                                    disabled={index === 0}
                                    style={{ color: index === 0 ? '#d9d9d9' : undefined }}
                                />
                            </Tooltip>
                            <Tooltip title="下移">
                                <Button
                                    type="text"
                                    icon={<ArrowDownOutlined />}
                                    onClick={() => handleMoveDown(index)}
                                    size="small"
                                    disabled={index === localCategories.length - 1}
                                    style={{ color: index === localCategories.length - 1 ? '#d9d9d9' : undefined }}
                                />
                            </Tooltip>
                            <Tooltip title="编辑">
                                <Button
                                    type="text"
                                    icon={<EditOutlined />}
                                    onClick={() => handleEdit(category)}
                                    size="small"
                                />
                            </Tooltip>
                            <Popconfirm
                                title="确定要删除这个分类吗？"
                                description="删除后无法恢复，请谨慎操作"
                                onConfirm={() => handleDelete(category.id)}
                                okText="确定"
                                cancelText="取消"
                            >
                                <Tooltip title="删除">
                                    <Button
                                        type="text"
                                        danger
                                        icon={<DeleteOutlined />}
                                        size="small"
                                    />
                                </Tooltip>
                            </Popconfirm>
                        </Space>
                    </div>
                ))}
            </div>

            <Modal
                title={editingCategory ? '编辑分类' : '新建分类'}
                open={isEditing}
                onCancel={handleCancel}
                onOk={handleSave}
                width={640}
            >
                <Form
                    form={form}
                    layout="vertical"
                >
                    <Form.Item
                        name="name"
                        label="分类名称"
                        rules={[{ required: true, message: '请输入分类名称' }]}
                    >
                        <Input
                            placeholder="例如：技术开发"
                            onChange={(e) => {
                                if (!editingCategory) {
                                    form.setFieldValue('key', `cat_${Date.now()}`);
                                }
                            }}
                        />
                    </Form.Item>

                    <Form.Item
                        name="key"
                        label="分类标识（URL路径用，可自定义）"
                        rules={[{ required: true, message: '请输入分类标识' }]}
                    >
                        <Input placeholder="自动生成，也可手动修改" />
                    </Form.Item>

                    <Form.Item
                        name="icon"
                        label="图标"
                        rules={[{ required: true, message: '请选择图标' }]}
                    >
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(10, 1fr)',
                            gap: '6px',
                            maxHeight: '200px',
                            overflowY: 'auto',
                            padding: '8px',
                            border: '1px solid var(--border-color, #d9d9d9)',
                            borderRadius: '6px'
                        }}>
                            {AVAILABLE_ICONS.map((item) => (
                                <Tooltip key={item.name} title={item.label}>
                                    <div
                                        onClick={() => {
                                            setSelectedIcon(item.name);
                                            form.setFieldValue('icon', item.name);
                                        }}
                                        style={{
                                            width: 40, height: 40,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: 18,
                                            border: selectedIcon === item.name
                                                ? `2px solid ${selectedColor}`
                                                : '1px solid transparent',
                                            backgroundColor: selectedIcon === item.name
                                                ? selectedColor + '15'
                                                : 'transparent',
                                            color: selectedIcon === item.name
                                                ? selectedColor
                                                : 'var(--text-secondary, #8c8c8c)',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {item.icon}
                                    </div>
                                </Tooltip>
                            ))}
                        </div>
                    </Form.Item>

                    <Form.Item
                        name="color"
                        label="颜色"
                        rules={[{ required: true, message: '请选择颜色' }]}
                    >
                        <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '8px',
                            padding: '8px',
                            border: '1px solid var(--border-color, #d9d9d9)',
                            borderRadius: '6px'
                        }}>
                            {PRESET_COLORS.map((color) => {
                                const isUsed = localCategories.some(
                                    c => c.color === color && c.id !== editingCategory?.id
                                );
                                return (
                                    <Tooltip
                                        key={color}
                                        title={isUsed ? '已被使用' : color}
                                    >
                                        <div
                                            onClick={() => {
                                                setSelectedColor(color);
                                                form.setFieldValue('color', color);
                                            }}
                                            style={{
                                                width: 32, height: 32,
                                                borderRadius: '50%',
                                                backgroundColor: color,
                                                cursor: 'pointer',
                                                border: selectedColor === color
                                                    ? '3px solid var(--text-primary, #333)'
                                                    : '2px solid transparent',
                                                boxShadow: selectedColor === color
                                                    ? '0 0 0 2px white, 0 0 0 4px ' + color
                                                    : 'none',
                                                opacity: isUsed ? 0.4 : 1,
                                                transition: 'all 0.2s',
                                                position: 'relative'
                                            }}
                                        />
                                    </Tooltip>
                                );
                            })}
                        </div>
                    </Form.Item>

                    <Form.Item
                        name="keywords"
                        label="关键词"
                        help="多个关键词用逗号分隔，用于自动匹配候选人职位"
                    >
                        <Input.TextArea
                            rows={4}
                            placeholder="请输入关键词，多个用逗号分隔"
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </Modal>
    );
};

export default PositionCategoryManager;
