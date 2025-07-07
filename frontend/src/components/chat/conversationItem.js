//src/components/chat/conversationItem.js
import React from "react";

export default function ConversationItem({ conversation, active, onClick }) {
  const partnerAvatar = conversation.partner_avatar || "/default.png";
  const partnerName = conversation.partner_name || "User";
  const initials = partnerName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={`conversation-list-item${active ? " active" : ""}`} onClick={onClick}>
      <div className="avatar-circle">
        {conversation.partner_avatar ? (
          <img src={partnerAvatar} alt={partnerName} className="chat-partner-avatar-img" />
        ) : (
          initials
        )}
      </div>
      <div className="conversation-item-details">
        <div className="conversation-partner">{partnerName}</div>
        <div className="conversation-last-message">{conversation.last_message}</div>
      </div>
      <div className="conversation-right-info">
        <div className="conversation-time">{conversation.last_time}</div>
        {conversation.unread_count > 0 && (
          <div className="conversation-unread">{conversation.unread_count}</div>
        )}
      </div>
    </div>
  );
}