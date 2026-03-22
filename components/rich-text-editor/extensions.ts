import StarterKit from "@tiptap/starter-kit"
import TextAlign from "@tiptap/extension-text-align"
import { all, createLowlight } from "lowlight"
import CodeBlock from "@tiptap/extension-code-block-lowlight"
import { Placeholder } from "@tiptap/extensions/placeholder"

const lowlight = createLowlight(all)

export const baseExtensions = [
  StarterKit.configure({
    codeBlock: false,
  }),
  TextAlign.configure({
    //only align headings and paragraph not code blocks
    types: ["heading", "paragraph"],
  }),
  CodeBlock.configure({
    lowlight,
  }),
]
/* Why we create two different arrays for extensions. 
placeholder extension will be needed in main editor while creating message. 
But when editing message, placeholder is not required. 
For placeholder to be seen in editor, custom CSS needs to be added*/
export const editorExtensions = [
  ...baseExtensions,
  Placeholder.configure({
    placeholder: "Type your Message",
  }),
]
