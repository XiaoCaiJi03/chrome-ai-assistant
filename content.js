(function () {
  if (document.getElementById('ai-assistant-root')) return;

  const root = document.createElement('div');
  root.id = 'ai-assistant-root';
  root.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = `
    :host { all: initial; }
    .ai-overlay {
      position: fixed; bottom: 24px; right: 24px; z-index: 2147483647;
      width: 440px;
      height: min(560px, calc(100vh - 48px));
      background: rgba(30, 30, 46, 0.85);
      backdrop-filter: blur(22px) saturate(180%);
      -webkit-backdrop-filter: blur(22px) saturate(180%);
      color: #cdd6f4;
      border-radius: 12px;
      padding: 0;
      font: 14px/1.7 -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      box-shadow: 0 12px 40px rgba(0,0,0,0.5);
      border: 1px solid rgba(203, 166, 247, 0.15);
      display: none;
      flex-direction: column;
      overflow: hidden;
    }
    .ai-header {
      flex: 0 0 auto;
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 16px;
      background: rgba(24, 24, 37, 0.65);
      border-bottom: 1px solid rgba(203, 166, 247, 0.12);
      cursor: move; user-select: none;
      z-index: 1;
    }
    .ai-header-title {
      font-weight: 600; font-size: 13px; color: #cba6f7;
      display: inline-flex; align-items: center; gap: 8px;
    }
    .ai-header-title::before {
      content: ''; width: 6px; height: 6px; border-radius: 50%;
      background: #cba6f7; box-shadow: 0 0 8px #cba6f7;
      animation: ai-pulse 2.4s ease-in-out infinite;
    }
    @keyframes ai-pulse {
      0%, 100% { opacity: 0.4; transform: scale(0.85); }
      50% { opacity: 1; transform: scale(1.1); }
    }
    .ai-close {
      border: none; background: none; color: #6c7086;
      cursor: pointer; font-size: 18px; padding: 0 4px;
      line-height: 1;
      transition: color 0.15s;
    }
    .ai-close:hover { color: #f38ba8; }
    .ai-body {
      flex: 1 1 auto;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 16px;
      scrollbar-width: thin;
      scrollbar-color: rgba(203, 166, 247, 0.3) transparent;
    }
    .ai-body::-webkit-scrollbar { width: 6px; }
    .ai-body::-webkit-scrollbar-track { background: transparent; }
    .ai-body::-webkit-scrollbar-thumb {
      background: rgba(203, 166, 247, 0.25);
      border-radius: 3px;
    }
    .ai-body::-webkit-scrollbar-thumb:hover { background: rgba(203, 166, 247, 0.45); }
    .ai-loading {
      display: flex; align-items: center; gap: 10px;
      color: #a6adc8;
    }
    .ai-spinner {
      width: 16px; height: 16px;
      border: 2px solid #313244; border-top-color: #cba6f7;
      border-radius: 50%; animation: ai-spin 0.8s linear infinite;
    }
    @keyframes ai-spin { to { transform: rotate(360deg); } }
    .ai-result { white-space: pre-wrap; word-break: break-word; }
    .ai-error { color: #f38ba8; }
    .ai-footer {
      flex: 0 0 auto;
      padding: 8px 16px;
      border-top: 1px solid rgba(203, 166, 247, 0.12);
      background: rgba(24, 24, 37, 0.65);
      display: flex; gap: 8px; justify-content: flex-end;
    }
    .ai-btn {
      border: none; border-radius: 6px; padding: 4px 12px;
      font-size: 12px; cursor: pointer;
      background: #313244; color: #cdd6f4;
      transition: background 0.15s, filter 0.15s;
    }
    .ai-btn:hover { background: #45475a; }
    .ai-btn-copy { background: #a6e3a1; color: #1e1e2e; }
    .ai-btn-copy:hover { background: #b8e6b8; }
  `;
  root.shadowRoot.appendChild(style);

  const overlay = document.createElement('div');
  overlay.className = 'ai-overlay';
  overlay.style.display = 'none';
  root.shadowRoot.appendChild(overlay);
  document.body.appendChild(root);

  let isDragging = false, startX, startY, origRect;

  function showLoading() {
    overlay.innerHTML = `
      <div class="ai-header">
        <span class="ai-header-title">AI 助手</span>
        <button class="ai-close" id="aiCloseBtn">✕</button>
      </div>
      <div class="ai-body">
        <div class="ai-loading">
          <div class="ai-spinner"></div>
          <span>AI 思考中...</span>
        </div>
      </div>
    `;
    overlay.style.display = 'flex';
    bindHeaderEvents();
    bindClose();
  }

  function showResult(content) {
    overlay.innerHTML = `
      <div class="ai-header">
        <span class="ai-header-title">AI 助手</span>
        <button class="ai-close" id="aiCloseBtn">✕</button>
      </div>
      <div class="ai-body">
        <div class="ai-result">${escapeHtml(content)}</div>
      </div>
      <div class="ai-footer">
        <button class="ai-btn ai-btn-copy" id="aiCopyBtn">复制</button>
        <button class="ai-btn" id="aiCloseBtn2">关闭</button>
      </div>
    `;
    overlay.style.display = 'flex';
    bindHeaderEvents();
    bindClose();
    const copyBtn = overlay.querySelector('#aiCopyBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(content);
          copyBtn.textContent = '✓ 已复制';
          setTimeout(() => { copyBtn.textContent = '复制'; }, 2000);
        } catch {}
      });
    }
  }

  function showError(msg) {
    overlay.innerHTML = `
      <div class="ai-header">
        <span class="ai-header-title">AI 助手</span>
        <button class="ai-close" id="aiCloseBtn">✕</button>
      </div>
      <div class="ai-body">
        <div class="ai-error">❌ ${escapeHtml(msg)}</div>
      </div>
      <div class="ai-footer">
        <button class="ai-btn" id="aiCloseBtn2">关闭</button>
      </div>
    `;
    overlay.style.display = 'flex';
    bindHeaderEvents();
    bindClose();
  }

  function bindHeaderEvents() {
    const header = overlay.querySelector('.ai-header');
    if (!header) return;
    header.addEventListener('mousedown', (e) => {
      if (e.target.closest('button')) return;
      isDragging = true;
      const rect = overlay.getBoundingClientRect();
      origRect = { left: rect.left, top: rect.top };
      startX = e.clientX; startY = e.clientY;
      overlay.style.left = origRect.left + 'px';
      overlay.style.top = origRect.top + 'px';
      overlay.style.right = 'auto';
      overlay.style.bottom = 'auto';
    });
  }

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    overlay.style.left = (origRect.left + e.clientX - startX) + 'px';
    overlay.style.top = (origRect.top + e.clientY - startY) + 'px';
  });

  document.addEventListener('mouseup', () => { isDragging = false; });

  function bindClose() {
    const btns = overlay.querySelectorAll('[id^="aiCloseBtn"]');
    btns.forEach(btn => btn.addEventListener('click', () => {
      overlay.style.display = 'none';
    }));
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'AI_LOADING') showLoading();
    else if (msg.type === 'AI_RESULT') showResult(msg.result);
    else if (msg.type === 'AI_ERROR') showError(msg.error);
    else if (msg.type === 'AI_PING') {} // keep alive check
  });
})();
