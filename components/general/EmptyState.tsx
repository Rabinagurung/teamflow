import { Cloud, PlusCircle } from "lucide-react"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "../ui/empty"
import Link from "next/link"
import { buttonVariants } from "../ui/button"

interface EmptyStateProps {
  title: string
  description: string
  buttonText: string
  href: string
}

const EmptyState = ({
  title,
  description,
  buttonText,
  href,
}: EmptyStateProps) => {
  return (
    <Empty className="w-full max-w-md flex-none rounded-2xl border bg-card/90 shadow-lg shadow-black/5 backdrop-blur-sm dark:bg-card/80 dark:shadow-black/20">
      <EmptyHeader>
        <EmptyMedia
          variant="icon"
          className="size-12 rounded-xl bg-primary/10 ring-1 ring-primary/15"
        >
          <Cloud className="size-5 text-primary" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Link href={href} className={buttonVariants()}>
          <PlusCircle />
          <span>{buttonText}</span>
        </Link>
      </EmptyContent>
    </Empty>
  )
}

export default EmptyState
