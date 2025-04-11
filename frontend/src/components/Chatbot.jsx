import { useState, useRef } from "react";
import axios from "axios";

const API = "http://localhost:5000/api";

const Chatbot = ({ refreshDevices }) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const lastDeviceRef = useRef(null); // Remember the last mentioned device

  const speak = (text) => {
    const utter = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(utter);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
  
    try {
      const res = await axios.post(`${API}/ai-command`, {
        command: input,
        userId: "user1", // later make this dynamic
      });
  
      const botResponse = { sender: "bot", text: res.data.message };
      speak(res.data.message);
      setMessages((prev) => [...prev, botResponse]);
      refreshDevices();
    } catch (err) {
      const errorText = err.response?.data?.message || "Something went wrong";
      setMessages((prev) => [...prev, { sender: "bot", text: errorText }]);
    }
  
    setInput("");

    setInput("");
  };

  const startVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice not supported.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.start();
    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setInput(text);
      setTimeout(() => handleSend(), 500);
    };
  };

 
  return (
    <div className="w-full max-w-6xl mx-auto mt-10 bg-blue-50 shadow-lg rounded dark:bg-gray-900 p-6">
      <h2 className="text-2xl font-semibold mb-4 text-blue-800 dark:text-blue-300">
        💬 Smart Home Chatbot
      </h2>

      <div className="h-96 overflow-y-auto bg-white p-4 rounded-lg mb-5 dark:bg-gray-800">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`mb-3 ${msg.sender === "user" ? "text-right" : "text-left"}`}
          >
            <span
              className={`inline-block px-4 py-2 rounded-lg ${
                msg.sender === "user"
                  ? "bg-teal-500 text-white"
                  : "bg-sky-200 dark:bg-gray-700 dark:text-white"
              }`}
            >
              {msg.text}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Say or type a command"
          className="flex-1 px-4 py-3 border rounded-lg dark:bg-gray-900 dark:text-white"
        />
        <div className="flex gap-2">
          <button
            onClick={handleSend}
            className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700"
          >
            Send
          </button>
          <button
            onClick={startVoice}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
          >
            🎤
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
