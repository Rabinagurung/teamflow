import MarkdownIt from "markdown-it"
import DOMPurify from "dompurify"
import { generateJSON, JSONContent } from "@tiptap/react"
import { editorExtensions } from "@/components/rich-text-editor/extensions"

const md = new MarkdownIt({ html: false, linkify: true, breaks: false })

export function markdownToJson(markdown: string): JSONContent {
  const html = md.render(markdown)
  const cleanHTML = DOMPurify.sanitize(html, { USE_PROFILES: { html: true } })

  return generateJSON(cleanHTML, editorExtensions)
}
