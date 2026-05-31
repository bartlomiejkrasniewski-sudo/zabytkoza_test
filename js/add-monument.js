const AddMonument = (() => {
  let editId      = null;
  let selectedFile = null;

  function getUrlId() {
    return new URLSearchParams(window.location.search).get('id');
  }

  // ─── Categories ──────────────────────────────────────

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

  // ─── Load existing monument ───────────────────────────

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

    if (data.cover_image_url) {
      showPreviewUrl(data.cover_image_url);
    }

    updateCharCounter();
  }

  // ─── Image preview ────────────────────────────────────

  function previewImage(file) {
    const reader = new FileReader();
    reader.onload = e => showPreviewUrl(e.target.result);
    reader.readAsDataURL(file);
  }

  function showPreviewUrl(url) {
    const img         = document.getElementById('cover-preview');
    const placeholder = document.getElementById('upload-placeholder');
    img.src           = url;
    img.style.display = 'block';
    placeholder.style.display = 'none';
  }

  // ─── Image upload ─────────────────────────────────────

  async function uploadImage(file, monumentId) {
    if (!file.type.startsWith('image/')) {
      UI.showToast('Dozwolone są tylko pliki graficzne (JPG, PNG, WebP…).', 'error');
      return null;
    }

    if (file.size > 5 * 1024 * 1024) {
      UI.showToast('Plik jest za duży. Maksymalny rozmiar to 5 MB.', 'error');
      return null;
    }

    const ext      = file.name.split('.').pop().toLowerCase();
    const path     = `${monumentId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await window.supabaseClient.storage
      .from('monument-images')
      .upload(path, file, { upsert: true });

    if (uploadError) throw new Error(`Upload zdjęcia nieudany: ${uploadError.message}`);

    const { data } = window.supabaseClient.storage
      .from('monument-images')
      .getPublicUrl(path);

    return data.publicUrl;
  }

  // ─── Validation ───────────────────────────────────────

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

  // ─── Save ─────────────────────────────────────────────

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
      let monumentId = editId;

      if (editId) {
        const { error } = await window.supabaseClient
          .from('monuments')
          .update(payload)
          .eq('id', editId);
        if (error) throw error;
      } else {
        const { data, error } = await window.supabaseClient
          .from('monuments')
          .insert(payload)
          .select('id')
          .single();
        if (error) throw error;
        monumentId = data.id;
      }

      if (selectedFile) {
        btn.textContent = 'Przesyłanie zdjęcia…';
        const publicUrl = await uploadImage(selectedFile, monumentId);

        if (publicUrl) {
          const { error: urlError } = await window.supabaseClient
            .from('monuments')
            .update({ cover_image_url: publicUrl })
            .eq('id', monumentId);
          if (urlError) throw urlError;
        }
      }

      UI.showToast(editId ? 'Zmiany zostały zapisane!' : 'Zabytek dodany!', 'success');
      setTimeout(() => { window.location.href = 'monuments.html'; }, 1200);

    } catch (err) {
      UI.showToast(`Błąd zapisu: ${err.message}`, 'error');
      btn.disabled    = false;
      btn.textContent = editId ? 'Zapisz zmiany' : 'Zapisz zabytek';
    }
  }

  // ─── Char counter ─────────────────────────────────────

  function updateCharCounter() {
    const ta      = document.getElementById('short-description');
    const counter = document.getElementById('short-desc-counter');
    const len     = ta.value.length;
    counter.textContent = `${len}/200`;
    counter.classList.toggle('warn', len > 180);
  }

  // ─── Init ─────────────────────────────────────────────

  async function init() {
    await Auth.checkAuth();
    UI.initSidebar('monuments');
    await UI.populateUserBadge();

    editId = getUrlId();

    try {
      await loadCategories();

      if (editId) {
        document.getElementById('page-title').textContent   = 'Edycja zabytku';
        document.getElementById('topbar-title').textContent = 'Edycja zabytku';
        document.getElementById('save-btn').textContent     = 'Zapisz zmiany';
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

    const fileInput = document.getElementById('cover-image');

    fileInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        UI.showToast('Dozwolone są tylko pliki graficzne.', 'error');
        fileInput.value = '';
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        UI.showToast('Plik jest za duży. Maksymalny rozmiar to 5 MB.', 'error');
        fileInput.value = '';
        return;
      }

      selectedFile = file;
      document.getElementById('image-filename').textContent = file.name;
      previewImage(file);
    });
  }

  return { init };
})();

window.AddMonument = AddMonument;
