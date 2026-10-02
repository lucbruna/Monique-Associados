import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import api from './lib/axios';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Cases from './pages/Cases';
import CaseDetail from './pages/CaseDetail';
import Calendar from './pages/Calendar';
import Documents from './pages/Documents';
import Deadlines from './pages/Deadlines';
import Fees from './pages/Fees';
import Settings from './pages/Settings';
import ConstituicaoFederal from './pages/legal/ConstituicaoFederal';
import VadeMecum from './pages/legal/VadeMecum';

function App() {
  const { isAuthenticated } = useAuthStore();
  const setPermissions = useAuthStore((state) => state.setPermissions);

  // As permissões são persistidas no localStorage no login e só eram buscadas
  // ali. Quando o backend muda as permissões de um cargo, a sessão antiga continua
  // usando o objeto velho e ações some da tela. Buscar ao abrir o app mantém a
  // interface alinhada com o backend sem exigir logout.
  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    api
      .get('/users/me/permissions')
      .then((response) => {
        if (!cancelled) setPermissions(response.data.data.permissions);
      })
      .catch(() => {
        // Falha em sincronizar permissões não deve derrubar o app;
        // o backend segue autorizando cada ação.
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, setPermissions]);

  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
        
        <Route element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/cases" element={<Cases />} />
          <Route path="/cases/:id" element={<CaseDetail />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/constituicao-federal" element={<ConstituicaoFederal />} />
          <Route path="/vade-mecum" element={<VadeMecum />} />
          <Route path="/deadlines" element={<Deadlines />} />
          <Route path="/fees" element={<Fees />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </>
  );
}

export default App;
