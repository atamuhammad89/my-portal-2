"use client";

import React, { useState } from "react";
import { Upload, FileText, CheckCircle2, X, Link, MapPin, ExternalLink, Loader2 } from "lucide-react";
import { ComplianceField } from "@/types/telecom";

interface ComplianceFieldInputProps {
  field: ComplianceField;
  value: string;
  onChange: (value: string) => void;
  subOrderId?: string;
  countryCode?: string;
}

export function ComplianceFieldInput({
  field,
  value,
  onChange,
  subOrderId,
  countryCode = "US",
}: ComplianceFieldInputProps) {
  const [mode, setMode] = useState<"file" | "url">("file");
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [fileDetails, setFileDetails] = useState<{ name: string; size: string } | null>(null);

  // Address sub-form state
  const [addressForm, setAddressForm] = useState({
    street_address: "",
    locality: "",
    administrative_area: "",
    postal_code: "",
    country_code: countryCode,
  });
  const [creatingAddress, setCreatingAddress] = useState(false);
  const [addressCreated, setAddressCreated] = useState(false);

  // Action state
  const [triggeringAction, setTriggeringAction] = useState(false);

  const reqType = (field.type || "").toLowerCase();
  const isAddressField = reqType === "address" || field.name.toLowerCase().includes("address");
  const isActionField = reqType === "action" || reqType === "external";
  const isDocField =
    reqType === "document" ||
    reqType === "file" ||
    ["passport", "id", "proof", "bill", "invoice", "copy", "scan", "document", "registration", "utility", "license", "file"].some((term) =>
      (field.name || "").toLowerCase().includes(term) || (field.label || "").toLowerCase().includes(term)
    );

  // 1. Structured Address Sub-form
  if (isAddressField) {
    const handleAddressSubmit = async () => {
      if (!addressForm.street_address || !addressForm.locality || !addressForm.postal_code) {
        alert("Please enter street address, city/locality, and postal code.");
        return;
      }

      setCreatingAddress(true);
      try {
        const res = await fetch("/api/telnyx/addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...addressForm,
            country_code: addressForm.country_code || countryCode || "US",
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || "Failed to register address");
        }

        const data = await res.json();
        if (data.id) {
          onChange(data.id);
          setAddressCreated(true);
        }
      } catch (err: any) {
        alert(err.message || "Address creation failed");
      } finally {
        setCreatingAddress(false);
      }
    };

    return (
      <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-[var(--foreground)] flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-[var(--brand-500)]" />
            <span>
              {field.label} {field.required && <span className="text-rose-500">*</span>}
            </span>
          </label>
          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase">
            Address Registration
          </span>
        </div>
        {field.description && <div className="text-[11px] text-[var(--subtle-text)]">{field.description}</div>}

        {addressCreated || (value && value.startsWith("addr_")) ? (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <div className="text-xs font-semibold text-emerald-200">
                Address Registered (ID: <span className="font-mono">{value}</span>)
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setAddressCreated(false);
                onChange("");
              }}
              className="text-[11px] text-rose-300 underline hover:opacity-80"
            >
              Edit Address
            </button>
          </div>
        ) : (
          <div className="space-y-2.5 pt-1">
            <div>
              <label className="text-[11px] text-[var(--subtle-text)]">Street Address *</label>
              <input
                type="text"
                placeholder="e.g. 123 Main Street, Suite 400"
                value={addressForm.street_address}
                onChange={(e) => setAddressForm((prev) => ({ ...prev, street_address: e.target.value }))}
                className="form-input text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-[var(--subtle-text)]">City / Locality *</label>
                <input
                  type="text"
                  placeholder="e.g. Dublin / London / Berlin"
                  value={addressForm.locality}
                  onChange={(e) => setAddressForm((prev) => ({ ...prev, locality: e.target.value }))}
                  className="form-input text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] text-[var(--subtle-text)]">Postal / ZIP Code *</label>
                <input
                  type="text"
                  placeholder="e.g. D02 X285 / SW1A 1AA"
                  value={addressForm.postal_code}
                  onChange={(e) => setAddressForm((prev) => ({ ...prev, postal_code: e.target.value }))}
                  className="form-input text-xs"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddressSubmit}
              disabled={creatingAddress}
              className="w-full py-2 rounded-lg bg-[var(--surface)] border border-[var(--brand-500)] text-[var(--brand-500)] hover:bg-[var(--brand-500)] hover:text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {creatingAddress ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MapPin className="h-3.5 w-3.5" />}
              Register Address with Carrier
            </button>
          </div>
        )}
      </div>
    );
  }

  // 2. Action Verification (External Link / Redirect e.g. Onfido)
  if (isActionField) {
    const handleTriggerAction = async () => {
      setTriggeringAction(true);
      try {
        const res = await fetch("/api/telnyx/compliance/external-action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requirementId: field.name,
            subOrderId,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || "Failed to launch external verification");
        }

        const data = await res.json();
        if (data.redirectUrl) {
          window.open(data.redirectUrl, "_blank");
          onChange(data.redirectUrl);
        }
      } catch (err: any) {
        alert(err.message || "Failed to open external verification link");
      } finally {
        setTriggeringAction(false);
      }
    };

    return (
      <div className="p-4 rounded-xl bg-sky-500/10 border border-sky-500/30 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-sky-200 flex items-center gap-1.5">
            <ExternalLink className="h-4 w-4 text-sky-400" />
            <span>{field.label}</span>
          </label>
          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-sky-500/20 text-sky-300 border border-sky-500/40 uppercase">
            External Action
          </span>
        </div>
        <p className="text-[11px] text-sky-300/80">
          {field.description || "Identity verification must be completed externally with carrier verification partner."}
        </p>

        <button
          type="button"
          onClick={handleTriggerAction}
          disabled={triggeringAction}
          className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
        >
          {triggeringAction ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
          Complete External Identity Verification
        </button>
      </div>
    );
  }

  // 3. Textual Input
  if (!isDocField) {
    return (
      <div className="space-y-1">
        <label className="text-xs font-medium text-[var(--foreground)] flex justify-between">
          <span>
            {field.label} {field.required && <span className="text-rose-500">*</span>}
          </span>
          <span className="text-[10px] text-[var(--subtle-text)] uppercase">{field.type || "textual"}</span>
        </label>
        {field.description && <div className="text-[11px] text-[var(--subtle-text)]">{field.description}</div>}
        <input
          type="text"
          placeholder={`Enter ${field.label}`}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="form-input text-xs"
          required={field.required}
        />
      </div>
    );
  }

  // 4. Document File Picker & Upload
  const handleFileSelect = (file?: File) => {
    if (!file) return;

    const sizeFormatted =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    setFileDetails({ name: file.name, size: sizeFormatted });

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      onChange(dataUrl || file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleClear = () => {
    setFileDetails(null);
    onChange("");
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-[var(--foreground)] flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-[var(--brand-500)]" />
          <span>
            {field.label} {field.required && <span className="text-rose-500">*</span>}
          </span>
        </label>
        <div className="flex items-center gap-2 text-[10px]">
          <button
            type="button"
            onClick={() => setMode("file")}
            className={`cursor-pointer ${mode === "file" ? "text-[var(--brand-500)] font-bold underline" : "text-[var(--subtle-text)]"}`}
          >
            Upload File
          </button>
          <span className="text-[var(--subtle-text)]">|</span>
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`cursor-pointer ${mode === "url" ? "text-[var(--brand-500)] font-bold underline" : "text-[var(--subtle-text)]"}`}
          >
            Paste URL / Ref ID
          </button>
        </div>
      </div>

      {field.description && <div className="text-[11px] text-[var(--subtle-text)]">{field.description}</div>}

      {mode === "url" ? (
        <div className="relative">
          <Link className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[var(--subtle-text)]" />
          <input
            type="text"
            placeholder="Paste Hosted Document URL or Telnyx Document ID"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className="form-input text-xs pl-8"
            required={field.required}
          />
        </div>
      ) : value && (fileDetails || value.startsWith("data:")) ? (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <div className="truncate">
              <div className="text-xs font-semibold text-emerald-200 truncate">
                {fileDetails?.name || "Document attached successfully"}
              </div>
              {fileDetails?.size && <div className="text-[10px] text-emerald-400/80">{fileDetails.size}</div>}
            </div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="p-1 rounded-lg hover:bg-rose-500/20 text-rose-300 transition-colors cursor-pointer"
            title="Remove document"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
          }}
          className={`border-2 border-dashed rounded-xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
            dragActive
              ? "border-[var(--brand-500)] bg-[var(--brand-500)]/10"
              : "border-[var(--border)] hover:border-[var(--brand-500)]/50 bg-[var(--surface-2)]"
          }`}
        >
          <input
            type="file"
            accept="image/*,.pdf,.doc,.docx"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            className="hidden"
          />
          <Upload className="h-5 w-5 text-[var(--brand-500)] mb-1" />
          <span className="text-xs font-semibold text-[var(--foreground)]">Click or Drag & Drop Document</span>
          <span className="text-[10px] text-[var(--subtle-text)] mt-0.5">Supports Passport Scan, Utility Bill, Invoice, PDF, JPG, PNG (Max 10MB)</span>
        </label>
      )}
    </div>
  );
}
