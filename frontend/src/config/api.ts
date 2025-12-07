/**
 * API配置
 * 统一管理所有API地址配置
 */

// 获取API基础地址
export const getApiBaseUrl = (): string => {
    if (process.env.NODE_ENV === 'production') {
        // 生产环境：使用当前访问的域名
        return `${window.location.protocol}//${window.location.hostname}:8001/api/v1`;
    } else {
        // 开发环境：使用localhost
        return 'http://localhost:8001/api/v1';
    }
};

// 导出API基础地址
export const API_BASE_URL = getApiBaseUrl();

// 获取文件下载地址
export const getFileDownloadUrl = (taskId: string): string => {
    return `${getApiBaseUrl()}/upload/download/${taskId}`;
};

// 获取上传地址
export const getUploadUrl = (): string => {
    return `${getApiBaseUrl()}/upload/`;
};

// 获取任务状态地址
export const getTaskStatusUrl = (taskId: string): string => {
    return `${getApiBaseUrl()}/tasks/${taskId}`;
};

// 获取激励语地址
export const getInspirationUrl = (): string => {
    return `${getApiBaseUrl()}/inspiration/daily`;
};

// 获取刷新激励语地址
export const getRefreshInspirationUrl = (): string => {
    return `${getApiBaseUrl()}/inspiration/refresh`;
};

// 获取认证相关地址
export const getAuthUrls = () => ({
    login: `${getApiBaseUrl()}/auth/login`,
    register: `${getApiBaseUrl()}/auth/register`,
    me: `${getApiBaseUrl()}/auth/me`,
    refresh: `${getApiBaseUrl()}/auth/refresh`,
    logout: `${getApiBaseUrl()}/auth/logout`,
});

// 获取用户管理地址
export const getUserUrls = () => ({
    list: `${getApiBaseUrl()}/users/`,
    update: (userId: string) => `${getApiBaseUrl()}/users/${userId}`,
    delete: (userId: string) => `${getApiBaseUrl()}/users/${userId}`,
});

// 获取候选人相关地址
export const getCandidateUrls = () => ({
    list: `${getApiBaseUrl()}/tasks/`,
    detail: (candidateId: string) => `${getApiBaseUrl()}/tasks/${candidateId}`,
});

// 健康检查地址
export const getHealthUrl = (): string => {
    return `${getApiBaseUrl()}/health`;
};



