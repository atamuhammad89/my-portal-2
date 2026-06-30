// src/utils/download-invoice-pdf.ts
// Generates and directly downloads an invoice as a PDF using jsPDF.
// No print dialog — file is saved directly to the user's system.

import { formatDate, formatDateTime } from "@/utils/format";

export type InvoiceData = {
  invoiceId: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  userId?: string;
  planName: string;
  periodStart: string;
  periodEnd: string | null;
  allocatedMinutes?: number;
  usedMinutes?: number;
  overageMinutes?: number;
  pricePerMinute?: number;
  amount: number;
  type: "subscription" | "renewal" | "overage";
  invoiceNumber: string;
  generatedAt: string;
};

export async function downloadInvoicePdf(bill: InvoiceData): Promise<void> {
  // Dynamically import to avoid SSR issues
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageW = 210;
  const margin = 20;
  const contentW = pageW - margin * 2; // 170mm
  let y = margin;

  // ── Helper functions ───────────────────────────────────────────────────────
  const setFont = (style: "normal" | "bold" | "italic", size: number, color = "#1e293b") => {
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

  const invoiceNum = bill.invoiceNumber ?? bill.invoiceId.slice(-8).toUpperCase();
  const customerId = bill.userId ? bill.userId.slice(0, 8).toUpperCase() : "—";

  // ── LOGO & HEADER ──────────────────────────────────────────────────────────
  // 1. Draw Voice OS logo icon
  // A rounded-corner blue rectangle with letter "V" in white
  setFill("#2563eb"); // Brand Blue
  doc.roundedRect(margin, y, 9, 9, 2, 2, "F");

  setFont("bold", 15, "#ffffff");
  doc.text("V", margin + 2.5, y + 6.5);

  // Logo Text
  setFont("bold", 15, "#0f172a"); // Slate-900
  doc.text("Voice", margin + 11.5, y + 6.5);
  setFont("bold", 15, "#2563eb"); // Brand Blue
  doc.text("OS", margin + 26, y + 6.5);

  // INVOICE label (right-aligned)
  setFont("bold", 24, "#475569"); // Slate-600
  doc.text("INVOICE", pageW - margin, y + 6.5, { align: "right" });

  y += 18;

  // 2. Company Details & Invoice Meta Info (Two-Column Layout)
  const metaX = 135;
  const colW = 55;

  // Left Column: Company Info
  setFont("bold", 10, "#0f172a");
  doc.text("Call Automate AI", margin, y);
  setFont("normal", 8.5, "#475569");
  doc.text("123 Tech Way, Suite 400", margin, y + 5);
  doc.text("Dublin, D02 F983", margin, y + 9);
  doc.text("support@callautomate.ai", margin, y + 13);
  doc.text("callautomate.ai", margin, y + 17);

  // Right Column: Invoice Meta Details (Right Aligned values)
  const formattedGen = bill.generatedAt ? formatDateTime(bill.generatedAt) : formatDateTime(new Date().toISOString());
  const formattedDue = bill.periodEnd ? formatDateTime(bill.periodEnd) : "Immediate";

  const metaData = [
    ["Date:", formattedGen],
    ["Invoice #:", invoiceNum],
    ["Customer ID:", customerId],
    ["Due Date:", formattedDue],
  ];

  metaData.forEach(([label, val], idx) => {
    const rowY = y + idx * 5.5;
    setFont("bold", 9, "#475569");
    doc.text(label, metaX, rowY);
    setFont("normal", 9, "#0f172a");
    doc.text(val, pageW - margin, rowY, { align: "right" });
  });

  y += 26;

  // Divider Line
  setDraw("#cbd5e1"); // Slate-300
  doc.setLineWidth(0.3);
  line(margin, y, pageW - margin, y);
  y += 7;

  // 3. Bill To & Period Info (Two-Column Layout)
  // Left: Bill To
  setFont("bold", 8.5, "#475569");
  doc.text("BILL TO", margin, y);
  // Underline for BILL TO
  setDraw("#cbd5e1");
  doc.setLineWidth(0.2);
  line(margin, y + 1.5, margin + 70, y + 1.5);

  setFont("bold", 10, "#0f172a");
  doc.text(bill.userName ?? "Customer", margin, y + 6);
  setFont("normal", 9, "#475569");
  doc.text(`Email: ${bill.userEmail ?? "—"}`, margin, y + 10.5);

  // Right: Period
  setFont("bold", 8.5, "#475569");
  doc.text("Period:", metaX, y);

  const formattedStart = bill.periodStart ? formatDateTime(bill.periodStart) : "—";
  const formattedEnd = bill.periodEnd ? formatDateTime(bill.periodEnd) : "present";
  setFont("normal", 9, "#0f172a");
  const periodText = `${formattedStart} –\n${formattedEnd}`;
  const periodLines = doc.splitTextToSize(periodText, colW);
  doc.text(periodLines, metaX, y + 5.5);

  y += 22;

  // 4. Description / Table Details
  // Table Header
  setFill("#78716c"); // Stone-500 grey
  doc.rect(margin, y, contentW, 7, "F");

  setFont("bold", 8.5, "#ffffff");
  doc.text("DESCRIPTION", margin + 3, y + 5);
  doc.text("AMOUNT", pageW - margin - 3, y + 5, { align: "right" });

  y += 7;

  // Table Row
  setFill("#ffffff");
  setDraw("#d1d5db"); // Grey-300
  doc.setLineWidth(0.3);
  doc.rect(margin, y, contentW, 16, "FD");

  let itemTitle = "";
  let itemDesc = "";

  if (bill.type === "overage") {
    itemTitle = `Overage Usage Fee — ${bill.planName}`;
    itemDesc = `${bill.usedMinutes ?? 0} mins used / ${bill.allocatedMinutes ?? 0} mins allocated  |  ` +
      `${bill.overageMinutes ?? 0} overage mins x $${(bill.pricePerMinute ?? 0).toFixed(4)}/min`;
  } else if (bill.type === "renewal") {
    itemTitle = `Subscription Renewal — ${bill.planName} Plan`;
    itemDesc = `Monthly subscription renewal fee for ${bill.planName} plan.`;
  } else {
    itemTitle = `Initial Subscription — ${bill.planName} Plan`;
    itemDesc = `Initial monthly plan subscription fee for ${bill.planName} plan.`;
  }

  setFont("bold", 9.5, "#0f172a");
  doc.text(itemTitle, margin + 3, y + 6);
  setFont("normal", 8, "#6b7280"); // Grey-500
  doc.text(itemDesc, margin + 3, y + 11.5);

  setFont("bold", 10, "#0f172a");
  doc.text(`$${bill.amount.toFixed(2)}`, pageW - margin - 3, y + 9.5, { align: "right" });

  y += 24;

  // 5. Payment Terms & Totals Row (Two Columns)
  // Left Column: Payment Terms Box
  const termsW = 95;
  const termsH = 26;
  setFill("#ffffff");
  setDraw("#38bdf8"); // Sky-400 (light blue)
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, termsW, termsH, 2, 2, "FD");

  setFont("bold", 9, "#0f172a");
  doc.text("Payment Terms", margin + 4, y + 6);
  setFont("normal", 7.5, "#334155");
  doc.text("1. Total payment is due within 30 days of invoice date.", margin + 4, y + 11);
  doc.text("2. Please reference the invoice number on all payments.", margin + 4, y + 15.5);
  doc.text("Make all payments payable to: ", margin + 4, y + 21);
  setFont("bold", 7.5, "#0f172a");
  doc.text("Call Automate AI", margin + 41, y + 21);

  // Right Column: Totals Details
  const totalsX = 135;
  const totalsW = 55;

  const totalsData: [string, string, boolean][] = [
    ["Subtotal", `$${bill.amount.toFixed(2)}`, false],
    ["Tax Rate", "0.00%", false],
    ["Tax Due", "$0.00", false],
    ["TOTAL DUE", `$${bill.amount.toFixed(2)}`, true],
  ];

  totalsData.forEach(([label, val, isTotal], idx) => {
    const rowY = y + idx * 6.5;

    if (isTotal) {
      // Light grey box for total
      setFill("#e2e8f0"); // Slate-200
      doc.rect(totalsX, rowY - 1.5, totalsW, 6.5, "F");
      setFont("bold", 9, "#0f172a");
    } else {
      setFont("normal", 8.5, "#475569");
    }

    doc.text(label, totalsX + 2, rowY + 3);
    doc.text(val, pageW - margin - 2, rowY + 3, { align: "right" });
  });

  y += termsH + 18;

  // 6. Footer Thank You & Contact Link
  setFont("italic", 10, "#475569");
  doc.text("Thank You For Your Business!", pageW / 2, y, { align: "center" });

  y += 5.5;
  setFont("normal", 8.5, "#6b7280");
  doc.text("Questions? Contact us at ", (pageW / 2) - 15, y, { align: "center" });
  setFont("bold", 8.5, "#2563eb"); // Blue link
  doc.text("support@callautomate.ai", (pageW / 2) + 22, y, { align: "center" });

  // ── SAVE FILE ──────────────────────────────────────────────────────────────
  doc.save(`invoice-${invoiceNum}.pdf`);
}
