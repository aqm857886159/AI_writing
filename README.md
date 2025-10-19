# 智能写作界面（React + TipTap）

简要说明仓库结构、每个文件的作用与本地运行方法。

## 快速开始

```bash
npm i
npm run dev
```

## 目录结构

```text
./
├─ package.json            # 项目依赖与脚本
├─ vite.config.js          # Vite 构建与开发服务器配置
├─ tailwind.config.js      # Tailwind 主题扩展与扫描范围
├─ postcss.config.js       # PostCSS 插件配置（Tailwind/Autoprefixer）
├─ index.html              # 入口 HTML，挂载点与字体加载
├─ src/
│  ├─ main.jsx             # React 入口，挂载 App 并引入全局样式
│  ├─ App.jsx              # 四区域布局：左/中/右 + 底部面板
│  ├─ index.css            # Tailwind 引入 + TipTap 自定义排版样式
│  └─ components/
│     └─ Editor.jsx        # TipTap 富文本编辑器与工具栏、字数统计
```

## 文件说明（简要）

- package.json
  - 定义依赖：React、TipTap、Tailwind、Lucide React 等
  - 脚本：`dev` 开发、`build` 构建、`preview` 预览

- vite.config.js
  - 启用 React 插件，提供热更新与打包配置

- tailwind.config.js
  - 扫描路径：`index.html` 与 `src/**/*`
  - 主题扩展：颜色（主题蓝/纸张白/面板灰等）、字体（衬线）、阴影

- postcss.config.js
  - 启用 `tailwindcss` 与 `autoprefixer`

- index.html
  - 页面挂载点 `#root`
  - 预连接并加载 "Merriweather" 字体
  - 设置桌面最小宽度布局基线

- src/main.jsx
  - React 入口：创建根节点并渲染 `App`
  - 引入全局样式 `index.css`

- src/App.jsx
  - 实现四区布局：
    - 左侧：批判者视角（占位）
    - 中央：固定 720px 宽的 TipTap 编辑器（视觉中心）
    - 右侧：创作工具箱（占位）
    - 底部：知识图谱（固定高度面板）

- src/components/Editor.jsx
  - TipTap 富文本编辑器：H1/H2/H3、粗体、斜体、引用、无序/有序列表
  - 占位符：「开始书写你的想法...」
  - 工具栏：sticky + 半透明 + 分组分隔线（Lucide 图标）
  - 字数统计：右下角实时统计（CharacterCount）
  - 排版：纸张白、行高 1.8、段间距 1.5em、左右 80px 内边距

- src/index.css
  - 引入 Tailwind 基础层
  - TipTap 内容样式（选区色、光标色、标题层级、列表、引用）

## 常用脚本

- `npm run dev`：本地开发（默认 `http://localhost:5173`）
- `npm run build`：生产构建
- `npm run preview`：预览构建产物
