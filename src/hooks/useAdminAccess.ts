import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentTelegramId, hasAdminSession, isAdminRole, isOwnerTelegramId } from "@/lib/adminAccess";

type AdminAccessState = {
  currentTelegramId: string | null;
  canSeeAdmin: boolean;
  isOwner: boolean;
  hasSession: boolean;
  teamRole: string | null;
  isResolved: boolean;
};

export function useAdminAccess(): AdminAccessState {
  const currentTelegramId = getCurrentTelegramId();
  const isOwner = isOwnerTelegramId(currentTelegramId);
  const hasSession = hasAdminSession(currentTelegramId);
  const [teamRole, setTeamRole] = useState<string | null>(null);
  const [canSeeAdmin, setCanSeeAdmin] = useState(isOwner || hasSession);
  const [isResolved, setIsResolved] = useState(false);

  useEffect(() => {
    let alive = true;

    const resolveAccess = async () => {
      if (!currentTelegramId) {
        if (!alive) return;
        setTeamRole(null);
        setCanSeeAdmin(hasSession);
        setIsResolved(true);
        return;
      }

      const { data } = await supabase
        .from("team_members")
        .select("role")
        .eq("telegram_id", currentTelegramId)
        .maybeSingle();

      if (!alive) return;
      const resolvedRole = data?.role ?? null;
      setTeamRole(resolvedRole);
      setCanSeeAdmin(isOwner || hasSession || isAdminRole(resolvedRole));
      setIsResolved(true);
    };

    setIsResolved(false);
    void resolveAccess();

    return () => {
      alive = false;
    };
  }, [currentTelegramId, hasSession, isOwner]);

  return {
    currentTelegramId,
    canSeeAdmin,
    isOwner,
    hasSession,
    teamRole,
    isResolved,
  };
}
