import * as React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import AuthServiceProvider from './auth/AuthServiceProvider';

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthServiceProvider>
        <App />
      </AuthServiceProvider>
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById('root')
);
