/**
 * Configurações do sistema em pares chave/valor.
 *
 * Guardar a chave PIX em tabela (e não em .env) permite que o escritório
 * troque de chave ou de banco receptor pela própria interface, sem reinstalar
 * o sistema. Segredos verdadeiros (JWT, senhas) continuam no ambiente.
 */

import prisma from '../config/database';
import { normalizePixKey } from '../utils/pix';

export const SETTING_KEYS = {
  PIX_KEY: 'pix.key',
  PIX_RECEIVER_NAME: 'pix.receiverName',
  PIX_RECEIVER_CITY: 'pix.receiverCity',
  OFFICE_NAME: 'office.name',
} as const;

export interface PixConfig {
  pixKey: string;
  receiverName: string;
  receiverCity: string;
  configured: boolean;
}

const DEFAULTS: PixConfig = {
  pixKey: '',
  receiverName: 'Monique Advogados',
  receiverCity: 'Sao Paulo',
  configured: false,
};

export async function getAllSettings(): Promise<Record<string, string>> {
  const rows = await prisma.setting.findMany();
  return rows.reduce<Record<string, string>>((acc, r) => {
    acc[r.key] = r.value;
    return acc;
  }, {});
}

/** Lê a configuração de PIX aplicando os padrões do escritório. */
export async function getPixConfig(): Promise<PixConfig> {
  const all = await getAllSettings();

  const pixKey = all[SETTING_KEYS.PIX_KEY] ?? DEFAULTS.pixKey;
  return {
    pixKey,
    receiverName: all[SETTING_KEYS.PIX_RECEIVER_NAME] || DEFAULTS.receiverName,
    receiverCity: all[SETTING_KEYS.PIX_RECEIVER_CITY] || DEFAULTS.receiverCity,
    configured: pixKey.trim().length > 0,
  };
}

/**
 * Grava as configurações informadas. Apenas as chaves enviadas são alteradas,
 * para que a tela de PIX não apague o nome do escritório ao salvar a chave.
 */
export async function saveSettings(values: Record<string, string | undefined | null>) {
  const data = Object.entries(values)
    // Whitelist: a tela de PIX grava apenasestas chaves. Sem isso, um corpo
    // de requisição forjado criaria configurações arbitrárias na base.
    .filter(
      ([key, value]) =>
        value !== undefined &&
        value !== null &&
        (key.startsWith('pix.') || key.startsWith('office.'))
    )
    .map(([key, value]) => ({
      key,
      // A chave fica gravada já canônica (telefone com DDI, e-mail em
      // minúsculas). Normalizar aqui, e não só no controller, garante que
      // quem consultar a configuração veja exatamente a chave que será usada
      // na cobrança, venha o dado de onde vier.
      value: key === SETTING_KEYS.PIX_KEY ? normalizePixKey(String(value)) : String(value),
      updatedAt: new Date(),
    }));

  if (data.length > 0) {
    // Upsert um a um: `createMany` com `updatePaths` não é tipado no Prisma 5
    // e o número de configurações do sistema é pequeno demais para compensar
    // um INSERT ... ON CONFLICT escrito à mão.
    await prisma.$transaction(
      data.map((entry) =>
        prisma.setting.upsert({
          where: { key: entry.key },
          create: entry,
          update: { value: entry.value, updatedAt: entry.updatedAt },
        })
      )
    );
  }

  return getAllSettings();
}