import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import {
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
  getCashFlow,
  getFinancialOverview,
  refreshOverdueInstallments,
} from '../services/finance.service';
import { getAllSettings, getPixConfig, saveSettings, SETTING_KEYS } from '../services/settings.service';
import { normalizePixKey } from '../utils/pix';

/** Consolidado financeiro: o que entrou, o que falta e o que saiu. */
export const getSummary = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await refreshOverdueInstallments();

    const overview = await getFinancialOverview();

    res.json({ status: 'success', data: overview });
  } catch (error) {
    next(error);
  }
};

/** Série mensal de entradas, saídas, repasses e resultado. */
export const getCashFlowSeries = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const requested = parseInt((req.query.months as string) || '6', 10);
    const months = Math.min(Number.isFinite(requested) && requested > 0 ? requested : 6, 24);

    await refreshOverdueInstallments();
    const cashFlow = await getCashFlow(months);

    res.json({
      status: 'success',
      data: cashFlow,
      meta: {
        months,
        totalEntradas: cashFlow.reduce((acc, m) => acc + m.entradas, 0),
        totalSaidas: cashFlow.reduce((acc, m) => acc + m.saidas, 0),
        totalRepasses: cashFlow.reduce((acc, m) => acc + m.repasses, 0),
        resultadoPeriodo: cashFlow.reduce((acc, m) => acc + m.resultado, 0),
      },
    });
  } catch (error) {
    next(error);
  }
};

/** Configuração de PIX usada para gerar as cobranças. */
export const getSettings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [pix, all] = await Promise.all([getPixConfig(), getAllSettings()]);

    res.json({
      status: 'success',
      data: {
        pix,
        officeName: all[SETTING_KEYS.OFFICE_NAME] ?? 'Monique Advogados',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Grava a chave PIX e os dados do recebedor.
 *
 * A chave é normalizada antes de salvar: telefone sem DDI viraria chave
 * inválida e o banco recusaria o pagamento.
 */
export const updateSettings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { pixKey, receiverName, receiverCity, officeName } = req.body;

    const payload: Record<string, string | undefined> = {};

    if (pixKey !== undefined) {
      const normalized = normalizePixKey(String(pixKey));
      if (!normalized) {
        throw new AppError('Informe uma chave PIX válida', 400);
      }
      payload[SETTING_KEYS.PIX_KEY] = normalized;
    }
    if (receiverName !== undefined) payload[SETTING_KEYS.PIX_RECEIVER_NAME] = String(receiverName).trim();
    if (receiverCity !== undefined) payload[SETTING_KEYS.PIX_RECEIVER_CITY] = String(receiverCity).trim();
    if (officeName !== undefined) payload[SETTING_KEYS.OFFICE_NAME] = String(officeName).trim();

    if (Object.keys(payload).length === 0) {
      throw new AppError('Nenhuma configuração informada', 400);
    }

    await saveSettings(payload);

    const pix = await getPixConfig();

    res.json({ status: 'success', data: { pix, saved: Object.keys(payload).length } });
  } catch (error) {
    next(error);
  }
};

/** Enumerações usadas pelos formulários da tela Financeiro. */
export const getMeta = (_req: AuthRequest, res: Response) => {
  res.json({
    status: 'success',
    data: {
      paymentMethods: PAYMENT_METHODS,
      expenseCategories: EXPENSE_CATEGORIES,
      expenseCategoryLabels: {
        ALUGUEL: 'Aluguel',
        PESSOAL: 'Folha de pagamento',
        MATERIAL_ESCRITORIO: 'Material de escritório',
        MARKETING: 'Marketing',
        SOFTWARE: 'Softwares e assinaturas',
        IMPOSTO: 'Impostos e taxas',
        ENERGIA_INTERNET: 'Energia e internet',
        CONTABILIDADE: 'Contabilidade',
        BANCOS: 'Taxas bancárias',
        PROCESSOS_CUSTAS: 'Custos de processo',
        OUTROS: 'Outros',
      },
      installmentStatuses: ['PENDENTE', 'PAGO', 'ATRASADO'],
      feeStatuses: ['PENDENTE', 'PARCELADO', 'PAGO', 'ATRASADO'],
    },
  });
};