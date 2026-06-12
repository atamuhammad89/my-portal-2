// src/utils/download-invoice-pdf.ts
// Generates and directly downloads an invoice as a PDF using jsPDF.
// No print dialog — file is saved directly to the user's system.

import { formatDate } from "@/utils/format";

type InvoiceData = {
  invoiceId: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  userId?: string;
  planName: string;
  periodStart: string;
  periodEnd: string | null;
  allocatedMinutes: number;
  usedMinutes: number;
  overageMinutes: number;
  pricePerMinute: number;
  overageAmount: number;
  generatedAt: string;
};

export async function downloadInvoicePdf(bill: InvoiceData): Promise<void> {
  // Dynamically import to avoid SSR issues
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageW = 210;
  const margin = 20;
  const contentW = pageW - margin * 2;
  let y = margin;

  // ── Helper functions ───────────────────────────────────────────────────────
  const setFont = (style: "normal" | "bold", size: number, color = "#1e293b") => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    doc.setTextColor(r, g, b);
  };

  const setFill = (color: string) => {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    doc.setFillColor(r, g, b);
  };

  const setDraw = (color: string) => {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    doc.setDrawColor(r, g, b);
  };

  const line = (x1: number, y1: number, x2: number, y2: number) => {
    doc.line(x1, y1, x2, y2);
  };

  const invoiceNum = bill.invoiceId.slice(-8).toUpperCase();
  const customerId = bill.userId ? bill.userId.slice(0, 8).toUpperCase() : "—";

  // ── HEADER ─────────────────────────────────────────────────────────────────
  // Blue accent bar at top
  setFill("#1e3a8a");
  doc.rect(0, 0, pageW, 2, "F");

  // Company name
  setFont("bold", 20, "#1e3a8a");
  doc.text("Call Automate AI", margin, y + 8);

  // Company details
  setFont("normal", 8, "#64748b");
  doc.text("123 Tech Way, Suite 400  |  Dublin, D02 F983", margin, y + 14);
  doc.text("billing@callautomate.ai  |  callautomate.ai", margin, y + 19);

  // INVOICE label (right-aligned)
  setFont("bold", 28, "#3b82f6");
  doc.text("INVOICE", pageW - margin, y + 10, { align: "right" });

  y += 30;

  // Invoice meta box (right side)
  const metaX = pageW - margin - 60;
  const metaW = 60;
  const metaRows = [
    ["Date:", formatDate(bill.generatedAt)],
    ["Invoice #:", invoiceNum],
    ...(bill.userId ? [["Customer ID:", customerId]] : []),
    ["Due Date:", bill.periodEnd ? formatDate(bill.periodEnd) : "Immediate"],
  ];

  setFill("#f8fafc");
  setDraw("#cbd5e1");
  doc.setLineWidth(0.3);
  const metaH = metaRows.length * 7 + 4;
  doc.roundedRect(metaX, y - 2, metaW, metaH, 2, 2, "FD");

  metaRows.forEach(([label, value], i) => {
    const rowY = y + i * 7 + 4;
    setFont("bold", 7.5, "#64748b");
    doc.text(label, metaX + 3, rowY);
    setFont("normal", 7.5, "#0f172a");
    doc.text(value, metaX + metaW - 3, rowY, { align: "right" });
  });

  y += metaH + 8;

  // ── DIVIDER ────────────────────────────────────────────────────────────────
  setDraw("#e2e8f0");
  doc.setLineWidth(0.4);
  line(margin, y, pageW - margin, y);
  y += 8;

  // ── BILL TO ────────────────────────────────────────────────────────────────
  setFill("#1e3a8a");
  doc.rect(margin, y, contentW, 7, "F");
  setFont("bold", 8, "#ffffff");
  doc.text("BILL TO", margin + 3, y + 5);
  y += 10;

  setFont("bold", 10, "#0f172a");
  doc.text(bill.userName ?? "—", margin, y);
  y += 5;

  setFont("normal", 8.5, "#334155");
  if (bill.userEmail) {
    doc.text(`Email: ${bill.userEmail}`, margin, y);
    y += 4.5;
  }
  if (bill.userRole) {
    doc.text(`Role: ${bill.userRole}`, margin, y);
    y += 4.5;
  }
  doc.text(
    `Period: ${formatDate(bill.periodStart)} → ${bill.periodEnd ? formatDate(bill.periodEnd) : "present"}`,
    margin,
    y
  );
  y += 10;

  // ── ITEMS TABLE ────────────────────────────────────────────────────────────
  // Header
  setFill("#1e3a8a");
  doc.rect(margin, y, contentW, 8, "F");
  setFont("bold", 8, "#ffffff");
  doc.text("DESCRIPTION", margin + 3, y + 5.5);
  doc.text("AMOUNT", pageW - margin - 3, y + 5.5, { align: "right" });
  y += 8;

  // Row
  setFill("#f8fafc");
  setDraw("#e2e8f0");
  doc.setLineWidth(0.3);
  doc.rect(margin, y, contentW, 20, "FD");

  setFont("bold", 9, "#0f172a");
  doc.text(`Overage Usage Fee — ${bill.planName} Plan`, margin + 3, y + 6);

  setFont("normal", 7.5, "#64748b");
  const descLines = doc.splitTextToSize(
    `${bill.usedMinutes} mins used / ${bill.allocatedMinutes} mins allocated  |  ` +
      `${bill.overageMinutes} overage mins × $${bill.pricePerMinute.toFixed(4)}/min`,
    contentW - 40
  );
  doc.text(descLines, margin + 3, y + 11);

  setFont("bold", 10, "#0f172a");
  doc.text(`$${bill.overageAmount.toFixed(2)}`, pageW - margin - 3, y + 8, { align: "right" });

  y += 26;

  // ── TOTALS ─────────────────────────────────────────────────────────────────
  const totX = pageW - margin - 70;
  const totW = 70;

  const totRows: [string, string, boolean][] = [
    ["Subtotal", `$${bill.overageAmount.toFixed(2)}`, false],
    ["Tax Rate", "0.00%", false],
    ["Tax Due", "$0.00", false],
    ["TOTAL DUE", `$${bill.overageAmount.toFixed(2)}`, true],
  ];

  totRows.forEach(([label, value, isTotal]) => {
    if (isTotal) {
      setFill("#eff6ff");
      setDraw("#3b82f6");
      doc.setLineWidth(0.5);
      doc.rect(totX, y, totW, 8, "FD");
      setFont("bold", 9, "#1e3a8a");
    } else {
      setFill("#f8fafc");
      setDraw("#e2e8f0");
      doc.setLineWidth(0.3);
      doc.rect(totX, y, totW, 7, "FD");
      setFont("normal", 8, "#334155");
    }
    doc.text(label, totX + 3, y + (isTotal ? 5.5 : 5));
    if (isTotal) setFont("bold", 9, "#1e3a8a");
    doc.text(value, totX + totW - 3, y + (isTotal ? 5.5 : 5), { align: "right" });
    y += isTotal ? 8 : 7;
  });

  y += 14;

  // ── FOOTER ─────────────────────────────────────────────────────────────────
  setDraw("#e2e8f0");
  doc.setLineWidth(0.4);
  line(margin, y, pageW - margin, y);
  y += 6;

  setFont("bold", 8, "#1e3a8a");
  doc.text("Payment Terms", margin, y);
  y += 5;

  setFont("normal", 7.5, "#475569");
  doc.text("1. Total payment is due within 30 days of invoice date.", margin, y);
  y += 4.5;
  doc.text("2. Please reference the invoice number on all payments.", margin, y);
  y += 4.5;
  doc.text("Make all payments payable to: Call Automate AI", margin, y);

  // Right side contact
  setFont("normal", 7.5, "#64748b");
  doc.text("Questions? Contact us at:", pageW - margin, y - 9, { align: "right" });
  doc.text("billing@callautomate.ai", pageW - margin, y - 4.5, { align: "right" });

  // Thank you line
  y += 14;
  setFont("bold", 10, "#1e3a8a");
  doc.text("Thank You For Your Business!", pageW / 2, y, { align: "center" });

  // Bottom blue bar
  setFill("#1e3a8a");
  doc.rect(0, 295, pageW, 2, "F");

  // ── SAVE FILE ──────────────────────────────────────────────────────────────
  doc.save(`invoice-${invoiceNum}.pdf`);
}
