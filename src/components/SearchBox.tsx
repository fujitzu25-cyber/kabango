import { useEffect, useId, useState } from "react";
import { Search, ArrowRight, X, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Restaurant } from "../lib/schema";
import { db } from "../lib/db";
import synonyms from "../../public/data/search-synonyms.json";
export default function SearchBox({
  query,
  places,
  onChange,
  onSearch,
}: {
  query: string;
  places: Restaurant[];
  onChange: (q: string) => void;
  onSearch: (q: string) => void;
}) {
  const { t } = useTranslation(),
    id = useId();
  const [open, setOpen] = useState(false),
    [active, setActive] = useState(-1),
    [debounced, setDebounced] = useState(query),
    [recent, setRecent] = useState<string[]>([]);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), 150);
    return () => clearTimeout(timer);
  }, [query]);
  useEffect(() => {
    db.searches
      .orderBy("at")
      .reverse()
      .limit(5)
      .toArray()
      .then((rows) => setRecent(rows.map((r) => r.query)))
      .catch(() => {});
  }, []);
  const q = debounced.toLocaleLowerCase(),
    suggestions =
      q.length >= 2
        ? [
            ...new Set([
              ...Object.keys(synonyms).filter((k) => k.startsWith(q)),
              ...places
                .filter((r) => r.name.toLocaleLowerCase().includes(q))
                .map((r) => r.name),
              ...[
                ...new Set(
                  places.flatMap((r) => [
                    ...r.categories,
                    ...r.signatureDishes,
                  ]),
                ),
              ].filter((v) => v.toLocaleLowerCase().includes(q)),
            ]),
          ].slice(0, 6)
        : query
          ? []
          : recent;
  function choose(value: string) {
    onChange(value);
    onSearch(value);
    setOpen(false);
    setActive(-1);
  }
  return (
    <form
      className="search-combobox"
      onSubmit={(e) => {
        e.preventDefault();
        choose(active >= 0 ? suggestions[active] : query);
      }}
    >
      <div className="search-bar">
        <Search size={21} />
        <input
          role="combobox"
          aria-autocomplete="list"
          aria-controls={id}
          aria-expanded={open && suggestions.length > 0}
          aria-activedescendant={active >= 0 ? `${id}-${active}` : undefined}
          aria-label={t("searchLabel")}
          placeholder={t("searchPlaceholder")}
          value={query}
          maxLength={500}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setActive((i) => Math.min(i + 1, suggestions.length - 1));
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => Math.max(i - 1, 0));
            }
            if (e.key === "Escape") {
              setOpen(false);
              setActive(-1);
            }
          }}
        />
        {query && (
          <button
            type="button"
            className="icon-button"
            aria-label={t("reset")}
            onClick={() => choose("")}
          >
            <X size={16} />
          </button>
        )}
        <button type="submit" className="primary search-submit">
          {t("search")}
          <ArrowRight size={18} />
        </button>
      </div>
      {open && suggestions.length > 0 && (
        <div className="search-suggestions">
          <ul
            id={id}
            role="listbox"
            aria-label={t(query ? "suggestions" : "recentSearches")}
          >
            {suggestions.map((s, i) => (
              <li
                id={`${id}-${i}`}
                role="option"
                aria-selected={active === i}
                key={s}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(s)}
                className={active === i ? "selected" : ""}
              >
                {query ? <Search size={15} /> : <Clock size={15} />}
                <span>{s}</span>
              </li>
            ))}
          </ul>
          {!query && (
            <button
              type="button"
              className="text-button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={async () => {
                await db.searches.clear();
                setRecent([]);
              }}
            >
              {t("clearRecent")}
            </button>
          )}
        </div>
      )}
    </form>
  );
}
