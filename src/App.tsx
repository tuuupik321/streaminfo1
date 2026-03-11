import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { detectPlatform, extractChannelName } from "./utils/detectPlatform";
import { clearUserProfile, getUserProfile, saveUserProfile, type UserProfile } from "./database/users";
import { getThemeByPlatform } from "./ui/themes";
import { ConnectScreen } from "./ui/connect";
import { Dashboard } from "./ui/dashboard";

const App = () => {
  const [profile, setProfile] = useState<UserProfile | null>(() => getUserProfile());
  const [error, setError] = useState<string | null>(null);

  const theme = useMemo(() => (profile ? getThemeByPlatform(profile.platform) : null), [profile]);

  useEffect(() => {
    if (!theme) return;
    const root = document.documentElement;
    root.style.setProperty("--accent", theme.colors.accent);
    root.style.setProperty("--panel-bg", theme.colors.bg);
  }, [theme]);

  const handleConnect = (url: string) => {
    try {
      const platform = detectPlatform(url);
      const channelName = extractChannelName(url);
      const nextProfile: UserProfile = {
        platform,
        channel_url: url,
        channel_name: channelName,
        connected: true,
      };
      saveUserProfile(nextProfile);
      setProfile(nextProfile);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleReconnect = () => {
    clearUserProfile();
    setProfile(null);
  };

  if (!profile) {
    return (
      <div className="app-shell">
        <ConnectScreen onConnect={handleConnect} />
        {error ? <div className="global-error">{error}</div> : null}
      </div>
    );
  }

  return (
    <div className="app-shell">
      {theme ? <Dashboard theme={theme} profile={profile} onReconnect={handleReconnect} /> : null}
    </div>
  );
};

export default App;
