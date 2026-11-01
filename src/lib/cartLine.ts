/** Dressing charge in rupees. The type's price is for 1000 g: a weight pack pays in proportion to its grams, a counted pack pays it once. */
export function dressingChargeRupees(ratePaisa: number, grams: number | null | undefined): number {
  const paisa = grams ? (ratePaisa * grams) / 1000 : ratePaisa;
  return Math.round(paisa / 100);
}

/** What the server needs to re-check and price a cart line again (variant + dressing); the rest of a CartItem is for showing. */
export type CartLineRef = { variantId: string; cuttingTypeId: string | null };
