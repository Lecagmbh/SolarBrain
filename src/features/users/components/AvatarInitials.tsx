/**
 * Avatar mit Initialen
 */

export function AvatarInitials({ name, email }: { name: string | null; email: string }) {
  const display = name || email;
  const initials = display
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

  // Deterministic color from string
  let hash = 0;
  for (const ch of display) hash = ch.charCodeAt(0) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;

  return (
    <div
      className="up-avatar"
      style={{ background: `hsl(${hue}, 40%, 25%)`, color: `hsl(${hue}, 60%, 70%)` }}
    >
      {initials || '?'}
    </div>
  );
}
