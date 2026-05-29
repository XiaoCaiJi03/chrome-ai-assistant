const MENU_ACTIONS = {
  SUMMARIZE: 'ai-summarize',
  TRANSLATE: 'ai-translate',
  EXPLAIN: 'ai-explain',
  CUSTOM: 'ai-custom',
  PROMPT: 'ai-prompt',
};

const SYSTEM_PROMPTS = {
  [MENU_ACTIONS.SUMMARIZE]: '请用中文总结以下内容的核心要点，保持简洁清晰：\n\n',
  [MENU_ACTIONS.TRANSLATE]: '请将以下内容翻译成中文：\n\n',
  [MENU_ACTIONS.EXPLAIN]: '请用通俗易懂的语言解释以下内容：\n\n',
  [MENU_ACTIONS.CUSTOM]: '',
};

const PROVIDERS = {
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1/chat/completions',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-nano', 'gpt-4.1-mini', 'o3-mini'],
    defaultModel: 'gpt-4o-mini',
  },
  deepseek: {
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1/chat/completions',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    defaultModel: 'deepseek-chat',
  },
  minimax: {
    name: 'MiniMax',
    baseUrl: 'https://api.minimaxi.com/v1/openai/chat/completions',
    models: ['MiniMax-Text-01', 'MiniMax-M2.5-7B'],
    defaultModel: 'MiniMax-Text-01',
  },
};

chrome.runtime.onInstalled.addListener(() => {
  createContextMenus();
});

function createContextMenus() {
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
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const { menuItemId, selectionText } = info;
  if (!selectionText || !tab?.id) return;

  // Inject content script FIRST so it can receive messages
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
    apiKey: '',
    model: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 2048,
    customPrompt: '',
    customBaseUrl: '',
  });

  if (!settings.apiKey) {
    sendToTab(tab.id, { type: 'AI_ERROR', error: '请先设置 API Key（点击扩展图标）' });
    return;
  }

  let systemPrompt = '';
  if (menuItemId === MENU_ACTIONS.CUSTOM) {
    systemPrompt = settings.customPrompt || '请处理以下内容：\n\n';
  } else {
    systemPrompt = SYSTEM_PROMPTS[menuItemId] || '请处理以下内容：\n\n';
  }

  sendToTab(tab.id, { type: 'AI_LOADING' });

  try {
    const result = await callAI(settings, systemPrompt + selectionText);
    sendToTab(tab.id, { type: 'AI_RESULT', result, action: menuItemId });
  } catch (err) {
    sendToTab(tab.id, { type: 'AI_ERROR', error: err.message });
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
  const provider = PROVIDERS[settings.provider];
  const baseUrl = settings.customBaseUrl || provider.baseUrl;

  const resp = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({
      model: settings.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: settings.temperature,
      max_tokens: settings.maxTokens,
    }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error?.message || `API Error: ${resp.status}`);
  }

  const data = await resp.json();
  return data.choices[0].message.content;
}
