import React from 'react';
import { RouterProvider } from 'react-router-dom';
import router from './router';
import './styles/global.less';
import ModalManager from './components/Modal';
import useHotKeys from './hooks/useHotKeys';
/**
 * 应用根组件
 * 使用RouterProvider加载路由配置
 */
const App: React.FC = () => {
  useHotKeys()
  return (
    <>
      <RouterProvider router={router} />
      <ModalManager />
    </>
  );
}

export default App;
