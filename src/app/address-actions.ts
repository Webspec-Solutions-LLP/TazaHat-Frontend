"use server";

import { userApi } from "@/lib/server/session";

/** The customer's saved delivery addresses. Server actions: the tokens stay in httpOnly cookies, see lib/server/session.ts. */

export interface SavedAddress {
  id: string; label: string | null; contactName: string; phone: string; altPhone: string | null; line1: string; line2: string | null; landmark: string | null;
  apartmentNumber: string | null; locality: string | null; cityName: string | null; cityId: string | null; stateName: string | null; areaName: string | null;
  pincode: string | null; isDefault: boolean; serviceable: boolean;
}
export interface AddressInput {
  label?: string; contactName: string; phone: string; altPhone?: string; line1: string; line2?: string; apartmentNumber?: string; landmark?: string;
  locality?: string; pincode: string; makeDefault?: boolean;
}
type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export async function listAddressesAction(): Promise<SavedAddress[]> {
  const res = await userApi<{ addresses: SavedAddress[] }>("/addresses");
  return res.ok ? res.data.addresses : [];
}

export async function saveAddressAction(input: AddressInput, id?: string): Promise<Result<SavedAddress>> {
  const res = await userApi<{ address: SavedAddress }>(id ? `/addresses/${encodeURIComponent(id)}` : "/addresses", { method: id ? "PUT" : "POST", body: input });
  return res.ok ? { ok: true, data: res.data.address } : { ok: false, error: res.message };
}

export async function deleteAddressAction(id: string): Promise<Result<null>> {
  const res = await userApi<unknown>(`/addresses/${encodeURIComponent(id)}`, { method: "DELETE" });
  return res.ok ? { ok: true, data: null } : { ok: false, error: res.message };
}

export async function makeDefaultAddressAction(id: string): Promise<Result<null>> {
  const res = await userApi<unknown>(`/addresses/${encodeURIComponent(id)}/default`, { method: "POST", body: {} });
  return res.ok ? { ok: true, data: null } : { ok: false, error: res.message };
}

/** what a PIN code means for delivery: null while it is not a full 6-digit PIN or the check failed */
export async function lookupPincodeAction(pincode: string): Promise<{ serviceable: boolean; city: string | null; state: string | null } | null> {
  if (!/^\d{6}$/.test(pincode)) return null;
  const res = await userApi<{ serviceable: boolean; city: { name: string } | null; stateName: string | null }>(`/addresses/lookup?pincode=${pincode}`);
  return res.ok ? { serviceable: res.data.serviceable, city: res.data.city?.name ?? null, state: res.data.stateName } : null;
}
