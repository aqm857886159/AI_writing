# 产品制造文本编辑器（React + TipTap + Orchestration）

围绕“作者心流”的智能写作工作台：中栏稳定的 TipTap 编辑器，左右为 AI 批判面板与创作工具箱，下方为知识图谱。内置 Yjs+IndexedDB 单机协同、引用优先的对话栏、以及可编排的多模型调用管线。

## 快速开始

```bash
npm i
npm run dev
```

DeepSeek API 通过本地代理 `/llm/v1/chat/completions`，密钥在 `vite.config.js` 中由开发服务器注入。

## 功能总览
- 中栏编辑器（TipTap）：标题/列表/引用、字符统计、Yjs 协同、工具栏分组、单一滚动源。
- 左侧批判面板（CriticPanel）：按章节（H2）生成苏格拉底式 Q/Why，持久化与调度节流。
- 右侧创作工具箱（Toolbox）：
  - 选区气泡“引用”→右侧对话栏；显式引用置顶，可清空；输入框 Enter 发送。
  - AI 回复 Markdown 渲染，可复制；默认不改正文。
- 知识图谱（Cytoscape）：实体/关系抽取、去重合并、布局与就地工具（重布局/缩放/居中）。
- 模型编排（Orchestration）：统一路由与调用器，按任务选择模型与参数，失败自动降级。

## 目录结构（关键文件）
```text
src/
  App.jsx                         # 三栏+下方图谱的总体布局（中栏粘性、左右独立拖动）
  components/
    Editor.jsx                   # TipTap 编辑器 + 选区气泡“引用”
    ToolboxPanel.jsx             # 对话栏（引用区、输入框、Markdown 渲染）
    CriticPanel.jsx              # 章节批判 Q/Why
    KnowledgeGraphPanel.jsx      # 图谱画布与就地工具条
  hooks/                         # useDocSnapshot/useSections/useKnowledgeGraph
  kg/
    llmAdapter.js                # KG 抽取（已接入编排管线）
    buildKGPrompt.js             # 抽取提示词构造
  services/
    DocumentService.js           # Yjs + IndexedDB 离线优先
    ChatStore.js                 # 对话消息本地持久化
    ToolboxBus.js                # “引用”事件总线
    ChatService.js               # 对话消息组装（引用优先）→ 路由 → 调用器
    CriticService.js             # 批判 Q/Why 调度与调用（reasoner→chat 回退）
    KnowledgeGraphService.js     # 图谱合并/去重/持久化
    ModelRegistry.js             # 任务→默认模型/参数表
    ModelRouter.js               # 路由器：根据任务/长度/是否 JSON 给出“调用计划”
    LLMAdapter.js                # 统一调用器：请求/重试/降级/超时
```

## 关键设计
### 1) 交互与布局
- 中栏“粘性范围（44–70%）”，左右各自拖动、可折叠；避免“拖左带右”。
- 单一滚动源：`main` 设 `overflow-hidden`，编辑器内部滚动；粘顶/粘底稳定。
- 图谱满屏 + 悬浮工具条，不遮挡画布事件。

### 2) 引用优先的对话
- 选区→“引用”→右栏：显式引用置顶（≤2000 字），窗口记忆（8–12 条）。
- 提示骨架：System（边界与格式）→ 引用 → 最近窗口 → 本次指令。
- 回复只在右栏，默认不改正文；Markdown 渲染，支持复制。

### 3) 模型编排管线
- 统一路由与调用器：
  - `ModelRegistry`：任务默认配置（chat/translate/summarize/outline/critic_qwhy/kg_extract_json）。
  - `ModelRouter`：根据任务/是否 JSON/是否流式/输入长度，输出调用计划（模型+温度+回退链）。
  - `LLMAdapter`：OpenAI 兼容请求、指数退避重试（429/5xx）、JSON 失败自动去约束重试、可接流式/停止（预留）。
- 任务映射：
  - chat/outline/summarize/translate → `deepseek-chat`（低温度，稳定输出）
  - critic_qwhy → `deepseek-reasoner`，失败回退 `deepseek-chat`
  - kg_extract_json → `deepseek-chat` + `response_format: json_object`，解析失败自动降级

### 4) 知识图谱抽取
- 分节抽取、同名合并、边去重、持久化；节点/边 schema 见 `kgSchema.js`。
- 抽取失败不崩：返回空结构，UI 仍可用。

## 开发与扩展
### 新增一个任务（示例：翻译）
1. 在 `ModelRegistry` 加默认配置：
```js
translate: { model: 'deepseek-chat', temperature: 0.2 }
```
2. 在业务服务里组装 messages：
```js
messages = [ { role:'system', content:'保留术语与格式' }, { role:'user', content:'请翻成英文:\n"""{text}"""' } ]
```
3. 通过路由：
```js
const plan = routeLLM({ kind:'translate', inputLen: text.length });
const out = await llmCall({ ...plan, messages });
```

### 配置覆盖
- 本地覆盖默认模型：
```js
localStorage.setItem('model:overrides', JSON.stringify({ chat:{ model:'deepseek-chat' } }))
```

## 运行与故障
- 代理：`vite.config.js` 注入 Authorization，请确保有效。
- 超时/失败：`LLMAdapter` 自动重试与降级；对话栏仍返回可读错误文案。
- 回滚：每次发布建议打 tag；可用 `git checkout <tag>` 回到稳定点。

## 许可证
- 业务代码保留版权；引用的开源库遵循各自许可证（react-markdown、remark-gfm、yjs、tiptap、cytoscape 等）。

---

建议先在右栏体验“引用→对话”，验证质量与稳定性，再逐步开启“流式/停止、摘要记忆”等增强项。
