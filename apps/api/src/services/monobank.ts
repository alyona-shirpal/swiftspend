import crypto from 'node:crypto';
import axios from 'axios';

export const MONO_API = 'https://api.monobank.ua';

export interface MonobankAccount {
  id: string;
  sendId?: string;
  currencyCode: number;
  cashbackType?: string;
  balance: number;
  creditLimit: number;
  type: string;
  iban?: string;
  maskedPan?: string[];
}

export interface MonobankStatementItem {
  id: string;
  time: number;
  description: string;
  mcc: number;
  originalMcc?: number;
  hold: boolean;
  amount: number;
  operationAmount: number;
  currencyCode: number;
  operationCurrencyCode?: number;
  commissionRate: number;
  cashbackAmount: number;
  balance: number;
  counterName?: string;
  counterIban?: string;
}

export const NUMERIC_CURRENCY_MAP: Record<number, string> = {
  980: 'UAH',
  978: 'EUR',
  840: 'USD',
  8: 'ALL',
  826: 'GBP',
  756: 'CHF',
  203: 'CZK',
  985: 'PLN',
  348: 'HUF',
  208: 'DKK',
  752: 'SEK',
  578: 'NOK',
  191: 'HRK',
  946: 'RON',
  975: 'BGN',
  124: 'CAD',
  36: 'AUD',
  392: 'JPY',
  156: 'CNY',
  784: 'AED',
  702: 'SGD',
  376: 'ILS',
  764: 'THB',
  949: 'TRY',
  356: 'INR',
  484: 'MXN',
  986: 'BRL',
  410: 'KRW',
  398: 'KZT',
  981: 'GEL',
  51: 'AMD',
  498: 'MDL',
  807: 'MKD',
  941: 'RSD',
  643: 'RUB',
};

export const MCC_CATEGORY_HINTS: Record<number, string> = {
  // Groceries
  5411: 'Groceries',
  5412: 'Groceries',
  5300: 'Groceries',
  5310: 'Groceries',
  5320: 'Groceries',
  5331: 'Groceries',

  // Eating out
  5812: 'Eating out',
  5813: 'Eating out',
  5814: 'Eating out',

  // Hotels
  7011: 'Hotels',

  // Travel
  4511: 'Travel',

  // Transport
  4111: 'Transport',
  4121: 'Transport',
  4131: 'Transport',
  7512: 'Transport',
  7513: 'Transport',

  // Health
  5912: 'Health',
  8011: 'Health',
  8021: 'Health',
  8031: 'Health',
  8041: 'Health',
  8049: 'Health',
  8099: 'Health',

  // Entertainment
  7832: 'Entertainment',
  7922: 'Entertainment',
  7991: 'Entertainment',
  7993: 'Entertainment',
  7994: 'Entertainment',
  7995: 'Entertainment',
  7999: 'Entertainment',

  // Electronics
  5045: 'Electronics',
  5732: 'Electronics',
  5734: 'Electronics',

  // Beauty
  7230: 'Beauty',
  7297: 'Beauty',

  // Phone & Internet
  4812: 'Phone & Internet',
  4814: 'Phone & Internet',
  4816: 'Phone & Internet',

  // Utilities
  4900: 'Utilities',

  // Car
  5533: 'Car',
  5541: 'Car',
  5542: 'Car',
  7538: 'Car',

  // Sport
  5940: 'Sport',
  5941: 'Sport',
  7941: 'Sport',

  // Books & Media
  5192: 'Books & Media',
  5942: 'Books & Media',
  7841: 'Books & Media',

  // Education
  8211: 'Education',
  8220: 'Education',
  8241: 'Education',
  8244: 'Education',
  8249: 'Education',
  8299: 'Education',

  // Shopping
  5977: 'Shopping',
  5999: 'Shopping',
};

export function currencyNumericToAlpha(code: number): string {
  return NUMERIC_CURRENCY_MAP[code] || 'UAH';
}

function getEncryptionKey(): Buffer | null {
  const key = process.env.MONOBANK_ENCRYPTION_KEY;
  if (!key) return null;
  if (/^[0-9a-fA-F]{64}$/.test(key)) {
    return Buffer.from(key, 'hex');
  }
  return crypto.createHash('sha256').update(key).digest();
}

export function encryptToken(token: string): string {
  const key = getEncryptionKey();
  if (!key) {
    console.warn('[monobank] MONOBANK_ENCRYPTION_KEY not set, falling back to base64 encoding');
    return Buffer.from(token, 'utf8').toString('base64');
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${encrypted.toString('hex')}:${tag.toString('hex')}`;
}

export function decryptToken(encrypted: string): string {
  const parts = encrypted.split(':');
  if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
    const key = getEncryptionKey();
    if (!key) {
      console.warn('[monobank] MONOBANK_ENCRYPTION_KEY not set for AES-GCM token decryption');
      throw new Error('MONOBANK_ENCRYPTION_KEY is required to decrypt token');
    }
    const iv = Buffer.from(parts[0], 'hex');
    const enc = Buffer.from(parts[1], 'hex');
    const tag = Buffer.from(parts[2], 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(enc), decipher.final()]);
    return decrypted.toString('utf8');
  }

  return Buffer.from(encrypted, 'base64').toString('utf8');
}

export async function fetchClientInfo(token: string): Promise<{
  clientId: string;
  name: string;
  webHookUrl?: string;
  accounts: MonobankAccount[];
}> {
  try {
    const response = await axios.get(`${MONO_API}/personal/client-info`, {
      headers: {
        'X-Token': token,
      },
    });
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      const status = error.response.status;
      const errorDescription = error.response.data?.errorDescription || error.message;
      if (status === 401 || status === 403) {
        throw new Error(`Monobank authentication failed (${status}): ${errorDescription}`);
      }
      if (status === 429) {
        throw new Error(`Monobank rate limit exceeded (429): ${errorDescription}`);
      }
      throw new Error(`Monobank client-info error (${status}): ${errorDescription}`);
    }
    throw error;
  }
}

export async function registerWebhook(token: string, webhookUrl: string): Promise<void> {
  try {
    await axios.post(
      `${MONO_API}/personal/webhook`,
      { webHookUrl: webhookUrl },
      {
        headers: {
          'X-Token': token,
        },
      },
    );
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      const status = error.response.status;
      const errorDescription = error.response.data?.errorDescription || error.message;
      throw new Error(`Failed to register Monobank webhook (${status}): ${errorDescription}`);
    }
    throw error;
  }
}

export async function clearWebhook(token: string): Promise<void> {
  try {
    await axios.post(
      `${MONO_API}/personal/webhook`,
      { webHookUrl: '' },
      {
        headers: {
          'X-Token': token,
        },
      },
    );
  } catch (error) {
    console.warn('[monobank] Best-effort clearWebhook failed (ignored):', error);
  }
}

export async function fetchStatement(
  token: string,
  accountId: string,
  from: number,
  to: number,
): Promise<MonobankStatementItem[]> {
  try {
    const response = await axios.get<MonobankStatementItem[]>(
      `${MONO_API}/personal/statement/${accountId}/${from}/${to}`,
      {
        headers: {
          'X-Token': token,
        },
      },
    );
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      const status = error.response.status;
      const errorDescription = error.response.data?.errorDescription || error.message;
      throw new Error(`Monobank statement error (${status}): ${errorDescription}`);
    }
    throw error;
  }
}

export function resolveExpenseCurrency(
  amount: number,
  currencyCode: number,
  operationAmount?: number,
  operationCurrencyCode?: number,
): { amount: number; currency: string } {
  const cardCurrency = currencyNumericToAlpha(currencyCode);
  let chosenAmount = amount;
  let chosenCurrency = cardCurrency;

  if (
    operationCurrencyCode !== undefined &&
    operationCurrencyCode !== null &&
    operationCurrencyCode !== currencyCode &&
    operationAmount !== undefined &&
    operationAmount !== null
  ) {
    const opAlpha = NUMERIC_CURRENCY_MAP[operationCurrencyCode];
    if (opAlpha) {
      chosenAmount = operationAmount;
      chosenCurrency = opAlpha;
    }
  }

  // Monobank amounts are in minor units (divide by 100) and negative for debits (take absolute value)
  const finalAmount = Math.round(Math.abs(chosenAmount)) / 100;

  return {
    amount: finalAmount,
    currency: chosenCurrency,
  };
}

export function mccToCategoryHint(mcc: number): string | null {
  if (MCC_CATEGORY_HINTS[mcc]) {
    return MCC_CATEGORY_HINTS[mcc];
  }

  // MCC code ranges
  if (mcc >= 3000 && mcc <= 3350) {
    return 'Travel';
  }
  if (mcc >= 3501 && mcc <= 3999) {
    return 'Hotels';
  }
  if (mcc >= 5600 && mcc <= 5699) {
    return 'Clothes';
  }

  return null;
}
