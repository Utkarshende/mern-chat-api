import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { auth, signInWithGoogle, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { 
  collection, addDoc, query, where, orderBy, 
  onSnapshot, serverTimestamp 
} from "firebase/firestore";
import { Send, LogOut, Globe, AlertCircle } from "lucide-react";

// REPLACE WITH YOUR ACTUAL RENDER URL
const socket = io.connect("https://mern-chat-api-7bdr.onrender.com");

function App() {
  const [user, setUser] = useState(null);
  const [room, setRoom] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [typingUser, setTypingUser] = useState("");
  const [error, setError] = useState("");
  const [isConnected, setIsConnected] = useState(socket.connected);
  
  const scrollRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messagesRef = collection(db, "messages");

  // Auth & Connection Listeners
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    
    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));

    return () => {
      unsubscribe();
      socket.off("connect");
      socket.off("disconnect");
    };
  }, []);

  // Real-time Firestore Sync
  useEffect(() => {
    if (!showChat || !room) return;
    const q = query(messagesRef, where("room", "==", room), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessageList(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    }, (err) => setError("Firestore Error: Create an Index if you see a link in console."));
    return () => unsubscribe();
  }, [showChat, room]);

  // Socket Events
  useEffect(() => {
    socket.on("display_typing", (data) => setTypingUser(data.author));
    socket.on("hide_typing", () => setTypingUser(""));
    return () => {
      socket.off("display_typing");
      socket.off("hide_typing");
    };
  }, []);

  useEffect(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), [messageList, typingUser]);

  const handleLogin = async () => {
    try { await signInWithGoogle(); } catch (err) { setError("Login failed: Enable Google Auth in Firebase."); }
  };

  const joinRoom = () => {
    if (user && room !== "") {
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

  const handleTyping = () => {
    socket.emit("typing", { room, author: user.displayName });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => socket.emit("stop_typing", { room }), 1500);
  };

  const sendMessage = async () => {
    if (currentMessage !== "") {
      await addDoc(messagesRef, {
        room, author: user.displayName, image: user.photoURL,
        message: currentMessage, createdAt: serverTimestamp(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
      setCurrentMessage("");
      socket.emit("stop_typing", { room });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-900">
      {!showChat ? (
        <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm border border-slate-100 text-center">
          <div className="bg-indigo-600 p-3 rounded-2xl mb-3 shadow-lg inline-block text-white">
            <Globe size={28} />
          </div>
          <h2 className="text-2xl font-bold mb-6">VibeChat</h2>
          {error && <p className="text-red-500 text-xs mb-4">{error}</p>}

          {!user ? (
            <button onClick={handleLogin} className="w-full flex items-center justify-center gap-3 border p-3 rounded-xl hover:bg-slate-50 transition-all font-semibold">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/layout/google.svg" width="20" alt="google" />
              Sign in with Google
            </button>
          ) : (
            <div className="space-y-4">
              <input className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Room ID" onChange={(e) => setRoom(e.target.value)} />
              <button onClick={joinRoom} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-all">Join Room</button>
              <button onClick={() => signOut(auth)} className="text-slate-400 text-[10px] uppercase font-bold">Sign Out</button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white w-full max-w-md h-[650px] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden">
          {/* HEADER WITH STATUS DOT */}
          <div className="bg-indigo-600 p-5 text-white flex justify-between items-center shadow-md">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold">
                  {room.charAt(0).toUpperCase()}
                </div>
                <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-indigo-600 ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
              </div>
              <div>
                <p className="font-bold leading-none">Room: {room}</p>
                <p className="text-[9px] opacity-70 mt-1 uppercase font-bold tracking-widest">{isConnected ? "Online" : "Waking up..."}</p>
              </div>
            </div>
            <button onClick={leaveChat} className="p-2 hover:bg-indigo-700 rounded-full"><LogOut size={20} /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50">
            {messageList.map((msg, index) => (
              <div key={index} className={`flex flex-col ${user.displayName === msg.author ? "items-end" : "items-start"}`}>
                <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${user.displayName === msg.author ? "bg-indigo-600 text-white rounded-tr-none" : "bg-white border text-slate-800 rounded-tl-none"}`}>
                  <p>{msg.message}</p>
                </div>
                <span className="text-[9px] text-slate-400 mt-1 font-bold">{msg.author} • {msg.time}</span>
              </div>
            ))}
            {typingUser && <p className="text-[10px] italic text-indigo-500 font-bold animate-pulse">{typingUser} is typing...</p>}
            <div ref={scrollRef} />
          </div>

          <div className="p-4 bg-white border-t flex gap-2">
            <input className="flex-1 bg-slate-100 p-3 rounded-2xl text-sm outline-none" placeholder="Message..." value={currentMessage} onChange={(e) => { setCurrentMessage(e.target.value); handleTyping(); }} onKeyPress={(e) => e.key === "Enter" && sendMessage()} />
            <button onClick={sendMessage} className="bg-indigo-600 text-white p-3 rounded-2xl active:scale-90"><Send size={18} /></button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;