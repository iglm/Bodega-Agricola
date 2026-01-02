
import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider, useData } from './contexts/DataContext';
import { MainLayout } from './layouts/MainLayout';
import { Landing } from './components/Landing';
import { Notification } from './components/Notification';

const AppContent = () => {
  const { isDataLoaded, actions } = useData();
  const { session, login } = useAuth();
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
      setNotification({ message, type });
  };

  if (!isDataLoaded) {
      return (
          <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
              <p className="text-emerald-400 font-black text-xs uppercase tracking-widest">Iniciando Ecosistema...</p>
          </div>
      );
  }

  return (
    <>
      {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
      {!session ? (
        <Landing 
          onEnter={login} 
          onShowManual={() => { /* Implementar lógica de manual si necesario en landing */ }} 
          onLoadDemoData={actions.loadDemoData} 
        />
      ) : (
        <MainLayout onShowNotification={showNotification} />
      )}
    </>
  );
};

function App() {
  // Wrapper provisional para pasar la notificación al provider si fuera necesario, 
  // aunque en esta arquitectura el DataProvider es agnóstico a la UI y AppContent maneja la UI.
  // El prop 'notify' en DataProvider es opcional o se puede usar un no-op si la UI maneja el estado.
  const [tempNotification, setTempNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider notify={(msg, type) => setTempNotification({message: msg, type})}>
           {tempNotification && <Notification message={tempNotification.message} type={tempNotification.type} onClose={() => setTempNotification(null)} />}
           <AppContent />
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
