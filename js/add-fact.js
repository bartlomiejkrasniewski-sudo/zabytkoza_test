const AddFact = (() => {
  let editId = null;

  function getUrlId() {
    return new URLSearchParams(window.location.search).get('id');
  }

  async function loadMonuments() {
    const { data, error } = await window.supabaseClient
      .from('monuments')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) throw error;

    const select = document.getElementById('monument-id');
    (data || []).forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = m.name;
      select.appendChild(opt);
    });
  }

  async function loadFact(id) {
    const { data, error } = await window.supabaseClient
      .from('facts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    document.getElementById('content').value      = data.content      || '';
    document.getElementById('monument-id').value  = data.monument_id  || '';
    document.getElementById('source').value       = data.source       || '';
    document.getElementById('is-published').checked = !!data.is_published;

    updateCharCounter();
  }

  function updateCharCounter() {
    const ta      = document.getElementById('content');
    const counter = document.getElementById('content-counter');
    const len     = ta.value.length;
    counter.textContent = `${len}/500`;
    counter.classList.toggle('warn', len > 450);
  }

  function validate() {
    const content = document.getElementById('content').value.trim();
    if (!content) {
      UI.showToast('Treść ciekawostki jest wymagana.', 'error');
      document.getElementById('content').focus();
      return false;
    }
    return true;
  }

  async function saveFact() {
    if (!validate()) return;

    const monumentId = document.getElementById('monument-id').value;

    const payload = {
      content:      document.getElementById('content').value.trim(),
      monument_id:  monumentId || null,
      source:       document.getElementById('source').value.trim() || null,
      is_published: document.getElementById('is-published').checked,
    };

    const btn = document.getElementById('save-btn');
    btn.disabled    = true;
    btn.textContent = 'Zapisywanie…';

    try {
      if (editId) {
        const { error } = await window.supabaseClient
          .from('facts')
          .update(payload)
          .eq('id', editId);
        if (error) throw error;
      } else {
        const { error } = await window.supabaseClient
          .from('facts')
          .insert(payload);
        if (error) throw error;
      }

      UI.showToast(editId ? 'Zmiany zostały zapisane!' : 'Ciekawostka dodana!', 'success');
      setTimeout(() => { window.location.href = 'facts.html'; }, 1200);
    } catch (err) {
      UI.showToast(`Błąd zapisu: ${err.message}`, 'error');
      btn.disabled    = false;
      btn.textContent = editId ? 'Zapisz zmiany' : 'Zapisz ciekawostkę';
    }
  }

  async function init() {
    await Auth.checkAuth();
    UI.initSidebar('facts');
    await UI.populateUserBadge();

    editId = getUrlId();

    try {
      await loadMonuments();

      if (editId) {
        document.getElementById('page-title').textContent   = 'Edytuj ciekawostkę';
        document.getElementById('topbar-title').textContent = 'Edytuj ciekawostkę';
        document.getElementById('save-btn').textContent     = 'Zapisz zmiany';
        await loadFact(editId);
      }
    } catch (err) {
      UI.showToast(`Błąd ładowania danych: ${err.message}`, 'error');
    }

    document.getElementById('content')
      .addEventListener('input', updateCharCounter);

    document.getElementById('save-btn')
      .addEventListener('click', saveFact);

    document.getElementById('cancel-btn')
      .addEventListener('click', () => { window.location.href = 'facts.html'; });
  }

  return { init };
})();

window.AddFact = AddFact;
