// src/components/chat/messageInput.js
import React, { useContext } from "react";
import AuthContext from "../../context/authContext";
import EmojiPicker from "emoji-picker-react";
import { FaTimes } from "react-icons/fa";

export default function MessageInput({
  conversationId,
  onSend,
  replyTo,
  setReplyTo,
  editingMessage,
  cancelEdit,
  inputText,
  setInputText,
  inputError
}) {
  const { user } = useContext(AuthContext);
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);

  // Typing indicator trigger
  const handleInput = () => {
    setTimeout(() => {
      fetch(`/api/chats/conversations/${conversationId}/typing/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
        },
        credentials: "include",
      });
    }, 100);
  };

  return (
    <form
      className="chat-message-input-row"
      onSubmit={e => {
        e.preventDefault();
        onSend();
      }}
    >
      {/* Edit or reply bar */}
      <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
        {editingMessage && (
          <button
            type="button"
            className="edit-cancel-btn"
            onClick={cancelEdit}
            tabIndex={-1}
            aria-label="Cancel edit"
            style={{ marginRight: 6, background: "none", border: "none", color: "#E0544E" }}
          >
            <FaTimes />
          </button>
        )}
        <input
          className="chat-message-input"
          placeholder={editingMessage ? "Edit your message…" : "Type a message…"}
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onInput={handleInput}
          autoFocus
        />
        <button
          className="chat-message-send-btn"
          type="button"
          onClick={() => setShowEmojiPicker((v) => !v)}
          tabIndex={-1}
          aria-label="Pick Emoji"
        >
          😊
        </button>
        <button
          className="chat-message-send-btn"
          type="submit"
          disabled={!inputText.trim()}
        >
          📨
        </button>
      </div>
      {replyTo && !editingMessage && typeof replyTo === "object" && replyTo.text && (
        <div className="reply-context-bar">
          <span>
            <b>Replying:</b>{" "}
            {replyTo.text.length > 50 ? replyTo.text.slice(0, 50) + "…" : replyTo.text}
          </span>
          <button type="button" onClick={() => setReplyTo(null)}>
            ✕
          </button>
        </div>
      )}
      {showEmojiPicker && (
        <div className="emoji-picker-modal">
          <EmojiPicker
            onEmojiClick={(emojiObj) => {
              setInputText(inputText + emojiObj.emoji);
              setShowEmojiPicker(false);
            }}
            height={320}
            width={300}
            theme="light"
            searchDisabled={false}
          />
          <button
            className="emoji-picker-close"
            onClick={() => setShowEmojiPicker(false)}
            type="button"
          >
            Close
          </button>
        </div>
      )}
      {inputError && <div className="input-error-msg">{inputError}</div>}
    </form>
  );
}
