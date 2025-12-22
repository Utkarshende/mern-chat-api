import { useEffect, useState } from "react";
import io from "socket.io-client";

// Connect to your Node server port
const socket = io.connect("http://localhost:5000");

function App() {
  const [status, setStatus] = useState("Connecting...");

  useEffect(() => {
    socket.on("connect", () => {
      setStatus("Connected to Server! ✅");
    });

    return () => socket.off("connect");
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Chat App</h1>
      <p>Status: {status}</p>
    </div>
  );
}

export default App;