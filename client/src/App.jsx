import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { Send, LogIn, MessageSquare } from "lucide-react";

const socket = io.connect("http://localhost:5000");

function App() {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  
  // Typing States
  const [isTyping, setIsTyping] = useState(false);
  const [whoIsTyping, setWhoIsTyping] = useState("");
  const typingTimeoutRef = useRef(null);
  const scrollRef = useRef(null);

  // Auto-scroll to bottom whenever messageList changes
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageList, isTyping]);

  const joinRoom = () => {
    if (username !== "" && room !== "") {
      socket.emit("join_room", room);
      setShowChat(true);
    }
  };

  const handleTyping = () => {
    socket.emit("typing", { room, author: username });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop_typing", { room });
    }, 2000);
  };

  const sendMessage = async () => {
    if (currentMessage !== "") {
      const messageData = {
        room: room,
        author: username,
        message: currentMessage,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      await socket.emit("send_message", messageData);
      setMessageList((list) => [...list, messageData]);
      setCurrentMessage("");
      socket.emit("stop_typing", { room }); // Stop typing immediately on send
    }
  };

  useEffect(() => {
    socket.on("receive_message", (data) => {
      setMessageList((list) => [...list, data]);
    });

    socket.on("display_typing", (data) => {
      setWhoIsTyping(`${data.author} is typing...`);
      setIsTyping(true);
    });

    socket.on("hide_typing", () => {
      setIsTyping(false);
    });

    return () => {
      socket.off("receive_message");
      socket.off("display_typing");
      socket.off("hide_typing");
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
      {!showChat ? (
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-indigo-600 p-4 rounded-2xl shadow-lg shadow-indigo-200 mb-4">
              <MessageSquare className="text-white" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">QuickChat</h1>
            <p className="text-slate-500">Enter details to start messaging</p>
          </div>
          
          <div className="space-y-4">
            <input
              className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              type="text"
              placeholder="Your Name"
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              type="text"
              placeholder="Room ID"
              onChange={(e) => setRoom(e.target.value)}
            />
            <button 
              onClick={joinRoom}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              Join Chat <LogIn size={18} />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white w-full max-w-md h-[650px] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
          {/* Header */}
          <div className="bg-indigo-600 p-5 text-white flex justify-between items-center">
            <div>
              <p className="font-bold text-lg">Room: {room}</p>
              <p className="text-xs text-indigo-100 opacity-80">User: {username}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-indigo-500 px-2 py-1 rounded-full text-indigo-100">Live</span>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messageList.map((msg, index) => (
              <div 
                key={index}
                className={`flex flex-col ${username === msg.author ? "items-end" : "items-start"}`}
              >
                <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm shadow-sm ${
                  username === msg.author 
                    ? "bg-indigo-600 text-white rounded-tr-none" 
                    : "bg-white text-slate-800 border border-slate-200 rounded-tl-none"
                }`}>
                  <p>{msg.message}</p>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-semibold px-1">
                  {msg.author} • {msg.time}
                </span>
              </div>
            ))}
            
            {/* Typing Indicator Display */}
            {isTyping && (
              <div className="flex items-center gap-2 text-slate-400 animate-pulse">
                <div className="flex gap-1">
                   <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce"></span>
                   <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                   <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
                <p className="text-xs italic">{whoIsTyping}</p>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          {/* Footer Input */}
          <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
            <input
              className="flex-1 bg-slate-100 p-3 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
              type="text"
              value={currentMessage}
              placeholder="Type your message..."
              onKeyDown={handleTyping}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            />
            <button 
              onClick={sendMessage}
              className="bg-indigo-600 text-white p-3 rounded-2xl hover:bg-indigo-700 transition-all active:scale-90"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;