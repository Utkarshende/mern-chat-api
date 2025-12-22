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
  
  const [typingUser, setTypingUser] = useState("");
  const typingTimeoutRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageList, typingUser]);

  const joinRoom = () => {
    if (username !== "" && room !== "") {
      socket.emit("join_room", room);
      setShowChat(true);
    }
  };

  const leaveChat = () => {
    socket.emit("leave_room", room);
    setShowChat(false);
    setMessageList([]);
    setRoom("");
  };

  // BROADCAST TYPING
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
    socket.on("receive_message", (data) => {
      setMessageList((list) => [...list, data]);
    });
    
    socket.on("display_typing", (data) => {
      console.log("Typing event received for:", data.author);
      setTypingUser(data.author);
    });

    socket.on("hide_typing", () => {
      setTypingUser("");
    });

    return () => {
      socket.off("receive_message");
      socket.off("display_typing");
      socket.off("hide_typing");
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans text-slate-900">
      {!showChat ? (
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm border">
          <h2 className="text-2xl font-black mb-6 text-center text-slate-800">Chat App</h2>
          <div className="space-y-4">
            <input className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Your Name" onChange={(e) => setUsername(e.target.value)} />
            <input className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Room ID" onChange={(e) => setRoom(e.target.value)} />
            <button onClick={joinRoom} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all active:scale-95 flex justify-center items-center gap-2">
              Join <LogIn size={20} />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white w-full max-w-md h-[600px] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-white relative">
          <div className="bg-blue-600 p-5 text-white flex justify-between items-center z-10">
            <div>
              <p className="font-bold text-lg leading-none italic">Room: {room}</p>
              <p className="text-[10px] mt-1 opacity-70 uppercase font-black">{username}</p>
            </div>
            <button onClick={leaveChat} className="p-2 hover:bg-blue-700 rounded-full transition-all">
              <LogOut size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50 relative">
            {messageList.map((msg, index) => (
              <div key={index} className={`flex flex-col ${username === msg.author ? "items-end" : "items-start"}`}>
                <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                  username === msg.author ? "bg-blue-600 text-white rounded-tr-none" : "bg-white border text-slate-800 rounded-tl-none"
                }`}>
                  <p>{msg.message}</p>
                </div>
                <span className="text-[9px] text-slate-400 mt-1 font-bold uppercase tracking-widest px-1">{msg.author} • {msg.time}</span>
              </div>
            ))}
            
            {/* THE TYPING BUBBLE - Positioned clearly above the input area */}
            {typingUser && (
              <div className="flex items-center gap-2 bg-white border border-blue-100 w-fit px-4 py-2 rounded-full shadow-sm animate-bounce">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse [animation-delay:0.2s]"></span>
                </div>
                <p className="text-[11px] font-bold text-blue-600 italic">
                  {typingUser} is typing...
                </p>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          <div className="p-4 bg-white border-t flex flex-col gap-2">
            <div className="flex gap-2 items-center">
              <input 
                className="flex-1 bg-slate-100 p-3 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-400" 
                type="text" 
                value={currentMessage} 
                placeholder="Type a message..." 
                onChange={(e) => {
                  setCurrentMessage(e.target.value);
                  handleTyping(); // This triggers the socket event
                }} 
                onKeyPress={(e) => e.key === "Enter" && sendMessage()} 
              />
              <button onClick={sendMessage} className="bg-blue-600 text-white p-3 rounded-2xl hover:bg-blue-700 active:scale-90 shadow-md">
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;