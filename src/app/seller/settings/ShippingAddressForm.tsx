import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function ShippingAddressForm() {
  const { user, profile } = useAuth();
  type Address = {
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  const storeAddress = profile?.storeAddress as Partial<Address> | undefined;
  const [address, setAddress] = useState<Address>({
    name: typeof profile?.storeName === "string" ? profile.storeName : (typeof profile?.displayName === "string" ? profile.displayName : ""),
    street: typeof storeAddress?.street === "string" ? storeAddress.street : "",
    city: typeof storeAddress?.city === "string" ? storeAddress.city : "",
    state: typeof storeAddress?.state === "string" ? storeAddress.state : "",
    zip: typeof storeAddress?.zip === "string" ? storeAddress.zip : "",
    country: typeof storeAddress?.country === "string" ? storeAddress.country : "US",
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      if (!user) throw new Error("Not signed in");
      await updateDoc(doc(db, "users", user.uid), {
        storeAddress: address,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to save address");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mt-6 border-2 border-black bg-card/80">
      <CardHeader>
        <CardTitle>Shipping Address</CardTitle>
        <CardDescription>
          This address will be used as your shipping origin for all listings. Update it if you move or need to ship from a different location.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-3 max-w-md">
          <Input name="name" value={address.name || ""} onChange={handleChange} placeholder="Name" required />
          <Input name="street" value={address.street || ""} onChange={handleChange} placeholder="Street Address" required />
          <Input name="city" value={address.city || ""} onChange={handleChange} placeholder="City" required />
          <Input name="state" value={address.state || ""} onChange={handleChange} placeholder="State" required />
          <Input name="zip" value={address.zip || ""} onChange={handleChange} placeholder="ZIP Code" required />
          <select name="country" value={address.country || "US"} onChange={handleChange} className="w-full border rounded px-2 py-1" required title="Country">
            <option value="US">United States</option>
            {/* Add more countries as needed */}
          </select>
          <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Address"}</Button>
          {success && <div className="text-green-600 text-sm mt-2">Address updated!</div>}
          {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
        </form>
      </CardContent>
    </Card>
  );
}
