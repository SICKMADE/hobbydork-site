
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
      // Sanitize address: replace undefined with empty string
      const sanitizedAddress = Object.fromEntries(
        Object.entries(address).map(([k, v]) => [k, v === undefined ? "" : v])
      );
      await setDoc(ref, { shippingAddress: sanitizedAddress }, { merge: true });
      setSuccess(true);
      if (refreshProfile) await refreshProfile();
    } catch (err: any) {
      setError(err.message || "Failed to save address");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-card/80 border-2 border-black rounded-2xl p-6 mb-6">
      <h2 className="text-lg font-bold mb-4 text-black">Shipping Address</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <input
          className="border rounded p-2 w-full text-black"
          placeholder="Full Name"
          value={address.name}
          onChange={e => setAddress({ ...address, name: e.target.value })}
          required
        />
        <input
          className="border rounded p-2 w-full text-black"
          placeholder="Street Address"
          value={address.address1}
          onChange={e => setAddress({ ...address, address1: e.target.value })}
          required
        />
        <input
          className="border rounded p-2 w-full text-black"
          placeholder="City"
          value={address.city}
          onChange={e => setAddress({ ...address, city: e.target.value })}
          required
        />
        <input
          className="border rounded p-2 w-full text-black"
          placeholder="State/Province"
          value={address.state}
          onChange={e => setAddress({ ...address, state: e.target.value })}
          required
        />
        <input
          className="border rounded p-2 w-full text-black"
          placeholder="ZIP/Postal Code"
          value={address.zip}
          onChange={e => setAddress({ ...address, zip: e.target.value })}
          required
        />
        <input
          className="border rounded p-2 w-full text-black"
          placeholder="Country"
          value={address.country}
          onChange={e => setAddress({ ...address, country: e.target.value })}
          required
        />
      </div>
      <button
        onClick={handleSave}
        className="comic-button px-6 py-2 rounded custom-btn-shadow text-black bg-primary border-2 border-black hover:bg-destructive hover:text-black transition"
        disabled={loading}
      >
        {loading ? "Saving..." : "Save Address"}
      </button>
      {success && <div className="text-green-600 mt-2">Address saved!</div>}
      {error && <div className="text-red-600 mt-2">{error}</div>}
    </div>
  );
}
