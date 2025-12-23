import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { auth, signInWithGoogle, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { Send, LogOut, MessageSquare } from "lucide-react";

// EXACT URL from your error message
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
    const unsub = onSnapshot(q, (s) => setMessageList(s.docs.map(d => ({ ...d.data(), id: d.id }))));
    return () => unsub();
  }, [showChat, room]);

  useEffect(() => {
    socket.on("display_typing", (d) => setTypingUser(d.author));
    socket.on("hide_typing", () => setTypingUser(""));
    return () => { socket.off("display_typing"); socket.off("hide_typing"); };
  }, []);

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
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
      {!showChat ? (
        <div className="bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-sm text-center">
          <h2 className="text-2xl font-bold mb-6">VibeChat</h2>
          {!user ? (
            <button onClick={signInWithGoogle} className="w-full bg-white text-black p-3 rounded-lg font-bold">Sign in with Google</button>
          ) : (
            <div className="space-y-4">
              <input className="w-full p-3 bg-slate-700 rounded-lg outline-none" placeholder="Room ID" onChange={(e) => setRoom(e.target.value)} />
              <button onClick={() => { socket.emit("join_room", room); setShowChat(true); }} className="w-full bg-blue-600 p-3 rounded-lg font-bold">Join Room</button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-slate-800 w-full max-w-md h-[600px] rounded-2xl flex flex-col overflow-hidden">
          <div className="p-4 bg-slate-700 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
              <span className="font-bold">Room: {room}</span>
            </div>
            <button onClick={() => setShowChat(false)}><LogOut size={18}/></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messageList.map((m, i) => (
              <div key={i} className={`flex ${user.displayName === m.author ? "justify-end" : "justify-start"}`}>
                <div className={`p-2 rounded-lg text-sm ${user.displayName === m.author ? "bg-blue-600" : "bg-slate-700"}`}>
                  <p className="text-[10px] opacity-50">{m.author}</p>
                  <p>{m.message}</p>
                </div>
              </div>
            ))}
            {typingUser && <p className="text-xs italic text-blue-400">{typingUser} is typing...</p>}
            <div ref={scrollRef} />
          </div>
          <div className="p-4 border-t border-slate-700 flex gap-2">
            <input className="flex-1 bg-slate-700 p-2 rounded-lg outline-none" placeholder="Message..." value={currentMessage} 
              onChange={(e) => { setCurrentMessage(e.target.value); socket.emit("typing", {room, author: user.displayName}); }} 
              onKeyPress={(e) => e.key === "Enter" && sendMessage()} />
            <button onClick={sendMessage} className="bg-blue-600 p-2 rounded-lg"><Send size={18}/></button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;