import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext.jsx';
import { AppRouter } from '@/routes/AppRouter.jsx';
import { GlobalLoader } from '@/components/ui/GlobalLoader.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
        <GlobalLoader />
      </AuthProvider>
    </BrowserRouter>
  );
}
