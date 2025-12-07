import React, { useState, useEffect } from 'react';
import { Card, Typography, Space, Tag } from 'antd';

const { Title, Text } = Typography;

const ResponsiveTest: React.FC = () => {
    const [screenInfo, setScreenInfo] = useState({
        width: 0,
        height: 0,
        isMobile: false,
        isTablet: false,
        isDesktop: false
    });

    useEffect(() => {
        const updateScreenInfo = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            setScreenInfo({
                width,
                height,
                isMobile: width < 768,
                isTablet: width >= 768 && width < 1024,
                isDesktop: width >= 1024
            });
        };

        updateScreenInfo();
        window.addEventListener('resize', updateScreenInfo);

        return () => window.removeEventListener('resize', updateScreenInfo);
    }, []);

    return (
        <div style={{ padding: '20px' }}>
            <Title level={2}>响应式测试页面</Title>

            <Card title="屏幕信息" style={{ marginBottom: '20px' }}>
                <Space direction="vertical" size="middle">
                    <div>
                        <Text strong>屏幕尺寸：</Text>
                        <Text>{screenInfo.width} × {screenInfo.height}</Text>
                    </div>

                    <div>
                        <Text strong>设备类型：</Text>
                        <Space>
                            {screenInfo.isMobile && <Tag color="red">移动端 (&lt; 768px)</Tag>}
                            {screenInfo.isTablet && <Tag color="orange">平板 (768px - 1024px)</Tag>}
                            {screenInfo.isDesktop && <Tag color="green">桌面端 (&gt; 1024px)</Tag>}
                        </Space>
                    </div>

                    <div>
                        <Text strong>建议：</Text>
                        <Text>
                            {screenInfo.isMobile && "在移动端，登录页面会显示为垂直布局，登录表单在上方，品牌介绍在下方"}
                            {screenInfo.isTablet && "在平板端，登录页面会显示为水平布局，但间距会适当调整"}
                            {screenInfo.isDesktop && "在桌面端，登录页面会显示为完整的水平布局，包含所有功能特色"}
                        </Text>
                    </div>
                </Space>
            </Card>

            <Card title="响应式特性">
                <Space direction="vertical" size="middle">
                    <div>
                        <Title level={4}>移动端 (&lt; 768px)</Title>
                        <ul>
                            <li>垂直布局：登录表单在上，品牌介绍在下</li>
                            <li>简化背景装饰</li>
                            <li>功能特色横向显示</li>
                            <li>字体和间距适配小屏幕</li>
                            <li>支持滚动</li>
                        </ul>
                    </div>

                    <div>
                        <Title level={4}>平板端 (768px - 1024px)</Title>
                        <ul>
                            <li>水平布局但间距适中</li>
                            <li>保留背景装饰</li>
                            <li>功能特色完整显示</li>
                            <li>字体大小适中</li>
                        </ul>
                    </div>

                    <div>
                        <Title level={4}>桌面端 (&gt; 1024px)</Title>
                        <ul>
                            <li>完整水平布局</li>
                            <li>所有装饰效果</li>
                            <li>完整功能特色展示</li>
                            <li>最佳视觉效果</li>
                        </ul>
                    </div>
                </Space>
            </Card>
        </div>
    );
};

export default ResponsiveTest;



