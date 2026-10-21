import PlacePhoto from "../components/PlacePhoto";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUp,
  Sparkles,
  Mic,
  Volume2,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  Square,
  ShieldCheck,
  ArrowRight,
  Navigation,
  Ticket,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useApp } from "../context";
import { db } from "../lib/db";
import type { Message } from "../lib/db";
import { askAssistant, detectLanguage } from "../lib/assistant";
import {
  deviceAnswer,
  loadDeviceAI,
  stopDeviceAI,
  supportsDeviceAI,
} from "../lib/ondevice";
import Modal from "../components/Modal";
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: { transcript: string }[][] }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
export default function Chat() {
  const { restaurants, origin, toast } = useApp(),
    { t, i18n } = useTranslation(),
    [messages, setMessages] = useState<Message[]>([]),
    [input, setInput] = useState(""),
    [busy, setBusy] = useState(false),
    [mode, setMode] = useState("local"),
    [consent, setConsent] = useState(false),
    [modelProgress, setModelProgress] = useState(-1),
    [device, setDevice] = useState(false),
    [listening, setListening] = useState(false);
  const end = useRef<HTMLDivElement>(null),
    controller = useRef<AbortController | null>(null),
    recognition = useRef<Recognition | null>(null),
    deviceActive = useRef(false);
  useEffect(() => {
    db.messages.orderBy("createdAt").toArray().then(setMessages);
    return () => {
      controller.current?.abort();
      recognition.current?.stop();
      if ("speechSynthesis" in window) speechSynthesis.cancel();
    };
  }, []);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);
  /* eslint-disable react-hooks/purity -- send runs only from user input event handlers, never during render. */
  async function send(query = input) {
    if (!query.trim() || busy || import.meta.env.VITE_AI_ENABLED === "false")
      return;
    const text = query.trim().slice(0, 600),
      user: Message = {
        id: crypto.randomUUID(),
        role: "user",
        text,
        createdAt: Date.now(),
      };
    setBusy(true);
    setInput("");
    setMessages((m) => [...m, user]);
    await db.messages.add(user);
    const abort = new AbortController();
    controller.current = abort;
    try {
      let answer;
      if (deviceActive.current) {
        try {
          answer = {
            ...(await deviceAnswer(text, restaurants.slice(0, 8))),
            mode: "device",
          };
        } catch {
          answer = await askAssistant(text, restaurants, abort.signal, origin);
        }
      } else
        answer = await askAssistant(text, restaurants, abort.signal, origin);
      if (abort.signal.aborted) return;
      setMode(answer.mode);
      const reply: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: answer.reply,
        restaurantIds: answer.restaurantIds,
        mode: answer.mode,
        createdAt: Date.now(),
      };
      setMessages((m) => [...m, reply]);
      await db.messages.add(reply);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError"))
        toast(t("error"));
    } finally {
      setBusy(false);
      controller.current = null;
    }
  }
  /* eslint-enable react-hooks/purity */
  function stop() {
    controller.current?.abort();
    stopDeviceAI();
    setBusy(false);
  }
  async function clear() {
    stop();
    await db.messages.clear();
    setMessages([]);
  }
  function speak(text: string) {
    if (!("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = detectLanguage(text) === "en" ? "en-PH" : "fil-PH";
    speechSynthesis.speak(utterance);
  }
  function voice() {
    const api = window as Window & {
      SpeechRecognition?: new () => Recognition;
      webkitSpeechRecognition?: new () => Recognition;
    };
    const Constructor = api.SpeechRecognition ?? api.webkitSpeechRecognition;
    if (!Constructor) {
      toast(t("voiceUnavailable"));
      return;
    }
    if (listening) {
      recognition.current?.stop();
      return;
    }
    const rec = new Constructor();
    recognition.current = rec;
    rec.lang = i18n.language === "en" ? "en-PH" : "fil-PH";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (event) => {
      setInput(event.results[0][0].transcript);
      setListening(false);
    };
    rec.onerror = () => {
      setListening(false);
      toast(t("voiceFailed"));
    };
    rec.onend = () => setListening(false);
    try {
      rec.start();
      setListening(true);
    } catch {
      toast(t("voiceFailed"));
    }
  }
  async function load() {
    setConsent(false);
    setModelProgress(0);
    try {
      await loadDeviceAI(setModelProgress);
      setDevice(true);
      deviceActive.current = true;
      setMode("device");
      toast(t("modelReady"));
    } catch {
      toast(t("modelFailed"));
    } finally {
      setModelProgress(-1);
    }
  }
  const prompts = [
    "promptCheap",
    "promptOpen",
    "promptFamily",
    "promptSeafood",
    "promptLate",
    "promptFare",
  ];
  if (import.meta.env.VITE_AI_ENABLED === "false")
    return (
      <div className="page-container empty-state">
        <h1>{t("aiDisabled")}</h1>
        <Link to="/" className="primary">
          {t("browse")}
        </Link>
      </div>
    );
  return (
    <div className="page-container chat-page">
      <div className="chat-header">
        <div className="chat-brand">
          <span className="chat-icon">
            <Sparkles size={24} />
          </span>
          <div>
            <h1>{t("ask")}</h1>
            <span className="mode-badge">
              <i />
              {t(
                mode === "cloud"
                  ? "cloudMode"
                  : mode === "device"
                    ? "deviceMode"
                    : "localMode",
              )}
            </span>
          </div>
        </div>
        <button
          className="icon-button"
          aria-label={t("clearChat")}
          onClick={clear}
        >
          <Trash2 size={19} />
        </button>
      </div>
      <div
        className="chat-messages"
        aria-live="polite"
        aria-relevant="additions"
      >
        {!messages.length && (
          <div className="chat-welcome">
            <span className="welcome-spark">✦</span>
            <span className="eyebrow">KAON TA!</span>
            <h2>{t("chatTitle")}</h2>
            <p>{t("chatText")}</p>
            <div className="prompt-grid">
              {prompts.map((p) => (
                <button key={p} onClick={() => send(t(p))}>
                  {t(p)}
                  <ArrowRight size={15} />
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.role}`}>
            <div className="message-avatar">
              {message.role === "assistant" ? (
                <Sparkles size={17} />
              ) : (
                <span>☺</span>
              )}
            </div>
            <div className="message-content">
              <p>{message.text}</p>
              {message.restaurantIds?.map((id) => {
                const r = restaurants.find(
                  (restaurant) => restaurant.id === id,
                );
                return (
                  r && (
                    <div className="chat-result" key={id}>
                      <PlacePhoto restaurant={r} />
                      <div>
                        <Link to={`/restaurant/${r.slug}`}>
                          <strong>{r.name}</strong>
                        </Link>
                        <small>
                          {t(r.categories[0])} ·{" "}
                          {r.priceLevel > 0 && `${"₱".repeat(r.priceLevel)} · `}
                          {t(r.sample ? "sampleShort" : "sourcedListing")}
                        </small>
                        <div>
                          {r.lat !== null && r.lng !== null ? (
                            <Link to={`/fare?to=${r.id}&trip=1`}>
                              <Navigation size={12} />
                              {t("directions")}
                            </Link>
                          ) : (
                            <a
                              href={r.googleMapsUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Navigation size={12} />
                              {t("searchLocation")}
                            </a>
                          )}
                          <Link to="/fare">
                            <Ticket size={12} />
                            {t("fare")}
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                );
              })}
              {message.role === "assistant" && (
                <div className="message-tools">
                  <button
                    aria-label={t("readAloud")}
                    onClick={() => speak(message.text)}
                  >
                    <Volume2 size={15} />
                  </button>
                  {[1, -1].map((value) => (
                    <button
                      key={value}
                      aria-label={t(
                        value === 1 ? "feedbackUp" : "feedbackDown",
                      )}
                      onClick={async () => {
                        await db.feedback.put({
                          id: message.id,
                          value,
                          at: Date.now(),
                        });
                        toast(t("feedbackSaved"));
                      }}
                    >
                      {value === 1 ? (
                        <ThumbsUp size={14} />
                      ) : (
                        <ThumbsDown size={14} />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {busy && (
          <div className="typing" role="status">
            <i />
            <i />
            <i />
            <span>{t("thinking")}</span>
          </div>
        )}
        <div ref={end} />
      </div>
      <div className="chat-input-area">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            send();
          }}
          className="chat-input"
        >
          <button
            type="button"
            className={`icon-button ${listening ? "listening" : ""}`}
            onClick={voice}
            aria-label={t("voice")}
          >
            <Mic size={19} />
          </button>
          <input
            autoComplete="off"
            aria-label={t("chatPlaceholder")}
            placeholder={t("chatPlaceholder")}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={600}
          />
          {busy ? (
            <button
              type="button"
              className="send-button"
              aria-label={t("stop")}
              onClick={stop}
            >
              <Square size={16} />
            </button>
          ) : (
            <button
              type="submit"
              className="send-button"
              aria-label={t("send")}
              disabled={!input.trim()}
            >
              <ArrowUp size={20} />
            </button>
          )}
        </form>
        <p className="chat-privacy">
          <ShieldCheck size={12} />
          {t("chatPrivacy")}
        </p>
        {supportsDeviceAI() && (
          <div className="device-option">
            {modelProgress >= 0 ? (
              <>
                <span>{t("modelLoading", { progress: modelProgress })}</span>
                <progress value={modelProgress} max={100} />
              </>
            ) : (
              <button
                className="text-button"
                onClick={() => {
                  if (device) {
                    setDevice(false);
                    deviceActive.current = false;
                    setMode("local");
                  } else setConsent(true);
                }}
              >
                <ShieldCheck size={14} />
                {t(device ? "disableModel" : "privateAI")}
              </button>
            )}
          </div>
        )}
      </div>
      {consent && (
        <Modal title={t("privateAI")} onClose={() => setConsent(false)}>
          <h2>{t("privateAI")}</h2>
          <p>{t("privateAIWarning")}</p>
          <button className="primary" onClick={load}>
            {t("loadModel")}
          </button>
        </Modal>
      )}
    </div>
  );
}
