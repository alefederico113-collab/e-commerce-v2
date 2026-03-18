async function login(event) {
  event.preventDefault();

  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const password = document.getElementById('login-password').value;

  try {
    const result = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    saveSession(result.token, result.user);
    showStatus('Login effettuato.', 'success');
    window.location.href = result.user.role === 'admin' ? 'admin.html' : 'index.html';
  } catch (error) {
    showStatus(error.message, 'error');
  }
}

async function initLogin() {
  await refreshCurrentUser();
  renderHeader();
  document.getElementById('login-form').addEventListener('submit', login);
}

initLogin();
