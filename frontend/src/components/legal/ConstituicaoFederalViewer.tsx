import { useState, useEffect, useMemo } from 'react';
import {
  MagnifyingGlassIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  DocumentTextIcon,
  ListBulletIcon,
  BookmarkIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import {
  carregaNorma,
  textoDoArtigo,
  type VadeNorma,
  type VadeArtigo,
} from '../../lib/vademecum';
import ArtigoTexto from './ArtigoTexto';

const PARTES = [
  { id: 'cf', titulo: 'Texto Constitucional' },
  { id: 'adct', titulo: 'Atos das Disposições Transitórias (ADCT)' },
];

export default function ConstituicaoFederalViewer() {
  const [norma, setNorma] = useState<VadeNorma | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [parteId, setParteId] = useState('cf');
  const [search, setSearch] = useState('');
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [showSumario, setShowSumario] = useState(true);

  useEffect(() => {
    carregaNorma('cf88')
      .then(setNorma)
      .catch((e) => setErro(e.message));
  }, []);

  const artigos = useMemo<VadeArtigo[]>(() => {
    if (!norma?.partes) return [];
    return norma.partes.find((p) => p.id === parteId)?.artigos ?? [];
  }, [norma, parteId]);

  const filteredArtigos = useMemo(() => {
    if (!search.trim()) return artigos;
    const term = search.toLowerCase();
    return artigos.filter(
      (a) => a.num.toLowerCase().includes(term) || textoDoArtigo(a).toLowerCase().includes(term)
    );
  }, [artigos, search]);

  const index = useMemo(
    () => filteredArtigos.findIndex((a) => a.num === selecionado),
    [filteredArtigos, selecionado]
  );

  const artigoAtual = useMemo(
    () => artigos.find((a) => a.num === selecionado),
    [artigos, selecionado]
  );

  if (erro) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center text-slate-500">
        <ExclamationTriangleIcon className="h-12 w-12 mb-3 text-amber-500" />
        <p className="text-sm">{erro}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {/* Abas CF / ADCT */}
      <div className="flex items-center gap-2 flex-wrap shrink-0">
        {PARTES.map((p) => {
          const total = norma?.partes?.find((x) => x.id === p.id)?.artigos.length ?? 0;
          return (
            <button
              key={p.id}
              onClick={() => {
                setParteId(p.id);
                setSelecionado(null);
              }}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                parteId === p.id
                  ? 'bg-blue-50 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100'
                  : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {p.titulo}
              <span className="ml-2 text-xs opacity-70">{total}</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 min-h-0 flex gap-4 overflow-hidden">
        {showSumario && (
          <aside className="w-80 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 pr-4 overflow-hidden flex flex-col min-h-0">
            <div className="mb-4 space-y-2 shrink-0">
              <h3 className="font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-100">
                <ListBulletIcon className="h-5 w-5" />
                Sumário
              </h3>
              <div className="relative">
                <MagnifyingGlassIcon className="h-4 w-4 absolute left-2 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar artigo ou palavra..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="text-xs text-slate-500">
                {filteredArtigos.length}{' '}
                {filteredArtigos.length === 1 ? 'resultado' : 'resultados'}
              </div>
            </div>
            <div className="overflow-y-auto flex-1 space-y-1 pr-1">
              {!norma && <div className="text-sm text-slate-500 p-3">Carregando...</div>}
              {filteredArtigos.map((art) => (
                <button
                  key={art.num}
                  onClick={() => setSelecionado(art.num)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors border ${
                    selecionado === art.num
                      ? 'bg-blue-50 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100'
                      : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="font-medium truncate">Art. {art.num}</div>
                  <div className="text-xs line-clamp-2 opacity-70 mt-0.5">{art.caput}</div>
                </button>
              ))}
              {norma && filteredArtigos.length === 0 && (
                <div className="text-sm text-slate-500 p-3">Nenhum resultado encontrado</div>
              )}
            </div>
          </aside>
        )}

        <main className="flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-4 gap-2 flex-wrap shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSumario(!showSumario)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                <ListBulletIcon className="h-4 w-4" />
                {showSumario ? 'Ocultar Sumário' : 'Mostrar Sumário'}
              </button>
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <DocumentTextIcon className="h-5 w-5" />
                Constituição Federal
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                05 de outubro de 1988 • CF/88
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => index > 0 && setSelecionado(filteredArtigos[index - 1].num)}
                disabled={index <= 0}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Anterior
              </button>
              <button
                onClick={() =>
                  index < filteredArtigos.length - 1 &&
                  setSelecionado(filteredArtigos[index + 1].num)
                }
                disabled={index < 0 || index >= filteredArtigos.length - 1}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300"
              >
                Próximo
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
            {artigoAtual ? (
              <ArtigoTexto artigo={artigoAtual} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400">
                <BookmarkIcon className="h-12 w-12 mb-4 opacity-40" />
                <h3 className="text-lg font-medium mb-2">Selecione um artigo no sumário</h3>
                <p className="text-sm max-w-md">
                  Navegue pelos artigos da Constituição Federal de 1988 ou use a busca para
                  encontrar rapidamente o que precisa.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
