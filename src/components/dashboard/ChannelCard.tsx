import { motion } from "framer-motion";
import { Twitch, Trash2, ExternalLink } from "lucide-react";

interface Channel {
  name: string;
  platform: string;
  live: boolean;
  viewers?: number;
}

interface ChannelCardProps {
  channel: Channel;
  index: number;
  onDelete: (name: string) => void;
}

export function ChannelCard({ channel, index, onDelete }: ChannelCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      className="glass rounded-2xl p-4 flex justify-between items-center group card-glow"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center relative overflow-hidden" style={{ background: 'hsl(var(--primary) / 0.1)' }}>
          <Twitch size={18} className="text-primary relative z-10" />
          {channel.live && (
            <motion.div 
              className="absolute inset-0 rounded-xl"
              style={{ background: 'hsl(var(--primary) / 0.15)' }}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </div>
        <div>
          <span className="font-semibold text-foreground text-sm">{channel.name}</span>
          {channel.live && channel.viewers !== undefined && (
            <p className="text-xs text-muted-foreground font-mono">{channel.viewers.toLocaleString()} зрителей</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {channel.live && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full" style={{ background: 'hsl(var(--success) / 0.1)' }}>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse-glow" style={{ background: 'hsl(var(--success))' }} />
            <span className="text-[10px] font-semibold uppercase tracking-wider font-mono" style={{ color: 'hsl(var(--success))' }}>Live</span>
          </div>
        )}
        <a
          href={`https://twitch.tv/${channel.name}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg hover:bg-muted/50 transition-all opacity-0 group-hover:opacity-100"
        >
          <ExternalLink size={14} className="text-muted-foreground" />
        </a>
        <button
          onClick={() => onDelete(channel.name)}
          className="p-2 rounded-lg hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100"
        >
          <Trash2 size={14} className="text-destructive" />
        </button>
      </div>
    </motion.div>
  );
}
