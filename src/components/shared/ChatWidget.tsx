"use client"

import { useState, useRef, useEffect } from "react"
import { MessageCircle, X, Send, Hammer, Loader2, Phone } from "lucide-react"
import { VoiceWidget } from "./VoiceWidget"

type Message = { role: "user" | "assistant"; content: string }

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [voiceOpen, setVoiceOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I'm the BuildCost GH assistant. Ask me anything about construction costs, building materials, or building in Ghana." },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput("")
    setMessages((m) => [...m, { role: "user", content: userMsg }])
    setLoading(true)

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      })
      const data = await res.json()
      setMessages((m) => [...m, { role: "assistant", content: data.answer }])
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Sorry, something went wrong." }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {open && (
        <div className="fixed bottom-40 md:bottom-24 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col" style={{ maxHeight: "calc(100vh - 180px)" }}>
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-primary text-white">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Hammer className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-sm">BuildCost GH</p>
                <p className="text-xs text-emerald-100">{voiceOpen ? "Voice assistant" : "Assistant"}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setVoiceOpen((v) => !v)}
                className={`p-1.5 rounded-lg transition-colors ${voiceOpen ? "bg-white/20 text-white" : "hover:bg-white/10 text-white"}`}
                title={voiceOpen ? "Switch to text" : "Talk to the assistant"}
                aria-label={voiceOpen ? "Switch to text chat" : "Start voice chat"}
              >
                <Phone className="h-4 w-4" />
              </button>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50" style={{ minHeight: "300px", maxHeight: "400px" }}>
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-emerald-600 text-white rounded-br-md"
                      : "bg-white text-gray-800 border border-gray-200 rounded-bl-md shadow-sm"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-2.5 shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {voiceOpen ? (
            <div className="border-t border-gray-200 bg-white">
              <VoiceWidget onExit={() => setVoiceOpen(false)} />
            </div>
          ) : (
            <div className="border-t border-gray-200 p-3">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about costs, materials..."
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50"
                  disabled={loading}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className="p-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-24 md:bottom-8 right-6 z-50 w-14 h-14 rounded-full bg-gradient-primary text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center"
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </>
  )
}
