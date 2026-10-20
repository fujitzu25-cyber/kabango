import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Store, Download, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { db } from "../lib/db";
import { useApp } from "../context";
export default function Community() {
  const { t } = useTranslation(),
    { toast } = useApp(),
    [params] = useSearchParams(),
    [kind, setKind] = useState(params.get("kind") ?? "add"),
    [name, setName] = useState(params.get("name") ?? ""),
    [contact, setContact] = useState(""),
    [details, setDetails] = useState(""),
    [honey, setHoney] = useState("");
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (honey) return;
    await db.submissions.add({
      id: crypto.randomUUID(),
      kind,
      data: { name, contact, details },
      at: Date.now(),
    });
    toast(t("draftSaved"));
    setDetails("");
  }
  async function download() {
    const rows = await db.submissions.toArray(),
      url = URL.createObjectURL(
        new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" }),
      );
    const a = document.createElement("a");
    a.href = url;
    a.download = "kabango-community-drafts.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className="page-container subpage community-page">
      <span className="eyebrow">
        <Store size={16} />
        {t("addSpot")}
      </span>
      <h1>{t("communityTitle")}</h1>
      <p className="page-intro">{t("communityText")}</p>
      <form className="form-panel" onSubmit={save}>
        <label>
          {t("submissionType")}
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            {["add", "claim", "report"].map((key) => (
              <option key={key} value={key}>
                {t(key === "add" ? "add" : key + "Type")}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("name")}
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={150}
          />
        </label>
        <label>
          {t("contact")}
          <input
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            maxLength={200}
          />
        </label>
        <label>
          {t("details")}
          <textarea
            required
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            minLength={15}
            maxLength={3000}
            rows={5}
          />
        </label>
        <input
          aria-hidden="true"
          tabIndex={-1}
          autoComplete="off"
          className="honeypot"
          value={honey}
          onChange={(e) => setHoney(e.target.value)}
        />
        <p className="small muted">{t("draftNote")}</p>
        <button type="submit" className="primary">
          {t("saveDraft")}
          <ArrowRight size={16} />
        </button>
        <button type="button" className="text-button" onClick={download}>
          <Download size={15} />
          {t("exportDrafts")}
        </button>
      </form>
    </div>
  );
}
