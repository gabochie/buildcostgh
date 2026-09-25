import { z } from "zod"

export const toolDefinitions = [
  {
    name: "get_cost_estimate",
    description: "Calculate construction cost estimate for a building project in Ghana",
    inputSchema: {
      type: "object",
      properties: {
        bedrooms: { type: "integer", description: "Number of bedrooms (1-5)" },
        location: { type: "string", description: "City or region in Ghana", default: "Accra" },
        floorArea: { type: "number", description: "Total floor area in square meters" },
        floors: { type: "integer", description: "Number of floors", default: 1 },
        grade: { type: "string", enum: ["A", "B", "C"], description: "Finishing grade", default: "B" },
        addons: { type: "array", items: { type: "string" }, description: "Additional features (pool, garden, security, solar)" },
      },
      required: ["bedrooms"],
    },
  },
  {
    name: "create_order",
    description: "Create a new order and generate payment link",
    inputSchema: {
      type: "object",
      properties: {
        email: { type: "string", description: "Customer email" },
        fullName: { type: "string", description: "Customer full name" },
        phone: { type: "string", description: "Customer phone number" },
        packageName: { type: "string", enum: ["Free Trial", "Basic", "Detailed", "Premium"], description: "Package tier" },
        amount: { type: "integer", description: "Amount in GHS" },
      },
      required: ["email", "fullName", "packageName", "amount"],
    },
  },
  {
    name: "get_order_status",
    description: "Get order status by reference",
    inputSchema: {
      type: "object",
      properties: {
        reference: { type: "string", description: "Order reference (e.g. BCG-...)" },
      },
      required: ["reference"],
    },
  },
  {
    name: "get_market_pricing",
    description: "Get current market pricing for all tiers",
    inputSchema: {
      type: "object",
      properties: {
        currency: { type: "string", enum: ["GHS", "USD"], description: "Currency", default: "GHS" },
      },
    },
  },
  {
    name: "get_seasonal_factors",
    description: "Get active seasonal pricing factors and multipliers",
    inputSchema: {
      type: "object",
      properties: {
        month: { type: "integer", description: "Month (1-12), defaults to current" },
        region: { type: "string", description: "Region to filter by" },
      },
    },
  },
  {
    name: "ask_assistant",
    description: "Ask the construction cost assistant a question",
    inputSchema: {
      type: "object",
      properties: {
        question: { type: "string", description: "Question about construction costs in Ghana" },
      },
      required: ["question"],
    },
  },
  {
    name: "get_research_brief",
    description: "Get an evidence brief (verified prices, quotables, auto-publish eligibility) for a content pillar",
    inputSchema: {
      type: "object",
      properties: {
        pillar: { type: "string", description: "Content pillar key (e.g. materials-prices, region-pricing)", default: "materials-prices" },
        topic: { type: "string", description: "Topic the brief should support" },
        region: { type: "string", description: "Optional region slug to focus the brief on" },
      },
    },
  },
  {
    name: "get_lead_score",
    description: "Get lead score for a prospect email",
    inputSchema: {
      type: "object",
      properties: {
        email: { type: "string", description: "Prospect email address" },
      },
      required: ["email"],
    },
  },
  {
    name: "list_orders",
    description: "List recent orders with optional status filter",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["pending", "completed", "failed"], description: "Filter by status" },
        limit: { type: "integer", description: "Max results", default: 20 },
      },
    },
  },
  {
    name: "list_blog_posts",
    description: "List published blog posts",
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", description: "Filter by category slug" },
        limit: { type: "integer", description: "Max results", default: 10 },
      },
    },
  },
  {
    name: "trigger_report",
    description: "Trigger PDF report generation for a completed order",
    inputSchema: {
      type: "object",
      properties: {
        orderReference: { type: "string", description: "Order reference to generate report for" },
      },
      required: ["orderReference"],
    },
  },
]

export type ToolName = (typeof toolDefinitions)[number]["name"]
