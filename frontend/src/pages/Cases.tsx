import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  XMarkIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const statusColors: Record<string, string> = {
  ATIVO: 'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300',
  ENCERRADO: 'bg-green-100 text-green-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  ARQUIVADO: 'bg-slate-100 text-slate-800 dark:bg-slate-500/20 dark:text-slate-300',
  SUSPENSO: 'bg-yellow-100 text-yellow-800 dark:bg-amber-500/15 dark:text-amber-300',
  TRANSFERIDO: 'bg-purple-100 text-purple-800 dark:bg-purple-500/15 dark:text-purple-300',
};

const statusLabels: Record<string, string> = {
  ATIVO: 'Ativo',
  ENCERRADO: 'Encerrado',
  ARQUIVADO: 'Arquivado',
  SUSPENSO: 'Suspenso',
  TRANSFERIDO: 'Transferido',
};

const typeLabels: Record<string, string> = {
  TRABALHISTA: 'Trabalhista',
  CIVIL: 'Civil',
  CRIMINAL: 'Criminal',
  TRIBUTARIO: 'Tributário',
  FAMILIA: 'Família',
  PREVIDENCIARIO: 'Previdenciário',
  CONSUMIDOR: 'Consumidor',
  EMPRESARIAL: 'Empresarial',
  AMBIENTAL: 'Ambiental',
  OUTROS: 'Outros',
};

// Os valores abaixo são os que o banco realmente grava. Antes a tela usava
// EM_ANDAMENTO/CONCLUIDO, que não existem no modelo: o badge saía sem cor e o
// filtro de status nunca casava com nada.
const CASE_TYPES = Object.keys(typeLabels);
const CASE_STATUSES = Object.keys(statusLabels);

type CaseForm = {
  caseNumber: string;
  title: string;
  clientId: string;
  type: string;
  status: string;
  description: string;
  court: string;
  jurisdiction: string;
  judge: string;
  value: string;
  startDate: string;
};

const todayInput = () => new Date().toISOString().slice(0, 10);

const emptyForm = (): CaseForm => ({
  caseNumber: '',
  title: '',
  clientId: '',
  type: 'CIVIL',
  status: 'ATIVO',
  description: '',
  court: '',
  jurisdiction: '',
  judge: '',
  value: '',
  startDate: todayInput(),
});

const formatMoney = (value: unknown) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 'Não informado';
  return `R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default function Cases() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<any>(null);
  const queryClient = useQueryClient();
  const permissions = useAuthStore((state) => state.permissions);
  const user = useAuthStore((state) => state.user);

  // As permissões são persistidas no localStorage e podem vir de uma sessão
  // anterior a estas chaves existirem; quando faltam, caímos no cargo. O
  // backend continua sendo a autoridade e devolve 403 se o cargo não puder.
  const CREATE_ROLES = ['SUPER_ADMIN', 'SOCIO', 'ADVOGADO', 'ESTAGIARIO', 'COORDENADOR', 'DIRETOR', 'GERENTE'];
  const DELETE_ROLES = ['SUPER_ADMIN', 'SOCIO'];
  const canCreate =
    permissions?.canCreateCase ?? (user?.role ? CREATE_ROLES.includes(user.role) : false);
  const canDelete =
    permissions?.canDeleteCase ?? (user?.role ? DELETE_ROLES.includes(user.role) : false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CaseForm>();

  const { data: casesData, isLoading } = useQuery({
    queryKey: ['cases'],
    queryFn: async () => {
      const res = await api.get('/cases?limit=100');
      return res.data.data;
    },
    retry: 1,
    staleTime: 30000,
  });

  // O select de cliente precisa da lista para não aceitar um id inválido.
  const { data: clientsData } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const res = await api.get('/clients?limit=200');
      return res.data.data;
    },
    retry: 1,
    staleTime: 60000,
  });

  const cases = casesData?.cases || [];
  const clients = clientsData?.clients || [];

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCase(null);
  };

  const openCreateModal = () => {
    setEditingCase(null);
    reset(emptyForm());
    setIsModalOpen(true);
  };

  const openEditModal = (caso: any) => {
    setEditingCase(caso);
    reset({
      caseNumber: caso.caseNumber ?? '',
      title: caso.title ?? '',
      clientId: caso.clientId ?? '',
      type: caso.type ?? 'CIVIL',
      status: caso.status ?? 'ATIVO',
      description: caso.description ?? '',
      court: caso.court ?? '',
      jurisdiction: caso.jurisdiction ?? '',
      judge: caso.judge ?? '',
      value: caso.value != null ? String(caso.value) : '',
      startDate: caso.startDate ? new Date(caso.startDate).toISOString().slice(0, 10) : todayInput(),
    });
    setSelectedCase(null);
    setIsModalOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: (data: CaseForm) => {
      const payload = {
        ...data,
        value: data.value === '' ? undefined : Number(data.value),
        caseNumber: data.caseNumber.trim() || undefined,
        startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
      };
      return api.post('/cases', payload);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      toast.success(response?.data?.message || 'Processo criado com sucesso!');
      closeModal();
    },
    onError: (error: any) => {
      const serverMessage = error?.response?.data?.message;
      if (error?.response?.status === 409) {
        toast.error(serverMessage || 'Já existe um processo com este número.');
      } else if (error?.response?.status === 403) {
        toast.error(serverMessage || 'Você não tem permissão para criar processos.');
      } else {
        toast.error(serverMessage || 'Erro ao criar processo');
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CaseForm }) => {
      const payload = {
        ...data,
        value: data.value === '' ? undefined : Number(data.value),
        startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
      };
      return api.put(`/cases/${id}`, payload);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      toast.success(response?.data?.message || 'Processo atualizado com sucesso!');
      closeModal();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erro ao atualizar processo');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/cases/${id}`),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      toast.success(response?.data?.message || 'Processo excluído com sucesso!');
      setSelectedCase(null);
    },
    onError: (error: any) => {
      const status = error?.response?.status;
      const serverMessage = error?.response?.data?.message;
      if (status === 403) {
        toast.error(serverMessage || 'Somente sócios e o administrador podem excluir processos.');
      } else {
        toast.error(serverMessage || 'Erro ao excluir processo');
      }
    },
  });

  const onSubmit = (data: CaseForm) => {
    if (editingCase) {
      updateMutation.mutate({ id: editingCase.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (caso: any) => {
    const message = `Excluir o processo ${caso.caseNumber}?\n\nTambém serão excluídos os prazos, audiências, documentos, honorários e notas vinculados a ele. Esta ação não pode ser desfeita.`;
    if (confirm(message)) {
      deleteMutation.mutate(caso.id);
    }
  };

  // Esc fecha o modal, como no resto do sistema.
  useEffect(() => {
    if (!isModalOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isModalOpen]);

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredCases = (cases || []).filter((caso: any) => {
    const matchesSearch =
      !normalizedSearch ||
      (caso.caseNumber || '').toLowerCase().includes(normalizedSearch) ||
      (caso.title || '').toLowerCase().includes(normalizedSearch) ||
      (caso.client?.name || '').toLowerCase().includes(normalizedSearch);
    const matchesType = !filterType || caso.type === filterType;
    const matchesStatus = !filterStatus || caso.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setFilterType('');
    setFilterStatus('');
  };

  const isEmptyDatabase = cases.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gold dark:text-gold-light">Processos</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Gerencie todos os processos do escritório</p>
          <span className="gold-rule mt-3" aria-hidden="true"></span>
        </div>
        {canCreate && (
          <button onClick={openCreateModal} className="btn btn-primary">
            <PlusIcon className="h-5 w-5 mr-1" aria-hidden="true" />
            Novo Processo
          </button>
        )}
      </div>

      {cases.length > 0 && (
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Buscar por número, título ou cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Buscar processos"
                className="w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div className="relative">
              <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                title="Filtrar por tipo"
                aria-label="Filtrar processos por tipo"
                className="w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
              >
                <option value="">Todos os Tipos</option>
                {CASE_TYPES.map((key) => (
                  <option key={key} value={key}>{typeLabels[key]}</option>
                ))}
              </select>
            </div>

            <div className="relative">
              <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                title="Filtrar por status"
                aria-label="Filtrar processos por status"
                className="w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
              >
                <option value="">Todos os Status</option>
                {CASE_STATUSES.map((key) => (
                  <option key={key} value={key}>{statusLabels[key]}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="col-span-2 text-center py-8 text-slate-500 dark:text-slate-400">Carregando processos...</div>
        ) : isEmptyDatabase ? (
          <div className="col-span-2 card text-center py-12">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Nenhum processo cadastrado</h2>
            <p className="text-slate-600 dark:text-slate-400 mt-2 max-w-md mx-auto">
              Cadastre o primeiro processo para acompanhar prazos, audiências, documentos e
              honorários de um só lugar.
            </p>
            {canCreate && (
              <button onClick={openCreateModal} className="btn btn-primary mt-6">
                <PlusIcon className="h-5 w-5 mr-1" aria-hidden="true" />
                Cadastrar processo
              </button>
            )}
          </div>
        ) : filteredCases.length > 0 ? (
          filteredCases.map((caso: any) => (
            <div key={caso.id} className="card hover:shadow-lg transition-shadow">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <button
                    onClick={() => setSelectedCase(caso)}
                    className="flex-1 text-left focus:outline-none focus:ring-2 focus:ring-primary-500 rounded focus-visible:ring-2"
                    title="Ver detalhes do processo"
                    aria-label={`Ver detalhes do processo ${caso.caseNumber}`}
                  >
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{caso.caseNumber}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{caso.title || 'Sem título'}</p>
                  </button>
                  <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[caso.status] ?? 'bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100'}`}>
                    {statusLabels[caso.status] ?? caso.status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                    {typeLabels[caso.type] ?? caso.type}
                  </span>
                  <span className="text-slate-600 dark:text-slate-400">{caso.client?.name || 'Cliente não identificado'}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Data de Abertura</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {caso.startDate ? new Date(caso.startDate).toLocaleDateString('pt-BR') : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Valor da Causa</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{formatMoney(caso.value)}</p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setSelectedCase(caso)}
                    className="text-primary-600 hover:text-primary-900 inline-flex items-center gap-1 text-sm"
                    aria-label={`Ver detalhes do processo ${caso.caseNumber}`}
                  >
                    <EyeIcon className="h-4 w-4" aria-hidden="true" /> Ver
                  </button>
                  <button
                    onClick={() => openEditModal(caso)}
                    className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 inline-flex items-center gap-1 text-sm"
                    aria-label={`Editar processo ${caso.caseNumber}`}
                  >
                    <PencilIcon className="h-4 w-4" aria-hidden="true" /> Editar
                  </button>
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(caso)}
                      disabled={deleteMutation.isPending}
                      className="text-red-600 hover:text-red-900 inline-flex items-center gap-1 text-sm disabled:opacity-50"
                      aria-label={`Excluir processo ${caso.caseNumber}`}
                    >
                      <TrashIcon className="h-4 w-4" aria-hidden="true" /> Excluir
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 card text-center py-12">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Nenhum processo encontrado</h2>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Nenhum processo corresponde aos filtros aplicados.
            </p>
            <button onClick={clearFilters} className="btn btn-secondary mt-6">
              Limpar filtros
            </button>
          </div>
        )}
      </div>

      {/* Modal de Criação/Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {editingCase ? 'Editar Processo' : 'Novo Processo'}
                </h2>
                <button
                  onClick={closeModal}
                  title="Fechar"
                  aria-label="Fechar modal"
                  className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="caseNumber" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Número do processo
                    </label>
                    <input
                      id="caseNumber"
                      type="text"
                      placeholder="Ex.: 2026-0001 (em branco = automático)"
                      {...register('caseNumber')}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="type" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo *</label>
                    <select
                      id="type"
                      {...register('type', { required: 'Selecione o tipo do processo' })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      {CASE_TYPES.map((key) => (
                        <option key={key} value={key}>{typeLabels[key]}</option>
                      ))}
                    </select>
                    {errors.type && <p className="text-red-600 text-sm mt-1">{errors.type.message}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Título *</label>
                    <input
                      id="title"
                      type="text"
                      placeholder="Ex.: Ação de cobrança"
                      {...register('title', { required: 'O título é obrigatório' })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>}
                  </div>

                  <div>
                    <label htmlFor="clientId" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cliente *</label>
                    <select
                      id="clientId"
                      {...register('clientId', { required: 'Selecione o cliente' })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Selecione...</option>
                      {clients.map((cliente: any) => (
                        <option key={cliente.id} value={cliente.id}>{cliente.name}</option>
                      ))}
                    </select>
                    {errors.clientId && <p className="text-red-600 text-sm mt-1">{errors.clientId.message}</p>}
                    {clients.length === 0 && (
                      <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                        <p className="text-xs text-amber-800">
                          Nenhum cliente cadastrado. O processo precisa de um cliente.
                        </p>
                        <button
                          type="button"
                          onClick={() => navigate('/clients')}
                          className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                          Cadastrar cliente
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status *</label>
                    <select
                      id="status"
                      {...register('status', { required: true })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      {CASE_STATUSES.map((key) => (
                        <option key={key} value={key}>{statusLabels[key]}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Data de abertura
                    </label>
                    <input
                      id="startDate"
                      type="date"
                      {...register('startDate')}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="value" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Valor da causa
                    </label>
                    <input
                      id="value"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      {...register('value')}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="court" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Foro</label>
                    <input
                      id="court"
                      type="text"
                      placeholder="Ex.: Vara Cível"
                      {...register('court')}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="jurisdiction" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Comarca
                    </label>
                    <input
                      id="jurisdiction"
                      type="text"
                      placeholder="Ex.: Comarca de São Paulo"
                      {...register('jurisdiction')}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label htmlFor="judge" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Magistrado
                    </label>
                    <input
                      id="judge"
                      type="text"
                      {...register('judge')}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Descrição
                    </label>
                    <textarea
                      id="description"
                      rows={3}
                      {...register('description')}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="btn btn-primary"
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? 'Salvando...'
                      : editingCase
                        ? 'Atualizar'
                        : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de detalhes */}
      {selectedCase && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedCase(null);
          }}
        >
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{selectedCase.caseNumber}</h2>
                  <p className="text-slate-600 dark:text-slate-400 mt-1">{selectedCase.title}</p>
                </div>
                <button
                  onClick={() => setSelectedCase(null)}
                  title="Fechar"
                  aria-label="Fechar detalhes do processo"
                  className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Cliente</p>
                    <p className="text-slate-900 dark:text-slate-100 mt-1">{selectedCase.client?.name || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Tipo</p>
                    <p className="text-slate-900 dark:text-slate-100 mt-1">{typeLabels[selectedCase.type] ?? selectedCase.type}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Status</p>
                    <span className={`inline-block mt-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[selectedCase.status] ?? 'bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100'}`}>
                      {statusLabels[selectedCase.status] ?? selectedCase.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Valor da Causa</p>
                    <p className="text-slate-900 dark:text-slate-100 mt-1">{formatMoney(selectedCase.value)}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Data de Abertura</p>
                    <p className="text-slate-900 dark:text-slate-100 mt-1">
                      {selectedCase.startDate ? new Date(selectedCase.startDate).toLocaleDateString('pt-BR') : 'Não informado'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Foro</p>
                    <p className="text-slate-900 dark:text-slate-100 mt-1">{selectedCase.court || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Comarca</p>
                    <p className="text-slate-900 dark:text-slate-100 mt-1">{selectedCase.jurisdiction || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Magistrado</p>
                    <p className="text-slate-900 dark:text-slate-100 mt-1">{selectedCase.judge || 'Não informado'}</p>
                  </div>
                </div>

                {selectedCase.description && (
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Descrição</p>
                    <p className="text-slate-900 dark:text-slate-100 mt-1 whitespace-pre-wrap">{selectedCase.description}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setSelectedCase(null)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Fechar
                </button>
                <button onClick={() => openEditModal(selectedCase)} className="btn btn-primary">
                  <PencilIcon className="h-4 w-5 mr-1" aria-hidden="true" /> Editar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}