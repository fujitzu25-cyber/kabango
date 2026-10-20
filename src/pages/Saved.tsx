import { useState } from "react";
import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useApp } from "../context";
import RestaurantCard from "../components/RestaurantCard";
export default function Saved() {
  const { t } = useTranslation(),
    { restaurants, saved, toggleSave, origin } = useApp(),
    [list, setList] = useState<"favorites" | "want">("favorites");
  const found = restaurants.filter((r) =>
    saved.some((s) => s.id === `${list}:${r.id}`),
  );
  return (
    <div className="page-container subpage">
      <span className="eyebrow">♡ {t("saved")}</span>
      <h1>{t("savedTitle")}</h1>
      <p className="page-intro">{t("savedText")}</p>
      <div className="tabs">
        {(["favorites", "want"] as const).map((key) => (
          <button
            className={key === list ? "active" : ""}
            onClick={() => setList(key)}
            key={key}
          >
            {t(key)}
          </button>
        ))}
      </div>
      {found.length ? (
        <div className="card-grid">
          {found.map((r) => (
            <RestaurantCard
              key={r.id}
              restaurant={r}
              origin={origin}
              saved={saved.some((s) => s.id === `favorites:${r.id}`)}
              onSave={toggleSave}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Heart size={40} />
          <h2>{t("savedEmpty")}</h2>
          <p>{t("savedEmptyText")}</p>
          <Link to="/" className="primary">
            {t("browse")}
          </Link>
        </div>
      )}
    </div>
  );
}
