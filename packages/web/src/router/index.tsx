import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import AboutPage from '../pages/AboutPage'
import HomePage from '../pages/HomePage'

/**
 * 路由配置定义
 * 使用 createBrowserRouter 创建基于浏览器历史的路由器
 */
const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: 'about',
    element: <AboutPage />,
  },
]);

export default router;
