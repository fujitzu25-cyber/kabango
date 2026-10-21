import { useEffect, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { useTranslation } from "react-i18next";
import type { Restaurant } from "../lib/schema";
type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
export default function OfflineTools({
  restaurants,
  toast,
}: {
  restaurants: Restaurant[];
  toast: (s: string) => void;
}) {
  const { t } = useTranslation(),
    [install, setInstall] = useState<InstallEvent>(),
    [progress, setProgress] = useState(-1);
  const {
    needRefresh: [refresh, setRefresh],
    updateServiceWorker,
  } = useRegisterSW({ onRegisterError: () => {} });
  useEffect(() => {
    const listener = (e: Event) => {
      e.preventDefault();
      setInstall(e as InstallEvent);
    };
    window.addEventListener("beforeinstallprompt", listener);
    return () => window.removeEventListener("beforeinstallprompt", listener);
  }, []);
  async function download() {
    setProgress(0);
    try {
      const cache = await caches.open("kabango-offline-pack");
      const urls = [
        ...new Set([
          "/",
          "/data/restaurants.json",
          "/data/tourist-spots.json",
          "/data/search-synonyms.json",
          "/data/tricycle-tariffs.json",
          "/data/fares.json",
          "/data/landmarks.json",
          "/data/categories.json",
          ...restaurants
            .flatMap((r) => r.photos)
            .filter((url) => url.startsWith("/")),
        ]),
      ];
      for (let i = 0; i < urls.length; i++) {
        const response = await fetch(urls[i]);
        if (!response.ok) throw new Error("Download failed");
        await cache.put(urls[i], response);
        setProgress(Math.round(((i + 1) / urls.length) * 100));
      }
      toast(t("downloadDone"));
    } catch {
      toast(t("downloadFailed"));
    } finally {
      setProgress(-1);
    }
  }
  return (
    <>
      <div className="offline-tools">
        <button
          className="text-button"
          onClick={download}
          disabled={progress >= 0}
        >
          <Download size={15} />
          {progress >= 0
            ? t("downloading", { progress })
            : t("offlineDownload")}
        </button>
        <button
          className="text-button"
          onClick={async () => {
            if (install) {
              await install.prompt();
              setInstall(undefined);
            } else toast(t("installHelp"));
          }}
        >
          {t("install")}
        </button>
        {progress >= 0 && <progress max={100} value={progress} />}
      </div>
      {refresh && (
        <div className="update-toast">
          <RefreshCw size={18} />
          {t("update")}
          <button onClick={() => updateServiceWorker(true)}>
            {t("reload")}
          </button>
          <button onClick={() => setRefresh(false)} aria-label={t("close")}>
            ×
          </button>
        </div>
      )}
    </>
  );
}
