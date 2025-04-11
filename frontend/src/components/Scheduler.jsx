import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:5000/api";

export default function Scheduler({ refreshDevices }) {
  const [device, setDevice] = useState("light");
  const [action, setAction] = useState("off");
  const [time, setTime] = useState("22:00");
  const [schedules, setSchedules] = useState([]);

  const fetchSchedules = async () => {
    const res = await axios.get(`${API}/schedules`);
    setSchedules(res.data);
  };

  const createSchedule = async (e) => {
    e.preventDefault();
    await axios.post(`${API}/schedule`, { device, action, time });
    fetchSchedules();
    refreshDevices();
  };

  const deleteSchedule = async (id) => {
    await axios.delete(`${API}/schedules/${id}`);
    fetchSchedules();
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  return (
    <div className="max-w-xl mx-auto mt-8 p-4 rounded-xl bg-white dark:bg-gray-800 shadow">
      <h2 className="text-2xl font-semibold mb-4">🗓 Schedule a Device</h2>
      <form onSubmit={createSchedule} className="flex gap-3 items-center mb-4 flex-wrap">
        <select value={device} onChange={(e) => setDevice(e.target.value)} className="p-2 rounded border dark:bg-gray-700">
          <option value="light">Light</option>
          <option value="fan">Fan</option>
          <option value="tv">TV</option>
          <option value="ac">AC</option>
          <option value="speaker">Speaker</option>
          <option value="doorLock">Door Lock</option>
          <option value="thermostat">Thermostat</option>
        </select>

        <select value={action} onChange={(e) => setAction(e.target.value)} className="p-2 rounded border dark:bg-gray-700">
          <option value="on">Turn ON</option>
          <option value="off">Turn OFF</option>
        </select>

        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="p-2 border rounded dark:bg-gray-700"
        />

        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Add
        </button>
      </form>

      {schedules.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-bold mb-2">📅 Upcoming Schedules</h3>
          <ul className="space-y-2">
            {schedules.map((s) => (
              <li key={s.id} className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-2 rounded">
                <span>{s.device} → {s.action.toUpperCase()} at {s.time}</span>
                <button onClick={() => deleteSchedule(s.id)} className="text-red-500 hover:underline">
                  Cancel
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
