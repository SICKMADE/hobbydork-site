import { useEffect, useState } from "react";
import { db } from "@/firebase/client-provider";
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, limit } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SellerTodos({ sellerUid }: { sellerUid: string }) {
  const [todos, setTodos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTodo, setNewTodo] = useState("");

  useEffect(() => {
    async function fetchTodos() {
      if (!sellerUid || !db) return;
      setLoading(true);
      try {
        const q = query(
          collection(db, "users", sellerUid, "todos"),
          orderBy("createdAt", "desc"),
          limit(10)
        );
        const snap = await getDocs(q);
        setTodos(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        setTodos([]);
      } finally {
        setLoading(false);
      }
    }
    fetchTodos();
  }, [sellerUid]);

  async function addTodo() {
    if (!newTodo.trim() || !db) return;
    try {
      await addDoc(collection(db, "users", sellerUid, "todos"), {
        text: newTodo,
        completed: false,
        createdAt: serverTimestamp(),
      });
      setNewTodo("");
      // Refresh todos
      const q = query(
        collection(db, "users", sellerUid, "todos"),
        orderBy("createdAt", "desc"),
        limit(10)
      );
      const snap = await getDocs(q);
      setTodos(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {}
  }

  return (
    <Card className="border-2 border-black bg-card/80 shadow mb-6">
      <CardHeader>
        <CardTitle>To-Do / Reminders</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex gap-2">
          <input
            type="text"
            value={newTodo}
            onChange={e => setNewTodo(e.target.value)}
            className="border rounded px-2 py-1 w-full"
            placeholder="Add a new task…"
          />
          <Button onClick={addTodo} className="comic-button bg-primary text-white px-4 py-2">Add</Button>
        </div>
        {loading ? (
          <div className="text-muted-foreground">Loading tasks…</div>
        ) : todos.length === 0 ? (
          <div className="text-muted-foreground">No tasks yet.</div>
        ) : (
          <ul className="space-y-2">
            {todos.map(todo => (
              <li key={todo.id} className="border rounded p-3 bg-background/80 flex items-center gap-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    readOnly
                    aria-label={`Mark "${todo.text}" as completed`}
                  />
                </label>
                <span className={todo.completed ? "line-through text-muted-foreground" : ""}>{todo.text}</span>
                <span className="text-xs text-muted-foreground ml-auto">{todo.createdAt?.toDate ? todo.createdAt.toDate().toLocaleString() : ""}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
