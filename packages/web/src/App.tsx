import React from 'react';
import {Toaster} from 'react-hot-toast';
import {RouterProvider} from 'react-router-dom';
import router from './router';
import './styles/global.less';
import ModalManager from './components/Modal';
import ZipDropZone from './components/ZipDropZone';
import useHotKeys from './hooks/useHotKeys';
import DropWindowPage from './pages/DropWindowPage';
/**
 * 应用根组件
 * 使用RouterProvider加载路由配置
 */
const App: React.FC = () => {
  useHotKeys();

  const isDropWindow =
    new URLSearchParams(window.location.search).get('window') === 'drop';

  if (isDropWindow) {
    return (
      <>
        <DropWindowPage />
        <Toaster position="top-center" />
      </>
    );
  }

  return (
    <>
      <RouterProvider router={router} />
      <ModalManager />
      <ZipDropZone />
      <Toaster position="top-center" />
    </>
  );
};

export default App;
