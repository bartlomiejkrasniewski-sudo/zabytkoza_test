const AddMonument = (() => {
  let editId = null;

  function getUrlId() {
    return new URLSearchParams(window.location.search).get('id');
  }

  async function loadCategories() {
    const { data, error } = await window.supabaseClient
      .from('categories')
      .select('id, name')
      .order('name');

    if (error) throw error;

    const select = document.getElementById('category-id');
    (data || []).forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat.id;
      opt.textContent = cat.name;
      select.appendChild(opt);
    });
  }

  async function loadMonument(id) {
    const { data, error } = await window.supabaseClient
      .from('monuments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    document.getElementById('name').value              = data.name              || '';
    document.getElementById('short-description').value = data.short_description || '';
    document.getElementById('description').value       = data.description       || '';
    document.getElementById('address').value           = data.address           || '';
    document.getElementById('city').value              = data.city              || '';
    document.getElementById('build-year').value        = data.build_year        || '';
    document.getElementById('category-id').value       = data.category_id       || '';
    document.getElementById('latitude').value          = data.latitude  ?? '';
    document.getElementById('longitude').value         = data.longitude ?? '';
    document.getElementById('is-published').checked    = !!data.is_published;

    updateCharCounter();
  }

  function updateCharCounter() {
    const ta      = document.getElementById('short-description');
    const counter = document.getElementById('short-desc-counter');
    const len     = ta.value.length;
    counter.textContent = `${len}/200`;
    counter.classList.toggle('warn', len > 180);
  }

  function validate() {
    const name        = document.getElementById('name').value.trim();
    const description = document.getElementById('description').value.trim();

    if (!name) {
      UI.showToast('Nazwa zabytku jest wymagana.', 'error');
      document.getElementById('name').focus();
      return false;
    }
    if (!description) {
      UI.showToast('Pełny opis jest wymagany.', 'error');
      document.getElementById('description').focus();
      return false;
    }
    return true;
  }

  async function saveMonument() {
    if (!validate()) return;

    const payload = {
      name:              document.getElementById('name').value.trim(),
      short_description: document.getElementById('short-description').value.trim() || null,
      description:       document.getElementById('description').value.trim(),
      address:           document.getElementById('address').value.trim()    || null,
      city:              document.getElementById('city').value.trim()       || null,
      build_year:        document.getElementById('build-year').value.trim() || null,
      category_id:       document.getElementById('category-id').value       || null,
      latitude:          parseFloat(document.getElementById('latitude').value)  || null,
      longitude:         parseFloat(document.getElementById('longitude').value) || null,
      is_published:      document.getElementById('is-published').checked,
    };

    const btn = document.getElementById('save-btn');
    btn.disabled    = true;
    btn.textContent = 'Zapisywanie…';

    try {
      if (editId) {
        const { error } = await window.supabaseClient
          .from('monuments')
          .update(payload)
          .eq('id', editId);
        if (error) throw error;
        UI.showToast('Zmiany zostały zapisane!', 'success');
      } else {
        const { error } = await window.supabaseClient
          .from('monuments')
          .insert(payload);
        if (error) throw error;
        UI.showToast('Zabytek dodany!', 'success');
      }

      setTimeout(() => { window.location.href = 'monuments.html'; }, 1200);
    } catch (err) {
      UI.showToast(`Błąd zapisu: ${err.message}`, 'error');
      btn.disabled    = false;
      btn.textContent = editId ? 'Zapisz zmiany' : 'Zapisz zabytek';
    }
  }

  async function init() {
    await Auth.checkAuth();
    UI.initSidebar('monuments');
    await UI.populateUserBadge();

    editId = getUrlId();

    try {
      await loadCategories();

      if (editId) {
        document.getElementById('page-title').textContent  = 'Edycja zabytku';
        document.getElementById('topbar-title').textContent = 'Edycja zabytku';
        document.getElementById('save-btn').textContent    = 'Zapisz zmiany';
        await loadMonument(editId);
      }
    } catch (err) {
      UI.showToast(`Błąd ładowania danych: ${err.message}`, 'error');
    }

    document.getElementById('short-description')
      .addEventListener('input', updateCharCounter);

    document.getElementById('save-btn')
      .addEventListener('click', saveMonument);

    document.getElementById('cancel-btn')
      .addEventListener('click', () => { window.location.href = 'monuments.html'; });
  }

  return { init };
})();

window.AddMonument = AddMonument;
