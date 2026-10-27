"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Products from "@/components/products/Products";
import Address, { type AddressFormValues } from "@/components/modals/address/Address";
import orderData from "../myOrders/orderData.json";
import "./MyProfile.css";

const orders = orderData.orders;

type SavedAddress = AddressFormValues & {
  id: string;
};

const initialAddresses: SavedAddress[] = [
  {
    id: "home",
    recipient: "Joydeep Barik",
    addressType: "Home",
    phone: "9000000000",
    alternatePhone: "9000000000",
    locality: "Kolkata",
    addressLine1: "12 Example Road",
    addressLine2: "",
    houseNumber: "12",
    landmark: "Near Example Market",
    pincode: "700029",
  },
  {
    id: "office",
    recipient: "Joydeep Barik",
    addressType: "Office",
    phone: "9000000000",
    alternatePhone: "9000000000",
    locality: "Bidhannagar",
    addressLine1: "C/O Joydeep Barik, Sector V",
    addressLine2: "",
    houseNumber: "",
    landmark: "Near Tech Park",
    pincode: "700091",
  },
  {
    id: "other",
    recipient: "Joydeep Barik",
    addressType: "Other",
    phone: "9000000000",
    alternatePhone: "9000000000",
    locality: "Kolkata",
    addressLine1: "24 Sample Street",
    addressLine2: "",
    houseNumber: "24",
    landmark: "Opposite Central Library",
    pincode: "700016",
  },
];

const stats = [
  {
    id: "total",
    label: "Total orders",
    detail: "View all your orders",
    count: orders.length,
    tone: "blue",
    icon: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20v-1.5a7 7 0 0 1 14 0V20" /></>,
  },
  {
    id: "delivered",
    label: "Delivered",
    detail: "Orders completed",
    count: orders.filter((order) => order.status === "complete").length,
    tone: "green",
    icon: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4.5 7.8 7.5 4.3 7.5-4.3M12 12v8.5" /><path d="m9 12 2 2 4-4" /></>,
  },
  {
    id: "pending",
    label: "Pending",
    detail: "Orders in process",
    count: orders.filter((order) => order.status === "upcoming").length,
    tone: "amber",
    icon: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  },
  {
    id: "cancelled",
    label: "Cancelled",
    detail: "Cancelled orders",
    count: orders.filter((order) => order.status === "cancel").length,
    tone: "red",
    icon: <><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6m0-6-6 6" /></>,
  },
];

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

export default function MyProfilePage() {
  const [avatarUrl, setAvatarUrl] = useState("");
  const [profile, setProfile] = useState({ name: "Joydeep Barik", email: "customer@tazahat.in", phone: "+91 90000 00000" });
  const [profileDraft, setProfileDraft] = useState<typeof profile | null>(null);
  const [addresses, setAddresses] = useState(initialAddresses);
  const [defaultAddressId, setDefaultAddressId] = useState("office");
  const [isAddressDrawerOpen, setIsAddressDrawerOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!avatarUrl) return;
    return () => URL.revokeObjectURL(avatarUrl);
  }, [avatarUrl]);

  const selectPhoto = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    setAvatarUrl(URL.createObjectURL(file));
  };

  const openAddressEditor = (address?: SavedAddress) => {
    setEditingAddressId(address?.id ?? null);
    setIsAddressDrawerOpen(true);
  };

  const saveAddress = (values: AddressFormValues) => {
    const savedAddress: SavedAddress = {
      ...values,
      id: editingAddressId ?? crypto.randomUUID(),
    };
    setAddresses((current) => editingAddressId
      ? current.map((address) => address.id === editingAddressId ? savedAddress : address)
      : [...current, savedAddress]);
    if (!editingAddressId) setDefaultAddressId(savedAddress.id);
  };

  const deleteAddress = (addressId: string) => {
    const remainingAddresses = addresses.filter((address) => address.id !== addressId);
    setAddresses(remainingAddresses);
    if (defaultAddressId === addressId) setDefaultAddressId(remainingAddresses[0]?.id ?? "");
  };

  const saveProfile = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profileDraft) return;
    setProfile(profileDraft);
    setAddresses((current) => current.map((address) => ({
      ...address,
      recipient: address.recipient === profile.name ? profileDraft.name : address.recipient,
      addressLine1: address.addressLine1.replaceAll(profile.name, profileDraft.name),
      addressLine2: address.addressLine2.replaceAll(profile.name, profileDraft.name),
    })));
    setProfileDraft(null);
  };

  return (
    <main className="my-profile-page">
      <div className="my-profile-container">
        <section className="profile-hero" aria-labelledby="profile-heading">
          <div className="profile-identity">
            <div className="profile-avatar-wrap">
              <div
                className={`profile-avatar${avatarUrl ? " has-photo" : ""}`}
                style={avatarUrl ? { backgroundImage: `url("${avatarUrl}")` } : undefined}
                role={avatarUrl ? "img" : undefined}
                aria-label={avatarUrl ? "Your profile photo" : undefined}
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
                aria-label="Choose a profile photo"
                onClick={() => photoInputRef.current?.click()}
              >
                <ProfileIcon><path d="M4 8h3l1.5-2h7L17 8h3v11H4V8Z" /><circle cx="12" cy="13" r="3" /></ProfileIcon>
              </button>
              <input
                ref={photoInputRef}
                className="profile-photo-input"
                type="file"
                accept="image/*"
                aria-label="Upload a profile photo"
                onChange={(event) => {
                  selectPhoto(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
            </div>

            <div className="profile-details">
              <span className="profile-greeting">Welcome back</span>
              <h1 id="profile-heading">{profile.name}</h1>
              <p><ProfileIcon><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></ProfileIcon><span>{profile.email}</span></p>
              <p><ProfileIcon><path d="M21 16.5v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 1.1 3.8 2 2 0 0 1 3.1 1.6h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L7 9.6a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z" /></ProfileIcon><span>{profile.phone}</span></p>
            </div>
          </div>
          <div className="profile-hero-message" aria-hidden="true">
            <span>Good Food</span>
            <span>Good Life</span>
            <i>♡</i>
          </div>
          <GroceryIllustration />
          <button className="profile-edit-button" type="button" onClick={() => setProfileDraft(profile)}>Edit profile</button>
        </section>

        <section className="profile-stat-grid" aria-label="Order summary">
          {stats.map((stat) => (
            <Link
              className={`profile-stat-card profile-stat-card--${stat.tone}`}
              href="/myOrders"
              key={stat.id}
              aria-label={`${stat.label}: ${stat.count}. ${stat.detail}`}
            >
              <span className="profile-stat-icon"><ProfileIcon>{stat.icon}</ProfileIcon></span>
              <span className="profile-stat-copy">
                <span>{stat.label}</span>
                <strong>{stat.count}</strong>
                <small>{stat.detail}{stat.id === "total" && <b aria-hidden="true"> →</b>}</small>
              </span>
            </Link>
          ))}
        </section>

        <section className="profile-next-step">
          <span className="profile-next-step-icon"><ProfileIcon><path d="M3 7h18v13H3z" /><path d="M3 7 12 2l9 5M8 12h8m-8 4h5" /></ProfileIcon></span>
          <span><strong>Your orders, all in one place</strong><small>Check delivery progress, order history, and more.</small></span>
          <Link href="/myOrders">View my orders <span aria-hidden="true">→</span></Link>
        </section>

        <section className="profile-addresses" aria-labelledby="profile-addresses-heading">
          <div className="profile-addresses-header">
            <div className="profile-addresses-title">
              <span className="profile-addresses-icon"><ProfileIcon><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></ProfileIcon></span>
              <span><h2 id="profile-addresses-heading">Delivery Addresses</h2><p>Manage your delivery locations</p></span>
            </div>
            <button className="profile-add-address" type="button" onClick={() => openAddressEditor()}>
              <ProfileIcon><path d="M12 5v14m-7-7h14" /></ProfileIcon>
              Add Address
            </button>
          </div>
          <div className="profile-address-grid">
            {addresses.map((address) => (
              <article className={`profile-address-card${defaultAddressId === address.id ? " is-default" : ""}`} key={address.id}>
                <div className="profile-address-topline">
                  <label className="profile-address-choice">
                    <input
                      type="radio"
                      name="default-address"
                      checked={defaultAddressId === address.id}
                      onChange={() => setDefaultAddressId(address.id)}
                      aria-label={`Set ${address.addressType} as your default delivery address`}
                    />
                    <span>{address.recipient} ({address.addressType})</span>
                  </label>
                  <button className="profile-address-edit" type="button" aria-label={`Edit ${address.addressType} address`} onClick={() => openAddressEditor(address)}>
                    <ProfileIcon><path d="m14 5 5 5M4 20l4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z" /></ProfileIcon>
                  </button>
                  <button className="profile-address-delete" type="button" aria-label={`Delete ${address.addressType} address`} onClick={() => deleteAddress(address.id)}>
                    <ProfileIcon><path d="M3 6h18m-2 0-.9 14H5.9L5 6m4 0V4h6v2m-5 4v6m4-6v6" /></ProfileIcon>
                  </button>
                </div>
                <p className="profile-address-details">{address.addressType}: {[address.houseNumber, address.addressLine1, address.addressLine2, address.locality, address.landmark, address.pincode].filter(Boolean).join(", ")}</p>
                <p className="profile-address-phone"><ProfileIcon><path d="M21 16.5v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 1.1 3.8 2 2 0 0 1 3.1 1.6h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L7 9.6a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z" /></ProfileIcon>+91 {address.phone}</p>
              </article>
            ))}
          </div>
        </section>

        {profileDraft && (
          <div className="profile-address-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setProfileDraft(null); }}>
            <section className="profile-address-dialog" role="dialog" aria-modal="true" aria-labelledby="profile-edit-dialog-title">
              <div className="profile-address-dialog-heading">
                <div><h2 id="profile-edit-dialog-title">Edit profile</h2><p>Update your contact details.</p></div>
                <button type="button" aria-label="Close profile form" onClick={() => setProfileDraft(null)}>×</button>
              </div>
              <form onSubmit={saveProfile}>
                <label>Full name<input required value={profileDraft.name} onChange={(event) => setProfileDraft({ ...profileDraft, name: event.target.value })} /></label>
                <label>Email address<input required type="email" value={profileDraft.email} onChange={(event) => setProfileDraft({ ...profileDraft, email: event.target.value })} /></label>
                <label>Phone number<input required type="tel" value={profileDraft.phone} onChange={(event) => setProfileDraft({ ...profileDraft, phone: event.target.value })} /></label>
                <div className="profile-address-form-actions"><button type="button" onClick={() => setProfileDraft(null)}>Cancel</button><button type="submit">Save profile</button></div>
              </form>
            </section>
          </div>
        )}

      </div>
      {isAddressDrawerOpen && (
        <Address
          initialValues={addresses.find((address) => address.id === editingAddressId)}
          onClose={() => {
            setIsAddressDrawerOpen(false);
            setEditingAddressId(null);
          }}
          onSave={saveAddress}
        />
      )}
      <Products heading="Your liked products" />
    </main>
  );
}