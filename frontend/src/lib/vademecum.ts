/**
 * Tipos e carregamento do Vade-Mécum.
 *
 * Os textos das normas ficam em `public/vademecum/*.json` (um arquivo por
 * norma) em vez de embutidos no bundle: são ~5,7 MB e embutir travaria o build.
 * O carregamento é sob demanda — só a norma aberta é baixada.
 */

export type VadeInciso = {
  num: string;
  texto: string;
  alineas?: Array<{ num: string; texto: string }>;
};

export type VadeParagrafo = {
  num: string;
  texto: string;
  alineas?: Array<{ num: string; texto: string }>;
};

export type VadeArtigo = {
  num: string;
  caput: string;
  incisos?: VadeInciso[];
  paragrafoUnico?: string;
  paragrafos?: VadeParagrafo[];
  /** Linhas que o parser não classificou (notas, tabelas) — exibidas como estão. */
  extras?: string[];
  /** Caminho hierárquico (TÍTULO/CAPÍTULO/SEÇÃO) vigente no artigo. */
  hier?: string[];
};

export type VadeParte = {
  id: string;
  titulo: string;
  subtitulo?: string;
  artigos: VadeArtigo[];
};

export type VadeNorma = {
  id: string;
  titulo: string;
  descricao: string;
  tipo: string;
  totalArtigos: number;
  /** CF/88 tem preâmbulo e duas partes (corpo + ADCT); as demais, `artigos`. */
  partes?: VadeParte[];
  artigos?: VadeArtigo[];
};

export type VadeIndexItem = {
  id: string;
  titulo: string;
  descricao: string;
  tipo: string;
  ano?: string;
  totalArtigos: number;
  arquivo: string;
};

export type VadeMeta = {
  titulo: string;
  subtitulo: string;
  fonte: string;
  versao: string;
  ano: string;
  totalNormas: number;
  normas: VadeIndexItem[];
};

const BASE = `${import.meta.env.BASE_URL}vademecum`;

export async function carregaIndex(): Promise<VadeMeta> {
  const r = await fetch(`${BASE}/index.json`);
  if (!r.ok) throw new Error(`Falha ao carregar o índice (${r.status})`);
  return r.json();
}

const cache = new Map<string, VadeNorma>();

export async function carregaNorma(id: string): Promise<VadeNorma> {
  const emCache = cache.get(id);
  if (emCache) return emCache;
  const r = await fetch(`${BASE}/${id}.json`);
  if (!r.ok) throw new Error(`Falha ao carregar a norma (${r.status})`);
  const norma: VadeNorma = await r.json();
  cache.set(id, norma);
  return norma;
}

/** Artigos de uma norma, independentemente de vir em `artigos` ou `partes`. */
export function artigosDaNorma(n: VadeNorma): VadeArtigo[] {
  if (n.partes) return n.partes.flatMap((p) => p.artigos);
  return n.artigos ?? [];
}

/** Texto plano de um artigo, para busca e pré-visualização. */
export function textoDoArtigo(a: VadeArtigo): string {
  const p: string[] = [a.caput];
  a.incisos?.forEach((i) => {
    p.push(`${i.num} - ${i.texto}`);
    i.alineas?.forEach((al) => p.push(`${al.num} ${al.texto}`));
  });
  if (a.paragrafoUnico) p.push(a.paragrafoUnico);
  a.paragrafos?.forEach((par) => {
    p.push(`§ ${par.num} ${par.texto}`);
    par.alineas?.forEach((al) => p.push(`${al.num} ${al.texto}`));
  });
  a.extras?.forEach((e) => p.push(e));
  return p.join(' ');
}
