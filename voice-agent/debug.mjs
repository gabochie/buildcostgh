import { WebSocket } from "ws";

const url = "wss://voice.buildcostgh.com/agents/build-cost-voice-agent/debug-" + Date.now();
const ws = new WebSocket(url);
const msgs = [];
let audioReceived = false;
let audioBytes = 0;

ws.on("open", () => {
  console.log("OPEN");
  ws.send(JSON.stringify({ type: "hello", protocol_version: 1 }));
});

ws.on("message", (d, isBin) => {
  if (isBin) {
    audioReceived = true;
    audioBytes += d.length;
    console.log("AUDIO:", d.length, "bytes");
    return;
  }
  const m = JSON.parse(d.toString());
  msgs.push(m);
  console.log(m.type, m.status || "", m.error ? "ERROR:" + m.error : "");
});

ws.on("error", (e) => console.log("WSERR:", e.message));
ws.on("close", (code, reason) => console.log("CLOSED:", code, reason.toString()));

setTimeout(() => {
  console.log("\n=== RESULT ===");
  console.log("Total messages:", msgs.length);
  console.log("Audio received:", audioReceived, audioBytes > 0 ? "(" + audioBytes + " bytes)" : "");
  console.log("Types:", msgs.map((m) => m.type).join(", "));
  ws.close();
  process.exit(0);
}, 15000);
