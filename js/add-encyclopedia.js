const ENCYCLOPEDIA_BUCKET = 'encyclopedia-images';

const AddEncyclopedia = (() => {
  let editId = null;
  let slugManuallyEdited = false;

  function getUrlId() {
    return new URLSearchParams(window.location.search).get('id');
  }

  function generateSlug(title) {
    const map = { ą:'a', ę:'e', ó:'o', ś:'s', ł:'l', ż:'z', ź:'z', ć:'c', ń:'n' };
    return title.toLowerCase()
      .replace(/[ąęóśłżźćń]/g, ch => map[ch] || ch)
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
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

  async function loadEntry(id) {
    const { data, error } = await window.supabaseClient
      .from('encyclopedia')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    document.getElementById('title').value          = data.title       || '';
    document.getElementById('slug').value           = data.slug        || '';
    document.getElementById('category').value       = data.category    || '';
    document.getElementById('monument-id').value    = data.monument_id || '';
    document.getElementById('content').value        = data.content     || '';
    document.getElementById('is-published').checked = !!data.is_published;

    if (data.cover_image_url) {
      document.getElementById('cover-image-existing').style.display = 'block';
      document.getElementById('cover-image-existing-img').src = data.cover_image_url;
    }
  }

  async function uploadCoverImage(file, entryId) {
    const ext = file.name.split('.').pop();
    const path = `encyclopedia/${entryId}/cover.${ext}`;
    const { error } = await window.supabaseClient.storage
      .from(ENCYCLOPEDIA_BUCKET)
      .upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = window.supabaseClient.storage
      .from(ENCYCLOPEDIA_BUCKET)
      .getPublicUrl(path);
    return data.publicUrl;
  }

  function validate() {
    const title = document.getElementById('title').value.trim();
    if (!title) {
      UI.showToast('Tytuł artykułu jest wymagany.', 'error');
      document.getElementById('title').focus();
      return false;
    }
    const content = document.getElementById('content').value.trim();
    if (!content) {
      UI.showToast('Treść artykułu jest wymagana.', 'error');
      document.getElementById('content').focus();
      return false;
    }
    return true;
  }

  async function saveEntry() {
    if (!validate()) return;

    const monumentId = document.getElementById('monument-id').value;

    const payload = {
      title:        document.getElementById('title').value.trim(),
      slug:         document.getElementById('slug').value.trim() || null,
      category:     document.getElementById('category').value    || null,
      monument_id:  monumentId || null,
      content:      document.getElementById('content').value.trim(),
      is_published: document.getElementById('is-published').checked,
    };

    const btn = document.getElementById('save-btn');
    btn.disabled    = true;
    btn.textContent = 'Zapisywanie…';

    try {
      let savedEntryId = editId;

      if (editId) {
        const { error } = await window.supabaseClient
          .from('encyclopedia')
          .update(payload)
          .eq('id', editId);
        if (error) throw error;
      } else {
        const { data: inserted, error } = await window.supabaseClient
          .from('encyclopedia')
          .insert(payload)
          .select();
        if (error) throw error;
        savedEntryId = inserted[0].id;
      }

      const fileInput = document.getElementById('cover-image');
      if (fileInput.files.length > 0) {
        const imageUrl = await uploadCoverImage(fileInput.files[0], savedEntryId);
        await window.supabaseClient
          .from('encyclopedia')
          .update({ cover_image_url: imageUrl })
          .eq('id', savedEntryId);
      }

      UI.showToast(editId ? 'Zmiany zostały zapisane!' : 'Artykuł dodany!', 'success');
      setTimeout(() => { window.location.href = 'encyclopedia.html'; }, 1200);
    } catch (err) {
      UI.showToast(`Błąd zapisu: ${err.message}`, 'error');
      btn.disabled    = false;
      btn.textContent = editId ? 'Zapisz zmiany' : 'Zapisz artykuł';
    }
  }

  async function init() {
    await Auth.checkAuth();
    UI.initSidebar('encyclopedia');
    await UI.populateUserBadge();

    editId = getUrlId();

    try {
      await loadMonuments();

      if (editId) {
        document.getElementById('page-title').textContent   = 'Edytuj artykuł';
        document.getElementById('topbar-title').textContent = 'Edytuj artykuł';
        document.getElementById('save-btn').textContent     = 'Zapisz zmiany';
        slugManuallyEdited = true; // w trybie edycji nie nadpisuj istniejącego sluga
        await loadEntry(editId);
      }
    } catch (err) {
      UI.showToast(`Błąd ładowania danych: ${err.message}`, 'error');
    }

    document.getElementById('title').addEventListener('input', e => {
      if (!slugManuallyEdited) {
        document.getElementById('slug').value = generateSlug(e.target.value);
      }
    });

    document.getElementById('slug').addEventListener('input', () => {
      slugManuallyEdited = true;
    });

    document.getElementById('cover-image').addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      document.getElementById('cover-image-img').src = URL.createObjectURL(file);
      document.getElementById('cover-image-preview').style.display = 'block';
    });

    document.getElementById('remove-cover-image').addEventListener('click', () => {
      document.getElementById('cover-image').value = '';
      document.getElementById('cover-image-preview').style.display = 'none';
      document.getElementById('cover-image-img').src = '';
    });

    document.getElementById('save-btn')
      .addEventListener('click', saveEntry);

    document.getElementById('cancel-btn')
      .addEventListener('click', () => { window.location.href = 'encyclopedia.html'; });
  }

  return { init };
})();

window.AddEncyclopedia = AddEncyclopedia;
