export default function SuspendedPage({ until }: any) {
  return (
    <div className="p-6 max-w-md mx-auto text-center">
      <h1 className="text-2xl font-bold mb-4">Account Suspended</h1>
      <p>You cannot interact with the platform until:</p>
      <p className="font-semibold mt-2">{until?.toLocaleString()}</p>
    </div>
  );
}
