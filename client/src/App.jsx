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
  
  const [isTyping, setIsTyping] = useState(false);
  const [whoIsTyping, setWhoIsTyping] = useState("");
  const typingTimeoutRef = useRef(null);
  const scrollRef = useRef(null);

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
    socket.on("display_typing", (data) => {
      setWhoIsTyping(data.author);
      setIsTyping(true);
    });
    socket.on("hide_typing", () => setIsTyping(false));

    return () => {
      socket.off("receive_message");
      socket.off("display_typing");
      socket.off("hide_typing");
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-200 flex items-center justify-center p-4 font-sans text-slate-900">
      {!showChat ? (
        <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-indigo-600 p-4 rounded-full shadow-lg mb-4">
              <MessageSquare className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">QuickChat</h1>
          </div>
          <div className="space-y-4">
            <input className="w-full p-4 border rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none" type="text" placeholder="Your Name" onChange={(e) => setUsername(e.target.value)} />
            <input className="w-full p-4 border rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none" type="text" placeholder="Room ID" onChange={(e) => setRoom(e.target.value)} />
            <button onClick={joinRoom} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-95 flex justify-center items-center gap-2">
              Start Chatting <LogIn size={20} />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white w-full max-w-lg h-[700px] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-white">
          <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
            <div>
              <p className="font-bold text-xl leading-tight">Room: {room}</p>
              <p className="text-indigo-200 text-xs mt-1">Chatting as {username}</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
            {messageList.map((msg, index) => (
              <div key={index} className={`flex flex-col ${username === msg.author ? "items-end" : "items-start"}`}>
                <div className={`max-w-[85%] px-5 py-3 rounded-3xl text-sm shadow-sm ${username === msg.author ? "bg-indigo-600 text-white rounded-tr-none" : "bg-white text-slate-800 border rounded-tl-none"}`}>
                  <p>{msg.message}</p>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 font-bold uppercase ml-2 mr-2">{msg.author} • {msg.time}</span>
              </div>
            ))}
            
            {/* ENHANCED VISUAL TYPING INDICATOR */}
            {isTyping && (
              <div className="flex items-center gap-3 py-3 px-4 bg-white w-fit rounded-2xl shadow-sm border border-indigo-100 mt-2 ml-2">
                <div className="flex gap-1.5">
                   <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce [animation-duration:0.6s]"></span>
                   <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:0.1s]"></span>
                   <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:0.2s]"></span>
                </div>
                <p className="text-sm font-semibold text-indigo-600 italic leading-none">
                  {whoIsTyping} is typing...
                </p>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          <div className="p-5 bg-white border-t border-slate-100 flex gap-3 items-center">
            <input className="flex-1 bg-slate-100 p-4 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all" type="text" value={currentMessage} placeholder="Say something..." onKeyDown={handleTyping} onChange={(e) => setCurrentMessage(e.target.value)} onKeyPress={(e) => e.key === "Enter" && sendMessage()} />
            <button onClick={sendMessage} className="bg-indigo-600 text-white p-4 rounded-2xl hover:bg-indigo-700 transition-all active:scale-90 shadow-lg shadow-indigo-100">
              <Send size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;