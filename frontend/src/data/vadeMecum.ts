export const VADEMECUM_METADATA = {
  titulo: 'Vade-Mécum Jurídico',
  subtitulo: 'Constituição Federal e Normas Essenciais',
  versao: '1.0.0',
  ano: '2026',
};

export type VadeSecao = {
  id: string;
  titulo: string;
  descricao?: string;
  link?: string;
  tipo: 'cf88' | 'codigo' | 'lei' | 'doutrina' | 'outros';
  ativo: boolean;
};

export const VADEMECUM_SECOES: VadeSecao[] = [
  {
    id: 'cf88',
    titulo: 'Constituição Federal',
    descricao: 'Constituição da República Federativa do Brasil - CF/88 (texto completo)',
    tipo: 'cf88',
    ativo: true,
  },
  {
    id: 'cc',
    titulo: 'Código Civil',
    descricao: 'Lei nº 10.406/2002 - Código Civil',
    tipo: 'codigo',
    ativo: true,
  },
  {
    id: 'cp',
    titulo: 'Código Penal',
    descricao: 'Decreto-Lei nº 2.848/1940 - Código Penal',
    tipo: 'codigo',
    ativo: true,
  },
  {
    id: 'cpp',
    titulo: 'Código de Processo Penal',
    descricao: 'Lei nº 3.689/1941 - Código de Processo Penal',
    tipo: 'codigo',
    ativo: true,
  },
  {
    id: 'ncpc',
    titulo: 'Código de Processo Civil',
    descricao: 'Lei nº 13.105/2015 - Novo Código de Processo Civil',
    tipo: 'codigo',
    ativo: true,
  },
  {
    id: 'clt',
    titulo: 'Consolidação das Leis do Trabalho',
    descricao: 'Decreto-Lei nº 5.452/1943 - CLT',
    tipo: 'codigo',
    ativo: true,
  },
  {
    id: 'cdc',
    titulo: 'Código de Defesa do Consumidor',
    descricao: 'Lei nº 8.078/1990 - CDC',
    tipo: 'lei',
    ativo: true,
  },
  {
    id: 'eao',
    titulo: 'Lei de Execução Fiscal',
    descricao: 'Lei nº 6.830/1980',
    tipo: 'lei',
    ativo: true,
  },
  {
    id: 'lcp',
    titulo: 'Lei das Contravenções Penais',
    descricao: 'Decreto-Lei nº 3.688/1941',
    tipo: 'lei',
    ativo: true,
  },
  {
    id: 'linq',
    titulo: 'Lei de Improbidade Administrativa',
    descricao: 'Lei nº 8.429/1992',
    tipo: 'lei',
    ativo: true,
  },
  {
    id: 'lao',
    titulo: 'Lei de Acesso à Informação',
    descricao: 'Lei nº 12.527/2011',
    tipo: 'lei',
    ativo: true,
  },
];