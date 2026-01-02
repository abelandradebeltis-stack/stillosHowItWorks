/* Interatividade mínima e utilitária para o manual */

document.addEventListener('DOMContentLoaded', () => {
  // Open/close all
  const bsCollapseEls = [...document.querySelectorAll('.accordion-collapse')];
  const openAll = document.getElementById('btn-open-all');
  const closeAll = document.getElementById('btn-close-all');

  openAll.addEventListener('click', () => bsCollapseEls.forEach(el => new bootstrap.Collapse(el, {show:true})));
  closeAll.addEventListener('click', () => bsCollapseEls.forEach(el => new bootstrap.Collapse(el, {hide:true})));

  // Copy checklist
  document.getElementById('btn-copy-note').addEventListener('click', async () => {
    const text = 'Checklist: conectar VM → confirmar período → abrir SQL → REPLACE datas/período → executar SELECT/UPDATE conforme manual';
    await navigator.clipboard.writeText(text).catch(() => {});
    showTempMsg('Copiado para a área de transferência');
  });

  // Period set
  document.getElementById('btn-set-period').addEventListener('click', () => {
    const oldP = document.getElementById('periodOld').value.trim();
    const newP = document.getElementById('periodNew').value.trim();
    if (!oldP || !newP) return showTempMsg('Preencha ambos os períodos', true);
    document.getElementById('periodResult').textContent = `Período salvo: ${oldP} → ${newP}`;
  });

  // Codes formatting to IN(...)
  const codesInput = document.getElementById('codesInput');
  const preview = document.getElementById('previewUpdate');
  document.getElementById('btn-format-codes').addEventListener('click', () => {
    const raw = codesInput.value.replace(/[^\\d,]/g,'').split(',').map(s => s.trim()).filter(Boolean);
    if (!raw.length) return showTempMsg('Nenhum código válido encontrado', true);
    const inClause = raw.join(', ');
    const update = `UPDATE table SET ... WHERE PedidoID IN (${inClause});`;
    preview.style.display = 'block';
    preview.textContent = update;
  });

  // Copy UPDATE
  document.getElementById('btn-copy-in').addEventListener('click', async () => {
    const text = preview.textContent.trim();
    if (!text) return showTempMsg('Nenhum UPDATE gerado', true);
    await navigator.clipboard.writeText(text).catch(() => {});
    showTempMsg('UPDATE copiado');
  });

  // Copy flowchart
  document.getElementById('btn-copy-flow').addEventListener('click', async () => {
    const flow = document.getElementById('flowchart').textContent;
    await navigator.clipboard.writeText(flow).catch(() => {});
    showTempMsg('Fluxograma copiado');
  });

  // Print flow (open print dialog focused on the flow pre)
  document.getElementById('btn-print').addEventListener('click', () => {
    const content = document.getElementById('flowchart').textContent;
    const w = window.open('', '_blank');
    w.document.write('<pre style="font-family:monospace;white-space:pre-wrap">'+escapeHtml(content)+'</pre>');
    w.document.close();
    w.focus();
    w.print();
  });

  // small snackbar
  function showTempMsg(msg, isError=false){
    const el = document.createElement('div');
    el.textContent = msg;
    el.style.position = 'fixed';
    el.style.left = '50%';
    el.style.transform = 'translateX(-50%)';
    el.style.bottom = '18px';
    el.style.background = isError ? '#dc3545' : '#212529';
    el.style.color = '#fff';
    el.style.padding = '8px 12px';
    el.style.borderRadius = '8px';
    el.style.zIndex = 9999;
    document.body.appendChild(el);
    setTimeout(()=> el.remove(), 1800);
  }

  function escapeHtml(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
});