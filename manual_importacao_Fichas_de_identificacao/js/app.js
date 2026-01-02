// Import bootstrap's JS from esm.sh to ensure components (modals, collapse) work
import * as bootstrap from 'https://esm.sh/bootstrap@5.3.2';

// Small UI behaviors
document.addEventListener('DOMContentLoaded', () => {
  const btnPrint = document.getElementById('btn-print-checklist');
  const btnDownload = document.getElementById('btn-download-todo');
  const btnShort = document.getElementById('show-shortcuts');

  btnPrint?.addEventListener('click', () => {
    const w = window.open('', '_blank');
    const content = document.getElementById('quick-checklist')?.outerHTML || '';

    // Build a styled printable document that matches the Stillos theme and includes the logo
    const printStyles = `
      @media print { @page { margin: 20mm; } }
      body { font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; color: #000; background: #fff; margin: 0; padding: 20px; }
      .print-header { display:flex; align-items:center; gap:12px; border-bottom:1px solid rgba(0,0,0,0.06); padding-bottom:12px; margin-bottom:14px; }
      .print-logo { width:56px; height:56px; object-fit:contain; border-radius:8px; background:transparent; }
      .print-title { font-size:18px; font-weight:600; color:#000; }
      .print-sub { font-size:12px; color:rgba(0,0,0,0.6); margin-top:2px; }
      .checklist { font-size:14px; color:rgba(0,0,0,0.8); margin-top:8px; }
      .checklist li { margin:0.45rem 0; }
      .brand-accent { color: #ff2d85; }
      .footer-note { margin-top:18px; font-size:11px; color:rgba(0,0,0,0.6); border-top:1px solid rgba(0,0,0,0.04); padding-top:10px; }
    `;

    const header = `
      <div class="print-header">
        <img src="stillos-logo.png" class="print-logo" alt="STILLOS">
        <div>
          <div class="print-title">Manual — Importação de identificação</div>
          <div class="print-sub">Checklist rápido · Stillos Production & Events</div>
        </div>
      </div>
    `;

    const body = `
      <h3 class="brand-accent">Checklist rápido</h3>
      <ul class="checklist">
        ${Array.from(document.querySelectorAll('#quick-checklist li')).map(li => `<li>${li.textContent.trim()}</li>`).join('')}
      </ul>
      <div class="footer-note">Documentação interna - Sistemas Stillos · By Beltis tecnologia 2025 © ADS Beltis 2025</div>
    `;

    w.document.write(`<!doctype html><html><head><title>Checklist</title><meta charset="utf-8"><style>${printStyles}</style></head><body>${header}${body}</body></html>`);
    w.document.close();

    // Give the browser a moment to load the image and render before printing
    const tryPrint = () => {
      const img = w.document.querySelector('.print-logo');
      if (!img || img.complete) {
        w.focus();
        w.print();
      } else {
        img.onload = () => { w.focus(); w.print(); };
        // fallback
        setTimeout(() => { try { w.focus(); w.print(); } catch(e){} }, 700);
      }
    };
    tryPrint();
  });

  btnDownload?.addEventListener('click', () => {
    const steps = [
      '1. Acesse Google Drive com conta correta.',
      '2. Abra Formulários → Exportar respostas → TSV → renomear para DADOS.TSV.',
      '3. Salvar DADOS.TSV nas pastas h:\\\\bd\\\\IdGeral | IdGeralMackenzie | IdFive conforme formulário.',
      '4. Abrir IdCarga.xlsx, salvar cópia (configurar colunas como texto) → carga.xlsx.',
      '5. Usar SSIS para exportar carga.xlsx → [TAB_FICHAS_DE_IDENTIFICACAO_CARGA] (marcar excluir linhas).',
      '6. Executar view correspondente e salvar resultado em XLSX.',
      '7. Usar SSIS para importar o XLSX na tabela TAB_FICHAS_IDENTIFICACAO.',
      '8. Executar consulta baixa fotos sem nome.sql → salvar XLSX → converter para fotos.json → node . → apagar .HEIC → redimensionar via FastStone → imprimir fichas no Visual Studio.'
    ];
    const blob = new Blob([steps.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'manual_passos.txt'; a.click();
    URL.revokeObjectURL(url);
  });

  btnShort?.addEventListener('click', () => {
    const modalEl = document.getElementById('modal-shortcuts');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  });

  // Accessibility: focus first button in modals when opened
  document.querySelectorAll('.modal').forEach(m => {
    m.addEventListener('shown.bs.modal', (ev) => {
      const modal = ev.target;
      const btn = modal.querySelector('button, [role=\"button\"], a');
      btn?.focus();
    });
  });
});