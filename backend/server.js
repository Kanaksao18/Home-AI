const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const schedule = require("node-schedule");
const bcrypt = require("bcrypt");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

// In-memory device storage
const devices = {
  light: { status: "off", room: "Living Room" },
  light: { status: "off", room: "Bedroom" },
  light: { status: "off", room: "Drawing Room" },
  light: { status: "off", room: "Guest Room" },
  light: { status: "off", room: " Kitchen" },

  fan: { status: "off", room: "Bedroom" },
  tv: { status: "off", room: "Living Room" },
  ac: { status: "off", room: "Bedroom" },
  speaker: { status: "off", room: "Living Room" },
  doorLock: { status: "on", room: "Entrance" },
  thermostat: { status: "off", room: "Bedroom" },
  cleaningDevice: { status: "off", room: "Living Room" },
  securityCamera: { status: "off", room: "Entrance" },
};

const schedules = [];
const chatHistory = {};

// Utility: Convert time to 24-hour format (e.g., 9:30 PM → 21:30)
const convertTo24Hour = (timeStr) => {
  const [time, modifier] = timeStr.toLowerCase().split(/\s+/);
  let [hours, minutes] = time.split(":");
  minutes = minutes || "00";
  if (modifier === "pm" && hours !== "12") hours = parseInt(hours) + 12;
  if (modifier === "am" && hours === "12") hours = 0;
  return `${hours.toString().padStart(2, "0")}:${minutes}`;
};

// API to get all device statuses
app.get("/api/devices", (req, res) => {
  res.json(devices);
});

// API to toggle a device on/off
app.post("/api/devices/:deviceId/toggle", (req, res) => {
  const { deviceId } = req.params;
  const device = devices[deviceId];
  if (!device) return res.status(404).json({ message: "Device not found" });

  device.status = device.status === "on" ? "off" : "on";
  res.json({
    message: `${deviceId} turned ${device.status}`,
    status: device.status,
  });
});

// AI command handler: e.g., "Turn on the light"
app.post("/api/ai-command", (req, res) => {
  const { command, userId = "default" } = req.body;
  const lowerCommand = command.toLowerCase();
  const availableDevices = Object.keys(devices);

  chatHistory[userId] = chatHistory[userId] || [];
  chatHistory[userId].push({ sender: "user", text: command });

  const history = chatHistory[userId];
  const lastCommand = history[history.length - 2]?.text || "";

  // Handle pronouns like "it"
  let contextCommand = command;
  if (/turn (it|this|that) (on|off)/i.test(command)) {
    const lastDevice = Object.keys(devices).find((d) =>
      lastCommand.includes(d)
    );
    if (lastDevice) {
      contextCommand = command.replace(/(it|this|that)/i, lastDevice);
    }
  }

  const ctxLower = contextCommand.toLowerCase();
  const actionMatch = ctxLower.match(/\b(turn|switch)\s+(on|off)\b/);
  const timeMatch = ctxLower.match(/at\s+(\d{1,2}(:\d{2})?\s*(am|pm)?)/);
  const possibleDevice = availableDevices.find((d) => ctxLower.includes(d));

  // Handle scheduling
  if (actionMatch && possibleDevice && timeMatch) {
    const [, , action] = actionMatch;
    const timeRaw = timeMatch[1];
    const time = convertTo24Hour(timeRaw);
    const id = `${possibleDevice}-${Date.now()}`;

    schedules.push({ id, device: possibleDevice, action, time });

    const msg = `Okay! I'll ${action} the ${possibleDevice} at ${time}`;
    chatHistory[userId].push({ sender: "bot", text: msg });
    return res.json({ message: msg, id });
  }

  // Handle normal command
  if (actionMatch && possibleDevice) {
    const [, , action] = actionMatch;
    devices[possibleDevice].status = action;
    const msg = `✅ ${possibleDevice} turned ${action}.`;
    chatHistory[userId].push({ sender: "bot", text: msg });
    return res.json({ message: msg, status: devices[possibleDevice].status });
  }

  // Suggest closest match
  const similarDevice = availableDevices.find((d) =>
    ctxLower.includes(d.slice(0, 3))
  );
  if (!possibleDevice && similarDevice) {
    return res.json({
      message: `🤔 Did you mean "${similarDevice}"? Try again.`,
    });
  }

  // Help suggestions
  if (ctxLower.includes("what can you do") || ctxLower.includes("help")) {
    const suggestions = availableDevices
      .map((d) => `${d} is currently ${devices[d].status}`)
      .join(", ");
    return res.json({
      message: `🧠 I can control these devices: ${suggestions}. Try saying \"Turn on the fan.\"`,
    });
  }

  const msg = "❌ Sorry, I couldn't understand that command.";
  chatHistory[userId].push({ sender: "bot", text: msg });
  return res.status(400).json({ message: msg });
});

// Scheduling API
app.post("/api/schedule", (req, res) => {
  const { device, action, time } = req.body;

  if (!devices[device])
    return res.status(404).json({ message: "Device not found" });
  if (!["on", "off"].includes(action))
    return res.status(400).json({ message: "Invalid action" });

  const [hour, minute] = time.split(":").map(Number);
  schedule.scheduleJob({ hour, minute }, () => {
    devices[device].status = action;
    console.log(`[Scheduled] ${device} turned ${action} at ${time}`);
  });

  res.json({ message: `Scheduled to turn ${action} the ${device} at ${time}` });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
