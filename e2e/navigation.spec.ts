import { test, expect } from "@playwright/test"

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/calculator", label: "Calculator" },
  { href: "/costs", label: "Costs by Region" },
  { href: "/building-types/residential", label: "Building Types" },
  { href: "/pricing", label: "Pricing" },
  { href: "/services", label: "Services" },
]

test.describe("site navigation", () => {
  test("homepage renders and header nav links are present", async ({ page }) => {
    const errors: string[] = []
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text())
    })
    page.on("pageerror", (err) => errors.push(err.message))

    await page.goto("/")
    await expect(page).toHaveTitle(/BuildCost/i)

    // Brand link in the header
    await expect(page.getByRole("link", { name: /BuildCost/i }).first()).toBeVisible()

    // Primary nav links resolve to the right hrefs
    for (const link of navLinks) {
      const el = page.getByRole("link", { name: link.label }).first()
      await expect(el).toBeVisible()
      await expect(el).toHaveAttribute("href", link.href)
    }

    // Header CTA wired to the calculator
    await expect(page.getByRole("link", { name: /Start Calculating/i }).first()).toBeVisible()

    expect(errors).toEqual([])
  })

  test("clicking the Calculator nav link navigates to /calculator", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("link", { name: "Calculator" }).first().click()
    await expect(page).toHaveURL(/\/calculator/)
  })

  test("clicking Pricing nav link navigates to /pricing", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("link", { name: "Pricing" }).first().click()
    await expect(page).toHaveURL(/\/pricing/)
  })

  test("footer renders key informational links", async ({ page }) => {
    await page.goto("/")
    // A footer is present if there is at least one standard informational link
    const footerLink = page.locator("footer a").first()
    await expect(footerLink).toBeVisible()
  })
})
