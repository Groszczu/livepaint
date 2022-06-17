import { Route, Routes } from 'react-router-dom';

import RequireAuth from './auth/RequireAuth';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RoomPage from './pages/RoomPage';

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
      <Route
        path="/room/:roomId"
        element={
          <RequireAuth>
            <RoomPage />
          </RequireAuth>
        }
      />
      <Route path="login" element={<LoginPage />} />
    </Routes>
  );
}

export default App;
