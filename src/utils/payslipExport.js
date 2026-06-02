const PAYSLIP_DOCUMENT_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: "Inter", ui-sans-serif, system-ui, sans-serif;
    color: #0f172a;
    background: #fff;
    padding: 24px;
    font-size: 13px;
    line-height: 1.5;
  }
  .payslip-doc { max-width: 720px; margin: 0 auto; }
  .payslip-doc-header {
    border-bottom: 3px solid #2563eb;
    padding-bottom: 16px;
    margin-bottom: 20px;
  }
  .payslip-doc-title {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #2563eb;
  }
  .payslip-doc h1 { font-size: 22px; font-weight: 700; margin-top: 4px; }
  .payslip-doc-meta { color: #64748b; font-size: 12px; margin-top: 4px; }
  .payslip-doc-net {
    margin-top: 16px;
    padding: 14px 16px;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 10px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  .payslip-doc-net-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
  .payslip-doc-net-value { font-size: 24px; font-weight: 700; color: #1d4ed8; font-variant-numeric: tabular-nums; }
  section { margin-bottom: 16px; }
  section h2 {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #64748b;
    margin-bottom: 8px;
    padding-bottom: 6px;
    border-bottom: 1px solid #e2e8f0;
  }
  .payslip-grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  table { width: 100%; border-collapse: collapse; }
  td {
    padding: 7px 0;
    border-bottom: 1px solid #f1f5f9;
    vertical-align: top;
  }
  td:first-child { color: #64748b; width: 48%; }
  td:last-child { text-align: right; font-weight: 600; font-variant-numeric: tabular-nums; }
  tr.payslip-highlight td {
    background: #eff6ff;
    padding: 10px 8px;
    border-bottom: none;
    border-radius: 6px;
  }
  tr.payslip-highlight td:first-child { color: #334155; font-weight: 600; }
  tr.payslip-highlight td:last-child { color: #1d4ed8; font-size: 16px; }
  tr.payslip-negative td:last-child { color: #e11d48; }
  tr.payslip-positive td:last-child { color: #059669; }
  .payslip-note {
    padding: 12px 14px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 12px;
    color: #475569;
  }
  .payslip-adj {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid #f1f5f9;
    gap: 12px;
  }
  .payslip-adj-reason { font-size: 11px; color: #94a3b8; margin-top: 2px; }
  .payslip-footer {
    margin-top: 24px;
    padding-top: 12px;
    border-top: 1px dashed #cbd5e1;
    font-size: 10px;
    color: #94a3b8;
    text-align: center;
  }
  @media print {
    body { padding: 0; }
    .payslip-doc { max-width: none; }
  }
`;

export function buildPayslipDocumentHtml(bodyHtml, title = 'Phiếu lương') {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>${PAYSLIP_DOCUMENT_STYLES}</style>
</head>
<body>
  <div class="payslip-doc">${bodyHtml}</div>
</body>
</html>`;
}

export function printPayslipElement(element) {
  if (!element) return false;
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    return false;
  }

  const title = element.getAttribute('data-payslip-title') || 'Phiếu lương';
  doc.open();
  doc.write(buildPayslipDocumentHtml(element.innerHTML, title));
  doc.close();

  const win = iframe.contentWindow;
  const cleanup = () => {
    if (iframe.parentNode) document.body.removeChild(iframe);
  };

  win?.addEventListener('afterprint', cleanup, { once: true });
  setTimeout(() => {
    try {
      win?.focus();
      win?.print();
    } finally {
      setTimeout(cleanup, 1500);
    }
  }, 250);

  return true;
}

export function downloadPayslipHtml(filename, bodyHtml, title = 'Phiếu lương') {
  const html = buildPayslipDocumentHtml(bodyHtml, title);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.html') ? filename : `${filename}.html`;
  link.click();
  URL.revokeObjectURL(url);
  return true;
}

export function buildPayslipFilename(payroll) {
  const code = String(payroll?.employeeCode || payroll?.code || 'nv')
    .replace(/[^\w\u00C0-\u024F\u1E00-\u1EFF-]/gi, '_')
    .slice(0, 40);
  const month = payroll?.month ?? '00';
  const year = payroll?.year ?? '0000';
  return `phieu-luong_${code}_${month}-${year}.html`;
}
