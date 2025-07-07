//src/components/chat/conversationList.js
import React, { useState } from "react";
import ConversationItem from "./conversationItem";

export default function ConversationList({ conversations, selected, onSelect, mobileMode }) {
  const [search, setSearch] = useState("");

  const filtered = conversations.filter(
    (c) =>
      (c.partner_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (c.property_title ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="conversation-list-panel">
      <div className="chat-page-title">Messages</div>
      <input
        className="conversation-search"
        placeholder="Search conversations..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="conversation-list-items">
        {filtered.map((c) => (
          <ConversationItem key={c.id} conversation={c} active={selected && c.id === selected.id}  onClick={() => onSelect(c)} />
        ))}
      </div>
    </div>
  );
}