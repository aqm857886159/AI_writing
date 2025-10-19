import React, { useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Collaboration from '@tiptap/extension-collaboration';
import { getYDoc, emitSnapshot } from '../services/DocumentService.js';
import CharacterCount from '@tiptap/extension-character-count';
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote
} from 'lucide-react';
import clsx from 'clsx';

const ToolbarButton = ({ onClick, active, disabled, title, children }) => (
  <button
    type="button"
    title={title}
    aria-label={title}
    onClick={onClick}
    disabled={disabled}
    className={clsx(
      'inline-flex items-center justify-center h-9 w-9 rounded-md transition-colors duration-200 ease-out',
      'text-[#6B7280] hover:text-brand',
      'disabled:opacity-40 disabled:cursor-not-allowed',
      active && 'text-brand bg-white/60'
    )}
  >
    {children}
  </button>
);

export default function Editor() {
  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        blockquote: true,
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
        history: false
      }),
      Placeholder.configure({
        placeholder: '开始书写你的想法...',
        includeChildren: true
      }),
      CharacterCount.configure(),
      Collaboration.configure({
        document: getYDoc(),
        field: 'content'
      })
    ],
    []
  );

  const editor = useEditor({
    extensions,
    editorProps: {
      attributes: {
        class:
          'editor-content font-serif text-[18px] leading-[1.8] text-textMain ' +
          'selection:bg-select caret-brand ' +
          // 扩大可编辑区域：宽度提升至 760px，左右内边距从 80px 降至 64px
          'max-w-[760px] mx-auto py-[56px] px-[64px] ' +
          'transition-colors duration-200 ease-out'
      }
    },
    onUpdate: ({ editor }) => {
      try {
        emitSnapshot({ json: editor.getJSON(), text: editor.getText() });
      } catch (_) {}
    }
  });

  const chars = editor?.storage?.characterCount?.characters?.() ?? 0;

  return (
    <div
      className="relative w-[min(860px,calc(100vw-48px))]"
    >
      {/* 工具栏（粘顶，半透明、blur） */}
      <div className="sticky top-0 z-20 -mt-2 mb-10">
        <div
          className="mx-auto max-w-[760px] flex items-center gap-2 rounded-lg px-2 py-1.5"
          style={{
            background: 'rgba(255, 255, 255, 0.6)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(209,213,219,0.7)'
          }}
        >
          {/* 标题组 */}
          <ToolbarButton
            title="H1"
            active={editor?.isActive('heading', { level: 1 })}
            disabled={!editor?.can().chain().focus().toggleHeading({ level: 1 }).run()}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
          >
            <Heading1 size={18} />
          </ToolbarButton>
          <ToolbarButton
            title="H2"
            active={editor?.isActive('heading', { level: 2 })}
            disabled={!editor?.can().chain().focus().toggleHeading({ level: 2 }).run()}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 size={18} />
          </ToolbarButton>
          <ToolbarButton
            title="H3"
            active={editor?.isActive('heading', { level: 3 })}
            disabled={!editor?.can().chain().focus().toggleHeading({ level: 3 }).run()}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            <Heading3 size={18} />
          </ToolbarButton>

          {/* 分隔线 */}
          <div className="h-6 w-px bg-divider mx-1" />

          {/* 基础格式 */}
          <ToolbarButton
            title="粗体"
            active={editor?.isActive('bold')}
            disabled={!editor?.can().chain().focus().toggleBold().run()}
            onClick={() => editor?.chain().focus().toggleBold().run()}
          >
            <Bold size={18} />
          </ToolbarButton>
          <ToolbarButton
            title="斜体"
            active={editor?.isActive('italic')}
            disabled={!editor?.can().chain().focus().toggleItalic().run()}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          >
            <Italic size={18} />
          </ToolbarButton>

          {/* 分隔线 */}
          <div className="h-6 w-px bg-divider mx-1" />

          {/* 结构 */}
          <ToolbarButton
            title="无序列表"
            active={editor?.isActive('bulletList')}
            disabled={!editor?.can().chain().focus().toggleBulletList().run()}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          >
            <List size={18} />
          </ToolbarButton>
          <ToolbarButton
            title="有序列表"
            active={editor?.isActive('orderedList')}
            disabled={!editor?.can().chain().focus().toggleOrderedList().run()}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered size={18} />
          </ToolbarButton>
          <ToolbarButton
            title="引用"
            active={editor?.isActive('blockquote')}
            disabled={!editor?.can().chain().focus().toggleBlockquote().run()}
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          >
            <Quote size={18} />
          </ToolbarButton>
        </div>
      </div>

      {/* 编辑器卡片（纸张白+阴影+边框） */}
      <div className="bg-paper rounded-xl border border-borderLight shadow-editor transition-shadow duration-200 ease-out hover:shadow-lg">
        {/* 固定高度的内部滚动容器，初始渲染即不扩展外层 */}
        <div className="relative h-[64vh] overflow-y-auto">
          <EditorContent editor={editor} />
          {/* 底部 sticky 的计数条：不遮挡内容，随滚动容器永远贴底 */}
          <div className="sticky bottom-0 flex justify-end">
            <span className="m-2 px-2 py-0.5 text-xs text-textSecondary bg-white/80 backdrop-blur rounded">
              {chars} 字
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}


