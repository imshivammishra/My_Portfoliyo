// Mobile menu toggle
const menuBtn = document.querySelector('.menu-btn');
const navLinks = document.querySelector('.nav-links');
menuBtn.addEventListener('click', () => navLinks.classList.toggle('open'));

// Scroll animations
const animatedEls = document.querySelectorAll('[data-animate]');
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.15 });
animatedEls.forEach(el => observer.observe(el));

// Night mode toggle button (insert in your header if needed)
const themeToggleBtn = document.createElement('button');
themeToggleBtn.id = 'theme-toggle';
themeToggleBtn.textContent = 'Night Mode';
document.querySelector('.container').appendChild(themeToggleBtn);

themeToggleBtn.addEventListener('click', () => {
  if (document.documentElement.getAttribute('data-theme') === 'dark') {
    document.documentElement.removeAttribute('data-theme');
    themeToggleBtn.textContent = 'Night Mode';
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeToggleBtn.textContent = 'Light Mode';
  }
});
