/* Interactive manual logic (no external libs required) */
const steps = [
 
  { title: "Quando utilizar", content: "<ul><li>Pronet baixa incorretamente</li><li>Solicitação de cancelamento/exclusão</li><li>Reverter Quitado → Pendente</li></ul><p class='note'><strong>Atenção:</strong> Impacta o caixa financeiro.</p>" },
  { title: "Premissas Importantes", content: "<ul><li>Usar ambiente <strong>Estilos</strong></li><li>Permissão na carteira correta</li><li>Parcelas pendentes não permitem exclusão</li><li>Reverter alterações temporárias no período financeiro</li></ul>" },
  { title: "Acesso ao Sistema PRONET", content: "<ol><li>Acesse PRONET e faça login</li><li>Selecione <strong>Estilos</strong> na tela de conexão e clique <strong>Conectar</strong></li></ol><p class='note'>Nunca utilizar <strong>Estilos Públicos</strong>.</p>" },
  { title: "Localizando o Cliente e as Parcelas", content: "<ol><li>Financeiro → Manutenção de Contas a Receber</li><li>Clique na lupa ao lado de <em>Nome do Cliente</em></li><li>Cole o nome do formando e pesquise</li></ol><p>O sistema exibirá parcelas Quitadas e Pendentes.</p>" },
  { title: "Verificação de Permissão da Carteira", content: "<ol><li>Selecione parcela quitada → botão direito → Visualizar recebimento associado</li></ol><p>Se a carteira aparecer: ✅ você possui permissão. Caso contrário: ❌ liberar acesso.</p>" },
  { title: "Liberar permissão de carteira", content: "<ol><li>Configurações → Usuário → Aba Financeiro</li><li>Marque a carteira correta e Salvar</li></ol><p class='small text-muted'>Carteiras com mesmo nome podem ter números diferentes — confirme.</p>" },
  { title: "Exclusão da Parcela Quitada", content: "<ol><li>Manutenção de Contas a Receber</li><li>Selecione parcela Quitada</li><li>Clique em <strong>Excluir</strong> e confirme</li></ol>" },
  { title: "Alterar Parcela de Quitado para Pendente", content: "<ol><li>Localize parcela excluída</li><li>Duplo clique → Editar</li><li>Alterar status Quitado → Pendente</li><li>Apagar Data da Baixa e Salvar</li></ol><p class='text-success'>✅ Parcela agora Pendente</p>" },
  { title: "Ajuste do Período Financeiro (quando necessário)", content: "<p>Se sistema bloquear exclusão por data de movimentação diferente:</p><ol><li>Financeiro → Configurações / Carteiras → Editar</li><li>Ajuste data inicial / final para incluir a data de movimentação</li><li>Atualizar Carteira → Salvar</li></ol>" },
  { title: "Retornar o Período Financeiro ao Padrão (obrigatório)", content: "<ol><li>Volte à Carteiras → Editar</li><li>Restaure data inicial e final para valores originais</li><li>Atualizar Carteira → Salvar</li></ol><p class='note'><strong>Nunca finalize sem restaurar o período financeiro original.</strong></p>" },
  { title: "Conferência Final", content: "<ul><li>Parcela está Pendente</li><li>Data da baixa vazia</li><li>Período financeiro voltou ao padrão</li><li>Sem divergência no caixa</li></ul>" },
  { title: "Resultado Esperado e Boas Práticas", content: "<p>Parcela volta a Pendente; Pronet pode lançar novamente; sem impacto negativo no caixa.</p><ul><li>Conferir antes de salvar</li><li>Não fechar sem revisar datas</li><li>Em dúvida, não prosseguir sem confirmação</li></ul><p class='small text-muted'>Manual elaborado a partir de transcrição operacional – PRONET</p>" }
];

const checklistItems = [
  { id: "c1", text: "Usar ambiente Estilos (não Públicos)", required: true },
  { id: "c2", text: "Verificar permissão na carteira correta", required: true },
  { id: "c3", text: "Confirmar parcela selecionada é Quitada", required: true },
  { id: "c4", text: "Excluir parcela e confirmar", required: false },
  { id: "c5", text: "Alterar status para Pendente e remover Data da Baixa", required: true },
  { id: "c6", text: "Ajustar período financeiro se necessário", required: false },
  { id: "c7", text: "Restaurar período financeiro ao padrão (OBRIGATÓRIO)", required: true },
  { id: "c8", text: "Conferência final e validar caixa", required: true }
];

let currentIndex = 0;

const stepsContainer = document.getElementById('stepsContainer');
const checklistEl = document.getElementById('checklist');
const stepBadge = document.getElementById('stepBadge');
const prevBtn = document.getElementById('prevStep');
const nextBtn = document.getElementById('nextStep');
const searchInput = document.getElementById('searchInput');
const focusChecklist = document.getElementById('focusChecklist');
const restoreBtn = document.getElementById('restorePeriodBtn');
const completeBtn = document.getElementById('completeBtn');
const statusMsg = document.getElementById('statusMsg');


function renderSteps(filter = "") {
  stepsContainer.innerHTML = "";
  steps.forEach((s, i) => {
    if (filter && !(s.title + " " + stripHtml(s.content)).toLowerCase().includes(filter.toLowerCase())) return;
    const id = `step${i}`;
    const expanded = i === currentIndex ? "true" : "false";
    const showClass = i === currentIndex ? "show" : "";
    const card = document.createElement('div');
    card.className = "accordion-item";
    card.innerHTML = `
      <h2 class="accordion-header" id="heading${id}">
        <button class="accordion-button ${i===currentIndex?'':'collapsed'}" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${id}" aria-expanded="${expanded}" aria-controls="collapse${id}">
          <span class="step-bullet">${i+1}</span><span class="step-title">${s.title}</span>
        </button>
      </h2>
      <div id="collapse${id}" class="accordion-collapse collapse ${showClass}" aria-labelledby="heading${id}" data-bs-parent="#stepsContainer">
        <div class="accordion-body step-content">${s.content}
          <div class="mt-3 d-flex gap-2">
            <button class="btn btn-sm btn-outline-primary prev-step">Anterior</button>
            <button class="btn btn-sm btn-primary next-step">Próximo</button>
            <button class="btn btn-sm btn-outline-danger mark-done ms-auto">Marcar checklist</button>
          </div>
        </div>
      </div>
    `;
    stepsContainer.appendChild(card);
  });

  // attach inner controls
  document.querySelectorAll('.next-step').forEach(b => b.addEventListener('click', () => goTo(currentIndex+1)));
  document.querySelectorAll('.prev-step').forEach(b => b.addEventListener('click', () => goTo(currentIndex-1)));
  document.querySelectorAll('.mark-done').forEach((b,i) => b.addEventListener('click', () => {
    // mark a matching checklist item if exists
    const idx = Math.min(i, checklistItems.length-1);
    const cb = document.getElementById(checklistItems[idx].id);
    if(cb){ cb.checked = true; updateStatus(); }
  }));
}

function renderChecklist(){
  checklistEl.innerHTML = "";
  checklistItems.forEach(it => {
    const li = document.createElement('label');
    li.className = "list-group-item d-flex align-items-start gap-2";
    li.innerHTML = `
      <input class="form-check-input mt-1" type="checkbox" id="${it.id}">
      <div class="ms-2">
        <div>${it.text} ${it.required?'<span class="required">•</span>':''}</div>
      </div>
    `;
    checklistEl.appendChild(li);
  });

  // listeners
  checklistItems.forEach(it => {
    const el = document.getElementById(it.id);
    el.addEventListener('change', updateStatus);
  });
  updateStatus();
}

function updateStatus(){
  const done = checklistItems.filter(it => document.getElementById(it.id).checked);
  const requiredLeft = checklistItems.filter(it => it.required && !document.getElementById(it.id).checked).length;
  statusMsg.textContent = `${done.length}/${checklistItems.length} itens marcados. ${requiredLeft>0? requiredLeft + ' item(s) obrigatórios pendentes.':''}`;
  // change tip color if required pending
  document.getElementById('tipText').style.color = requiredLeft? '#b02a37' : '#198754';
}

function goTo(i){
  if(i<0) i=0;
  if(i>steps.length-1) i=steps.length-1;
  currentIndex = i;
  stepBadge.textContent = `Passo ${currentIndex+1} / ${steps.length}`;
  renderSteps(searchInput.value.trim());
  // scroll active into view
  const btn = document.querySelectorAll('.accordion-button')[currentIndex];
  if(btn) btn.scrollIntoView({behavior:'smooth', block:'center'});
}

function stripHtml(html){
  return html.replace(/<[^>]*>?/gm, '');
}

// Buttons
prevBtn.addEventListener('click', () => goTo(currentIndex-1));
nextBtn.addEventListener('click', () => goTo(currentIndex+1));

searchInput.addEventListener('input', (e) => {
  renderSteps(e.target.value.trim());
});

focusChecklist.addEventListener('change', (e) => {
  const side = document.getElementById('sideCol');
  const stepsCol = document.getElementById('stepsCol');
  if (e.target.checked) {
    side.classList.remove('d-none');
    // restore original width classes/styles
    stepsCol.style.width = '66%';
  } else {
    side.classList.add('d-none');
    // expand steps column to fill space
    stepsCol.style.width = '100%';
  }
});

restoreBtn.addEventListener('click', () => {
  showConfirm("Restaurar período financeiro ao padrão? Isso é obrigatório após alterações.", () => {
    // simulated action
    checklistItems.forEach(it => {
      if(it.id === 'c7') document.getElementById(it.id).checked = true;
    });
    updateStatus();
    showToast("Período financeiro restaurado (simulação).");
  });
});

completeBtn.addEventListener('click', () => {
  const requiredLeft = checklistItems.filter(it => it.required && !document.getElementById(it.id).checked).length;
  if(requiredLeft){
    showConfirm(`Existem ${requiredLeft} itens obrigatórios pendentes. Deseja continuar mesmo assim?`, () => {
      showToast("Procedimento concluído (simulação). Reveja o caixa.");
    });
  } else {
    showConfirm("Todos os itens obrigatórios marcados. Confirmar conclusão?", () => {
      showToast("Procedimento concluído com sucesso (simulação).");
    });
  }
});



// Small modal helpers
function showConfirm(text, onOk){
  const confirmText = document.getElementById('confirmText');
  confirmText.innerHTML = text;
  const modalEl = document.getElementById('confirmModal');
  const bs = new bootstrap.Modal(modalEl);
  document.getElementById('confirmOk').onclick = () => {
    bs.hide();
    onOk && onOk();
  };
  bs.show();
}

function showToast(msg){
  // lightweight status update
  statusMsg.textContent = msg;
  setTimeout(updateStatus, 2200);
}

// Initialize
renderChecklist();
goTo(0);