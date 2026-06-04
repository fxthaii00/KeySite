import { BrowserRouter } from 'react-router-dom';
import { AuthProvider }  from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import AppRouter         from './routes/AppRouter';
import './styles/globals.css';
import './styles/toast.css';

/**
 * App — root component.
 * Provider order: BrowserRouter → Auth → Toast → Router
 */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRouter />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
