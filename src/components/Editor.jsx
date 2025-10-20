import React, { useMemo } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
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
import { pushQuote } from '../services/ToolboxBus.js';

const ToolbarButton = ({ onClick, active, disabled, title, children }) => (
  <button
    type="button"
    title={title}
    aria-label={title}
    aria-pressed={!!active}
    onClick={onClick}
    disabled={disabled}
    className={clsx(
      'inline-flex items-center justify-center h-10 w-10 rounded-[var(--radius-default)]',
      'text-text-secondary hover:text-text-primary',
      'disabled:opacity-40 disabled:cursor-not-allowed',
      active ? 'bg-brand-50 text-brand-600 ring-1 ring-brand-200' : 'bg-transparent',
      'transition-colors duration-[var(--transition-duration-fast)]',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-500'
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
    // TipTap 2025 性能优化：禁用每次 transaction 的重渲染
    shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: {
        class:
          'editor-content font-serif text-lg leading-loose text-text-primary ' +
          'selection:bg-select caret-brand-500 ' +
          'max-w-[760px] mx-auto py-14 px-16 ' +
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
      <div className="sticky top-0 z-[var(--z-sticky)] -mt-2 mb-10">
        <div className="mx-auto max-w-[760px] flex items-center gap-2 rounded-[var(--radius-lg)] px-2 py-1.5 bg-white/60 backdrop-blur-xl border border-border-light/70">
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
      <div className="bg-paper rounded-[var(--radius-xl)] border border-border-light shadow-[var(--shadow-editor)] transition-shadow duration-[var(--transition-duration-base)] ease-out hover:shadow-[var(--shadow-lg)]">
        {/* 固定高度的内部滚动容器，初始渲染即不扩展外层 */}
        <div className="relative h-[64vh] overflow-y-auto">
          {editor && (
            <BubbleMenu editor={editor} tippyOptions={{ duration: 120 }}>
              <button
                type="button"
                className="h-8 px-2 text-xs rounded-[var(--radius-default)] border border-border-light bg-white/90 hover:bg-white transition-colors"
                onClick={() => {
                  try {
                    const { from, to } = editor.state.selection;
                    const text = from < to ? editor.state.doc.textBetween(from, to, '\n') : '';
                    pushQuote(text);
                  } catch (_) {}
                }}
              >
                引用
              </button>
            </BubbleMenu>
          )}
          <EditorContent editor={editor} />
          {/* 底部 sticky 的计数条：不遮挡内容，随滚动容器永远贴底 */}
          <div className="sticky bottom-0 flex justify-end">
            <span className="m-2 px-2 py-0.5 text-xs text-text-secondary bg-white/80 backdrop-blur rounded-[var(--radius-sm)]">
              {chars} 字
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}


