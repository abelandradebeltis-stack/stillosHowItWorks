 // ... existing code ...

const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => Array.from(root.querySelectorAll(s));

// DOM refs
const search = $('#search');
const copyBtns = $$('.copy-btn');
const checkAll = $('#checkAll');
const uncheckAll = $('#uncheckAll');
const checklist = $('#checklist');
const checkitems = () => $$('.checkitem');
const exportChecklist = $('#exportChecklist');
const resetAll = $('#resetAll');
const campoCodigo = $('#campoCodigo');
const campoData = $('#campoData');

// Simple persistent storage for checklist and fields (notes removed)
const STORAGE_KEY = 'manual_sql_state_v1';

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return;
    const state = JSON.parse(raw);
    if(state.checks){
      const inputs = checkitems();
      inputs.forEach((i, idx) => { i.checked = !!state.checks[idx]; });
    }
    if(state.codigo) campoCodigo.value = state.codigo;
    if(state.data) campoData.value = state.data;
  }catch(e){}
}

function saveState(){
  const inputs = checkitems();
  const state = {
    checks: inputs.map(i => i.checked),
    codigo: campoCodigo.value,
    data: campoData.value
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

copyBtns.forEach(btn=>{
  // store original label so we can restore it
  if(!btn.dataset.orig) btn.dataset.orig = btn.innerText;

  btn.addEventListener('click', e=>{
    const target = document.querySelector(btn.dataset.target);
    if(!target) return;
    navigator.clipboard.writeText(target.innerText.trim()).then(()=>{
      btn.innerText = 'Copiado';
      setTimeout(()=> btn.innerText = btn.dataset.orig, 1000);
    }).catch(()=>{
      btn.innerText = 'Erro';
      setTimeout(()=> btn.innerText = btn.dataset.orig, 1000);
    });
  });
});

// Search filter for accordion content and checklist items
search.addEventListener('input', () => {
  const q = search.value.trim().toLowerCase();
  const items = $$('.accordion-item');
  if(!q){
    items.forEach(it=> it.style.display = '');
    return;
  }
  items.forEach(it=>{
    const text = it.innerText.toLowerCase();
    it.style.display = text.includes(q) ? '' : 'none';
  });
});

// Checklist controls
checkAll.addEventListener('click', ()=>{
  checkitems().forEach(i=> i.checked = true);
  saveState();
});
uncheckAll.addEventListener('click', ()=>{
  checkitems().forEach(i=> i.checked = false);
  saveState();
});
checklist.addEventListener('change', saveState);

// Export checklist as text (notes removed)
exportChecklist.addEventListener('click', ()=>{
  const checks = checkitems().map((i, idx) => `${i.checked ? '[x]' : '[ ]'} ${i.parentElement.innerText.trim()}`);
  const text = [
    'Manual – Fechamento SQL + Comissões',
    `Código: ${campoCodigo.value || '-' }  Data: ${campoData.value || '-'}`,
    '',
    'Checklist:',
    ...checks
  ].join('\n');
  const blob = new Blob([text], {type:'text/plain;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'checklist_fechamento_sql.txt';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

// Reset all (confirm quick)
resetAll.addEventListener('click', ()=>{
  if(!confirm('Resetar checklist e campos?')) return;
  checkitems().forEach(i=> i.checked = false);
  campoCodigo.value = '';
  campoData.value = '';
  saveState();
});

// Persist small changes
window.addEventListener('beforeunload', saveState);
campoCodigo.addEventListener('input', saveState);
campoData.addEventListener('input', saveState);

// Initialize
loadState();
// ... existing code ...