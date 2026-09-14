import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { requestPersistentStorage } from './utils/storage';
import './styles.css';

// 入力中データ・未出力の写真がOS都合で削除されないよう、起動時に永続保存を要求する
requestPersistentStorage();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
