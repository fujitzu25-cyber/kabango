import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Store, Download, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { db } from "../lib/db";
import { useApp } from "../context";
import { validateImage } from "../lib/image-validation";
const draftSchema = z.object({
  kind: z.enum(["add", "claim", "report"]),
  name: z.string().trim().min(2).max(150),
  contact: z.string().trim().max(200),
  address: z.string().trim().min(3).max(300),
  details: z.string().trim().min(15).max(3000),
});
export default function Community() {
  const { t } = useTranslation(),
    { toast } = useApp(),
    [params] = useSearchParams();
  const initialKind = params.get("kind");
  const [kind, setKind] = useState(
      initialKind === "claim" || initialKind === "report" ? initialKind : "add",
    ),
    [name, setName] = useState((params.get("name") ?? "").slice(0, 150)),
    [contact, setContact] = useState(""),
    [details, setDetails] = useState(""),
    [address, setAddress] = useState(""),
    [honey, setHoney] = useState(""),
    [step, setStep] = useState(1),
    [photo, setPhoto] = useState<File>(),
    [busy, setBusy] = useState(false);
  async function advance(e: React.FormEvent) {
    e.preventDefault();
    if (honey) return;
    if (step < 3) {
      if (photo && !(await validateImage(photo))) {
        toast(t("photoValidation"));
        return;
      }
      setStep(step + 1);
      return;
    }
    const parsed = draftSchema.safeParse({
      kind,
      name,
      contact,
      address,
      details,
    });
    if (!parsed.success) {
      setStep(1);
      return;
    }
    setBusy(true);
    try {
      let image: string | undefined;
      if (photo)
        image = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = reject;
          reader.readAsDataURL(photo);
        });
      await db.submissions.add({
        id: crypto.randomUUID(),
        kind,
        data: { ...parsed.data, ...(image ? { image } : {}) },
        at: Date.now(),
      });
      toast(t("draftSaved"));
      setDetails("");
      setPhoto(undefined);
      setStep(1);
    } finally {
      setBusy(false);
    }
  }
  async function download() {
    const rows = await db.submissions.toArray(),
      url = URL.createObjectURL(
        new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" }),
      );
    const a = document.createElement("a");
    a.href = url;
    a.download = "kabgo-community-drafts.json";
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
      <form className="form-panel" onSubmit={advance}>
        <p className="small muted" role="status">
          {t("step", { count: step })}
        </p>
        <ol className="step-progress" aria-hidden="true">
          {[1, 2, 3].map((n) => (
            <li key={n} className={n <= step ? "active" : ""} />
          ))}
        </ol>
        {step === 1 && (
          <>
            <label>
              {t("submissionType")}
              <select value={kind} onChange={(e) => setKind(e.target.value)}>
                {["add", "claim", "report"].map((k) => (
                  <option key={k} value={k}>
                    {t(k === "add" ? "add" : k + "Type")}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t("name")}
              <input
                required
                minLength={2}
                maxLength={150}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label>
              {t("contact")}
              <input
                maxLength={200}
                value={contact}
                onChange={(e) => setContact(e.target.value)}
              />
            </label>
          </>
        )}
        {step === 2 && (
          <>
            <label>
              {t("spotLocation")}
              <input
                required
                minLength={3}
                maxLength={300}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </label>
            <label>
              {t("details")}
              <textarea
                required
                minLength={15}
                maxLength={3000}
                rows={5}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
              />
            </label>
            <label>
              {t("reviewPhoto")}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setPhoto(e.target.files?.[0])}
              />
            </label>
            <p className="small muted">{t("photoValidation")}</p>
          </>
        )}
        {step === 3 && (
          <div className="draft-summary">
            <h2>{t("draftReview")}</h2>
            <h3>{name}</h3>
            <p>{address}</p>
            <p>{details}</p>
            <p>{contact}</p>
            {photo && <p>{photo.name}</p>}
          </div>
        )}
        <input
          aria-hidden="true"
          tabIndex={-1}
          autoComplete="off"
          className="honeypot"
          value={honey}
          onChange={(e) => setHoney(e.target.value)}
        />
        <p className="small muted">{t("draftNote")}</p>
        <div className="modal-actions">
          {step > 1 && (
            <button
              type="button"
              className="secondary"
              onClick={() => setStep(step - 1)}
            >
              {t("previous")}
            </button>
          )}
          <button type="submit" className="primary" disabled={busy}>
            {t(step === 3 ? "saveDraft" : "next")}
            <ArrowRight size={16} />
          </button>
        </div>
        <button type="button" className="text-button" onClick={download}>
          <Download size={15} />
          {t("exportDrafts")}
        </button>
      </form>
    </div>
  );
}
