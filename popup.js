const PROVIDER_CONFIG = {
  openai: {
    label: 'OpenAI API Key',
    placeholder: 'sk-...',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-nano', 'gpt-4.1-mini', 'o3-mini'],
    defaultModel: 'gpt-4o-mini',
  },
  deepseek: {
    label: 'DeepSeek API Key',
    placeholder: 'sk-...',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    defaultModel: 'deepseek-chat',
  },
  minimax: {
    label: 'MiniMax API Key（Group Token）',
    placeholder: '输入 MiniMax Group Token',
    models: ['MiniMax-Text-01', 'MiniMax-M2.5-7B'],
    defaultModel: 'MiniMax-Text-01',
  },
};

document.addEventListener('DOMContentLoaded', async () => {
  const settings = await chrome.storage.sync.get({
    provider: 'openai',
    apiKey: '',
    model: 'gpt-4o-mini',
    customPrompt: '',
    customBaseUrl: '',
  });

  document.getElementById('provider').value = settings.provider;
  document.getElementById('apiKey').value = settings.apiKey;
  document.getElementById('customPrompt').value = settings.customPrompt;
  document.getElementById('customBaseUrl').value = settings.customBaseUrl || '';

  updateProviderUI(settings.provider, settings.model);
});

document.getElementById('provider').addEventListener('change', (e) => {
  updateProviderUI(e.target.value);
});

function updateProviderUI(provider, selectedModel) {
  const config = PROVIDER_CONFIG[provider];

  document.getElementById('apiKeyLabel').textContent = config.label;
  document.getElementById('apiKey').placeholder = config.placeholder;

  const modelSelect = document.getElementById('model');
  modelSelect.innerHTML = '';
  config.models.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = m;
    if (m === (selectedModel || config.defaultModel)) opt.selected = true;
    modelSelect.appendChild(opt);
  });

  const customField = document.getElementById('customEndpointField');
  customField.style.display = provider === 'custom' ? 'block' : 'none';
}

document.getElementById('saveBtn').addEventListener('click', async () => {
  const provider = document.getElementById('provider').value;
  const apiKey = document.getElementById('apiKey').value.trim();
  const model = document.getElementById('model').value;
  const customPrompt = document.getElementById('customPrompt').value.trim();
  const customBaseUrl = document.getElementById('customBaseUrl').value.trim();

  if (!apiKey) {
    showStatus('请输入 API Key', 'error');
    return;
  }

  await chrome.storage.sync.set({ provider, apiKey, model, customPrompt, customBaseUrl });
  showStatus('✅ 设置已保存', 'success');
});

function showStatus(msg, type) {
  const el = document.getElementById('status');
  el.textContent = msg;
  el.className = 'status ' + type;
  setTimeout(() => { el.className = 'status'; }, 3000);
}
