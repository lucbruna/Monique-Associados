import { useState, useEffect, useMemo } from 'react';
import {
  BookOpenIcon,
  ScaleIcon,
  DocumentTextIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  ListBulletIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import {
  carregaIndex,
  carregaNorma,
  artigosDaNorma,
  textoDoArtigo,
  type VadeMeta,
  type VadeNorma,
  type VadeArtigo,
} from '../../lib/vademecum';
import ArtigoTexto from './ArtigoTexto';

const TIPO_ROTULO: Record<string, string> = {
  cf88: 'Constituição',
  codigo: 'Código',
  lei: 'Lei',
  estatuto: 'Estatuto',
};

export default function VadeMecumViewer() {
  const [meta, setMeta] = useState<VadeMeta | null>(null);
  const [erroMeta, setErroMeta] = useState<string | null>(null);
  const [normaId, setNormaId] = useState<string>('cf88');
  const [norma, setNorma] = useState<VadeNorma | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erroNorma, setErroNorma] = useState<string | null>(null);
  const [buscaNorma, setBuscaNorma] = useState('');
  const [buscaArtigo, setBuscaArtigo] = useState('');
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [showSumario, setShowSumario] = useState(true);

  useEffect(() => {
    carregaIndex()
      .then(setMeta)
      .catch((e) => setErroMeta(e.message));
  }, []);

  useEffect(() => {
    if (!normaId) return;
    let cancelado = false;
    setCarregando(true);
    setErroNorma(null);
    setSelecionado(null);
    setBuscaArtigo('');
    carregaNorma(normaId)
      .then((n) => {
        if (!cancelado) setNorma(n);
      })
      .catch((e) => {
        if (!cancelado) setErroNorma(e.message);
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [normaId]);

  const artigos = useMemo(() => (norma ? artigosDaNorma(norma) : []), [norma]);

  const filtrados = useMemo(() => {
    if (!buscaArtigo.trim()) return artigos;
    const termo = buscaArtigo.toLowerCase();
    return artigos.filter(
      (a) => a.num.toLowerCase().includes(termo) || textoDoArtigo(a).toLowerCase().includes(termo)
    );
  }, [artigos, buscaArtigo]);

  const indice = useMemo(
    () => filtrados.findIndex((a) => a.num === selecionado),
    [filtrados, selecionado]
  );

  const normaisFiltradas = useMemo(() => {
    if (!meta) return [];
    if (!buscaNorma.trim()) return meta.normas;
    const t = buscaNorma.toLowerCase();
    return meta.normas.filter(
      (n) => n.titulo.toLowerCase().includes(t) || n.descricao.toLowerCase().includes(t)
    );
  }, [meta, buscaNorma]);

  const artigoAtual: VadeArtigo | undefined = useMemo(
    () => artigos.find((a) => a.num === selecionado),
    [artigos, selecionado]
  );

  if (erroMeta) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 p-6">
        <ExclamationTriangleIcon className="h-12 w-12 mb-3 text-amber-500" />
        <h3 className="text-lg font-medium mb-1">Não foi possível carregar o Vade-Mécum</h3>
        <p className="text-sm">{erroMeta}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <header className="mb-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <BookOpenIcon className="h-7 w-7 text-blue-600 dark:text-blue-400" />
              {meta?.titulo ?? 'Vade-Mécum Jurídico'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {meta?.subtitulo ?? 'Constituição Federal e Normas Essenciais'}
              {meta && ` • ${meta.totalNormas} normas`}
            </p>
          </div>
          <div className="relative w-full sm:w-80">
            <MagnifyingGlassIcon className="h-4 w-4 absolute left-2 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar norma..."
              value={buscaNorma}
              onChange={(e) => setBuscaNorma(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 overflow-hidden">
        {/* Lista de normas */}
        <aside className="lg:w-80 w-full border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 p-4 overflow-hidden flex flex-col min-h-0">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2 shrink-0">
            <ScaleIcon className="h-5 w-5" />
            Normas e Diplomas
          </h3>
          <div className="overflow-y-auto flex-1 space-y-2 pr-1">
            {!meta && <div className="text-sm text-slate-500 p-2">Carregando normas...</div>}
            {normaisFiltradas.map((n) => {
              const ativo = normaId === n.id;
              return (
                <button
                  key={n.id}
                  onClick={() => setNormaId(n.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all flex items-start justify-between gap-2 ${
                    ativo
                      ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/40'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div
                      className={`font-medium text-sm ${
                        ativo
                          ? 'text-blue-900 dark:text-blue-100'
                          : 'text-slate-800 dark:text-slate-100'
                      }`}
                    >
                      {n.titulo}
                    </div>
                    <p className="text-xs mt-0.5 text-slate-500 dark:text-slate-400 truncate">
                      {n.descricao}
                    </p>
                    <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {TIPO_ROTULO[n.tipo] ?? n.tipo} • {n.totalArtigos} arts
                    </span>
                  </div>
                  <ChevronRightIcon
                    className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                      ativo ? 'text-blue-600' : 'text-slate-400'
                    }`}
                  />
                </button>
              );
            })}
            {meta && normaisFiltradas.length === 0 && (
              <div className="text-sm text-slate-500 p-3 text-center">Nenhuma norma encontrada</div>
            )}
          </div>
          <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 shrink-0">
            {meta?.fonte ?? 'Vade Mecum — Senado Federal'}
          </div>
        </aside>

        {/* Leitor */}
        <main className="flex-1 min-h-0 min-w-0 flex gap-4 overflow-hidden">
          {showSumario && norma && (
            <aside className="w-72 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 pr-4 overflow-hidden flex flex-col min-h-0">
              <div className="mb-3 space-y-2 shrink-0">
                <h3 className="font-semibold flex items-center gap-2 text-sm text-slate-800 dark:text-slate-100">
                  <ListBulletIcon className="h-4 w-4" />
                  Artigos
                </h3>
                <div className="relative">
                  <MagnifyingGlassIcon className="h-4 w-4 absolute left-2 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar artigo ou palavra..."
                    value={buscaArtigo}
                    onChange={(e) => setBuscaArtigo(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div className="text-xs text-slate-500">
                  {filtrados.length} {filtrados.length === 1 ? 'resultado' : 'resultados'}
                </div>
              </div>
              <div className="overflow-y-auto flex-1 space-y-1 pr-1">
                {filtrados.map((a) => (
                  <button
                    key={a.num}
                    onClick={() => setSelecionado(a.num)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors border ${
                      selecionado === a.num
                        ? 'bg-blue-50 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100'
                        : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="font-medium truncate">Art. {a.num}</div>
                    <div className="text-xs line-clamp-2 opacity-70 mt-0.5">{a.caput}</div>
                  </button>
                ))}
                {filtrados.length === 0 && (
                  <div className="text-sm text-slate-500 p-3">Nenhum resultado encontrado</div>
                )}
              </div>
            </aside>
          )}

          <div className="flex-1 min-w-0 flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 gap-2 flex-wrap shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  onClick={() => setShowSumario(!showSumario)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  <ListBulletIcon className="h-4 w-4" />
                  {showSumario ? 'Ocultar' : 'Sumário'}
                </button>
                <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 truncate">
                  <DocumentTextIcon className="h-5 w-5 flex-shrink-0" />
                  {norma?.titulo ?? 'Carregando...'}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => indice > 0 && setSelecionado(filtrados[indice - 1].num)}
                  disabled={indice <= 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  Anterior
                </button>
                <button
                  onClick={() =>
                    indice >= 0 && indice < filtrados.length - 1 && setSelecionado(filtrados[indice + 1].num)
                  }
                  disabled={indice < 0 || indice >= filtrados.length - 1}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300"
                >
                  Próximo
                  <ArrowRightIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {carregando && (
                <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                  Carregando {normaId}...
                </div>
              )}
              {erroNorma && !carregando && (
                <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                  {erroNorma}
                </div>
              )}
              {!carregando && !erroNorma && artigoAtual && <ArtigoTexto artigo={artigoAtual} />}
              {!carregando && !erroNorma && !artigoAtual && (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400">
                  <BookOpenIcon className="h-12 w-12 mb-4 opacity-40" />
                  <h3 className="text-lg font-medium mb-2">Selecione um artigo no sumário</h3>
                  <p className="text-sm max-w-md">
                    Navegue pelos artigos de <strong>{norma?.titulo}</strong> ou use a busca para
                    encontrar rapidamente o dispositivo que precisa.
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
