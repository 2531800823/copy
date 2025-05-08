import React from 'react';
import { createHashRouter } from 'react-router-dom';
import AboutPage from '../pages/AboutPage'
import HomePage from '../pages/HomePage'
import SettingsPage from '../pages/SettingsPage'

/**
 * 路由配置定义
 * 在电子应用中使用HashRouter，在浏览器中使用BrowserRouter
 */
const router = createHashRouter([
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
])
export default router;
