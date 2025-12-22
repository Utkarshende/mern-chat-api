# 💬 VibeChat | Real-Time MERN Chat App

VibeChat is a modern, real-time chat application built with the MERN stack. It features persistent chat history using **Firebase Firestore**, secure **Google Authentication**, and real-time typing indicators powered by **Socket.io**.

---

## ✨ Features

* 🔐 **Google Authentication**: Secure login via Firebase Auth.
* 💬 **Persistent History**: Messages are saved in Cloud Firestore and synced across devices.
* ⌨️ **Real-time Typing Status**: See when others are typing (WhatsApp style).
* 🚪 **Room Logic**: Join specific rooms using unique IDs.
* 📱 **Responsive Design**: Minimalist, mobile-friendly UI built with Tailwind CSS.
* 🚀 **Instant Messaging**: Real-time communication using Socket.io.

---

## 🛠️ Tech Stack

**Frontend:**
* React.js
* Tailwind CSS
* Lucide React (Icons)
* Firebase (Auth & Firestore)
* Socket.io-client

**Backend:**
* Node.js
* Express.js
* Socket.io (Server)

---
⚙️ Firebase Setup
To get this app running, you need to enable the following in your Firebase Console:

Authentication: Enable Google Sign-in.

Firestore Database:

Create a database in Test Mode.

Create a collection named messages.

Add an index for room and createdAt (check browser console for the direct link).

📜 Future Roadmap
[ ] Image & File sharing.

[ ] Last seen / Online status.

[ ] Dark Mode support.

[ ] Private one-to-one messaging.

🤝 Contributing
Feel free to fork this project and submit pull requests!

