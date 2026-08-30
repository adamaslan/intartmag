const template = document.createElement('template');
template.innerHTML = `
  <nav class="navbar navbar-expand-md bg-fade fixed-top">
    <a class="navbar-brand" href="/">I. A. M.</a>
    <button
      class="navbar-toggler"
      type="button"
      data-toggle="collapse"
      aria-expanded="false"
      aria-label="Toggle navigation"
    >
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse">
      <ul class="navbar-nav mr-auto">
        <li class="nav-item">
          <a class="nav-link" href="/">Home</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="/pages/art-fairs.html">Art Fairs</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="/pages/museums.html">Museums</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="/pages/nyc.html">NYC</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="/pages/artists.html">Artists</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="/pages/international.html">International</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="/pages/culture.html">Culture</a>
        </li>
      </ul>
    </div>
  </nav>
`;

let instanceCount = 0;

class SiteNavbar extends HTMLElement {
  connectedCallback() {
    this.appendChild(template.content.cloneNode(true));

    const uniqueId = `site-navbar-${++instanceCount}`;
    const toggler = this.querySelector('.navbar-toggler');
    const collapse = this.querySelector('.navbar-collapse');

    collapse.id = uniqueId;
    toggler.setAttribute('data-target', `#${uniqueId}`);
    toggler.setAttribute('aria-controls', uniqueId);

    this.setActiveLink();
  }

  setActiveLink() {
    const currentPath = window.location.pathname;

    this.querySelectorAll('.nav-link').forEach(link => {
      const href = link.getAttribute('href');
      const isHome = href === '/';
      const isActive = isHome
        ? currentPath === '/' || currentPath === '/index.html'
        : currentPath === href;

      if (isActive) {
        link.closest('.nav-item').classList.add('active');
      }
    });
  }
}

customElements.define('site-navbar', SiteNavbar);
