import { WebSocket } from "ws";

// Test 1: Connect without triggering onCallStart by not starting a call
// Just check if the connection itself works
console.log("=== Test 1: Basic connection ===");
const ws1 = new WebSocket("wss://voice.buildcostgh.com/agents/build-cost-voice-agent/test-basic-" + Date.now());
ws1.on("open", () => {
  console.log("1. OPEN - sending hello");
  ws1.send(JSON.stringify({ type: "hello", protocol_version: 1 }));
});
ws1.on("message", (d, isBin) => {
  if (isBin) {
    console.log("   AUDIO:", d.length, "bytes");
    return;
  }
  const m = JSON.parse(d.toString());
  console.log("   MSG:", m.type, m.status || "", m.message || "", m.error || "");
  if (m.type === "cf_agent_mcp_servers") {
    // Try sending a text_message to trigger onTurn without being in a call
    console.log("2. Sending start_call...");
    ws1.send(JSON.stringify({ type: "start_call" }));
  }
  if (m.type === "error") {
    console.log("   *** SERVER ERROR:", m.message);
  }
});
ws1.on("error", (e) => console.log("WS1 ERROR:", e.message));
ws1.on("close", (code, reason) => console.log("WS1 CLOSED:", code, reason.toString()));

setTimeout(() => {
  console.log("\n=== DONE ===");
  ws1.close();
  process.exit(0);
}, 20000);
