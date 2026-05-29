# Text AI Assistant

选中文本，右键调用 AI 进行总结、翻译、解释等处理。支持 OpenAI、DeepSeek、MiniMax 三家供应商。

## 功能

- **📝 总结** —— 用中文总结选中内容的核心要点
- **🌐 翻译成中文** —— 将选中内容翻译为中文
- **💡 解释说明** —— 用通俗语言解释复杂内容
- **⚡ 自定义提示词** —— 你可以在设置中自定义提示词模板

## 支持的供应商

| 供应商 | API 地址 | 默认模型 |
|--------|----------|----------|
| OpenAI | `api.openai.com` | gpt-4o-mini |
| DeepSeek | `api.deepseek.com` | deepseek-chat |
| MiniMax | `api.minimaxi.com` | MiniMax-Text-01 |

支持自定义 API 地址，可接入任何兼容 OpenAI 格式的 API。

## 安装

1. 打开 Chrome，进入 `chrome://extensions/`
2. 开启"开发者模式"（右上角）
3. 点击"加载已解压的扩展程序"
4. 选择本项目中的 `chrome-ai-assistant/` 目录

## 使用

1. 点击扩展图标，选择供应商并填入 API Key，保存设置
2. 在任意页面选中文本
3. 右键 → **AI 助手** → 选择操作
4. 结果以浮动面板展示在页面右下角，支持拖拽和复制

## 隐私

API Key 仅存储在本地浏览器的 `chrome.storage.sync` 中，不会发送到第三方服务器（除你配置的 AI API 本身外）。
