// Conteúdo das etapas derivado da transcrição.
// Mantemos cada passo curto e com ações interativas (copiar texto, marcar concluído, abrir link simulado).

const STEPS = [
  {
    id: 'abrir-drive',
    title: 'Abrir Google Drive → Meu Drive / base-de-dados / tabela de preço',
    details: 'Acesse o Drive, vá para Meu Drive → base-de-dados → tabela de preço. Localize a planilha que contém a tabela de preço.',
    actions: [
      { type: 'copy', label: 'Copiar caminho', value: 'Meu Drive / base-de-dados / tabela de preço' },
      { type: 'note', label: 'Abrir planilha' }
    ]
  },
  {
    id: 'copiar-tabela',
    title: 'Copiar nova tabela e colar na planilha',
    details: 'Copie os valores que chegaram por e-mail (novas tabelas) e cole na primeira coluna conforme rotina (usar colar especial se necessário).',
    actions: [{ type: 'note', label: 'Colar valores' }]
  },
  {
    id: 'locker-studio',
    title: 'Abrir Locker Studio e atualizar fonte/tabela',
    details: 'No Locker Studio (BI do Google) abra o relatório de tabela de preço e escolha \"Atualizar dados\". Em seguida confira filtros por contrato e meses exibidos.',
    actions: [{ type: 'open', label: 'Abrir Locker Studio', value: 'https://datastudio.google.com/' }]
  },
  {
    id: 'verificar-contrato',
    title: 'Pesquisar contrato (ex: 4188) e conferir valores mensais',
    details: 'Pesquise o contrato (ex.: 4188), verifique os valores mês a mês (mês atual e anterior) e compare com a planilha.',
    actions: [{ type: 'copy', label: 'Copiar contrato (4188)', value: '4188' }]
  },
  {
    id: 'preparar-carga-pronet',
    title: 'Preparar carga para a Pronet (Salvar como mês correto)',
    details: 'No sistema de carga salve a carga com o mês correto (ex.: novembro) e gere o arquivo/execução para envio à Pronet. Marque contratos bloqueados para não enviar.',
    actions: [{ type: 'note', label: 'Salvar carga (ex.: novembro)' }]
  },
  {
    id: 'executar-programa',
    title: 'Rodar o programa de atualização (atualiza 3 tabelas: Tab preço, entidade, atualizar)',
    details: 'Execute o programa ETL/atualizador que insere/atualiza as três tabelas necessárias. Confirme inserts e verifique mensagens de erro de logon/permissão.',
    actions: [{ type: 'note', label: 'Executar atualizador' }]
  },
  {
    id: 'enviar-pronet',
    title: 'Enviar para Giovanni (Pronet) e avisar Roseli',
    details: 'Enviar os arquivos para o Giovanni da Pronet para processamento (normalmente processa no dia seguinte). Notificar Roseli: \"As tabelas já foram enviadas para o Giovanni da Pronet que irá processar amanhã. Para os vendedores já está atualizado.\"',
    actions: [{ type: 'copy', label: 'Copiar texto de aviso', value: 'As tabelas já foram enviadas para o Giovanni da Pronet que irá processar amanhã. Para os vendedores já está atualizado.' }]
  },
  {
    id: 'verificacao-final',
    title: 'Verificação pós-processamento',
    details: 'No dia seguinte, confira se a Pronet processou corretamente. Verifique alguns contratos de amostra (ex.: 4206, 4416) e confirme valores e número de parcelas.',
    actions: [{ type: 'note', label: 'Verificar contratos amostra' }]
  }
];

const stepsEl = document.getElementById('steps');
const progressEl = document.getElementById('progress');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const resetBtn = document.getElementById('resetBtn');
const printBtn = document.getElementById('printBtn');

let current = 0;
let state = {}; // armazenar concluído

function renderSteps() {
  stepsEl.innerHTML = '';
  STEPS.forEach((s, i) => {
    const done = !!state[s.id];
    const expanded = i === current ? 'expanded' : '';
    const item = document.createElement('div');
    item.className = `list-group-item step-card ${expanded} mb-2`;
    item.innerHTML = `
      <div class="d-flex w-100 justify-content-between align-items-start">
        <div>
          <div class="fw-semibold">${i+1}. ${escapeHtml(s.title)}</div>
          <div class="step-meta">${done ? '<span class="badge badge-very">Concluído</span>' : '<span class="text-muted">Pendente</span>'}</div>
        </div>
        <div class="text-end">
          <div class="small text-muted">${i === current ? 'Ativa' : ''}</div>
          <button class="btn btn-sm btn-outline-success mark-btn" data-id="${s.id}" title="Marcar concluído">OK</button>
        </div>
      </div>
      <div class="mt-2 details ${i===current ? '' : 'd-none'}">
        <p class="mb-2 small">${escapeHtml(s.details)}</p>
        <div class="step-actions d-flex gap-2 flex-wrap"></div>
      </div>
    `;
    // ações
    const actionsContainer = item.querySelector('.step-actions');
    s.actions.forEach(a => {
      const btn = document.createElement('button');
      btn.className = 'btn btn-sm btn-outline-primary';
      btn.textContent = a.label;
      if (a.type === 'copy') {
        btn.addEventListener('click', () => {
          navigator.clipboard.writeText(a.value || '').then(()=> flash('Copiado para área de transferência'));
        });
      } else if (a.type === 'open') {
        btn.addEventListener('click', () => { window.open(a.value,'_blank'); });
      } else {
        btn.addEventListener('click', () => { flash('Ação registrada: '+a.label); });
      }
      actionsContainer.appendChild(btn);
    });

    // expandir ao tocar no cartão
    item.addEventListener('click', (e) => {
      // evitar toggle ao clicar no botão OK
      if (e.target.closest('.mark-btn') || e.target.tagName === 'BUTTON') return;
      current = i;
      renderSteps();
      updateProgress();
      scrollIntoViewIfNeeded(item);
    });

    // botão marcar concluído
    item.querySelector('.mark-btn').addEventListener('click', (ev) => {
      ev.stopPropagation();
      state[s.id] = !state[s.id];
      renderSteps();
      updateProgress();
    });

    stepsEl.appendChild(item);
  });
  updateProgress();
}

function updateProgress(){
  const total = STEPS.length;
  const done = Object.values(state).filter(Boolean).length;
  progressEl.textContent = `${done} / ${total}`;
}

function prev(){
  if (current>0) current--;
  renderSteps();
  focusCurrent();
}
function next(){
  if (current < STEPS.length-1) current++;
  renderSteps();
  focusCurrent();
}
function focusCurrent(){
  const el = stepsEl.children[current];
  if (el) scrollIntoViewIfNeeded(el);
}
function reset(){
  state = {};
  current = 0;
  renderSteps();
}
function flash(msg){
  const t = document.createElement('div');
  t.className = 'toast align-items-center text-bg-dark border-0 show';
  t.style.position = 'fixed'; t.style.right = '14px'; t.style.bottom = '14px';
  t.innerHTML = `<div class="d-flex"><div class="toast-body small">${escapeHtml(msg)}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>`;
  document.body.appendChild(t);
  setTimeout(()=> t.classList.remove('show'),1800);
  setTimeout(()=> t.remove(),2200);
}
function escapeHtml(s){ return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }
function scrollIntoViewIfNeeded(el){
  el.scrollIntoView({behavior:'smooth', block:'center'});
}

prevBtn.addEventListener('click', prev);
nextBtn.addEventListener('click', next);
resetBtn.addEventListener('click', reset);
printBtn.addEventListener('click', ()=> window.print());

// inicializar
renderSteps();
updateProgress();
focusCurrent();