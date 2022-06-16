import { Route, Routes } from 'react-router-dom';

import RequireAuth from './auth/RequireAuth';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <RequireAuth>
            <HomePage />
          </RequireAuth>
        }
      />
      <Route path="login" element={<LoginPage />} />
    </Routes>
  );
}

export default App;
