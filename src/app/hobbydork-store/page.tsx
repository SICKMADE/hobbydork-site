"use client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { httpsCallable } from "firebase/functions";

// Admin Order Management Modal
function ManageOrdersModal({ open, onClose, functions }: { open: boolean; onClose: () => void; functions: any }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editOrder, setEditOrder] = useState<{ state: string }>({ state: '' });
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchOrders = () => {
    setLoading(true);
    httpsCallable(functions, "adminListOrders")()
      .then((res: any) => setOrders(res.data.orders || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!open) return;
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, functions]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this order?")) return;
    setDeleting(id);
    try {
      await httpsCallable(functions, "adminDeleteOrder")({ id });
      fetchOrders();
    } finally {
      setDeleting(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Orders</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <ul className="space-y-2 max-h-[400px] overflow-y-auto">
            {orders.map((o: any) => (
              <li key={o.id} className="flex justify-between items-center border-b py-1 text-xs">
                {editingId === o.id ? (
                  <form
                    className="flex flex-1 gap-2 items-center"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setUpdating(true);
                      try {
                        await httpsCallable(functions, "adminUpdateOrder")({
                          id: o.id,
                          state: editOrder.state,
                        });
                        setEditingId(null);
                        fetchOrders();
                      } finally {
                        setUpdating(false);
                      }
                    }}
                  >
                    <span className="truncate max-w-[120px]">{o.listingTitle || o.id}</span>
                    <input
                      className="border rounded px-2 py-1 text-xs w-24"
                      value={editOrder.state}
                      onChange={e => setEditOrder((eo: any) => ({ ...eo, state: e.target.value }))}
                      required
                      placeholder="Order State"
                      title="Order State"
                    />
                    <Button size="xs" type="submit" disabled={updating}>{updating ? 'Saving...' : 'Save'}</Button>
                    <Button size="xs" variant="outline" type="button" onClick={() => setEditingId(null)}>Cancel</Button>
                  </form>
                ) : (
                  <>
                    <span className="truncate max-w-[120px]">{o.listingTitle || o.id}</span>
                    <span>{o.state}</span>
                    <span>{o.buyerUid}</span>
                    <div className="flex gap-2">
                      <Button size="xs" variant="secondary" onClick={() => { setEditingId(o.id); setEditOrder({ state: o.state || '' }); }}>Edit</Button>
                      <Button size="xs" variant="destructive" onClick={() => handleDelete(o.id)} disabled={deleting === o.id}>{deleting === o.id ? "Deleting..." : "Delete"}</Button>
                    </div>
                  </>
                )}
              </li>
            ))}
            {orders.length === 0 && <li>No orders found.</li>}
          </ul>
        )}
        <DialogFooter>
          <Button onClick={onClose} variant="outline">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Admin Product Management Modal
function ManageProductsModal({ open, onClose, functions }: { open: boolean; onClose: () => void; functions: any }) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editProduct, setEditProduct] = useState<{ name: string; price: string }>({ name: '', price: '' });
  const [updating, setUpdating] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '' });

  const fetchProducts = () => {
    setLoading(true);
    httpsCallable(functions, "adminListProducts")()
      .then((res: any) => setProducts(res.data.products || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!open) return;
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, functions]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this product?")) return;
    setDeleting(id);
    try {
      await httpsCallable(functions, "adminDeleteProduct")({ id });
      fetchProducts();
    } finally {
      setDeleting(null);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) return;
    setAdding(true);
    try {
      await httpsCallable(functions, "adminCreateProduct")({
        name: newProduct.name,
        price: parseFloat(newProduct.price),
      });
      setNewProduct({ name: '', price: '' });
      fetchProducts();
    } finally {
      setAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Products</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <ul className="space-y-2">
            {products.map((p: any) => (
              <li key={p.id} className="flex justify-between items-center border-b py-1">
                {editingId === p.id ? (
                  <form
                    className="flex flex-1 gap-2 items-center"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setUpdating(true);
                      try {
                        await httpsCallable(functions, "adminUpdateProduct")({
                          id: p.id,
                          name: editProduct.name,
                          price: parseFloat(editProduct.price),
                        });
                        setEditingId(null);
                        fetchProducts();
                      } finally {
                        setUpdating(false);
                      }
                    }}
                  >
                    <input
                      className="border rounded px-2 py-1 text-sm w-28"
                      value={editProduct.name}
                      onChange={e => setEditProduct((ep: any) => ({ ...ep, name: e.target.value }))}
                      required
                      placeholder="Product Name"
                      title="Product Name"
                    />
                    <input
                      className="border rounded px-2 py-1 text-sm w-20"
                      type="number"
                      min="0"
                      step="0.01"
                      value={editProduct.price}
                      onChange={e => setEditProduct((ep: any) => ({ ...ep, price: e.target.value }))}
                      required
                      placeholder="Price"
                      title="Price"
                    />
                    <Button size="xs" type="submit" disabled={updating}>{updating ? 'Saving...' : 'Save'}</Button>
                    <Button size="xs" variant="outline" type="button" onClick={() => setEditingId(null)}>Cancel</Button>
                  </form>
                ) : (
                  <>
                    <span>{p.name || p.title || p.id} <span className="text-muted-foreground ml-2">${p.price}</span></span>
                    <div className="flex gap-2">
                      <Button size="xs" variant="secondary" onClick={() => { setEditingId(p.id); setEditProduct({ name: p.name || '', price: String(p.price ?? '') }); }}>Edit</Button>
                      <Button size="xs" variant="destructive" onClick={() => handleDelete(p.id)} disabled={deleting === p.id}>{deleting === p.id ? "Deleting..." : "Delete"}</Button>
                    </div>
                  </>
                )}
              </li>
            ))}
            {products.length === 0 && <li>No products found.</li>}
          </ul>
        )}
        <form className="mt-4 flex gap-2 items-end" onSubmit={handleAdd}>
          <div>
            <label className="block text-xs font-semibold mb-1">Name</label>
            <input
              className="border rounded px-2 py-1 text-sm"
              value={newProduct.name}
              onChange={e => setNewProduct((p: any) => ({ ...p, name: e.target.value }))}
              required
              placeholder="Product Name"
              title="Product Name"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Price</label>
            <input
              className="border rounded px-2 py-1 text-sm"
              type="number"
              min="0"
              step="0.01"
              value={newProduct.price}
              onChange={e => setNewProduct((p: any) => ({ ...p, price: e.target.value }))}
              required
              placeholder="Price"
              title="Price"
            />
          </div>
          <Button type="submit" size="sm" disabled={adding} className="h-8">{adding ? 'Adding...' : 'Add Product'}</Button>
        </form>
        <DialogFooter>
          <Button onClick={onClose} variant="outline">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
// import { httpsCallable } from "firebase/functions"; // (already imported above)
import { useToast } from "@/hooks/use-toast";
import { useFirebaseApp } from "@/firebase/provider";
import { getFunctions } from "firebase/functions";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/layout/AppLayout";
import { Separator } from "@/components/ui/separator";

export default function HobbyDorkStorePage() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "ADMIN";

  const { toast } = useToast();
  const firebaseApp = useFirebaseApp();
  const [loading, setLoading] = useState<string | null>(null);
  const [showProducts, setShowProducts] = useState(false);
  const [showOrders, setShowOrders] = useState(false);

  async function handleBuy({
    orderId,
    listingTitle,
    amountCents,
  }: { orderId: string; listingTitle: string; amountCents: number }) {
    setLoading(orderId);
    try {
      const functions = getFunctions(firebaseApp);
      const createCheckoutSession = httpsCallable(functions, "createCheckoutSession");
      const { data } = await createCheckoutSession({
        orderId,
        listingTitle,
        amountCents,
        appBaseUrl: window.location.origin,
      });
      if (data && typeof data === "object" && "url" in data) {
        window.location.href = (data as any).url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      toast({
        title: "Checkout failed",
        description: err?.message || "Could not start checkout.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  }

  return (
          </Card>

          <Card className="border-2 border-primary shadow-md bg-card/90">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Custom Store Theme</CardTitle>
                {isAdmin && <Badge variant="outline" className="bg-primary text-white">Admin</Badge>}
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-2">Stand out with a unique look for your store. Choose from premium themes or request a custom design.</p>
              <Button
                onClick={() => handleBuy({
                  orderId: "theme-" + Date.now(),
                  listingTitle: "Custom Store Theme",
                  amountCents: 1000,
                })}
                disabled={!!loading}
              >
                {loading === "theme" ? "Processing..." : "Buy Theme ($10)"}
              </Button>
              {isAdmin && (
                <div className="mt-4 flex gap-2">
                  <Button variant="secondary">Manage Themes</Button>
                  <Button variant="destructive">View Theme Orders</Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 border-primary shadow-md bg-card/90">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Custom Store Layout</CardTitle>
                {isAdmin && <Badge variant="outline" className="bg-primary text-white">Admin</Badge>}
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-2">Upgrade your store layout for better buyer experience and more sales.</p>
              <Button
                onClick={() => handleBuy({
                  orderId: "layout-" + Date.now(),
                  listingTitle: "Custom Store Layout",
                  amountCents: 1200,
                })}
                disabled={!!loading}
              >
                {loading === "layout" ? "Processing..." : "Buy Layout ($12)"}
              </Button>
              {isAdmin && (
                <div className="mt-4 flex gap-2">
                  <Button variant="secondary">Manage Layouts</Button>
                  <Button variant="destructive">View Layout Orders</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {isAdmin && (
          <>
            <Separator className="my-8" />
            <div className="bg-primary/10 border border-primary rounded-lg p-6 shadow-lg">
              <h2 className="text-xl font-bold mb-2 text-primary">Admin Controls</h2>
              <p className="mb-4 text-muted-foreground">Manage all HobbyDork Store products, orders, and settings from here.</p>
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary">Dashboard</Button>
                <Button variant="secondary">Product Settings</Button>
                <Button variant="secondary">Order Management</Button>
                <Button variant="secondary">User Purchases</Button>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
