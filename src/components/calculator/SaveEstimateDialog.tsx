"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Bookmark, Loader2, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import type { EstimateResult } from "@/types"
import { useCsrfFetch } from "@/hooks/useCsrfFetch"

interface SaveEstimateDialogProps {
  result: EstimateResult
  inputs: Record<string, unknown>
  buildingType?: string
  location?: string
  floorArea?: number
  floors?: number
  qualityLevel?: string
}

export function SaveEstimateDialog({ result, inputs, buildingType = "residential", location = "", floorArea = 0, floors = 1, qualityLevel = "standard" }: SaveEstimateDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const csrfFetch = useCsrfFetch()

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter a project name")
      return
    }
    setSaving(true)
    try {
      const res = await csrfFetch("/api/estimates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName: name.trim(),
          buildingType,
          location,
          floorArea,
          floors,
          qualityLevel,
          inputs,
          result,
          notes: notes.trim() || null,
        }),
      })
      if (res.ok) {
        setSaved(true)
        toast.success("Estimate saved!")
        setTimeout(() => { setOpen(false); setSaved(false); setName(""); setNotes("") }, 1500)
      } else {
        const data = await res.json()
        toast.error(data.error || "Failed to save")
      }
    } catch {
      toast.error("Failed to save estimate")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} className="flex-1">
        <Bookmark className="h-4 w-4 mr-2" /> Save Estimate
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            {saved ? (
              <div className="text-center py-6">
                <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                <p className="text-lg font-bold text-slate-900">Estimate Saved</p>
                <p className="text-sm text-slate-500 mt-1">View it from your dashboard</p>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold text-slate-900 mb-4">Save Estimate</h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Project Name *</Label>
                    <Input
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Office Building — East Legon"
                      className="mt-1"
                      autoFocus
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Notes (optional)</Label>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Add context for this estimate..."
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
                    <Button onClick={handleSave} disabled={saving || !name.trim()} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Bookmark className="h-4 w-4 mr-2" />}
                      Save
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
