import { HeroHeader } from "@/app/(marketing)/_components/header"
import HeroSection from "@/app/(marketing)/_components/hero-section"
import { ChatWidget } from "@/app/(marketing)/_components/chat-widget"

export default function Home() {
  return (
    <div>
      <HeroHeader />
      <HeroSection />
      <ChatWidget />
    </div>
  )
}
