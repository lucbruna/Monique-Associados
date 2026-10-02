import { useState, useMemo } from 'react';
import { MagnifyingGlassIcon, ArrowLeftIcon, ArrowRightIcon, DocumentTextIcon, ListBulletIcon, BookmarkIcon } from '@heroicons/react/24/outline';
import { CONSTITUICAO_FEDERAL_88, CF_METADATA, type CFArtigo, type CFTitulo } from '../../data/constituicaoFederal88';

function buildArtigoTexto(art: CFArtigo): string {
  const parts: string[] = [];

  if (art.caput) parts.push(art.caput);
  if (art.texto) parts.push(art.texto);
  if (art.textoInicial) parts.push(art.textoInicial);

  if (art.incisos && art.incisos.length > 0) {
    art.incisos.forEach((inc) => {
      parts.push(`\n${inc.num} ${inc.texto}`);
      inc.alineas?.forEach((al) => {
        parts.push(`\n${al.num} ${al.texto}`);
      });
    });
  }

  if (art.paragrafoUnico) {
    parts.push(`\n\n${art.paragrafoUnico}`);
  }

  if (art.paragrafos && art.paragrafos.length > 0) {
    art.paragrafos.forEach((p) => {
      parts.push(`\n\n§ ${p.num} ${p.texto}`);
    });
  }

  return parts.join('\n');
}

function ArtigoView({ artigo }: { artigo?: { num: string; texto: string; titulo?: string } }) {
  if (!artigo) return null;
  return (
    <article className="max-w-4xl mx-auto">
      <header className="mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {artigo.num === 'Preâmbulo' ? 'Preâmbulo' : `Artigo ${artigo.num}`}
        </h1>
        {artigo.titulo && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{artigo.titulo}</p>}
      </header>
      <div className="prose prose-slate dark:prose-invert max-w-none whitespace-pre-wrap leading-relaxed text-slate-800 dark:text-slate-200">
        {artigo.texto}
      </div>
    </article>
  );
}

export default function ConstituicaoFederalViewer() {
  const [search, setSearch] = useState('');
  const [selectedArtigo, setSelectedArtigo] = useState<string | null>(null);
  const [showSumario, setShowSumario] = useState(true);

  const allArtigos = useMemo(() => {
    const artigos: Array<{ num: string; texto: string; titulo?: string }> = [];
    CONSTITUICAO_FEDERAL_88.forEach((parte) => {
      if (parte.tipo === 'preâmbulo' && parte.texto) {
        artigos.push({ num: 'Preâmbulo', texto: parte.texto });
      }
      parte.titulos?.forEach((titulo: CFTitulo) => {
        titulo.capitulos?.forEach((cap) => {
          cap.artigos?.forEach((art: CFArtigo) => {
            const textoCompleto = buildArtigoTexto(art);
            artigos.push({ num: art.num, texto: textoCompleto, titulo: art.titulo });
          });
          cap.secoes?.forEach((sec) => {
            sec.artigos.forEach((art: CFArtigo) => {
              const textoCompleto = buildArtigoTexto(art);
              artigos.push({ num: art.num, texto: textoCompleto, titulo: art.titulo });
            });
          });
        });
      });
    });
    return artigos;
  }, []);

  const filteredArtigos = useMemo(() => {
    if (!search.trim()) return allArtigos;
    const term = search.toLowerCase();
    return allArtigos.filter(
      (a) => a.num.toLowerCase().includes(term) || a.texto.toLowerCase().includes(term)
    );
  }, [allArtigos, search]);

  const index = useMemo(() => {
    return filteredArtigos.findIndex((a) => a.num === selectedArtigo);
  }, [filteredArtigos, selectedArtigo]);

  const goPrev = () => {
    if (index > 0) setSelectedArtigo(filteredArtigos[index - 1].num);
  };

  const goNext = () => {
    if (index < filteredArtigos.length - 1) setSelectedArtigo(filteredArtigos[index + 1].num);
  };

  return (
    <div className="flex h-full gap-4">
      {showSumario && (
        <aside className="w-80 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 pr-4 overflow-hidden flex flex-col">
          <div className="mb-4 space-y-2">
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
              {filteredArtigos.length} {filteredArtigos.length === 1 ? 'resultado' : 'resultados'}
            </div>
          </div>
          <div className="overflow-y-auto flex-1 space-y-1 pr-1">
            {filteredArtigos.map((art) => (
              <button
                key={art.num}
                onClick={() => setSelectedArtigo(art.num)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors border ${
                  selectedArtigo === art.num
                    ? 'bg-blue-50 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100'
                    : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="font-medium truncate">{art.num === 'Preâmbulo' ? 'Preâmbulo' : `Art. ${art.num}`}</div>
                <div className="text-xs line-clamp-2 opacity-70 mt-0.5">{art.texto}</div>
              </button>
            ))}
            {filteredArtigos.length === 0 && (
              <div className="text-sm text-slate-500 p-3">Nenhum resultado encontrado</div>
            )}
          </div>
        </aside>
      )}

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
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
              {CF_METADATA.titulo}
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {CF_METADATA.promulgacao} • {CF_METADATA.nomeCurto}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={goPrev}
              disabled={index <= 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Anterior
            </button>
            <button
              onClick={goNext}
              disabled={index < 0 || index >= filteredArtigos.length - 1}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300"
            >
              Próximo
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          {selectedArtigo ? (
            <ArtigoView artigo={allArtigos.find((a) => a.num === selectedArtigo)} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400">
              <BookmarkIcon className="h-12 w-12 mb-4 opacity-40" />
              <h3 className="text-lg font-medium mb-2">Selecione um artigo no sumário</h3>
              <p className="text-sm max-w-md">
                Navegue pelos artigos da Constituição Federal de 1988 ou use a busca para encontrar rapidamente o que precisa.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
