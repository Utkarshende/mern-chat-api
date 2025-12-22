import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { Send, LogIn } from "lucide-react";

const socket = io.connect("http://localhost:5000");

function App() {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [typingStatus, setTypingStatus] = useState("");
  
  const scrollRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageList, typingStatus]);

  const joinRoom = () => {
    if (username !== "" && room !== "") {
      socket.emit("join_room", room);
      setShowChat(true);
    }
  };

  const sendTypingEvent = () => {
    socket.emit("typing", { room, author: username });
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop_typing", { room });
    }, 1500);
  };

  const sendMessage = async () => {
    if (currentMessage !== "") {
      const messageData = {
        room,
        author: username,
        message: currentMessage,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      await socket.emit("send_message", messageData);
      setMessageList((list) => [...list, messageData]);
      setCurrentMessage("");
      socket.emit("stop_typing", { room });
    }
  };

  useEffect(() => {
    socket.on("receive_message", (data) => setMessageList((list) => [...list, data]));
    socket.on("display_typing", (data) => setTypingStatus(`${data.author} is typing...`));
    socket.on("hide_typing", () => setTypingStatus(""));

    return () => {
      socket.off("receive_message");
      socket.off("display_typing");
      socket.off("hide_typing");
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      {!showChat ? (
        /* SIMPLE JOIN SCREEN */
        <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
          <h2 className="text-xl font-bold mb-4 text-center">Simple Chat</h2>
          <div className="space-y-3">
            <input 
              className="w-full p-2 border rounded outline-none focus:border-blue-500" 
              placeholder="Name..." 
              onChange={(e) => setUsername(e.target.value)} 
            />
            <input 
              className="w-full p-2 border rounded outline-none focus:border-blue-500" 
              placeholder="Room ID..." 
              onChange={(e) => setRoom(e.target.value)} 
            />
            <button 
              onClick={joinRoom} 
              className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 flex justify-center items-center gap-2"
            >
              Join <LogIn size={18} />
            </button>
          </div>
        </div>
      ) : (
        /* SIMPLE CHAT SCREEN */
        <div className="bg-white w-full max-w-md h-[500px] rounded-lg shadow-lg flex flex-col overflow-hidden">
          <div className="bg-blue-500 p-4 text-white font-bold flex justify-between">
            <span>Room: {room}</span>
            <span className="text-xs font-normal">Logged in as: {username}</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messageList.map((msg, index) => (
              <div key={index} className={`flex flex-col ${username === msg.author ? "items-end" : "items-start"}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                  username === msg.author ? "bg-blue-500 text-white" : "bg-white border text-gray-800"
                }`}>
                  <p>{msg.message}</p>
                </div>
                <span className="text-[10px] text-gray-400 mt-1 uppercase">{msg.author} • {msg.time}</span>
              </div>
            ))}
            
            {/* TYPING STATUS */}
            {typingStatus && (
              <div className="text-xs text-gray-400 italic py-1 animate-pulse">
                {typingStatus}
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          <div className="p-3 border-t flex gap-2">
            <input 
              className="flex-1 border p-2 rounded outline-none focus:border-blue-500 text-sm" 
              type="text" 
              value={currentMessage} 
              placeholder="Type..." 
              onChange={(e) => {
                setCurrentMessage(e.target.value);
                sendTypingEvent();
              }} 
              onKeyPress={(e) => e.key === "Enter" && sendMessage()} 
            />
            <button onClick={sendMessage} className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;