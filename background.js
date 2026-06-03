importScripts('providers.js');

const MENU_ACTIONS = {
  SUMMARIZE: 'ai-summarize',
  TRANSLATE: 'ai-translate',
  EXPLAIN: 'ai-explain',
  CUSTOM: 'ai-custom',
};

const SYSTEM_PROMPTS = {
  [MENU_ACTIONS.SUMMARIZE]: '请用中文总结以下内容的核心要点，保持简洁清晰：\n\n',
  [MENU_ACTIONS.TRANSLATE]: '请将以下内容翻译成中文：\n\n',
  [MENU_ACTIONS.EXPLAIN]: '请用通俗易懂的语言解释以下内容：\n\n',
  [MENU_ACTIONS.CUSTOM]: '',
};

chrome.runtime.onInstalled.addListener(() => {
  createContextMenus();
});

chrome.runtime.onStartup.addListener(() => {
  createContextMenus();
});

function createContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'ai-parent',
      title: 'AI 助手',
      contexts: ['selection'],
    });
    chrome.contextMenus.create({
      id: MENU_ACTIONS.SUMMARIZE,
      parentId: 'ai-parent',
      title: '📝 总结',
      contexts: ['selection'],
    });
    chrome.contextMenus.create({
      id: MENU_ACTIONS.TRANSLATE,
      parentId: 'ai-parent',
      title: '🌐 翻译成中文',
      contexts: ['selection'],
    });
    chrome.contextMenus.create({
      id: MENU_ACTIONS.EXPLAIN,
      parentId: 'ai-parent',
      title: '💡 解释说明',
      contexts: ['selection'],
    });
    chrome.contextMenus.create({
      id: MENU_ACTIONS.CUSTOM,
      parentId: 'ai-parent',
      title: '⚡ 自定义提示词',
      contexts: ['selection'],
    });
  });
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const { menuItemId, selectionText } = info;
  if (!selectionText || !tab?.id) return;

  try {
    await ensureContentScript(tab.id);
  } catch {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'AI 助手',
      message: '无法在此页面使用（受限页面）',
    });
    return;
  }

  const settings = await chrome.storage.sync.get({
    provider: 'openai',
    apiKeys: {},
    models: {},
    customBaseUrls: {},
    temperature: 0.7,
    maxTokens: 2048,
    customPrompt: '',
    apiKey: '',
    model: '',
    customBaseUrl: '',
  });

  const cfg = AI_PROVIDERS[settings.provider];
  if (!cfg) {
    sendToTab(tab.id, { type: 'AI_ERROR', error: '未知供应商，请在扩展设置中重新选择' });
    return;
  }

  const migrated = migrateLegacySettings(settings);
  const conf = resolveProviderConfig(migrated, migrated.provider);
  const resolved = {
    provider: migrated.provider,
    apiKey: conf.apiKey,
    model: conf.model,
    customBaseUrl: conf.customBaseUrl,
    temperature: settings.temperature,
    maxTokens: settings.maxTokens,
    customPrompt: settings.customPrompt,
  };

  if (!resolved.apiKey && !cfg.keyOptional) {
    sendToTab(tab.id, {
      type: 'AI_ERROR',
      error: '请先为「' + cfg.label + '」设置 API Key（点击扩展图标）',
    });
    return;
  }
  if (!resolved.model) {
    sendToTab(tab.id, {
      type: 'AI_ERROR',
      error: '请先为「' + cfg.label + '」选择模型（点击扩展图标）',
    });
    return;
  }

  const systemPrompt =
    menuItemId === MENU_ACTIONS.CUSTOM
      ? resolved.customPrompt || '请处理以下内容：\n\n'
      : SYSTEM_PROMPTS[menuItemId] || '请处理以下内容：\n\n';

  sendToTab(tab.id, { type: 'AI_LOADING' });

  try {
    const result = await callAI(resolved, systemPrompt + selectionText);
    sendToTab(tab.id, { type: 'AI_RESULT', result, action: menuItemId });
  } catch (err) {
    sendToTab(tab.id, { type: 'AI_ERROR', error: err.message });
  }
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === 'AI_FETCH_MODELS') {
    fetchProviderModels(msg.payload)
      .then((models) => sendResponse({ ok: true, models }))
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }
  if (msg?.type === 'AI_VERIFY_MODEL') {
    const p = msg.payload || {};
    const cfg = AI_PROVIDERS[p.provider];
    if (!cfg) return sendResponse({ ok: false, error: '未知供应商' });
    const resolved = {
      provider: p.provider,
      apiKey: p.apiKey,
      model: p.model,
      customBaseUrl: p.customBaseUrl,
      temperature: 0,
      maxTokens: 1,
    };
    callAI(resolved, 'ping')
      .then(() => sendResponse({ ok: true }))
      .catch((err) => sendResponse({ ok: false, error: err.message || String(err) }));
    return true;
  }
});

async function ensureContentScript(tabId) {
  try {
    await chrome.tabs.sendMessage(tabId, { type: 'AI_PING' });
  } catch {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js'],
    });
  }
}

function sendToTab(tabId, msg) {
  chrome.tabs.sendMessage(tabId, msg).catch(() => {});
}

async function callAI(settings, prompt) {
  const cfg = AI_PROVIDERS[settings.provider];
  const base = (settings.customBaseUrl || cfg.baseUrl || '').trim();
  if (!base) throw new Error('请在设置中填写 API 地址');

  const url = joinUrl(base, cfg.chatPath);

  if (cfg.protocol === 'anthropic') {
    return callAnthropic(url, settings, cfg, prompt);
  }
  return callOpenAICompatible(url, settings, cfg, prompt);
}

async function callOpenAICompatible(url, settings, cfg, prompt) {
  const headers = {
    'Content-Type': 'application/json',
    ...buildAuthHeaders(cfg.protocol, settings.apiKey),
  };

  const body = {
    model: settings.model,
    messages: [{ role: 'user', content: prompt }],
    temperature: settings.temperature,
    max_tokens: settings.maxTokens,
    max_completion_tokens: settings.maxTokens,
  };

  const resp = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error?.message || err.message || `API Error: ${resp.status}`);
  }

  const data = await resp.json();
  const content =
    data.choices?.[0]?.message?.content ||
    data.choices?.[0]?.text ||
    data.message?.content ||
    data.output_text;
  if (!content) throw new Error('API 返回为空');
  return content;
}

async function callAnthropic(url, settings, cfg, prompt) {
  const headers = {
    'Content-Type': 'application/json',
    ...buildAuthHeaders(cfg.protocol, settings.apiKey),
  };

  const body = {
    model: settings.model,
    max_tokens: settings.maxTokens,
    temperature: settings.temperature,
    messages: [{ role: 'user', content: prompt }],
  };

  const resp = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error?.message || err.message || `API Error: ${resp.status}`);
  }

  const data = await resp.json();
  const text = (data.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n');
  if (!text) throw new Error('Anthropic 返回为空');
  return text;
}
