import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// 主题类型定义
export type Theme = 'light' | 'dark';

// 主题上下文类型
interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

// 创建主题上下文
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// 主题提供者组件
interface ThemeProviderProps {
    children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    // 从 localStorage 获取保存的主题，默认为 light
    const [theme, setThemeState] = useState<Theme>(() => {
        const savedTheme = localStorage.getItem('jianli-tanuki-theme') as Theme;
        return savedTheme || 'light';
    });

    // 切换主题
    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setThemeState(newTheme);
        localStorage.setItem('jianli-tanuki-theme', newTheme);
    };

    // 设置主题
    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem('jianli-tanuki-theme', newTheme);
    };

    // 监听主题变化，更新 document 的 data-theme 属性
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);

        // 更新 body 的类名
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
            document.body.classList.remove('light-theme');
        } else {
            document.body.classList.add('light-theme');
            document.body.classList.remove('dark-theme');
        }
    }, [theme]);

    const value: ThemeContextType = {
        theme,
        toggleTheme,
        setTheme,
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

// 自定义 hook 来使用主题上下文
export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
