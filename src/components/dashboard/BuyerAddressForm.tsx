
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getFirebase } from "@/firebase/client-init";
import { doc, setDoc } from "firebase/firestore";

export default function BuyerAddressForm() {
  const { user, profile, refreshProfile } = useAuth();
  const { firestore: db } = getFirebase();
  const [address, setAddress] = useState({
    name: profile?.shippingAddress?.name || "",
    address1: profile?.shippingAddress?.address1 || "",
    address2: profile?.shippingAddress?.address2 || "",
    city: profile?.shippingAddress?.city || "",
    state: profile?.shippingAddress?.state || "",
    zip: profile?.shippingAddress?.zip || "",
    country: profile?.shippingAddress?.country || "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setAddress({
      name: profile?.shippingAddress?.name || "",
      address1: profile?.shippingAddress?.address1 || "",
      address2: profile?.shippingAddress?.address2 || "",
      city: profile?.shippingAddress?.city || "",
      state: profile?.shippingAddress?.state || "",
      zip: profile?.shippingAddress?.zip || "",
      country: profile?.shippingAddress?.country || "",
    });
  }, [profile]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      if (!user || !db) throw new Error("Not signed in");
      const ref = doc(db, "users", user.uid);
      await setDoc(ref, { shippingAddress: address }, { merge: true });
      setSuccess(true);
      if (refreshProfile) await refreshProfile();
    } catch (err: any) {
      setError(err.message || "Failed to save address");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="bg-card/80 border-2 border-black rounded-2xl p-6 mb-6" onSubmit={handleSave}>
      <h2 className="text-lg font-bold mb-4 text-primary">Shipping Address</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <input
          className="border rounded p-2 w-full"
          placeholder="Full Name"
          value={address.name}
          onChange={e => setAddress({ ...address, name: e.target.value })}
          required
        />
        <input
          className="border rounded p-2 w-full"
          placeholder="Street Address"
          value={address.address1}
          onChange={e => setAddress({ ...address, address1: e.target.value })}
          required
        />
        <input
          className="border rounded p-2 w-full"
          placeholder="Address 2 (optional)"
          value={address.address2}
          onChange={e => setAddress({ ...address, address2: e.target.value })}
        />
        <input
          className="border rounded p-2 w-full"
          placeholder="City"
          value={address.city}
          onChange={e => setAddress({ ...address, city: e.target.value })}
          required
        />
        <input
          className="border rounded p-2 w-full"
          placeholder="State/Province"
          value={address.state}
          onChange={e => setAddress({ ...address, state: e.target.value })}
          required
        />
        <input
          className="border rounded p-2 w-full"
          placeholder="ZIP/Postal Code"
          value={address.zip}
          onChange={e => setAddress({ ...address, zip: e.target.value })}
          required
        />
        <input
          className="border rounded p-2 w-full"
          placeholder="Country"
          value={address.country}
          onChange={e => setAddress({ ...address, country: e.target.value })}
          required
        />
      </div>
      <button
        type="submit"
        className="comic-button px-6 py-2 rounded custom-btn-shadow text-white bg-primary border-2 border-black hover:bg-destructive hover:text-black transition"
        disabled={loading}
      >
        {loading ? "Saving..." : "Save Address"}
      </button>
      {success && <div className="text-green-600 mt-2">Address saved!</div>}
      {error && <div className="text-red-600 mt-2">{error}</div>}
    </form>
  );
}
