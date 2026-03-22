"use client"

import { useCallback, useMemo, useState } from "react"

export function useAttachmentUpload() {
  const [isOpen, setOpen] = useState(false)
  const [stagedUrl, setStagedUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const onUploaded = useCallback((url: string) => {
    setStagedUrl(url)
    setIsUploading(false) //this means image is successfully uploaded and we have url
    setOpen(false) //close Dialog after image is uploaded
  }, [])

  const clear = useCallback(() => {
    setStagedUrl(null)
    setIsUploading(false)
  }, [])

  return useMemo(
    () => ({
      isOpen,
      setOpen,
      onUploaded,
      stagedUrl,
      isUploading,
      clear,
    }),
    [isOpen, onUploaded, stagedUrl, isUploading, clear],
  )
}

export type UseAttachmentUploadType = ReturnType<typeof useAttachmentUpload>
