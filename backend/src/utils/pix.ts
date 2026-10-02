/**
 * Gerador de BR Code PIX (EMV QRCPS-MPM).
 *
 * Produz o payload "copia e cola" e o QR no formato oficial do PIX sem
 * depender de PSP ou gateway — não há custo por transação e funciona em
 * qualquer aplicativo de banco. A confirmação automática de pagamento
 * (PIX dinâmico) exige um PSP; aqui o cliente paga e o escritório dá a
 * baixa manualmente, que é o fluxo normal de um escritório pequeno.
 *
 * Referência: Manual de Padrões para Iniciação do PIX (Bacen).
 */

/** Remove acentos e caracteres não aceitos pelo EMV (A-Z, 0-9 e espaço). */
function sanitize(value: string, maxLength: number): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9 ]/g, '')
    .trim()
    .slice(0, maxLength);
}

/** Monta um campo TLV: identificador + tamanho (2 dígitos) + valor. */
function tlv(id: string, value: string): string {
  return `${id}${String(value.length).padStart(2, '0')}${value}`;
}

/** Validação de CPF pelos dois dígitos verificadores. */
function isValidCPF(value: string): boolean {
  if (!/^\d{11}$/.test(value)) return false;
  if (/^(\d)\1{10}$/.test(value)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(value[i]) * (10 - i);
  let d1 = (sum * 10) % 11;
  if (d1 === 10) d1 = 0;
  if (d1 !== Number(value[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += Number(value[i]) * (11 - i);
  let d2 = (sum * 10) % 11;
  if (d2 === 10) d2 = 0;

  return d2 === Number(value[10]);
}

/**
 * Normaliza a chave PIX conforme o tipo.
 *
 * Um celular com DDD e o nono dígito tem os mesmos 11 dígitos de um CPF, e
 * um telefone fixo tem 10. A distinção é feita pelos dígitos verificadores do
 * CPF: se o número for um CPF válido ele é usado como documento, caso contrário
 * é tratado como telefone. Sem essa checagem um CPF seria enviado ao banco com
 * o prefixo 55 e o pagamento seria recusado.
 */
export function normalizePixKey(key: string): string {
  const trimmed = key.trim();
  if (trimmed.includes('@')) return trimmed.toLowerCase();

  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 0) return trimmed;

  if (digits.length === 14) return digits; // CNPJ
  if (digits.length === 11) {
    return isValidCPF(digits) ? digits : `55${digits}`; // CPF ou celular
  }
  if (digits.length === 10) return `55${digits}`; // telefone fixo

  return trimmed;
}

export interface PixPayloadInput {
  /** Chave PIX: CPF/CNPJ, telefone, e-mail ou chave aleatória */
  pixKey: string;
  /** Valor a cobrar; em branco deixa o PIX "aberto" para o pagador informar */
  amount?: number | null;
  /** Nome do recebedor (aparece no app do pagador) */
  receiverName: string;
  /** Cidade do recebedor */
  receiverCity: string;
  /** Identificador da cobrança exibido ao pagador */
  txid?: string | null;
}

/** Gera o payload PIX copia-e-cola, com o CRC16 já aposto. */
export function buildPixPayload(input: PixPayloadInput): string {
  const key = normalizePixKey(input.pixKey);
  if (!key) throw new Error('Chave PIX é obrigatória');

  // Template de conta do recebedor, obrigatoriamente dentro do campo 26.
  const merchantAccount = tlv('26', tlv('00', 'BR.GOV.BCB.PIX') + tlv('01', key));

  const parts: string[] = [];
  parts.push(tlv('00', '01')); // formato
  parts.push(tlv('01', '12')); // iniciação dinâmica, com CRC

  parts.push(merchantAccount);
  parts.push(tlv('52', '5208')); // categoria: serviços profissionais
  parts.push(tlv('58', 'BR')); // país

  if (input.amount !== undefined && input.amount !== null && input.amount > 0) {
    parts.push(tlv('54', input.amount.toFixed(2)));
  }

  parts.push(tlv('59', sanitize(input.receiverName, 25)));
  parts.push(tlv('60', sanitize(input.receiverCity, 15)));

  const txid = input.txid ? sanitize(input.txid, 25) : '***';
  if (txid) parts.push(tlv('62', tlv('05', txid)));

  // Marcador do CRC: o cálculo cobre o payload até ele, inclusive.
  const base = `${parts.join('')}6304`;
  return base + crc16(base);
}

/** CRC16-CCITT (polinômio 0x1021, seed 0xFFFF). */
export function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export interface GeneratedPix {
  payload: string;
  crc: string;
  txid: string;
}

/**
 * Gera o payload PIX e devolve também o txid efetivamente embutido, para
 * gravá-lo na parcela e permitir reconciliar o pagamento depois.
 */
export function generatePix(input: PixPayloadInput): GeneratedPix {
  const rawTxid = input.txid ?? `***${Date.now().toString().slice(-9)}`;
  // O campo txid aceita apenas A-Z e 0-9.
  const txid = rawTxid.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 25) || '***';

  const payload = buildPixPayload({ ...input, txid });

  return { payload, crc: payload.slice(-4), txid };
}