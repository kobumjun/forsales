"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { showToast } from "@/components/Toaster";
import { Copy, ImagePlus, Loader2, RefreshCw } from "lucide-react";

type Preset = {
  id: string;
  name: string;
  preset_type: string;
  is_default: boolean;
  examples?: { content: string }[];
};

type Result = {
  summary: string;
  keywords: string[];
  replies: { short: string; explanatory: string; kind: string };
};

export function DashboardClient() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState<string>("");
  const [coreText, setCoreText] = useState<string>("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [status, setStatus] = useState<"idle" | "ocr" | "ai" | "done" | "error">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedPresetIdRef = useRef<string | null>(null);
  selectedPresetIdRef.current = selectedPresetId;

  useEffect(() => {
    fetch("/api/presets")
      .then((r) => r.json())
      .then((data) => {
        setPresets(data);
        const defaultPreset = data.find((p: Preset) => p.is_default);
        setSelectedPresetId(defaultPreset?.id ?? data[0]?.id ?? null);
      })
      .catch(() => setPresets([]));
  }, []);

  const processImage = useCallback(async (file: File) => {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setResult(null);
    setStatus("ocr");
    setErrorMsg("");

    try {
      const formData = new FormData();
      formData.set("image", file);

      const ocrRes = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
      });

      if (!ocrRes.ok) {
        const err = await ocrRes.json();
        throw new Error(err.error ?? "OCR 실패");
      }

      const ocrData = await ocrRes.json();
      setOcrText(ocrData.raw ?? "");
      setCoreText(ocrData.coreText ?? "");
      setKeywords(ocrData.keywords ?? []);

      setStatus("ai");

      const aiRes = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ocrText: ocrData.raw,
          coreText: ocrData.coreText,
          keywords: ocrData.keywords,
          presetId: selectedPresetIdRef.current,
        }),
      });

      if (!aiRes.ok) {
        const err = await aiRes.json();
        throw new Error(err.error ?? "답변 생성 실패");
      }

      const aiData = await aiRes.json();
      setResult(aiData);
      setStatus("done");
    } catch (e) {
      setStatus("error");
      setErrorMsg(e instanceof Error ? e.message : "오류가 발생했습니다.");
    }
  }, []);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const item = e.clipboardData.files[0];
      if (item?.type.startsWith("image/")) {
        e.preventDefault();
        processImage(item);
      }
    },
    [processImage]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file?.type.startsWith("image/")) {
        processImage(file);
      }
    },
    [processImage]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file?.type.startsWith("image/")) {
        processImage(file);
      }
    },
    [processImage]
  );

  const handleRegenerate = useCallback(() => {
    if (!ocrText && !coreText) return;
    setStatus("ai");
    setErrorMsg("");
    fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ocrText,
        coreText,
        keywords,
        presetId: selectedPresetId,
      }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("실패"))))
      .then(setResult)
      .then(() => setStatus("done"))
      .catch(() => {
        setStatus("error");
        setErrorMsg("답변 재생성에 실패했습니다.");
      });
  }, [ocrText, coreText, keywords, selectedPresetId]);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => showToast("복사되었습니다."));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">답변 추천</h1>
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-600">말투 프리셋</label>
          <select
            value={selectedPresetId ?? ""}
            onChange={(e) => setSelectedPresetId(e.target.value || null)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            {presets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        onPaste={handlePaste}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        className={`relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors ${
          imagePreview
            ? "border-slate-300 bg-slate-50"
            : "border-slate-300 bg-white hover:border-brand-400 hover:bg-slate-50"
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
        {imagePreview ? (
          <div className="relative p-4">
            <img
              src={imagePreview}
              alt="미리보기"
              className="max-h-64 max-w-full rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ) : (
          <>
            <ImagePlus className="h-12 w-12 text-slate-400" />
            <p className="mt-2 text-sm text-slate-600">
              스크린샷을 붙여넣거나 드래그해 주세요
            </p>
            <p className="text-xs text-slate-400">
              Ctrl+V / Cmd+V 또는 클릭해서 선택
            </p>
          </>
        )}
      </div>

      {(status === "ocr" || status === "ai") && (
        <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-700">
          <Loader2 className="h-4 w-4 animate-spin" />
          {status === "ocr" ? "이미지 분석 중..." : "답변 생성 중..."}
        </div>
      )}

      {status === "error" && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      {result && status === "done" && (
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-medium text-slate-700">핵심 요약</h3>
            <p className="mt-1 text-slate-900">{result.summary}</p>
          </div>

          {result.keywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {result.keywords.map((kw) => (
                <span
                  key={kw}
                  className="rounded-full bg-slate-200 px-3 py-1 text-xs text-slate-700"
                >
                  {kw}
                </span>
              ))}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                label: "짧은 답변",
                text: result.replies.short,
                key: "short",
              },
              {
                label: "설명형 답변",
                text: result.replies.explanatory,
                key: "explanatory",
              },
              {
                label: "친절한 답변",
                text: result.replies.kind,
                key: "kind",
              },
            ].map(({ label, text, key }) => (
              <div
                key={key}
                className="flex flex-col rounded-lg border border-slate-200 bg-white p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">
                    {label}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(text)}
                    className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    title="복사"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="flex-1 text-sm text-slate-900">{text}</p>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleRegenerate}
            className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />
            답변 다시 생성
          </button>
        </div>
      )}

      {imagePreview && status === "idle" && !result && (
        <button
          type="button"
          onClick={() => {
            setImageFile(null);
            setImagePreview(null);
            setOcrText("");
            setCoreText("");
            setKeywords([]);
            setResult(null);
          }}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          이미지 초기화
        </button>
      )}
    </div>
  );
}
