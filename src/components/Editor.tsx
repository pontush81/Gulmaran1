import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Strike from '@tiptap/extension-strike';
import Underline from '@tiptap/extension-underline';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import Heading from '@tiptap/extension-heading';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import History from '@tiptap/extension-history';
import { 
  Bold as BoldIcon, 
  Italic as ItalicIcon, 
  Underline as UnderlineIcon,
  Strikethrough as StrikeIcon,
  List as ListIcon,
  ListOrdered as ListOrderedIcon,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo
} from 'lucide-react';
import { cn } from '../lib/utils';

interface EditorProps {
  content: string;
  onChange: (content: string) => void;
  className?: string;
}

export function Editor({ content, onChange, className }: EditorProps) {
  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      Bold,
      Italic,
      Strike,
      Underline,
      BulletList,
      OrderedList,
      ListItem,
      Heading.configure({
        levels: [1, 2, 3],
      }),
      Link.configure({
        openOnClick: false,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      History,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    autofocus: 'end',
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none p-4 min-h-[calc(100vh-16rem)] focus:outline-none'
      }
    }
  });

  // Ensure editor is focused when mounted
  React.useEffect(() => {
    if (editor && !editor.isFocused) {
      editor.commands.focus('end');
    }
  }, [editor]);

  if (!editor) {
    return null;
  }

  const ToolbarButton = ({ 
    isActive, 
    onClick, 
    children,
    title
  }: { 
    isActive?: boolean; 
    onClick: () => void; 
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      type="button"
      onMouseDown={(e) => {
        // Prevent default to maintain editor focus
        e.preventDefault();
        onClick();
      }}
      title={title}
      className={cn(
        "p-2 rounded-lg transition-colors",
        isActive 
          ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200" 
          : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
      )}
    >
      {children}
    </button>
  );

  const addLink = () => {
    const url = window.prompt('URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <div className={cn("bg-white dark:bg-gray-800 rounded-lg shadow-md", className)}>
      <div className="border-b border-gray-200 dark:border-gray-700 p-2">
        {/* Text style controls */}
        <div className="flex flex-wrap gap-1 mb-2">
          <ToolbarButton
            isActive={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Fet"
          >
            <BoldIcon className="w-5 h-5" />
          </ToolbarButton>
          <ToolbarButton
            isActive={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Kursiv"
          >
            <ItalicIcon className="w-5 h-5" />
          </ToolbarButton>
          <ToolbarButton
            isActive={editor.isActive('underline')}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            title="Understruken"
          >
            <UnderlineIcon className="w-5 h-5" />
          </ToolbarButton>
          <ToolbarButton
            isActive={editor.isActive('strike')}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            title="Genomstruken"
          >
            <StrikeIcon className="w-5 h-5" />
          </ToolbarButton>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
          <ToolbarButton
            isActive={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Punktlista"
          >
            <ListIcon className="w-5 h-5" />
          </ToolbarButton>
          <ToolbarButton
            isActive={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            title="Numrerad lista"
          >
            <ListOrderedIcon className="w-5 h-5" />
          </ToolbarButton>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
          <ToolbarButton
            isActive={editor.isActive('link')}
            onClick={addLink}
            title="Lägg till länk"
          >
            <LinkIcon className="w-5 h-5" />
          </ToolbarButton>
        </div>

        {/* Paragraph style controls */}
        <div className="flex flex-wrap gap-1">
          <ToolbarButton
            isActive={editor.isActive('heading', { level: 1 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            title="Rubrik 1"
          >
            <Heading1 className="w-5 h-5" />
          </ToolbarButton>
          <ToolbarButton
            isActive={editor.isActive('heading', { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            title="Rubrik 2"
          >
            <Heading2 className="w-5 h-5" />
          </ToolbarButton>
          <ToolbarButton
            isActive={editor.isActive('heading', { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            title="Rubrik 3"
          >
            <Heading3 className="w-5 h-5" />
          </ToolbarButton>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
          <ToolbarButton
            isActive={editor.isActive({ textAlign: 'left' })}
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            title="Vänsterjustera"
          >
            <AlignLeft className="w-5 h-5" />
          </ToolbarButton>
          <ToolbarButton
            isActive={editor.isActive({ textAlign: 'center' })}
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            title="Centrera"
          >
            <AlignCenter className="w-5 h-5" />
          </ToolbarButton>
          <ToolbarButton
            isActive={editor.isActive({ textAlign: 'right' })}
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            title="Högerjustera"
          >
            <AlignRight className="w-5 h-5" />
          </ToolbarButton>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            title="Ångra"
          >
            <Undo className="w-5 h-5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            title="Gör om"
          >
            <Redo className="w-5 h-5" />
          </ToolbarButton>
        </div>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}