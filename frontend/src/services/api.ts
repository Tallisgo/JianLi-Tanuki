/**
 * API服务
 */
import { API_BASE_URL, getAuthUrls, getInspirationUrl, getRefreshInspirationUrl } from '../config/api';

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
    start_year?: string;
    end_year?: string;
    gpa?: string;
}

export interface WorkExperience {
    company: string;
    position: string;
    duration: string;
    description: string;
    start_date?: string;
    end_date?: string;
    location?: string;
}

export interface Project {
    name: string;
    description: string;
    technologies: string[];
    start_date?: string;
    end_date?: string;
}

export interface TaskResponse {
    task_id: string;
    filename: string;
    status: string;
    progress: number;
    result?: any;
    error?: string;
    created_at: string;
    updated_at?: string;
    completed_at?: string;
}

export interface InspirationResponse {
    inspiration: string;
    date: string;
    timestamp: string;
    refreshed?: boolean;
}

// 用户相关接口
export interface User {
    id: number;
    username: string;
    email: string;
    full_name?: string;
    avatar?: string;
    phone?: string;
    role: string;
    status: string;
    last_login?: string;
    login_count: number;
    created_at: string;
    updated_at?: string;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    user?: User;
    access_token?: string;
    refresh_token?: string;
    token_type?: string;
    expires_in?: number;
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
     * 删除候选人
     */
    async deleteCandidate(id: string): Promise<boolean> {
        try {
            const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
                method: 'DELETE',
            });

            return response.ok;
        } catch (error) {
            console.error('删除候选人失败:', error);
            return false;
        }
    }

    /**
     * 下载简历文件
     */
    async downloadResume(id: string, filename: string): Promise<boolean> {
        try {
            const response = await fetch(`${API_BASE_URL}/upload/download/${id}`);

            if (!response.ok) {
                throw new Error('下载失败');
            }

            // 创建下载链接
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            return true;
        } catch (error) {
            console.error('下载简历失败:', error);
            return false;
        }
    }

    /**
     * 将任务转换为候选人格式
     */
    private convertTaskToCandidate(task: TaskResponse): Candidate {
        const result = task.result;

        return {
            id: task.task_id,
            name: result.name || '未知',
            phone: result.contact?.phone,
            email: result.contact?.email,
            address: result.contact?.address,
            position: result.experience?.[0]?.title || '未知',
            experience: this.calculateExperience(result.experience),
            education: result.education?.[0]?.degree || '未知',
            school: result.education?.[0]?.institution,
            major: result.education?.[0]?.major,
            educationList: result.education || [], // 添加完整教育背景列表
            skills: result.skills || [],
            workExperience: result.experience?.map((exp: any) => ({
                company: exp.company || '未知公司',
                position: exp.title || '未知职位',
                duration: this.formatDuration(exp.start_date, exp.end_date),
                description: exp.description || '',
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
     * 计算工作经验
     */
    private calculateExperience(experience: any[]): string {
        if (!experience || experience.length === 0) {
            return '无';
        }

        // 简单的经验计算逻辑
        const years = experience.length;
        return `${years}年`;
    }

    /**
     * 格式化工作期间
     */
    private formatDuration(startDate?: string, endDate?: string): string {
        if (!startDate) return '未知';

        const start = startDate;
        const end = endDate || '至今';

        return `${start} - ${end}`;
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
            console.log('API返回数据:', data);
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
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
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
            const token = localStorage.getItem('access_token');
            if (!token) {
                return null;
            }

            const response = await fetch(`${API_BASE_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                // 如果令牌无效，清除本地存储
                if (response.status === 401) {
                    this.logout();
                }
                return null;
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

            const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refresh_token: refreshToken }),
            });

            if (!response.ok) {
                return false;
            }

            const data: AuthResponse = await response.json();

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
            const token = localStorage.getItem('access_token');
            if (token) {
                await fetch(`${API_BASE_URL}/auth/logout`, {
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
    async updateProfile(profileData: Partial<User>): Promise<User> {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                throw new Error('未登录');
            }

            const response = await fetch(`${API_BASE_URL}/auth/me`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(profileData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || '更新资料失败');
            }

            const data = await response.json();

            // 更新本地存储的用户信息
            if (data.user) {
                localStorage.setItem('user', JSON.stringify(data.user));
            }

            return data.user;
        } catch (error) {
            console.error('更新资料失败:', error);
            throw error;
        }
    }

    /**
     * 修改密码
     */
    async changePassword(oldPassword: string, newPassword: string): Promise<void> {
        try {
            const token = localStorage.getItem('access_token');
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

    /**
     * 检查是否已登录
     */
    isAuthenticated(): boolean {
        const token = localStorage.getItem('access_token');
        const user = localStorage.getItem('user');
        return !!(token && user);
    }

    /**
     * 获取存储的用户信息
     */
    getStoredUser(): User | null {
        try {
            const userStr = localStorage.getItem('user');
            return userStr ? JSON.parse(userStr) : null;
        } catch (error) {
            console.error('解析用户信息失败:', error);
            return null;
        }
    }

    /**
     * 获取访问令牌
     */
    getAccessToken(): string | null {
        return localStorage.getItem('access_token');
    }
}

export const apiService = new ApiService();
