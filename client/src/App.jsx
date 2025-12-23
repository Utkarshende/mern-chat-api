import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { auth, signInWithGoogle, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { Send, LogOut, MessageCircle, Globe } from "lucide-react";

const socket = io.connect("https://mern-chat-api-7bdr.onrender.com");

function App() {
  const [user, setUser] = useState(null);
  const [room, setRoom] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [typingUser, setTypingUser] = useState("");
  const [isConnected, setIsConnected] = useState(socket.connected);
  
  const scrollRef = useRef(null);
  const messagesRef = collection(db, "messages");

  useEffect(() => {
    onAuthStateChanged(auth, (u) => setUser(u));
    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));
    return () => { socket.off("connect"); socket.off("disconnect"); };
  }, []);

  useEffect(() => {
    if (!showChat || !room) return;
    const q = query(messagesRef, where("room", "==", room), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (s) => {
      setMessageList(s.docs.map(d => ({ ...d.data(), id: d.id })));
    });
    return () => unsub();
  }, [showChat, room]);

  useEffect(() => {
    socket.on("display_typing", (d) => setTypingUser(d.author));
    socket.on("hide_typing", () => setTypingUser(""));
    return () => { socket.off("display_typing"); socket.off("hide_typing"); };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageList, typingUser]);

  const sendMessage = async () => {
    if (currentMessage.trim() !== "") {
      await addDoc(messagesRef, {
        room, 
        author: user.displayName, 
        message: currentMessage, 
        createdAt: serverTimestamp(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
      socket.emit("send_message", { room, message: currentMessage, author: user.displayName });
      setCurrentMessage("");
      socket.emit("stop_typing", { room });
    }
  };

  const handleTyping = (val) => {
    setCurrentMessage(val);
    if (val !== "") {
      socket.emit("typing", { room, author: user.displayName });
    } else {
      socket.emit("stop_typing", { room });
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 font-sans">
      {!showChat ? (
        <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl w-full max-w-sm border border-slate-700 text-center">
          <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <MessageCircle size={32} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-6">VibeChat</h2>
          {!user ? (
            <button onClick={signInWithGoogle} className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 p-4 rounded-xl font-bold hover:bg-slate-100 transition-all">
              <Globe size={20} /> Sign in with Google
            </button>
          ) : (
            <div className="space-y-4">
              <input className="w-full p-4 bg-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Enter Room ID..." onChange={(e) => setRoom(e.target.value)} />
              <button onClick={() => { socket.emit("join_room", room); setShowChat(true); }} className="w-full bg-blue-600 p-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/20">Join Room</button>
              <button onClick={() => signOut(auth)} className="text-slate-500 text-xs uppercase font-bold hover:text-white transition-colors">Sign Out</button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-slate-800 w-full max-w-md h-[650px] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border border-slate-700">
          <div className="p-5 bg-slate-700/50 backdrop-blur-md flex justify-between items-center border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-bold text-white shadow-inner">{room.charAt(0).toUpperCase()}</div>
                <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-800 ${isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
              </div>
              <div>
                <p className="font-bold text-sm">Room: {room}</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{isConnected ? "Connected" : "Reconnecting..."}</p>
              </div>
            </div>
            <button onClick={() => setShowChat(false)} className="p-2 hover:bg-slate-600 rounded-full transition-colors"><LogOut size={20}/></button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-hide bg-slate-900/30">
            {messageList.map((m, i) => (
              <div key={i} className={`flex flex-col ${user.displayName === m.author ? "items-end" : "items-start"}`}>
                <div className={`px-4 py-2 rounded-2xl text-sm max-w-[85%] shadow-sm ${user.displayName === m.author ? "bg-blue-600 text-white rounded-tr-none" : "bg-slate-700 text-slate-100 rounded-tl-none"}`}>
                  <p>{m.message}</p>
                </div>
                <span className="text-[9px] text-slate-500 mt-1 font-bold">{m.author} • {m.time}</span>
              </div>
            ))}
            {typingUser && <p className="text-[10px] italic text-blue-400 font-bold animate-pulse">{typingUser} is typing...</p>}
            <div ref={scrollRef} />
          </div>

          <div className="p-4 bg-slate-800 border-t border-slate-700 flex gap-2">
            <input className="flex-1 bg-slate-900/50 border border-slate-700 p-3 rounded-xl text-sm outline-none focus:border-blue-500 transition-all" placeholder="Type your vibe..." value={currentMessage} 
              onChange={(e) => handleTyping(e.target.value)} 
              onKeyPress={(e) => e.key === "Enter" && sendMessage()} />
            <button onClick={sendMessage} className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-900/20"><Send size={18}/></button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;