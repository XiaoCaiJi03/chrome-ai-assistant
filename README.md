# Text AI Assistant

> 选中文本，右键调用 AI 完成总结、翻译、解释等任务。  
> 支持 **15+ AI 供应商**，每家 Key / 模型 / 地址独立保存，开箱即用，可拉取最新模型列表。

## 功能

| 右键菜单 | 作用 |
|----------|------|
| 📝 总结 | 用中文总结选中内容要点 |
| 🌐 翻译成中文 | 翻译为中文 |
| 💡 解释说明 | 用通俗语言解释 |
| ⚡ 自定义提示词 | 使用你在设置里填的模板 |

设置面板还提供：

- **🔄 一键拉取模型列表** —— 从供应商拉取最新可用模型，自动填充下拉
- **✏️ 手动输入模型 ID** —— 切换到文本输入，支持任意未列出的模型
- **✓ 验证模型** —— 用当前 Key + 当前模型发一个最小请求，3 秒内告诉你是否可用
- **👁 显示/隐藏 API Key** —— 一键切换明文
- **API 地址可恢复默认** —— 自定义后想回到官方地址一键还原
- **自动保存** —— 切换供应商、选模型、编辑地址/Key 都会立即写入本地存储
- **暗色玻璃 UI** —— 毛玻璃、阴影、动画滚动条
- **结果浮窗** —— 右下角弹出，可拖拽、可复制、可关闭

## 支持的供应商

| 供应商 | baseUrl | 默认模型 | 备注 |
|--------|---------|----------|------|
| OpenAI | `api.openai.com/v1` | `gpt-5-mini` | OpenAI 兼容 |
| Anthropic (Claude) | `api.anthropic.com/v1` | `claude-sonnet-4-5` | Messages API 协议 |
| Google Gemini | `generativelanguage.googleapis.com/v1beta/openai` | `gemini-2.5-flash` | OpenAI 兼容端点 |
| DeepSeek | `api.deepseek.com/v1` | `deepseek-v4-flash` | v3 系列将于 2026-07-24 弃用 |
| MiniMax (MiniMax) | `api.minimaxi.com/v1` | `MiniMax-M3` | OpenAI 兼容，启用 thinking 自适应 |
| Moonshot (Kimi) | `api.moonshot.cn/v1` | `kimi-k2-6` | |
| 智谱 GLM | `open.bigmodel.cn/api/paas/v4` | `glm-4.6` | |
| 通义千问 (DashScope) | `dashscope.aliyuncs.com/compatible-mode/v1` | `qwen3-flash` | 百炼兼容模式 |
| OpenRouter | `openrouter.ai/api/v1` | `openai/gpt-5-mini` | 聚合 100+ 模型 |
| Groq | `api.groq.com/openai/v1` | `llama-3.3-70b-versatile` | 极速推理 |
| Mistral AI | `api.mistral.ai/v1` | `mistral-small-latest` | |
| xAI (Grok) | `api.x.ai/v1` | `grok-4-fast-reasoning` | |
| Together AI | `api.together.xyz/v1` | `meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | |
| 硅基流动 (SiliconFlow) | `api.siliconflow.cn/v1` | `Qwen/Qwen3-235B-A22B-Instruct-2507` | 国内聚合 |
| Ollama (本地) | `http://localhost:11434/v1` | `llama3.3` | 不需要 Key |
| 自定义 (OpenAI 兼容) | 你填的 | 空 | 任何兼容 OpenAI Chat Completions 的服务 |

**每家供应商独立保存 Key / 模型 / API 地址**，切换不会互相覆盖。

## 安装

1. 打开 Chrome，进入 `chrome://extensions/`
2. 右上角开启**开发者模式**
3. 点**加载已解压的扩展程序** → 选 `chrome-ai-assistant/` 目录
4. 第一次会显示一行"已加载"，扩展图标出现在工具栏

> ⚠️ 修改代码后必须回到 `chrome://extensions` 重新点扩展卡片的 🔄 按钮。如果右上角图标位置异常，**先点"移除"再重新加载**能彻底清掉 service worker 缓存。

## 使用

### 第一次配置

1. 点击扩展图标打开设置面板
2. **AI 供应商**：选你要用的（OpenAI / DeepSeek / minimax / ...）
3. **API 地址**：自动填默认（也可改成代理 / 中转）
4. **API Key**：粘贴你的 Key
5. **模型**：点 **🔄 获取** 自动拉取最新模型；下拉选一个；或者点 **✏️** 手输 ID
6. 点 **✓** 验证 Key + 模型能用（避免右键后才报错）
7. 点 **保存设置**（其他操作都已经自动保存）

### 日常使用

1. 在任意网页选中文本
2. 右键 → **AI 助手** → 选动作（总结/翻译/解释/自定义）
3. 浮窗在页面右下角弹出，**头部固定可拖**，**中间是结果区可滚动**，**底部有复制/关闭**
4. 点 **复制** 把结果放进剪贴板

### 切换供应商

换供应商只要在设置里再选一次，Key / 模型 / 地址都是**该供应商独立保存的**。切回 OpenAI 你之前的 Key 自动恢复。

## 验证模型功能

设置面板的 **✓** 按钮会发一个最小化请求（`max_tokens: 50` + `temperature: 0`），告诉模型回答 "pong"。如果模型 ID 不存在、Key 无效、或余额不足，会在状态条显示具体错误信息。

为了避免带 thinking 模式的模型（M3 / DeepSeek v4 / Kimi）把全部 token 吃进思考块导致"返回为空"，这些供应商的验证会自动发送 `thinking: { type: 'disabled' }` 临时禁用思考。

## 自定义 API

如果你的服务是 OpenAI 兼容但不在列表里，选 **自定义 (OpenAI 兼容)**，然后填 baseUrl 即可（比如 `https://your-proxy.com/v1`）。**`/` 结尾可不写**，扩展会自动拼 `/chat/completions` 和 `/models`。

## 隐私

- API Key 保存在本地 `chrome.storage.sync`，同步到你登录的 Chrome 账号，**不会发到任何第三方**
- 与 AI API 的通信走**你自己配置的供应商**（或自定义 baseUrl）
- 本扩展**没有**任何远端统计、遥测、错误上报

## 故障排查

| 现象 | 原因 / 处理 |
|------|------------|
| 右键菜单没出现 | 在 `chrome://extensions` 重新加载扩展 |
| 获取模型失败 `Could not establish connection` | background.js 没起来，重载扩展；或 popup 控制台按 F12 看真实错误 |
| 验证失败 `API 返回为空` | 模型走了 thinking 模式挤掉全部 token。已自动处理，仍报说明模型本身响应慢，重试即可 |
| 浮窗 header 跟内容一起滚 | 已修：浮窗是 flex column，header 固定。仍出现请 `chrome://extensions` **先移除再重载** |
| popup 高度跳变 | 已锁死 660px。仍跳变说明在跑旧版本，看底部 build 时间戳确认 |
| 中文乱码 | 不要用 PowerShell 改含中文的 JS 文件，会双重编码 |

## 文件结构

```
chrome-ai-assistant/
├── manifest.json    # MV3 配置、权限、host_permissions
├── background.js    # service worker：右键菜单、AI 调用、消息路由
├── content.js       # 浮窗 UI（注入到页面，shadow DOM 隔离）
├── popup.html       # 设置面板布局（header / main / footer）
├── popup.js         # 设置面板逻辑、per-provider 存储、模型拉取
├── providers.js     # 供应商配置：baseUrl / 协议 / 默认模型
└── icons/           # 扩展图标
```

## License

MIT
