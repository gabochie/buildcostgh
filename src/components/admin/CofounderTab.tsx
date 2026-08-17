"use client"

import { useEffect, useRef, useState } from "react"
import {
  Bot, Send, Target, TrendingUp, CalendarDays, Loader2, AlertCircle,
  CheckCircle2, Activity, Users, Wrench, PenLine, DollarSign, Search, Cpu,
} from "lucide-react"

type GoalDto = {
  id: string
  title: string
  description: string | null
  targetAmount: number
  currency: string
  periodStart: string
  periodEnd: string
}

type ProgressDto = {
  revenueUsd: number
  percentComplete: number
  daysElapsed: number
  daysTotal: number
  daysRemaining: number
  paceUsdPerDay: number
  requiredUsdPerDay: number
  onTrack: boolean
  forecastUsd: number
  monthlyRevenue: { month: string; revenueUsd: number }[]
}

type TaskDto = {
  id: string
  title: string
  agent: string
  status: string
  prompt: string
  result: string | null
  error: string | null
  createdAt: string
}

type CofounderState = {
  goal: GoalDto
  progress: ProgressDto
  tasks: TaskDto[]
  openAiConfigured: boolean
}

type ChatMsg = {
  id: string
  role: "user" | "assistant"
  content: string
  activity?: string[]
  tools?: { name: string; ok: boolean; result: string }[]
  error?: string
}

const agentMeta: Record<string, { label: string; icon: typeof Users }> = {
  sdr: { label: "SDR", icon: Users },
  content: { label: "Content", icon: PenLine },
  pricing: { label: "Pricing", icon: DollarSign },
  research: { label: "Research", icon: Search },
  ops: { label: "Ops", icon: Wrench },
}

const fmtUsd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })

function parseSseEvent(buffer: string): { events: { event: string; data: unknown }[]; rest: string } {
  const events: { event: string; data: unknown }[] = []
  const parts = buffer.split("\n\n")
  const rest = parts.pop() ?? ""
  for (const part of parts) {
    const eventLine = part.split("\n").find((l) => l.startsWith("event:"))
    const dataLine = part.split("\n").find((l) => l.startsWith("data:"))
    if (!eventLine || !dataLine) continue
    try {
      events.push({ event: eventLine.slice(6).trim(), data: JSON.parse(dataLine.slice(5).trim()) })
    } catch {}
  }
  return { events, rest }
}

export function CofounderTab() {
  const [state, setState] = useState<CofounderState | null>(null)
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState("")
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const msgId = useRef(0)

  const refreshState = async () => {
    try {
      const res = await fetch("/api/admin/cofounder")
      if (!res.ok) throw new Error("Failed to load cofounder state")
      const data = await res.json()
      setState(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      await refreshState()
      if (cancelled) setLoading(false)
    })()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages])

  const send = async () => {
    const text = input.trim()
    if (!text || streaming) return
    setInput("")
    setError(null)

    const history = messages.slice(-12).map((m) => ({ role: m.role, content: m.content }))
    const userMsg: ChatMsg = { id: `u${++msgId.current}`, role: "user", content: text }
    const assistantMsg: ChatMsg = { id: `a${++msgId.current}`, role: "assistant", content: "", activity: [], tools: [] }
    setMessages((prev) => [...prev, userMsg, assistantMsg])
    setStreaming(true)

    try {
      const res = await fetch("/api/admin/cofounder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `Request failed (${res.status})` }))
        throw new Error(err.error ?? `Request failed (${res.status})`)
      }
      if (!res.body) throw new Error("Stream unavailable")

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      const updateAssistant = (fn: (m: ChatMsg) => ChatMsg) => {
        setMessages((prev) => prev.map((m) => (m.id === assistantMsg.id ? fn(m) : m)))
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const { events, rest } = parseSseEvent(buffer)
        buffer = rest

        for (const { event, data } of events) {
          const d = data as Record<string, unknown>
          switch (event) {
            case "delta":
              updateAssistant((m) => ({ ...m, content: m.content + String(d.text ?? "") }))
              break
            case "activity":
              updateAssistant((m) => ({ ...m, activity: [...(m.activity ?? []), String(d.message ?? "")] }))
              break
            case "tool_start":
              updateAssistant((m) => ({ ...m, activity: [...(m.activity ?? []), `Calling ${String(d.name)}…`] }))
              break
            case "tool_end": {
              const name = String(d.name ?? "tool")
              const ok = d.ok !== false
              const result = String(d.result ?? "").slice(0, 400)
              updateAssistant((m) => ({
                ...m,
                tools: [...(m.tools ?? []), { name, ok, result }],
                activity: [...(m.activity ?? []), `${ok ? "✓" : "✗"} ${name}`],
              }))
              break
            }
            case "done":
              updateAssistant((m) => ({ ...m, content: m.content || String(d.text ?? "") }))
              break
            case "error":
              updateAssistant((m) => ({ ...m, error: String(d.message ?? "Cofounder error") }))
              break
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setStreaming(false)
      refreshState()
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  const { goal, progress, tasks } = state!
  const pct = Math.min(100, progress.percentComplete)

  return (
    <div className="space-y-6">
      {/* Error banner */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Goal header */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">{goal.title}</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {goal.description ?? "BuildCostGH cofounder mission"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2">
              <Target className="h-4 w-4 text-emerald-600" />
              <span className="text-slate-600">Target</span>
              <span className="font-semibold text-slate-900">{fmtUsd(goal.targetAmount)}</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <span className="text-slate-600">Revenue</span>
              <span className="font-semibold text-slate-900">{fmtUsd(progress.revenueUsd)}</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2">
              <CalendarDays className="h-4 w-4 text-emerald-600" />
              <span className="text-slate-600">{progress.daysRemaining} days left</span>
            </div>
            <div className={`flex items-center gap-2 rounded-xl px-3 py-2 ${progress.onTrack ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
              <Activity className="h-4 w-4" />
              <span className="font-semibold">
                {progress.onTrack ? "On track" : "Behind pace"} · {progress.forecastUsd >= goal.targetAmount ? "forecast hits target" : `forecast ${fmtUsd(progress.forecastUsd)}`}
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-5">
          <div className="flex justify-between text-xs text-slate-500 mb-1.5">
            <span>{Math.round(pct)}% of target</span>
            <span>
              Need {fmtUsd(progress.requiredUsdPerDay)}/day · pace {fmtUsd(progress.paceUsdPerDay)}/day
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${progress.onTrack ? "bg-emerald-500" : "bg-amber-500"}`}
              style={{ width: `${Math.max(1, pct)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Chat */}
        <div className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col min-h-[560px]">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Cpu className="h-4 w-4 text-emerald-600" />
            <h3 className="font-semibold text-slate-900">Cofounder Chat</h3>
            <span className="ml-auto text-xs text-slate-400">Knows every part of the business · leads 5 subagents</span>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[480px]">
            {messages.length === 0 && !state?.openAiConfigured && (
              <div className="text-center py-16 text-slate-400">
                <Bot className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p className="font-medium text-slate-500">OPENAI_API_KEY is not configured</p>
                <p className="text-sm mt-1">Add it to your environment (Vercel + .env.local) to activate the cofounder.</p>
              </div>
            )}
            {messages.length === 0 && state?.openAiConfigured && (
              <div className="text-center py-16 text-slate-400">
                <Bot className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p className="font-medium text-slate-500">Ask the cofounder anything</p>
                <p className="text-sm mt-1">e.g. “What&apos;s our pace toward $1M?” · “Draft outreach for our hottest lead” · “Plan 4 blog posts for diaspora keywords”</p>
              </div>
            )}

            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${m.role === "user" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-800"}`}>
                  {m.content && <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>}

                  {m.activity && m.activity.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-200/70 space-y-1">
                      {m.activity.map((a, i) => (
                        <p key={i} className="text-xs text-slate-500 flex items-center gap-1.5">
                          <Activity className="h-3 w-3 text-emerald-500 flex-shrink-0" /> {a}
                        </p>
                      ))}
                    </div>
                  )}

                  {m.tools && m.tools.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {m.tools.map((t, i) => (
                        <details key={i} className="text-xs bg-white/70 rounded-lg p-2">
                          <summary className={`flex items-center gap-1.5 cursor-pointer ${t.ok ? "text-emerald-600" : "text-red-500"}`}>
                            {t.ok ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                            {t.name}
                          </summary>
                          <pre className="mt-1.5 whitespace-pre-wrap text-slate-600 max-h-32 overflow-y-auto">{t.result}</pre>
                        </details>
                      ))}
                    </div>
                  )}

                  {m.error && (
                    <p className="mt-2 text-xs text-red-500 flex items-center gap-1.5">
                      <AlertCircle className="h-3 w-3" /> {m.error}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {streaming && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Cofounder is working…
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-slate-100">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    send()
                  }
                }}
                rows={2}
                placeholder="Ask the cofounder… (Enter to send)"
                className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
              <button
                onClick={send}
                disabled={streaming || !input.trim()}
                className="h-11 w-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tasks panel */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-600" /> Delegated Tasks
          </h3>
          <p className="text-xs text-slate-400 mt-1 mb-4">Work the cofounder handed to specialist subagents</p>

          {tasks.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No delegated tasks yet. Ask the cofounder to run one.</p>
          ) : (
            <div className="space-y-3">
              {tasks.map((t) => {
                const meta = agentMeta[t.agent] ?? { label: t.agent, icon: Cpu }
                const Icon = meta.icon
                const statusColor =
                  t.status === "completed" ? "text-emerald-600" :
                  t.status === "failed" ? "text-red-500" :
                  t.status === "running" ? "text-blue-500" : "text-slate-400"
                return (
                  <div key={t.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <div className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5 text-slate-500" />
                      <span className="text-xs font-semibold text-slate-700">{meta.label}</span>
                      <span className={`ml-auto text-xs font-medium capitalize ${statusColor}`}>
                        {t.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-800 mt-1.5">{t.title}</p>
                    {t.result && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{t.result}</p>}
                    {t.error && <p className="text-xs text-red-500 mt-1 line-clamp-2">{t.error}</p>}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
