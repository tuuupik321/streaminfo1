import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Twitch } from "lucide-react";

interface AddChannelDialogProps {
  onAdd: (name: string) => void;
}

export function AddChannelDialog({ onAdd }: AddChannelDialogProps) {
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAdd(name.trim());
      setName("");
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" className="rounded-xl bg-primary hover:bg-primary/80 glow-primary">
          <Plus size={20} />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <Twitch size={20} className="text-primary" />
            Добавить стримера
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <Input
            placeholder="Введите ник стримера..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-secondary border-border font-mono"
            autoFocus
          />
          <Button type="submit" className="w-full bg-primary hover:bg-primary/80">
            Добавить
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
