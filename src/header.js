const btn = document.querySelector('.nav-toggle');
const nav = document.getElementById('mobile-nav');
if (btn && nav){
  btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!open));
  });
}
