"use client";

import { useWishlistProducts } from "@/lib/useWishlistProducts";

import RequireLogin from "@/components/auth/RequireLogin";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Products from "@/components/products/Products";
import Address, { type AddressFormValues } from "@/components/modals/address/Address";
import { myOrderCountsAction } from "@/app/checkout-actions";
import { useAuth } from "@/lib/auth";
import { deleteAddressAction, listAddressesAction, makeDefaultAddressAction, saveAddressAction, type SavedAddress } from "@/app/address-actions";
import { updateProfileAction } from "@/app/profile-actions";
import { mediaSrc } from "@/lib/api";
import englishText from "./english.json";
import bengaliText from "./bengali.json";
import hindiText from "./hindi.json";
import { type SupportedLang, useLanguage } from "@/lib/language";
import "./MyProfile.css";

const toFormValues = (a: SavedAddress): AddressFormValues => ({
  addressType: a.label ?? "", recipient: a.contactName, phone: a.phone, alternatePhone: a.altPhone ?? "", locality: a.locality ?? "", addressLine1: a.line1,
  addressLine2: a.line2 ?? "", houseNumber: a.apartmentNumber ?? "", landmark: a.landmark ?? "", pincode: a.pincode ?? "",
});

const textMap: Record<SupportedLang, typeof englishText> = { en: englishText, bn: bengaliText, hi: hindiText };


function ProfileIcon({ children }: { children: React.ReactNode }) {
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
      <path d="M105 42c0-7 4-11 9-12" stroke="#397F4F" strokeWidth="3" strokeLinecap="round" />
      <path d="M181 46c1-6 5-9 10-10" stroke="#397F4F" strokeWidth="3" strokeLinecap="round" />
      <path d="m105 73 4 91m73-91-9 91" stroke="#E7AE59" strokeWidth="2" />
      <path d="M216 50c15 7 24 21 24 39m-9-9 9 9 8-10" stroke="#3F8DD4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="224" cy="115" r="18" fill="#fff" fillOpacity=".6" />
      <path d="M216 115h16m-8-8v16" stroke="#3F8DD4" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function MyProfileContent() {
  const [currentLang] = useLanguage();
  const t = textMap[currentLang] || englishText;
  // the real number of orders in each state (asked from the server)
  const [orderCounts, setOrderCounts] = useState<Record<"all" | "complete" | "upcoming" | "cancel", number> | null>(null);
  useEffect(() => { myOrderCountsAction().then(c => c && setOrderCounts(c)); }, []);
  const { products: likedProducts } = useWishlistProducts();
  // the real customer (from the account) and the real saved addresses (from the server)
  const { user, updateUser } = useAuth();
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const profile = { name: user?.name ?? "", email: user?.email ?? "", phone: user?.phone ? `+91 ${user.phone}` : "" };
  const avatarUrl = user?.avatarUrl ? mediaSrc(user.avatarUrl) : "";
  const [profileDraft, setProfileDraft] = useState<{ name: string; email: string } | null>(null);
  const [profileError, setProfileError] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [addresses, setAddresses] = useState<SavedAddress[] | null>(null);
  const [isAddressDrawerOpen, setIsAddressDrawerOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressNote, setAddressNote] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { void listAddressesAction().then(setAddresses); }, []);
  const defaultAddressId = addresses?.find((a) => a.isDefault)?.id ?? "";

  const selectPhoto = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setAvatarError("Choose a picture."); return; }
    setAvatarBusy(true); setAvatarError("");
    try {
      const res = await fetch("/api/avatar", { method: "POST", headers: { "content-type": file.type }, body: file });
      const json = (await res.json().catch(() => null)) as { status?: string; message?: string; data?: { avatarUrl: string } } | null;
      if (!res.ok || json?.status !== "success" || !json.data) setAvatarError(json?.message ?? "The picture could not be saved.");
      else if (user) updateUser({ ...user, avatarUrl: json.data.avatarUrl });
    } catch { setAvatarError("No connection. Please try again."); }
    setAvatarBusy(false);
  };

  const openAddressEditor = (address?: SavedAddress) => {
    setEditingAddressId(address?.id ?? null);
    setIsAddressDrawerOpen(true);
  };

  const saveAddress = async (values: AddressFormValues) => {
    const res = await saveAddressAction({
      label: values.addressType, contactName: values.recipient, phone: values.phone, altPhone: values.alternatePhone || undefined, line1: values.addressLine1,
      line2: values.addressLine2 || undefined, apartmentNumber: values.houseNumber || undefined, landmark: values.landmark || undefined, locality: values.locality || undefined,
      pincode: values.pincode, ...(editingAddressId ? {} : { makeDefault: true }),
    }, editingAddressId ?? undefined);
    if (!res.ok) return res.error;
    setAddresses(await listAddressesAction());
    return null;
  };

  const deleteAddress = async (addressId: string) => {
    setAddressNote("");
    const res = await deleteAddressAction(addressId);
    if (!res.ok) { setAddressNote(res.error); return; }
    setAddresses(await listAddressesAction());
  };

  const makeDefault = async (addressId: string) => {
    setAddressNote("");
    const res = await makeDefaultAddressAction(addressId);
    if (!res.ok) { setAddressNote(res.error); return; }
    setAddresses(await listAddressesAction());
  };

  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profileDraft || profileSaving) return;
    setProfileSaving(true); setProfileError("");
    const res = await updateProfileAction(profileDraft);
    setProfileSaving(false);
    if (!res.ok) { setProfileError(res.error); return; }
    updateUser(res.user);
    setProfileDraft(null);
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
      icon: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4.5 7.8 7.5 4.3 7.5-4.3M12 12v8.5" /><path d="m9 12 2 2 4-4" /></>,
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

  return (
    <main className="my-profile-page" lang={t.language}>
      <div className="my-profile-container">
        <section className="profile-hero" aria-labelledby="profile-heading">
          <div className="profile-identity">
            <div className="profile-avatar-wrap">
              <div
                className={`profile-avatar${avatarUrl ? " has-photo" : ""}${avatarBusy ? " is-busy" : ""}`}
                style={avatarUrl ? { backgroundImage: `url("${avatarUrl}")` } : undefined}
                role={avatarUrl ? "img" : undefined}
                aria-label={avatarUrl ? t.photoAlt : undefined}
              >
                {!avatarUrl && (
                  <ProfileIcon>
                    <circle cx="12" cy="8" r="3.5" />
                    <path d="M5 20v-1.5a7 7 0 0 1 14 0V20" />
                  </ProfileIcon>
                )}
              </div>
              <button
                className="profile-photo-button"
                type="button"
                aria-label={t.choosePhotoAria}
                onClick={() => photoInputRef.current?.click()}
              >
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

            {avatarError && <p className="profile-form-error" role="alert">{avatarError}</p>}
            <div className="profile-details">
              <span className="profile-greeting">{t.welcomeBack}</span>
              <h1 id="profile-heading">{profile.name}</h1>
              <p><ProfileIcon><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></ProfileIcon><span>{profile.email || "Add your e-mail address"}</span></p>
              <p><ProfileIcon><path d="M21 16.5v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 1.1 3.8 2 2 0 0 1 3.1 1.6h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L7 9.6a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z" /></ProfileIcon><span>{profile.phone}</span></p>
            </div>
          </div>
          <div className="profile-hero-message" aria-hidden="true">
            <span>{t.goodFood}</span>
            <span>{t.goodLife}</span>
            <i>♡</i>
          </div>
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

        <section className="profile-next-step">
          <span className="profile-next-step-icon"><ProfileIcon><path d="M3 7h18v13H3z" /><path d="M3 7 12 2l9 5M8 12h8m-8 4h5" /></ProfileIcon></span>
          <span><strong>{t.bannerTitle}</strong><small>{t.bannerSubtitle}</small></span>
          <Link href="/orders">{t.viewMyOrders} <span aria-hidden="true">→</span></Link>
        </section>

        <section className="profile-addresses" aria-labelledby="profile-addresses-heading">
          <div className="profile-addresses-header">
            <div className="profile-addresses-title">
              <span className="profile-addresses-icon"><ProfileIcon><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></ProfileIcon></span>
              <span><h2 id="profile-addresses-heading">{t.addressesHeading}</h2><p>{t.addressesSubtitle}</p></span>
            </div>
            <button className="profile-add-address" type="button" onClick={() => openAddressEditor()}>
              <ProfileIcon><path d="M12 5v14m-7-7h14" /></ProfileIcon>
              {t.addAddress}
            </button>
          </div>
          {addressNote && <p className="profile-address-note" role="alert">{addressNote}</p>}
          <div className="profile-address-grid">
            {addresses === null && [0, 1].map((i) => <div key={i} className="profile-address-card sk" style={{ minHeight: 112 }} aria-hidden="true" />)}
            {addresses?.length === 0 && <p className="profile-address-empty">You have no saved address yet. Add one to order faster.</p>}
            {addresses?.map((address) => {
              const type = address.label || "Address";
              return (
                <article className={`profile-address-card${defaultAddressId === address.id ? " is-default" : ""}`} key={address.id}>
                  <div className="profile-address-topline">
                    <label className="profile-address-choice">
                      <input type="radio" name="default-address" checked={defaultAddressId === address.id} onChange={() => void makeDefault(address.id)} aria-label={t.setDefaultAddressAria.replace("{type}", type)} />
                      <span>{address.contactName} ({type})</span>
                    </label>
                    <button className="profile-address-edit" type="button" aria-label={t.editAddressAria.replace("{type}", type)} onClick={() => openAddressEditor(address)}>
                      <ProfileIcon><path d="m14 5 5 5M4 20l4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z" /></ProfileIcon>
                    </button>
                    <button className="profile-address-delete" type="button" aria-label={t.deleteAddressAria.replace("{type}", type)} onClick={() => void deleteAddress(address.id)}>
                      <ProfileIcon><path d="M3 6h18m-2 0-.9 14H5.9L5 6m4 0V4h6v2m-5 4v6m4-6v6" /></ProfileIcon>
                    </button>
                  </div>
                  <p className="profile-address-details">{type}: {[address.apartmentNumber, address.line1, address.line2, address.locality, address.landmark, address.cityName, address.pincode].filter(Boolean).join(", ")}</p>
                  <p className="profile-address-phone"><ProfileIcon><path d="M21 16.5v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 1.1 3.8 2 2 0 0 1 3.1 1.6h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L7 9.6a16 16 0 0 0 7.4 7.4l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z" /></ProfileIcon>{address.phone}</p>
                </article>
              );
            })}
          </div>
        </section>

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
                <label>{t.phoneNumber}<input value={profile.phone} readOnly disabled title="This is the number you sign in with" /></label>
                {profileError && <p className="profile-form-error" role="alert">{profileError}</p>}
                <div className="profile-address-form-actions"><button type="button" onClick={() => setProfileDraft(null)}>{t.cancel}</button><button type="submit" disabled={profileSaving}>{profileSaving ? "Saving…" : t.saveProfile}</button></div>
              </form>
            </section>
          </div>
        )}

      </div>
      {isAddressDrawerOpen && (
        <Address
          initialValues={addresses?.find((address) => address.id === editingAddressId) ? toFormValues(addresses.find((address) => address.id === editingAddressId)!) : undefined}
          onClose={() => {
            setIsAddressDrawerOpen(false);
            setEditingAddressId(null);
          }}
          onSave={saveAddress}
        />
      )}
      {likedProducts.length > 0 && <Products heading={t.likedProductsHeading} products={likedProducts} />}
    </main>
  );
}

/** Needs a login: without one the page asks the visitor to log in. */
export default function MyProfilePage() {
  return <RequireLogin what="your profile"><MyProfileContent /></RequireLogin>;
}
