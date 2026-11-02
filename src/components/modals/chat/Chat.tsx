"use client";

import { useBackClose } from "@/lib/backLayers";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type FormEvent, type PointerEvent } from "react";
import productCatalog from "@/components/products/english.json";
import "./Chat.css";
import { fallbackImage, isRemoteImage } from "@/lib/api";
import { type SupportedLang, useLanguage } from "@/lib/language";
import englishText from "./english.json";
import bengaliText from "./bengali.json";
import hindiText from "./hindi.json";

const textMap: Record<SupportedLang, typeof englishText> = {
  en: englishText,
  bn: bengaliText,
  hi: hindiText,
};

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

function createReply(
  text: string,
  activeOrder: boolean,
  t: typeof englishText
): Omit<ChatMessage, "id" | "time"> & { cancelOrder?: boolean } {
  const lowerText = text.toLowerCase();

  if (/\b(cancel|cancellation|stop|বাতিল|রদ্দ|रद्द)\b/i.test(lowerText)) {
    return {
      sender: "ai",
      author: t.aiAuthor,
      text: activeOrder ? t.replyCancelled : t.replyNoActiveOrder,
      cancelOrder: activeOrder,
    };
  }

  if (/\b(refund|complaint|damaged|spoiled|human|agent|team member|talk to support|speak to someone|সহায়তা|সাহায্য|मदद|सहायता)\b/i.test(lowerText)) {
    return {
      sender: "team",
      author: t.supportAuthor,
      text: t.replySupport,
    };
  }

  const orderLines = getOrderLines(text);
  if (orderLines.length > 0 && /\b(order|buy|add|get|want|need|কিনতে|অর্ডার|চাই|खरीद|ऑर्डर|चाहिए)\b/i.test(lowerText)) {
    return {
      sender: "ai",
      author: t.aiAuthor,
      text: t.replyOrderSummary,
      order: orderLines,
      orderStatus: "placed",
    };
  }

  if (/\b(order|buy|add|get|want|need|কিনতে|অর্ডার|চাই|खरीद|ऑर्डर|चाहिए)\b/i.test(lowerText)) {
    return {
      sender: "ai",
      author: t.aiAuthor,
      text: t.replyAskProduct,
    };
  }

  if (/\b(delivery|deliver|shipping|pickup|pick up|ডেলিভারি|পিকআপ|डिलीवरी|पिकअप)\b/i.test(lowerText)) {
    return {
      sender: "ai",
      author: t.aiAuthor,
      text: t.replyDelivery,
    };
  }

  if (/\b(payment|pay|cash|online|পেমেন্ট|টাকা|भुगतान|कैश)\b/i.test(lowerText)) {
    return {
      sender: "ai",
      author: t.aiAuthor,
      text: t.replyPayment,
    };
  }

  if (/\b(track|status|where is|arrive|ট্র্যাক|স্ট্যাটাস|ট্র্যাকিং|स्थिति|ट्रैक)\b/i.test(lowerText)) {
    return {
      sender: "ai",
      author: t.aiAuthor,
      text: t.replyTracking,
    };
  }

  return {
    sender: "ai",
    author: t.aiAuthor,
    text: t.replyFallback,
  };
}

type ChatProduct = Pick<(typeof productCatalog.products)[number], "id" | "name" | "image">;

export interface ChatProps {
  onClose: () => void;
  product?: ChatProduct;
  requestCloseRef?: { current: (() => void) | null };
}

export default function Chat({ onClose, product, requestCloseRef }: ChatProps) {
  const [lang] = useLanguage();
  const t = textMap[lang] || englishText;

  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    product
      ? [
          {
            id: "product-question",
            sender: "ai",
            author: t.assistantAuthor,
            text: t.productWelcomeText.replace("{product}", product.name),
            time: t.timeNow,
            product,
          },
        ]
      : [
          {
            id: "welcome",
            sender: "ai",
            author: t.aiAuthor,
            text: t.welcomeText,
            time: t.timeNow,
          },
        ]
  );
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState<{ name: string; dataUrl: string } | null>(null);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [openMessageMenuId, setOpenMessageMenuId] = useState<string | null>(null);
  const [pinnedMessageId, setPinnedMessageId] = useState<string | null>(null);
  const [swipingMessageId, setSwipingMessageId] = useState<string | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [attachmentError, setAttachmentError] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [isTicketPromptOpen, setIsTicketPromptOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const messagePointerStartRef = useRef<{ x: number; y: number; messageId: string } | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const replyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const closeChat = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    closeTimerRef.current = setTimeout(onClose, 380);
  }, [isClosing, onClose]);
  useBackClose(closeChat);

  useEffect(() => {
    if (requestCloseRef) {
      requestCloseRef.current = closeChat;
      return () => {
        requestCloseRef.current = null;
      };
    }
  }, [closeChat, requestCloseRef]);

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
    const reply = createReply(trimmed || t.sharedAnImage, hasActiveOrder, t);
    const timestamp = Date.now();
    const sentAttachment = attachment;
    const sentReply = replyingTo;

    setMessages((current) => [
      ...current,
      {
        id: `customer-${timestamp}`,
        sender: "customer",
        author: t.youAuthor,
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
      setAttachmentError(t.imageTypeError);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAttachmentError(t.imageSizeError);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAttachment({ name: file.name, dataUrl: reader.result });
        setAttachmentError("");
      }
    };
    reader.onerror = () => setAttachmentError(t.imageReadError);
    reader.readAsDataURL(file);
  };

  const startReply = (chatMessage: ChatMessage) => {
    setReplyingTo(chatMessage);
    setOpenMessageMenuId(null);
    messageInputRef.current?.focus();
  };

  const togglePin = (chatMessage: ChatMessage) => {
    setPinnedMessageId((current) => current === chatMessage.id ? null : chatMessage.id);
    setOpenMessageMenuId(null);
  };

  const startMessageSwipe = (chatMessage: ChatMessage, event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    const target = event.target;
    if (target instanceof Element && target.closest("button, a, input")) return;
    messagePointerStartRef.current = { x: event.clientX, y: event.clientY, messageId: chatMessage.id };
    setSwipingMessageId(chatMessage.id);
    setSwipeOffset(0);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveMessageSwipe = (event: PointerEvent<HTMLElement>) => {
    const start = messagePointerStartRef.current;
    if (!start) return;
    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (deltaX > 0 && Math.abs(deltaX) > Math.abs(deltaY) * 1.1) setSwipeOffset(Math.min(deltaX, 72));
  };

  const finishMessageSwipe = (chatMessage: ChatMessage, event: PointerEvent<HTMLElement>) => {
    const start = messagePointerStartRef.current;
    messagePointerStartRef.current = null;
    setSwipingMessageId(null);
    setSwipeOffset(0);
    if (!start) return;

    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (start.messageId === chatMessage.id && deltaX > 36 && deltaX > Math.abs(deltaY) * 1.1) startReply(chatMessage);
  };

  const pinnedMessage = messages.find((item) => item.id === pinnedMessageId) ?? null;

  return (
    <section
      className={`chat-panel${isClosing ? " chat-panel--closing" : ""}`}
      role="dialog"
      aria-modal="false"
      aria-labelledby="chat-title"
      lang={t.language}
    >
      <header className="chat-header">
        <span className="chat-avatar" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M4 5h16v12H9l-5 3V5Z" />
            <path d="M8 9h8M8 13h5" />
          </svg>
        </span>
        <span className="chat-header-copy">
          <strong id="chat-title">{t.chatTitle}</strong>
          <span><i /> {t.chatSubtitle}</span>
        </span>
        <button className="chat-ticket-button" type="button" onClick={() => setIsTicketPromptOpen(true)} aria-label={t.raiseTicketAria}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 5h16v12H9l-5 3V5Z"/><path d="M8 9h8M8 13h5"/></svg>
          <span>{t.raiseTicket}</span>
        </button>
        <button className="chat-collapse-button" type="button" onClick={closeChat} aria-label={t.minimizeChatAria}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </header>

      <div className="chat-demo-banner">
        <span>{t.demoTag}</span> {t.demoNotice}
      </div>

      <div className="chat-messages" aria-live="polite" aria-relevant="additions text">
        {pinnedMessage && (
          <button className="chat-pinned-banner" type="button" onClick={() => document.getElementById(`chat-message-${pinnedMessage.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" })}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m16 3 5 5-4 1-4 4-1 5-2-2-4 4-2-2 4-4-2-2 5-1 4-4z" /></svg>
            <span><strong>{t.pinnedMessagePrefix.replace("{author}", pinnedMessage.author)}</strong><small>{pinnedMessage.text || (pinnedMessage.image ? t.photoFallback : t.messageFallback)}</small></span>
          </button>
        )}
        <div className="chat-day-divider"><span>{t.today}</span></div>
        {messages.map((chatMessage) => (
          <article
            id={`chat-message-${chatMessage.id}`}
            className={`chat-message chat-message--${chatMessage.sender}${pinnedMessageId === chatMessage.id ? " is-pinned" : ""}${swipingMessageId === chatMessage.id ? " is-swiping" : ""}`}
            key={chatMessage.id}
            style={{ "--chat-swipe-offset": `${swipingMessageId === chatMessage.id ? swipeOffset : 0}px` } as CSSProperties}
            onPointerDown={(event) => startMessageSwipe(chatMessage, event)}
            onPointerMove={moveMessageSwipe}
            onPointerUp={(event) => finishMessageSwipe(chatMessage, event)}
            onPointerCancel={() => { messagePointerStartRef.current = null; setSwipingMessageId(null); setSwipeOffset(0); }}
          >
            <span className="chat-message-author">{chatMessage.author}</span>
            {swipingMessageId === chatMessage.id && swipeOffset > 8 && <span className="chat-swipe-reply-indicator" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m9 14-5-5 5-5"/><path d="M4 9h9a7 7 0 0 1 7 7v3"/></svg></span>}
            <div className="chat-message-actions">
              <button type="button" className="chat-message-menu-toggle" aria-label={t.moreOptionsAria.replace("{author}", chatMessage.author)} aria-haspopup="menu" aria-expanded={openMessageMenuId === chatMessage.id} onClick={() => setOpenMessageMenuId((current) => current === chatMessage.id ? null : chatMessage.id)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
              </button>
              {openMessageMenuId === chatMessage.id && (
                <div className="chat-message-menu" role="menu">
                  <button type="button" role="menuitem" onClick={() => startReply(chatMessage)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 14-5-5 5-5"/><path d="M4 9h9a7 7 0 0 1 7 7v3"/></svg>{t.replyAction}</button>
                  <button type="button" role="menuitem" onClick={() => togglePin(chatMessage)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m16 3 5 5-4 1-4 4-1 5-2-2-4 4-2-2 4-4-2-2 5-1 4-4z"/></svg>{pinnedMessageId === chatMessage.id ? t.unpinAction : t.pinAction}</button>
                </div>
              )}
            </div>
            {chatMessage.replyTo && (
              <div className="chat-quoted-message">
                <strong>{chatMessage.replyTo.author}</strong>
                {chatMessage.replyTo.image && <Image src={chatMessage.replyTo.image} alt={t.repliedImageAlt} width={80} height={80} unoptimized />}
                <span>{chatMessage.replyTo.text || (chatMessage.replyTo.image ? t.photoFallback : t.messageFallback)}</span>
              </div>
            )}
            {chatMessage.text && <p>{chatMessage.text}</p>}
            {chatMessage.image && <Image className="chat-message-image" src={chatMessage.image} alt={t.chatImageAlt} width={640} height={480} unoptimized />}
            {chatMessage.product && (
              <Link className="chat-product-tag" href={`/${encodeURIComponent(chatMessage.product.id)}`} aria-label={t.viewProductAria.replace("{name}", chatMessage.product.name)} onClick={closeChat}>
                <span className="chat-product-tag-image"><Image src={chatMessage.product.image} alt="" fill sizes="42px" unoptimized={isRemoteImage(chatMessage.product.image)} onError={fallbackImage} /></span>
                <span className="chat-product-tag-copy"><small>{t.productTagSmall}</small><strong>{chatMessage.product.name}</strong></span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </Link>
            )}
            {chatMessage.order && (
              <div className="chat-order-card">
                {chatMessage.order.map((item) => (
                  <Link className="chat-order-line" key={item.id} href={`/${encodeURIComponent(item.id)}`} onClick={closeChat} aria-label={t.viewOrderLineAria.replace("{name}", item.name)}>
                    <span className="chat-order-image">
                      <Image src={item.image} alt="" fill sizes="38px" unoptimized={isRemoteImage(item.image)} onError={fallbackImage} />
                    </span>
                    <span className="chat-order-product">
                      <strong>{item.name}</strong>
                      <small>{item.weight} · {t.qtyFormat.replace("{quantity}", String(item.quantity))}</small>
                    </span>
                    <strong className="chat-order-price">₹{item.price * item.quantity}</strong>
                  </Link>
                ))}
                <div className="chat-order-total">
                  <span>{chatMessage.orderStatus === "cancelled" ? t.cancelledDemoOrder : t.demoOrderTotal}</span>
                  <strong>₹{chatMessage.order.reduce((sum, item) => sum + item.price * item.quantity, 0)}</strong>
                </div>
                <span className="chat-order-disclaimer">{t.demoOrderDisclaimer}</span>
              </div>
            )}
            {chatMessage.orderStatus === "cancelled" && <span className="chat-order-cancelled">{t.demoOrderCancelled}</span>}
            <time>{chatMessage.time}</time>
          </article>
        ))}
        {isReplying && (
          <div className="chat-typing" role="status" aria-label={t.typingAria}>
            <span>{t.typingText}</span><i /><i /><i />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-composer" onSubmit={sendMessage}>
        {isTicketPromptOpen && (
          <div className="chat-ticket-prompt">
            <span className="chat-ticket-prompt-mark" aria-hidden="true">!</span>
            <button type="button" onClick={() => setMessage(`${t.supportTicketText} `)}>
              <small>{t.supportTicketTag}</small>
              <span>{t.supportTicketText}</span>
            </button>
            <button className="chat-ticket-prompt-dismiss" type="button" aria-label={t.dismissTicketPromptAria} onClick={() => setIsTicketPromptOpen(false)}>×</button>
          </div>
        )}
        {replyingTo && (
          <div className="chat-composer-context chat-composer-reply">
            <span className="chat-reply-accent" />
            {replyingTo.image && <Image src={replyingTo.image} alt="" width={76} height={76} unoptimized />}
            <span className="chat-composer-context-copy"><strong>{t.replyingToAuthor.replace("{author}", replyingTo.author)}</strong><small>{replyingTo.text || (replyingTo.image ? t.photoFallback : t.messageFallback)}</small></span>
            <button type="button" aria-label={t.cancelReplyAria} onClick={() => setReplyingTo(null)}>×</button>
          </div>
        )}
        {attachment && (
          <div className="chat-composer-context chat-image-attachment">
            <Image src={attachment.dataUrl} alt={t.selectedImageAlt} width={76} height={76} unoptimized />
            <span className="chat-composer-context-copy"><strong>{t.imageReady}</strong><small>{attachment.name}</small></span>
            <button type="button" aria-label={t.removeSelectedImageAria} onClick={() => setAttachment(null)}>×</button>
          </div>
        )}
        {attachmentError && <p className="chat-attachment-error" role="alert">{attachmentError}</p>}
        <input ref={imageInputRef} className="chat-sr-only" type="file" accept="image/*" aria-label={t.chooseImageAria} onChange={(event) => { pickImage(event.target.files?.[0]); event.target.value = ""; }} />
        <label className="chat-sr-only" htmlFor="chat-message-input">{t.inputAria}</label>
        <input
          ref={messageInputRef}
          id="chat-message-input"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={t.inputPlaceholder}
          maxLength={1000}
          disabled={isReplying || isClosing}
        />
        <button className="chat-attachment-button" type="button" disabled={isReplying || isClosing} aria-label={t.pickImageAria} onClick={() => imageInputRef.current?.click()}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
        </button>
        <button className="chat-send-button" type="submit" disabled={(!message.trim() && !attachment) || isReplying || isClosing} aria-label={t.sendMessageAria}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m3 11 18-8-7 18-3-7-8-3Z" />
            <path d="m11 14 4-4" />
          </svg>
        </button>
      </form>
    </section>
  );
}
