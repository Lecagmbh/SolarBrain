export type EmailLike = {
  subject: string;
  bodyText?: string | null;
};

export type InstallationLike = {
  id: number | string;
  customerName?: string;
  location?: string;
};

export function matchEmailToInstallation(
  email: EmailLike,
  installation: InstallationLike
): number {
  const text =
    (email.subject + " " + (email.bodyText ?? "")).toLowerCase();
  const name = (installation.customerName ?? "").toLowerCase();
  const location = (installation.location ?? "").toLowerCase();

  let score = 0;

  if (name && text.includes(name)) score += 40;
  if (location && text.includes(location)) score += 30;

  const idStr = String(installation.id);
  if (idStr && text.includes(idStr.toLowerCase())) score += 30;

  if (score > 100) score = 100;
  return score;
}
