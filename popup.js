const els = {
  provider: document.getElementById('provider'),
  apiKey: document.getElementById('apiKey'),
  apiKeyLabel: document.getElementById('apiKeyLabel'),
  apiKeyHelp: document.getElementById('apiKeyHelp'),
  modelSelect: document.getElementById('modelSelect'),
  modelInput: document.getElementById('modelInput'),
  modelToggleBtn: document.getElementById('modelToggleBtn'),
  modelCount: document.getElementById('modelCount'),
  modelMeta: document.getElementById('modelMeta'),
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
let manualMode = false;
let autoFetchTimer = null;
let baseUrlEdited = false;

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
    baseUrlEdited = true;
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

  if (!baseUrlEdited || !els.customBaseUrl.value.trim()) {
    els.customBaseUrl.value = cfg.baseUrl;
  }
  els.customBaseUrl.placeholder = cfg.baseUrl || '请输入 baseUrl';
  els.baseUrlMeta.textContent = cfg.requireBaseUrl
    ? '⚠️ 请填写完整 baseUrl'
    : '自动拼接 ' + (cfg.chatPath || '/chat/completions') + ' 与 ' + (cfg.modelsPath || '（不支持列模型）');

  const cached = modelCache[providerKey];
  const list = cached?.models?.length ? cached.models : (cfg.defaultModels || []);
  renderModels(list, preferredModel || cfg.defaultModel);

  if (cached?.fetchedAt) {
    els.modelMeta.textContent = '已加载 ' + cached.models.length + ' 个模型 · ' + new Date(cached.fetchedAt).toLocaleString();
    els.modelMeta.className = 'meta ok';
  } else {
    els.modelMeta.textContent = cfg.modelsPath ? '点击 🔄 拉取最新模型列表' : '该供应商不支持自动获取，请手动输入';
    els.modelMeta.className = 'meta';
  }

  els.fetchBtn.disabled = !cfg.modelsPath;
}

function renderModels(models, selected) {
  els.modelSelect.innerHTML = '';
  for (const m of models) {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = m;
    els.modelSelect.appendChild(opt);
  }
  els.modelCount.textContent = models.length ? '(' + models.length + ')' : '';

  const target = selected && models.includes(selected) ? selected : (models[0] || '');
  els.modelSelect.value = target;
  if (manualMode) {
    els.modelInput.value = target;
  }
}

function getCurrentModel() {
  return manualMode ? els.modelInput.value.trim() : els.modelSelect.value;
}

function setManualMode(on) {
  manualMode = on;
  if (on) {
    els.modelInput.value = els.modelSelect.value;
    els.modelSelect.style.display = 'none';
    els.modelInput.style.display = '';
    els.modelToggleBtn.textContent = '📋';
    els.modelToggleBtn.title = '切换到下拉选择';
    els.modelToggleBtn.classList.add('active');
    els.modelInput.focus();
  } else {
    const val = els.modelInput.value.trim();
    if (val && [...els.modelSelect.options].some(o => o.value === val)) {
      els.modelSelect.value = val;
    } else if (val) {
      const opt = document.createElement('option');
      opt.value = val;
      opt.textContent = val + ' (自定义)';
      els.modelSelect.appendChild(opt);
      els.modelSelect.value = val;
    }
    els.modelSelect.style.display = '';
    els.modelInput.style.display = 'none';
    els.modelToggleBtn.textContent = '✏️';
    els.modelToggleBtn.title = '切换到手动输入';
    els.modelToggleBtn.classList.remove('active');
  }
  persistField('model', getCurrentModel());
}

async function persistField(key, value) {
  try {
    await chrome.storage.sync.set({ [key]: value });
  } catch (e) {
    console.warn('persist failed', key, e);
  }
}

els.provider.addEventListener('change', () => {
  baseUrlEdited = false;
  applyProvider(els.provider.value);
  persistField('provider', els.provider.value);
  persistField('customBaseUrl', els.customBaseUrl.value.trim());
  persistField('model', getCurrentModel());
  scheduleAutoFetch();
});

els.customBaseUrl.addEventListener('input', () => {
  baseUrlEdited = true;
  scheduleAutoFetch();
});
els.customBaseUrl.addEventListener('blur', () => {
  persistField('customBaseUrl', els.customBaseUrl.value.trim());
});

els.resetBaseUrl.addEventListener('click', (e) => {
  e.preventDefault();
  const cfg = AI_PROVIDERS[els.provider.value];
  els.customBaseUrl.value = cfg.baseUrl;
  baseUrlEdited = false;
  persistField('customBaseUrl', cfg.baseUrl);
  scheduleAutoFetch();
});

els.apiKey.addEventListener('input', () => scheduleAutoFetch());
els.apiKey.addEventListener('blur', () => persistField('apiKey', els.apiKey.value.trim()));

els.modelSelect.addEventListener('change', () => {
  persistField('model', els.modelSelect.value);
});
els.modelInput.addEventListener('input', () => {
  if (manualMode) persistField('model', els.modelInput.value.trim());
});

els.modelToggleBtn.addEventListener('click', () => setManualMode(!manualMode));

els.fetchBtn.addEventListener('click', () => fetchModels(false));

els.saveBtn.addEventListener('click', save);

function scheduleAutoFetch() {
  clearTimeout(autoFetchTimer);
  const cfg = AI_PROVIDERS[els.provider.value];
  if (!cfg?.modelsPath) return;
  const key = els.apiKey.value.trim();
  if (!key && !cfg.keyOptional) return;
  if (!els.customBaseUrl.value.trim()) return;
  autoFetchTimer = setTimeout(() => fetchModels(true), 1000);
}

async function fetchModels(silent) {
  const provider = els.provider.value;
  const cfg = AI_PROVIDERS[provider];
  if (!cfg?.modelsPath) {
    if (!silent) showStatus(cfg.label + ' 不支持自动列模型', 'error');
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
  els.fetchBtn.textContent = '…';
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
      } catch {
        throw directErr;
      }
    }
    if (!models?.length) throw new Error('返回空列表');

    modelCache[provider] = { models, fetchedAt: Date.now() };
    await chrome.storage.local.set({ modelCache });

    const previous = getCurrentModel();
    renderModels(models, models.includes(previous) ? previous : (cfg.defaultModel || models[0]));
    await persistField('model', getCurrentModel());

    els.modelMeta.textContent = '已加载 ' + models.length + ' 个模型 · ' + new Date().toLocaleString();
    els.modelMeta.className = 'meta ok';
    showStatus('✅ 已获取 ' + models.length + ' 个模型，可在下拉框中选择', 'success');
  } catch (err) {
    showStatus('❌ 获取失败：' + err.message, 'error');
    els.modelMeta.textContent = '获取失败，可点击 ✏️ 手动输入模型 ID';
    els.modelMeta.className = 'meta err';
  } finally {
    els.fetchBtn.disabled = !AI_PROVIDERS[provider]?.modelsPath;
    els.fetchBtn.textContent = '🔄';
  }
}

async function save() {
  const provider = els.provider.value;
  const cfg = AI_PROVIDERS[provider];
  const apiKey = els.apiKey.value.trim();
  const model = getCurrentModel();
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
