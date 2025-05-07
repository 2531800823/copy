import React from 'react';
import { RouterProvider } from 'react-router-dom';
import router from './router';
import './styles/global.less';

/**
 * 应用根组件
 * 使用RouterProvider加载路由配置
 */
const App: React.FC = () => {
  return <RouterProvider router={router} />;
}

export default App;
