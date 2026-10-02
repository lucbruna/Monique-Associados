export const CF_METADATA = {
  titulo: 'Constituição da República Federativa do Brasil',
  promulgacao: '05 de outubro de 1988',
  nomeCurto: 'CF/88',
  abrev: 'CF',
};

export type CFInciso = {
  num: string;
  texto: string;
  alineas?: Array<{
    num: string;
    texto: string;
  }>;
};

export type CFParagrafo = {
  num: string;
  texto: string;
};

export type CFArtigo = {
  num: string;
  titulo?: string;
  caput?: string;
  texto?: string;
  textoInicial?: string;
  paragrafoUnico?: string;
  paragrafos?: CFParagrafo[];
  incisos?: CFInciso[];
};

export type CFSeção = {
  num?: string;
  titulo: string;
  artigos: CFArtigo[];
};

export type CFCapitulo = {
  num?: string;
  titulo: string;
  secoes?: CFSeção[];
  artigos?: CFArtigo[];
};

export type CFTitulo = {
  num: string;
  titulo: string;
  capitulos?: CFCapitulo[];
  artigos?: CFArtigo[];
};

export type CFParte = {
  tipo: 'preâmbulo' | 'título' | 'adct';
  titulo?: string;
  num?: string;
  texto?: string;
  titulos?: CFTitulo[];
  artigos?: CFArtigo[];
};

export const PREAMBULO = 'Nós, representantes do povo brasileiro, reunidos em Assembleia Nacional Constituinte para instituir um Estado Democrático, destinado a assegurar o exercício dos direitos sociais e individuais, a liberdade, a segurança, o bem-estar, o desenvolvimento, a igualdade e a justiça como valores supremos de uma sociedade fraterna, pluralista e sem preconceitos, fundada na harmonia social e comprometida, na ordem interna e internacional, com a solução pacífica das controvérsias, promulgamos, sob a proteção de Deus, a seguinte CONSTITUIÇÃO DA REPÚBLICA FEDERATIVA DO BRASIL.';

export const CONSTITUICAO_FEDERAL_88: CFParte[] = [
  {
    tipo: 'preâmbulo',
    titulo: 'Preâmbulo',
    texto: PREAMBULO,
  },
  {
    tipo: 'título',
    titulo: 'TÍTULO I - Dos Princípios Fundamentais',
    num: 'I',
    titulos: [
      {
        num: 'I',
        titulo: 'Dos Princípios Fundamentais',
        capitulos: [
          {
            num: '',
            titulo: '',
            artigos: [
              {
                num: '1º',
                texto: 'A República Federativa do Brasil, formada pela união indissolúvel dos Estados e Municípios e do Distrito Federal, constitui-se em Estado Democrático de Direito e tem como fundamentos:',
                incisos: [
                  { num: 'I', texto: 'a soberania;' },
                  { num: 'II', texto: 'a cidadania;' },
                  { num: 'III', texto: 'a dignidade da pessoa humana;' },
                  { num: 'IV', texto: 'os valores sociais do trabalho e da livre iniciativa;' },
                  { num: 'V', texto: 'o pluralismo político.' },
                ],
              },
              {
                num: '2º',
                texto: 'São Poderes da União, independentes e harmônicos entre si, o Legislativo, o Executivo e o Judiciário.',
              },
              {
                num: '3º',
                texto: 'O Estado deve observar os seguintes objetivos fundamentais:',
                incisos: [
                  { num: 'I', texto: 'construir uma sociedade livre, justa e solidária;' },
                  { num: 'II', texto: 'garantir o desenvolvimento nacional;' },
                  { num: 'III', texto: 'erradicar a pobreza e a marginalização e reduzir as desigualdades sociais e regionais;' },
                  { num: 'IV', texto: 'promover o bem de todos, sem preconceitos de origem, raça, sexo, cor, idade e quaisquer outras formas de discriminação.' },
                ],
              },
              {
                num: '4º',
                texto: 'O Brasil rege-se nas suas relações internacionais pelos seguintes princípios:',
                incisos: [
                  { num: 'I', texto: 'independência nacional;' },
                  { num: 'II', texto: 'prevalência dos direitos humanos;' },
                  { num: 'III', texto: 'autodeterminação dos povos;' },
                  { num: 'IV', texto: 'não-intervenção;' },
                  { num: 'V', texto: 'igualdade entre os Estados;' },
                  { num: 'VI', texto: 'defesa da paz;' },
                  { num: 'VII', texto: 'solução pacífica dos conflitos;' },
                  { num: 'VIII', texto: 'repúdio ao terrorismo e ao racismo;' },
                  { num: 'IX', texto: 'cooperação entre os povos para o progresso da humanidade;' },
                  { num: 'X', texto: 'concessão de asilo político.' },
                ],
                paragrafoUnico: 'Parágrafo único. A República Federativa do Brasil buscará a integração econômica, política, social e cultural dos povos da América Latina, visando à formação de uma comunidade latino-americana de nações.',
              },
            ],
          },
        ],
      },
    ],
  },
];