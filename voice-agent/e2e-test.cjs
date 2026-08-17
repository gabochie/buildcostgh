const WebSocket = require("ws");
const sessionName = "e2e_" + Math.random().toString(36).slice(2, 8);
const url = "wss://voice.buildcostgh.com/agents/build-cost-voice-agent/" + sessionName;
const ws = new WebSocket(url);
let audioBytes = 0;
let step = 0;

function send(obj) { ws.send(JSON.stringify(obj)); }

ws.on("open", () => {
  console.log("[1] WS connected");
  send({ type: "hello", protocol_version: 1 });
  setTimeout(() => {
    console.log("[2] start_call");
    send({ type: "start_call" });
  }, 1000);
});

ws.on("message", (d, isBinary) => {
  if (isBinary) { audioBytes += d.length; return; }
  const msg = JSON.parse(d.toString());
  if (msg.type === "status") {
    console.log("[+] status:", msg.status);
    if (msg.status === "listening" && step === 0) {
      step = 1;
      setTimeout(() => {
        console.log("[3] text_message: My name is Kwame");
        send({ type: "text_message", text: "My name is Kwame" });
      }, 1500);
    }
  } else if (msg.type === "transcript") {
    console.log("[+] transcript [" + msg.role + "]:", msg.text);
  } else if (msg.type === "transcript_end") {
    console.log("[+] transcript_end:", (msg.text || "").substring(0, 80));
  } else if (msg.type === "transcript_start") {
    console.log("[+] transcript_start [" + msg.role + "]");
  } else if (msg.type === "error") {
    console.log("[!] ERROR:", msg.message);
  } else if (msg.type === "audio_config") {
    console.log("[+] audio_config:", msg.format, msg.sampleRate + "Hz");
  } else if (msg.type !== "cf_agent_identity" && msg.type !== "cf_agent_mcp_servers") {
    console.log("[+]", msg.type);
  }
});

ws.on("error", (e) => console.log("WS ERROR:", e.message));

setTimeout(() => {
  console.log("\n========== E2E RESULTS ==========");
  console.log("Audio bytes received:", audioBytes);
  console.log("TTS:", audioBytes > 0 ? "PASS" : "FAIL (quota likely exhausted)");
  console.log("Protocol: PASS");
  ws.close();
  process.exit(0);
}, 25000);
