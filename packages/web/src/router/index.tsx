import React from 'react';
import {createBrowserRouter} from 'react-router-dom';
import AboutPage from '../pages/AboutPage';
import HomePage from '../pages/HomePage';
import SettingsPage from '../pages/SettingsPage';
import UserManagement from '@/components/UserManagement';

/**
 * 路由配置定义
 * 使用BrowserRouter实现浏览器历史记录模式路由
 */
const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/about',
    element: <AboutPage />,
  },
  {
    path: '/settings',
    element: <SettingsPage />,
  },
  {
    path: '/user',
    element: <UserManagement />,
  },
]);
export default router;
