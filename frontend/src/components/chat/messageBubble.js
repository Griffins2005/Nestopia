// src/components/chat/messageBubble.js
import React, { useState, useRef, useEffect } from "react";
import EmojiPicker from "emoji-picker-react";

export default function MessageBubble({
  message, self, onEdit, onDelete, onStar, onReact, onReply,
  showEmojiPicker, onShowEmojiPicker, localTimeString
}) {
  const [dropdown, setDropdown] = useState(false);
  const dropdownRef = useRef();

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdown(false);
      }
    }
    if (dropdown) document.addEventListener("mousedown", handleClickOutside);
    else document.removeEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdown]);

  // QUOTE: Show in bubble if present
  let replySenderName = "";
  let replyText = "";
  if (message.reply_to && typeof message.reply_to === "object") {
    replyText = typeof message.reply_to.text === "string" ? message.reply_to.text : "";
    replySenderName = message.reply_to.sender_name || "User";
  }

  const messageText = typeof message.text === "string" ? message.text : "[Invalid message text]";
  const reactions = Array.isArray(message.reactions) ? message.reactions : [];

  const messageTime = localTimeString
    ? localTimeString(message.created_at)
    : (message.created_at
      ? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : "");

  // WhatsApp-style tick logic
  let ticks = null;
  if (self) {
    if (message.seen_at) {
      // Two blue ticks (seen)
      ticks = (
        <span className="msg-ticks msg-ticks-blue" title="Seen">
          ✓✓
        </span>
      );
    } else {
      // One gray tick (sent but not seen)
      ticks = (
        <span className="msg-ticks msg-ticks-gray" title="Sent">
          ✓
        </span>
      );
    }
  }

  return (
    <div className={`message-bubble${self ? " self" : ""}`}>
      {replyText && (
        <div className="bubble-quote-reply">
          <span className="bubble-quote-sender">{replySenderName}</span>
          <span className="bubble-quote-text">{replyText.length > 72 ? replyText.slice(0, 72) + "…" : replyText}</span>
        </div>
      )}
      <div className="message-text">{messageText}</div>
      <div className="bubble-header">
        <button
          className="bubble-menu-btn"
          onClick={() => setDropdown((d) => !d)}
          aria-label="Options"
        >
          ⋮
        </button>
        {dropdown && (
          <div className="bubble-menu-dropdown" ref={dropdownRef}>
            <button type="button" onMouseDown={() => { setDropdown(false); onReply(message); }}>Reply</button>
            <button type="button" onMouseDown={() => { setDropdown(false); onShowEmojiPicker(message.id); }}>React</button>
            <button type="button" onMouseDown={() => { setDropdown(false); onStar(message); }}>
              {message.starred ? "Unstar" : "Star"}
            </button>
            {self && ((Date.now() - new Date(message.created_at).getTime() < 20 * 60 * 1000) && (
                <button type="button" onMouseDown={() => { setDropdown(false); onEdit(message); }}> Edit </button>
                )
            )}
            {self && (
              <button type="button" onMouseDown={() => { setDropdown(false); onDelete(message); }}>Delete</button>
            )}
          </div>
        )}
        {showEmojiPicker && (
          <div className="reaction-emoji-picker-modal">
            <EmojiPicker
              onEmojiClick={(emojiObj) => {
                onReact(message, emojiObj.emoji);
              }}
              height={360}
              width={330}
              theme="light"
              searchDisabled={false}
              lazyLoadEmojis={true}
            />
            <button
              className="emoji-picker-close"
              onClick={() => onShowEmojiPicker(null)}
              type="button"
            >Close</button>
          </div>
        )}
      </div>
      {reactions.length > 0 && (
        <div className="message-reactions-row">
          {reactions.map((r, i) =>
            r && typeof r === "object" && typeof r.emoji === "string" ? (
              <span className="emoji-reaction" key={i}>{r.emoji}</span>
            ) : null
          )}
        </div>
      )}
      <div className="message-meta-row">
        <span className="message-time">
          {messageTime}
          {message.edited_at ? <span className="message-edited-tag"> (edited)</span> : null}
        </span>
        {ticks}
      </div>
    </div>
  );
}
