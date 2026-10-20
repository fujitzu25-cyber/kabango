import { ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { db } from "../lib/db";
import { useApp } from "../context";
export default function Privacy() {
  const { t } = useTranslation(),
    { toast } = useApp();
  return (
    <div className="page-container subpage privacy-page">
      <span className="eyebrow">
        <ShieldCheck size={16} />
        {t("privacy")}
      </span>
      <h1>{t("privacyTitle")}</h1>
      <div className="info-panel">
        <p>{t("privacyText")}</p>
        <button
          className="secondary"
          onClick={async () => {
            await db.transaction("rw", db.tables, async () => {
              for (const table of db.tables) await table.clear();
            });
            toast(t("privacyCleared"));
            window.location.reload();
          }}
        >
          {t("privacyClear")}
        </button>
      </div>
    </div>
  );
}
