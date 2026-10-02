import { Fragment } from 'react';
import type { VadeArtigo } from '../../lib/vademecum';

/** Cabeçalhos de hierarquia (TÍTULO/CAPÍTULO/SEÇÃO) que mudaram entre artigos. */
function HierArquivo({ hier }: { hier?: string[] }) {
  if (!hier || hier.length === 0) return null;
  return (
    <div className="mb-3 space-y-0.5">
      {hier.map((h, i) => (
        <p
          key={i}
          className={
            i === 0
              ? 'text-[11px] font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400'
              : 'text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400'
          }
        >
          {h}
        </p>
      ))}
    </div>
  );
}

/** Renderiza um artigo no formato da lei: caput, incisos, parágrafos, alíneas. */
export default function ArtigoTexto({ artigo }: { artigo: VadeArtigo }) {
  return (
    <article className="max-w-3xl mx-auto">
      <header className="mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Art. {artigo.num}
        </h1>
      </header>

      <HierArquivo hier={artigo.hier} />

      <div className="leading-relaxed text-slate-800 dark:text-slate-200 space-y-2">
        <p className="text-justify">
          <span className="font-semibold">Art. {artigo.num}. </span>
          {artigo.caput}
        </p>

        {artigo.incisos?.map((inc, i) => (
          <Fragment key={i}>
            <p className="pl-6 text-justify">
              <span className="font-medium">{inc.num} - </span>
              {inc.texto}
            </p>
            {inc.alineas?.map((al, j) => (
              <p key={j} className="pl-12 text-justify">
                <span className="font-medium">{al.num} </span>
                {al.texto}
              </p>
            ))}
          </Fragment>
        ))}

        {artigo.paragrafoUnico && (
          <p className="text-justify">{artigo.paragrafoUnico}</p>
        )}

        {artigo.paragrafos?.map((par, i) => (
          <Fragment key={i}>
            <p className="text-justify">
              <span className="font-medium">§ {par.num}º </span>
              {par.texto}
            </p>
            {par.alineas?.map((al, j) => (
              <p key={j} className="pl-12 text-justify">
                <span className="font-medium">{al.num} </span>
                {al.texto}
              </p>
            ))}
          </Fragment>
        ))}

        {artigo.extras?.map((ex, i) => (
          <p key={i} className="text-justify text-sm text-slate-600 dark:text-slate-400">
            {ex}
          </p>
        ))}
      </div>
    </article>
  );
}
