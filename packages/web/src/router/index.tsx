import React from 'react';
import {createBrowserRouter} from 'react-router-dom';
import AboutPage from '../pages/AboutPage';
import HomePage from '../pages/HomePage';
import SettingsPage from '../pages/SettingsPage';
import UserManagement from '@/components/UserManagement';

/**
 * 路由配置定义
 * 使用BrowserRouter实现浏览器模式路由，配合Electron协议使用
 * basename设置为/app，这样根路径/就会匹配到HomePage
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
], {
  basename: '/app'
});

export default router;
