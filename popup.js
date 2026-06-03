const els = {
  provider: document.getElementById('provider'),
  apiKey: document.getElementById('apiKey'),
  apiKeyLabel: document.getElementById('apiKeyLabel'),
  apiKeyHelp: document.getElementById('apiKeyHelp'),
  model: document.getElementById('model'),
  modelList: document.getElementById('modelList'),
  modelMeta: document.getElementById('modelMeta'),
  manualEdit: document.getElementById('manualEdit'),
  customBaseUrl: document.getElementById('customBaseUrl'),
  baseUrlMeta: document.getElementById('baseUrlMeta'),
  resetBaseUrl: document.getElementById('resetBaseUrl'),
  customPrompt: document.getElementById('customPrompt'),
  fetchBtn: document.getElementById('fetchBtn'),
  saveBtn: document.getElementById('saveBtn'),
  status: document.getElementById('status'),
};

const STORAGE_DEFAULTS = {
  provider: 'openai',
  apiKey: '',
  model: '',
  customPrompt: '',
  customBaseUrl: '',
};

let modelCache = {};
let autoFetchTimer = null;

(async function init() {
  populateProviders();
  const [settings, cacheStore] = await Promise.all([
    chrome.storage.sync.get(STORAGE_DEFAULTS),
    chrome.storage.local.get({ modelCache: {} }),
  ]);
  modelCache = cacheStore.modelCache || {};

  els.provider.value = settings.provider in AI_PROVIDERS ? settings.provider : 'openai';
  els.apiKey.value = settings.apiKey;
  els.customPrompt.value = settings.customPrompt;
  if (settings.customBaseUrl) {
    els.customBaseUrl.value = settings.customBaseUrl;
    els.customBaseUrl.dataset.userEdited = '1';
  }

  applyProvider(els.provider.value, settings.model);
})();

function populateProviders() {
  els.provider.innerHTML = '';
  for (const [key, cfg] of Object.entries(AI_PROVIDERS)) {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = cfg.label;
    els.provider.appendChild(opt);
  }
}

function applyProvider(providerKey, preferredModel) {
  const cfg = AI_PROVIDERS[providerKey];
  if (!cfg) return;

  els.apiKeyLabel.textContent = cfg.apiKeyLabel;
  els.apiKey.placeholder = cfg.apiKeyPlaceholder;

  if (cfg.apiKeyUrl) {
    els.apiKeyHelp.href = cfg.apiKeyUrl;
    els.apiKeyHelp.style.display = 'inline';
  } else {
    els.apiKeyHelp.style.display = 'none';
  }

  if (!els.customBaseUrl.dataset.userEdited || els.customBaseUrl.value === '') {
    els.customBaseUrl.value = cfg.baseUrl;
  }
  els.customBaseUrl.placeholder = cfg.baseUrl || '请输入 baseUrl';
  els.baseUrlMeta.textContent = cfg.requireBaseUrl
    ? '⚠️ 自定义供应商，请填写完整 baseUrl'
    : '将自动拼接 ' + (cfg.chatPath || '/chat/completions') + ' 与 ' + (cfg.modelsPath || '（不支持列模型）');

  const cached = modelCache[providerKey];
  const list = cached?.models?.length ? cached.models : cfg.defaultModels;
  renderModels(list, preferredModel || cfg.defaultModel);

  if (cached?.fetchedAt) {
    els.modelMeta.textContent = '已缓存 ' + cached.models.length + ' 个模型 · ' + new Date(cached.fetchedAt).toLocaleString();
  } else {
    els.modelMeta.textContent = cfg.modelsPath ? '点击"获取"自动拉取模型' : '该供应商不支持自动获取，请手动输入';
  }

  els.fetchBtn.disabled = !cfg.modelsPath;
}

function renderModels(models, selected) {
  els.modelList.innerHTML = '';
  for (const m of models) {
    const opt = document.createElement('option');
    opt.value = m;
    els.modelList.appendChild(opt);
  }
  if (selected && models.includes(selected)) {
    els.model.value = selected;
  } else if (models.length && !els.model.value) {
    els.model.value = models[0];
  }
}

els.provider.addEventListener('change', () => {
  els.customBaseUrl.dataset.userEdited = '';
  applyProvider(els.provider.value);
  scheduleAutoFetch();
});

els.customBaseUrl.addEventListener('input', () => {
  els.customBaseUrl.dataset.userEdited = '1';
  scheduleAutoFetch();
});

els.resetBaseUrl.addEventListener('click', (e) => {
  e.preventDefault();
  const cfg = AI_PROVIDERS[els.provider.value];
  els.customBaseUrl.value = cfg.baseUrl;
  els.customBaseUrl.dataset.userEdited = '';
  scheduleAutoFetch();
});

els.apiKey.addEventListener('input', () => {
  scheduleAutoFetch();
});

els.manualEdit.addEventListener('click', (e) => {
  e.preventDefault();
  els.model.focus();
  els.model.select();
});

els.fetchBtn.addEventListener('click', () => fetchModels());

els.saveBtn.addEventListener('click', save);

function scheduleAutoFetch() {
  clearTimeout(autoFetchTimer);
  const cfg = AI_PROVIDERS[els.provider.value];
  if (!cfg?.modelsPath) return;
  const key = els.apiKey.value.trim();
  if (!key && !cfg.keyOptional) return;
  if (!els.customBaseUrl.value.trim()) return;
  autoFetchTimer = setTimeout(() => fetchModels(true), 800);
}

async function fetchModels(silent) {
  const provider = els.provider.value;
  const cfg = AI_PROVIDERS[provider];
  if (!cfg?.modelsPath) {
    showStatus(cfg.label + ' 不支持自动列模型', 'error');
    return;
  }
  const apiKey = els.apiKey.value.trim();
  const customBaseUrl = els.customBaseUrl.value.trim();
  if (!apiKey && !cfg.keyOptional) {
    if (!silent) showStatus('请先填写 API Key', 'error');
    return;
  }
  if (!customBaseUrl) {
    if (!silent) showStatus('请先填写 API 地址', 'error');
    return;
  }

  els.fetchBtn.disabled = true;
  els.fetchBtn.textContent = '拉取中…';
  if (!silent) showStatus('正在从 ' + cfg.label + ' 拉取模型…', 'info');

  try {
    let models;
    try {
      models = await fetchProviderModels({ provider, apiKey, customBaseUrl });
    } catch (directErr) {
      try {
        const resp = await chrome.runtime.sendMessage({
          type: 'AI_FETCH_MODELS',
          payload: { provider, apiKey, customBaseUrl },
        });
        if (!resp?.ok) throw new Error(resp?.error || directErr.message);
        models = resp.models;
      } catch (bgErr) {
        throw new Error(directErr.message);
      }
    }
    if (!models?.length) throw new Error('返回空列表，请检查 API 地址');

    modelCache[provider] = { models, fetchedAt: Date.now() };
    await chrome.storage.local.set({ modelCache });

    const previous = els.model.value;
    renderModels(models, models.includes(previous) ? previous : cfg.defaultModel);
    els.modelMeta.textContent = '已加载 ' + models.length + ' 个模型 · ' + new Date().toLocaleString();
    showStatus('✅ 已获取 ' + models.length + ' 个模型', 'success');
  } catch (err) {
    showStatus('❌ 获取失败：' + err.message, 'error');
    els.modelMeta.textContent = '获取失败，可手动输入模型 ID';
  } finally {
    els.fetchBtn.disabled = false;
    els.fetchBtn.textContent = '🔄 获取';
  }
}

async function save() {
  const provider = els.provider.value;
  const cfg = AI_PROVIDERS[provider];
  const apiKey = els.apiKey.value.trim();
  const model = els.model.value.trim();
  const customPrompt = els.customPrompt.value.trim();
  const customBaseUrl = els.customBaseUrl.value.trim();

  if (!apiKey && !cfg.keyOptional) {
    showStatus('请输入 API Key', 'error');
    return;
  }
  if (!customBaseUrl) {
    showStatus('请输入 API 地址', 'error');
    return;
  }
  if (!model) {
    showStatus('请选择或输入模型 ID', 'error');
    return;
  }

  await chrome.storage.sync.set({ provider, apiKey, model, customPrompt, customBaseUrl });
  showStatus('✅ 设置已保存', 'success');
}

function showStatus(msg, type) {
  els.status.textContent = msg;
  els.status.className = 'status ' + type;
  if (type === 'success' || type === 'error') {
    setTimeout(() => {
      els.status.className = 'status';
    }, 3500);
  }
}
