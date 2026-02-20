import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import { Button } from '@/components/ui/button';
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    List,
    ListOrdered,
    Link as LinkIcon,
    AlignCenter,
    AlignLeft,
    AlignRight,
    Heading1,
    Heading2,
    Undo,
    Redo,
    Quote
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

const RichTextEditor = ({ value, onChange, placeholder = 'Введите текст...' }: RichTextEditorProps) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-primary underline cursor-pointer',
                },
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Image.configure({
                HTMLAttributes: {
                    class: 'rounded-lg max-w-full h-auto my-4',
                },
            }),
            Placeholder.configure({
                placeholder,
            }),
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose-base dark:prose-invert focus:outline-none min-h-[200px] max-w-none p-4',
            },
        },
    });

    // Update editor content when value changes externally (e.g. from import)
    React.useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value);
        }
    }, [value, editor]);

    if (!editor) {
        return null;
    }

    const addLink = () => {
        const url = window.prompt('Введите URL');
        if (url) {
            editor.chain().focus().setLink({ href: url }).run();
        }
    };

    return (
        <div className="border border-input rounded-md overflow-hidden bg-background focus-within:ring-1 focus-within:ring-ring">
            <div className="bg-muted/50 border-b border-input p-1 flex flex-wrap gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-8 w-8", editor.isActive('bold') && "bg-accent text-accent-foreground")}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    type="button"
                >
                    <Bold className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-8 w-8", editor.isActive('italic') && "bg-accent text-accent-foreground")}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    type="button"
                >
                    <Italic className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-8 w-8", editor.isActive('underline') && "bg-accent text-accent-foreground")}
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    type="button"
                >
                    <UnderlineIcon className="h-4 w-4" />
                </Button>

                <div className="w-px h-6 bg-border mx-1 my-auto" />

                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-8 w-8", editor.isActive('heading', { level: 1 }) && "bg-accent text-accent-foreground")}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    type="button"
                >
                    <Heading1 className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-8 w-8", editor.isActive('heading', { level: 2 }) && "bg-accent text-accent-foreground")}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    type="button"
                >
                    <Heading2 className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-8 w-8", editor.isActive('blockquote') && "bg-accent text-accent-foreground")}
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    type="button"
                >
                    <Quote className="h-4 w-4" />
                </Button>

                <div className="w-px h-6 bg-border mx-1 my-auto" />

                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-8 w-8", editor.isActive('bulletList') && "bg-accent text-accent-foreground")}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    type="button"
                >
                    <List className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-8 w-8", editor.isActive('orderedList') && "bg-accent text-accent-foreground")}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    type="button"
                >
                    <ListOrdered className="h-4 w-4" />
                </Button>

                <div className="w-px h-6 bg-border mx-1 my-auto" />

                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-8 w-8", editor.isActive({ textAlign: 'left' }) && "bg-accent text-accent-foreground")}
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                    type="button"
                >
                    <AlignLeft className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-8 w-8", editor.isActive({ textAlign: 'center' }) && "bg-accent text-accent-foreground")}
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                    type="button"
                >
                    <AlignCenter className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-8 w-8", editor.isActive({ textAlign: 'right' }) && "bg-accent text-accent-foreground")}
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                    type="button"
                >
                    <AlignRight className="h-4 w-4" />
                </Button>

                <div className="w-px h-6 bg-border mx-1 my-auto" />

                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-8 w-8", editor.isActive('link') && "bg-accent text-accent-foreground")}
                    onClick={addLink}
                    type="button"
                >
                    <LinkIcon className="h-4 w-4" />
                </Button>

                <div className="ml-auto flex gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => editor.chain().focus().undo().run()}
                        disabled={!editor.can().undo()}
                        type="button"
                    >
                        <Undo className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => editor.chain().focus().redo().run()}
                        disabled={!editor.can().redo()}
                        type="button"
                    >
                        <Redo className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            <EditorContent editor={editor} />
            <style>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror {
          outline: none;
        }
      `}</style>
        </div>
    );
};

export default RichTextEditor;
