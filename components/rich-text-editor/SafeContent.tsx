import { convertJsonToHtml } from "@/lib/utlis/json-to-html"
import { type JSONContent } from "@tiptap/react"
import DOMPurify from "dompurify"
import parse from "html-react-parser"

interface SafeContentProps {
  content: JSONContent | string | null | undefined
  className?: string
}

const SafeContent = ({ content, className }: SafeContentProps) => {
  //convert content to HTML
  const html = convertJsonToHtml(content)

  //important to sanitize HTML to prevent XSS attacks using DOMPurify package
  const clean = DOMPurify.sanitize(html)

  //using html-react-parse package to render clean data
  return <div className={className}>{parse(clean)}</div>
}

export default SafeContent
