import type { ShellView } from './router';
import { navigate, getCurrentRoute } from './router';

const NAV_ITEMS: Array<{ view: ShellView; label: string }> = [
  { view: 'home', label: 'Home' },
  { view: 'library', label: 'Library' },
  { view: 'play', label: 'Play' },
  { view: 'about', label: 'About' },
];

export function createShellLayout(root: HTMLElement): {
  main: HTMLElement;
  layoutElement: HTMLElement;
  updateActiveNav: (view: ShellView) => void;
} {
  root.innerHTML = '';

  const layout = document.createElement('div');
  layout.className = 'shell-layout';

  const header = document.createElement('header');
  header.className = 'shell-header';
  header.innerHTML = `
    <div class="shell-header-inner">
      <a class="shell-brand" href="#home" aria-label="Game Studio Home">
        <span class="shell-brand-icon" aria-hidden="true">GS</span>
        <span>Game Studio</span>
      </a>
      <nav class="shell-nav" aria-label="Main navigation"></nav>
      <button class="shell-menu-toggle" aria-label="Toggle menu" aria-expanded="false">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
    </div>
  `;

  const nav = header.querySelector('.shell-nav')!;
  const navLinks: HTMLAnchorElement[] = [];

  NAV_ITEMS.forEach(item => {
    const link = document.createElement('a');
    link.className = 'shell-nav-link';
    link.href = `#${item.view}`;
    link.textContent = item.label;
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(item.view);
    });
    navLinks.push(link);
    nav.appendChild(link);
  });

  const overlay = document.createElement('nav');
  overlay.className = 'shell-nav-overlay';
  overlay.setAttribute('aria-label', 'Mobile navigation');

  NAV_ITEMS.forEach(item => {
    const link = document.createElement('a');
    link.className = 'shell-nav-link';
    link.href = `#${item.view}`;
    link.textContent = item.label;
    link.addEventListener('click', (e) => {
      e.preventDefault();
      overlay.setAttribute('data-open', 'false');
      menuToggle.setAttribute('aria-expanded', 'false');
      navigate(item.view);
    });
    overlay.appendChild(link);
  });

  const menuToggle = header.querySelector('.shell-menu-toggle')! as HTMLButtonElement;
  menuToggle.addEventListener('click', () => {
    const isOpen = overlay.getAttribute('data-open') === 'true';
    overlay.setAttribute('data-open', String(!isOpen));
    menuToggle.setAttribute('aria-expanded', String(!isOpen));
  });

  const main = document.createElement('main');
  main.className = 'shell-main';
  main.id = 'shell-main';

  layout.appendChild(header);
  layout.appendChild(overlay);
  layout.appendChild(main);
  root.appendChild(layout);

  function updateActiveNav(view: ShellView): void {
    navLinks.forEach((link, i) => {
      if (NAV_ITEMS[i].view === view) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });

    const overlayLinks = overlay.querySelectorAll('.shell-nav-link');
    overlayLinks.forEach((link, i) => {
      if (NAV_ITEMS[i].view === view) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  const initial = getCurrentRoute();
  updateActiveNav(initial.view);

  return { main, layoutElement: layout, updateActiveNav };
}
