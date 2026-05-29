// Shared UI utilities

function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pl-PL', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
}

function initSidebar(activeNav) {
  const toggle = document.getElementById('menu-toggle');
  const sidebar = document.getElementById('sidebar');

  if (toggle && sidebar) {
    toggle.addEventListener('click', () => sidebar.classList.toggle('open'));
    document.addEventListener('click', e => {
      if (!sidebar.contains(e.target) && !toggle.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    });
  }

  document.querySelectorAll('.nav-item[data-page]').forEach(el => {
    if (el.dataset.page === activeNav) el.classList.add('active');
  });

  const logoutBtn = document.getElementById('logout-btn');
  const logoutSide = document.getElementById('logout-side');
  [logoutBtn, logoutSide].forEach(btn => {
    if (btn) btn.addEventListener('click', () => window.Auth.logout());
  });
}

async function populateUserBadge() {
  const user = await window.Auth.getCurrentUser();
  const emailEl = document.getElementById('user-email');
  const avatarEl = document.getElementById('user-avatar');
  if (user && emailEl) {
    emailEl.textContent = user.email;
    if (avatarEl) avatarEl.textContent = user.email[0].toUpperCase();
  }
}

window.UI = { showToast, formatDate, initSidebar, populateUserBadge };
