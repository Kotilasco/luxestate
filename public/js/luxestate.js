const navLinks = document.querySelectorAll('.navbar .nav-link[href^="#"]');
const navbarCollapse = document.querySelector('.navbar-collapse');

navLinks.forEach((link) => {
  link.addEventListener('click', () => {
    if (navbarCollapse && navbarCollapse.classList.contains('show')) {
      bootstrap.Collapse.getOrCreateInstance(navbarCollapse).hide();
    }
  });
});

const sections = [...document.querySelectorAll('main section[id]')];

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      navLinks.forEach((link) => {
        link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
      });
    });
  }, { rootMargin: '-35% 0px -55% 0px', threshold: 0 });

  sections.forEach((section) => observer.observe(section));
}

const counters = document.querySelectorAll('[data-count]');

function animateCounter(counter) {
  const target = Number(counter.dataset.count || 0);
  const suffix = counter.dataset.suffix || '';
  const duration = Number(counter.dataset.duration || 1400);
  const startedAt = performance.now();

  function tick(now) {
    const progress = Math.min((now - startedAt) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(target * eased);

    counter.textContent = `${value}${suffix}`;

    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  }

  requestAnimationFrame(tick);
}

if ('IntersectionObserver' in window) {
  const counterObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      animateCounter(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.45 });

  counters.forEach((counter) => counterObserver.observe(counter));
} else {
  counters.forEach(animateCounter);
}
