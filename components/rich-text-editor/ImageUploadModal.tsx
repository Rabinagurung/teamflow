"use client"

import { UploadDropzone } from "@/lib/uploadthing/uploadthing"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { toast } from "sonner"

interface ImageUploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploaded: (url: string) => void
}

const ImageUploadModal = ({
  open,
  onOpenChange,
  onUploaded,
}: ImageUploadModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Image</DialogTitle>
        </DialogHeader>
        <UploadDropzone
          className="ut-uploading:opacity-90 ut-ready:bg-card ut-ready:border-border 
          ut-ready:text-foreground ut-uploading:bg-muted ut-uploading:border-border 
          ut-uploading:text-muted-foreground ut-label:text-text-sm ut-label:text-muted-foreground
          ut-allowed-content:text-xs ut-allowed-content:text-muted-foreground ut-button:bg-primary 
          ut-button:text-primary-foreground rounded-lg border"
          appearance={{
            container: "bg-card",
            label: "text-muted-foreground",
            allowedContent: "text-xs text-muted-foreground",
            button: "bg-primary text-primary-foreground hover:bg-primary/90",
            uploadIcon: "text-muted-foreground",
          }}
          endpoint={"imageUploader"}
          onClientUploadComplete={(res) => {
            //res is an array which can have multiple files
            const url = res[0].ufsUrl //ufsUrl is presigned URL returned from uploadThing which is uploaded image url
            onUploaded(url)
            toast.success("Image uploaded successfully")
          }}
          onUploadError={(error) => {
            toast.error(error.message)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

export default ImageUploadModal
