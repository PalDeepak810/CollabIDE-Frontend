import { UserProvider } from './contexts/UserContext';
import { SessionProvider } from './contexts/SessionContext';
import { AuthProvider } from './contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './AppRoutes';

function App() {
  return (
    <AuthProvider>
      <UserProvider>
        <SessionProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </SessionProvider>
      </UserProvider>
    </AuthProvider>
  );
}

export default App;
