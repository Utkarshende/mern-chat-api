import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { Send, LogIn, MessageCircle, ShieldCheck, Circle } from "lucide-react";

const socket = io.connect("http://localhost:5000");

function App() {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [whoIsTyping, setWhoIsTyping] = useState("");
  
  const scrollRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageList, whoIsTyping]);

  const joinRoom = () => {
    if (username !== "" && room !== "") {
      socket.emit("join_room", room);
      setShowChat(true);
    }
  };

  // WhatsApp-style typing trigger
  const handleKeyDown = (e) => {
    if (e.key !== "Enter") {
      socket.emit("typing", { room, author: username });
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stop_typing", { room });
      }, 2000);
    }
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
    socket.on("display_typing", (data) => setWhoIsTyping(data.author));
    socket.on("hide_typing", () => setWhoIsTyping(""));

    return () => {
      socket.off("receive_message");
      socket.off("display_typing");
      socket.off("hide_typing");
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center p-4 font-sans text-slate-800">
      {!showChat ? (
        /* AESTHETIC LOGIN */
        <div className="bg-white p-10 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] w-full max-w-md border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-cyan-400"></div>
          <div className="flex flex-col items-center mb-8">
            <div className="bg-emerald-500 p-4 rounded-2xl shadow-lg shadow-emerald-200 mb-4 transform rotate-3">
              <MessageCircle className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">VibeChat</h1>
            <p className="text-gray-400 text-sm mt-1">Private • Secure • Real-time</p>
          </div>
          <div className="space-y-4">
            <input 
              className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder:text-gray-400" 
              type="text" 
              placeholder="What's your name?" 
              onChange={(e) => setUsername(e.target.value)} 
            />
            <input 
              className="w-full p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder:text-gray-400" 
              type="text" 
              placeholder="Room ID" 
              onChange={(e) => setRoom(e.target.value)} 
            />
            <button 
              onClick={joinRoom} 
              className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-2xl shadow-xl transition-all active:scale-95 flex justify-center items-center gap-2 mt-2"
            >
              Join Experience <LogIn size={20} />
            </button>
          </div>
        </div>
      ) : (
        /* PREMIUM CHAT INTERFACE */
        <div className="bg-white w-full max-w-2xl h-[800px] rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden border border-white">
          {/* Header */}
          <div className="bg-white border-b border-gray-100 p-6 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold text-xl uppercase">
                {room.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-lg text-gray-900 leading-tight tracking-tight">Room: {room}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Circle size={8} className="fill-emerald-500 text-emerald-500 animate-pulse" />
                  <span className="text-emerald-600 text-[10px] font-black uppercase tracking-widest">Active Now</span>
                </div>
              </div>
            </div>
            <div className="hidden sm:flex bg-gray-50 px-4 py-2 rounded-full border border-gray-100 items-center gap-2">
               <ShieldCheck size={16} className="text-emerald-500" />
               <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Secure Link</span>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-[#f8fafc]">
            {messageList.map((msg, index) => (
              <div key={index} className={`flex flex-col ${username === msg.author ? "items-end" : "items-start"}`}>
                <div className={`max-w-[80%] px-6 py-3.5 rounded-3xl text-[15px] shadow-sm leading-relaxed ${
                  username === msg.author 
                    ? "bg-emerald-600 text-white rounded-br-none shadow-emerald-100" 
                    : "bg-white text-gray-800 border border-gray-100 rounded-bl-none"
                }`}>
                  <p>{msg.message}</p>
                </div>
                <div className="flex items-center gap-2 mt-2 px-2">
                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{msg.author}</span>
                   <span className="text-[10px] text-gray-300">•</span>
                   <span className="text-[10px] text-gray-400 font-medium">{msg.time}</span>
                </div>
              </div>
            ))}
            
            {/* WHATSAPP-STYLE TYPING STATUS BUBBLE */}
            {whoIsTyping && (
              <div className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-white px-5 py-3 rounded-full border border-emerald-50 shadow-sm flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-duration:0.6s]"></span>
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:0.1s]"></span>
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:0.2s]"></span>
                  </div>
                  <p className="text-xs font-bold text-emerald-600 italic tracking-tight">
                    {whoIsTyping} is typing...
                  </p>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          {/* Modern Footer Input */}
          <div className="p-6 bg-white border-t border-gray-50">
            <div className="flex gap-3 bg-gray-50 p-2 rounded-[1.8rem] border border-gray-100 focus-within:border-emerald-200 focus-within:ring-4 focus-within:ring-emerald-50 transition-all duration-300">
              <input 
                className="flex-1 bg-transparent px-5 py-3 text-sm outline-none placeholder:text-gray-400" 
                type="text" 
                value={currentMessage} 
                placeholder="Type your message..." 
                onKeyDown={handleKeyDown} 
                onChange={(e) => setCurrentMessage(e.target.value)} 
                onKeyPress={(e) => e.key === "Enter" && sendMessage()} 
              />
              <button 
                onClick={sendMessage} 
                className="bg-emerald-500 hover:bg-emerald-600 text-white p-4 rounded-[1.4rem] transition-all active:scale-90 shadow-lg shadow-emerald-100 flex items-center justify-center"
              >
                <Send size={18} fill="white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;