import { useState, useEffect } from "react";
import io from "socket.io-client";
import { Send, LogIn, MessageSquare } from "lucide-react";

const socket = io.connect("http://localhost:5000");

function App() {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);

  const joinRoom = () => {
    if (username !== "" && room !== "") {
      socket.emit("join_room", room);
      setShowChat(true);
    }
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
    }
  };

  useEffect(() => {
    const handleReceive = (data) => {
      setMessageList((list) => [...list, data]);
    };
    socket.on("receive_message", handleReceive);
    return () => socket.off("receive_message", handleReceive);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {!showChat ? (
        /* JOIN SCREEN */
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
          <div className="flex flex-col items-center mb-6">
            <div className="bg-blue-100 p-3 rounded-full mb-4">
              <MessageSquare className="text-blue-600" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Welcome Back</h1>
            <p className="text-gray-500 text-sm">Join a room to start chatting</p>
          </div>
          
          <div className="space-y-4">
            <input
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              type="text"
              placeholder="Username..."
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              type="text"
              placeholder="Room ID (e.g. 123)..."
              onChange={(e) => setRoom(e.target.value)}
            />
            <button 
              onClick={joinRoom}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              Join Room <LogIn size={18} />
            </button>
          </div>
        </div>
      ) : (
        /* CHAT SCREEN */
        <div className="bg-white w-full max-w-md h-[600px] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="bg-blue-600 p-4 text-white flex justify-between items-center shadow-md">
            <div>
              <p className="font-bold text-lg">Room: {room}</p>
              <p className="text-xs text-blue-100">Logged in as {username}</p>
            </div>
            <div className="h-3 w-3 bg-green-400 rounded-full animate-pulse"></div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messageList.map((msg, index) => (
              <div 
                key={index}
                className={`flex flex-col ${username === msg.author ? "items-end" : "items-start"}`}
              >
                <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm shadow-sm ${
                  username === msg.author 
                    ? "bg-blue-600 text-white rounded-br-none" 
                    : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"
                }`}>
                  <p>{msg.message}</p>
                </div>
                <span className="text-[10px] text-gray-400 mt-1 px-1">
                  {msg.time} • {msg.author}
                </span>
              </div>
            ))}
          </div>

          {/* Footer Input */}
          <div className="p-4 bg-white border-t border-gray-100 flex gap-2">
            <input
              className="flex-1 bg-gray-100 p-3 rounded-full text-sm outline-none focus:ring-1 focus:ring-blue-400"
              type="text"
              value={currentMessage}
              placeholder="Type a message..."
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            />
            <button 
              onClick={sendMessage}
              className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition-transform active:scale-95"
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