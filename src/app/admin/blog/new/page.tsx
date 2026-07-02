"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Loader2, ArrowLeft, Eye } from "lucide-react"
import Link from "next/link"
import { RichTextEditor } from "@/components/shared/RichTextEditor"

const CATEGORIES = [
  "uncategorized",
  "cost-guides",
  "regional-guides",
  "material-costs",
  "tips-advice",
  "news-updates",
  "ghana-floods",
  "diaspora",
  "foundation",
  "roofing",
  "finishing",
]

export default function NewBlogPost() {
  const router = useRouter()
  const [form, setForm] = useState({ title: "", slug: "", excerpt: "", content: "", tags: "", imageUrl: "", category: "uncategorized" })
  const [saving, setSaving] = useState(false)

  const generateSlug = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")

  const slug = form.slug || generateSlug(form.title)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.content) return
    setSaving(true)
    try {
      const res = await fetch("/api/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          slug,
          excerpt: form.excerpt,
          content: form.content,
          imageUrl: form.imageUrl || null,
          category: form.category,
          tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
          published: true,
        }),
      })
      if (res.ok) {
        toast.success("Post created!")
        router.push("/admin")
      } else {
        toast.error("Failed to create post")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append("file", file)
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (data.url) {
        setForm((f) => ({ ...f, imageUrl: data.url }))
        toast.success("Image uploaded")
      }
    } catch {
      toast.error("Upload failed")
    }
  }, [])

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href="/admin" className="flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-600 mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-heading font-bold text-charcoal">New Blog Post</h1>
          {slug && (
            <Link
              href={`/blog/preview/${slug}`}
              target="_blank"
              className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700"
            >
              <Eye className="h-4 w-4" /> Preview
            </Link>
          )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-xl border p-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" value={form.title} onChange={(e) => {
              setForm({ ...form, title: e.target.value, slug: form.slug || generateSlug(e.target.value) })
            }} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input id="slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Featured Image</Label>
              <div className="flex gap-2">
                <Input
                  id="image"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="/uploads/image.jpg"
                />
                <Label htmlFor="imageUpload" className="cursor-pointer px-3 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 whitespace-nowrap">
                  Upload
                </Label>
                <input id="imageUpload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </div>
              {form.imageUrl && (
                <img src={form.imageUrl} alt="Preview" className="w-full h-24 object-cover rounded-lg mt-1" />
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea id="excerpt" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Content (Rich Text) *</Label>
            <RichTextEditor
              content={form.content}
              onChange={(html) => setForm({ ...form, content: html })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input id="tags" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="cost-guide, 3-bedroom, accra" />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={saving} className="bg-gradient-primary text-white border-0">
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publishing...</> : "Publish Post"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push("/admin")}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
