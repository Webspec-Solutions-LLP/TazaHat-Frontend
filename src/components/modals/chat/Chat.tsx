"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import productCatalog from "@/components/products/english.json";
import "./Chat.css";

type OrderLine = {
  id: string;
  name: string;
  image: string;
  quantity: number;
  price: number;
  weight: string;
};

type ChatMessage = {
  id: string;
  sender: "customer" | "team" | "ai";
  author: string;
  text: string;
  time: string;
  image?: string;
  replyTo?: { author: string; text: string; image?: string };
  order?: OrderLine[];
  orderStatus?: "placed" | "cancelled";
  product?: Pick<(typeof productCatalog.products)[number], "id" | "name" | "image">;
};

const initialMessages: ChatMessage[] = [
  {
    id: "welcome",
    sender: "ai",
    author: "TazaHat AI",
    text: "Hi! I’m TazaHat’s virtual assistant. Ask me about delivery, payments, or products. You can also try “order Rohu Fish x2”.",
    time: "Now",
  },
];

const productCatalogItems = productCatalog.products;

function currentTime() {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date());
}

function getOrderLines(text: string): OrderLine[] {
  const normalizedText = text.toLowerCase();
  const quantityMatch = normalizedText.match(
    /(?:\bx\s*|\bqty\s*|\bquantity\s*)(\d+)|\b(\d+)\s*(?:kg|g|packs?|pieces?|pcs|items?)\b/i
  );
  const quantity = Math.min(20, Math.max(1, Number(quantityMatch?.[1] ?? quantityMatch?.[2] ?? 1)));

  return productCatalogItems
    .filter((product) =>
      normalizedText.includes(product.name.toLowerCase()) ||
      normalizedText.includes(product.id.toLowerCase())
    )
    .map((product) => ({
      id: product.id,
      name: product.name,
      image: product.image,
      quantity,
      price: product.price,
      weight: product.weight,
    }));
}

function createReply(text: string, activeOrder: boolean): Omit<ChatMessage, "id" | "time"> & { cancelOrder?: boolean } {
  const lowerText = text.toLowerCase();

  if (/\b(cancel|cancellation|stop)\b/.test(lowerText)) {
    return {
      sender: "ai",
      author: "TazaHat AI",
      text: activeOrder
        ? "Your demo order has been cancelled. No real order was placed."
        : "There isn’t an active demo order to cancel. You can still ask me about a product order.",
      cancelOrder: activeOrder,
    };
  }

  if (/\b(refund|complaint|damaged|spoiled|human|agent|team member|talk to support|speak to someone)\b/.test(lowerText)) {
    return {
      sender: "team",
      author: "Priya · Support team",
      text: "Hi! I’m Priya from the support team. I’ve received your message and will help review it. Please don’t share passwords or payment details here.",
    };
  }

  const orderLines = getOrderLines(text);
  if (orderLines.length > 0 && /\b(order|buy|add|get|want|need)\b/.test(lowerText)) {
    return {
      sender: "ai",
      author: "TazaHat AI",
      text: "Here’s your demo order summary. Please note that nothing has been purchased.",
      order: orderLines,
      orderStatus: "placed",
    };
  }

  if (/\b(order|buy|add|get|want|need)\b/.test(lowerText)) {
    return {
      sender: "ai",
      author: "TazaHat AI",
      text: "Which product would you like? Send a catalog item name, for example “order Rohu Fish - Fresh x2”.",
    };
  }

  if (/\b(delivery|deliver|shipping|pickup|pick up)\b/.test(lowerText)) {
    return {
      sender: "ai",
      author: "TazaHat AI",
      text: "You can book a pickup and check delivery details on the Delivery Service page. For an existing order, open My Orders to check its latest status.",
    };
  }

  if (/\b(payment|pay|cash|online)\b/.test(lowerText)) {
    return {
      sender: "ai",
      author: "TazaHat AI",
      text: "Payment options depend on the order. The available methods will be shown at checkout. For payment issues, type “talk to support” and a team member will reply.",
    };
  }

  if (/\b(track|status|where is|arrive)\b/.test(lowerText)) {
    return {
      sender: "ai",
      author: "TazaHat AI",
      text: "For live order status, please open My Orders. This preview chat doesn’t have access to real order or delivery data.",
    };
  }

  return {
    sender: "ai",
    author: "TazaHat AI",
    text: "I can help with product orders, cancellations, delivery, and payment questions. For a person, type “talk to support”.",
  };
}

type ChatProduct = Pick<(typeof productCatalog.products)[number], "id" | "name" | "image">;

export default function Chat({ onClose, product }: { onClose: () => void; product?: ChatProduct }) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => product ? [
    { id: "product-question", sender: "ai", author: "TazaHat Assistant", text: `Hi! What would you like to know about ${product.name}? Ask me about its freshness, size, or how to prepare it.`, time: "Now", product },
  ] : initialMessages);
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState<{ name: string; dataUrl: string } | null>(null);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [openMessageMenuId, setOpenMessageMenuId] = useState<string | null>(null);
  const [attachmentError, setAttachmentError] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [isTicketPromptOpen, setIsTicketPromptOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const replyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const closeChat = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    closeTimerRef.current = setTimeout(onClose, 380);
  }, [isClosing, onClose]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeChat();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [closeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isReplying]);

  useEffect(
    () => () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      if (replyTimerRef.current) clearTimeout(replyTimerRef.current);
    },
    []
  );

  const sendMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = message.trim();
    if ((!trimmed && !attachment) || isReplying || isClosing) return;

    const hasActiveOrder = messages.some((item) => item.orderStatus === "placed");
    const reply = createReply(trimmed || "shared an image", hasActiveOrder);
    const timestamp = Date.now();
    const sentAttachment = attachment;
    const sentReply = replyingTo;

    setMessages((current) => [
      ...current,
      {
        id: `customer-${timestamp}`,
        sender: "customer",
        author: "You",
        text: trimmed,
        ...(sentAttachment ? { image: sentAttachment.dataUrl } : {}),
        ...(sentReply ? { replyTo: { author: sentReply.author, text: sentReply.text, ...(sentReply.image ? { image: sentReply.image } : {}) } } : {}),
        time: currentTime(),
      },
    ]);
    setMessage("");
    setAttachment(null);
    setReplyingTo(null);
    setAttachmentError("");
    setIsReplying(true);

    replyTimerRef.current = setTimeout(() => {
      setMessages((current) => [
        ...current.map((item) =>
          reply.cancelOrder && item.orderStatus === "placed"
            ? { ...item, orderStatus: "cancelled" as const }
            : item
        ),
        {
          id: `reply-${timestamp}`,
          sender: reply.sender,
          author: reply.author,
          text: reply.text,
          time: currentTime(),
          ...(reply.order ? { order: reply.order, orderStatus: reply.orderStatus } : {}),
        },
      ]);
      setIsReplying(false);
    }, 750);
  };

  const pickImage = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setAttachmentError("Choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAttachmentError("Choose an image smaller than 5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAttachment({ name: file.name, dataUrl: reader.result });
        setAttachmentError("");
      }
    };
    reader.onerror = () => setAttachmentError("Could not read this image. Try another one.");
    reader.readAsDataURL(file);
  };

  const startReply = (chatMessage: ChatMessage) => {
    setReplyingTo(chatMessage);
    setOpenMessageMenuId(null);
    messageInputRef.current?.focus();
  };

  const deleteMessage = (id: string) => {
    setMessages((current) => current.filter((item) => item.id !== id));
    if (replyingTo?.id === id) setReplyingTo(null);
    setOpenMessageMenuId(null);
  };

  return (
    <section
      className={`chat-panel${isClosing ? " chat-panel--closing" : ""}`}
      role="dialog"
      aria-modal="false"
      aria-labelledby="chat-title"
    >
      <header className="chat-header">
        <span className="chat-avatar" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M4 5h16v12H9l-5 3V5Z" />
            <path d="M8 9h8M8 13h5" />
          </svg>
        </span>
        <span className="chat-header-copy">
          <strong id="chat-title">TazaHat Support</strong>
          <span><i /> AI assistant · Team support</span>
        </span>
        <button className="chat-ticket-button" type="button" onClick={() => setIsTicketPromptOpen(true)} aria-label="Raise a support ticket">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 5h16v12H9l-5 3V5Z"/><path d="M8 9h8M8 13h5"/></svg>
          <span>Raise a Ticket</span>
        </button>
        <button className="chat-collapse-button" type="button" onClick={closeChat} aria-label="Minimize chat">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </header>

      <div className="chat-demo-banner">
        <span>DEMO</span> Sample chat only · Orders are not purchased or sent.
      </div>

      <div className="chat-messages" aria-live="polite" aria-relevant="additions text">
        <div className="chat-day-divider"><span>Today</span></div>
        {messages.map((chatMessage) => (
          <article className={`chat-message chat-message--${chatMessage.sender}`} key={chatMessage.id}>
            <span className="chat-message-author">{chatMessage.author}</span>
            <div className="chat-message-actions">
              <button type="button" className="chat-message-menu-toggle" aria-label={`More options for ${chatMessage.author}'s message`} aria-expanded={openMessageMenuId === chatMessage.id} onClick={() => setOpenMessageMenuId((current) => current === chatMessage.id ? null : chatMessage.id)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
              </button>
              {openMessageMenuId === chatMessage.id && (
                <div className="chat-message-menu" role="menu">
                  <button type="button" role="menuitem" onClick={() => startReply(chatMessage)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 14-5-5 5-5"/><path d="M4 9h9a7 7 0 0 1 7 7v3"/></svg>Reply</button>
                  <button type="button" role="menuitem" onClick={() => deleteMessage(chatMessage.id)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6"/></svg>Delete</button>
                </div>
              )}
            </div>
            {chatMessage.replyTo && (
              <div className="chat-quoted-message">
                <strong>{chatMessage.replyTo.author}</strong>
                {chatMessage.replyTo.image && <Image src={chatMessage.replyTo.image} alt="Replied image" width={80} height={80} unoptimized />}
                <span>{chatMessage.replyTo.text || (chatMessage.replyTo.image ? "Photo" : "Message")}</span>
              </div>
            )}
            {chatMessage.text && <p>{chatMessage.text}</p>}
            {chatMessage.image && <Image className="chat-message-image" src={chatMessage.image} alt="Image shared in chat" width={640} height={480} unoptimized />}
            {chatMessage.product && (
              <Link className="chat-product-tag" href={`/productDetails?id=${encodeURIComponent(chatMessage.product.id)}`} aria-label={`View ${chatMessage.product.name} details`} onClick={closeChat}>
                <span className="chat-product-tag-image"><Image src={chatMessage.product.image} alt="" fill sizes="42px" /></span>
                <span className="chat-product-tag-copy"><small>PRODUCT</small><strong>{chatMessage.product.name}</strong></span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </Link>
            )}
            {chatMessage.order && (
              <div className="chat-order-card">
                {chatMessage.order.map((item) => (
                  <Link className="chat-order-line" key={item.id} href={`/productDetails?id=${encodeURIComponent(item.id)}`} onClick={closeChat} aria-label={`View ${item.name} product details`}>
                    <span className="chat-order-image">
                      <Image src={item.image} alt="" fill sizes="38px" />
                    </span>
                    <span className="chat-order-product">
                      <strong>{item.name}</strong>
                      <small>{item.weight} · Qty {item.quantity}</small>
                    </span>
                    <strong className="chat-order-price">₹{item.price * item.quantity}</strong>
                  </Link>
                ))}
                <div className="chat-order-total">
                  <span>{chatMessage.orderStatus === "cancelled" ? "Cancelled demo order" : "Demo order total"}</span>
                  <strong>₹{chatMessage.order.reduce((sum, item) => sum + item.price * item.quantity, 0)}</strong>
                </div>
                <span className="chat-order-disclaimer">Demo only · Not a real purchase</span>
              </div>
            )}
            {chatMessage.orderStatus === "cancelled" && <span className="chat-order-cancelled">Demo order cancelled</span>}
            <time>{chatMessage.time}</time>
          </article>
        ))}
        {isReplying && (
          <div className="chat-typing" role="status" aria-label="TazaHat AI is replying">
            <span>TazaHat AI is typing</span><i /><i /><i />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-composer" onSubmit={sendMessage}>
        {isTicketPromptOpen && (
          <div className="chat-ticket-prompt">
            <span className="chat-ticket-prompt-mark" aria-hidden="true">!</span>
            <button type="button" onClick={() => setMessage("Yes, please tell us about your problem. ")}>
              <small>SUPPORT TICKET</small>
              <span>Yes, please tell us about your problem.</span>
            </button>
            <button className="chat-ticket-prompt-dismiss" type="button" aria-label="Dismiss ticket prompt" onClick={() => setIsTicketPromptOpen(false)}>×</button>
          </div>
        )}
        {replyingTo && (
          <div className="chat-composer-context chat-composer-reply">
            <span className="chat-reply-accent" />
            {replyingTo.image && <Image src={replyingTo.image} alt="" width={76} height={76} unoptimized />}
            <span className="chat-composer-context-copy"><strong>Replying to {replyingTo.author}</strong><small>{replyingTo.text || (replyingTo.image ? "Photo" : "Message")}</small></span>
            <button type="button" aria-label="Cancel reply" onClick={() => setReplyingTo(null)}>×</button>
          </div>
        )}
        {attachment && (
          <div className="chat-composer-context chat-image-attachment">
            <Image src={attachment.dataUrl} alt="Selected image preview" width={76} height={76} unoptimized />
            <span className="chat-composer-context-copy"><strong>Image ready to send</strong><small>{attachment.name}</small></span>
            <button type="button" aria-label="Remove selected image" onClick={() => setAttachment(null)}>×</button>
          </div>
        )}
        {attachmentError && <p className="chat-attachment-error" role="alert">{attachmentError}</p>}
        <input ref={imageInputRef} className="chat-sr-only" type="file" accept="image/*" aria-label="Choose an image to send" onChange={(event) => { pickImage(event.target.files?.[0]); event.target.value = ""; }} />
        <label className="chat-sr-only" htmlFor="chat-message-input">Send a message to TazaHat support</label>
        <input
          ref={messageInputRef}
          id="chat-message-input"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Message… try “order Rohu Fish x2” or “cancel order”"
          maxLength={1000}
          disabled={isReplying || isClosing}
        />
        <button className="chat-attachment-button" type="button" disabled={isReplying || isClosing} aria-label="Pick an image" onClick={() => imageInputRef.current?.click()}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
        </button>
        <button className="chat-send-button" type="submit" disabled={(!message.trim() && !attachment) || isReplying || isClosing} aria-label="Send message">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m3 11 18-8-7 18-3-7-8-3Z" />
            <path d="m11 14 4-4" />
          </svg>
        </button>
      </form>
    </section>
  );
}
