import { useState } from "react";

export default function FeedbackWidget() {
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!message.trim()) {
      setError("Please enter your feedback.");
      return;
    }
    try {
      // Replace with your backend endpoint or Firestore logic
      // await sendFeedbackToBackend(message);
      setSubmitted(true);
    } catch (err: any) {
      setError("Could not submit feedback. Please try again later.");
    }
  }

  if (submitted) {
    return (
      <div className="p-4 bg-green-50 border border-green-300 rounded text-green-700 text-sm">
        Thank you for your feedback!
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white border border-gray-300 rounded shadow-md flex flex-col gap-2 w-full max-w-sm">
      <label htmlFor="feedback-message" className="text-sm font-semibold text-gray-700">Feedback or Suggestions</label>
      <textarea
        id="feedback-message"
        className="border p-2 rounded w-full text-sm"
        value={message}
        onChange={e => setMessage(e.target.value)}
        rows={3}
        placeholder="Let us know how we can improve..."
        aria-label="Feedback message"
        required
      />
      {error && <div className="text-xs text-red-600">{error}</div>}
      <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded font-bold hover:bg-indigo-700 transition">Submit Feedback</button>
    </form>
  );
}
