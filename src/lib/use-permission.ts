"use client";

import { useSession } from "next-auth/react";

export function useCanPermission(permission: string): boolean {
  const { data: session } = useSession();
  const user = (session as any)?.user;
  if (!user) return false;
  if (user.isSuperAdmin) return true;
  const permissions: string[] | undefined = user.permissions;
  if (!permissions || permissions.length === 0) return true;
  return permissions.includes(permission);
}