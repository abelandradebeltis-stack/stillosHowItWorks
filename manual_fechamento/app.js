import * as bootstrap from "bootstrap";

const sections = [
  {
    id: "intro",
    title: "PRONET - Boletos (Situação Atual)",
    html: `
      <div class="section-title mb-2"><span class="step-badge">1</span><h4 class="mb-0">Geração de boletos e códigos de pagamento</h4></div>
      <p>Responsabilidade: <strong>Pronet</strong>. Lançamento do pagamento é feito manualmente editando os dados.</p>
      <div class="note">Referência: Vídeo "gerar pagamento" (incluir link no futuro).</div>
    `
  },
  {
    id: "fechamento",
    title: "Fechamento de período",
    html: `
      <div class="section-title mb-2"><span class="step-badge">2</span><h4 class="mb-0">Regras de fechamento</h4></div>
      <p>Não realizar o fechamento antes da validação por e-mail com a Gabi. Definir canal de contato.</p>
      <h6 class="mt-3">Mackenzie (procedimento)</h6>
      <ul>
        <li>Feito manualmente — incluir fichas de identificação.</li>
        <li>Fechamento realizado no dia da solicitação e deve conter relatório.</li>
      </ul>
      <h6>Formato dos dados (Excel)</h6>
      <p>Colunas: <code>Data | E-mail | Nome | Curso</code>. Tratar dados como texto. Nunca excluir duplicados.</p>
    `
  },
  {
    id: "erros",
    title: "Erros e validações",
    html: `
      <div class="section-title mb-2"><span class="step-badge">3</span><h4 class="mb-0">Checagens automáticas</h4></div>
      <ol>
        <li>Verificar pedidos não processados para recebimento anterior ao pagamento.</li>
        <li>Verificar pedidos sem <em>TIPO VENDA, FORMA_PAGAMENTO, COD_GRUPO_VENDEDOR, COD-FECHAMENTO_PERIODO</em>.</li>
        <li>Verificar pedidos já processados para pagamentos futuros.</li>
      </ol>
      <p>Erros tratados pelo time de TI.</p>
      <div class="warning mt-2">Se ocorrer erro na ação <strong>Gerar novo fechamento (dd/mm/aaaa)</strong>, o sistema indicará o tipo de erro (ex.: "Produto não cadastrado").</div>
      <p class="mt-2">Ação: levar evidências (prints) para a Gabi. Gabi cadastra produto nas tabelas de comissionamento.</p>
    `
  },
  {
    id: "estrutura",
    title: "Estrutura visual - Produtos não cadastrados",
    html: `
      <div class="section-title mb-2"><span class="step-badge">4</span><h4 class="mb-0">Produtos sem comissão</h4></div>
      <p>O relatório deve listar produtos que não serão processados por falta de cadastro de comissão:</p>
      <div class="card p-2 mb-2">
        <table class="table table-sm mb-0">
          <thead><tr><th>Cód. Produto</th><th>Produto</th><th>Observação</th></tr></thead>
          <tbody>
            <tr><td>000000</td><td>Exemplo Produto</td><td>Não cadastrado na(s) tabela(s)</td></tr>
          </tbody>
        </table>
      </div>
      <p>Verificar em <code>#Autenticar fichas</code> se a coluna <strong>"Autorização para finalizar fechamento sem autenticar todos os pedidos"</strong> consta como <strong>"Sim"</strong>.</p>
    `
  },
  {
    id: "autorizacao",
    title: "Autorização e pedidos pendentes",
    html: `
      <div class="section-title mb-2"><span class="step-badge">5</span><h4 class="mb-0">Pedidos com fichas não conferidas</h4></div>
      <p>Campos relevantes: <strong>Pedido de Vendas | Data limite de Lançamento | Data do pagamento | Vendas que não chegaram na Diretoria | Autorização</strong>.</p>
      <div class="note">Se "Autorização" = <strong>Sim</strong> → fechamento pode ser realizado. Se "Não" → clicar em <em>Listar pedidos</em>, alterar para "Sim" e gravar.</div>
    `
  },
  {
    id: "processar",
    title: "Quando processar o pagamento",
    html: `
      <div class="section-title mb-2"><span class="step-badge">6</span><h4 class="mb-0">Processamento</h4></div>
      <div class="warning">
        <strong>Atenção:</strong> Só processe o pagamento se todos os passos foram revisados. Uma vez iniciado, não há volta.
      </div>
      <p class="mt-2">Ação: clicar em <strong>PROCESSAR PAGAMENTO PARA dd/mm/aaaa</strong>. Será aberta uma aba com <em>"AGUARDE PROCESSANDO PAGAMENTO!"</em>.</p>
      <ul>
        <li>Atualizar as demais telas constantemente para evitar expiração da sessão .asp.</li>
        <li>Nunca atualizar a aba com a mensagem "AGUARDE PROCESSANDO PAGAMENTO!" — isso causará queda da operação.</li>
      </ul>
    `
  },
  {
    id: "apos",
    title: "Após finalização",
    html: `
      <div class="section-title mb-2"><span class="step-badge">7</span><h4 class="mb-0">Pós-processamento</h4></div>
      <p>Próximo passo: abrir MySQL → Banco de dados <strong>Stillos</strong> → <code>VIEW_FOLHA_PAGAMENTO FELIPE</code>.</p>
      <p class="mt-2 text-muted">Observação: Referência em vídeo necessária para detalhar esta etapa.</p>
    `
  },
  {
    id: "checklist",
    title: "Checklist prático",
    html: `
      <div class="section-title mb-2"><span class="step-badge">C</span><h4 class="mb-0">Checklist (Sequência de verificação)</h4></div>
      <p class="mb-1 small-muted">Lista prática e sequencial do que verificar antes de processar — apenas leitura.</p>
      <div class="illustrative-card">
        <ol class="mb-2">
          <li>Confirmar que todos os pagamentos anteriores foram processados e conciliados.</li>
          <li>Verificar que não existam pedidos com campos obrigatórios faltantes (TIPO VENDA, FORMA_PAGAMENTO, COD_GRUPO, etc.).</li>
          <li>Certificar-se de que a autorização para finalizar está marcada como "Sim" para o fechamento atual.</li>
          <li>Garantir que backups e prints das telas críticas foram salvos em repositório interno antes de iniciar o processamento.</li>
        </ol>

        <div class="mt-3">
          <div class="alert alert-info py-2 mb-0">Siga a sequência acima; este documento apenas orienta a ordem de checagem — ações reais devem ser feitas no sistema operacional.</div>
        </div>
      </div>
    `
  },
  {
    id: "evidencias",
    title: "Evidências e comunicação",
    html: `
      <div class="section-title mb-2"><span class="step-badge">E</span><h4 class="mb-0">Evidências e fluxo de comunicação</h4></div>
      <p class="mb-1 small-muted">Fluxo recomendado para coletar evidências e comunicar problemas — apenas orientativo.</p>
      <div class="illustrative-card">
        <ol class="mb-2">
          <li>Capture prints com horário, usuário e operação nas telas relevantes.</li>
          <li>Registre passos realizados e mensagens de erro em um breve resumo (data/hora, usuário, ação).</li>
          <li>Organize backups e prints em pasta interna com nome padrão (ex.: FECHAMENTO_ddmmyyyy_usuario).</li>
          <li>Enviar um e-mail à Gabi com assunto padrão e anexos: prints + resumo curto; incluir referência do fechamento (dd/mm/aaaa).</li>
        </ol>

        <div class="mt-2 small-muted">Exemplo de mensagem: "Erro ao processar pagamento — produto X não cadastrado. Prints anexos. Horário: 10:23. Usuário: fulano."</div>
      </div>
    `
  }
];

const content = document.getElementById('content');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const printBtn = document.getElementById('printBtn');

let idx = 0;

function buildTOC(){
  // Build accordion menu with groups and subitems for better visualization
  const menu = document.getElementById('menu');
  menu.innerHTML = ''; // clear

  // create an "Índice" header pane for quick access
  const header = document.createElement('div');
  header.className = 'accordion-item';
  header.innerHTML = `
    <h2 class="accordion-header" id="headingIndex">
      <button class="accordion-button ${window.innerWidth>=768 ? '' : 'collapsed'}" type="button" data-bs-toggle="collapse" data-bs-target="#collapseIndex" aria-expanded="${window.innerWidth>=768}" aria-controls="collapseIndex">
        Índice do Manual
      </button>
    </h2>
    <div id="collapseIndex" class="accordion-collapse collapse ${window.innerWidth>=768 ? 'show' : ''}" aria-labelledby="headingIndex" data-bs-parent="#menu">
      <div class="accordion-body p-2">
        <div class="list-group list-group-flush" id="menuList"></div>
      </div>
    </div>`;
  menu.appendChild(header);

  const list = header.querySelector('#menuList');

  // Populate the main Índice with all sections (explicit, in order)
  sections.forEach((s, i) => {
    const btn = document.createElement('button');
    btn.className = 'btn btn-sm btn-link text-start w-100 menu-link';
    btn.dataset.idx = String(i);
    btn.textContent = `${i+1}. ${s.title}`;
    const wrap = document.createElement('div');
    wrap.className = 'mb-1';
    wrap.appendChild(btn);
    list.appendChild(wrap);
  });

  // group sections into logical groups with subitems for visual grouping (keeps the grouped accordion below the Índice)
  const groups = [
    { title: 'Operação Financeira', items: ['PRONET - Boletos (Situação Atual)', 'Fechamento de período', 'Erros e validações'] },
    { title: 'Relatórios e Estrutura', items: ['Estrutura visual - Produtos não cadastrados', 'Autorização e pedidos pendentes'] },
    { title: 'Processamento', items: ['Quando processar o pagamento', 'Após finalização', 'Checklist prático', 'Evidências e comunicação'] }
  ];

  groups.forEach((g, gi)=>{
    const id = `group${gi}`;
    const item = document.createElement('div');
    item.className = 'accordion-item';
    item.innerHTML = `
      <h2 class="accordion-header" id="heading-${id}">
        <button class="accordion-button collapsed small" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${id}" aria-expanded="false" aria-controls="collapse-${id}">
          ${g.title}
        </button>
      </h2>
      <div id="collapse-${id}" class="accordion-collapse collapse" aria-labelledby="heading-${id}" data-bs-parent="#menu">
        <div class="accordion-body p-2">
          <ul class="list-unstyled mb-0" id="list-${id}"></ul>
        </div>
      </div>`;
    menu.appendChild(item);

    const ul = item.querySelector(`#list-${id}`);
    g.items.forEach(title=>{
      // find matching section index by title
      const si = sections.findIndex(s=>s.title === title || s.title === title.trim());
      const li = document.createElement('li');
      li.innerHTML = `<button class="btn btn-sm btn-link text-start w-100 menu-link" data-idx="${si}">${title}</button>`;
      ul.appendChild(li);
    });
  });

  // attach click handlers to all menu-link buttons
  menu.querySelectorAll('.menu-link').forEach(b=>{
    b.addEventListener('click', (e)=>{
      const i = Number(e.currentTarget.dataset.idx);
      if(!Number.isNaN(i)) {
        // If the click came from the Índice (top list) we prefer a smooth scroll to the content
        const inIndex = e.currentTarget.closest('#collapseIndex') !== null;
        goTo(i, { smoothScroll: !!inIndex });
      }
      // collapse menu on small screens to maximize content space
      const bsCollapse = bootstrap.Collapse.getOrCreateInstance(document.querySelector('#collapseIndex'));
      if(window.innerWidth < 768) bsCollapse.hide();
    });
  });
}

function render(){
  const s = sections[idx];
  content.innerHTML = s.html;
  content.querySelectorAll('.step-badge').forEach(el=>el.textContent = (idx+1));
  updateNav();
  bindInteractions();
}

function updateNav(){
  prevBtn.disabled = idx===0;
  nextBtn.disabled = idx===sections.length-1;
}

function goTo(i, opts = {}){
  idx = i;
  render();
  // smooth scroll into view for Índice-driven navigation (opts.smoothScroll)
  if(opts.smoothScroll){
    // small timeout so the new content is rendered before scrolling
    setTimeout(()=>{
      if(content && typeof content.scrollIntoView === 'function'){
        content.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  }
}

prevBtn.addEventListener('click',()=>{ if(idx>0) goTo(idx-1);});
nextBtn.addEventListener('click',()=>{ if(idx<sections.length-1) goTo(idx+1);});
printBtn.addEventListener('click', ()=> { printFlowSummary(); });

function stripHtml(html){
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

function generateSummaryHtml(){
  // concise summary: title + first meaningful sentence/line of each section
  return sections.map((s, i) => {
    const text = stripHtml(s.html).replace(/\s+/g,' ').trim();
    // take up to first 220 chars or first sentence
    const firstSentenceMatch = text.match(/^(.*?[.?!])\s/);
    const excerpt = (firstSentenceMatch && firstSentenceMatch[1].length > 20) ? firstSentenceMatch[1] : (text.slice(0,220) + (text.length>220 ? '…' : ''));
    return `<div class="print-item"><h3 class="print-title">${i+1}. ${s.title}</h3><p class="print-excerpt">${excerpt}</p></div>`;
  }).join('\n');
}

function printFlowSummary(){
  // remove any existing printSummary container
  const existing = document.getElementById('printSummary');
  if(existing) existing.remove();

  const container = document.createElement('div');
  container.id = 'printSummary';
  container.setAttribute('aria-hidden','false');
  const now = new Date();
  container.innerHTML = `
    <header class="print-header">
      <div class="print-brand">
        <img src="/stillos-logo.png" alt="STILLOS" width="56" height="56">
      </div>
      <div class="print-meta">
        <h1>Resumo do Fluxo — Procedimento</h1>
        <div class="print-sub">Gerado em ${now.toLocaleString()}</div>
      </div>
    </header>
    <main class="print-body">
      ${generateSummaryHtml()}
    </main>
    <footer class="print-foot">Documento: Resumo de fluxo — Impressão compacta</footer>
  `;
  document.body.appendChild(container);

  // give browser a moment to render the injected content before printing
  setTimeout(()=>{
    window.print();
    // clean up after a small delay (some browsers keep reference during print)
    setTimeout(()=>{ const el = document.getElementById('printSummary'); if(el) el.remove(); }, 600);
  }, 120);
}

function bindInteractions(){
  const simulateBtn = document.getElementById('simulateBtn');
  if(simulateBtn){
    simulateBtn.onclick = ()=>{
      const checks = [...document.querySelectorAll('#checklistForm .form-check-input')];
      const all = checks.every(c=>c.checked);
      const result = document.getElementById('simulateResult');
      result.innerHTML = all
        ? `<div class="alert alert-success py-2">Todas as checagens ok. Simulação de processamento iniciada (apenas simulação).</div>`
        : `<div class="alert alert-danger py-2">Checklist incompleto. Revise os itens antes de processar.</div>`;
    };
    const reset = document.getElementById('resetChecklist');
    reset.onclick = ()=>{ document.querySelectorAll('#checklistForm .form-check-input').forEach(c=>c.checked=false); document.getElementById('simulateResult').innerHTML=''; }
  }

  const upload = document.getElementById('upload');
  if(upload){
    const list = document.getElementById('uploadsList');
    upload.onchange = (e)=>{
      const files = Array.from(e.target.files);
      list.innerHTML = files.map(f=>`• ${f.name} (${Math.round(f.size/1024)} KB)`).join('<br>');
    };
  }
}

// initialize
buildTOC();
render();

// small accessibility: keyboard shortcuts (N/P)
document.addEventListener('keydown', (e)=>{
  if(e.key.toLowerCase()==='n') nextBtn.click();
  if(e.key.toLowerCase()==='p') prevBtn.click();
});