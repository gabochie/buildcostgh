"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Loader2, ArrowLeft, Trash2, Eye, Plus } from "lucide-react"
import Link from "next/link"
import { RichTextEditor } from "@/components/shared/RichTextEditor"

type FaqItem = { question: string; answer: string }

export default function EditBlogPost() {
  const router = useRouter()
  const params = useParams()
  const CATEGORIES = [
    "uncategorized", "cost-guides", "regional-guides", "material-costs",
    "tips-advice", "news-updates", "ghana-floods", "diaspora", "foundation", "roofing", "finishing",
  ]
  const [form, setForm] = useState({ title: "", slug: "", excerpt: "", content: "", tags: "", imageUrl: "", published: false, category: "uncategorized", authorBio: "", schemaType: "Article" })
  const [faqItems, setFaqItems] = useState<FaqItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/blog/${params.id}`)
      .then((r) => r.json())
      .then((post) => {
        if (post.error) {
          toast.error("Post not found")
          router.push("/admin")
          return
        }
        setForm({
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt || "",
          content: post.content,
          imageUrl: post.imageUrl || "",
          tags: (() => { try { return JSON.parse(post.tags).join(", ") } catch { return post.tags || "" } })(),
          category: post.category || "uncategorized",
          published: post.published,
          authorBio: post.authorBio || "",
          schemaType: post.schemaType || "Article",
        })
        try { setFaqItems(JSON.parse(post.faqJson || "[]")) } catch { setFaqItems([]) }
      })
      .finally(() => setLoading(false))
  }, [params.id, router])

  const addFaq = () => setFaqItems([...faqItems, { question: "", answer: "" }])
  const removeFaq = (i: number) => setFaqItems(faqItems.filter((_, idx) => idx !== i))
  const updateFaq = (i: number, field: keyof FaqItem, value: string) => {
    const next = [...faqItems]
    next[i] = { ...next[i], [field]: value }
    setFaqItems(next)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/blog/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          imageUrl: form.imageUrl || null,
          tags: form.tags.split(",").map((t: string) => t.trim()).filter(Boolean),
          authorBio: form.authorBio || null,
          faqJson: faqItems.filter((f) => f.question && f.answer),
          schemaType: form.schemaType,
        }),
      })
      if (res.ok) {
        toast.success("Post updated!")
        router.push("/admin")
      } else {
        toast.error("Failed to update")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Delete this post?")) return
    try {
      await fetch(`/api/blog/${params.id}`, { method: "DELETE" })
      toast.success("Post deleted")
      router.push("/admin")
    } catch {
      toast.error("Failed to delete")
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href="/admin" className="flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-600 mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-heading font-bold text-charcoal">Edit Post</h1>
          {form.slug && (
            <Link
              href={form.published ? `/blog/${form.slug}` : `/blog/preview/${form.slug}`}
              target="_blank"
              className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700"
            >
              <Eye className="h-4 w-4" /> {form.published ? "View" : "Preview"}
            </Link>
          )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-xl border p-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
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
          <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="schemaType">Schema Type</Label>
              <select
                id="schemaType"
                value={form.schemaType}
                onChange={(e) => setForm({ ...form, schemaType: e.target.value })}
                className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Article">Article</option>
                <option value="FAQPage">FAQ Page</option>
                <option value="HowTo">How-To</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="excerpt">Excerpt (meta description)</Label>
            <Textarea id="excerpt" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="authorBio">Author Bio</Label>
            <Input id="authorBio" value={form.authorBio} onChange={(e) => setForm({ ...form, authorBio: e.target.value })} placeholder="e.g. Certified quantity surveyor with 12 years experience" />
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
            <Input id="tags" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <Label>FAQ Section ({faqItems.length} items)</Label>
              <Button type="button" variant="outline" size="sm" onClick={addFaq}>
                <Plus className="h-3 w-3 mr-1" /> Add FAQ
              </Button>
            </div>
            {faqItems.map((item, i) => (
              <div key={i} className="space-y-2 mb-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex gap-2">
                  <Input
                    value={item.question}
                    onChange={(e) => updateFaq(i, "question", e.target.value)}
                    placeholder="Question"
                  />
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeFaq(i)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Textarea
                  value={item.answer}
                  onChange={(e) => updateFaq(i, "answer", e.target.value)}
                  placeholder="Answer"
                  rows={2}
                />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="published" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
            <Label htmlFor="published">Published</Label>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={saving} className="bg-gradient-primary text-white border-0">
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Changes"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push("/admin")}>Cancel</Button>
            <Button type="button" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 ml-auto" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
