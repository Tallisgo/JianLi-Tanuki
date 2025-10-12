/**
 * API服务
 */

// API配置函数
const getApiBaseUrl = (): string => {
    // 检查是否在浏览器环境中
    if (typeof window === 'undefined') {
        return 'http://localhost:8001/api/v1';
    }

    // 检查是否为生产环境或部署环境
    const isProduction = process.env.NODE_ENV === 'production' ||
        (window.location.hostname !== 'localhost' &&
            window.location.hostname !== '127.0.0.1');

    if (isProduction) {
        // 生产环境：使用当前访问的域名，不包含端口号（通过Nginx代理）
        return `${window.location.protocol}//${window.location.hostname}/api/v1`;
    } else {
        // 开发环境：使用localhost
        return 'http://localhost:8001/api/v1';
    }
};

const API_BASE_URL = getApiBaseUrl();

const getAuthUrls = () => ({
    login: `${getApiBaseUrl()}/auth/login`,
    register: `${getApiBaseUrl()}/auth/register`,
    me: `${getApiBaseUrl()}/auth/me`,
    refresh: `${getApiBaseUrl()}/auth/refresh`,
    logout: `${getApiBaseUrl()}/auth/logout`,
});

const getInspirationUrl = (): string => {
    return `${getApiBaseUrl()}/inspiration/daily`;
};

const getRefreshInspirationUrl = (): string => {
    return `${getApiBaseUrl()}/inspiration/refresh`;
};

export interface Candidate {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    position?: string;
    experience?: string;
    education?: string;
    school?: string;
    major?: string;
    educationList?: EducationInfo[]; // 添加教育背景列表
    skills?: string[];
    workExperience?: WorkExperience[];
    projects?: Project[];
    status: string;
    uploadTime: string;
    notes?: string;
    result?: any; // 解析结果
}

export interface EducationInfo {
    degree?: string;
    institution?: string;
    major?: string;
    start_date?: string;
    end_date?: string;
    start_year?: string;
    end_year?: string;
    location?: string;
    gpa?: string;
}

export interface WorkExperience {
    company?: string;
    position?: string;
    start_date?: string;
    end_date?: string;
    description?: string;
    location?: string;
}

export interface Project {
    name?: string;
    description?: string;
    technologies?: string[];
    start_date?: string;
    end_date?: string;
}

export interface TaskResponse {
    task_id: string;
    status: string;
    result?: any;
    created_at: string;
    updated_at: string;
}

export interface UploadResponse {
    task_id: string;
    message: string;
}

export interface InspirationResponse {
    inspiration: string;
    date: string;
    timestamp: string;
    source: string;
}

export interface User {
    id: string;
    username: string;
    email: string;
    full_name?: string;
    phone?: string;
    role: string;
    status: string;
    created_at: string;
    updated_at: string;
}

export interface AuthResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
    user: User;
    success: boolean;
    message?: string;
}

export interface LoginRequest {
    username_or_email: string;
    password: string;
}

export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
    full_name?: string;
    phone?: string;
}

class ApiService {
    /**
     * 获取所有任务（候选人）
     */
    async getCandidates(): Promise<Candidate[]> {
        try {
            const response = await fetch(`${API_BASE_URL}/tasks/`);
            if (!response.ok) {
                throw new Error('获取候选人列表失败');
            }

            const tasks: TaskResponse[] = await response.json();

            // 将任务转换为候选人格式
            return tasks
                .filter(task => task.status === 'completed' && task.result)
                .map(task => this.convertTaskToCandidate(task));
        } catch (error) {
            console.error('获取候选人列表失败:', error);
            return [];
        }
    }

    /**
     * 获取候选人详情
     */
    async getCandidate(id: string): Promise<Candidate | null> {
        try {
            const response = await fetch(`${API_BASE_URL}/tasks/${id}`);
            if (!response.ok) {
                throw new Error('获取候选人详情失败');
            }

            const task: TaskResponse = await response.json();
            if (task.status === 'completed' && task.result) {
                return this.convertTaskToCandidate(task);
            }
            return null;
        } catch (error) {
            console.error('获取候选人详情失败:', error);
            return null;
        }
    }

    /**
     * 将任务转换为候选人格式
     */
    private convertTaskToCandidate(task: TaskResponse): Candidate {
        const result = task.result;
        return {
            id: task.task_id,
            name: result.name || '未知姓名',
            phone: result.contact?.phone,
            email: result.contact?.email,
            address: result.contact?.address,
            position: result.experience?.[0]?.title || result.position,
            experience: result.experience?.[0]?.description || result.experience,
            education: result.education?.[0]?.institution || result.education,
            school: result.education?.[0]?.institution || result.school,
            major: result.education?.[0]?.major || result.major,
            educationList: result.education?.map((edu: any) => ({
                degree: edu.degree,
                institution: edu.institution,
                major: edu.major,
                start_date: edu.start_date,
                end_date: edu.end_date,
                start_year: edu.start_year,
                end_year: edu.end_year,
                location: edu.location,
                gpa: edu.gpa
            })) || [],
            skills: result.skills || [],
            workExperience: result.experience?.map((exp: any) => ({
                company: exp.company,
                position: exp.title,
                description: exp.description,
                start_date: exp.start_date,
                end_date: exp.end_date,
                location: exp.location
            })) || [],
            projects: result.projects?.map((proj: any) => ({
                name: proj.name || '未知项目',
                description: proj.description || '',
                technologies: proj.technologies || [],
                start_date: proj.start_date,
                end_date: proj.end_date
            })) || [],
            status: '已解析',
            uploadTime: new Date(task.created_at).toLocaleString('zh-CN'),
            notes: result.summary || '',
            result: result
        };
    }



    /**
     * 获取每日激励语
     */
    async getDailyInspiration(): Promise<InspirationResponse | null> {
        try {
            const response = await fetch(getInspirationUrl());
            if (!response.ok) {
                throw new Error('获取激励语失败');
            }

            return await response.json();
        } catch (error) {
            console.error('获取激励语失败:', error);
            return null;
        }
    }

    /**
     * 刷新今日激励语
     */
    async refreshDailyInspiration(): Promise<InspirationResponse | null> {
        try {
            console.log('API调用: 刷新激励语');
            const response = await fetch(getRefreshInspirationUrl());
            console.log('API响应状态:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API错误响应:', errorText);
                throw new Error(`刷新激励语失败: ${response.status} ${errorText}`);
            }

            const data = await response.json();
            console.log('API响应数据:', data);
            return data;
        } catch (error) {
            console.error('刷新激励语失败:', error);
            throw error; // 重新抛出错误，让组件处理
        }
    }

    // ==================== 用户认证相关方法 ====================

    /**
     * 用户登录
     */
    async login(request: LoginRequest): Promise<AuthResponse> {
        try {
            const response = await fetch(getAuthUrls().login, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || '登录失败');
            }

            const data: AuthResponse = await response.json();

            // 保存令牌到本地存储
            if (data.access_token) {
                localStorage.setItem('access_token', data.access_token);
            }
            if (data.refresh_token) {
                localStorage.setItem('refresh_token', data.refresh_token);
            }
            if (data.user) {
                localStorage.setItem('user', JSON.stringify(data.user));
            }

            return data;
        } catch (error) {
            console.error('登录失败:', error);
            throw error;
        }
    }

    /**
     * 用户注册
     */
    async register(request: RegisterRequest): Promise<AuthResponse> {
        try {
            const response = await fetch(getAuthUrls().register, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || '注册失败');
            }

            const data: AuthResponse = await response.json();

            // 保存令牌到本地存储
            if (data.access_token) {
                localStorage.setItem('access_token', data.access_token);
            }
            if (data.refresh_token) {
                localStorage.setItem('refresh_token', data.refresh_token);
            }
            if (data.user) {
                localStorage.setItem('user', JSON.stringify(data.user));
            }

            return data;
        } catch (error) {
            console.error('注册失败:', error);
            throw error;
        }
    }

    /**
     * 获取当前用户信息
     */
    async getCurrentUser(): Promise<User | null> {
        try {
            const token = this.getAccessToken();
            if (!token) {
                return null;
            }

            const response = await fetch(getAuthUrls().me, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    // 令牌无效，尝试刷新
                    await this.refreshToken();
                    return this.getCurrentUser();
                }
                throw new Error('获取用户信息失败');
            }

            const data = await response.json();
            return data.user;
        } catch (error) {
            console.error('获取用户信息失败:', error);
            return null;
        }
    }

    /**
     * 刷新访问令牌
     */
    async refreshToken(): Promise<boolean> {
        try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (!refreshToken) {
                return false;
            }

            const response = await fetch(getAuthUrls().refresh, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refresh_token: refreshToken }),
            });

            if (!response.ok) {
                throw new Error('刷新令牌失败');
            }

            const data = await response.json();
            if (data.access_token) {
                localStorage.setItem('access_token', data.access_token);
                return true;
            }
            return false;
        } catch (error) {
            console.error('刷新令牌失败:', error);
            return false;
        }
    }

    /**
     * 用户登出
     */
    async logout(): Promise<void> {
        try {
            const token = this.getAccessToken();
            if (token) {
                await fetch(getAuthUrls().logout, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
            }
        } catch (error) {
            console.error('登出请求失败:', error);
        } finally {
            // 清除本地存储
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
        }
    }

    /**
     * 更新用户资料
     */
    async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
        try {
            const token = this.getAccessToken();
            if (!token) {
                throw new Error('未登录');
            }

            const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(updates),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || '更新用户资料失败');
            }

            const data = await response.json();
            return data.user;
        } catch (error) {
            console.error('更新用户资料失败:', error);
            throw error;
        }
    }

    /**
     * 修改密码
     */
    async changePassword(oldPassword: string, newPassword: string): Promise<void> {
        try {
            const token = this.getAccessToken();
            if (!token) {
                throw new Error('未登录');
            }

            const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    old_password: oldPassword,
                    new_password: newPassword,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || '修改密码失败');
            }
        } catch (error) {
            console.error('修改密码失败:', error);
            throw error;
        }
    }

    // ==================== 用户管理相关方法 ====================

    /**
     * 获取所有用户（管理员功能）
     */
    async getUsers(): Promise<User[]> {
        try {
            const token = this.getAccessToken();
            if (!token) {
                throw new Error('未登录');
            }

            const response = await fetch(`${API_BASE_URL}/users/`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || '获取用户列表失败');
            }

            const data = await response.json();
            return data.users || [];
        } catch (error) {
            console.error('获取用户列表失败:', error);
            throw error;
        }
    }

    /**
     * 更新用户信息（管理员功能）
     */
    async updateUser(userId: string, updates: Partial<User>): Promise<User> {
        try {
            const token = this.getAccessToken();
            if (!token) {
                throw new Error('未登录');
            }

            const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(updates),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || '更新用户信息失败');
            }

            const data = await response.json();
            return data.user;
        } catch (error) {
            console.error('更新用户信息失败:', error);
            throw error;
        }
    }

    /**
     * 删除用户（管理员功能）
     */
    async deleteUser(userId: string): Promise<void> {
        try {
            const token = this.getAccessToken();
            if (!token) {
                throw new Error('未登录');
            }

            const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || '删除用户失败');
            }
        } catch (error) {
            console.error('删除用户失败:', error);
            throw error;
        }
    }

    // ==================== 工具方法 ====================

    /**
     * 检查是否已登录
     */
    isAuthenticated(): boolean {
        return !!this.getAccessToken();
    }

    /**
     * 获取存储的用户信息
     */
    getStoredUser(): User | null {
        try {
            const userStr = localStorage.getItem('user');
            return userStr ? JSON.parse(userStr) : null;
        } catch (error) {
            console.error('获取存储用户信息失败:', error);
            return null;
        }
    }

    /**
     * 获取访问令牌
     */
    getAccessToken(): string | null {
        return localStorage.getItem('access_token');
    }

    /**
     * 下载简历文件
     */
    async downloadResume(taskId: string): Promise<void> {
        try {
            const response = await fetch(`${API_BASE_URL}/upload/download/${taskId}`);
            if (!response.ok) {
                throw new Error('下载简历失败');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `resume_${taskId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('下载简历失败:', error);
            throw error;
        }
    }

    /**
     * 删除候选人
     */
    async deleteCandidate(candidateId: string): Promise<void> {
        try {
            const response = await fetch(`${API_BASE_URL}/tasks/${candidateId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('删除候选人失败');
            }
        } catch (error) {
            console.error('删除候选人失败:', error);
            throw error;
        }
    }
}

// 创建并导出API服务实例
export const apiService = new ApiService();
export default apiService;