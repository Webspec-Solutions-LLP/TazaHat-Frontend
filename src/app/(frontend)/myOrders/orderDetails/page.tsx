import Image from "next/image";
import { notFound } from "next/navigation";
import orderData from "../orderData.json";
import "./OrderDetails.css";

const orders = orderData.orders;
const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function getOrderItemCount(order: (typeof orders)[number]) {
  return order.products.reduce((count, product) => count + product.quantity, 0);
}

function getOrderTotal(order: (typeof orders)[number]) {
  return order.products.reduce((total, product) => total + product.quantity * product.price, 0);
}

interface OrderDetailsPageProps {
  searchParams: Promise<{ orderId?: string | string[] }>;
}

export default async function OrderDetailsPage({ searchParams }: OrderDetailsPageProps) {
  const { orderId } = await searchParams;
  const selectedOrderId = Array.isArray(orderId) ? orderId[0] : orderId;
  const order = orders.find(item => item.id === selectedOrderId);

  if (!order) notFound();

  const deliveredProductCount = order.products.filter(product => product.deliveryStatus === "delivered").length;

  return (
    <main className="order-details-page">
      <div className="order-details-container">
        <header className="order-details-heading">
          <div>
            <p>Order details</p>
            <h1>{order.id}</h1>
          </div>
          <span className={`order-details-status order-details-status--${order.status}`}>
            <span aria-hidden="true" />
            {order.status}
          </span>
        </header>

        <section className="order-details-card" aria-label="Order summary">
          <h2>Order summary</h2>
          <dl>
            <div><dt>Order date</dt><dd>{order.date}</dd></div>
            <div><dt>Items</dt><dd>{getOrderItemCount(order)} {getOrderItemCount(order) === 1 ? "item" : "items"}</dd></div>
            <div><dt>Order total</dt><dd>{money.format(getOrderTotal(order))}</dd></div>
            <div><dt>Payment</dt><dd>{order.payment}</dd></div>
            <div><dt>Delivery address</dt><dd>{order.deliveryAddress}</dd></div>
          </dl>
        </section>

        <section className="order-products-card" aria-labelledby="order-products-heading">
          <div className="order-products-heading">
            <div>
              <h2 id="order-products-heading">Products in this order</h2>
              <p>{deliveredProductCount} of {order.products.length} products delivered</p>
            </div>
            <span>{order.products.length} {order.products.length === 1 ? "product" : "products"}</span>
          </div>

          <div className="order-products-list">
            {order.products.map(product => (
              <article className="order-product-row" key={product.id}>
                <div className="order-product-image">
                  <Image src={product.image} alt={product.name} fill sizes="(max-width: 600px) 72px, 88px" />
                </div>
                <div className="order-product-copy">
                  <h3>{product.name}</h3>
                  <p>Qty: {product.quantity} <span>·</span> {product.unit}</p>
                </div>
                <strong className="order-product-price">{money.format(product.quantity * product.price)}</strong>
                <span className={`order-product-status order-product-status--${product.deliveryStatus}`}>
                  <span aria-hidden="true" />
                  {product.deliveryStatus.replace("-", " ")}
                </span>
              </article>
            ))}
          </div>

          <footer className="order-products-total">
            <span>Order total</span>
            <strong>{money.format(getOrderTotal(order))}</strong>
          </footer>
        </section>
      </div>
    </main>
  );
}