// src/components/chat/ChatWindow.js
import React, { useState, useEffect, useRef, useContext, useCallback } from "react";
import MessageBubble from "./messageBubble";
import MessageInput from "./messageInput";
import AuthContext from "../../context/authContext";
import empty from "../../images/empty-chat.svg";
import { FaCalendar, FaStar, FaEnvelope, FaSearch, FaInfoCircle } from "react-icons/fa";

// --- Time Utility: Always get user's local time ---
function localTimeString(iso) {
  try {
    if (!iso) return "";
    return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  } catch {
    return "";
  }
}
function localDateString(iso) {
  try {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return "";
  }
}

function shouldShowDate(messages, idx) {
  if (idx === 0) return true;
  const prev = messages[idx - 1];
  const curr = messages[idx];
  return (new Date(prev.created_at)).toDateString() !== (new Date(curr.created_at)).toDateString();
}

// --- Token Progress Bar ---
function TokenProgressBar({ selfTokens, partnerTokens, needed = 10 }) {
  const pctSelf = Math.min(100, (selfTokens / needed) * 100);
  const pctPartner = Math.min(100, (partnerTokens / needed) * 100);
  const unlocked = selfTokens >= needed && partnerTokens >= needed;
  const moreNeeded = needed - Math.min(selfTokens, partnerTokens);
  return (
    <div className="token-progress-bar-box">
      <div className="token-progress-labels">
        <span>You: {selfTokens}/{needed}</span>
        <span>Partner: {partnerTokens}/{needed}</span>
        <span title="Tokens are earned by sending meaningful messages (6+ characters). When both users reach 10, you can schedule a visit.">
          <FaInfoCircle style={{ marginLeft: 7, color: "#06bb99", verticalAlign: "middle" }} />
        </span>
      </div>
      <div className="token-progress-bar-bg">
        <div className="token-progress-bar token-progress-bar-self" style={{ width: `${pctSelf}%` }} />
        <div className="token-progress-bar token-progress-bar-partner" style={{ width: `${pctPartner}%` }} />
      </div>
      <div className="token-progress-status">
        {unlocked ? (
          <span className="token-progress-unlocked">🎉 Feature Unlocked!</span>
        ) : (
          <span>{moreNeeded} more from both to unlock <b>“Schedule Visit”</b></span>
        )}
      </div>
    </div>
  );
}

export default function ChatWindow({ conversation, refreshConversations, onBack, mobileMode }) {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [featureStatus, setFeatureStatus] = useState({});
  const [editingMessage, setEditingMessage] = useState(null);
  const [filterStarred, setFilterStarred] = useState(false);
  const [emojiPickerMsgId, setEmojiPickerMsgId] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [inputText, setInputText] = useState("");
  const [inputError, setInputError] = useState("");
  const messagesEndRef = useRef();

  // --- Fetch messages
  const refreshMessages = useCallback(() => {
    if (!conversation) return;
    fetch(`/api/chats/conversations/${conversation.id}/messages/`, {
      headers: { Authorization: `Bearer ${user.accessToken}` },
      credentials: "include",
    })
      .then((res) => res.ok ? res.json() : [])
      .then((data) => setMessages(Array.isArray(data) ? data : []))
      .catch((err) => {
        setMessages([]);
        console.error("Error loading messages", err);
      });
  }, [conversation, user?.accessToken]);

  useEffect(() => {
    if (conversation && user?.accessToken) {
      refreshMessages();
      fetch(`/api/chats/conversations/${conversation.id}/feature-status/`, {
        headers: { Authorization: `Bearer ${user.accessToken}` },
        credentials: "include",
      })
        .then((res) => res.ok ? res.json() : {})
        .then(setFeatureStatus)
        .catch((err) => {
          setFeatureStatus({});
          console.error("Error loading features", err);
        });
    }
  }, [conversation, user, refreshMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
  if (messages.length) {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "auto" }), 0);
  }
}, [conversation?.id, messages.length]);

  
  // Typing indicator polling
  useEffect(() => {
    if (!conversation && user?.accessToken) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/chats/conversations/${conversation.id}/`, {
          headers: { Authorization: `Bearer ${user.accessToken}` },
          credentials: "include"
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.last_typing_at && Date.now() - new Date(data.last_typing_at) < 7000) {
          setPartnerTyping(true);
        } else {
          setPartnerTyping(false);
        }
      } catch (e) {
        setPartnerTyping(false);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [conversation, user?.accessToken]);

  // --- Edit: bring message to input
  const handleEdit = (msg) => {
    setEditingMessage(msg);
    setReplyTo(null);
    setInputText(msg.text);
    setInputError("");
  };

  // --- Cancel Edit
  const handleCancelEdit = () => {
    setEditingMessage(null);
    setInputText("");
    setInputError("");
  };

  // --- Handle Send (new or edit)
  const handleSend = async () => {
    const text = inputText.trim();
    if (!text) return;
    setInputError("");
    // Edit mode
    if (editingMessage) {
      try {
        const res = await fetch(`/api/chats/conversations/${conversation.id}/messages/${editingMessage.id}/edit/`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.accessToken}`,
          },
          body: JSON.stringify({ text }),
          credentials: "include",
        });
        if (!res.ok) {
          const err = await res.json();
          setInputError(err.detail || "Error editing message");
          return;
        }
        setEditingMessage(null);
        setInputText("");
        refreshMessages();
        setTimeout(() => refreshConversations && refreshConversations(), 100);
      } catch (e) {
        setInputError("Network error editing message.");
      }
      return;
    }
    // New message mode
    try {
      const res = await fetch(
        `/api/chats/conversations/${conversation.id}/messages/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(user?.accessToken
              ? { Authorization: `Bearer ${user.accessToken}` }
              : {}),
          },
          credentials: "include",
          body: JSON.stringify({ text, reply_to_id: replyTo?.id || null }),
        }
      );
      if (!res.ok) {
        const err = await res.json();
        setInputError(err.detail || "Error sending message");
      } else {
        setInputText("");
        setReplyTo(null);
        refreshMessages();
        setTimeout(() => refreshConversations && refreshConversations(), 100);
      }
    } catch (e) {
      setInputError("Network error");
    }
  };

  // --- Delete with auto refresh
  const handleDelete = async (msg) => {
    if (!window.confirm("Delete this message?")) return;
    await fetch(`/api/chats/conversations/${conversation.id}/messages/${msg.id}/delete/`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${user.accessToken}` },
      credentials: "include",
    });
    refreshMessages();
    setTimeout(() => refreshConversations && refreshConversations(), 100);
  };

  // --- Star, Emoji, Reply
  const handleStar = async (msg) => {
    await fetch(`/api/chats/conversations/${conversation.id}/messages/${msg.id}/star/`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${user.accessToken}` },
      credentials: "include",
    });
    refreshMessages();
  };

  const handleShowEmojiPicker = (msgId) => {
    setEmojiPickerMsgId(emojiPickerMsgId === msgId ? null : msgId);
  };

  const handleReact = async (msg, emoji) => {
    await fetch(`/api/chats/conversations/${conversation.id}/messages/${msg.id}/react/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.accessToken}`,
      },
      body: JSON.stringify({ emoji }),
      credentials: "include",
    });
    setEmojiPickerMsgId(null);
    refreshMessages();
  };

  const handleReply = (msg) => setReplyTo(msg);

  // --- Search and filtering
  let displayedMessages = filterStarred
    ? messages.filter((m) => m.starred)
    : messages;
  if (searchTerm.trim()) {
    displayedMessages = displayedMessages.filter(m =>
      (m.text || "").toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
      (m.reply_to && m.reply_to.text && m.reply_to.text.toLowerCase().includes(searchTerm.trim().toLowerCase()))
    );
  }

  const partnerEmail = conversation?.partner_email || "";

  // --- Header Action Icons
  const featureButtons = (
    <>
      <button className="feature-btn" disabled={!featureStatus.can_schedule_visit}>
        <FaCalendar />
      </button>
      <button
        className={`chat-header-btn${filterStarred ? " active" : ""}`}
        onClick={() => setFilterStarred((f) => !f)}
        title="Show starred messages"
        type="button"
      >
        <FaStar />
      </button>
      {partnerEmail && (
        <button
          className="chat-header-btn"
          onClick={() => window.open(`mailto:${partnerEmail}`)}
          title="Email Partner"
          tabIndex={-1}
          rel="noopener noreferrer"
          type="button"
        >
          <FaEnvelope />
        </button>
      )}
      <button
        className={`chat-header-btn${showSearchBar ? " active" : ""}`}
        onClick={() => setShowSearchBar((s) => !s)}
        title="Search messages"
        type="button"
      >
        <FaSearch />
      </button>
    </>
  );

  if (!conversation)
    return (
      <div className="no-conversations-msg">
        <img src={empty} alt="No conversations" width={220} />
        <p className="empty-title">No conversations yet.</p>
        <div>
          <span className="empty-subtitle">
            Visit the <a href="/listings">listings</a> page and start chatting!
          </span>
        </div>
      </div>
    );

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-partner-avatar-img">
          {conversation.partner_name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()}
        </div>
        <div className="chat-header-info">
          <div className="chat-header-name">{conversation.partner_name}</div>
          <div className="chat-header-property">{conversation.property_title}</div>
        </div>
        <div className="chat-header-actions">{featureButtons}</div>
        {mobileMode && (
          <button className="chat-back-btn" onClick={onBack}>
            ← 
          </button>
        )}
      </div>
      {/* Progress Bar for token incentive */}
      {featureStatus && typeof featureStatus.messages_from_renter === "number" && (
        <TokenProgressBar
          selfTokens={featureStatus.messages_from_renter}
          partnerTokens={featureStatus.partner_tokens || 0}
          needed={10}
        />
      )}
      {/* Search Dropdown */}
      {showSearchBar && (
        <div className="chat-search-dropdown">
          <input
            className="chat-header-search"
            type="search"
            placeholder="Search messages in this chat..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            autoFocus
          />
        </div>
      )}
      {/* MESSAGES */}
      <div className="chat-messages-list">
        {displayedMessages.length === 0 && (
          <div className="no-messages-yet">
            <span>No messages yet.</span>
          </div>
        )}
        {displayedMessages.map((m, idx) => (
          <React.Fragment key={m.id}>
            {shouldShowDate(displayedMessages, idx) && (
              <div className="chat-date-separator">
                {localDateString(m.created_at)}
              </div>
            )}
            <MessageBubble
              message={m}
              self={m.sender_id === conversation.self_user_id}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onStar={handleStar}
              onReply={handleReply}
              showEmojiPicker={emojiPickerMsgId === m.id}
              onShowEmojiPicker={() => handleShowEmojiPicker(m.id)}
              onReact={handleReact}
              localTimeString={localTimeString}
            />
          </React.Fragment>
        ))}
        {partnerTyping && (
          <div className="chat-typing-indicator">Partner is typing…</div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <MessageInput
        conversationId={conversation.id}
        onSend={handleSend}
        replyTo={replyTo}
        setReplyTo={setReplyTo}
        editingMessage={editingMessage}
        cancelEdit={handleCancelEdit}
        inputText={inputText}
        setInputText={setInputText}
        inputError={inputError}
      />
    </div>
  );
}
