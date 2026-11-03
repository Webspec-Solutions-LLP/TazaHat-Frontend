"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import RequireLogin from "@/components/auth/RequireLogin";
import Products from "@/components/products/Products";
import AllAddress from "@/components/modals/allAddress/AllAddress";
import Address, { type AddressFormValues } from "@/components/modals/address/Address";
import ConfirmBox, { type ConfirmConfig } from "@/components/modals/confirmBox/ConfirmBox";
import { deleteAddressAction, listAddressesAction, makeDefaultAddressAction, saveAddressAction, type SavedAddress } from "@/app/address-actions";
import { myOrderCountsAction } from "@/app/checkout-actions";
import { useAuth } from "@/lib/auth";
import { useWishlistProducts } from "@/lib/useWishlistProducts";
import { updateProfileAction } from "@/app/profile-actions";
import { mediaSrc } from "@/lib/api";
import { COMPARE_CHANGE_EVENT, COMPARE_STORAGE_KEY, OPEN_COMPARE_EVENT } from "@/components/modals/compareList/CompareList";
import { OPEN_CHAT_EVENT } from "@/components/modals/chat/Chat";
import { openLocationPicker, useCity } from "@/lib/city";
import { type SupportedLang, useLanguage } from "@/lib/language";
import englishText from "./english.json";
import bengaliText from "./bengali.json";
import hindiText from "./hindi.json";
import "./MyProfile.css";

const textMap: Record<SupportedLang, typeof englishText> = { en: englishText, bn: bengaliText, hi: hindiText };

type SettingsIconName = "orders" | "address" | "wishlist" | "compare" | "ticket" | "chat" | "notifications" | "city" | "language" | "legal";
type IconTone = "blue" | "green" | "red" | "purple" | "amber" | "slate";

function SettingsIcon({ name, tone }: { name: SettingsIconName; tone: IconTone }) {
  const paths: Record<SettingsIconName, ReactNode> = {
    orders: <><path d="M3 7h13v11H3z" /><path d="M16 11h3l3 3v4h-6z" /><circle cx="7.5" cy="19" r="1.5" /><circle cx="18.5" cy="19" r="1.5" /></>,
    address: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    wishlist: <path d="M20.8 8.8c0 5.2-8.8 11-8.8 11s-8.8-5.8-8.8-11a4.8 4.8 0 0 1 8.8-2.6 4.8 4.8 0 0 1 8.8 2.6Z" />,
    compare: <><path d="M4 7h15m0 0-3-3m3 3-3 3" /><path d="M20 17H5m0 0 3-3m-3 3 3 3" /></>,
    ticket: <><path d="M4 5h16v4a3 3 0 0 0 0 6v4H4v-4a3 3 0 0 0 0-6V5Z" /><path d="M12 8v1m0 3v1m0 3v1" /></>,
    chat: <><path d="M4 5h16v12H9l-5 4V5Z" /><path d="M8 9h8m-8 4h5" /></>,
    notifications: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    city: <><path d="M4 21V8l8-5v18" /><path d="M12 11h8v10h-8" /><path d="M7 11h2m-2 4h2m-2 4h2m8-4h1m-1 4h1" /></>,
    language: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></>,
    legal: <><path d="m14 3 7 7M12 5l7 7m-2-9 4 4M4 20l5-1 11-11-4-4L5 15l-1 5Z" /><path d="m3 21 6-1" /></>,
  };

  return (
    <span className={`profile-settings-icon is-${tone}`} aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
    </span>
  );
}

function SettingsRow({
  href,
  onClick,
  icon,
  tone,
  title,
  description,
  badge,
}: {
  href?: string;
  onClick?: () => void;
  icon: SettingsIconName;
  tone: IconTone;
  title: string;
  description: string;
  badge?: string;
}) {
  const content = (
    <>
      <SettingsIcon name={icon} tone={tone} />
      <span className="profile-settings-copy"><strong>{title}</strong><small>{description}</small></span>
      {badge ? <span className="profile-settings-badge">{badge}</span> : <span className="profile-settings-arrow" aria-hidden="true">›</span>}
    </>
  );

  return href
    ? <Link className="profile-settings-row" href={href}>{content}</Link>
    : <button className="profile-settings-row" type="button" onClick={onClick}>{content}</button>;
}

function ProfileIcon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

function GroceryIllustration() {
  return (
    <svg className="profile-hero-art" viewBox="0 0 280 190" fill="none" aria-hidden="true">
      <ellipse cx="145" cy="166" rx="105" ry="12" fill="#6BADEB" fillOpacity=".2" />
      <path d="M87 73h106l-11 91H98L87 73Z" fill="#F8C979" />
      <path d="m110 77 9-35c4-16 31-16 36 0l9 35" stroke="#FFF8E9" strokeWidth="9" strokeLinecap="round" />
      <path d="M127 72c-15-16-16-40-7-55 16 10 24 28 17 48M151 69c1-21 13-38 30-45 5 19-1 38-18 50" fill="#4FAE73" />
      <path d="M135 66c-5-21 0-40 12-51 12 15 14 34 3 53" fill="#74C987" />
      <circle cx="105" cy="57" r="14" fill="#F05D4E" />
      <circle cx="181" cy="62" r="15" fill="#F6A623" />
      <circle cx="166" cy="43" r="12" fill="#E84F45" />
      <path d="M105 42c0-7 4-11 9-12M181 46c1-6 5-9 10-10" stroke="#397F4F" strokeWidth="3" strokeLinecap="round" />
      <path d="m105 73 4 91m73-91-9 91" stroke="#E7AE59" strokeWidth="2" />
      <path d="M216 50c15 7 24 21 24 39m-9-9 9 9 8-10" stroke="#3F8DD4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="224" cy="115" r="18" fill="#fff" fillOpacity=".6" />
      <path d="M216 115h16m-8-8v16" stroke="#3F8DD4" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function MyProfileContent() {
  const [language, setLanguage] = useLanguage();
  const t = textMap[language] || englishText;
  const { user, updateUser, logout, openNotifications, unread } = useAuth();
  const { city } = useCity();
  const { products: likedProducts } = useWishlistProducts();
  const [orderCounts, setOrderCounts] = useState<Record<"all" | "complete" | "upcoming" | "cancel", number> | null>(null);
  const [addresses, setAddresses] = useState<SavedAddress[] | null>(null);
  const [isAddressListOpen, setIsAddressListOpen] = useState(false);
  const [isAddressEditorOpen, setIsAddressEditorOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressNote, setAddressNote] = useState("");
  const [compareCount, setCompareCount] = useState(0);
  const [question, setQuestion] = useState<(ConfirmConfig & { resolve: (yes: boolean) => void }) | null>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [profileDraft, setProfileDraft] = useState<{ name: string; email: string } | null>(null);
  const [profileError, setProfileError] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const profile = { name: user?.name ?? "", email: user?.email ?? "", phone: user?.phone ? `+91 ${user.phone}` : "" };
  const avatarUrl = user?.avatarUrl ? mediaSrc(user.avatarUrl) : "";

  useEffect(() => {
    void listAddressesAction().then(setAddresses);
  }, []);
  useEffect(() => {
    void myOrderCountsAction().then(setOrderCounts);
  }, []);

  useEffect(() => {
    const refreshCompareCount = () => {
      try {
        const stored = window.localStorage.getItem(COMPARE_STORAGE_KEY);
        const parsed: unknown = stored ? JSON.parse(stored) : [];
        setCompareCount(Array.isArray(parsed) ? parsed.length : 0);
      } catch {
        setCompareCount(0);
      }
    };
    refreshCompareCount();
    window.addEventListener(COMPARE_CHANGE_EVENT, refreshCompareCount);
    window.addEventListener("storage", refreshCompareCount);
    return () => {
      window.removeEventListener(COMPARE_CHANGE_EVENT, refreshCompareCount);
      window.removeEventListener("storage", refreshCompareCount);
    };
  }, []);

  const ask = (config: ConfirmConfig) => new Promise<boolean>((resolve) => setQuestion({ ...config, resolve }));
  const selectPhoto = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setAvatarError(t.choosePicture); return; }
    const preview = URL.createObjectURL(file);
    const confirmed = await ask({ title: t.confirmTitle, text: t.confirmPhoto, preview });
    URL.revokeObjectURL(preview);
    if (!confirmed) return;
    setAvatarBusy(true);
    setAvatarError("");
    try {
      const response = await fetch("/api/avatar", { method: "POST", headers: { "content-type": file.type }, body: file });
      const result = await response.json().catch(() => null) as { status?: string; message?: string; data?: { avatarUrl: string } } | null;
      if (!response.ok || result?.status !== "success" || !result.data) setAvatarError(result?.message ?? t.photoSaveFailed);
      else if (user) updateUser({ ...user, avatarUrl: result.data.avatarUrl });
    } catch {
      setAvatarError(t.connectionError);
    }
    setAvatarBusy(false);
  };

  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profileDraft || profileSaving) return;
    setProfileSaving(true);
    setProfileError("");
    const result = await updateProfileAction(profileDraft);
    setProfileSaving(false);
    if (!result.ok) { setProfileError(result.error); return; }
    updateUser(result.user);
    setProfileDraft(null);
  };

  const openAddressEditor = (address?: SavedAddress) => {
    setEditingAddressId(address?.id ?? null);
    setIsAddressEditorOpen(true);
  };

  const saveAddress = async (values: AddressFormValues) => {
    if (editingAddressId && !(await ask({ title: t.confirmTitle, text: t.confirmEditAddress }))) return t.editNotSaved;
    const result = await saveAddressAction({
      label: values.addressType,
      contactName: values.recipient,
      phone: values.phone,
      altPhone: values.alternatePhone || undefined,
      line1: values.addressLine1,
      line2: values.addressLine2 || undefined,
      apartmentNumber: values.houseNumber || undefined,
      landmark: values.landmark || undefined,
      locality: values.locality || undefined,
      pincode: values.pincode,
      ...(editingAddressId ? {} : { makeDefault: true }),
    }, editingAddressId ?? undefined);
    if (!result.ok) return result.error;
    setAddresses(await listAddressesAction());
    setAddressNote("");
    return null;
  };

  const deleteAddress = async (id: string) => {
    setAddressNote("");
    if (!(await ask({ title: t.confirmTitle, text: t.confirmDeleteAddress }))) return;
    const result = await deleteAddressAction(id);
    if (!result.ok) { setAddressNote(result.error); return; }
    setAddresses(await listAddressesAction());
  };

  const makeDefault = async (id: string) => {
    setAddressNote("");
    const result = await makeDefaultAddressAction(id);
    if (!result.ok) { setAddressNote(result.error); return; }
    setAddresses(await listAddressesAction());
  };

  const requestAccountDeletion = async () => {
    if (await ask({ title: t.deleteAccount, text: t.deleteAccountHelp, yes: t.contactSupport, no: t.cancel })) {
      window.dispatchEvent(new Event(OPEN_CHAT_EVENT));
    }
  };

  const stats = [
    {
      id: "total",
      label: t.statTotalOrders,
      detail: t.statTotalOrdersDetail,
      key: "all" as const,
      tone: "blue",
      icon: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20v-1.5a7 7 0 0 1 14 0V20" /></>,
    },
    {
      id: "delivered",
      label: t.statDelivered,
      detail: t.statDeliveredDetail,
      key: "complete" as const,
      tone: "green",
      icon: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4.5 7.8 7.5 4.3 7.5-4.3M12 12v8.5m-3-8 2 2 4-4" /></>,
    },
    {
      id: "pending",
      label: t.statPending,
      detail: t.statPendingDetail,
      key: "upcoming" as const,
      tone: "amber",
      icon: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    },
    {
      id: "cancelled",
      label: t.statCancelled,
      detail: t.statCancelledDetail,
      key: "cancel" as const,
      tone: "red",
      icon: <><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6m0-6-6 6" /></>,
    },
  ];

  const savedCount = addresses?.length ?? 0;
  const languageName = language === "bn" ? t.languageBengali : language === "hi" ? t.languageHindi : t.languageEnglish;

  return (
    <main className="my-profile-page profile-settings-page" lang={t.language}>
      <div className="profile-top-container">
        <section className="profile-hero" aria-labelledby="profile-heading">
          <div className="profile-identity">
            <div className="profile-avatar-wrap">
              <div
                className={`profile-avatar${avatarUrl ? " has-photo" : ""}${avatarBusy ? " is-busy" : ""}`}
                style={avatarUrl ? { backgroundImage: `url("${avatarUrl}")` } : undefined}
                role={avatarUrl ? "img" : undefined}
                aria-label={avatarUrl ? t.photoAlt : undefined}
              >
                {!avatarUrl && <ProfileIcon><circle cx="12" cy="8" r="3.5" /><path d="M5 20v-1.5a7 7 0 0 1 14 0V20" /></ProfileIcon>}
              </div>
              <button className="profile-photo-button" type="button" aria-label={t.choosePhotoAria} onClick={() => photoInputRef.current?.click()}>
                <ProfileIcon><path d="M4 8h3l1.5-2h7L17 8h3v11H4V8Z" /><circle cx="12" cy="13" r="3" /></ProfileIcon>
              </button>
              <input
                ref={photoInputRef}
                className="profile-photo-input"
                type="file"
                accept="image/*"
                aria-label={t.uploadPhotoAria}
                onChange={(event) => {
                  void selectPhoto(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
            </div>
            <div className="profile-details">
              <span className="profile-greeting">{t.welcomeBack}</span>
              <h1 id="profile-heading">{profile.name}</h1>
              <p><ProfileIcon><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></ProfileIcon><span>{profile.email || t.addEmail}</span></p>
              <p><ProfileIcon><path d="M21 16.5v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 1.1 3.8 2 2 0 0 1 3.1 1.6h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L7 9.6a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z" /></ProfileIcon><span>{profile.phone}</span></p>
            </div>
          </div>
          {avatarError && <p className="profile-form-error" role="alert">{avatarError}</p>}
          <div className="profile-hero-message" aria-hidden="true"><span>{t.goodFood}</span><span>{t.goodLife}</span><i>♡</i></div>
          <GroceryIllustration />
          <button className="profile-edit-button" type="button" onClick={() => { setProfileError(""); setProfileDraft({ name: profile.name, email: profile.email }); }}>{t.editProfile}</button>
        </section>

        <section className="profile-stat-grid" aria-label={t.orderSummaryAria}>
          {stats.map((stat) => (
            <Link
              className={`profile-stat-card profile-stat-card--${stat.tone}`}
              href="/orders"
              key={stat.id}
              aria-label={`${stat.label}: ${orderCounts ? orderCounts[stat.key] : "loading"}. ${stat.detail}`}
            >
              <span className="profile-stat-icon"><ProfileIcon>{stat.icon}</ProfileIcon></span>
              <span className="profile-stat-copy">
                <span>{stat.label}</span>
                <strong>{orderCounts ? orderCounts[stat.key] : <span className="sk" style={{ display: "inline-block", width: 28, height: 20 }} aria-hidden="true" />}</strong>
                <small>{stat.detail}{stat.id === "total" && <b aria-hidden="true"> →</b>}</small>
              </span>
            </Link>
          ))}
        </section>
      </div>

      <div className="profile-settings-container">
        <h1 className="profile-settings-page-title">{t.accountHeading}</h1>

        <section className="profile-settings-section" aria-label={t.accountHeading}>
          <div className="profile-settings-list">
            <SettingsRow icon="orders" tone="blue" href="/orders" title={t.ordersTitle} description={t.ordersDescription} />
            <SettingsRow icon="address" tone="green" onClick={() => setIsAddressListOpen(true)} title={t.addressesTitle} description={t.savedCount.replace("{count}", String(savedCount))} />
            <SettingsRow icon="wishlist" tone="red" href="/wishlist" title={t.wishlistTitle} description={t.wishlistCount.replace("{count}", String(likedProducts.length))} />
            <SettingsRow icon="compare" tone="purple" onClick={() => window.dispatchEvent(new Event(OPEN_COMPARE_EVENT))} title={t.compareTitle} description={t.compareCount.replace("{count}", String(compareCount))} />
            <SettingsRow icon="ticket" tone="amber" href="/contactUs" title={t.ticketsTitle} description={t.ticketsDescription} />
          </div>
        </section>

        <section className="profile-settings-section" aria-labelledby="help-options-heading">
          <h2 id="help-options-heading">{t.settingsHeading}</h2>
          <div className="profile-settings-list">
            <SettingsRow icon="chat" tone="blue" onClick={() => window.dispatchEvent(new Event(OPEN_CHAT_EVENT))} title={t.chatTitle} description={t.chatDescription} />
            <SettingsRow icon="notifications" tone="amber" onClick={openNotifications} title={t.notificationsTitle} description={t.notificationsDescription} badge={unread > 0 ? String(unread) : undefined} />
            <SettingsRow icon="city" tone="green" onClick={openLocationPicker} title={t.cityTitle} description={city?.name ?? t.selectCity} />
            <label className="profile-settings-row profile-settings-language">
              <SettingsIcon name="language" tone="purple" />
              <span className="profile-settings-copy"><strong>{t.languageTitle}</strong><small>{languageName}</small></span>
              <select aria-label={t.languageTitle} value={language} onChange={(event) => setLanguage(event.target.value as SupportedLang)}>
                <option value="en">{t.languageEnglish}</option>
                <option value="bn">{t.languageBengali}</option>
                <option value="hi">{t.languageHindi}</option>
              </select>
              <span className="profile-settings-arrow" aria-hidden="true">›</span>
            </label>
            <SettingsRow icon="legal" tone="slate" href="/privacyPolicy" title={t.legalTitle} description={t.legalDescription} />
          </div>
        </section>

        <div className="profile-settings-actions">
          <button className="profile-delete-account" type="button" onClick={() => void requestAccountDeletion()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="10" cy="7" r="3" /><path d="M4 20v-1a6 6 0 0 1 12 0v1m2-9h5m-2.5-2.5v5" /></svg>{t.deleteAccount}
          </button>
          <button className="profile-logout" type="button" onClick={() => void logout()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 4H5v16h5m4-4 4-4-4-4m4 4H9" /></svg>{t.logout}
          </button>
        </div>
      </div>

      {profileDraft && (
        <div className="profile-address-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setProfileDraft(null); }}>
          <section className="profile-address-dialog" role="dialog" aria-modal="true" aria-labelledby="profile-edit-dialog-title">
            <div className="profile-address-dialog-heading">
              <div><h2 id="profile-edit-dialog-title">{t.editProfileTitle}</h2><p>{t.editProfileSubtitle}</p></div>
              <button type="button" aria-label={t.closeFormAria} onClick={() => setProfileDraft(null)}>×</button>
            </div>
            <form onSubmit={(event) => void saveProfile(event)}>
              <label>{t.fullName}<input required minLength={2} maxLength={80} value={profileDraft.name} onChange={(event) => setProfileDraft({ ...profileDraft, name: event.target.value })} /></label>
              <label>{t.emailAddress}<input type="email" value={profileDraft.email} onChange={(event) => setProfileDraft({ ...profileDraft, email: event.target.value })} placeholder="you@example.com" /></label>
              <label>{t.phoneNumber}<input value={profile.phone} readOnly disabled title={t.loginPhoneHelp} /></label>
              {profileError && <p className="profile-form-error" role="alert">{profileError}</p>}
              <div className="profile-address-form-actions">
                <button type="button" onClick={() => setProfileDraft(null)}>{t.cancel}</button>
                <button type="submit" disabled={profileSaving}>{profileSaving ? t.saving : t.saveProfile}</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {isAddressListOpen && (
        <AllAddress
          addresses={addresses}
          note={addressNote}
          onClose={() => setIsAddressListOpen(false)}
          onAdd={() => openAddressEditor()}
          onEdit={openAddressEditor}
          onDelete={(id) => void deleteAddress(id)}
          onMakeDefault={(id) => void makeDefault(id)}
        />
      )}
      {isAddressEditorOpen && (
        <Address
          initialValues={(() => {
            const address = addresses?.find((item) => item.id === editingAddressId);
            return address ? {
              addressType: address.label ?? "",
              recipient: address.contactName,
              phone: address.phone,
              alternatePhone: address.altPhone ?? "",
              locality: address.locality ?? "",
              addressLine1: address.line1,
              addressLine2: address.line2 ?? "",
              houseNumber: address.apartmentNumber ?? "",
              landmark: address.landmark ?? "",
              pincode: address.pincode ?? "",
            } : undefined;
          })()}
          onClose={() => {
            setIsAddressEditorOpen(false);
            setEditingAddressId(null);
          }}
          onSave={saveAddress}
        />
      )}
      {question && <ConfirmBox config={question} onAnswer={(yes) => { question.resolve(yes); setQuestion(null); }} />}
      {likedProducts.length > 0 && <Products heading={t.likedProductsHeading} products={likedProducts} />}
    </main>
  );
}

export default function MyProfilePage() {
  return <RequireLogin what="your profile"><MyProfileContent /></RequireLogin>;
}
