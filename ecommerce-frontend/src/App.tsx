import { AppRouter } from './routes';
import { ToastProvider } from './components/Toast/Toast';
import { ConfirmProvider } from './components/Toast/ConfirmDialog';
import './App.css'

function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <AppRouter />
      </ConfirmProvider>
    </ToastProvider>
  );
}

export default App
