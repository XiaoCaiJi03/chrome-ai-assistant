const els = {
  provider: document.getElementById('provider'),
  apiKey: document.getElementById('apiKey'),
  apiKeyLabel: document.getElementById('apiKeyLabel'),
  apiKeyHelp: document.getElementById('apiKeyHelp'),
  toggleKeyBtn: document.getElementById('toggleKeyBtn'),
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
  verifyBtn: document.getElementById('verifyBtn'),
  saveBtn: document.getElementById('saveBtn'),
  status: document.getElementById('status'),
};

const STORAGE_DEFAULTS = {
  provider: 'openai',
  apiKeys: {},
  models: {},
  customBaseUrls: {},
  customPrompt: '',
  apiKey: '',
  model: '',
  customBaseUrl: '',
};

const state = {
  provider: 'openai',
  apiKeys: {},
  models: {},
  customBaseUrls: {},
  customPrompt: '',
};

let modelCache = {};
let manualMode = false;
let autoFetchTimer = null;

(async function init() {
  populateProviders();
  const [raw, cacheStore] = await Promise.all([
    chrome.storage.sync.get(STORAGE_DEFAULTS),
    chrome.storage.local.get({ modelCache: {} }),
  ]);
  modelCache = cacheStore.modelCache || {};

  const migrated = migrateLegacySettings(raw);
  Object.assign(state, migrated);

  if (!(state.provider in AI_PROVIDERS)) state.provider = 'openai';
  els.provider.value = state.provider;
  els.customPrompt.value = state.customPrompt;

  loadProviderIntoUI(state.provider);

  if (raw.apiKey || raw.model || raw.customBaseUrl) {
    await chrome.storage.sync.remove(['apiKey', 'model', 'customBaseUrl']);
    await persistAll();
  }
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

function loadProviderIntoUI(providerKey) {
  const cfg = AI_PROVIDERS[providerKey];
  if (!cfg) return;
  const conf = resolveProviderConfig(state, providerKey);

  els.apiKeyLabel.textContent = cfg.apiKeyLabel;
  els.apiKey.placeholder = cfg.apiKeyPlaceholder;
  els.apiKey.value = conf.apiKey;

  if (cfg.apiKeyUrl) {
    els.apiKeyHelp.href = cfg.apiKeyUrl;
    els.apiKeyHelp.style.display = 'inline';
  } else {
    els.apiKeyHelp.style.display = 'none';
  }

  els.customBaseUrl.value = conf.customBaseUrl || cfg.baseUrl;
  els.customBaseUrl.placeholder = cfg.baseUrl || '请输入 baseUrl';
  els.baseUrlMeta.textContent = cfg.requireBaseUrl
    ? '⚠️ 请填写完整 baseUrl'
    : '自动拼接 ' + (cfg.chatPath || '/chat/completions') + ' 与 ' + (cfg.modelsPath || '（不支持列模型）');

  const cached = modelCache[providerKey];
  const list = cached?.models?.length ? cached.models : (cfg.defaultModels || []);
  renderModels(list, conf.model || cfg.defaultModel);

  if (cached?.fetchedAt) {
    els.modelMeta.textContent = '已加载 ' + cached.models.length + ' 个模型 · ' + new Date(cached.fetchedAt).toLocaleString();
    els.modelMeta.className = 'meta ok';
  } else {
    els.modelMeta.textContent = cfg.modelsPath ? '点击 🔄 拉取最新模型列表' : '该供应商不支持自动获取，请手动输入';
    els.modelMeta.className = 'meta';
  }

  els.fetchBtn.disabled = !cfg.modelsPath;
  if (manualMode) setManualMode(false);
}

function captureUIIntoState() {
  const provider = state.provider;
  const apiKey = els.apiKey.value.trim();
  const model = getCurrentModel();
  const customBaseUrl = els.customBaseUrl.value.trim();

  if (apiKey) state.apiKeys[provider] = apiKey;
  else delete state.apiKeys[provider];

  if (model) {
    state.models[provider] = model;
    rememberModel(provider, model);
  }

  if (customBaseUrl && customBaseUrl !== AI_PROVIDERS[provider]?.baseUrl) {
    state.customBaseUrls[provider] = customBaseUrl;
  } else {
    delete state.customBaseUrls[provider];
  }

  state.customPrompt = els.customPrompt.value.trim();
}

function rememberModel(provider, model) {
  if (!model) return;
  const cfg = AI_PROVIDERS[provider];
  let cached = modelCache[provider];
  if (!cached) {
    cached = { models: [...(cfg?.defaultModels || [])], fetchedAt: 0 };
    modelCache[provider] = cached;
  }
  if (!cached.models.includes(model)) {
    cached.models = [...cached.models, model].sort();
    chrome.storage.local.set({ modelCache }).catch(() => {});
    if (state.provider === provider) {
      const all = cached.models;
      const hasInDom = [...els.modelSelect.options].some(o => o.value === model);
      if (!hasInDom) {
        const opt = document.createElement('option');
        opt.value = model;
        opt.textContent = model;
        els.modelSelect.appendChild(opt);
        els.modelCount.textContent = '(' + all.length + ')';
      }
    }
  }
}

async function persistAll() {
  captureUIIntoState();
  await chrome.storage.sync.set({
    provider: state.provider,
    apiKeys: state.apiKeys,
    models: state.models,
    customBaseUrls: state.customBaseUrls,
    customPrompt: state.customPrompt,
  });
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
  if (manualMode) els.modelInput.value = target;
}

function getCurrentModel() {
  return manualMode ? els.modelInput.value.trim() : els.modelSelect.value;
}

function setManualMode(on) {
  if (manualMode === on) return;
  manualMode = on;
  document.getElementById('modelRow').classList.toggle('manual', on);
  if (on) {
    els.modelInput.value = els.modelSelect.value;
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
    els.modelToggleBtn.textContent = '✏️';
    els.modelToggleBtn.title = '切换到手动输入';
    els.modelToggleBtn.classList.remove('active');
  }
  persistAll();
}

els.provider.addEventListener('change', async () => {
  captureUIIntoState();
  state.provider = els.provider.value;
  loadProviderIntoUI(state.provider);
  await persistAll();
  scheduleAutoFetch();
});

els.customBaseUrl.addEventListener('blur', () => persistAll());
els.customBaseUrl.addEventListener('input', () => scheduleAutoFetch());

els.resetBaseUrl.addEventListener('click', async (e) => {
  e.preventDefault();
  const cfg = AI_PROVIDERS[state.provider];
  els.customBaseUrl.value = cfg.baseUrl;
  await persistAll();
  scheduleAutoFetch();
});

els.apiKey.addEventListener('input', () => scheduleAutoFetch());
els.apiKey.addEventListener('blur', () => persistAll());

els.modelSelect.addEventListener('change', () => persistAll());
els.modelInput.addEventListener('input', () => {
  if (manualMode) persistAll();
});

els.customPrompt.addEventListener('blur', () => persistAll());

els.modelToggleBtn.addEventListener('click', () => setManualMode(!manualMode));

els.toggleKeyBtn.addEventListener('click', () => {
  const isHidden = els.apiKey.type === 'password';
  els.apiKey.type = isHidden ? 'text' : 'password';
  els.toggleKeyBtn.textContent = isHidden ? '🙈' : '👁';
  els.toggleKeyBtn.title = isHidden ? '隐藏' : '显示';
});

els.fetchBtn.addEventListener('click', () => fetchModels(false));

els.verifyBtn.addEventListener('click', () => verifyModel(false));

els.saveBtn.addEventListener('click', async () => {
  const provider = state.provider;
  const cfg = AI_PROVIDERS[provider];
  const apiKey = els.apiKey.value.trim();
  const model = getCurrentModel();
  const customBaseUrl = els.customBaseUrl.value.trim();

  if (!apiKey && !cfg.keyOptional) return showStatus('请输入 API Key', 'error');
  if (!customBaseUrl) return showStatus('请输入 API 地址', 'error');
  if (!model) return showStatus('请选择或输入模型 ID', 'error');

  await persistAll();
  showStatus('✅ 设置已保存（' + cfg.label + '）', 'success');
});

function scheduleAutoFetch() {
  clearTimeout(autoFetchTimer);
  const cfg = AI_PROVIDERS[state.provider];
  if (!cfg?.modelsPath) return;
  const key = els.apiKey.value.trim();
  if (!key && !cfg.keyOptional) return;
  if (!els.customBaseUrl.value.trim()) return;
  autoFetchTimer = setTimeout(() => fetchModels(true), 1000);
}

async function fetchModels(silent) {
  const provider = state.provider;
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

    if (state.provider !== provider) return;

    modelCache[provider] = { models, fetchedAt: Date.now() };
    await chrome.storage.local.set({ modelCache });

    const previous = getCurrentModel();
    renderModels(models, models.includes(previous) ? previous : (cfg.defaultModel || models[0]));
    await persistAll();

    els.modelMeta.textContent = '已加载 ' + models.length + ' 个模型 · ' + new Date().toLocaleString();
    els.modelMeta.className = 'meta ok';
    showStatus('✅ 已获取 ' + models.length + ' 个模型，可在下拉框中选择', 'success');
  } catch (err) {
    if (state.provider === provider) {
      showStatus('❌ 获取失败：' + err.message, 'error');
      els.modelMeta.textContent = '获取失败，可点击 ✏️ 手动输入模型 ID';
      els.modelMeta.className = 'meta err';
    }
  } finally {
    if (state.provider === provider) {
      els.fetchBtn.disabled = !AI_PROVIDERS[provider]?.modelsPath;
      els.fetchBtn.textContent = '🔄';
    }
  }
}

function showStatus(msg, type) {
  els.status.textContent = msg;
  els.status.className = 'status ' + type;
  if (type === 'success' || type === 'error') {
    setTimeout(() => {
      els.status.className = 'status';
      els.status.textContent = '';
    }, 3500);
  }
}

async function verifyModel(silent) {
  const provider = state.provider;
  const cfg = AI_PROVIDERS[provider];
  const apiKey = els.apiKey.value.trim();
  const model = getCurrentModel();
  const customBaseUrl = els.customBaseUrl.value.trim();

  if (!apiKey && !cfg.keyOptional) {
    if (!silent) showStatus('请先填写 API Key', 'error');
    return;
  }
  if (!customBaseUrl) {
    if (!silent) showStatus('请先填写 API 地址', 'error');
    return;
  }
  if (!model) {
    if (!silent) showStatus('请先选择或输入模型', 'error');
    return;
  }

  els.verifyBtn.disabled = true;
  els.verifyBtn.textContent = '…';
  if (!silent) showStatus('正在验证 ' + cfg.label + ' / ' + model + ' …', 'info');

  try {
    const resp = await chrome.runtime.sendMessage({
      type: 'AI_VERIFY_MODEL',
      payload: { provider, apiKey, model, customBaseUrl },
    });
    if (!resp?.ok) throw new Error(resp?.error || '未知错误');
    els.modelMeta.textContent = '✓ ' + model + ' 可用 · ' + cfg.label;
    els.modelMeta.className = 'meta ok';
    showStatus('✅ ' + cfg.label + ' / ' + model + ' 验证通过', 'success');
  } catch (err) {
    els.modelMeta.textContent = '✗ ' + (err.message || '不可用') + ' · ' + model;
    els.modelMeta.className = 'meta err';
    showStatus('❌ 验证失败：' + (err.message || '未知错误'), 'error');
  } finally {
    els.verifyBtn.disabled = false;
    els.verifyBtn.textContent = '✓';
  }
}
