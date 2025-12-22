import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { Send, LogIn, LogOut } from "lucide-react";

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

  // Function to leave the chat and reset UI
  const leaveChat = () => {
    socket.emit("leave_room", room);
    setShowChat(false);
    setMessageList([]);
    setTypingStatus("");
    setRoom("");
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
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
      {!showChat ? (
        /* SIMPLE JOIN SCREEN */
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm border border-gray-200">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 tracking-tight">SimpleChat</h2>
          <div className="space-y-4">
            <input 
              className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-400 transition-all" 
              placeholder="Your Name..." 
              onChange={(e) => setUsername(e.target.value)} 
            />
            <input 
              className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-400 transition-all" 
              placeholder="Room ID..." 
              onChange={(e) => setRoom(e.target.value)} 
            />
            <button 
              onClick={joinRoom} 
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 flex justify-center items-center gap-2 shadow-md active:scale-95 transition-all"
            >
              Join Room <LogIn size={20} />
            </button>
          </div>
        </div>
      ) : (
        /* SIMPLE CHAT SCREEN */
        <div className="bg-white w-full max-w-md h-[600px] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
          {/* Header with Exit Button */}
          <div className="bg-blue-600 p-4 text-white flex justify-between items-center shadow-md">
            <div>
              <p className="font-bold text-lg leading-none">Room: {room}</p>
              <p className="text-[10px] mt-1 opacity-80 uppercase font-bold">User: {username}</p>
            </div>
            <button 
              onClick={leaveChat}
              className="p-2 hover:bg-blue-700 rounded-full transition-colors group relative"
              title="Leave Room"
            >
              <LogOut size={20} />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messageList.map((msg, index) => (
              <div key={index} className={`flex flex-col ${username === msg.author ? "items-end" : "items-start"}`}>
                <div className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm shadow-sm ${
                  username === msg.author ? "bg-blue-600 text-white rounded-tr-none" : "bg-white border border-gray-200 text-gray-800 rounded-tl-none"
                }`}>
                  <p>{msg.message}</p>
                </div>
                <span className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-tighter px-1">{msg.author} • {msg.time}</span>
              </div>
            ))}
            
            {/* TYPING STATUS */}
            {typingStatus && (
              <div className="flex items-center gap-2 py-1 px-2">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                </div>
                <span className="text-xs text-gray-400 italic font-medium">{typingStatus}</span>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          {/* Footer Input */}
          <div className="p-4 border-t bg-white flex gap-2 items-center">
            <input 
              className="flex-1 bg-gray-100 p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-blue-400 transition-all" 
              type="text" 
              value={currentMessage} 
              placeholder="Type your message..." 
              onChange={(e) => {
                setCurrentMessage(e.target.value);
                sendTypingEvent();
              }} 
              onKeyPress={(e) => e.key === "Enter" && sendMessage()} 
            />
            <button 
              onClick={sendMessage} 
              className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 active:scale-90 transition-all shadow-md"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;