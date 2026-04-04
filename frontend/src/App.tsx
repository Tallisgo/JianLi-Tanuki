import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CandidateList from './pages/CandidateList';
import CandidateDetail from './pages/CandidateDetail';
import Login from './pages/Login';
import Profile from './pages/Profile';
import UserManagement from './pages/UserManagement';
import Help from './pages/Help';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import './App.css';

// 受保护的路由组件
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>加载中...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// 公共路由组件（已登录用户重定向到首页）
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>加载中...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const DEFAULT_CATEGORY_KEYS = ['tech', 'design', 'marketing', 'sales', 'hr', 'finance', 'admin', 'other'];

const CandidateRouteHandler: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  if (!slug) return <CandidateList />;

  let categoryKeys = DEFAULT_CATEGORY_KEYS;
  try {
    const saved = localStorage.getItem('positionCategories');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        categoryKeys = parsed.map((cat: any) => cat.key || cat.id);
      }
    }
  } catch { /* use defaults */ }

  if (categoryKeys.includes(slug)) {
    return <CandidateList category={slug} />;
  }

  return <CandidateDetail />;
};

const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <Routes>
              {/* 公共路由 */}
              <Route path="/login" element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } />

              {/* 受保护的路由 */}
              <Route path="/*" element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/candidates" element={<CandidateList />} />
                      <Route path="/candidates/:slug" element={<CandidateRouteHandler />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/users" element={<UserManagement />} />
                      <Route path="/help" element={<Help />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              } />
            </Routes>
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </ConfigProvider>
  );
};

export default App;