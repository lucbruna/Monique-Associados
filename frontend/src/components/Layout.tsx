import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  return (
    // h-dvh em vez de h-screen: em notebook/tablet a barra do navegador móvel
    // entra na conta de 100vh e corta o rodapé. overflow-hidden na raiz garante
    // que só os painéis internos rolem, nunca a página inteira.
    <div className="flex h-dvh overflow-hidden bg-slate-100 dark:bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <Header />
        <main className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
        <footer className="shrink-0 border-t border-gold-200/60 dark:border-gold-700/60/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur py-3 px-6">
          <div className="text-center text-xs text-slate-500 dark:text-slate-400">
            Desenvolvido por{' '}
            <span className="font-semibold text-gold-700 dark:text-gold-400">Luciano Tomé</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
