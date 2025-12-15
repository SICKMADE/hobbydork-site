export function getAvatarUrl(profile: any) {
  if (!profile) return "/hobbydork-head.png"; // your default

  return (
    profile.avatar ||
    profile.avatarUrl ||
    profile.photoURL ||
    "/hobbydork-head.png" // fallback
  );
}
