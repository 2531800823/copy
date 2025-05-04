import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'

console.log(window?.ipcRenderer);
/**
 * 渲染应用到DOM
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />,
);
