import RichTextEditor from "@/components/rich-text-editor/Editor"
import ImageUploadModal from "@/components/rich-text-editor/ImageUploadModal"
import { Button } from "@/components/ui/button"
import { UseAttachmentUploadType } from "@/hooks/use-attachment-upload"
import { ImageIcon, Send } from "lucide-react"
import AttachmentChip from "./AttachmentChip"

interface MessageComposerProps {
  value: string
  onChange: (next: string) => void
  onSubmit: () => void
  isSubmitting?: boolean
  upload: UseAttachmentUploadType
}

// This component will be reused so separate component is created like MessageInputForm,
// ThreadMessageInputForm and EditMessageForm and so on
const MessageComposer = ({
  value,
  onChange,
  onSubmit,
  isSubmitting,
  upload,
}: MessageComposerProps) => {
  return (
    <>
      <RichTextEditor
        field={{ value, onChange }}
        sendButton={
          <Button
            type="button"
            size="sm"
            onClick={onSubmit}
            disabled={isSubmitting}
          >
            <Send className="size-4 mr-1" />
            Send
          </Button>
        }
        footerLeft={
          upload.stagedUrl ? (
            <AttachmentChip url={upload.stagedUrl} onRemove={upload.clear} />
          ) : (
            <Button
              onClick={() => upload.setOpen(true)}
              type="button"
              size="sm"
              variant="outline"
            >
              <ImageIcon className="size-4 mr-1" />
              Attach
            </Button>
          )
        }
      />
      <ImageUploadModal
        open={upload.isOpen}
        onOpenChange={upload.setOpen}
        onUploaded={(url) => upload.onUploaded(url)}
      />
    </>
  )
}

export default MessageComposer
