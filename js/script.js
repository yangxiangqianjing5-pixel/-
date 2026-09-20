document.addEventListener('DOMContentLoaded', () => {
  // Mobile nav toggle
  const navToggle = document.getElementById('navToggle');
  const nav = document.getElementById('nav');

  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const isOpen = navToggle.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
      nav.classList.toggle('is-open', isOpen);
    });

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        nav.classList.remove('is-open');
      });
    });
  }

  // FAQ accordion
  document.querySelectorAll('.faq-item').forEach((item) => {
    const question = item.querySelector('.faq-item__q');
    question.addEventListener('click', () => {
      const wasOpen = item.classList.contains('is-open');
      document.querySelectorAll('.faq-item').forEach((other) => other.classList.remove('is-open'));
      if (!wasOpen) item.classList.add('is-open');
    });
  });
});
