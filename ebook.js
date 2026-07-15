const PAGES = [
  { id: 'page-0', titlePT: 'Capa', titleEN: 'Cover', descPT: 'Início', descEN: 'Start' },
  { id: 'page-1', titlePT: 'Índice', titleEN: 'Index', descPT: 'Conteúdo do guia', descEN: 'Guide contents' },
  { id: 'page-2', titlePT: 'Introdução', titleEN: 'Introduction', descPT: 'O Que É o Terminal', descEN: 'What Is the Terminal' },
  { id: 'page-3', titlePT: 'Capítulo 1 · Bloco 1', titleEN: 'Chapter 1 · Block 1', descPT: 'Descobrir Onde Estás (5 cmd)', descEN: 'Discover Where You Are (5 cmd)' },
  { id: 'page-4', titlePT: 'Capítulo 1 · Bloco 2', titleEN: 'Chapter 1 · Block 2', descPT: 'Listar e Ver Conteúdo (12 cmd)', descEN: 'List and View Content (12 cmd)' },
  { id: 'page-5', titlePT: 'Capítulo 1 · Bloco 3', titleEN: 'Chapter 1 · Block 3', descPT: 'Navegar Estrategicamente (10 cmd)', descEN: 'Navigate Strategically (10 cmd)' },
  { id: 'page-6', titlePT: 'Capítulo 1 · Bloco 4', titleEN: 'Chapter 1 · Block 4', descPT: 'Encontrar e Buscar (12 cmd)', descEN: 'Find and Search (12 cmd)' },
  { id: 'page-7', titlePT: 'Capítulo 1 · Blocos 5 & 6', titleEN: 'Chapter 1 · Blocks 5 & 6', descPT: 'Estrutura, Metadados e Combinações', descEN: 'Structure, Metadata and Combinations' },
  { id: 'page-8', titlePT: 'Conclusão', titleEN: 'Conclusion', descPT: 'Fim do Capítulo 1 & Próximos Passos', descEN: 'End of Chapter 1 & Next Steps' },
  { id: 'page-9', titlePT: 'Sobre o Autor', titleEN: 'About the Author', descPT: 'Leonardo Sebastião', descEN: 'Leonardo Sebastião' },
];

let currentPage = 0;
let lang = 'pt';
let darkMode = true;

/*Persistência local (localStorage)
Guarda em que página, idioma e tema o leitor ficou, para que ao fechar e reabrir o ficheiro localmente ele volte exactamente onde parou. Envolvido em try/catch porque localStorage pode estar bloqueado no modo privado, restrições do navegador, etc e isso NUNCA deve impedir o resto do ebook de funcionar.*/

const STORAGE_KEY = 'terminal-guide-state';

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ page: currentPage, lang, darkMode }));
  } catch (err) {

/*Armazenamento indisponível — o ebook continua a funcionar normalmente, só não vai lembrar o estado na próxima visita.*/
    
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (typeof data !== 'object' || data === null) return null;
    return data;
  } catch (err) {
    return null;
  }
}

/*Deep-linking por página (#page-N)
Permite partilhar um link directo para uma página específica, (ex: ebook.html#page-4) e mantém a URL sincronizada com a página actual.*/

function pageFromHash() {
  const m = location.hash.match(/^#page-(\d+)$/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return (n >= 0 && n < PAGES.length) ? n : null;
}

function syncHash() {
  const target = '#page-' + currentPage;
  if (location.hash !== target) {
    history.replaceState(null, '', target);
  }
}

function setLang(l) {
  lang = l;
  document.documentElement.lang = l;
  document.getElementById('btnPT').classList.toggle('active', l === 'pt');
  document.getElementById('btnEN').classList.toggle('active', l === 'en');
  document.querySelectorAll('.t[data-pt]').forEach(el => {
    el.textContent = el.getAttribute('data-' + l);
  });
  render();
  saveState();
}

function toggleTheme() {
  darkMode = !darkMode;
  document.body.classList.toggle('light', !darkMode);
  document.getElementById('themeIcon').textContent = darkMode ? '🌙' : '☀️';
  saveState();
}

function buildTOC() {
  // Sidebar
  const tocList = document.getElementById('tocList');
  tocList.innerHTML = PAGES.map((p, i) => `
    <div class="toc-item ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i}); toggleSidebar()">
      <span class="toc-num">${String(i).padStart(2,'0')}</span>
      <span>${lang === 'pt' ? p.titlePT : p.titleEN}</span>
    </div>
  `).join('');

  // Main TOC page
  const mainToc = document.getElementById('mainToc');
  if (mainToc) {
    mainToc.innerHTML = PAGES.slice(2).map((p, i) => `
      <div class="toc-card" onclick="goToPage(${i+2})">
        <div class="toc-card-num">${String(i+2).padStart(2,'0')}</div>
        <div>
          <div class="toc-card-title">${lang === 'pt' ? p.titlePT : p.titleEN}</div>
          <div class="toc-card-desc">${lang === 'pt' ? p.descPT : p.descEN}</div>
        </div>
        <div class="toc-card-arrow">›</div>
      </div>
    `).join('');
  }
}

function updateNav() {
  const total = PAGES.length;
  const prev = document.getElementById('btnPrev');
  const next = document.getElementById('btnNext');
  const info = document.getElementById('pageInfo');
  const fill = document.getElementById('progressFill');

  prev.disabled = currentPage === 0;
  next.disabled = currentPage === total - 1;

  const p = PAGES[currentPage];
  info.innerHTML = `<strong>${lang === 'pt' ? p.titlePT : p.titleEN}</strong><br>${currentPage + 1} / ${total}`;
  fill.style.width = `${((currentPage) / (total - 1)) * 100}%`;

  // hide nav on cover
  document.getElementById('pageNav').style.display = currentPage === 0 ? 'none' : 'flex';
}

/*Reconstrói o TOC e a barra de navegação numa única passada, evita as chamadas duplicadas a buildTOC()/updateNav() que existiam antes.*/

function render() {
  buildTOC();
  updateNav();
}

function goToPage(n) {
  if (n < 0 || n >= PAGES.length) return;
  document.getElementById(PAGES[currentPage].id).classList.remove('active');
  currentPage = n;
  const el = document.getElementById(PAGES[currentPage].id);
  el.classList.add('active');
  if (el.scrollIntoView) window.scrollTo(0, 0);
  render();
  saveState();
  syncHash();
}

function goToNext() { goToPage(currentPage + 1); }
function goToPrev() { goToPage(currentPage - 1); }

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebarOverlay').classList.toggle('open');
}

// Keyboard
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight') goToNext();
  if (e.key === 'ArrowLeft') goToPrev();
});

/*Reage a mudanças de hash feitas fora do goToPage (edição manual da URL, clique num link #page-N vindo de fora, navegação back/forward do browser)*/

window.addEventListener('hashchange', () => {
  const n = pageFromHash();
  if (n !== null && n !== currentPage) goToPage(n);
});

/*Init — restaura página, idioma e tema salvos localmente (se existirem).
Um #page-N na URL tem prioridade sobre o estado salvo, porque é um sinal explícito de que alguém partilhou um link para essa página.*/

(function init() {
  const saved = loadState();
  const hashPage = pageFromHash();

  if (hashPage !== null) {
    document.getElementById(PAGES[currentPage].id).classList.remove('active');
    currentPage = hashPage;
    document.getElementById(PAGES[currentPage].id).classList.add('active');
  } else if (saved && typeof saved.page === 'number' && saved.page >= 0 && saved.page < PAGES.length) {
    document.getElementById(PAGES[currentPage].id).classList.remove('active');
    currentPage = saved.page;
    document.getElementById(PAGES[currentPage].id).classList.add('active');
  }

  if (saved && (saved.lang === 'pt' || saved.lang === 'en')) {
    lang = saved.lang;
  }

  if (saved && typeof saved.darkMode === 'boolean') {
    darkMode = saved.darkMode;
    document.body.classList.toggle('light', !darkMode);
    document.getElementById('themeIcon').textContent = darkMode ? '🌙' : '☀️';
  }

// setLang aplica as traduções do idioma restaurado e já chama render() + saveState() internamente.
  
  setLang(lang);
  syncHash();
})();