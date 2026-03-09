import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Clock, Crown, Loader2, Shield, UserPlus, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface TeamMember {
  id: string;
  telegram_id: string;
  display_name: string | null;
  role: "owner" | "moderator" | "analyst";
  added_at: string;
}

export function TeamManagementSection() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [newId, setNewId] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<"owner" | "moderator" | "analyst">("moderator");
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [changingRole, setChangingRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const ownerCount = useMemo(() => members.filter((member) => member.role === "owner").length, [members]);
  const analysts = useMemo(() => members.filter((member) => member.role === "analyst"), [members]);

  const writeAudit = async (eventType: string, message: string, metadata?: Record<string, unknown>) => {
    await supabase.from("event_logs").insert({
      event_type: eventType,
      message,
      metadata: metadata ?? null,
    });
  };

  const loadMembers = async () => {
    const { data } = await supabase.from("team_members").select("*").order("added_at", { ascending: true });
    if (data) setMembers(data as TeamMember[]);
    setLoading(false);
  };

  useEffect(() => {
    void loadMembers();
  }, []);

  const handleAdd = async () => {
    if (!newId.trim()) {
      toast.error("Enter Telegram ID");
      return;
    }

    const exists = members.find((member) => member.telegram_id === newId.trim());
    if (exists) {
      toast.error("This user already exists in team");
      return;
    }

    setAdding(true);
    const { error } = await supabase.from("team_members").insert({
      telegram_id: newId.trim(),
      display_name: newName.trim() || null,
      role: newRole,
      added_by: "owner",
    });

    if (error) {
      toast.error("Failed to add team member");
    } else {
      toast.success(`${newRole === "owner" ? "Owner" : newRole === "moderator" ? "Moderator" : "Analyst"} added`);
      await writeAudit("team_member_added", `Added ${newRole}: ${newName.trim() || newId.trim()}`, { telegram_id: newId.trim(), role: newRole });
      setNewId("");
      setNewName("");
      setNewRole("moderator");
      await loadMembers();
    }
    setAdding(false);
  };

  const handleRemove = async (member: TeamMember) => {
    if (member.role === "owner" && ownerCount <= 1) {
      toast.error("At least one owner must remain");
      return;
    }

    setRemoving(member.id);
    await supabase.from("team_members").delete().eq("id", member.id);
    toast.success(`${member.display_name || member.telegram_id} removed`);
    await loadMembers();
    setRemoving(null);
  };

  const handleRoleChange = async (member: TeamMember, nextRole: "owner" | "moderator" | "analyst") => {
    if (member.role === nextRole) return;
    if (member.role === "owner" && nextRole === "moderator" && ownerCount <= 1) {
      toast.error("At least one owner must remain");
      return;
    }

    setChangingRole(member.id);
    const { error } = await supabase.from("team_members").update({ role: nextRole }).eq("id", member.id);
    if (error) {
      toast.error("Failed to update role");
    } else {
      toast.success(`Role updated to ${nextRole}`);
      await writeAudit("team_member_role_changed", `Role changed to ${nextRole}`, { telegram_id: member.telegram_id, next_role: nextRole });
      await loadMembers();
    }
    setChangingRole(null);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" })} ${d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`;
  };

  const moderators = members.filter((member) => member.role === "moderator");

  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="space-y-4">
      <h2 className="flex items-center gap-2 text-lg font-bold font-heading">
        <Crown size={18} className="text-yellow-500" /> Team management
      </h2>

      <Card className="bg-secondary/30 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-mono">
            <UserPlus size={14} /> Add owner or moderator
          </CardTitle>
          <CardDescription className="text-xs">Use Telegram ID, then choose role.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-4">
            <Input
              value={newId}
              onChange={(e) => setNewId(e.target.value)}
              placeholder="Telegram ID"
              className="font-mono text-xs sm:col-span-1"
              onKeyDown={(e) => e.key === "Enter" && void handleAdd()}
            />
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Display name"
              className="font-mono text-xs sm:col-span-1"
            />
            <Select value={newRole} onValueChange={(value: "owner" | "moderator" | "analyst") => setNewRole(value)}>
              <SelectTrigger className="font-mono text-xs sm:col-span-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="moderator" className="font-mono text-xs">Moderator</SelectItem>
                <SelectItem value="analyst" className="font-mono text-xs">Analyst</SelectItem>
                <SelectItem value="owner" className="font-mono text-xs">Owner</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => void handleAdd()} disabled={adding || !newId.trim()} size="sm" className="gap-1.5 sm:col-span-1">
              {adding ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-secondary/30 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-mono">
            <Shield size={14} /> Team members
          </CardTitle>
          <CardDescription className="text-xs">
            {members.length} total, {ownerCount} owners, {moderators.length} moderators, {analysts.length} analysts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 size={20} className="animate-spin text-muted-foreground" />
            </div>
          ) : (
            members.map((member) => (
              <div key={member.id} className="flex items-center gap-3 rounded-lg border border-border/30 bg-background/50 p-3">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: member.role === "owner" ? "hsl(var(--primary) / 0.15)" : "hsl(var(--muted))" }}
                >
                  {member.role === "owner" ? <Crown size={14} className="text-yellow-500" /> : <Shield size={14} className="text-primary" />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-bold font-mono text-foreground">{member.display_name || `ID: ${member.telegram_id}`}</span>
                    <Badge variant={member.role === "owner" ? "default" : "secondary"} className="shrink-0 text-[10px] font-mono">
                      {member.role === "owner" ? "Owner" : member.role === "moderator" ? "Moderator" : "Analyst"}
                    </Badge>
                  </div>
                  <div className="mt-0.5 flex gap-3 text-[10px] font-mono text-muted-foreground">
                    <span>TG: {member.telegram_id}</span>
                    <span className="flex items-center gap-0.5">
                      <Clock size={8} /> {formatDate(member.added_at)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {member.role !== "owner" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={changingRole === member.id}
                      onClick={() => void handleRoleChange(member, "owner")}
                      className="h-8 px-2 text-xs"
                    >
                      Make owner
                    </Button>
                  ) : (
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={changingRole === member.id || ownerCount <= 1}
                        onClick={() => void handleRoleChange(member, "moderator")}
                        className="h-8 px-2 text-xs"
                      >
                        Make mod
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={changingRole === member.id || ownerCount <= 1}
                        onClick={() => void handleRoleChange(member, "analyst")}
                        className="h-8 px-2 text-xs"
                      >
                        Make analyst
                      </Button>
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void handleRemove(member)}
                    disabled={removing === member.id || (member.role === "owner" && ownerCount <= 1)}
                    className="h-8 w-8 shrink-0 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    {removing === member.id ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </motion.section>
  );
}
