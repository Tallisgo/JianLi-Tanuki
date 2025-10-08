import React from 'react';
import { Card, Typography, Space, Alert, Divider } from 'antd';
import { QuestionCircleOutlined, UserOutlined, LockOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const Help: React.FC = () => {
    return (
        <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '24px' }}>
                <Title level={2}>
                    <QuestionCircleOutlined style={{ marginRight: '8px' }} />
                    帮助中心
                </Title>
                <Text type="secondary">常见问题和使用指南</Text>
            </div>

            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {/* 默认账户信息 */}
                <Card title="默认管理员账户" size="small">
                    <Alert
                        message="系统默认管理员账户"
                        description={
                            <div>
                                <Paragraph>
                                    系统已预置管理员账户，用于首次登录和系统管理：
                                </Paragraph>
                                <Space direction="vertical" size="small">
                                    <div>
                                        <UserOutlined style={{ marginRight: '8px' }} />
                                        <Text strong>用户名：</Text>
                                        <Text code>admin</Text>
                                    </div>
                                    <div>
                                        <LockOutlined style={{ marginRight: '8px' }} />
                                        <Text strong>密码：</Text>
                                        <Text code>admin123</Text>
                                    </div>
                                    <div>
                                        <Text strong>邮箱：</Text>
                                        <Text code>admin@jianli-tanuki.com</Text>
                                    </div>
                                </Space>
                                <Divider />
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                    ⚠️ 建议首次登录后立即修改默认密码，确保系统安全
                                </Text>
                            </div>
                        }
                        type="info"
                        showIcon
                    />
                </Card>

                {/* 功能说明 */}
                <Card title="系统功能" size="small">
                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                        <div>
                            <Title level={4}>📊 仪表板</Title>
                            <Text>查看系统概览和统计数据</Text>
                        </div>
                        <div>
                            <Title level={4}>👥 候选人管理</Title>
                            <Text>管理已解析的候选人信息，查看简历详情</Text>
                        </div>
                        <div>
                            <Title level={4}>📄 简历上传</Title>
                            <Text>上传简历文件，系统自动解析并提取信息</Text>
                        </div>
                        <div>
                            <Title level={4}>👤 个人资料</Title>
                            <Text>管理个人账户信息和密码</Text>
                        </div>
                        <div>
                            <Title level={4}>🔧 用户管理</Title>
                            <Text>管理员功能：创建、编辑、删除用户账户</Text>
                        </div>
                    </Space>
                </Card>

                {/* 使用指南 */}
                <Card title="使用指南" size="small">
                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                        <div>
                            <Title level={4}>1. 首次登录</Title>
                            <Paragraph>
                                使用默认管理员账户登录系统，建议立即修改密码。
                            </Paragraph>
                        </div>
                        <div>
                            <Title level={4}>2. 上传简历</Title>
                            <Paragraph>
                                在"简历上传"页面选择PDF或Word格式的简历文件，系统会自动解析并提取候选人信息。
                            </Paragraph>
                        </div>
                        <div>
                            <Title level={4}>3. 管理候选人</Title>
                            <Paragraph>
                                在"候选人管理"页面查看所有已解析的候选人，可以编辑信息、添加备注或删除记录。
                            </Paragraph>
                        </div>
                        <div>
                            <Title level={4}>4. 用户管理</Title>
                            <Paragraph>
                                管理员可以创建新用户、分配角色、管理用户权限等。
                            </Paragraph>
                        </div>
                    </Space>
                </Card>

                {/* 技术支持 */}
                <Card title="技术支持" size="small">
                    <Space direction="vertical" size="small">
                        <Text>如果您在使用过程中遇到问题，请联系技术支持：</Text>
                        <Text>📧 邮箱：support@jianli-tanuki.com</Text>
                        <Text>📞 电话：400-123-4567</Text>
                        <Text>🕒 工作时间：周一至周五 9:00-18:00</Text>
                    </Space>
                </Card>
            </Space>
        </div>
    );
};

export default Help;
