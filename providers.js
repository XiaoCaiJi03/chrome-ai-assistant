const AI_PROVIDERS = {
  openai: {
    label: 'OpenAI',
    apiKeyLabel: 'OpenAI API Key',
    apiKeyPlaceholder: 'sk-...',
    apiKeyUrl: 'https://platform.openai.com/api-keys',
    baseUrl: 'https://api.openai.com/v1',
    chatPath: '/chat/completions',
    modelsPath: '/models',
    protocol: 'openai',
    defaultModels: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'gpt-4.1-nano', 'o3-mini', 'o1-mini'],
    defaultModel: 'gpt-4o-mini',
    filter: (id) => /^(gpt-|o1|o3|chatgpt)/i.test(id) && !/(embed|tts|whisper|dall|image|moderation|audio|realtime|search|transcribe)/i.test(id),
  },
  anthropic: {
    label: 'Anthropic (Claude)',
    apiKeyLabel: 'Anthropic API Key',
    apiKeyPlaceholder: 'sk-ant-...',
    apiKeyUrl: 'https://console.anthropic.com/settings/keys',
    baseUrl: 'https://api.anthropic.com/v1',
    chatPath: '/messages',
    modelsPath: '/models',
    protocol: 'anthropic',
    defaultModels: [
      'claude-sonnet-4-5',
      'claude-opus-4-1',
      'claude-3-7-sonnet-latest',
      'claude-3-5-sonnet-latest',
      'claude-3-5-haiku-latest',
    ],
    defaultModel: 'claude-3-5-sonnet-latest',
  },
  gemini: {
    label: 'Google Gemini',
    apiKeyLabel: 'Gemini API Key',
    apiKeyPlaceholder: 'AIza...',
    apiKeyUrl: 'https://aistudio.google.com/apikey',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    chatPath: '/chat/completions',
    modelsPath: '/models',
    protocol: 'openai',
    defaultModels: [
      'gemini-2.5-pro',
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
    ],
    defaultModel: 'gemini-2.0-flash',
    filter: (id) => /gemini/i.test(id) && !/(embed|aqa|tts|image|vision-only)/i.test(id),
  },
  deepseek: {
    label: 'DeepSeek',
    apiKeyLabel: 'DeepSeek API Key',
    apiKeyPlaceholder: 'sk-...',
    apiKeyUrl: 'https://platform.deepseek.com/api_keys',
    baseUrl: 'https://api.deepseek.com/v1',
    chatPath: '/chat/completions',
    modelsPath: '/models',
    protocol: 'openai',
    defaultModels: ['deepseek-chat', 'deepseek-reasoner'],
    defaultModel: 'deepseek-chat',
  },
  minimax: {
    label: 'MiniMax (MiniMax)',
    apiKeyLabel: 'MiniMax API Key',
    apiKeyPlaceholder: '输入 MiniMax Group Token',
    apiKeyUrl: 'https://platform.minimaxi.com/user-center/basic-information/interface-key',
    baseUrl: 'https://api.minimaxi.com/v1',
    chatPath: '/openai/chat/completions',
    modelsPath: null,
    protocol: 'openai',
    defaultModels: ['MiniMax-M2', 'MiniMax-Text-01', 'MiniMax-M2.5-7B', 'abab6.5s-chat'],
    defaultModel: 'MiniMax-M2',
  },
  moonshot: {
    label: 'Moonshot (Kimi)',
    apiKeyLabel: 'Moonshot API Key',
    apiKeyPlaceholder: 'sk-...',
    apiKeyUrl: 'https://platform.moonshot.cn/console/api-keys',
    baseUrl: 'https://api.moonshot.cn/v1',
    chatPath: '/chat/completions',
    modelsPath: '/models',
    protocol: 'openai',
    defaultModels: ['kimi-k2-0905-preview', 'moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
    defaultModel: 'moonshot-v1-8k',
  },
  zhipu: {
    label: '智谱 GLM',
    apiKeyLabel: 'Zhipu API Key',
    apiKeyPlaceholder: 'xxx.xxx',
    apiKeyUrl: 'https://bigmodel.cn/usercenter/proj-mgmt/apikeys',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    chatPath: '/chat/completions',
    modelsPath: null,
    protocol: 'openai',
    defaultModels: ['glm-4.6', 'glm-4.5', 'glm-4.5-air', 'glm-4-plus', 'glm-4-flash'],
    defaultModel: 'glm-4-flash',
  },
  qwen: {
    label: '通义千问 (DashScope)',
    apiKeyLabel: 'DashScope API Key',
    apiKeyPlaceholder: 'sk-...',
    apiKeyUrl: 'https://bailian.console.aliyun.com/?apiKey=1',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    chatPath: '/chat/completions',
    modelsPath: '/models',
    protocol: 'openai',
    defaultModels: ['qwen-max', 'qwen-plus', 'qwen-turbo', 'qwen3-max', 'qwen3-coder-plus'],
    defaultModel: 'qwen-plus',
  },
  openrouter: {
    label: 'OpenRouter',
    apiKeyLabel: 'OpenRouter API Key',
    apiKeyPlaceholder: 'sk-or-...',
    apiKeyUrl: 'https://openrouter.ai/keys',
    baseUrl: 'https://openrouter.ai/api/v1',
    chatPath: '/chat/completions',
    modelsPath: '/models',
    protocol: 'openai',
    defaultModels: ['openai/gpt-4o-mini', 'anthropic/claude-3.5-sonnet', 'google/gemini-2.0-flash-exp'],
    defaultModel: 'openai/gpt-4o-mini',
  },
  groq: {
    label: 'Groq',
    apiKeyLabel: 'Groq API Key',
    apiKeyPlaceholder: 'gsk_...',
    apiKeyUrl: 'https://console.groq.com/keys',
    baseUrl: 'https://api.groq.com/openai/v1',
    chatPath: '/chat/completions',
    modelsPath: '/models',
    protocol: 'openai',
    defaultModels: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
    defaultModel: 'llama-3.3-70b-versatile',
  },
  mistral: {
    label: 'Mistral AI',
    apiKeyLabel: 'Mistral API Key',
    apiKeyPlaceholder: 'xxx',
    apiKeyUrl: 'https://console.mistral.ai/api-keys',
    baseUrl: 'https://api.mistral.ai/v1',
    chatPath: '/chat/completions',
    modelsPath: '/models',
    protocol: 'openai',
    defaultModels: ['mistral-large-latest', 'mistral-small-latest', 'codestral-latest'],
    defaultModel: 'mistral-small-latest',
  },
  xai: {
    label: 'xAI (Grok)',
    apiKeyLabel: 'xAI API Key',
    apiKeyPlaceholder: 'xai-...',
    apiKeyUrl: 'https://console.x.ai/team/default/api-keys',
    baseUrl: 'https://api.x.ai/v1',
    chatPath: '/chat/completions',
    modelsPath: '/models',
    protocol: 'openai',
    defaultModels: ['grok-4', 'grok-3', 'grok-3-mini', 'grok-2-1212'],
    defaultModel: 'grok-3-mini',
  },
  together: {
    label: 'Together AI',
    apiKeyLabel: 'Together API Key',
    apiKeyPlaceholder: 'xxx',
    apiKeyUrl: 'https://api.together.ai/settings/api-keys',
    baseUrl: 'https://api.together.xyz/v1',
    chatPath: '/chat/completions',
    modelsPath: '/models',
    protocol: 'openai',
    defaultModels: ['meta-llama/Llama-3.3-70B-Instruct-Turbo', 'deepseek-ai/DeepSeek-V3'],
    defaultModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
  },
  siliconflow: {
    label: '硅基流动 (SiliconFlow)',
    apiKeyLabel: 'SiliconFlow API Key',
    apiKeyPlaceholder: 'sk-...',
    apiKeyUrl: 'https://cloud.siliconflow.cn/account/ak',
    baseUrl: 'https://api.siliconflow.cn/v1',
    chatPath: '/chat/completions',
    modelsPath: '/models',
    protocol: 'openai',
    defaultModels: ['Qwen/Qwen2.5-72B-Instruct', 'deepseek-ai/DeepSeek-V3', 'meta-llama/Llama-3.3-70B-Instruct'],
    defaultModel: 'Qwen/Qwen2.5-72B-Instruct',
  },
  ollama: {
    label: 'Ollama (本地)',
    apiKeyLabel: 'API Key（可留空）',
    apiKeyPlaceholder: '本地通常不需要',
    apiKeyUrl: 'https://ollama.com/',
    baseUrl: 'http://localhost:11434/v1',
    chatPath: '/chat/completions',
    modelsPath: '/models',
    protocol: 'openai',
    defaultModels: ['llama3.2', 'qwen2.5', 'gemma2'],
    defaultModel: 'llama3.2',
    keyOptional: true,
  },
  custom: {
    label: '自定义 (OpenAI 兼容)',
    apiKeyLabel: 'API Key',
    apiKeyPlaceholder: '可留空',
    apiKeyUrl: '',
    baseUrl: '',
    chatPath: '/chat/completions',
    modelsPath: '/models',
    protocol: 'openai',
    defaultModels: [],
    defaultModel: '',
    requireBaseUrl: true,
    keyOptional: true,
  },
};

function joinUrl(base, path) {
  if (!base) return path;
  const b = base.replace(/\/+$/, '');
  if (!path) return b;
  return b + (path.startsWith('/') ? path : '/' + path);
}

function buildAuthHeaders(protocol, apiKey) {
  if (!apiKey) return {};
  if (protocol === 'anthropic') {
    return {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    };
  }
  return { Authorization: 'Bearer ' + apiKey };
}

async function fetchProviderModels({ provider, apiKey, customBaseUrl }) {
  const cfg = AI_PROVIDERS[provider];
  if (!cfg) throw new Error('未知供应商：' + provider);

  const base = (customBaseUrl || cfg.baseUrl || '').trim();
  if (!base) throw new Error('请填写 API 地址');
  if (!cfg.modelsPath) throw new Error(cfg.label + ' 暂不支持自动获取，请手动输入模型 ID');

  const url = joinUrl(base, cfg.modelsPath);
  const headers = {
    'Content-Type': 'application/json',
    ...buildAuthHeaders(cfg.protocol, apiKey),
  };

  const resp = await fetch(url, { method: 'GET', headers });
  if (!resp.ok) {
    let detail = '';
    try {
      const e = await resp.json();
      detail = e.error?.message || e.message || JSON.stringify(e);
    } catch {
      detail = await resp.text().catch(() => '');
    }
    throw new Error('HTTP ' + resp.status + (detail ? '：' + detail.slice(0, 200) : ''));
  }

  const data = await resp.json();
  let items = data.data || data.models || data.result || [];
  if (!Array.isArray(items)) items = [];

  let ids = items
    .map((m) => (typeof m === 'string' ? m : m.id || m.name || m.model))
    .filter(Boolean);

  if (typeof cfg.filter === 'function') {
    ids = ids.filter(cfg.filter);
  }

  return [...new Set(ids)].sort();
}

if (typeof globalThis !== 'undefined') {
  globalThis.AI_PROVIDERS = AI_PROVIDERS;
  globalThis.fetchProviderModels = fetchProviderModels;
  globalThis.joinUrl = joinUrl;
  globalThis.buildAuthHeaders = buildAuthHeaders;
  globalThis.resolveProviderConfig = resolveProviderConfig;
  globalThis.migrateLegacySettings = migrateLegacySettings;
}

function resolveProviderConfig(settings, provider) {
  const cfg = AI_PROVIDERS[provider] || {};
  return {
    apiKey: (settings.apiKeys && settings.apiKeys[provider]) || '',
    model: (settings.models && settings.models[provider]) || cfg.defaultModel || '',
    customBaseUrl: (settings.customBaseUrls && settings.customBaseUrls[provider]) || cfg.baseUrl || '',
  };
}

function migrateLegacySettings(settings) {
  const provider = settings.provider in (AI_PROVIDERS || {}) ? settings.provider : 'openai';
  const out = {
    provider,
    apiKeys: { ...(settings.apiKeys || {}) },
    models: { ...(settings.models || {}) },
    customBaseUrls: { ...(settings.customBaseUrls || {}) },
    customPrompt: settings.customPrompt || '',
  };
  if (settings.apiKey && !out.apiKeys[provider]) {
    out.apiKeys[provider] = settings.apiKey;
  }
  if (settings.model && !out.models[provider]) {
    out.models[provider] = settings.model;
  }
  if (settings.customBaseUrl && !out.customBaseUrls[provider]) {
    out.customBaseUrls[provider] = settings.customBaseUrl;
  }
  return out;
}
