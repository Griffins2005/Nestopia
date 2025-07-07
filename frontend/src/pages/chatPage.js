// src/pages/chatPage.js
import React, { useState, useEffect, useContext } from "react";
import AuthContext from "../context/authContext";
import ConversationList from "../components/chat/conversationList";
import ChatWindow from "../components/chat/chatWindow";
import { Link } from "react-router-dom";
import empty from "../images/empty-chat.svg"

export default function ChatPage() {
  const { user } = useContext(AuthContext);
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [mobileView, setMobileView] = useState("list");

  useEffect(() => {
    if (!user?.accessToken) return;
    fetch("/api/chats/conversations/", {
      headers: {
        Authorization: `Bearer ${user.accessToken}`,
      },
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setConversations(Array.isArray(data) ? data : []));
  }, [user]);

  const handleSelect = (convo) => {
    setSelected(convo);
    if (window.innerWidth < 700) setMobileView("chat");
  };

  const handleBack = () => setMobileView("list");

  const refreshConversations = () => {
    if (!user?.accessToken) return;
    fetch("/api/chats/conversations/", {
      headers: {
        Authorization: `Bearer ${user.accessToken}`,
      },
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setConversations(Array.isArray(data) ? data : []));
  };

  const hasConversations = conversations.length > 0;

  return (
    <div className="chat-page">
      <div className="chat-main-layout">
        {!hasConversations ? (
          <div className="no-conversations-msg">
            <div className="chat-page-title">Messages</div>
            <div className="empty-chat-graphic" />
            <h3>No conversations yet</h3>
            <p>
              To start chatting, visit the <Link to="/listings" className="chat-link">listings</Link> page and click <b>Message Owner</b>.
            </p>
            <Link to="/listings" className="feature-btn empty-chat-cta">
              Browse Listings
            </Link>
          </div>
        ) : (
          <>
            {(mobileView === "list" || window.innerWidth >= 700) && (
              <ConversationList
                conversations={Array.isArray(conversations) ? conversations : []}
                selected={selected}
                onSelect={handleSelect}
                mobileMode={window.innerWidth < 700}
              />
            )}
            {(mobileView === "chat" || window.innerWidth >= 700) && selected && (
              <ChatWindow
                conversation={selected}
                refreshConversations={refreshConversations}
                onBack={handleBack}
                mobileMode={window.innerWidth < 700}
              />
            )}
            {(mobileView === "chat" && window.innerWidth < 700 && !selected) && (
              <div className="no-conversation-selected">
                <img src={empty} alt="empty" />
                <h4>Select a conversation to start chatting!</h4>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
