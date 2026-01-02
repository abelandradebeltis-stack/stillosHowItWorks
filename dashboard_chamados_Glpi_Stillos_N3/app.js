import Papa from "papaparse";
import Chart from "chart.js/auto";
import "chartjs-adapter-date-fns";

const CSV_PATH = '/glpi.csv';
const MAX_ROWS_TABLE = 500;

const state = {
  raw: [],
  fields: [],
  filtered: []
};

const el = {
  dateFrom: document.getElementById('dateFrom'),
  dateTo: document.getElementById('dateTo'),
  filterField: document.getElementById('filterField'),
  filterValue: document.getElementById('filterValue'),
  splitByTitle: document.getElementById('splitByTitle'),
  resetBtn: document.getElementById('resetBtn'),
  openTitlesBtn: document.getElementById('openTitlesBtn'),
  summary: document.getElementById('summary'),
  lastUpdate: document.getElementById('lastUpdate'),
  tableWrap: document.getElementById('tableWrap'),
  pieChart: document.getElementById('pieChart'),
  barChart: document.getElementById('barChart'),
  // time chart canvas may be created dynamically; reference placeholder for the time-series chart if present
  timeChart: document.getElementById('timeChart'),
  // file input for CSV upload
  csvUpload: document.getElementById('csvUpload')
};

// Helpers
function safeNumber(v){ const n = parseFloat(v); return Number.isFinite(n) ? n : null; }
function niceDateStr(d){ return d instanceof Date ? d.toLocaleDateString() : ''; }

function parseDate(raw){
  // try ISO first, then common dd/mm/yyyy or dd-mm-yyyy formats, fallback to Date(raw)
  if(!raw && raw !== 0) return null;
  if(raw instanceof Date) return isNaN(raw) ? null : raw;
  const s = String(raw).trim();
  // ISO-like (yyyy-mm-dd or yyyy/mm/dd) or RFC style
  const iso = new Date(s);
  if(!isNaN(iso)) return iso;
  // dd/mm/yyyy or dd-mm-yyyy
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if(m){
    const day = Number(m[1]), mon = Number(m[2]) - 1, year = Number(m[3]);
    const d = new Date(year, mon, day);
    if(!isNaN(d)) return d;
  }
  // try mm/dd/yyyy (ambiguous) as last resort
  const m2 = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if(m2){
    // assume mm/dd/yyyy if year isn't obviously >31
    const a = Number(m2[1]), b = Number(m2[2]), y = Number(m2[3]);
    if(a > 12 && b <= 12){
      const d = new Date(y, a - 1, b);
      if(!isNaN(d)) return d;
    } else {
      const d = new Date(y, b - 1, a);
      if(!isNaN(d)) return d;
    }
  }
  // fallback
  const fallback = new Date(s);
  return isNaN(fallback) ? null : fallback;
}

async function loadCSV(){
  const resp = await fetch(CSV_PATH);
  if(!resp.ok) throw new Error('Falha ao carregar CSV');
  const text = await resp.text();
  const parsed = Papa.parse(text, {header:true, skipEmptyLines:true});
  state.raw = parsed.data;
  state.fields = parsed.meta.fields || [];
  document.getElementById('lastUpdate').textContent = new Date().toLocaleString();
  prepareFilters();
  applyFilters();
}

function prepareFilters(){
  const fieldSelect = el.filterField;
  fieldSelect.innerHTML = '<option value="">(Nenhum)</option>';
  state.fields.forEach(f=>{
    const opt = document.createElement('option');
    opt.value = f;
    opt.textContent = f;
    fieldSelect.appendChild(opt);
  });
}

function getFieldUniqueValues(field){
  const set = new Set();
  state.raw.forEach(r=>{
    const v = r[field];
    if(v !== undefined && v !== null && String(v).trim() !== '') set.add(String(v));
  });
  return Array.from(set).sort();
}

function applyFilters(){
  let rows = state.raw.slice();

  // date filter: try to detect a date-like field from headers if user left fields empty
  const dateField = detectDateField();
  const from = el.dateFrom.value ? new Date(el.dateFrom.value) : null;
  const to = el.dateTo.value ? new Date(el.dateTo.value) : null;

  if(dateField && (from || to)){
    rows = rows.filter(r=>{
      const v = r[dateField];
      if(!v) return false;
      const d = parseDate(v);
      if (!d || isNaN(d)) return false;
      if(from && d < from) return false;
      if(to){
        // include entire day
        const dayEnd = new Date(to); dayEnd.setHours(23,59,59,999);
        if(d > dayEnd) return false;
      }
      return true;
    });
  }

  const fField = el.filterField.value;
  const fValue = el.filterValue.value;
  if(fField){
    // update value options
    const vals = getFieldUniqueValues(fField);
    populateFilterValues(vals);
    if(fValue){
      rows = rows.filter(r => String(r[fField]) === fValue);
    }
  } else {
    el.filterValue.innerHTML = '<option value="">(Todos)</option>';
  }

  state.filtered = rows;
  renderAll();
}

function detectDateField(){
  // heuristic: choose first field with 'date' or 'data' or 'created' in name
  const candidates = state.fields.filter(f=>{
    const lower = f.toLowerCase();
    return lower.includes('date') || lower.includes('data') || lower.includes('created') || lower.includes('criado');
  });
  return candidates.length ? candidates[0] : null;
}

function detectTitleField(){
  // heuristic: common title-like fields
  const prefer = ['title','título','titulo','subject','assunto','name','nome'];
  for(const p of prefer){
    const found = state.fields.find(f => f.toLowerCase() === p);
    if(found) return found;
  }
  // fallback: choose the field with 'title' or 'subject' substring
  const candidates = state.fields.filter(f=>{
    const lower = f.toLowerCase();
    return lower.includes('title') || lower.includes('título') || lower.includes('titulo') || lower.includes('subject') || lower.includes('assunto');
  });
  return candidates.length ? candidates[0] : null;
}

function populateFilterValues(vals){
  const sel = el.filterValue;
  const current = sel.value;
  sel.innerHTML = '<option value="">(Todos)</option>';
  vals.forEach(v=>{
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v;
    sel.appendChild(opt);
  });
  if(vals.includes(current)) sel.value = current;
}

function summarize(){
  const total = state.filtered.length;
  const numericCols = state.fields.filter(f=> state.filtered.some(r=> safeNumber(r[f]) !== null));
  const sampleNums = numericCols.slice(0,3).map(f=>{
    const nums = state.filtered.map(r=> safeNumber(r[f])).filter(n=> n !== null);
    if(!nums.length) return null;
    const sum = nums.reduce((a,b)=>a+b,0);
    return {field:f,sum:sum,avg:sum/nums.length,min:Math.min(...nums),max:Math.max(...nums),count:nums.length};
  }).filter(Boolean);

  const summaryItems = [
    {label:'Linhas visíveis', value: total},
    {label:'Campos (colunas)', value: state.fields.length},
    ...sampleNums.map(s=> ({label: s.field +' — média', value: Number(s.avg.toFixed(2))}))
  ];

  el.summary.innerHTML = '';
  summaryItems.forEach(it=>{
    const div = document.createElement('div');
    div.className = 'summary-item';
    div.innerHTML = `<div class="num">${it.value}</div><div class="label">${it.label}</div>`;
    el.summary.appendChild(div);
  });
}

function buildTable(){
  const rows = state.filtered.slice(0, MAX_ROWS_TABLE);
  const tbl = document.createElement('table');
  tbl.className = 'table';
  const thead = document.createElement('thead');
  const trh = document.createElement('tr');
  state.fields.forEach(f=>{
    const th = document.createElement('th');
    th.textContent = f;
    trh.appendChild(th);
  });
  thead.appendChild(trh);
  tbl.appendChild(thead);

  const tbody = document.createElement('tbody');
  rows.forEach(r=>{
    const tr = document.createElement('tr');
    state.fields.forEach(f=>{
      const td = document.createElement('td');
      td.textContent = r[f] ?? '';
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  tbl.appendChild(tbody);

  el.tableWrap.innerHTML = '';
  el.tableWrap.appendChild(tbl);
  if(state.filtered.length > MAX_ROWS_TABLE){
    const note = document.createElement('div');
    note.style.padding='8px';
    note.style.fontSize='13px';
    note.style.color='var(--muted)';
    note.textContent = `Mostrando ${MAX_ROWS_TABLE} de ${state.filtered.length} linhas (filtre para refinar).`;
    el.tableWrap.appendChild(note);
  }
}

let charts = {time:null,pie:null,bar:null};

function renderCharts(){
  // safe canvas context helper
  function getCanvasCtx(c){ return c && c.getContext ? c.getContext('2d') : null; }

  // Detect helpful fields for "tempo" and "progresso"
  const dateField = detectDateField();
  const titleField = detectTitleField();
  const tempoCandidates = ['tempo','tempo_atendimento','time_to_attend','time_to_resolution','time_to_reply','sla','tempo_resposta'];
  const progressCandidates = ['progress','progresso','percent','porcentagem','percentual','percent_complete'];
  function findFirstField(list){
    for(const name of list){
      const found = state.fields.find(f => f.toLowerCase() === name);
      if(found) return found;
    }
    // fallback to substring match
    for(const name of list){
      const found = state.fields.find(f => f.toLowerCase().includes(name));
      if(found) return found;
    }
    return null;
  }
  // allow user-selected filter field (if numeric) to be used as the tempo series
  let tempoField = findFirstField(tempoCandidates);
  const progressField = findFirstField(progressCandidates);

  const userSelectedField = el.filterField.value;
  if(userSelectedField){
    // check whether selected field has numeric values in the filtered set
    const hasNumeric = state.filtered.some(r => safeNumber(r[userSelectedField]) !== null);
    if(hasNumeric){
      tempoField = userSelectedField;
    }
  }

  const ctxTime = getCanvasCtx(el.timeChart);

  if(dateField && ctxTime){
    // aggregate per day: counts, avg tempo, avg progress
    const dateSet = new Set();
    const agg = {}; // dateKey -> {count, sumTempo, tempoCount, sumProg, progCount, perTitle:{...}}
    for(const r of state.filtered){
      const raw = r[dateField];
      if(!raw) continue;
      const d = parseDate(raw);
      if(!d || isNaN(d)) continue;
      const dateKey = d.toISOString().slice(0,10);
      dateSet.add(dateKey);
      if(!agg[dateKey]) agg[dateKey] = {count:0,sumTempo:0,tempoCount:0,sumProg:0,progCount:0,perTitle:{}} ;
      const node = agg[dateKey];
      node.count += 1;

      // tempo
      if(tempoField){
        const n = safeNumber(r[tempoField]);
        if(n !== null){ node.sumTempo += n; node.tempoCount += 1; }
      }

      // progress
      if(progressField){
        const p = safeNumber(r[progressField]);
        if(p !== null){ node.sumProg += p; node.progCount += 1; }
      }

      // per-title counts (for optional split display)
      const title = (r[titleField] ?? '(sem título)').toString();
      node.perTitle[title] = (node.perTitle[title] || 0) + 1;
    }

    const dateKeys = Array.from(dateSet).sort();
    const labelDates = dateKeys.map(k => {
      const parts = k.split('-');
      return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    });

    // Build datasets: primary = avg tempo (left axis), secondary = avg progress% (right axis)
    const avgTempoData = labelDates.map(d => {
      const k = d.toISOString().slice(0,10);
      const node = agg[k];
      if(!node || node.tempoCount === 0) return null;
      return { x: d, y: Number((node.sumTempo / node.tempoCount).toFixed(2)) };
    });

    const avgProgData = labelDates.map(d => {
      const k = d.toISOString().slice(0,10);
      const node = agg[k];
      if(!node || node.progCount === 0) return null;
      return { x: d, y: Number((node.sumProg / node.progCount)) };
    });

    // Also build total count series as faint bar to show volume/background
    const countData = labelDates.map(d => {
      const k = d.toISOString().slice(0,10);
      const node = agg[k];
      return node ? node.count : 0;
    });

    if(charts.time) charts.time.destroy();

    const datasets = [];
    // counts as light bar (left axis but smaller)
    datasets.push({
      type:'bar',
      label:'Chamados (volume)',
      data: dateKeys.map(k=> agg[k] ? agg[k].count : 0),
      backgroundColor: 'rgba(120,120,120,0.12)',
      borderColor: 'rgba(120,120,120,0.18)',
      yAxisID: 'y'
    });

    if(tempoField) datasets.push({
      type:'line',
      label: tempoField + ' — média',
      data: avgTempoData,
      borderColor: 'hsl(182 65% 35%)',
      backgroundColor: 'hsl(182 65% 50% / 0.12)',
      tension: 0.25,
      yAxisID: 'y'
    });

    if(progressField) datasets.push({
      type:'line',
      label: progressField + ' — média (%)',
      data: avgProgData,
      borderColor: 'hsl(10 70% 45%)',
      backgroundColor: 'hsl(10 70% 55% / 0.12)',
      tension: 0.25,
      yAxisID: 'y2'
    });

    charts.time = new Chart(ctxTime, {
      data: {
        labels: labelDates,
        datasets
      },
      options: {
        responsive:true,
        maintainAspectRatio:false,
        interaction:{mode:'index',axis:'x',intersect:false},
        scales:{
          x:{ type:'time', time:{unit:'day',tooltipFormat:'PPP'} },
          y:{ type:'linear', position:'left', title:{display:true, text: tempoField ? 'Tempo (média)' : 'Contagem'}, beginAtZero:true },
          y2:{ type:'linear', position:'right', title:{display:!!progressField, text: progressField ? 'Progresso (%)' : ''}, grid:{drawOnChartArea:false}, beginAtZero:true, ticks:{max:100}}
        },
        plugins:{
          legend:{ position:'right' },
          tooltip:{ mode:'index', intersect:false }
        }
      }
    });

  } else {
    if(charts.time) charts.time.destroy();
    const ctx = getCanvasCtx(el.timeChart);
    if(ctx) ctx.clearRect(0,0,el.timeChart.width,el.timeChart.height);
  }

  // pie: by most frequent categorical field (heuristic: choose field with few unique values)
  let chosenField = null;
  let bestScore = Infinity;
  state.fields.forEach(f=>{
    const uniq = getFieldUniqueValues(f).length;
    if(uniq>1 && uniq < bestScore && uniq <= 30) { bestScore = uniq; chosenField = f; }
  });

  const ctxPie = getCanvasCtx(el.pieChart);
  if(chosenField && ctxPie){
    const map = {};
    state.filtered.forEach(r=>{ const v = r[chosenField] ?? '(vazio)'; map[v] = (map[v]||0) + 1; });
    const entries = Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,20);
    const labels = entries.map(e=>e[0]);
    const data = entries.map(e=>e[1]);
    const colors = labels.map((_,i)=> `hsl(${(i*37)%360} 70% 55%)`);

    if(charts.pie) charts.pie.destroy();
    charts.pie = new Chart(ctxPie,{
      type:'doughnut',
      data:{labels, datasets:[{data, backgroundColor:colors}]},
      options:{plugins:{legend:{position:'right'}}}
    });
  } else {
    if(charts.pie) charts.pie.destroy();
    const ctx = getCanvasCtx(el.pieChart);
    if(ctx) ctx.clearRect(0,0,el.pieChart.width,el.pieChart.height);
  }

  // bar chart: top-N by a numeric or count (unchanged)
  const ctxBar = getCanvasCtx(el.barChart);
  if(!ctxBar){
    if(charts.bar) charts.bar.destroy();
    return;
  }

  // prefer numeric column with many values; otherwise choose most frequent text field
  let barField = null;
  const numericCandidates = state.fields.filter(f=> state.filtered.some(r=> safeNumber(r[f]) !== null));
  if(numericCandidates.length){
    barField = numericCandidates[0];
    // build top by sum
    const sums = {};
    state.filtered.forEach(r=>{
      const key = r[barField] ?? '(vazio)';
      const n = safeNumber(r[barField]) ?? 0;
      sums[key] = (sums[key]||0) + n;
    });
    const entries = Object.entries(sums).sort((a,b)=>b[1]-a[1]).slice(0,10);
    const labels = entries.map(e=>e[0]);
    const data = entries.map(e=>e[1]);
    if(charts.bar) charts.bar.destroy();
    charts.bar = new Chart(ctxBar,{
      type:'bar',
      data:{labels,datasets:[{label:`Soma de ${barField}`,data,backgroundColor:'rgba(15,118,110,0.8)'}]},
      options:{indexAxis:'y',plugins:{legend:{display:false}},scales:{x:{beginAtZero:true}}}
    });
  } else {
    // use most frequent non-numeric
    const freqField = (() => {
      let best = null; let bestU = Infinity;
      state.fields.forEach(f=>{
        const u = getFieldUniqueValues(f).length;
        if(u>1 && u < bestU){ bestU = u; best = f; }
      });
      return best;
    })();
    if(freqField){
      const counts = {};
      state.filtered.forEach(r=>{ const v = r[freqField] ?? '(vazio)'; counts[v] = (counts[v]||0)+1; });
      const entries = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,10);
      const labels = entries.map(e=>e[0]);
      const data = entries.map(e=>e[1]);
      if(charts.bar) charts.bar.destroy();
      charts.bar = new Chart(ctxBar,{
        type:'bar',
        data:{labels,datasets:[{label:`Contagem por ${freqField}`,data,backgroundColor:'rgba(15,118,110,0.8)'}]},
        options:{indexAxis:'y',plugins:{legend:{display:false}},scales:{x:{beginAtZero:true}}}
      });
    } else {
      if(charts.bar) charts.bar.destroy();
      const ctx = getCanvasCtx(el.barChart);
      if(ctx) ctx.clearRect(0,0,el.barChart.width,el.barChart.height);
    }
  }
}

function renderAll(){
  summarize();
  buildTable();
  renderCharts();
}

function openModal(htmlContent){
  const overlay = document.getElementById('modalOverlay');
  const body = document.getElementById('modalBody');
  const closeBtn = document.getElementById('modalClose');
  body.innerHTML = '';
  if (typeof htmlContent === 'string') body.innerHTML = htmlContent;
  else body.appendChild(htmlContent);
  overlay.hidden = false;
  // focus close for accessibility (guard in case the button was reparented or isn't present)
  if (closeBtn && typeof closeBtn.focus === 'function') {
    try { closeBtn.focus(); } catch(e){ /* ignore focus errors */ }
  }
}

let _modalCharts = [];
function closeModal(){
  // destroy any charts created inside modal to free memory
  try{
    _modalCharts.forEach(c => { if(c && typeof c.destroy === 'function') c.destroy(); });
  }catch(e){/* ignore */}
  _modalCharts = [];

  const overlay = document.getElementById('modalOverlay');
  overlay.hidden = true;
  document.getElementById('modalBody').innerHTML = '';
}

document.addEventListener('click', (e)=>{
  const overlay = document.getElementById('modalOverlay');
  if(!overlay) return;
  if(e.target === overlay) closeModal();
});
document.getElementById('modalClose').addEventListener('click', closeModal);
// close modal with Escape for better UX/accessibility
document.addEventListener('keydown', (e)=>{
  if(e.key === 'Escape'){
    const overlay = document.getElementById('modalOverlay');
    if(overlay && !overlay.hidden) closeModal();
  }
});







/* --- Title listing / per-title details --- */
function buildTitleListContent(){
  const titleField = detectTitleField();
  const container = document.createElement('div');

  if(!titleField){
    container.textContent = 'Campo de título não identificado nos dados.';
    return container;
  }

  // compute counts per title
  const counts = {};
  state.filtered.forEach(r=>{
    const t = (r[titleField] ?? '(sem título)').toString();
    counts[t] = (counts[t]||0) + 1;
  });

  const entries = Object.entries(counts).sort((a,b)=>b[1]-a[1]);

  const table = document.createElement('table');
  table.className = 'modal-list-table title-counts';
  const thead = document.createElement('thead');
  thead.innerHTML = `<tr><th>Título</th><th>Contagem</th><th></th></tr>`;
  table.appendChild(thead);
  const tbody = document.createElement('tbody');

  entries.forEach(([title, cnt])=>{
    const tr = document.createElement('tr');
    const tdTitle = document.createElement('td');
    tdTitle.textContent = title;
    const tdCnt = document.createElement('td');
    tdCnt.textContent = cnt;
    const tdBtn = document.createElement('td');
    const btn = document.createElement('button');
    btn.textContent = 'Abrir';
    btn.className = 'btn';
    btn.style.padding = '6px 8px';
    btn.addEventListener('click', ()=> showRecordsForTitle(title));
    tdBtn.appendChild(btn);
    tr.appendChild(tdTitle);
    tr.appendChild(tdCnt);
    tr.appendChild(tdBtn);
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  container.appendChild(table);
  return container;
}

function showRecordsForTitle(title){
  const titleField = detectTitleField();
  const rows = state.filtered.filter(r => ((r[titleField] ?? '(sem título)').toString() === title));
  const wrap = document.createElement('div');

  const hdr = document.createElement('div');
  hdr.style.marginBottom = '8px';
  hdr.innerHTML = `<strong>${title}</strong> — ${rows.length} chamado(s)`;
  wrap.appendChild(hdr);

  // If many rows, show first 200 to keep modal snappy
  const ROW_LIMIT = 200;
  const table = document.createElement('table');
  table.className = 'modal-list-table';
  const thead = document.createElement('thead');
  const trh = document.createElement('tr');
  state.fields.forEach(f=>{
    const th = document.createElement('th');
    th.textContent = f;
    trh.appendChild(th);
  });
  thead.appendChild(trh);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  rows.slice(0, ROW_LIMIT).forEach(r=>{
    const tr = document.createElement('tr');
    state.fields.forEach(f=>{
      const td = document.createElement('td');
      const txt = r[f] ?? '';
      td.textContent = txt;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  wrap.appendChild(table);

  if(rows.length > ROW_LIMIT){
    const note = document.createElement('div');
    note.style.marginTop = '8px';
    note.style.color = 'var(--muted)';
    note.textContent = `Mostrando ${ROW_LIMIT} de ${rows.length} resultados. Refine filtros para ver mais.`;
    wrap.appendChild(note);
  }

  openModal(wrap);
}

/* --- Field charts: one chart per column (doughnut / "rosca") --- */
function buildFieldChartsContent(){
  // outer wrapper holds header + grid content so modal has a clear header
  const wrapper = document.createElement('div');
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';
  wrapper.style.gap = '12px';
  wrapper.style.maxHeight = '80vh';
  wrapper.style.overflow = 'hidden';

  // modal header
  const header = document.createElement('div');
  header.className = 'modal-header';
  const title = document.createElement('div');
  title.className = 'modal-header-title';
  title.textContent = 'Gráficos por coluna';
  const subtitle = document.createElement('div');
  subtitle.className = 'modal-header-sub';
  subtitle.textContent = `${state.fields.length} campo(s) • ${state.filtered.length} linha(s) visíveis`;
  // small actions area (close is already available globally) — show layout hint
  const hint = document.createElement('div');
  hint.className = 'modal-header-hint';
  hint.textContent = 'Layout: 2 colunas (mude o tamanho da janela para vista móvel)';

  header.appendChild(title);
  header.appendChild(subtitle);
  header.appendChild(hint);

  // if the global modal close button exists, place it inside the header so it
  // doesn't overlap the modal body; this keeps the "X" visually aligned and clean.
  const globalClose = document.getElementById('modalClose');
  if(globalClose){
    // move into header (if already moved elsewhere this will reparent harmlessly)
    header.appendChild(globalClose);
  }

  wrapper.appendChild(header);

  const container = document.createElement('div');
  container.style.display = 'grid';
  // two columns on larger screens, single column on narrow viewports
  container.style.gridTemplateColumns = 'repeat(2, 1fr)';
  container.style.gap = '12px';
  container.style.maxHeight = 'calc(80vh - 88px)'; // account for header height to keep modal bounded
  container.style.overflow = 'auto';
  container.style.alignItems = 'start';
  container.style.padding = '6px';

  // Helper to create small card-like block for each chart
  function makeCard(title){
    const card = document.createElement('div');
    card.className = 'modal-chart-card';

    const h = document.createElement('div');
    h.className = 'modal-chart-title';
    // ensure there's always a visible, descriptive title
    h.textContent = title && String(title).trim() ? title : '(sem nome de campo)';

    const body = document.createElement('div');
    body.className = 'modal-chart-body';

    const c = document.createElement('canvas');
    // let CSS manage sizing; give an explicit pixel height for Chart to render crisply
    c.height = 120;

    body.appendChild(c);
    card.appendChild(h);
    card.appendChild(body);
    return {card, canvas:c, titleEl: h};
  }

  // clear any previous modal charts
  _modalCharts = [];

  // iterate fields
  state.fields.forEach((f, idx)=>{
    const isNumeric = state.filtered.some(r=> safeNumber(r[f]) !== null);
    // override title for the last card to be explicit as requested
    const displayTitle = (idx === state.fields.length - 1) ? 'Total de chamados' : f;
    const {card, canvas, titleEl} = makeCard(displayTitle);
    container.appendChild(card);

    // build data
    if(isNumeric){
      // numeric: create bins and render as doughnut
      const nums = state.filtered.map(r=> safeNumber(r[f])).filter(n=> n !== null);
      if(nums.length === 0){
        const p = document.createElement('div'); p.style.color='var(--muted)'; p.textContent='Sem valores numéricos.';
        card.querySelector('.modal-chart-body').appendChild(p); return;
      }
      const min = Math.min(...nums), max = Math.max(...nums);
      const bins = 6;
      const binSize = (max - min) / bins || 1;
      const counts = new Array(bins).fill(0);
      nums.forEach(n=>{
        let idxBin = Math.floor((n - min) / binSize);
        if(idxBin < 0) idxBin = 0;
        if(idxBin >= bins) idxBin = bins - 1;
        counts[idxBin] += 1;
      });
      const labels = counts.map((_,i)=>{
        const a = (min + i*binSize);
        const b = (min + (i+1)*binSize);
        return `${Number(a.toFixed(2))}–${Number(b.toFixed(2))}`;
      });
      const colors = labels.map((_,i)=> `hsl(${(i*37)%360} 70% 55%)`);
      const total = counts.reduce((s,n)=>s+n,0);
      const ctx = canvas.getContext('2d');
      const ch = new Chart(ctx,{
        type:'doughnut',
        data:{ labels, datasets:[{ data: counts, backgroundColor: colors, hoverOffset:6 }]},
        options:{
          maintainAspectRatio:false,
          plugins:{
            // richer legend: include absolute counts and percent for each slice
            legend:{
              display:true,
              position:'bottom',
              labels:{
                boxWidth:10,
                usePointStyle:true,
                generateLabels: function(chart){
                  const data = chart.data;
                  if(!data || !data.datasets.length) return [];
                  const ds = data.datasets[0];
                  return data.labels.map((lbl, i) => {
                    const value = ds.data[i] ?? 0;
                    const pct = total ? ((value / total) * 100) : 0;
                    return {
                      text: `${lbl} — ${value} (${pct.toFixed(1)}%)`,
                      fillStyle: ds.backgroundColor[i],
                      hidden: false,
                      index: i
                    };
                  });
                }
              }
            },
            tooltip:{
              callbacks:{
                label: function(ctx){
                  const v = ctx.parsed;
                  const pct = total ? (v / total * 100) : 0;
                  const label = ctx.label || '';
                  return `${label}: ${v} — ${pct.toFixed(1)}%`;
                },
                title: function(ctx){ return ctx[0] ? ctx[0].dataset.label || '' : ''; }
              }
            }
          }
        }
      });
      _modalCharts.push(ch);
    } else {
      // categorical: top 20 counts as doughnut (same visual pattern as main pie)
      const countsMap = {};
      state.filtered.forEach(r=>{
        const v = (r[f] ?? '(vazio)').toString();
        countsMap[v] = (countsMap[v]||0) + 1;
      });
      const entries = Object.entries(countsMap).sort((a,b)=>b[1]-a[1]).slice(0,20);
      if(entries.length === 0){
        const p = document.createElement('div'); p.style.color='var(--muted)'; p.textContent='Sem valores.';
        card.querySelector('.modal-chart-body').appendChild(p); return;
      }
      const labels = entries.map(e=>e[0]);
      const data = entries.map(e=>e[1]);
      const colors = labels.map((_,i)=> `hsl(${(i*37)%360} 70% 55%)`);
      const total = data.reduce((s,n)=>s+n,0);
      const ctx = canvas.getContext('2d');
      const ch = new Chart(ctx,{
        type:'doughnut',
        data:{ labels, datasets:[{ data, backgroundColor: colors, hoverOffset:6 }]},
        options:{
          maintainAspectRatio:false,
          plugins:{
            legend:{
              display:true,
              position:'bottom',
              labels:{
                boxWidth:10,
                usePointStyle:true,
                generateLabels: function(chart){
                  const data = chart.data;
                  if(!data || !data.datasets.length) return [];
                  const ds = data.datasets[0];
                  return data.labels.map((lbl, i) => {
                    const value = ds.data[i] ?? 0;
                    const pct = total ? ((value / total) * 100) : 0;
                    return {
                      text: `${lbl} — ${value} (${pct.toFixed(1)}%)`,
                      fillStyle: ds.backgroundColor[i],
                      hidden: false,
                      index: i
                    };
                  });
                }
              }
            },
            tooltip:{
              callbacks:{
                label: function(ctx){
                  const v = ctx.parsed;
                  const pct = total ? (v / total * 100) : 0;
                  const label = ctx.label || '';
                  return `${label}: ${v} — ${pct.toFixed(1)}%`;
                },
                title: function(ctx){ return ctx[0] ? ctx[0].dataset.label || '' : ''; }
              }
            }
          }
        }
      });
      _modalCharts.push(ch);
    }
  });

  // responsiveness: switch to single column on small widths
  const mq = window.matchMedia('(max-width:900px)');
  function applyCols(e){
    container.style.gridTemplateColumns = e.matches ? '1fr' : 'repeat(2,1fr)';
  }
  applyCols(mq);
  mq.addEventListener('change', applyCols);

  // append grid to wrapper and return
  wrapper.appendChild(container);
  return wrapper;
}

/* Quick help modal: build human-friendly interpretation of dataset + charts */
function buildHelpContent(){
  const wrapper = document.createElement('div');
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';
  wrapper.style.gap = '10px';
  wrapper.style.maxWidth = '720px';

  const title = document.createElement('div');
  title.style.fontWeight = '700';
  title.style.fontSize = '16px';
  title.textContent = 'Interpretação rápida — Dashboard GLPI';
  wrapper.appendChild(title);

  const p1 = document.createElement('div');
  p1.style.color = 'var(--muted)';
  p1.textContent = `Linhas carregadas: ${state.raw.length} • Campos detectados: ${state.fields.length} • Linhas visíveis: ${state.filtered.length}`;
  wrapper.appendChild(p1);

  const dateField = detectDateField();
  const titleField = detectTitleField();

  const meta = document.createElement('div');
  meta.style.display = 'grid';
  meta.style.gridTemplateColumns = '1fr 1fr';
  meta.style.gap = '8px';
  meta.innerHTML = `<div><strong>Campo de data:</strong><div style="color:var(--muted);margin-top:4px">${dateField || 'não identificado'}</div></div>
                    <div><strong>Campo de título:</strong><div style="color:var(--muted);margin-top:4px">${titleField || 'não identificado'}</div></div>`;
  wrapper.appendChild(meta);

  // Build human-readable interpretations:
  // 1) Top titles and counts
  if(titleField){
    const counts = {};
    state.filtered.forEach(r=>{
      const t = (r[titleField] ?? '(sem título)').toString();
      counts[t] = (counts[t]||0) + 1;
    });
    const entries = Object.entries(counts).sort((a,b)=>b[1]-a[1]);
    const top = entries.slice(0,5);
    const block = document.createElement('div');
    block.innerHTML = `<strong>Chamados por título — Top ${top.length}</strong>`;
    const ul = document.createElement('ul');
    ul.style.margin = '8px 0 0 16px';
    top.forEach(([t,c])=>{
      const li = document.createElement('li');
      li.textContent = `${t}: ${c} chamado(s)`;
      ul.appendChild(li);
    });
    block.appendChild(ul);
    wrapper.appendChild(block);

    // Recurrence: percent of calls that belong to titles with >1 occurrence
    const repeatedCount = entries.filter(([,c])=>c>1).reduce((s,[,c])=>s+c,0);
    const recurrencePct = state.filtered.length ? ((repeatedCount / state.filtered.length) * 100).toFixed(1) : '0.0';
    const recDiv = document.createElement('div');
    recDiv.style.color = 'var(--muted)';
    recDiv.style.marginTop = '6px';
    recDiv.textContent = `Reincidência: ${repeatedCount} chamados (${recurrencePct}%) pertencem a títulos repetidos.`;
    wrapper.appendChild(recDiv);
  } else {
    const noTitle = document.createElement('div');
    noTitle.style.color = 'var(--muted)';
    noTitle.textContent = 'Não foi possível identificar um campo de título para análise por assunto.';
    wrapper.appendChild(noTitle);
  }

  // 2) If there is a numeric "tempo" field, compute average resolution/tempo per top title
  // Heuristic: reuse tempoCandidates from renderCharts to find likely tempo field
  const tempoCandidates = ['tempo','tempo_atendimento','time_to_attend','time_to_resolution','time_to_reply','sla','tempo_resposta'];
  function findTempoField(){
    for(const name of tempoCandidates){
      const found = state.fields.find(f => f.toLowerCase() === name);
      if(found) return found;
    }
    for(const name of tempoCandidates){
      const found = state.fields.find(f => f.toLowerCase().includes(name));
      if(found) return found;
    }
    return null;
  }
  const tempoField = findTempoField();

  if(tempoField && titleField){
    // compute avg tempo per top title (reuse top from above if present)
    const counts = {};
    const sums = {};
    state.filtered.forEach(r=>{
      const t = (r[titleField] ?? '(sem título)').toString();
      const n = safeNumber(r[tempoField]);
      if(n !== null){
        counts[t] = (counts[t]||0) + 1;
        sums[t] = (sums[t]||0) + n;
      }
    });
    // take top 5 by counts overall (or by numeric entries)
    const entries = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,5);
    if(entries.length){
      const block = document.createElement('div');
      block.innerHTML = `<strong>Média de ${tempoField} por título (Top ${entries.length})</strong>`;
      const ul = document.createElement('ul');
      ul.style.margin = '8px 0 0 16px';
      entries.forEach(([t,c])=>{
        const avg = sums[t] ? (sums[t] / c).toFixed(2) : '—';
        const li = document.createElement('li');
        li.textContent = `${t}: ${c} chamado(s), média ${tempoField} = ${avg}`;
        ul.appendChild(li);
      });
      block.appendChild(ul);
      wrapper.appendChild(block);
    }
  } else if(tempoField){
    const tempoNote = document.createElement('div');
    tempoNote.style.color = 'var(--muted)';
    tempoNote.textContent = `Campo numérico sugerido como tempo: ${tempoField} (não há campo de título para cruzar).`;
    wrapper.appendChild(tempoNote);
  } else {
    const tempoNote = document.createElement('div');
    tempoNote.style.color = 'var(--muted)';
    tempoNote.textContent = 'Nenhum campo de tempo/resolução detectado automaticamente.';
    wrapper.appendChild(tempoNote);
  }

  // 3) Overall averages for first few numeric fields to give context
  const numericFields = state.fields.filter(f=> state.filtered.some(r=> safeNumber(r[f]) !== null)).slice(0,4);
  const numBlock = document.createElement('div');
  numBlock.innerHTML = `<strong>Resumo rápido de campos numéricos</strong>`;
  if(numericFields.length){
    const ul = document.createElement('ul');
    ul.style.margin = '8px 0 0 16px';
    numericFields.forEach(f=>{
      const vals = state.filtered.map(r=> safeNumber(r[f])).filter(n=> n !== null);
      const sum = vals.reduce((a,b)=>a+b,0);
      const avg = vals.length ? (sum/vals.length).toFixed(2) : '—';
      const li = document.createElement('li');
      li.textContent = `${f}: média ${avg} • ${vals.length} valor(es)`;
      ul.appendChild(li);
    });
    numBlock.appendChild(ul);
  } else {
    const p = document.createElement('div'); p.style.color='var(--muted)'; p.style.marginTop='6px'; p.textContent='Nenhum campo numérico detectado.';
    numBlock.appendChild(p);
  }
  wrapper.appendChild(numBlock);

  // final quick tips
  const tips = document.createElement('div');
  tips.innerHTML = `<strong>Dicas</strong>
    <div style="color:var(--muted);margin-top:6px">
      • Use filtros e período para focar em janelas de tempo específicas.<br>
      • Selecionar um campo no filtro pode ativar análises numéricas automáticas.<br>
      • Abra "Chamados por título" para ver os registros completos dos assuntos mais frequentes.
    </div>`;
  wrapper.appendChild(tips);

  return wrapper;
}

el.filterField.addEventListener('change', ()=>{
  const f = el.filterField.value;
  if(f) {
    const vals = getFieldUniqueValues(f);
    populateFilterValues(vals);
  } else {
    el.filterValue.innerHTML = '<option value="">(Todos)</option>';
  }
  applyFilters();
});

el.filterValue.addEventListener('change', applyFilters);
el.dateFrom.addEventListener('change', applyFilters);
el.dateTo.addEventListener('change', applyFilters);
if(el.splitByTitle) el.splitByTitle.addEventListener('change', applyFilters);
el.resetBtn.addEventListener('click', ()=>{
  el.dateFrom.value = '';
  el.dateTo.value = '';
  el.filterField.value = '';
  el.filterValue.innerHTML = '<option value="">(Todos)</option>';
  if(el.splitByTitle) el.splitByTitle.checked = false;
  applyFilters();
});

// no changes here

/* open fields modal (charts per column) */
const openFieldsBtn = document.getElementById('openFieldsBtn');
if(openFieldsBtn){
  openFieldsBtn.addEventListener('click', ()=>{
    const content = buildFieldChartsContent();
    openModal(content);
  });
}

/* CSV upload handling: parse uploaded CSV and replace current dataset */
if(el.csvUpload){
  el.csvUpload.addEventListener('change', (ev)=>{
    const f = ev.target.files && ev.target.files[0];
    if(!f) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try{
        const text = String(e.target.result || '');
        const parsed = Papa.parse(text, { header:true, skipEmptyLines:true });
        if(!parsed || !parsed.data) throw new Error('Arquivo inválido');
        state.raw = parsed.data;
        state.fields = parsed.meta.fields || (state.raw[0] ? Object.keys(state.raw[0]) : []);
        // Update last update to reflect upload time and reset filters
        el.lastUpdate.textContent = new Date().toLocaleString();
        prepareFilters();
        // clear date/filter UI so user can reapply as needed
        el.dateFrom.value = '';
        el.dateTo.value = '';
        el.filterField.value = '';
        el.filterValue.innerHTML = '<option value="">(Todos)</option>';
        if(el.splitByTitle) el.splitByTitle.checked = false;
        applyFilters();
        // provide brief feedback by highlighting summary element
        if(el.summary){
          el.summary.animate([{opacity:0.6},{opacity:1}],{duration:360});
        }
      }catch(err){
        console.error('Erro ao processar CSV upload', err);
        alert('Falha ao processar o CSV. Verifique o arquivo e tente novamente.');
      }
    };
    reader.onerror = () => {
      alert('Erro lendo o arquivo CSV.');
    };
    reader.readAsText(f);
    // reset input so same file can be re-selected if needed
    ev.target.value = '';
  });
}

/* open help modal (quick summary) */
const openHelpBtn = document.getElementById('openHelpBtn');
if(openHelpBtn){
  openHelpBtn.addEventListener('click', ()=>{
    const content = buildHelpContent();
    openModal(content);
  });
}



/* --- Card click -> open modal with full info / chart snapshot --- */
function openCardModalFromPanel(panelEl){
  const title = (panelEl.querySelector('.panel-title')?.textContent) || 'Detalhes';
  const body = panelEl.querySelector('.panel-body');
  const modalWrap = document.createElement('div');
  modalWrap.style.display = 'flex';
  modalWrap.style.flexDirection = 'column';
  modalWrap.style.gap = '12px';

  const h = document.createElement('div');
  h.style.fontWeight = '700';
  h.style.fontSize = '16px';
  h.textContent = title;
  modalWrap.appendChild(h);

  // attach summary meta
  const meta = document.createElement('div');
  meta.style.fontSize = '13px';
  meta.style.color = 'var(--muted)';
  meta.textContent = `Linhas visíveis: ${state.filtered.length} • Campos: ${state.fields.length}`;
  modalWrap.appendChild(meta);

  // if the panel contains a canvas, try to render chart snapshot
  const canvas = body.querySelector('canvas');
  if(canvas){
    const img = document.createElement('img');
    img.style.maxWidth = '100%';
    img.style.border = '1px solid #eef2f7';
    img.style.borderRadius = '6px';
    img.alt = title + ' — snapshot';
    // prefer Chart.js instance to get crisp image
    try{
      // try common chart refs by matching canvas id or known charts
      let chartInstance = null;
      if(canvas.id && charts[canvas.id]) chartInstance = charts[canvas.id];
      // fallback common names in charts object
      chartInstance = chartInstance || charts.time || charts.pie || charts.bar || null;
      if(chartInstance && typeof chartInstance.toBase64Image === 'function'){
        img.src = chartInstance.toBase64Image();
      } else {
        // fallback: draw canvas directly
        img.src = canvas.toDataURL ? canvas.toDataURL() : '';
      }
    }catch(e){
      // ignore and try canvas draw fallback
      img.src = canvas.toDataURL ? canvas.toDataURL() : '';
    }
    const imgWrap = document.createElement('div');
    imgWrap.appendChild(img);
    modalWrap.appendChild(imgWrap);
  }

  // include a copy of the panel body content (cloned) so users can see full info or table snippet
  const clone = body.cloneNode(true);
  // make clone scrollable and constrained in modal
  clone.style.maxHeight = '40vh';
  clone.style.overflow = 'auto';
  clone.style.borderTop = '1px solid #f1f5f9';
  clone.style.paddingTop = '8px';
  modalWrap.appendChild(clone);

  // append detailed list of fields and a small stats section
  const stats = document.createElement('div');
  stats.style.display = 'grid';
  stats.style.gridTemplateColumns = '1fr 1fr';
  stats.style.gap = '8px';
  stats.style.marginTop = '8px';

  const fieldsBox = document.createElement('div');
  fieldsBox.style.fontSize = '13px';
  fieldsBox.innerHTML = `<strong>Campos</strong><div style="color:var(--muted);margin-top:6px">${state.fields.join(', ')}</div>`;
  stats.appendChild(fieldsBox);

  const numericSummary = document.createElement('div');
  numericSummary.style.fontSize = '13px';
  numericSummary.innerHTML = '<strong>Resumo numérico (amostra)</strong>';
  const nums = state.fields.filter(f=> state.filtered.some(r=> safeNumber(r[f]) !== null)).slice(0,4);
  if(nums.length){
    const ul = document.createElement('ul');
    ul.style.margin = '6px 0 0 14px';
    ul.style.padding = '0';
    nums.forEach(f=>{
      const values = state.filtered.map(r=> safeNumber(r[f])).filter(n=> n !== null);
      const s = values.reduce((a,b)=>a+b,0);
      const avg = values.length ? (s/values.length).toFixed(2) : '—';
      const li = document.createElement('li');
      li.textContent = `${f}: média ${avg} • ${values.length} valores`;
      ul.appendChild(li);
    });
    numericSummary.appendChild(ul);
  } else {
    const p = document.createElement('div'); p.style.color='var(--muted)'; p.style.marginTop='6px'; p.textContent='Nenhuma coluna numérica encontrada.';
    numericSummary.appendChild(p);
  }
  stats.appendChild(numericSummary);

  modalWrap.appendChild(stats);

  openModal(modalWrap);
}

/* attach click handlers to panels so users can open details */
function wirePanelClicks(){
  document.querySelectorAll('.panel.card').forEach(p=>{
    p.classList.add('clickable');
    // avoid clicks for the main table full panel being confusing; still allow it
    p.addEventListener('click', (ev)=>{
      // ignore clicks that originate from interactive controls inside (buttons, selects, inputs)
      const tag = ev.target.tagName.toLowerCase();
      if(['button','a','input','select','textarea'].includes(tag)) return;
      openCardModalFromPanel(p);
    });
    // keyboard accessibility
    p.tabIndex = 0;
    p.addEventListener('keydown', (e)=>{ if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCardModalFromPanel(p); } });
  });
}

// Init
loadCSV().then(()=>{
  // wire card click handlers after initial render
  wirePanelClicks();
}).catch(err=>{
  console.error(err);
  document.getElementById('lastUpdate').textContent = 'Erro ao carregar CSV';
  const wrap = document.createElement('div');
  wrap.style.padding='12px';
  wrap.style.color='red';
  wrap.textContent = 'Falha ao carregar /glpi.csv — ver console.';
  document.getElementById('app').appendChild(wrap);
});

