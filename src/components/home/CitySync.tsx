"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useCity } from "@/lib/city";
import { applyRemoteCityAction, selectCityAction, serverCityAction } from "@/app/actions";

/**
 * Keeps the delivery city of this browser the same as the one on the customer's account, so choosing a city in the app changes it here at
 * once (and the other way round). Nothing renders.
 *   sign-in: the account's city is taken over (when it has none, the city chosen here is saved to it)
 *   "city" live event: taken over, and the cart of the old city is emptied (the shop's rule: a new city means a new cart)
 */
export default function CitySync() {
  const { user } = useAuth();
  const { city } = useCity();
  const router = useRouter();
  const current = useRef(city);
  current.current = city;

  useEffect(() => {
    if (!user) return;
    let alive = true;

    const take = async (cityId: string, pincode?: string | null) => {
      const here = current.current;
      if (here && here.id === cityId && (here.pincode ?? "") === (pincode ?? "")) return;
      const changedCity = !here || here.id !== cityId;
      const res = await applyRemoteCityAction(cityId, pincode);
      if (!alive || !res.ok) return;
      if (changedCity) window.dispatchEvent(new Event("tazahat:clear-cart"));
      router.refresh();
    };

    void serverCityAction().then((server) => {
      if (!alive) return;
      if (server) void take(server.city.id, server.pincode);
      else if (current.current) void selectCityAction({ id: current.current.id, name: current.current.name } as never, current.current.pincode);
    });

    const onRemote = (e: Event) => {
      const d = (e as CustomEvent<{ city?: { id: string }; pincode?: string | null }>).detail;
      if (d?.city?.id) void take(d.city.id, d.pincode);
    };
    window.addEventListener("tazahat:city-remote", onRemote);
    return () => { alive = false; window.removeEventListener("tazahat:city-remote", onRemote); };
  }, [user, router]);

  return null;
}
