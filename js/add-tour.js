const STORAGE_BUCKET = 'tour-images';

const AddTour = (() => {
  let editId = null;

  function getUrlId() {
    return new URLSearchParams(window.location.search).get('id');
  }

  async function loadTour(id) {
    const { data, error } = await window.supabaseClient
      .from('tours')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    document.getElementById('name').value              = data.name              || '';
    document.getElementById('short-description').value = data.short_description || '';
    document.getElementById('description').value       = data.description       || '';
    document.getElementById('difficulty').value        = data.difficulty        || '';
    document.getElementById('duration').value          = data.duration_minutes  ?? '';
    document.getElementById('distance').value          = data.distance_meters   ?? '';
    document.getElementById('is-published').checked   = !!data.is_published;

    if (data.cover_image_url) {
      document.getElementById('cover-image-existing').style.display = 'block';
      document.getElementById('cover-image-existing-img').src = data.cover_image_url;
    }

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
    const name = document.getElementById('name').value.trim();
    if (!name) {
      UI.showToast('Nazwa szlaku jest wymagana.', 'error');
      document.getElementById('name').focus();
      return false;
    }
    return true;
  }

  async function uploadCoverImage(file, tourId) {
    const ext = file.name.split('.').pop();
    const path = `tours/${tourId}/cover.${ext}`;
    const { error } = await window.supabaseClient.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = window.supabaseClient.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(path);
    return data.publicUrl;
  }

  async function saveTour() {
    if (!validate()) return;

    const payload = {
      name:              document.getElementById('name').value.trim(),
      short_description: document.getElementById('short-description').value.trim() || null,
      description:       document.getElementById('description').value.trim()       || null,
      difficulty:        document.getElementById('difficulty').value               || null,
      duration_minutes:  parseInt(document.getElementById('duration').value)       || null,
      distance_meters:   parseInt(document.getElementById('distance').value)       || null,
      is_published:      document.getElementById('is-published').checked,
    };

    const btn = document.getElementById('save-btn');
    btn.disabled    = true;
    btn.textContent = 'Zapisywanie…';

    try {
      let savedTourId = editId;

      if (editId) {
        const { error } = await window.supabaseClient
          .from('tours')
          .update(payload)
          .eq('id', editId);
        if (error) throw error;
      } else {
        const { data: inserted, error } = await window.supabaseClient
          .from('tours')
          .insert(payload)
          .select();
        if (error) throw error;
        savedTourId = inserted[0].id;
      }

      const fileInput = document.getElementById('cover-image');
      if (fileInput.files.length > 0) {
        const imageUrl = await uploadCoverImage(fileInput.files[0], savedTourId);
        await window.supabaseClient
          .from('tours')
          .update({ cover_image_url: imageUrl })
          .eq('id', savedTourId);
      }

      UI.showToast(editId ? 'Zmiany zostały zapisane!' : 'Szlak dodany!', 'success');
      setTimeout(() => { window.location.href = 'tours.html'; }, 1200);
    } catch (err) {
      UI.showToast(`Błąd zapisu: ${err.message}`, 'error');
      btn.disabled    = false;
      btn.textContent = editId ? 'Zapisz zmiany' : 'Zapisz szlak';
    }
  }

  async function init() {
    await Auth.checkAuth();
    UI.initSidebar('tours');
    await UI.populateUserBadge();

    editId = getUrlId();

    try {
      if (editId) {
        document.getElementById('page-title').textContent   = 'Edycja szlaku';
        document.getElementById('topbar-title').textContent = 'Edycja szlaku';
        document.getElementById('save-btn').textContent     = 'Zapisz zmiany';
        await loadTour(editId);
      }
    } catch (err) {
      UI.showToast(`Błąd ładowania danych: ${err.message}`, 'error');
    }

    document.getElementById('short-description')
      .addEventListener('input', updateCharCounter);

    document.getElementById('save-btn')
      .addEventListener('click', saveTour);

    document.getElementById('cancel-btn')
      .addEventListener('click', () => { window.location.href = 'tours.html'; });

    document.getElementById('cover-image')
      .addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        const preview = document.getElementById('cover-image-preview');
        document.getElementById('cover-image-img').src = URL.createObjectURL(file);
        preview.style.display = 'block';
      });

    document.getElementById('remove-cover-image')
      .addEventListener('click', () => {
        const input = document.getElementById('cover-image');
        input.value = '';
        document.getElementById('cover-image-preview').style.display = 'none';
        document.getElementById('cover-image-img').src = '';
      });
  }

  return { init };
})();

window.AddTour = AddTour;
