const Auth = (() => {
  async function loginWithEmail(email, password) {
    const { data, error } = await window.supabaseClient.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }

  async function logout() {
    const { error } = await window.supabaseClient.auth.signOut();
    if (error) console.error('Logout error:', error);
    window.location.href = 'index.html';
  }

  async function checkAuth() {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) {
      window.location.href = 'index.html';
      return null;
    }
    return session;
  }

  async function getCurrentUser() {
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    return user;
  }

  return { loginWithEmail, logout, checkAuth, getCurrentUser };
})();

window.Auth = Auth;
