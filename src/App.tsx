import { AppProvider } from "./context";
import Modal from "./components/Modal";
import { readSaved } from "./lib/storage-validation";
import {
  Component,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  Link,
  NavLink,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import {
  Compass,
  Map,
  Heart,
  Sparkles,
  Bus,
  MapPin,
  Plus,
  Sun,
  Moon,
  ArrowUpRight,
  WifiOff,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import Home from "./pages/Home";
import OfflineTools from "./components/OfflineTools";
import { guideSchema } from "./lib/data";
import { localData } from "./lib/data";
import { db } from "./lib/db";
import type { Saved } from "./lib/db";
import type { AppContext } from "./context";
import type { Coordinates } from "./lib/schema";
const Detail = lazy(() => import("./pages/Detail")),
  Fare = lazy(() => import("./pages/Fare")),
  Chat = lazy(() => import("./pages/Chat")),
  SavedPage = lazy(() => import("./pages/Saved")),
  Community = lazy(() => import("./pages/Community")),
  Privacy = lazy(() => import("./pages/Privacy"));
const nav = [
  { to: "/", key: "explore", icon: Compass },
  { to: "/map", key: "map", icon: Map },
  { to: "/ask", key: "ask", icon: Sparkles },
  { to: "/saved", key: "saved", icon: Heart },
  { to: "/fare", key: "fare", icon: Bus },
];
class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="empty-state">
        <h1>Something didn't load.</h1>
        <button className="primary" onClick={() => location.reload()}>
          Try again
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<Shell />}>
          <Route index element={<Home />} />
          <Route path="map" element={<Home mapMode />} />
          <Route path="place/:slug" element={<Detail />} />
          <Route path="attractions" element={<Home />} />
          <Route path="food" element={<Home />} />
          <Route path="restaurant/:slug" element={<Detail />} />
          <Route path="fare" element={<Fare />} />
          <Route path="ask" element={<Chat />} />
          <Route path="saved" element={<SavedPage />} />
          <Route path="community" element={<Community />} />
          <Route path="privacy" element={<Privacy />} />
          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}
function Shell() {
  const { t, i18n } = useTranslation(),
    location = useLocation();
  const [data, setData] =
      useState<
        Omit<AppContext, "saved" | "toggleSave" | "origin" | "locate" | "toast">
      >(),
    [error, setError] = useState(false),
    [saved, setSaved] = useState<Saved[]>([]),
    [origin, setOrigin] = useState<Coordinates>(),
    [notice, setNotice] = useState(""),
    [undo, setUndo] = useState<null | (() => Promise<void>)>(null),
    [chatOpen, setChatOpen] = useState(false),
    [scrolled, setScrolled] = useState(false),
    [online, setOnline] = useState(navigator.onLine),
    [theme, setTheme] = useState(
      ["light", "dark", "system"].includes(
        localStorage.getItem("kabango-theme") ?? "",
      )
        ? localStorage.getItem("kabango-theme")!
        : "system",
    );
  const toast = useCallback((message: string) => setNotice(message), []);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 160);
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  useEffect(() => {
    let active = true;
    Promise.all([
      localData.restaurants(),
      localData.fares(),
      localData.categories(),
      localData.landmarks(),
    ])
      .then(([restaurants, fares, categories, landmarks]) => {
        if (active) setData({ restaurants, fares, categories, landmarks });
        db.cache
          .put({
            key: "guide",
            value: { restaurants, fares, categories, landmarks },
            at: Date.now(),
          })
          .catch(() => {});
      })
      .catch(async () => {
        const cached = await db.cache.get("guide").catch(() => undefined);
        if (active) {
          const parsed = guideSchema.safeParse(cached?.value);
          if (parsed.success) setData(parsed.data);
          else setError(true);
        }
      });
    db.saved
      .toArray()
      .then((rows) => setSaved(readSaved(rows)))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => {
      setNotice("");
      setUndo(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    document.documentElement.dataset.theme =
      theme === "system"
        ? matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : theme;
    localStorage.setItem("kabango-theme", theme);
    const media = matchMedia("(prefers-color-scheme: dark)");
    const update = () => {
      if (theme === "system")
        document.documentElement.dataset.theme = media.matches
          ? "dark"
          : "light";
    };
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [theme]);
  useEffect(() => {
    window.scrollTo(0, 0);
    if (/^\/(restaurant|place)\//.test(location.pathname)) return;
    document.title = t(
      location.pathname === "/ask"
        ? "titleAsk"
        : location.pathname === "/saved"
          ? "titleSaved"
          : location.pathname === "/fare"
            ? "titleFare"
            : "titleHome",
    );
  }, [location.pathname, t]);
  const toggleSave = useCallback(
    async (id: string, list: "favorites" | "want" = "favorites") => {
      const key = `${list}:${id}`,
        exists = await db.saved.get(key);
      if (exists) await db.saved.delete(key);
      else await db.saved.put({ id: key, list, createdAt: Date.now() });
      setSaved(readSaved(await db.saved.toArray()));
      setNotice(t(exists ? "removedSaved" : "savedToast"));
      setUndo(() => async () => {
        if (exists) await db.saved.put(exists);
        else await db.saved.delete(key);
        setSaved(readSaved(await db.saved.toArray()));
        setUndo(null);
        setNotice("");
      });
    },
    [t],
  );
  const locate = useCallback(async () => {
    if (!navigator.geolocation) {
      toast(t("geolocationDenied"));
      return;
    }
    await new Promise<void>((resolve) =>
      navigator.geolocation.getCurrentPosition(
        (p) => {
          setOrigin({ lat: p.coords.latitude, lng: p.coords.longitude });
          if (
            Math.abs(p.coords.latitude - 9.99) > 0.25 ||
            Math.abs(p.coords.longitude - 122.81) > 0.25
          )
            toast(t("geolocationOutside"));
          resolve();
        },
        () => {
          toast(t("geolocationDenied"));
          resolve();
        },
        { timeout: 8000, maximumAge: 60000 },
      ),
    );
  }, [toast, t]);
  return (
    <>
      <a className="skip-link" href="#main">
        {t("skip")}
      </a>
      <header className="header">
        <div className="header-inner">
          <Link className="logo" to="/">
            <span className="logo-mark">
              <Compass size={22} />
            </span>
            <span>
              Kab<span className="accent">Go</span>
              <small>{t("tagline")}</small>
            </span>
          </Link>
          <nav className="desktop-nav" aria-label={t("explore")}>
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end
                onClick={
                  item.key === "ask"
                    ? (e) => {
                        e.preventDefault();
                        setChatOpen(true);
                      }
                    : undefined
                }
              >
                {t(item.key)}
                {item.key === "ask" && <span className="tiny-new">AI</span>}
              </NavLink>
            ))}
          </nav>
          <div className="header-actions">
            <span className="header-location">
              <MapPin size={15} />
              {t("locationShort")}
            </span>
            <select
              aria-label={t("language")}
              className="language-select"
              value={i18n.language}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
            >
              <option value="en">EN</option>
              <option value="hil">HIL</option>
              <option value="fil">FIL</option>
            </select>
            <button
              className="icon-button theme-toggle"
              aria-label={t("theme")}
              onClick={() =>
                setTheme(
                  document.documentElement.dataset.theme === "dark"
                    ? "light"
                    : "dark",
                )
              }
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link to="/community" className="add-spot">
              <Plus size={16} />
              {t("addSpot")}
            </Link>
          </div>
        </div>
      </header>
      {!online && (
        <div className="network-banner" role="status">
          <WifiOff size={15} />
          {t("offline")}
        </div>
      )}
      <main id="main">
        {error ? (
          <div className="empty-state">
            <h1>{t("error")}</h1>
            <button
              className="primary"
              onClick={() => window.location.reload()}
            >
              {t("retry")}
            </button>
          </div>
        ) : !data ? (
          <div className="page-container">
            <div className="skeleton skeleton-hero" />
            <div className="card-grid">
              {[1, 2, 3].map((n) => (
                <div className="skeleton skeleton-card" key={n} />
              ))}
            </div>
            <p className="sr-only" role="status">
              {t("loading")}
            </p>
          </div>
        ) : (
          <Suspense
            fallback={
              <div className="loading-page" role="status">
                {t("loading")}
              </div>
            }
          >
            <AppProvider
              value={{ ...data, saved, toggleSave, origin, locate, toast }}
            >
              <Outlet />
              {chatOpen && (
                <Modal
                  title={t("ask")}
                  onClose={() => setChatOpen(false)}
                  className="chat-modal"
                >
                  <Chat embedded />
                </Modal>
              )}
            </AppProvider>
          </Suspense>
        )}
      </main>
      <footer className="footer page-container">
        <div>
          <Link className="logo footer-logo" to="/">
            <span className="logo-mark">
              <Compass size={18} />
            </span>
            <span>
              Kab<span className="accent">Go</span>
            </span>
          </Link>
          <p>{t("footerText")}</p>
        </div>
        <div className="footer-links">
          <Link to="/fare">
            {t("fare")}
            <ArrowUpRight size={14} />
          </Link>
          <Link to="/community">{t("addSpot")}</Link>
          <Link to="/privacy">{t("privacy")}</Link>
        </div>
        {data && <OfflineTools restaurants={data.restaurants} toast={toast} />}
        <small className="footer-credit">
          {t("photoCredit")}{" "}
          <a
            href="https://commons.wikimedia.org/wiki/File:Mag-asoFallsKabankalanNegrosOcc.jpg"
            target="_blank"
            rel="noreferrer"
          >
            Photo source ↗
          </a>{" "}
          ·{" "}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noreferrer"
          >
            Directory map data © OpenStreetMap contributors · ODbL
          </a>{" "}
          · {t("allRights")}
        </small>
      </footer>
      <nav className="bottom-nav" aria-label={t("more")}>
        {nav.map((item) => (
          <NavLink
            to={item.to}
            end
            key={item.to}
            onClick={
              item.key === "ask"
                ? (e) => {
                    e.preventDefault();
                    setChatOpen(true);
                  }
                : undefined
            }
          >
            <item.icon size={21} />
            <span>
              {t(
                item.key === "explore"
                  ? "home"
                  : item.key === "map"
                    ? "mapView"
                    : item.key === "saved"
                      ? "favorites"
                      : item.key === "fare"
                        ? "fare"
                        : item.key,
              )}
            </span>
          </NavLink>
        ))}
      </nav>
      {location.pathname !== "/ask" &&
        !chatOpen &&
        import.meta.env.VITE_AI_ENABLED !== "false" && (
          <button
            onClick={() => setChatOpen(true)}
            className={`floating-ai ${scrolled ? "is-collapsed" : ""}`}
            aria-label={t("ask")}
          >
            <Sparkles size={21} />
            <span>{t("ask")}</span>
          </button>
        )}
      {notice && (
        <div className="toast" role="status">
          {notice}
          {undo && <button onClick={() => void undo()}>{t("undo")}</button>}
        </div>
      )}
    </>
  );
}
