import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import "./App.css";

function App() {

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [listening, setListening] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [chats, setChats] = useState(() => {

    const savedChats = localStorage.getItem("meena-chats");

    return savedChats
      ? JSON.parse(savedChats)
      : [
          {
            id: 1,
            title: "New Chat",
            messages: [
              {
                text: "Hi Meena 🌸 I’m Chatuu. Ask me anything!",
                sender: "ai",
              },
            ],
          },
        ];
  });

  const [activeChatId, setActiveChatId] = useState(() => {

    const savedActiveChatId =
      localStorage.getItem("meena-active-chat");

    return savedActiveChatId
      ? Number(savedActiveChatId)
      : 1;
  });

  const chatEndRef = useRef(null);

  const activeChat =
    chats.find((chat) => chat.id === activeChatId)
    || chats[0];

  const messages = activeChat?.messages || [];

  useEffect(() => {

    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });

  }, [messages, loading]);

  useEffect(() => {

    localStorage.setItem(
      "meena-chats",
      JSON.stringify(chats)
    );

  }, [chats]);

  useEffect(() => {

    localStorage.setItem(
      "meena-active-chat",
      activeChatId
    );

  }, [activeChatId]);

useEffect(() => {
  const savedToken = localStorage.getItem("token");
  const savedName = localStorage.getItem("name");

  if (savedToken) {
    setIsLoggedIn(true);
    setName(savedName || "");
  }
}, []);

  const updateActiveChatMessages = (newMessages) => {

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === activeChat.id
          ? {
              ...chat,
              messages: newMessages,
            }
          : chat
      )
    );
  };

  const newChat = () => {

    const newId = Date.now();

    const newChatData = {
      id: newId,
      title: "New Chat",
      messages: [
        {
          text: "Hi Meena 🌸 I’m Chatuu. Ask me anything!",
          sender: "ai",
        },
      ],
    };

    setChats((prev) => [
      newChatData,
      ...prev,
    ]);

    setActiveChatId(newId);

    setInput("");
  };
  const startListening = () => {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert("Speech Recognition not supported 😭 Use Chrome or Edge.");
    return;
  }

  const recognition = new SpeechRecognition();

  recognition.lang = "en-IN";
  recognition.continuous = false;
  recognition.interimResults = true;

  recognition.onstart = () => {
    setListening(true);
    console.log("Listening started...");
  };

  recognition.onresult = (event) => {
    const speechText = event.results[0][0].transcript;
    setInput(speechText);
    console.log("You said:", speechText);
  };

  recognition.onerror = (event) => {
    console.log("Voice error:", event.error);
    setListening(false);
  };

  recognition.onend = () => {
    setListening(false);
    console.log("Listening stopped");
  };

  recognition.start();
};

  const sendMessage = async () => {

  if (input.trim() === "" || loading)
    return;

  const currentInput = input;

  const userMessage = {
    text: currentInput,
    sender: "user",
  };

  const updatedMessages = [
    ...messages,
    userMessage,
  ];

  updateActiveChatMessages(updatedMessages);

  setChats((prev) =>
    prev.map((chat) =>
      chat.id === activeChat.id &&
      chat.title === "New Chat"
        ? {
            ...chat,
            title: currentInput.slice(0, 25),
          }
        : chat
    )
  );

  setInput("");

  setLoading(true);

  try {

    let data;

    if (pdfFile) {

      const formData = new FormData();

      formData.append("pdf", pdfFile);

      formData.append(
        "question",
        currentInput
      );

      const response = await fetch(
        "https://meena-ai-chatbot.onrender.com/pdf-chat",
        {
          method: "POST",
          body: formData,
        }
      );

      data = await response.json();

    } else {

      const response = await fetch(
        "https://meena-ai-chatbot.onrender.com/chat",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            message: currentInput,
          }),
        }
      );

      data = await response.json();
    }

    const aiReply = {
      text: data.reply,
      sender: "ai",
    };

    updateActiveChatMessages([
      ...updatedMessages,
      aiReply,
    ]);

  } catch (error) {

    console.log(error);

    updateActiveChatMessages([
      ...updatedMessages,
      {
        text:
          "Backend not connected 😭 Check Flask server.",
        sender: "ai",
      },
    ]);
  }

  setLoading(false);
};
  const askPdf = async () => {
  if (!pdfFile || pdfQuestion.trim() === "") {
    alert("Upload PDF and type question first 😭");
    return;
  }

  const formData = new FormData();
  formData.append("pdf", pdfFile);
  formData.append("question", pdfQuestion);

  setPdfLoading(true);
  setPdfAnswer("");

  try {
    const response = await fetch("https://meena-ai-chatbot.onrender.com/pdf-chat", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    setPdfAnswer(data.reply);
  } catch (error) {
    console.log(error);
    setPdfAnswer("PDF backend error 😭 Check Flask server.");
  }

  setPdfLoading(false);
};

const loginUser = async () => {

  try {

    const response = await fetch(
      "https://meena-ai-chatbot.onrender.com/login",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          email,
          password,
        }),
      }
    );

    const data = await response.json();

    if (response.ok) {

      localStorage.setItem(
        "token",
        data.token
      );

      localStorage.setItem(
        "name",
        data.name
      );

      setName(data.name);

      setIsLoggedIn(true);

      alert("Login successful 🚀");

    } else {

      alert(data.message);
    }

  } catch (error) {

    console.log(error);

    alert("Backend error 😭");
  }
};

if (!isLoggedIn) {
  return (
    <div className="app dark">

      <div className="chat-card">

        <div className="header">
          <div>
            <h1>🔐 Login to Chatuu</h1>
            <p>AI Assistant Login</p>
          </div>
        </div>

        <div
          style={{
            padding: "40px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
          />

          <button onClick={loginUser}>
            Login
          </button>
        </div>

      </div>

    </div>
  );
}

const saveChatToDB = async () => {
  const savedEmail = localStorage.getItem("email");

  const response = await fetch("https://meena-ai-chatbot.onrender.com/save-chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: savedEmail,
      title: activeChat.title,
      messages: messages,
    }),
  });

  const data = await response.json();
  alert(data.message);
};

 return (
  
  <div className={darkMode ? "app dark" : "app light"}>
    <div className="sidebar">
      <h2>💬 Chatuu</h2>

      <button onClick={newChat}>+ New Chat</button>

      <div className="chat-list">
        {chats.map((chat) => (
          <div
            key={chat.id}
            className={
              chat.id === activeChat.id
                ? "chat-item active"
                : "chat-item"
            }
            onClick={() => setActiveChatId(chat.id)}
          >
            {chat.title}
          </div>
        ))}
      </div>
    </div>

    <div className="chat-card">
      <div className="header">
        <div>
          <h1>🤖 Meena AI Assistant</h1>
          <p>Coding • Motivation • Tamil + English</p>
        </div>

        <button
  className="mode-btn"
  onClick={() => setDarkMode(!darkMode)}
>
  {darkMode ? "☀️" : "🌙"}
</button>

<button
  className="mode-btn"
  onClick={() => {
    localStorage.removeItem("token");
    localStorage.removeItem("name");
    setIsLoggedIn(false);
    setName("");
  }}
>
  logout
</button>
<button className="mode-btn" onClick={saveChatToDB}>
  💾
</button>
      </div>

      <div className="chat-window">
        {messages.map((msg, index) => (
          <div key={index} className={`message-row ${msg.sender}`}>
            <div className="avatar">
              {msg.sender === "ai" ? "🤖" : "👩"}
            </div>

            <div className={`message ${msg.sender}`}>
              <ReactMarkdown>{msg.text}</ReactMarkdown>
            </div>
          </div>
        ))}

        {loading && (
          <div className="message-row ai">
            <div className="avatar">🤖</div>

            <div className="message ai typing">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}

        <div ref={chatEndRef}></div>
      </div>

      <div className="input-area">
        <input
          type="text"
          placeholder={
            pdfFile
              ? "Ask question from uploaded PDF..."
              : "Ask Chatuu anything..."
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
        />

        <input
          type="file"
          accept="application/pdf"
          id="pdf-upload"
          style={{ display: "none" }}
          onChange={(e) => setPdfFile(e.target.files[0])}
        />

        <label htmlFor="pdf-upload" className="upload-btn">
          📎
        </label>

        <button
          className={listening ? "mic-btn listening" : "mic-btn"}
          onClick={startListening}
        >
          {listening ? "🎙️" : "🎤"}
        </button>

        <button onClick={sendMessage} disabled={loading}>
          Send
        </button>
      </div>

      {pdfFile && (
        <div className="pdf-status">
          📄 {pdfFile.name}
        </div>
      )}
    </div>
  </div>
);
}

export default App;