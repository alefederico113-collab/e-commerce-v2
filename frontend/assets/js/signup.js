async function signup(event) {
  event.preventDefault();

  const name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim().toLowerCase();
  const password = document.getElementById('signup-password').value;

  try {
    const result = await apiFetch('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });

    saveSession(result.token, result.user);
    showStatus('Account creato con successo.', 'success');
    window.location.href = 'index.html';
  } catch (error) {
    showStatus(error.message, 'error');
  }
}

async function initSignup() {
  await refreshCurrentUser();
  renderHeader();
  document.getElementById('signup-form').addEventListener('submit', signup);
}

initSignup();
