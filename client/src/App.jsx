import { useState, useEffect } from "react";
import io from "socket.io-client";
import { MessageCircle, Send, User, LogIn } from "lucide-react";

// Connect to the backend
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
        time: new Date(Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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
  }, [socket]);

  return (
    <div style={styles.container}>
      {!showChat ? (
        <div style={styles.joinContainer}>
          <h3 style={{ marginBottom: '20px' }}>Join A Chat</h3>
          <input
            type="text"
            placeholder="John Doe..."
            style={styles.input}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="text"
            placeholder="Room ID..."
            style={styles.input}
            onChange={(e) => setRoom(e.target.value)}
          />
          <button style={styles.button} onClick={joinRoom}>
            Join Room <LogIn size={18} style={{marginLeft: '8px'}} />
          </button>
        </div>
      ) : (
        <div style={styles.chatWindow}>
          <div style={styles.chatHeader}>
            <p>Live Chat | Room: {room}</p>
          </div>
          <div style={styles.chatBody}>
            {messageList.map((msgContent, index) => (
              <div 
                key={index} 
                style={{
                  ...styles.message,
                  alignSelf: username === msgContent.author ? 'flex-end' : 'flex-start',
                  backgroundColor: username === msgContent.author ? '#4a90e2' : '#e5e5ea',
                  color: username === msgContent.author ? 'white' : 'black',
                }}
              >
                <div>
                  <div style={styles.messageContent}>{msgContent.message}</div>
                  <div style={styles.messageMeta}>
                    {msgContent.time} • {msgContent.author}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={styles.chatFooter}>
            <input
              type="text"
              value={currentMessage}
              placeholder="Hey..."
              style={styles.chatInput}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            />
            <button style={styles.sendButton} onClick={sendMessage}>
              <Send size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple Inline Styles for a clean look
const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f2f5', fontFamily: 'Arial' },
  joinContainer: { display: 'flex', flexDirection: 'column', padding: '40px', background: 'white', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
  input: { padding: '12px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px' },
  button: { padding: '12px', backgroundColor: '#4a90e2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  chatWindow: { width: '400px', height: '500px', display: 'flex', flexDirection: 'column', background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
  chatHeader: { padding: '15px', background: '#2c3e50', color: 'white', fontWeight: 'bold' },
  chatBody: { flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' },
  message: { padding: '10px', borderRadius: '8px', maxWidth: '70%', wordBreak: 'break-word' },
  messageMeta: { fontSize: '10px', marginTop: '5px', opacity: 0.7 },
  chatFooter: { display: 'flex', padding: '15px', borderTop: '1px solid #ddd' },
  chatInput: { flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '4px', outline: 'none' },
  sendButton: { background: 'none', border: 'none', color: '#4a90e2', marginLeft: '10px', cursor: 'pointer' }
};

export default App;