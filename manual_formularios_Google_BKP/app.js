/* Interactive manual app */
const manuals = {
  technical: {
    title: 'MANUAL TÉCNICO (TI / INFRAESTRUTURA)',
    sections: [
      {id:'t-1', title:'Finalidade', body:
`Documentar a estrutura de organização dos Formulários Google e o procedimento técnico para correção de falhas de autenticação no sistema de backup.`},
      {id:'t-2', title:'Estrutura de Formulários', body:
`Origem padrão: grupo Database.\nOs formulários podem ser realocados para outros grupos (ex.: Infraestrutura) sem impacto funcional.\nA pesquisa interna permite localizar formulários pelo nome.`},
      {id:'t-2-1', title:'Grupos permitidos', body:
`Infraestrutura\nProgramação\nGoogle\nGoogle Admin\nGrupos personalizados (nome do responsável ou do sistema)`},
      {id:'t-3', title:'Dados legados', body:
`Existem registros anteriores a 2023.\nNão devem ser alterados sem necessidade operacional.\nEm casos de equipamentos antigos ou logins herdados, as credenciais permanecem armazenadas nesses registros.`},
      {id:'t-4', title:'Backup – Diagnóstico técnico', body:
`Problema identificado:\nBackup não grava no drive H:. Erro causado por credenciais inválidas.\n\nCausa raiz:\nUsuário configurado incorretamente após troca de senha. Teste de conexão pode retornar sucesso, porém a gravação falha.\n\nCorreção:\nAtualizar autenticação com:\nUsuário: Elias.Bernardo\nSenha válida\nAlternativa: credencial administrativa (não recomendada).\n\nObservação crítica:\nTroca de senha ocorrida em 24/xx impactou diretamente o serviço de backup.`}
    ]
  },

  operational: {
    title: 'MANUAL OPERACIONAL (USO DIÁRIO)',
    sections: [
      {id:'o-1', title:'Organização dos formulários', body:
`1. Localize o formulário na lista ou pela busca.\n2. Caso necessário, mova para o grupo correto.\n3. Utilize pastas para manter o ambiente organizado.\n\nRegra: organize por assunto ou sistema para facilitar consultas futuras.`},
      {id:'o-2', title:'Pastas e grupos', body:
`É permitido criar novas pastas.\nPastas vazias podem existir e não indicam erro.\nNão apagar pastas sem confirmação.`},
      {id:'o-3', title:'Conteúdo antigo', body:
`Registros antigos não devem ser utilizados no dia a dia.\nConsulte apenas se houver equipamento ou login legado.`},
      {id:'o-4', title:'Backup – verificação básica', body:
`Verifique se o backup está salvando no local correto.\nCaso apareçam erros frequentes, informe imediatamente a TI.`}
    ]
  },

  training: {
    title: 'MANUAL DE TREINAMENTO (CAPACITAÇÃO)',
    sections: [
      {id:'tr-1', title:'O que você precisa saber', body:
`Formulários Google ficam organizados por grupos.\nA organização ajuda a localizar informações rapidamente.`},
      {id:'tr-2', title:'Exemplos práticos', body:
`Um formulário pode sair de "Database" e ir para "Infraestrutura".\nUm grupo chamado "Google Admin" pode conter apenas itens administrativos.`},
      {id:'tr-3', title:'O que NÃO fazer', body:
`Não alterar dados antigos sem orientação.\nNão mudar usuários de backup sem autorização.`},
      {id:'tr-4', title:'Atualizações futuras', body:
`Poderão ser solicitadas alterações nos formulários, especialmente:\n- Formulário McKinsey\n- Formulário de Identificação`},
      {id:'tr-5', title:'Boas práticas', body:
`Manter tudo organizado.\nComunicar erros rapidamente.\nConferir após mudanças de senha.`}
    ]
  }
};

const el = id => document.getElementById(id);
const content = el('content');
const toc = el('toc');
const viewSelect = el('viewSelect');
const searchInput = el('search');

function makeCard(section){
  const div = document.createElement('section');
  div.className = 'card';
  div.id = section.id;

  const h = document.createElement('div');
  h.className = 'section-title';
  const title = document.createElement('div');
  title.innerHTML = `<div class="h1">${section.title}</div>`;
  const btn = document.createElement('button');
  btn.className = 'toggle-btn';
  btn.textContent = 'Expandir';
  btn.onclick = () => {
    body.hidden = !body.hidden;
  };
  h.appendChild(title);
  h.appendChild(btn);

  const body = document.createElement('div');
  body.className = 'body';
  body.style.whiteSpace = 'pre-wrap';
  body.textContent = section.body;

  div.appendChild(h);
  div.appendChild(body);
  return div;
}

function renderView(key){
  const manual = manuals[key];
  document.title = manual.title + ' — Manual';
  content.innerHTML = '';
  toc.innerHTML = '';
  const headerCard = document.createElement('div');
  headerCard.className = 'card';
  headerCard.innerHTML = `<div class="h1">${manual.title}</div><div class="muted">Use o painel para navegar e pesquisar. Exportar gera diálogo de impressão (PDF).</div>`;
  content.appendChild(headerCard);

  manual.sections.forEach(s => {
    const card = makeCard(s);
    content.appendChild(card);

    const li = document.createElement('li');
    li.textContent = s.title;
    li.onclick = ()=> {
      document.getElementById(s.id).scrollIntoView({behavior:'smooth',block:'center'});
      const b = document.getElementById(s.id).querySelector('.toggle-btn');
      if (b) b.focus();
    };
    toc.appendChild(li);
  });
}

/* search */
function applySearch(term){
  term = (term||'').trim().toLowerCase();
  const cards = content.querySelectorAll('.card');
  if(!term){
    cards.forEach(c=> c.style.display='block');
    return;
  }
  cards.forEach(c=>{
    const text = c.textContent.toLowerCase();
    c.style.display = text.includes(term) ? 'block' : 'none';
  });
}

/* init */
renderView(viewSelect.value);

viewSelect.addEventListener('change', e=>{
  renderView(e.target.value);
  searchInput.value = '';
});

searchInput.addEventListener('input', e=>{
  applySearch(e.target.value);
});

/* keyboard: quick jump (1,2,3) */
window.addEventListener('keydown', (ev)=>{
  if(ev.target.tagName === 'INPUT' || ev.target.tagName === 'TEXTAREA') return;
  if(ev.key === '1') viewSelect.value = 'technical';
  if(ev.key === '2') viewSelect.value = 'operational';
  if(ev.key === '3') viewSelect.value = 'training';
  if(['1','2','3'].includes(ev.key)){
    renderView(viewSelect.value);
    searchInput.value = '';
  }
});



/* Accessibility: focus first card */
setTimeout(()=> {
  const first = content.querySelector('.card');
  if(first) first.setAttribute('tabindex','-1');
}, 300);