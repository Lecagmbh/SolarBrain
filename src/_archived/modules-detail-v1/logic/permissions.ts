export function canEditStatus(role: string): boolean {
  return role === "admin" || role === "mitarbeiter";
}

export function isAdmin(role: string): boolean {
  return role === "admin";
}

export function isMitarbeiter(role: string): boolean {
  return role === "mitarbeiter";
}

export function isKunde(role: string): boolean {
  return role === "kunde";
}
