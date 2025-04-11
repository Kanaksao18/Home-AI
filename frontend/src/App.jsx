import { useEffect, useState } from "react";
import axios from "axios";
import Scheduler from "./components/Scheduler";
import Chatbot from "./components/Chatbot";

const API = "http://localhost:5000/api";

// Web Speech API setup
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

function App() {
  const [devices, setDevices] = useState({});
  const [command, setCommand] = useState("");
  const [responseMsg, setResponseMsg] = useState("");

  // Voice response
  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(utterance);
  };

  // Fetch device statuses
  const fetchDevices = async () => {
    try {
      const res = await axios.get(`${API}/devices`);
      setDevices(res.data);
    } catch (err) {
      console.error("Failed to fetch devices", err);
    }
  };

  // Toggle a device
  const toggleDevice = async (deviceId) => {
    try {
      await axios.post(`${API}/devices/${deviceId}/toggle`);
      speak(`${deviceId} has been toggled`);
      fetchDevices();
    } catch (err) {
      console.error("Toggle failed", err);
    }
  };

  // Handle text/voice AI command
  const handleCommand = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API}/ai-command`, { command });
      setResponseMsg(res.data.message);
      speak(res.data.message); // Speak response
      fetchDevices();
    } catch (err) {
      const msg = err.response?.data?.message || "Command failed";
      setResponseMsg(msg);
      speak(msg);
    }
    setCommand("");
  };

  // Start voice listening
  const startListening = () => {
    if (!recognition) {
      alert("Speech Recognition not supported in your browser.");
      return;
    }

    recognition.start();
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setCommand(transcript);
      setTimeout(() => document.getElementById("sendBtn").click(), 500);
    };
  };

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle("dark");
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  // Group devices by room
  const grouped = {};
  Object.entries(devices).forEach(([id, device]) => {
    grouped[device.room] = grouped[device.room] || [];
    grouped[device.room].push({ id, ...device });
  });

  const deviceIcons = {
    light: "💡",
    fan: "🌀",
    tv: "📺",
    ac: "❄️",
    speaker: "🔊",
    doorLock: "🔒",
    thermostat: "🌡",
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white p-6 ">
      <button
        onClick={toggleDarkMode}
        className="absolute top-4 right-4 bg-black text-white px-3 py-1 rounded shadow hover:bg-gray-800"
      >
        🌙 Toggle Dark Mode
      </button>

      <h1 className="text-4xl font-bold text-center text-blue-700 dark:text-blue-300 mb-6">
        🏠 Smart Home AI
      </h1>
      <Chatbot refreshDevices={fetchDevices} />

      <form
        onSubmit={handleCommand}
        className="max-w-xl mx-auto mb-6 flex gap-2 mt-10"
      >
        <input
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="e.g., Turn off the fan"
          className="w-full px-4 py-2 border rounded-lg shadow dark:bg-gray-800 dark:border-gray-700"
        />
        <button
          id="sendBtn"
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Send
        </button>
        <button
          type="button"
          onClick={startListening}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
        >
          🎤
        </button>
      </form>

      {responseMsg && (
        <p className="text-center text-green-500 font-semibold mb-4">
          {responseMsg}
        </p>
      )}

      {Object.entries(grouped).map(([room, roomDevices]) => (
        <div key={room} className="mb-10 max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">{room}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {roomDevices.map(({ id, status , room}) => (
              <div
                key={id}
                className={`rounded-xl p-6 shadow border-l-8 transition-all duration-300 ${
                  status === "on"
                    ? "border-green-500 bg-white dark:bg-gray-800 animate-pulse"
                    : "border-red-500 bg-gray-50 dark:bg-gray-700"
                }`}
              >
                <h3 className="text-xl font-semibold capitalize mb-2">
                  {deviceIcons[id]} {id}
                </h3>
                <p className="mb-4">
                  Status:{" "}
                  <span
                    className={`font-bold ${
                      status === "on" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {status.toUpperCase()}
                  </span>
                </p>
                <button
                  onClick={() => toggleDevice(id)}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Toggle
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      <Scheduler refreshDevices={fetchDevices} />
    </div>
  );
}

export default App;
