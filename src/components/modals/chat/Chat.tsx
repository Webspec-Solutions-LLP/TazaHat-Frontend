"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import productCatalog from "@/components/products/english.json";
import "./Chat.css";
import { fallbackImage, isRemoteImage } from "@/lib/api";

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
  const [isReplying, setIsReplying] = useState(false);
  const [isTicketPromptOpen, setIsTicketPromptOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
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
    if (!trimmed || isReplying || isClosing) return;

    const hasActiveOrder = messages.some((item) => item.orderStatus === "placed");
    const reply = createReply(trimmed, hasActiveOrder);
    const timestamp = Date.now();

    setMessages((current) => [
      ...current,
      {
        id: `customer-${timestamp}`,
        sender: "customer",
        author: "You",
        text: trimmed,
        time: currentTime(),
      },
    ]);
    setMessage("");
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
            <p>{chatMessage.text}</p>
            {chatMessage.product && (
              <Link className="chat-product-tag" href={`/${encodeURIComponent(chatMessage.product.id)}`} aria-label={`View ${chatMessage.product.name} details`} onClick={closeChat}>
                <span className="chat-product-tag-image"><Image src={chatMessage.product.image} alt="" fill sizes="42px" unoptimized={isRemoteImage(chatMessage.product.image)} onError={fallbackImage} /></span>
                <span className="chat-product-tag-copy"><small>PRODUCT</small><strong>{chatMessage.product.name}</strong></span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </Link>
            )}
            {chatMessage.order && (
              <div className="chat-order-card">
                {chatMessage.order.map((item) => (
                  <Link className="chat-order-line" key={item.id} href={`/${encodeURIComponent(item.id)}`} onClick={closeChat} aria-label={`View ${item.name} product details`}>
                    <span className="chat-order-image">
                      <Image src={item.image} alt="" fill sizes="38px" unoptimized={isRemoteImage(item.image)} onError={fallbackImage} />
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
        <label className="chat-sr-only" htmlFor="chat-message-input">Send a message to TazaHat support</label>
        <input
          id="chat-message-input"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Message… try “order Rohu Fish x2” or “cancel order”"
          maxLength={1000}
          disabled={isReplying}
        />
        <button type="submit" disabled={!message.trim() || isReplying} aria-label="Send message">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m3 11 18-8-7 18-3-7-8-3Z" />
            <path d="m11 14 4-4" />
          </svg>
        </button>
      </form>
    </section>
  );
}
