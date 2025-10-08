import React, { useState, useEffect } from 'react';
import {
    Modal,
    Form,
    Input,
    Select,
    Button,
    Row,
    Col,
    Card,
    message
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { Candidate } from '../services/api';

const { Option } = Select;
const { TextArea } = Input;

interface CandidateEditModalProps {
    visible: boolean;
    candidate: Candidate | null;
    onCancel: () => void;
    onSave: (candidate: Candidate) => void;
}

const CandidateEditModal: React.FC<CandidateEditModalProps> = ({
    visible,
    candidate,
    onCancel,
    onSave
}) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible && candidate) {
            form.setFieldsValue({
                name: candidate.name,
                phone: candidate.phone,
                email: candidate.email,
                address: candidate.address,
                position: candidate.position,
                education: candidate.education,
                school: candidate.school,
                major: candidate.major,
                skills: candidate.skills,
                workExperience: candidate.workExperience || [],
                projects: candidate.projects || [],
                notes: candidate.notes
            });
        }
    }, [visible, candidate, form]);

    const handleSave = async () => {
        try {
            setLoading(true);
            const values = await form.validateFields();

            const updatedCandidate: Candidate = {
                ...candidate!,
                ...values
            };

            onSave(updatedCandidate);
            message.success('候选人信息更新成功');
        } catch (error) {
            console.error('保存失败:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        onCancel();
    };

    return (
        <Modal
            title="编辑候选人信息"
            open={visible}
            onCancel={handleCancel}
            width={800}
            footer={[
                <Button key="cancel" onClick={handleCancel}>
                    取消
                </Button>,
                <Button key="save" type="primary" loading={loading} onClick={handleSave}>
                    保存
                </Button>
            ]}
        >
            <Form
                form={form}
                layout="vertical"
                initialValues={{
                    workExperience: [],
                    projects: [],
                    skills: []
                }}
            >
                <Card title="基本信息" size="small" style={{ marginBottom: 16 }}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="name"
                                label="姓名"
                                rules={[{ required: true, message: '请输入姓名' }]}
                            >
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="position" label="期望职位">
                                <Input />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item name="phone" label="电话">
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="email" label="邮箱">
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="address" label="地址">
                                <Input />
                            </Form.Item>
                        </Col>
                    </Row>
                </Card>

                <Card title="教育背景" size="small" style={{ marginBottom: 16 }}>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item name="education" label="学历">
                                <Select>
                                    <Option value="高中">高中</Option>
                                    <Option value="专科">专科</Option>
                                    <Option value="本科">本科</Option>
                                    <Option value="硕士">硕士</Option>
                                    <Option value="博士">博士</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="school" label="学校">
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="major" label="专业">
                                <Input />
                            </Form.Item>
                        </Col>
                    </Row>
                </Card>

                <Card title="技能标签" size="small" style={{ marginBottom: 16 }}>
                    <Form.Item name="skills" label="技能">
                        <Select mode="tags" placeholder="请输入技能">
                            {candidate?.skills?.map(skill => (
                                <Option key={skill} value={skill}>{skill}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Card>

                <Card title="工作经历" size="small" style={{ marginBottom: 16 }}>
                    <Form.List name="workExperience">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <div key={key} style={{ marginBottom: 16, padding: 16, border: '1px solid #d9d9d9', borderRadius: 6 }}>
                                        <Row gutter={16}>
                                            <Col span={12}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'company']}
                                                    label="公司"
                                                    rules={[{ required: true, message: '请输入公司名称' }]}
                                                >
                                                    <Input />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'position']}
                                                    label="职位"
                                                    rules={[{ required: true, message: '请输入职位' }]}
                                                >
                                                    <Input />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                        <Row gutter={16}>
                                            <Col span={12}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'start_date']}
                                                    label="开始时间"
                                                >
                                                    <Input placeholder="2020.01" />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'end_date']}
                                                    label="结束时间"
                                                >
                                                    <Input placeholder="2022.12" />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                        <Form.Item
                                            {...restField}
                                            name={[name, 'description']}
                                            label="工作描述"
                                        >
                                            <TextArea rows={3} />
                                        </Form.Item>
                                        <Button
                                            type="text"
                                            danger
                                            icon={<DeleteOutlined />}
                                            onClick={() => remove(name)}
                                        >
                                            删除
                                        </Button>
                                    </div>
                                ))}
                                <Form.Item>
                                    <Button
                                        type="dashed"
                                        onClick={() => add()}
                                        block
                                        icon={<PlusOutlined />}
                                    >
                                        添加工作经历
                                    </Button>
                                </Form.Item>
                            </>
                        )}
                    </Form.List>
                </Card>

                <Card title="项目经历" size="small" style={{ marginBottom: 16 }}>
                    <Form.List name="projects">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <div key={key} style={{ marginBottom: 16, padding: 16, border: '1px solid #d9d9d9', borderRadius: 6 }}>
                                        <Row gutter={16}>
                                            <Col span={12}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'name']}
                                                    label="项目名称"
                                                    rules={[{ required: true, message: '请输入项目名称' }]}
                                                >
                                                    <Input />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'technologies']}
                                                    label="技术栈"
                                                >
                                                    <Select mode="tags" placeholder="请输入技术栈">
                                                        <Option value="React">React</Option>
                                                        <Option value="Vue">Vue</Option>
                                                        <Option value="Node.js">Node.js</Option>
                                                        <Option value="Python">Python</Option>
                                                        <Option value="Java">Java</Option>
                                                    </Select>
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                        <Form.Item
                                            {...restField}
                                            name={[name, 'description']}
                                            label="项目描述"
                                        >
                                            <TextArea rows={3} />
                                        </Form.Item>
                                        <Button
                                            type="text"
                                            danger
                                            icon={<DeleteOutlined />}
                                            onClick={() => remove(name)}
                                        >
                                            删除
                                        </Button>
                                    </div>
                                ))}
                                <Form.Item>
                                    <Button
                                        type="dashed"
                                        onClick={() => add()}
                                        block
                                        icon={<PlusOutlined />}
                                    >
                                        添加项目经历
                                    </Button>
                                </Form.Item>
                            </>
                        )}
                    </Form.List>
                </Card>

                <Card title="备注信息" size="small">
                    <Form.Item name="notes" label="备注">
                        <TextArea rows={4} placeholder="请输入备注信息" />
                    </Form.Item>
                </Card>
            </Form>
        </Modal>
    );
};

export default CandidateEditModal;
