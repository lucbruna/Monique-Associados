import { useState } from 'react';
import { BookOpenIcon, ScaleIcon, DocumentTextIcon, ChevronRightIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { VADEMECUM_SECOES, VADEMECUM_METADATA } from '../../data/vadeMecum';
import ConstituicaoFederalViewer from './ConstituicaoFederalViewer';

export default function VadeMecumViewer() {
  const [activeSection, setActiveSection] = useState<string>('cf88');
  const [search, setSearch] = useState('');

  const filteredSecoes = VADEMECUM_SECOES.filter(
    (s) =>
      s.ativo &&
      (s.titulo.toLowerCase().includes(search.toLowerCase()) ||
        (s.descricao?.toLowerCase().includes(search.toLowerCase()) ?? false))
  );

  return (
    <div className="flex h-full flex-col">
      <header className="mb-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <BookOpenIcon className="h-7 w-7 text-blue-600 dark:text-blue-400" />
              {VADEMECUM_METADATA.titulo}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{VADEMECUM_METADATA.subtitulo}</p>
          </div>
          <div className="relative w-full sm:w-80">
            <MagnifyingGlassIcon className="h-4 w-4 absolute left-2 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar norma..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden">
        <aside className="lg:w-96 w-full border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 p-4 overflow-hidden flex flex-col">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
            <ScaleIcon className="h-5 w-5" />
            Normas e Diplomas
          </h3>
          <div className="overflow-y-auto flex-1 space-y-2 pr-1">
            {filteredSecoes.map((secao) => {
              const isActive = activeSection === secao.id;
              return (
                <button
                  key={secao.id}
                  onClick={() => setActiveSection(secao.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all flex items-start justify-between gap-2 ${
                    isActive
                      ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/40'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex-1">
                    <div className={`font-medium text-sm ${isActive ? 'text-blue-900 dark:text-blue-100' : 'text-slate-800 dark:text-slate-100'}`}>
                      {secao.titulo}
                    </div>
                    {secao.descricao && (
                      <p className={`text-xs mt-1 line-clamp-2 ${isActive ? 'text-blue-700 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400'}`}>
                        {secao.descricao}
                      </p>
                    )}
                    <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${
                      isActive ? 'bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      {secao.tipo}
                    </span>
                  </div>
                  <ChevronRightIcon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                </button>
              );
            })}
            {filteredSecoes.length === 0 && (
              <div className="text-sm text-slate-500 p-3 text-center">Nenhuma norma encontrada</div>
            )}
          </div>
          <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            Versão {VADEMECUM_METADATA.versao} • {VADEMECUM_METADATA.ano}
          </div>
        </aside>

        <main className="flex-1 overflow-hidden border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 p-4">
          {activeSection === 'cf88' ? (
            <ConstituicaoFederalViewer />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400 p-6">
              <DocumentTextIcon className="h-14 w-14 mb-4 opacity-40" />
              <h3 className="text-lg font-medium mb-2">{VADEMECUM_SECOES.find((s) => s.id === activeSection)?.titulo}</h3>
              <p className="text-sm max-w-md mb-4">
                {VADEMECUM_SECOES.find((s) => s.id === activeSection)?.descricao}
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
                <ScaleIcon className="h-4 w-4" />
                Texto completo será adicionado em versão futura
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
