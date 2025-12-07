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
    SettingOutlined
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

    // 初始化本地分类数据
    React.useEffect(() => {
        if (categories.length === 0) {
            setLocalCategories(defaultCategories);
        } else {
            setLocalCategories(categories);
        }
    }, [categories]);

    // 处理新建分类
    const handleAdd = () => {
        setEditingCategory(null);
        setIsEditing(true);
        form.resetFields();
    };

    // 处理编辑分类
    const handleEdit = (category: PositionCategory) => {
        setEditingCategory(category);
        setIsEditing(true);
        form.setFieldsValue({
            name: category.name,
            key: category.key,
            icon: category.icon,
            color: category.color,
            keywords: category.keywords.join(', ')
        });
    };

    // 处理删除分类
    const handleDelete = (categoryId: string) => {
        const updatedCategories = localCategories.filter(cat => cat.id !== categoryId);
        setLocalCategories(updatedCategories);
        message.success('分类删除成功');
    };

    // 处理保存
    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            const keywords = values.keywords ? values.keywords.split(',').map((k: string) => k.trim()).filter((k: string) => k) : [];

            const categoryData: PositionCategory = {
                id: editingCategory?.id || `category_${Date.now()}`,
                name: values.name,
                key: values.key,
                icon: values.icon,
                color: values.color,
                keywords
            };

            let updatedCategories;
            if (editingCategory) {
                // 编辑现有分类
                updatedCategories = localCategories.map(cat =>
                    cat.id === editingCategory.id ? categoryData : cat
                );
            } else {
                // 添加新分类
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

    // 处理取消
    const handleCancel = () => {
        setIsEditing(false);
        setEditingCategory(null);
        form.resetFields();
    };

    // 处理确认保存
    const handleConfirmSave = () => {
        onSave(localCategories);
        onClose();
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

            {/* 分类列表 */}
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {localCategories.map((category) => (
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
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                                <Tag color={category.color} style={{ margin: 0, marginRight: '8px' }}>
                                    {category.name}
                                </Tag>
                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                    {category.key}
                                </span>
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                关键词: {category.keywords.slice(0, 5).join(', ')}
                                {category.keywords.length > 5 && ` 等${category.keywords.length}个`}
                            </div>
                        </div>
                        <Space>
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

            {/* 编辑表单 */}
            <Modal
                title={editingCategory ? '编辑分类' : '新建分类'}
                open={isEditing}
                onCancel={handleCancel}
                onOk={handleSave}
                width={600}
            >
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={{
                        color: '#1890ff',
                        icon: 'LaptopOutlined'
                    }}
                >
                    <Form.Item
                        name="name"
                        label="分类名称"
                        rules={[{ required: true, message: '请输入分类名称' }]}
                    >
                        <Input placeholder="请输入分类名称" />
                    </Form.Item>

                    <Form.Item
                        name="key"
                        label="分类标识"
                        rules={[{ required: true, message: '请输入分类标识' }]}
                    >
                        <Input placeholder="请输入分类标识（英文）" />
                    </Form.Item>

                    <Form.Item
                        name="icon"
                        label="图标"
                        rules={[{ required: true, message: '请选择图标' }]}
                    >
                        <Input placeholder="请输入图标名称" />
                    </Form.Item>

                    <Form.Item
                        name="color"
                        label="颜色"
                        rules={[{ required: true, message: '请选择颜色' }]}
                    >
                        <Input type="color" />
                    </Form.Item>

                    <Form.Item
                        name="keywords"
                        label="关键词"
                        help="多个关键词用逗号分隔"
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

