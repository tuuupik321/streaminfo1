import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, Image, Loader2, MousePointerClick, SkipForward, Trash2, Type, Upload } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AdsSectionProps {
  saveSetting: (key: string, value: string) => Promise<void>;
  settings: Record<string, string>;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://osucdelkugpmeqnkqsne.supabase.co";

function getPublicUrl(path: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/ad-images/${path}`;
}

const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export function AdsSection({ saveSetting, settings }: AdsSectionProps) {
  const [partnerLink, setPartnerLink] = useState("");
  const [partnerClicks, setPartnerClicks] = useState("0");
  const [partnerIconUrl, setPartnerIconUrl] = useState("");
  const [partnerTitle, setPartnerTitle] = useState("Live partner");
  const [partnerSubtitle, setPartnerSubtitle] = useState("Special offer");

  const [splashImageUrl, setSplashImageUrl] = useState("");
  const [splashTimer, setSplashTimer] = useState("3");
  const [splashOncePerDay, setSplashOncePerDay] = useState(false);
  const [splashAllowSkip, setSplashAllowSkip] = useState(true);
  const [footerText, setFooterText] = useState("Powered by StreamInfo");

  const [uploadingPartner, setUploadingPartner] = useState(false);
  const [uploadingSplash, setUploadingSplash] = useState(false);
  const partnerFileRef = useRef<HTMLInputElement>(null);
  const splashFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPartnerLink(settings.partner_link || "");
    setPartnerClicks(settings.partner_clicks || "0");
    setPartnerIconUrl(settings.partner_icon || "");
    setPartnerTitle(settings.partner_title || "Live partner");
    setPartnerSubtitle(settings.partner_subtitle || "Special offer");

    setSplashImageUrl(settings.splash_image || "");
    setSplashTimer(settings.splash_timer || "3");
    setSplashOncePerDay(settings.splash_once_per_day === "true");
    setSplashAllowSkip(settings.splash_allow_skip !== "false");
    setFooterText(settings.footer_text || "Powered by StreamInfo");
  }, [settings]);

  const checkImageSize = (file: File, maxW: number, maxH: number): Promise<{ width: number; height: number } | null> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        if (img.width > maxW || img.height > maxH) {
          toast.error(`Image ${img.width}x${img.height} exceeds ${maxW}x${maxH}`);
          resolve(null);
        } else {
          resolve({ width: img.width, height: img.height });
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        toast.error("Cannot read image file");
        resolve(null);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Only PNG, JPG, WEBP and GIF are supported");
      return null;
    }

    const ext = file.name.split(".").pop() || "png";
    const fileName = `${folder}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("ad-images").upload(fileName, file, { upsert: true });
    if (error) {
      toast.error(`Upload error: ${error.message}`);
      return null;
    }
    return getPublicUrl(fileName);
  };

  const handlePartnerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPartner(true);
    const size = await checkImageSize(file, 1024, 1024);
    if (!size) {
      setUploadingPartner(false);
      if (partnerFileRef.current) partnerFileRef.current.value = "";
      return;
    }

    const url = await uploadFile(file, "partner");
    if (url) {
      setPartnerIconUrl(url);
      await saveSetting("partner_icon", url);
      toast.success("Partner creative uploaded");
    }

    setUploadingPartner(false);
    if (partnerFileRef.current) partnerFileRef.current.value = "";
  };

  const handleSplashUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingSplash(true);
    const size = await checkImageSize(file, 1080, 1920);
    if (!size) {
      setUploadingSplash(false);
      if (splashFileRef.current) splashFileRef.current.value = "";
      return;
    }

    const url = await uploadFile(file, "splash");
    if (url) {
      setSplashImageUrl(url);
      await saveSetting("splash_image", url);
      toast.success("Splash creative uploaded");
    }

    setUploadingSplash(false);
    if (splashFileRef.current) splashFileRef.current.value = "";
  };

  const handleRemovePartnerIcon = async () => {
    setPartnerIconUrl("");
    await saveSetting("partner_icon", "");
    toast.success("Partner creative removed");
  };

  const handleRemoveSplash = async () => {
    setSplashImageUrl("");
    await saveSetting("splash_image", "");
    toast.success("Splash creative removed");
  };

  const handleSave = async () => {
    await Promise.all([
      saveSetting("partner_link", partnerLink),
      saveSetting("partner_title", partnerTitle),
      saveSetting("partner_subtitle", partnerSubtitle),
      saveSetting("splash_timer", splashTimer),
      saveSetting("splash_once_per_day", String(splashOncePerDay)),
      saveSetting("splash_allow_skip", String(splashAllowSkip)),
      saveSetting("footer_text", footerText),
    ]);

    toast.success("Ad settings saved");
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="space-y-4"
    >
      <h2 className="flex items-center gap-2 text-lg font-bold font-heading">
        <Image size={18} className="text-primary" /> Ads and partners
      </h2>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-secondary/30 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-mono">Live ad in menu</CardTitle>
            <CardDescription className="text-xs">Shown in sidebar and on mobile. GIF supported.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-mono">Creative image / GIF</Label>
              <p className="text-[10px] font-mono text-muted-foreground/70">Max: 1024x1024, types: PNG/JPG/WEBP/GIF</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => partnerFileRef.current?.click()}
                  disabled={uploadingPartner}
                >
                  {uploadingPartner ? (
                    <Loader2 size={14} className="mr-1.5 animate-spin" />
                  ) : (
                    <Upload size={14} className="mr-1.5" />
                  )}
                  {partnerIconUrl ? "Replace" : "Upload"}
                </Button>
                {partnerIconUrl && (
                  <Button variant="outline" size="sm" className="text-xs" onClick={handleRemovePartnerIcon}>
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
              <input
                ref={partnerFileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={handlePartnerUpload}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-mono">Ad title</Label>
              <Input value={partnerTitle} onChange={(e) => setPartnerTitle(e.target.value)} placeholder="Live partner" className="font-mono text-xs" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-mono">Ad subtitle</Label>
              <Input value={partnerSubtitle} onChange={(e) => setPartnerSubtitle(e.target.value)} placeholder="Special offer" className="font-mono text-xs" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-mono">Target URL</Label>
              <Input value={partnerLink} onChange={(e) => setPartnerLink(e.target.value)} placeholder="https://partner.example" className="font-mono text-xs" />
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-border/30 bg-background/50 p-2">
              <MousePointerClick size={14} className="shrink-0 text-primary" />
              <span className="text-xs text-muted-foreground font-mono">Clicks:</span>
              <Badge variant="secondary" className="text-xs font-mono">{partnerClicks}</Badge>
            </div>

            {partnerIconUrl && (
              <div className="overflow-hidden rounded-xl border border-border/40 bg-background/50">
                <div className="relative h-28 w-full">
                  <img src={partnerIconUrl} alt="partner preview" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/20 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="truncate text-xs font-semibold font-heading">{partnerTitle}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{partnerSubtitle}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-secondary/30 border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-mono">Splash screen</CardTitle>
            <CardDescription className="text-xs">Optional opening ad at app launch.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-mono">Splash image / GIF</Label>
              <p className="text-[10px] font-mono text-muted-foreground/70">Max: 1080x1920, types: PNG/JPG/WEBP/GIF</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => splashFileRef.current?.click()}
                  disabled={uploadingSplash}
                >
                  {uploadingSplash ? (
                    <Loader2 size={14} className="mr-1.5 animate-spin" />
                  ) : (
                    <Upload size={14} className="mr-1.5" />
                  )}
                  {splashImageUrl ? "Replace" : "Upload"}
                </Button>
                {splashImageUrl && (
                  <Button variant="outline" size="sm" className="text-xs" onClick={handleRemoveSplash}>
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
              <input
                ref={splashFileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={handleSplashUpload}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-mono">Timer (seconds)</Label>
              <Select value={splashTimer} onValueChange={setSplashTimer}>
                <SelectTrigger className="font-mono text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2, 3, 5, 7, 10].map((seconds) => (
                    <SelectItem key={seconds} value={String(seconds)} className="font-mono text-xs">
                      {seconds}s
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-border/30 bg-background/50 p-2">
              <Checkbox id="once-per-day" checked={splashOncePerDay} onCheckedChange={(v) => setSplashOncePerDay(!!v)} />
              <label htmlFor="once-per-day" className="flex cursor-pointer items-center gap-1.5 text-xs font-mono text-muted-foreground">
                <Clock size={12} /> Show once per day
              </label>
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-border/30 bg-background/50 p-2">
              <Checkbox id="allow-skip" checked={splashAllowSkip} onCheckedChange={(v) => setSplashAllowSkip(!!v)} />
              <label htmlFor="allow-skip" className="flex cursor-pointer items-center gap-1.5 text-xs font-mono text-muted-foreground">
                <SkipForward size={12} /> Allow Skip button
              </label>
            </div>

            {splashImageUrl && (
              <div className="aspect-video overflow-hidden rounded-lg border border-border/30">
                <img src={splashImageUrl} alt="splash preview" className="h-full w-full object-cover" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-secondary/30 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-mono">
            <Type size={14} /> Footer text in bot messages
          </CardTitle>
          <CardDescription className="text-xs">Marketing signature line in Telegram notifications.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input value={footerText} onChange={(e) => setFooterText(e.target.value)} placeholder="Powered by StreamInfo" className="font-mono text-sm" />
          <div className="rounded-lg border border-border/30 bg-background/50 p-3">
            <p className="mb-1 text-xs font-mono text-muted-foreground">Preview</p>
            <p className="text-xs font-mono italic text-muted-foreground/80">- {footerText}</p>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="gap-2">
        <CheckCircle2 size={16} /> Save ad settings
      </Button>
    </motion.section>
  );
}
