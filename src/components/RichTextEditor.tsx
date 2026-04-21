'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import 'react-quill/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
  loading: () => <div className="h-64 bg-slate-100 animate-pulse rounded-lg" />,
});

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  readOnly = false,
  placeholder = 'Start typing...',
}: RichTextEditorProps) {
  const modules = useMemo(
    () => ({
      toolbar: readOnly
        ? false
        : [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ color: [] }, { background: [] }],
            [{ list: 'ordered' }, { list: 'bullet' }],
            [{ align: [] }],
            ['link'],
            ['clean'],
          ],
    }),
    [readOnly]
  );

  const formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'color',
    'background',
    'list',
    'bullet',
    'align',
    'link',
  ];

  return (
    <div className={`rich-text-editor ${readOnly ? 'read-only' : ''}`}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        readOnly={readOnly}
        placeholder={placeholder}
      />
      <style jsx global>{`
        .rich-text-editor .ql-container {
          font-size: 14px;
          min-height: 400px;
        }
        .rich-text-editor .ql-editor {
          min-height: 400px;
        }
        .rich-text-editor.read-only .ql-container {
          border: none;
        }
        .rich-text-editor.read-only .ql-editor {
          padding: 0;
        }
        .rich-text-editor .ql-toolbar {
          border-radius: 8px 8px 0 0;
          background: #f8fafc;
        }
        .rich-text-editor .ql-container {
          border-radius: 0 0 8px 8px;
        }
      `}</style>
    </div>
  );
}
