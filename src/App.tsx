import { useEffect, useState } from "react"
import {
  Bot,
  Lightbulb,
  Database,
  Home,
  ImagePlus,
  KeyRound,
  Mic,
  User,
  Zap,
} from "lucide-react"
import { AnimatedNumber } from "@/components/ui/animated-number"
import { AnimatedText } from "@/components/ui/animated-text"
import { ScrollAffordance } from "@/components/ui/scroll-affordance"
import { Card } from "@/components/ui/card"
import { BottomNav } from "@/components/ui/bottom-nav"

const verbs = ["build", "ship", "iterate", "launch", "design"]

const ideas = [
  {
    title: "Add sign-in",
    prompt: "Add sign-in with an email code",
    icon: KeyRound,
  },
  {
    title: "Save data",
    prompt: "Add a posts collection and a form to create them",
    icon: Database,
  },
  {
    title: "Add AI chat",
    prompt: "Add a chat box that streams from Claude",
    icon: Bot,
  },
  {
    title: "Server endpoint",
    prompt: "Add an API route that returns JSON",
    icon: Zap,
  },
  {
    title: "Upload files",
    prompt: "Let users upload an avatar image and show it on their profile",
    icon: ImagePlus,
  },
  {
    title: "Add voice",
    prompt: "Add a button that reads the page summary aloud with generated speech",
    icon: Mic,
  },
]

// The vendored bottom tab bar (src/components/ui/bottom-nav.tsx) is a
// controlled component — drive `active`/`onSelect` from state or your router.
const tabs = [
  { id: "home", label: "Home", Icon: Home },
  { id: "ideas", label: "Ideas", Icon: Lightbulb },
  { id: "you", label: "You", Icon: User },
] as const

function App() {
  // Taste-by-default delight primitives, vendored as editable source under
  // src/components/ui/. The count rolls up from 0 on first paint
  // (<AnimatedNumber>), the headline verb flips on a timer (<AnimatedText>),
  // and <ScrollAffordance> is a self-aware "more below" cue that shows only
  // when the page overflows. All zero-dep and themed from your shadcn
  // variables — open the files and restyle freely.
  const [count, setCount] = useState(0)
  useEffect(() => {
    const id = requestAnimationFrame(() => setCount(ideas.length))
    return () => cancelAnimationFrame(id)
  }, [])

  const [verbIndex, setVerbIndex] = useState(0)
  useEffect(() => {
    const id = setInterval(
      () => setVerbIndex((i) => (i + 1) % verbs.length),
      2200,
    )
    return () => clearInterval(id)
  }, [])

  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("home")

  return (
    <main className="min-h-svh bg-background text-foreground flex flex-col items-center justify-center px-6 pt-12 pb-28">
      <div className="w-full max-w-xl">
        <header className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight inline-flex items-baseline gap-2 flex-wrap justify-center">
            <span>What do you want to</span>
            <AnimatedText value={verbs[verbIndex]} className="text-primary" />
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            <AnimatedNumber value={count} className="font-medium text-foreground" />{" "}
            ways to start.
          </p>
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ideas.map(({ title, prompt, icon: Icon }) => (
            <Card
              key={title}
              className="gap-2 p-4 transition-colors hover:bg-accent/40"
            >
              <Icon
                className="size-5 text-muted-foreground mb-1"
                aria-hidden="true"
              />
              <h2 className="text-sm font-medium">{title}</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {prompt}
              </p>
            </Card>
          ))}
        </div>
        <div className="mt-10 flex justify-center">
          <ScrollAffordance label="More" />
        </div>
      </div>

      {/* The omg home-screen bottom bar, now vendored. Swap these tabs for
          your app's sections and wire onSelect to your router. */}
      <BottomNav tabs={tabs} active={tab} onSelect={setTab} />
    </main>
  )
}

export default App
