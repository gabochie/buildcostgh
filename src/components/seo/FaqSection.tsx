import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { cn } from "@/lib/utils"
import type { Faq } from "@/lib/seo/faqs"

interface FaqSectionProps {
  faqs: Faq[]
  title?: string
  subtitle?: string
  className?: string
}

export function FaqSection({
  faqs,
  title = "Frequently Asked Questions",
  subtitle = "Direct answers to the questions people ask most about building in Ghana.",
  className,
}: FaqSectionProps) {
  return (
    <section className={cn("py-16 bg-white", className)}>
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-charcoal mb-3">
            {title}
          </h2>
          <p className="text-gray-500 text-sm">{subtitle}</p>
        </div>
        <Accordion className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-glass divide-y divide-gray-100">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="border-0">
              <AccordionTrigger className="text-sm font-medium text-gray-900 hover:text-emerald-600 px-6 py-4 hover:no-underline data-[state=open]:text-emerald-600">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-gray-600 px-6 pb-4 leading-relaxed">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
