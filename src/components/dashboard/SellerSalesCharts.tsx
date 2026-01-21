import { useEffect, useState } from "react";
import { db } from "@/firebase/client-provider";
import { collection, query, where, getDocs } from "firebase/firestore";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts";

export default function SellerSalesCharts({ sellerUid }: { sellerUid: string }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      if (!sellerUid) return;
      setLoading(true);
      try {
        if (!db) return;
        const q = query(collection(db, "orders"), where("sellerUid", "==", sellerUid));
        const snap = await getDocs(q);
        setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, [sellerUid]);

  // Prepare chart data
  const salesByDate = orders.reduce((acc, order) => {
    const date = order.createdAt?.toDate ? order.createdAt.toDate().toISOString().slice(0, 10) : "Unknown";
    acc[date] = (acc[date] || 0) + (order.total ?? 0);
    return acc;
  }, {} as Record<string, number>);
  const salesData = Object.entries(salesByDate).map(([date, total]) => ({ date, total }));

  const itemCounts: Record<string, number> = {};
  orders.forEach(order => {
    (order.items || []).forEach((item: any) => {
      itemCounts[item.title] = (itemCounts[item.title] || 0) + (item.quantity || 1);
    });
  });
  const bestSellingItems = Object.entries(itemCounts).map(([title, count]) => ({ title, count }));

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-bold">Sales Analytics</h2>
      {loading ? (
        <div>Loading sales data…</div>
      ) : (
        <>
          <div>
            <h3 className="font-semibold mb-2">Sales Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#8884d8" name="Revenue" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Best-Selling Items</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={bestSellingItems}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="title" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#82ca9d" name="Units Sold" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
