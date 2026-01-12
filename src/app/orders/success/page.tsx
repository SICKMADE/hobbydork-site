// NOTE: This page is currently not used in the app flow. Stripe redirects to /cart/success after checkout.

export default function Success() {
  return (
    <div className="p-6 text-center">
      <h1 className="text-2xl font-bold">Payment Successful</h1>
      <p>Your order has been placed.</p>
    </div>
  );
}
