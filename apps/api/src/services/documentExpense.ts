import axios from 'axios';
import { z } from 'zod';

export type AiProvider = 'gemini' | 'anthropic' | 'openai';

interface ProviderConfig {
  provider: AiProvider;
  apiKey: string;
  model: string;
  baseUrl: string;
}

export interface DocumentExpenseContext {
  categories: Array<{ id: string; name: string }>;
  currencies: string[];
}

export interface ParsedDocumentExpense {
  amount: number;
  currency: string;
  category_id: string;
  date: string | null;
  merchant: string | null;
  items: string[];
  extra_info: string | null;
  description: string;
}

const ProviderSchema = z.enum(['gemini', 'anthropic', 'openai']);
const ModelExpenseSchema = z.object({
  amount: z.coerce.number().positive(),
  currency: z.string().min(3).max(3),
  category_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  merchant: z.string().trim().min(1).max(120).nullable(),
  items: z.array(z.string().trim().min(1).max(160)).max(30),
  extra_info: z.string().trim().min(1).max(500).nullable(),
});

const JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'amount',
    'currency',
    'category_id',
    'date',
    'merchant',
    'items',
    'extra_info',
  ],
  properties: {
    amount: { type: 'number' },
    currency: { type: 'string' },
    category_id: { type: 'string' },
    date: {
      type: ['string', 'null'],
      description: 'YYYY-MM-DD when the date can be parsed; otherwise null',
    },
    merchant: { type: ['string', 'null'] },
    items: { type: 'array', items: { type: 'string' } },
    extra_info: { type: ['string', 'null'] },
  },
} as const;

// Gemini accepts a subset of JSON Schema and rejects additionalProperties.
const GEMINI_JSON_SCHEMA = {
  type: JSON_SCHEMA.type,
  required: JSON_SCHEMA.required,
  properties: {
    ...JSON_SCHEMA.properties,
    date: {
      type: 'string',
      nullable: true,
      description: 'YYYY-MM-DD when the date can be parsed; otherwise null',
    },
    merchant: { type: 'string', nullable: true },
    extra_info: { type: 'string', nullable: true },
  },
} as const;

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const configs: Record<AiProvider, ProviderConfig | null> = {
  gemini:
    process.env.GEMINI_API_KEY && process.env.GEMINI_MODEL
      ? {
          provider: 'gemini',
          apiKey: process.env.GEMINI_API_KEY,
          model: process.env.GEMINI_MODEL,
          baseUrl: trimTrailingSlash(
            process.env.GEMINI_BASE_URL ??
              'https://generativelanguage.googleapis.com/v1beta',
          ),
        }
      : null,
  anthropic:
    process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_MODEL
      ? {
          provider: 'anthropic',
          apiKey: process.env.ANTHROPIC_API_KEY,
          model: process.env.ANTHROPIC_MODEL,
          baseUrl: trimTrailingSlash(
            process.env.ANTHROPIC_BASE_URL ?? 'https://api.anthropic.com',
          ),
        }
      : null,
  openai:
    process.env.OPENAI_API_KEY && process.env.OPENAI_MODEL
      ? {
          provider: 'openai',
          apiKey: process.env.OPENAI_API_KEY,
          model: process.env.OPENAI_MODEL,
          baseUrl: trimTrailingSlash(
            process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
          ),
        }
      : null,
};

const configuredProviders = (): ProviderConfig[] => {
  const rawPriority =
    process.env.AI_PROVIDER_PRIORITY ?? 'gemini,anthropic,openai';
  const priority = rawPriority
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .map((value) => ProviderSchema.safeParse(value))
    .filter(
      (result): result is { success: true; data: AiProvider } => result.success,
    )
    .map((result) => result.data);

  return [...new Set(priority)].flatMap((provider) =>
    configs[provider] ? [configs[provider]!] : [],
  );
};

export const getDocumentProcessingCapability = () => {
  const providers = configuredProviders();
  return {
    enabled: providers.length > 0,
    providers: providers.map(({ provider }) => provider),
  };
};

const buildPrompt = (context: DocumentExpenseContext) =>
  `
Extract one expense from the attached receipt, invoice, image, or document.

Rules:
- Return only data matching the supplied JSON schema.
- amount is the final total paid, as a positive number. Do not sum line items when a final total is visible.
- currency must be one of: ${context.currencies.join(', ')}.
- category_id must be the best general-knowledge match from this exact list: ${JSON.stringify(context.categories)}.
- date must be YYYY-MM-DD when it can be reliably parsed. Prefer the transaction/purchase date. If the date cannot be parsed, return null. Do not guess or invent a date.
- merchant is only the merchant, shop, store, vendor, or payee name. Keep it separate from items and extra_info. Return null when it cannot be determined.
- items contains concise receipt/check item lines. Preserve a visible quantity and item price or line total, including the printed currency or symbol, for example "2 x Coffee - 6.00 EUR". Never calculate or invent a price. Exclude subtotal, tax, tip, total, change, and payment-method lines. Use an empty array only when no purchased items can be determined.
- extra_info is a concise note for useful transaction details that are neither the merchant nor purchased items, such as a discount, tip, service charge, order reference, or payment context. Return null when there is no useful extra information.
- Do not invent financial facts. If multiple transactions exist, choose the document's primary/final transaction.
`.trim();

const parseJsonText = (text: string): unknown => {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  return JSON.parse(cleaned);
};

const callGemini = async (
  config: ProviderConfig,
  file: Buffer,
  mimeType: string,
  prompt: string,
) => {
  const { data } = await axios.post(
    `${config.baseUrl}/models/${encodeURIComponent(config.model)}:generateContent`,
    {
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType, data: file.toString('base64') } },
            { text: prompt },
          ],
        },
      ],
      generationConfig: {
        temperature: 0,
        responseMimeType: 'application/json',
        responseSchema: GEMINI_JSON_SCHEMA,
      },
    },
    { headers: { 'x-goog-api-key': config.apiKey }, timeout: 60_000 },
  );
  const text = data?.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text ?? '')
    .join('');
  if (!text) throw new Error('Gemini returned no structured result');
  return parseJsonText(text);
};

const anthropicFileBlock = (file: Buffer, mimeType: string) => {
  const data = file.toString('base64');
  if (mimeType.startsWith('image/')) {
    if (
      !['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(mimeType)
    ) {
      throw new Error(`Anthropic does not support ${mimeType} image uploads`);
    }
    return {
      type: 'image',
      source: { type: 'base64', media_type: mimeType, data },
    };
  }
  if (mimeType === 'application/pdf') {
    return {
      type: 'document',
      source: { type: 'base64', media_type: mimeType, data },
    };
  }
  if (
    mimeType.startsWith('text/') ||
    ['application/json', 'application/xml'].includes(mimeType)
  ) {
    return {
      type: 'text',
      text: `Uploaded document contents:\n${file.toString('utf8')}`,
    };
  }
  throw new Error(`Anthropic cannot process ${mimeType} directly`);
};

const callAnthropic = async (
  config: ProviderConfig,
  file: Buffer,
  mimeType: string,
  prompt: string,
) => {
  const { data } = await axios.post(
    `${config.baseUrl}/v1/messages`,
    {
      model: config.model,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            anthropicFileBlock(file, mimeType),
            { type: 'text', text: prompt },
          ],
        },
      ],
      tools: [
        {
          name: 'record_expense',
          description: 'Return the extracted expense.',
          input_schema: JSON_SCHEMA,
        },
      ],
      tool_choice: { type: 'tool', name: 'record_expense' },
    },
    {
      headers: {
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      timeout: 60_000,
    },
  );
  const toolUse = data?.content?.find(
    (block: { type?: string; name?: string }) =>
      block.type === 'tool_use' && block.name === 'record_expense',
  );
  if (!toolUse?.input)
    throw new Error('Anthropic returned no structured result');
  return toolUse.input;
};

const callOpenAi = async (
  config: ProviderConfig,
  file: Buffer,
  mimeType: string,
  filename: string,
  prompt: string,
) => {
  const fileContent = mimeType.startsWith('image/')
    ? {
        type: 'input_image',
        image_url: `data:${mimeType};base64,${file.toString('base64')}`,
        detail: 'auto',
      }
    : { type: 'input_file', filename, file_data: file.toString('base64') };
  const { data } = await axios.post(
    `${config.baseUrl}/responses`,
    {
      model: config.model,
      input: [
        {
          role: 'user',
          content: [fileContent, { type: 'input_text', text: prompt }],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'expense',
          strict: true,
          schema: JSON_SCHEMA,
        },
      },
    },
    {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 60_000,
    },
  );
  const text =
    data?.output_text ??
    data?.output
      ?.flatMap(
        (item: { content?: Array<{ type?: string; text?: string }> }) =>
          item.content ?? [],
      )
      ?.find((item: { type?: string }) => item.type === 'output_text')?.text;
  if (!text) throw new Error('OpenAI returned no structured result');
  return parseJsonText(text);
};

export const parseExpenseDocument = async (
  file: Buffer,
  mimeType: string,
  filename: string,
  context: DocumentExpenseContext,
): Promise<{ provider: AiProvider; expense: ParsedDocumentExpense }> => {
  const providers = configuredProviders();
  if (providers.length === 0) {
    const error = new Error(
      'Document processing is not configured',
    ) as Error & { statusCode: number };
    error.statusCode = 503;
    throw error;
  }

  const prompt = buildPrompt(context);
  const failures: string[] = [];
  for (const config of providers) {
    try {
      const raw =
        config.provider === 'gemini'
          ? await callGemini(config, file, mimeType, prompt)
          : config.provider === 'anthropic'
            ? await callAnthropic(config, file, mimeType, prompt)
            : await callOpenAi(config, file, mimeType, filename, prompt);
      const parsed = ModelExpenseSchema.parse(raw);
      if (!context.currencies.includes(parsed.currency))
        throw new Error(`Unsupported currency ${parsed.currency}`);
      if (!context.categories.some(({ id }) => id === parsed.category_id))
        throw new Error('Unknown category_id');
      const description = [
        parsed.items.join('; '),
        parsed.extra_info,
      ]
        .filter((value): value is string => Boolean(value))
        .join('. ');
      return { provider: config.provider, expense: { ...parsed, description } };
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? `${error.response?.status ?? 'network'} ${error.response?.data?.error?.message ?? error.message}`
        : error instanceof Error
          ? error.message
          : 'unknown error';
      failures.push(`${config.provider}: ${message}`);
    }
  }

  const error = new Error(
    `All configured AI providers failed (${failures.join('; ')})`,
  ) as Error & { statusCode: number };
  error.statusCode = 502;
  throw error;
};
