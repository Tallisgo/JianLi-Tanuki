import React, { useState, useMemo } from 'react';
import { Collapse, Tag, Badge, Typography, Space, Button } from 'antd';
import {
    DownOutlined,
    RightOutlined,
    FilterOutlined,
    ClearOutlined
} from '@ant-design/icons';
import type { Candidate } from '../services/api';
import './PositionFilterCollapse.css';

const { Panel } = Collapse;
const { Text } = Typography;

// 职位分类配置
const POSITION_CATEGORIES = {
    '技术开发': {
        keywords: ['开发', '工程师', '程序员', '架构师', '技术', '前端', '后端', '全栈', '移动端', 'iOS', 'Android', 'Java', 'Python', 'JavaScript', 'React', 'Vue', 'Node.js', 'Spring', 'Django', 'Flask', 'Go', 'C++', 'C#', '.NET', 'PHP', 'Ruby', 'Swift', 'Kotlin', 'TypeScript', 'Angular', 'Vue.js', '小程序', 'H5', 'Web', 'App', 'API', '微服务', 'DevOps', '运维', '测试', 'QA', '自动化', '性能', '算法', '数据结构', '机器学习', 'AI', '人工智能', '大数据', '云计算', '区块链', '物联网', 'IoT'],
        color: '#1890ff',
        icon: '💻'
    },
    '产品设计': {
        keywords: ['产品', '设计', 'UI', 'UX', '交互', '视觉', '平面', '美工', '设计师', '产品经理', 'PM', '原型', 'Figma', 'Sketch', 'Photoshop', 'Illustrator', 'Axure', '墨刀', '蓝湖', '用户体验', '用户研究', '需求分析', '竞品分析', '产品规划', '产品运营', '增长', '数据产品', 'B端产品', 'C端产品'],
        color: '#52c41a',
        icon: '🎨'
    },
    '运营推广': {
        keywords: ['运营', '推广', '营销', '市场', '新媒体', '内容', '编辑', '文案', '策划', '活动', '品牌', '公关', 'SEO', 'SEM', '广告', '投放', '转化', '用户运营', '社群', '直播', '短视频', '抖音', '快手', '小红书', '微博', '微信', '公众号', '小程序', '电商', '淘宝', '京东', '拼多多', '增长黑客', '裂变', '获客', '留存', '活跃', '付费'],
        color: '#fa8c16',
        icon: '📈'
    },
    '销售商务': {
        keywords: ['销售', '商务', '客户', 'BD', '渠道', '代理商', '经销商', '招商', '合作', '商务拓展', '客户经理', '销售经理', '大客户', 'KA', '渠道经理', '区域经理', '城市经理', '业务员', '销售代表', '客户代表', '商务代表', '招商经理', '合作经理', 'BD经理', '销售总监', '商务总监', '销售VP', '商务VP'],
        color: '#eb2f96',
        icon: '🤝'
    },
    '人力资源': {
        keywords: ['人事', 'HR', '招聘', '培训', '薪酬', '绩效', '员工关系', '组织发展', '人才发展', '招聘经理', '招聘专员', 'HRBP', 'HRD', 'CHO', '人事经理', '人事专员', '培训经理', '培训师', '薪酬福利', '绩效考核', '员工关系', '劳动关系', '社保', '公积金', '福利', '企业文化', '组织架构', '人才盘点', '继任计划'],
        color: '#722ed1',
        icon: '👥'
    },
    '财务金融': {
        keywords: ['财务', '会计', '出纳', '审计', '税务', '成本', '预算', '资金', '投资', '融资', '风控', '合规', '财务经理', '财务总监', 'CFO', '会计经理', '总账会计', '成本会计', '税务会计', '出纳', '审计经理', '内审', '外审', '财务分析', '财务规划', '资金管理', '投资管理', '风险管理', '合规管理', '财务BP'],
        color: '#13c2c2',
        icon: '💰'
    },
    '管理行政': {
        keywords: ['管理', '行政', '助理', '秘书', '文员', '前台', '后勤', '总务', '办公室', '总经理', '副总', '总监', '经理', '主管', '组长', '团队', '项目管理', 'PMO', '流程', '制度', '规范', '标准', '质量', 'ISO', '内控', '法务', '合规', '风险', '安全', '环保', '社会责任', 'CSR'],
        color: '#faad14',
        icon: '📋'
    },
    '其他职位': {
        keywords: ['其他', '未分类', '待定', '实习', '兼职', '临时', '外包', '咨询', '顾问', '专家', '学者', '研究员', '分析师', '翻译', '客服', '售后', '技术支持', '运维', 'DBA', '系统管理员', '网络工程师', '安全工程师', '测试工程师', '质量工程师', '工艺工程师', '生产', '制造', '供应链', '采购', '物流', '仓储', '配送'],
        color: '#8c8c8c',
        icon: '🔧'
    }
};

interface PositionFilterCollapseProps {
    candidates: Candidate[];
    onFilterChange: (filteredCandidates: Candidate[]) => void;
    onCategorySelect: (category: string | null) => void;
    selectedCategory: string | null;
}

const PositionFilterCollapse: React.FC<PositionFilterCollapseProps> = ({
    candidates,
    onFilterChange,
    onCategorySelect,
    selectedCategory
}) => {
    const [activeKeys, setActiveKeys] = useState<string[]>(['position-filter']);

    // 计算每个分类的候选人数量
    const categoryStats = useMemo(() => {
        const stats: Record<string, { count: number; candidates: Candidate[] }> = {};

        Object.keys(POSITION_CATEGORIES).forEach(category => {
            const config = POSITION_CATEGORIES[category as keyof typeof POSITION_CATEGORIES];
            const matchingCandidates = candidates.filter(candidate => {
                if (!candidate.position) return category === '其他职位';

                const position = candidate.position.toLowerCase();
                return config.keywords.some(keyword =>
                    position.includes(keyword.toLowerCase())
                );
            });

            stats[category] = {
                count: matchingCandidates.length,
                candidates: matchingCandidates
            };
        });

        return stats;
    }, [candidates]);

    // 处理分类选择
    const handleCategoryClick = (category: string) => {
        if (selectedCategory === category) {
            // 如果点击的是当前选中的分类，则取消选择
            onCategorySelect(null);
            onFilterChange(candidates);
        } else {
            // 选择新的分类
            onCategorySelect(category);
            onFilterChange(categoryStats[category].candidates);
        }
    };

    // 清除筛选
    const handleClearFilter = () => {
        onCategorySelect(null);
        onFilterChange(candidates);
    };

    // 自定义面板头部
    const customPanelHeader = (category: string, count: number, icon: string, color: string) => (
        <div
            className={`position-panel-header ${selectedCategory === category ? 'selected' : ''}`}
            onClick={(e) => {
                e.stopPropagation();
                handleCategoryClick(category);
            }}
            title={`点击筛选 ${category} 职位候选人`}
        >
            <Space>
                <span className="category-icon" style={{ color }}>{icon}</span>
                <Text strong style={{ color: selectedCategory === category ? color : 'var(--text-primary)' }}>
                    {category}
                </Text>
                <Badge
                    count={count}
                    style={{
                        backgroundColor: selectedCategory === category ? color : 'var(--bg-tertiary)',
                        color: selectedCategory === category ? '#fff' : 'var(--text-secondary)'
                    }}
                />
                {selectedCategory === category && (
                    <span style={{ color, fontSize: '12px' }}>✓</span>
                )}
            </Space>
        </div>
    );

    return (
        <div className="position-filter-collapse">
            <Collapse
                activeKey={activeKeys}
                onChange={setActiveKeys}
                ghost
                expandIcon={({ isActive }) =>
                    isActive ? <DownOutlined /> : <RightOutlined />
                }
                className="position-collapse"
            >
                <Panel
                    header={
                        <div className="collapse-main-header">
                            <Space>
                                <FilterOutlined style={{ color: 'var(--primary-color)' }} />
                                <Text strong>按职位分类筛选</Text>
                                <Badge
                                    count={candidates.length}
                                    style={{ backgroundColor: 'var(--primary-color)' }}
                                />
                            </Space>
                            {selectedCategory && (
                                <Button
                                    type="text"
                                    size="small"
                                    icon={<ClearOutlined />}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleClearFilter();
                                    }}
                                    style={{ color: 'var(--text-secondary)' }}
                                >
                                    清除筛选
                                </Button>
                            )}
                        </div>
                    }
                    key="position-filter"
                >
                    <div className="position-categories">
                        {Object.entries(POSITION_CATEGORIES).map(([category, config]) => {
                            const stats = categoryStats[category];
                            return (
                                <div
                                    key={category}
                                    className={`position-category-item ${selectedCategory === category ? 'selected' : ''}`}
                                    onClick={() => handleCategoryClick(category)}
                                    style={{
                                        borderLeftColor: config.color,
                                        backgroundColor: selectedCategory === category ? `${config.color}10` : 'transparent'
                                    }}
                                >
                                    {customPanelHeader(category, stats.count, config.icon, config.color)}

                                    {stats.count > 0 ? (
                                        <div className="category-preview">
                                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                                最近候选人: {stats.candidates.slice(0, 3).map(c => c.name).join(', ')}
                                                {stats.count > 3 && ` 等${stats.count}人`}
                                            </Text>
                                        </div>
                                    ) : (
                                        <div className="category-preview">
                                            <Text type="secondary" style={{ fontSize: '12px', fontStyle: 'italic' }}>
                                                暂无此职位候选人
                                            </Text>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </Panel>
            </Collapse>
        </div>
    );
};

export default PositionFilterCollapse;
