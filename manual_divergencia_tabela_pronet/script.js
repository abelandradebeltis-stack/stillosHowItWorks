(() => {
  const toc = document.getElementById('tocList');
  const content = document.getElementById('content');
  const tocItems = Array.from(toc.querySelectorAll('li'));
  const searchInput = document.getElementById('search');

  // Scroll to section on TOC click
  tocItems.forEach(li => {
    li.addEventListener('click', () => {
      const id = li.dataset.target;
      const el = document.getElementById(id);
      if (!el) return;
      // highlight
      tocItems.forEach(i=>i.classList.remove('active'));
      li.classList.add('active');
      el.scrollIntoView({behavior:'smooth',block:'start'});
    });
  });

  // Simple search: filter TOC and highlight first match in content
  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim().toLowerCase();
    tocItems.forEach(li => {
      const text = li.textContent.toLowerCase();
      li.style.display = text.includes(q) ? '' : 'none';
    });
    if (!q) return;
    // find first content match and scroll
    const sections = Array.from(content.querySelectorAll('.section'));
    const found = sections.find(s => s.textContent.toLowerCase().includes(q));
    if (found) found.scrollIntoView({behavior:'smooth',block:'start'});
  });



  // Accessibility: focus first TOC item
  if (tocItems.length) tocItems[0].setAttribute('tabindex', '0');
})();