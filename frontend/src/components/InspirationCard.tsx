import React, { useState, useEffect } from 'react';
import { Card, Typography, Button, Space, Spin, message } from 'antd';
import { ReloadOutlined, SunOutlined, StarOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { apiService, type InspirationResponse } from '../services/api';

const { Text } = Typography;

interface InspirationCardProps {
    style?: React.CSSProperties;
}

const InspirationCard: React.FC<InspirationCardProps> = ({ style }) => {
    const [inspiration, setInspiration] = useState<InspirationResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [isAnimating, setIsAnimating] = useState(true);
    const [animationType, setAnimationType] = useState<string>('rainbow');

    // 加载激励语
    const loadInspiration = async () => {
        setLoading(true);
        try {
            const data = await apiService.getDailyInspiration();
            setInspiration(data);
        } catch (error) {
            console.error('加载激励语失败:', error);
            message.error('加载激励语失败');
        } finally {
            setLoading(false);
        }
    };

    // 刷新激励语
    const refreshInspiration = async () => {
        setRefreshing(true);
        try {
            console.log('开始刷新激励语...');
            const data = await apiService.refreshDailyInspiration();
            console.log('刷新结果:', data);
            if (data) {
                setInspiration(data);
                message.success('激励语已刷新');
            } else {
                message.error('刷新失败：未获取到数据');
            }
        } catch (error) {
            console.error('刷新激励语失败:', error);
            message.error(`刷新激励语失败: ${error}`);
        } finally {
            setRefreshing(false);
        }
    };

    // 动画类型定义
    const animationTypes = [
        'rainbow',      // 彩虹渐变
        'fire',         // 火焰效果
        'ocean',        // 海洋效果
        'sunset',       // 日落效果
        'aurora',       // 极光效果
        'galaxy',       // 银河效果
        'neon',         // 霓虹效果
        'cosmic'        // 宇宙效果
    ];

    // 触发动画效果
    const triggerAnimation = () => {
        // 随机选择动画类型
        const randomType = animationTypes[Math.floor(Math.random() * animationTypes.length)];
        setAnimationType(randomType);
        setIsAnimating(true);
        console.log(`触发动画类型: ${randomType}`);
    };

    // 获取动画样式
    const getAnimationStyle = () => {
        if (!isAnimating) {
            return {
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 4px 16px rgba(102, 126, 234, 0.2)'
            };
        }

        const styles = {
            rainbow: {
                background: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 25%, #48dbfb 50%, #a55eea 75%, #26de81 100%)',
                boxShadow: '0 8px 32px rgba(255, 107, 107, 0.4)'
            },
            fire: {
                background: 'linear-gradient(135deg, #ff4757 0%, #ff6b35 50%, #feca57 100%)',
                boxShadow: '0 8px 32px rgba(255, 71, 87, 0.4)'
            },
            ocean: {
                background: 'linear-gradient(135deg, #006ba6 0%, #0496ff 50%, #00d4ff 100%)',
                boxShadow: '0 8px 32px rgba(0, 107, 166, 0.4)'
            },
            sunset: {
                background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
                boxShadow: '0 8px 32px rgba(255, 154, 158, 0.4)'
            },
            aurora: {
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)',
                boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)'
            },
            galaxy: {
                background: 'linear-gradient(135deg, #2c3e50 0%, #3498db 25%, #9b59b6 50%, #e74c3c 75%, #f39c12 100%)',
                boxShadow: '0 8px 32px rgba(44, 62, 80, 0.4)'
            },
            neon: {
                background: 'linear-gradient(135deg, #00ff88 0%, #00d4ff 50%, #ff0080 100%)',
                boxShadow: '0 8px 32px rgba(0, 255, 136, 0.4)'
            },
            cosmic: {
                background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 25%, #8e44ad 50%, #e74c3c 75%, #f1c40f 100%)',
                boxShadow: '0 8px 32px rgba(30, 60, 114, 0.4)'
            }
        };

        return styles[animationType as keyof typeof styles] || styles.rainbow;
    };

    // 获取图标颜色
    const getIconColor = () => {
        const colors = {
            rainbow: '#ff6b6b',
            fire: '#ff4757',
            ocean: '#00d4ff',
            sunset: '#ff9a9e',
            aurora: '#f093fb',
            galaxy: '#3498db',
            neon: '#00ff88',
            cosmic: '#f1c40f'
        };
        return colors[animationType as keyof typeof colors] || '#faad14';
    };

    // 获取图标动画
    const getIconAnimation = () => {
        const animations = {
            rainbow: 'rainbowSpin 2s linear infinite',
            fire: 'fireFlicker 1.5s ease-in-out infinite',
            ocean: 'wave 2s ease-in-out infinite',
            sunset: 'pulse 2s ease-in-out infinite',
            aurora: 'auroraFloat 3s ease-in-out infinite',
            galaxy: 'galaxyRotate 4s linear infinite',
            neon: 'neonBlink 1s ease-in-out infinite',
            cosmic: 'cosmicPulse 2.5s ease-in-out infinite'
        };
        return animations[animationType as keyof typeof animations] || 'spin 3s linear infinite';
    };

    // 获取激励标签
    const getInspirationTag = () => {
        const tags = [
            '✨ 正能量',
            '🌟 励志',
            '💪 加油',
            '🚀 奋进',
            '💎 珍贵',
            '🔥 热情',
            '🌈 美好',
            '⭐ 闪耀',
            '🎯 目标',
            '💫 奇迹'
        ];

        // 根据动画类型选择对应的标签
        const tagMap = {
            rainbow: '🌈 美好',
            fire: '🔥 热情',
            ocean: '🌊 深邃',
            sunset: '🌅 温暖',
            aurora: '🌌 梦幻',
            galaxy: '🌌 浩瀚',
            neon: '⚡ 活力',
            cosmic: '🚀 无限'
        };

        return tagMap[animationType as keyof typeof tagMap] || tags[Math.floor(Math.random() * tags.length)];
    };

    // 组件挂载时加载激励语并初始化随机动画
    useEffect(() => {
        loadInspiration();
        // 初始化时随机选择一种动画效果
        const randomType = animationTypes[Math.floor(Math.random() * animationTypes.length)];
        setAnimationType(randomType);
        setIsAnimating(true);
        console.log(`初始化动画类型: ${randomType}`);
    }, []);

    // 定时触发动画效果
    useEffect(() => {
        const interval = setInterval(() => {
            triggerAnimation();
        }, 30000); // 每30秒触发一次动画

        return () => clearInterval(interval);
    }, []);

    return (
        <>
            <style>
                {`
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                    
                    @keyframes rainbowSpin {
                        0% { transform: rotate(0deg) scale(1); color: #ff6b6b; }
                        25% { transform: rotate(90deg) scale(1.1); color: #feca57; }
                        50% { transform: rotate(180deg) scale(1.2); color: #48dbfb; }
                        75% { transform: rotate(270deg) scale(1.1); color: #a55eea; }
                        100% { transform: rotate(360deg) scale(1); color: #26de81; }
                    }
                    
                    @keyframes fireFlicker {
                        0%, 100% { transform: scale(1) rotate(0deg); color: #ff4757; }
                        25% { transform: scale(1.1) rotate(5deg); color: #ff6b35; }
                        50% { transform: scale(1.2) rotate(-5deg); color: #feca57; }
                        75% { transform: scale(1.1) rotate(3deg); color: #ff4757; }
                    }
                    
                    @keyframes wave {
                        0%, 100% { transform: translateY(0px) rotate(0deg); color: #006ba6; }
                        25% { transform: translateY(-5px) rotate(5deg); color: #0496ff; }
                        50% { transform: translateY(-10px) rotate(0deg); color: #00d4ff; }
                        75% { transform: translateY(-5px) rotate(-5deg); color: #0496ff; }
                    }
                    
                    @keyframes pulse {
                        0%, 100% { transform: scale(1); color: #ff9a9e; }
                        50% { transform: scale(1.3); color: #fecfef; }
                    }
                    
                    @keyframes auroraFloat {
                        0%, 100% { transform: translateY(0px) rotate(0deg) scale(1); color: #667eea; }
                        25% { transform: translateY(-8px) rotate(10deg) scale(1.1); color: #764ba2; }
                        50% { transform: translateY(-15px) rotate(0deg) scale(1.2); color: #f093fb; }
                        75% { transform: translateY(-8px) rotate(-10deg) scale(1.1); color: #f5576c; }
                    }
                    
                    @keyframes galaxyRotate {
                        0% { transform: rotate(0deg) scale(1); color: #2c3e50; }
                        25% { transform: rotate(90deg) scale(1.1); color: #3498db; }
                        50% { transform: rotate(180deg) scale(1.2); color: #9b59b6; }
                        75% { transform: rotate(270deg) scale(1.1); color: #e74c3c; }
                        100% { transform: rotate(360deg) scale(1); color: #f39c12; }
                    }
                    
                    @keyframes neonBlink {
                        0%, 100% { transform: scale(1); color: #00ff88; filter: brightness(1); }
                        25% { transform: scale(1.2); color: #00d4ff; filter: brightness(1.5); }
                        50% { transform: scale(1.4); color: #ff0080; filter: brightness(2); }
                        75% { transform: scale(1.2); color: #00d4ff; filter: brightness(1.5); }
                    }
                    
                    @keyframes cosmicPulse {
                        0%, 100% { transform: scale(1) rotate(0deg); color: #1e3c72; }
                        20% { transform: scale(1.1) rotate(72deg); color: #2a5298; }
                        40% { transform: scale(1.2) rotate(144deg); color: #8e44ad; }
                        60% { transform: scale(1.1) rotate(216deg); color: #e74c3c; }
                        80% { transform: scale(1.2) rotate(288deg); color: #f1c40f; }
                    }
                    
                    @keyframes fadeInUp {
                        from {
                            opacity: 0;
                            transform: translateY(20px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                    
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    
                    @keyframes twinkle {
                        0%, 100% { opacity: 1; transform: scale(1); }
                        50% { opacity: 0.5; transform: scale(1.2); }
                    }
                `}
            </style>
            <Card
                title={
                    <Space>
                        <SunOutlined
                            style={{
                                color: isAnimating ? getIconColor() : '#faad14',
                                animation: isAnimating ? getIconAnimation() : 'none',
                                fontSize: '18px'
                            }}
                        />
                        <span style={{
                            fontSize: '16px',
                            fontWeight: 'bold',
                            textShadow: isAnimating ? '0 0 10px rgba(255, 255, 255, 0.8)' : 'none',
                            transition: 'all 0.3s ease-in-out'
                        }}>能量站</span>
                    </Space>
                }
                size="small"
                style={{
                    ...getAnimationStyle(),
                    border: 'none',
                    color: 'white',
                    transition: 'all 0.8s ease-in-out',
                    transform: isAnimating ? 'scale(1.02)' : 'scale(1)',
                    ...style
                }}
                styles={{
                    header: {
                        background: isAnimating
                            ? 'rgba(255, 255, 255, 0.15)'
                            : 'rgba(255, 255, 255, 0.1)',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
                        color: 'white',
                        padding: '12px 16px',
                        transition: 'all 0.3s ease-in-out'
                    },
                    body: {
                        padding: '16px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        minHeight: '120px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                    }
                }}
                extra={
                    <Space size="small">
                        <Button
                            type="text"
                            icon={<ThunderboltOutlined />}
                            onClick={triggerAnimation}
                            style={{
                                color: 'white',
                                transform: isAnimating ? 'scale(1.1)' : 'scale(1)',
                                transition: 'transform 0.3s ease-in-out'
                            }}
                            size="small"
                            title="触发动画效果"
                        />
                        <Button
                            type="text"
                            icon={<ReloadOutlined />}
                            onClick={refreshInspiration}
                            loading={refreshing}
                            style={{
                                color: 'white',
                                transform: refreshing ? 'rotate(180deg)' : 'rotate(0deg)',
                                transition: 'transform 0.5s ease-in-out'
                            }}
                            size="small"
                            title="刷新激励语"
                        />
                    </Space>
                }
            >
                <Spin spinning={loading}>
                    {inspiration ? (
                        <div>
                            <div style={{
                                fontSize: '14px',
                                lineHeight: '1.6',
                                marginBottom: '12px',
                                textAlign: 'center',
                                color: 'white',
                                fontWeight: 500,
                                animation: isAnimating ? 'fadeInUp 1s ease-out' : 'none',
                                transform: isAnimating ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
                                transition: 'all 0.6s ease-in-out'
                            }}>
                                {inspiration.inspiration}
                            </div>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                fontSize: '12px',
                                color: 'rgba(255, 255, 255, 0.8)',
                                animation: isAnimating ? 'fadeIn 0.8s ease-out 0.5s both' : 'none',
                                transform: isAnimating ? 'scale(1.05)' : 'scale(1)',
                                transition: 'all 0.6s ease-in-out'
                            }}>
                                <Space size="small">
                                    <StarOutlined style={{
                                        color: isAnimating ? getIconColor() : '#faad14',
                                        animation: isAnimating ? getIconAnimation() : 'none'
                                    }} />
                                    <Text style={{
                                        color: 'rgba(255, 255, 255, 0.9)',
                                        fontWeight: '500',
                                        fontSize: '13px'
                                    }}>
                                        {getInspirationTag()}
                                    </Text>
                                </Space>
                            </div>
                        </div>
                    ) : (
                        <div style={{
                            textAlign: 'center',
                            color: 'rgba(255, 255, 255, 0.8)',
                            fontSize: '14px'
                        }}>
                            加载中...
                        </div>
                    )}
                </Spin>
            </Card>
        </>
    );
};

export default InspirationCard;