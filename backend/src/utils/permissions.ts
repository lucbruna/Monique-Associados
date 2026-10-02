// Utilitário de permissões por cargo - Monique Advogados

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  SOCIO: 'SOCIO',
  ADVOGADO: 'ADVOGADO',
  ASSISTENTE: 'ASSISTENTE',
  SECRETARIO: 'SECRETARIO',
  FINANCEIRO: 'FINANCEIRO',
  RH: 'RH',
  TI: 'TI',
  RECEPCIONISTA: 'RECEPCIONISTA',
  CORRESPONDENTE: 'CORRESPONDENTE',
  PARALEGAL: 'PARALEGAL',
  ANALISTA: 'ANALISTA',
  COORDENADOR: 'COORDENADOR',
  DIRETOR: 'DIRETOR',
  GERENTE: 'GERENTE',
  OPERADOR: 'OPERADOR',
  ESTAGIARIO: 'ESTAGIARIO',
  ESTAGIARIO_JURIDICO: 'ESTAGIARIO_JURIDICO',
  ADMINISTRATIVO: 'ADMINISTRATIVO',
  MARKETING: 'MARKETING',
  CONTADOR: 'CONTADOR',
};

// Cargos que veem TODOS os dados
const FULL_ACCESS_ROLES = [ROLES.SUPER_ADMIN];

// Cargos que veem dados da equipe (exceto SUPER_ADMIN)
const TEAM_ACCESS_ROLES = [ROLES.SOCIO, ROLES.DIRETOR, ROLES.GERENTE, ROLES.COORDENADOR];

// Cargos que veem apenas seus próprios dados
const OWN_DATA_ROLES = [
  ROLES.ADVOGADO,
  ROLES.ESTAGIARIO,
  ROLES.ESTAGIARIO_JURIDICO,
  ROLES.CORRESPONDENTE,
  ROLES.PARALEGAL,
];

// Cargos operacionais (veem dados delegados)
const OPERATIONAL_ROLES = [
  ROLES.ASSISTENTE,
  ROLES.SECRETARIO,
  ROLES.OPERADOR,
  ROLES.RECEPCIONISTA,
];

// Cargos administrativos (veem dados administrativos)
const ADMIN_ROLES = [
  ROLES.FINANCEIRO,
  ROLES.RH,
  ROLES.TI,
  ROLES.ANALISTA,
  ROLES.ADMINISTRATIVO,
  ROLES.MARKETING,
  ROLES.CONTADOR,
];

/**
 * Verifica se o usuário tem acesso total (vê todos os dados)
 */
export function hasFullAccess(role: string): boolean {
  return FULL_ACCESS_ROLES.includes(role);
}

/**
 * Verifica se o usuário é SUPER_ADMIN (poder total sobre os dados)
 */
export function isSuperAdmin(role: string): boolean {
  return FULL_ACCESS_ROLES.includes(role);
}

/**
 * Verifica se o usuário pode excluir qualquer registro do sistema,
 * inclusive em cascata (processos, contratos e dependências vinculadas)
 */
export function canDeleteAny(role: string): boolean {
  return isSuperAdmin(role);
}

/**
 * Verifica se o usuário tem acesso à equipe (vê dados de todos da equipe)
 */
export function hasTeamAccess(role: string): boolean {
  return TEAM_ACCESS_ROLES.includes(role);
}

/**
 * Verifica se o usuário só acessa seus próprios dados
 */
export function hasOwnDataOnly(role: string): boolean {
  return OWN_DATA_ROLES.includes(role);
}

/**
 * Verifica se o usuário é operacional
 */
export function isOperational(role: string): boolean {
  return OPERATIONAL_ROLES.includes(role);
}

/**
 * Verifica se o usuário é administrativo
 */
export function isAdmin(role: string): boolean {
  return ADMIN_ROLES.includes(role);
}

/**
 * Retorna o filtro de dados baseado no cargo do usuário
 * Para cases (processos)
 */
export function getCaseFilter(userRole: string, userId: string): any {
  // Super admin vê tudo
  if (hasFullAccess(userRole)) {
    return {};
  }

  // Sócios, Diretor, Gerente, Coordenador veem todos os processos
  if (hasTeamAccess(userRole)) {
    return {};
  }

  // Advogados e estagiários veem apenas seus processos
  if (hasOwnDataOnly(userRole)) {
    return { responsibleId: userId };
  }

  // Operacionais veem processos onde foram designados
  if (isOperational(userRole)) {
    return {
      OR: [
        { responsibleId: userId },
        { notes: { some: { authorId: userId } } }
      ]
    };
  }

  // Administrativos veem todos (precisam para relatórios)
  if (isAdmin(userRole)) {
    return {};
  }

  // Padrão: nada
  return { id: 'NENHUM' };
}

/**
 * Retorna o filtro de dados baseado no cargo do usuário
 * Para clients (clientes)
 */
export function getClientFilter(userRole: string, userId: string): any {
  // Super admin vê tudo
  if (hasFullAccess(userRole)) {
    return {};
  }

  // Sócios, Diretor, Gerente, Coordenador veem todos os clientes
  if (hasTeamAccess(userRole)) {
    return {};
  }

  // Advogados veem clientes dos seus processos
  if (hasOwnDataOnly(userRole)) {
    return {
      cases: { some: { responsibleId: userId } }
    };
  }

  // Operacionais veem clientes dos processos que acompanham
  if (isOperational(userRole)) {
    return {
      cases: { some: { responsibleId: userId } }
    };
  }

  // Administrativos veem todos
  if (isAdmin(userRole)) {
    return {};
  }

  return { id: 'NENHUM' };
}

/**
 * Verifica se o usuário pode criar processos
 */
export function canCreateCase(role: string): boolean {
  const allowed = [
    ROLES.SUPER_ADMIN,
    ROLES.SOCIO,
    ROLES.ADVOGADO,
    ROLES.ESTAGIARIO,
    ROLES.COORDENADOR,
    ROLES.DIRETOR,
    ROLES.GERENTE,
  ];
  return allowed.includes(role);
}

/**
 * Verifica se o usuário pode deletar processos
 */
export function canDeleteCase(role: string): boolean {
  return [ROLES.SUPER_ADMIN, ROLES.SOCIO].includes(role);
}

/**
 * Verifica se o usuário pode deletar clientes
 * A exclusão em cascata (com processos vinculados) é exclusiva do SUPER_ADMIN
 * e é verificada à parte por canDeleteAny()
 */
export function canDeleteClient(role: string): boolean {
  return [ROLES.SUPER_ADMIN, ROLES.SOCIO].includes(role);
}

/**
 * Verifica se o usuário pode ver dados financeiros
 */
export function canViewFinance(role: string): boolean {
  const allowed = [
    ROLES.SUPER_ADMIN,
    ROLES.SOCIO,
    ROLES.FINANCEIRO,
    ROLES.DIRETOR,
    ROLES.GERENTE,
    ROLES.CONTADOR,
  ];
  return allowed.includes(role);
}

/**
 * Verifica se o usuário pode gerenciar usuários
 */
export function canManageUsers(role: string): boolean {
  return [ROLES.SUPER_ADMIN, ROLES.SOCIO].includes(role);
}

/**
 * Verifica se o usuário pode acessar configurações
 */
export function canAccessSettings(role: string): boolean {
  return [ROLES.SUPER_ADMIN, ROLES.SOCIO, ROLES.TI].includes(role);
}

/**
 * Retorna as permissões do usuário para o frontend
 */
export function getUserPermissions(role: string) {
  return {
    role,
    canViewAllCases: hasFullAccess(role) || hasTeamAccess(role) || isAdmin(role),
    canViewAllClients: hasFullAccess(role) || hasTeamAccess(role) || isAdmin(role),
    canCreateCase: canCreateCase(role),
    canDeleteCase: canDeleteCase(role),
    canDeleteAny: canDeleteAny(role),
    canDeleteClient: canDeleteClient(role),
    canViewFinance: canViewFinance(role),
    canManageUsers: canManageUsers(role),
    canAccessSettings: canAccessSettings(role),
    canViewReports: hasFullAccess(role) || hasTeamAccess(role) || isAdmin(role),
    canViewTeam: hasFullAccess(role) || hasTeamAccess(role),
  };
}
