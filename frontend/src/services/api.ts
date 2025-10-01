/**
 * API服务
 */
const API_BASE_URL = 'http://localhost:8001/api/v1';

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
    skills?: string[];
    workExperience?: WorkExperience[];
    projects?: Project[];
    status: string;
    uploadTime: string;
    notes?: string;
    result?: any; // 解析结果
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
}

export const apiService = new ApiService();
