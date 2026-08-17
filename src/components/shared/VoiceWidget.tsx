"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { Mic, MicOff, Phone, PhoneOff, Loader2 } from "lucide-react"
import { useVoiceAgent } from "@cloudflare/voice/react"

const STATUS_LABEL: Record<string, string> = {
  idle: "Voice ready",
  listening: "Listening…",
  thinking: "Thinking…",
  speaking: "Speaking…",
}

type Props = {
  onExit?: () => void
}

export function VoiceWidget({ onExit }: Props) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
  const [sessionName] = useState(() => {
    try {
      const existing = localStorage.getItem("bcg-voice-session")
      if (existing) return existing
      const name = `visitor_${Math.random().toString(36).slice(2, 10)}`
      localStorage.setItem("bcg-voice-session", name)
      return name
    } catch {
      return "default"
    }
  })
  const transcriptRef = useRef<HTMLDivElement>(null)

  // Only resolve the host after mount so SSR never touches window.
  const host = mounted
    ? process.env.NEXT_PUBLIC_VOICE_AGENT_HOST || window.location.host
    : undefined

  const {
    status,
    transcript,
    interimTranscript,
    isMuted,
    connected,
    error,
    startCall,
    endCall,
    toggleMute,
  } = useVoiceAgent({
    agent: "build-cost-voice-agent",
    name: sessionName,
    host,
    enabled: mounted,
  })

  useEffect(() => {
    if (error) console.error("[VoiceWidget] error:", error, "host:", host, "mounted:", mounted, "connected:", connected, "status:", status)
    else console.log("[VoiceWidget] state:", { mounted, host, connected, status })
  }, [error, mounted, host, connected, status])

  useEffect(() => {
    transcriptRef.current?.scrollTo({
      top: transcriptRef.current.scrollHeight,
      behavior: "smooth",
    })
  }, [transcript, interimTranscript])

  const inCall = status !== "idle"

  return (
    <div className="flex flex-col gap-2.5 p-3">
      {/* Live conversation transcript */}
      <div
        ref={transcriptRef}
        className="max-h-44 space-y-2 overflow-y-auto rounded-xl bg-gray-50 p-2.5"
        aria-live="polite"
      >
        {transcript.length === 0 && !interimTranscript && (
          <p className="px-1 py-2 text-center text-xs text-gray-400">
            {error
              ? "Voice is unavailable right now."
              : "Tap the call button and ask about construction costs, materials, or building in Ghana."}
          </p>
        )}
        {transcript.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-1.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-emerald-600 text-white rounded-br-md"
                  : "bg-white text-gray-800 border border-gray-200 rounded-bl-md shadow-sm"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {interimTranscript && (
          <div className="flex justify-end">
            <div className="max-w-[85%] rounded-2xl rounded-br-md bg-emerald-100 px-3 py-1.5 text-sm text-emerald-800 italic">
              {interimTranscript}
            </div>
          </div>
        )}
      </div>

      {/* Status row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span
            className={`h-2 w-2 rounded-full ${
              error
                ? "bg-red-400"
                : status === "listening" || status === "speaking"
                  ? "bg-emerald-500 animate-pulse"
                  : status === "thinking"
                    ? "bg-amber-400 animate-pulse"
                    : "bg-gray-300"
            }`}
          />
          <span>{error ? `Error: ${error}` : STATUS_LABEL[status]}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {inCall && (
            <button
              onClick={toggleMute}
              disabled={!connected}
              className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
          )}
          {inCall ? (
            <button
              onClick={endCall}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors"
            >
              <PhoneOff className="h-4 w-4" /> End call
            </button>
          ) : (
            <button
              onClick={() => startCall()}
              disabled={!mounted || !!error || !connected}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mounted && !error ? (
                <Phone className="h-4 w-4" />
              ) : (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Call assistant
            </button>
          )}
          {onExit && (
            <button
              onClick={onExit}
              className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors"
              title="Close voice"
            >
              <span className="text-xs font-medium">✕</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
