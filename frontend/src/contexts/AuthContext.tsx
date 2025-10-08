import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { apiService } from '../services/api';
import type { User } from '../services/api';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (usernameOrEmail: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string, fullName?: string, phone?: string) => Promise<void>;
    logout: () => Promise<void>;
    updateProfile: (profileData: Partial<User>) => Promise<void>;
    changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // 检查是否已登录
    const isAuthenticated = !!user;

    // 初始化时检查用户登录状态
    useEffect(() => {
        const initAuth = async () => {
            try {
                if (apiService.isAuthenticated()) {
                    const storedUser = apiService.getStoredUser();
                    if (storedUser) {
                        setUser(storedUser);
                    } else {
                        // 尝试从服务器获取用户信息
                        const currentUser = await apiService.getCurrentUser();
                        if (currentUser) {
                            setUser(currentUser);
                        } else {
                            // 令牌可能已过期，清除本地存储
                            await apiService.logout();
                        }
                    }
                }
            } catch (error) {
                console.error('初始化认证状态失败:', error);
                await apiService.logout();
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();
    }, []);

    // 登录
    const login = async (usernameOrEmail: string, password: string): Promise<void> => {
        try {
            setIsLoading(true);
            const response = await apiService.login({
                username_or_email: usernameOrEmail,
                password: password,
            });

            if (response.success && response.user) {
                setUser(response.user);
            } else {
                throw new Error(response.message || '登录失败');
            }
        } catch (error) {
            console.error('登录失败:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    // 注册
    const register = async (
        username: string,
        email: string,
        password: string,
        fullName?: string,
        phone?: string
    ): Promise<void> => {
        try {
            setIsLoading(true);
            const response = await apiService.register({
                username,
                email,
                password,
                full_name: fullName,
                phone,
            });

            if (!response.success) {
                throw new Error(response.message || '注册失败');
            }
        } catch (error) {
            console.error('注册失败:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    // 登出
    const logout = async (): Promise<void> => {
        try {
            setIsLoading(true);
            await apiService.logout();
            setUser(null);
        } catch (error) {
            console.error('登出失败:', error);
            // 即使登出请求失败，也要清除本地状态
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    // 更新用户资料
    const updateProfile = async (profileData: Partial<User>): Promise<void> => {
        try {
            setIsLoading(true);
            const updatedUser = await apiService.updateProfile(profileData);
            setUser(updatedUser);
        } catch (error) {
            console.error('更新资料失败:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    // 修改密码
    const changePassword = async (oldPassword: string, newPassword: string): Promise<void> => {
        try {
            setIsLoading(true);
            await apiService.changePassword(oldPassword, newPassword);
        } catch (error) {
            console.error('修改密码失败:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const value: AuthContextType = {
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
