import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { auth, signInWithGoogle, db } from "./firebase"; // Importing 'db' here
import { onAuthStateChanged, signOut } from "firebase/auth";
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp 
} from "firebase/firestore";
import { Send, LogIn, LogOut, Globe, ShieldCheck } from "lucide-react";

const socket = io.connect("http://localhost:5000");

function App() {
  const [user, setUser] = useState(null);
  const [room, setRoom] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [typingUser, setTypingUser] = useState("");
  
  const scrollRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messagesRef = collection(db, "messages");

  // 1. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // 2. Real-time Message History (Firestore)
  useEffect(() => {
    if (!showChat || !room) return;

    const q = query(
      messagesRef,
      where("room", "==", room),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let messages = [];
      snapshot.forEach((doc) => {
        messages.push({ ...doc.data(), id: doc.id });
      });
      setMessageList(messages);
    });

    return () => unsubscribe();
  }, [showChat, room]);

  // 3. Socket Listener (For live Typing status only)
  useEffect(() => {
    socket.on("display_typing", (data) => setTypingUser(data.author));
    socket.on("hide_typing", () => setTypingUser(""));

    return () => {
      socket.off("display_typing");
      socket.off("hide_typing");
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageList, typingUser]);

  const handleLogin = async () => {
    try { await signInWithGoogle(); } catch (err) { console.error(err); }
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
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop_typing", { room });
    }, 1500);
  };

  const sendMessage = async () => {
    if (currentMessage !== "") {
      await addDoc(messagesRef, {
        room,
        author: user.displayName,
        image: user.photoURL,
        message: currentMessage,
        createdAt: serverTimestamp(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
      setCurrentMessage("");
      socket.emit("stop_typing", { room });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-900">
      {!showChat ? (
        <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm border border-slate-100">
          <div className="flex flex-col items-center mb-6">
            <div className="bg-indigo-600 p-3 rounded-2xl mb-3 shadow-lg">
              <Globe className="text-white" size={28} />
            </div>
            <h2 className="text-2xl font-bold">VibeChat</h2>
          </div>

          {!user ? (
            <button onClick={handleLogin} className="w-full flex items-center justify-center gap-3 border border-slate-300 p-3 rounded-xl hover:bg-slate-50 transition-all font-semibold">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/layout/google.svg" width="20" alt="google" />
              Sign in with Google
            </button>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <img src={user.photoURL} className="w-10 h-10 rounded-full" alt="profile" />
                <div>
                  <p className="text-sm font-bold leading-none">{user.displayName}</p>
                  <p className="text-[10px] text-emerald-500 mt-1 font-black uppercase">Online</p>
                </div>
              </div>
              <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Enter Room ID" onChange={(e) => setRoom(e.target.value)} />
              <button onClick={joinRoom} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-md transition-all active:scale-95">
                Join Chat
              </button>
              <button onClick={() => signOut(auth)} className="w-full text-slate-300 text-xs hover:text-red-400">Sign Out</button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white w-full max-w-md h-[650px] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-white">
          <div className="bg-indigo-600 p-5 text-white flex justify-between items-center shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold">{room.charAt(0).toUpperCase()}</div>
              <p className="font-bold">Room: {room}</p>
            </div>
            <button onClick={leaveChat} className="p-2 hover:bg-indigo-700 rounded-full transition-all"><LogOut size={20} /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50">
            {messageList.map((msg, index) => (
              <div key={index} className={`flex flex-col ${user.displayName === msg.author ? "items-end" : "items-start"}`}>
                <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                  user.displayName === msg.author ? "bg-indigo-600 text-white rounded-tr-none" : "bg-white border text-slate-800 rounded-tl-none"
                }`}>
                  <p>{msg.message}</p>
                </div>
                <div className="flex items-center gap-1.5 mt-1 px-1">
                  {user.displayName !== msg.author && <img src={msg.image} className="w-3.5 h-3.5 rounded-full" alt="avatar"/>}
                  <span className="text-[9px] text-slate-400 font-bold uppercase">{msg.author} • {msg.time}</span>
                </div>
              </div>
            ))}
            
            {typingUser && (
              <div className="flex items-center gap-2 bg-white border border-indigo-50 w-fit px-4 py-2 rounded-full shadow-sm animate-pulse">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.1s]"></span>
                </div>
                <p className="text-[11px] font-bold text-indigo-500 italic">{typingUser} is typing...</p>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          <div className="p-4 bg-white border-t flex gap-2">
            <input className="flex-1 bg-slate-100 p-3 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-400" type="text" value={currentMessage} placeholder="Message..." onChange={(e) => { setCurrentMessage(e.target.value); handleTyping(); }} onKeyPress={(e) => e.key === "Enter" && sendMessage()} />
            <button onClick={sendMessage} className="bg-indigo-600 text-white p-3 rounded-2xl hover:bg-indigo-700 active:scale-90"><Send size={18} /></button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;