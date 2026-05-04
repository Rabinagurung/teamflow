"use client"

import { EditorContent, useEditor } from "@tiptap/react"
import { editorExtensions } from "./extensions"
import MenuBar from "./MenuBar"
import { ReactNode } from "react"

interface RichTextEditorProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  field: any //field is used to control the editor
  sendButton: ReactNode
  footerLeft?: ReactNode
}

const RichTextEditor = ({
  field,
  sendButton,
  footerLeft,
}: RichTextEditorProps) => {
  const editor = useEditor({
    immediatelyRender: false, // Don't render immediately on the server to avoid SSR issues
    content: (() => {
      if (!field?.value) {
        return ""
      }
      /* tiptap return JSON -> convert to String -> store in DB.
       * field(String) form DB -> convert to JSON for tiptap to understand content
       */
      try {
        return JSON.parse(field.value)
      } catch {
        return ""
      }
    })(),

    onUpdate: ({ editor }) => {
      /** EditorContent generates content in JSON.
       * JSON -> convert to String -> store in Database
       */
      if (field?.onChange) {
        field.onChange(JSON.stringify(editor.getJSON()))
      }
    },

    extensions: editorExtensions,
    editorProps: {
      attributes: {
        class:
          "max-w-none min-h-[125px] focus:outline-none p-4 prose dark:prose-invert marker:text-primary ",
      },
    },
  })

  return (
    <div className="relative flex w-full flex-col overflow-hidden rounded-xl border border-input bg-card shadow-lg shadow-black/5 dark:shadow-black/25">
      <MenuBar editor={editor} />
      <EditorContent
        editor={editor}
        className="max-h-[200px] overflow-y-auto"
      />
      <div className="flex items-center justify-between gap-2 border-t border-input bg-muted/35 px-3 py-2">
        <div className="min-h-8 flex items-center">{footerLeft}</div>
        <div className="shrink-0">{sendButton}</div>
      </div>
    </div>
  )
}

export default RichTextEditor
