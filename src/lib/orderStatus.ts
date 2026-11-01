export type OrderStatusCode = "PENDING" | "IN_PROGRESS" | "PROCESSING" | "PACKAGING" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED";
/** the words shown to the customer, and the group (tab / colour) each status belongs to */
export const STATUS_TEXT: Record<OrderStatusCode, string> = { PENDING: "Order placed", IN_PROGRESS: "In progress", PROCESSING: "Processing", PACKAGING: "Packing", OUT_FOR_DELIVERY: "Out for delivery", DELIVERED: "Delivered", CANCELLED: "Cancelled" };
export const statusGroup = (s: OrderStatusCode): "upcoming" | "complete" | "cancel" => (s === "DELIVERED" ? "complete" : s === "CANCELLED" ? "cancel" : "upcoming");
