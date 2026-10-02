import { useCallback, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

const CHAVE = 'theme';

/**
 * O index.html ja aplicou a classe `dark` antes da primeira pintura, entao o
 * estado inicial e lido do DOM em vez de recalcular a preferencia.
 */
function lerTemaDoDom(): Theme {
  if (typeof document !== 'undefined' && document.documentElement.classList.contains('dark')) {
    return 'dark';
  }
  return 'light';
}

function lerPreferenciaSalva(): Theme | null {
  try {
    const bruto = localStorage.getItem(CHAVE);
    return bruto === 'light' || bruto === 'dark' ? bruto : null;
  } catch (e) {
    return null;
  }
}

/**
 * Le e escreve o tema de forma sincronizada com o script inline do index.html.
 * Sem preferencia salva, segue o que o sistema operacional pedir, inclusive
 * quando o usuario muda o tema do sistema com o app aberto.
 */
export function useTheme() {
  const [tema, setTema] = useState<Theme>(lerTemaDoDom);

  const aplicar = useCallback((proximo: Theme) => {
    document.documentElement.classList.toggle('dark', proximo === 'dark');
    document.documentElement.style.colorScheme = proximo;
    try {
      localStorage.setItem(CHAVE, proximo);
    } catch (e) {
      // Sem persistencia (modo privado) o tema ainda vale para a sessao.
    }
    setTema(proximo);
  }, []);

  const alternar = useCallback(() => {
    aplicar(tema === 'dark' ? 'light' : 'dark');
  }, [tema, aplicar]);

  useEffect(() => {
    if (lerPreferenciaSalva() !== null) {
      return;
    }
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const aoMudar = (evento: MediaQueryListEvent) => {
      const proximo: Theme = evento.matches ? 'dark' : 'light';
      document.documentElement.classList.toggle('dark', proximo === 'dark');
      document.documentElement.style.colorScheme = proximo;
      setTema(proximo);
    };
    mql.addEventListener('change', aoMudar);
    return () => mql.removeEventListener('change', aoMudar);
  }, []);

  return { tema, alternar, definirTema: aplicar };
}