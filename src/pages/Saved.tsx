import { useState } from "react";
import { Heart, Share2 } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useApp } from "../context";
import { db } from "../lib/db";
import RestaurantCard from "../components/RestaurantCard";
export default function Saved() {
  const { t } = useTranslation(),
    { restaurants, saved, toggleSave, origin, toast } = useApp(),
    [params] = useSearchParams(),
    [list, setList] = useState<"favorites" | "want">("favorites");
  const shared = params.has("ids"),
    ids = (params.get("ids") ?? "").split(",").slice(0, 100);
  const found = restaurants.filter((r) =>
    shared ? ids.includes(r.id) : saved.some((s) => s.id === `${list}:${r.id}`),
  );
  async function share() {
    const url = `${import.meta.env.VITE_SITE_URL ?? location.origin}/saved?ids=${encodeURIComponent(found.map((r) => r.id).join(","))}`;
    try {
      if (navigator.share)
        await navigator.share({ title: "KabGo · " + t("saved"), url });
      else {
        await navigator.clipboard.writeText(url);
        toast(t("copied"));
      }
    } catch {
      /* Native share can be dismissed. */
    }
  }
  return (
    <div className="page-container subpage">
      <span className="eyebrow">♡ {t("saved")}</span>
      <h1>{t(shared ? "sharedPlaces" : "savedTitle")}</h1>
      <p className="page-intro">{t("savedText")}</p>
      {!shared && (
        <div className="tabs">
          {(["favorites", "want"] as const).map((k) => (
            <button
              key={k}
              className={list === k ? "active" : ""}
              onClick={() => setList(k)}
            >
              {t(k)}
            </button>
          ))}
        </div>
      )}
      {!!found.length && (
        <button className="secondary share-list" onClick={share}>
          <Share2 size={17} />
          {t("shareList")}
        </button>
      )}
      {found.length ? (
        <div className="card-grid">
          {found.map((r) => (
            <div key={r.id}>
              <RestaurantCard
                restaurant={r}
                origin={origin}
                saved={saved.some((s) => s.id === `favorites:${r.id}`)}
                onSave={toggleSave}
              />
              {!shared && (
                <SavedNote
                  id={`${list}:${r.id}`}
                  initial={
                    saved.find((s) => s.id === `${list}:${r.id}`)?.note ?? ""
                  }
                />
              )}
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="empty-state">
            <Heart size={40} />
            <h2>{t("savedEmpty")}</h2>
            <p>{t("savedEmptyText")}</p>
            <Link to="/" className="primary">
              {t("browse")}
            </Link>
          </div>
          <div className="card-grid">
            {restaurants.slice(0, 3).map((r) => (
              <RestaurantCard
                key={r.id}
                restaurant={r}
                saved={false}
                onSave={toggleSave}
              />
            ))}
          </div>
        </>
      )}
      <p className="small muted">{t("sharePrivacy")}</p>
    </div>
  );
}
function SavedNote({ id, initial }: { id: string; initial: string }) {
  const { t } = useTranslation(),
    [note, setNote] = useState(initial);
  return (
    <label className="saved-note">
      {t("privateNote")}
      <textarea
        rows={2}
        maxLength={500}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onBlur={() => void db.saved.update(id, { note })}
      />
    </label>
  );
}
