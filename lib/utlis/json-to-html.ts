import { baseExtensions } from "@/components/rich-text-editor/extensions"
import { generateHTML, type JSONContent } from "@tiptap/react"

export const EMPTY_TIPTAP_DOC: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
}

function normalizeRichTextContent(
  jsonContent: JSONContent | string | null | undefined,
): JSONContent {
  if (!jsonContent) {
    return EMPTY_TIPTAP_DOC
  }

  if (typeof jsonContent === "string") {
    const trimmed = jsonContent.trim()

    if (!trimmed) {
      return EMPTY_TIPTAP_DOC
    }

    try {
      return JSON.parse(trimmed) as JSONContent
    } catch (error) {
      console.error("Failed to parse rich text content:", error)
      return EMPTY_TIPTAP_DOC
    }
  }

  return jsonContent
}

export function convertJsonToHtml(
  jsonContent: JSONContent | string | null | undefined,
): string {
  try {
    const content = normalizeRichTextContent(jsonContent)
    return generateHTML(content, baseExtensions)
  } catch (error) {
    console.error("Error converting json to html:", error)
    return ""
  }
}
