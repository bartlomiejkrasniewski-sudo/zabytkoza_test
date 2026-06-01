const AddAudio = (() => {
  let editId = null;
  let detectedDuration = null;

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

  async function loadAudioGuide(id) {
    const { data, error } = await window.supabaseClient
      .from('audio_guides')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    document.getElementById('monument-id').value   = data.monument_id  || '';
    document.getElementById('title').value         = data.title        || '';
    document.getElementById('sort-order').value    = data.sort_order   ?? 0;
    document.getElementById('is-published').checked = !!data.is_published;

    if (data.audio_url) {
      const link = document.getElementById('current-audio-link');
      link.href = data.audio_url;
      document.getElementById('current-audio-wrap').style.display = 'block';
    }
  }

  async function uploadAudio(file, audioId, monumentId) {
    const path = `monuments/${monumentId}/audio_${audioId}.mp3`;
    const { error: upErr } = await window.supabaseClient.storage
      .from('audio-guides')
      .upload(path, file, { upsert: true, contentType: 'audio/mpeg' });

    if (upErr) throw upErr;

    const { data } = window.supabaseClient.storage
      .from('audio-guides')
      .getPublicUrl(path);

    return data.publicUrl;
  }

  function validate() {
    const monumentId = document.getElementById('monument-id').value;
    const title = document.getElementById('title').value.trim();
    const file = document.getElementById('audio-file').files[0];

    if (!monumentId) {
      UI.showToast('Wybierz zabytek.', 'error');
      document.getElementById('monument-id').focus();
      return false;
    }
    if (!title) {
      UI.showToast('Tytuł nagrania jest wymagany.', 'error');
      document.getElementById('title').focus();
      return false;
    }
    if (!editId && !file) {
      UI.showToast('Wybierz plik audio.', 'error');
      document.getElementById('audio-file').focus();
      return false;
    }
    return true;
  }

  async function saveAudio() {
    if (!validate()) return;

    const monumentId = document.getElementById('monument-id').value;
    const title      = document.getElementById('title').value.trim();
    const sortOrder  = parseInt(document.getElementById('sort-order').value, 10) || 0;
    const isPublished = document.getElementById('is-published').checked;
    const file       = document.getElementById('audio-file').files[0];

    const btn = document.getElementById('save-btn');
    btn.disabled    = true;
    btn.textContent = 'Zapisywanie…';

    try {
      if (editId) {
        let audioUrl = undefined;
        let durationSeconds = undefined;

        if (file) {
          audioUrl = await uploadAudio(file, editId, monumentId);
          durationSeconds = detectedDuration;
        }

        const payload = { title, monument_id: monumentId, sort_order: sortOrder, is_published: isPublished };
        if (audioUrl !== undefined) payload.audio_url = audioUrl;
        if (durationSeconds !== undefined) payload.duration_seconds = durationSeconds;

        const { error } = await window.supabaseClient
          .from('audio_guides')
          .update(payload)
          .eq('id', editId);
        if (error) throw error;
      } else {
        const { data: inserted, error: insertErr } = await window.supabaseClient
          .from('audio_guides')
          .insert({ title, monument_id: monumentId, sort_order: sortOrder, is_published: isPublished })
          .select('id')
          .single();
        if (insertErr) throw insertErr;

        const newId = inserted.id;
        const audioUrl = await uploadAudio(file, newId, monumentId);

        const { error: updateErr } = await window.supabaseClient
          .from('audio_guides')
          .update({ audio_url: audioUrl, duration_seconds: detectedDuration })
          .eq('id', newId);
        if (updateErr) throw updateErr;
      }

      UI.showToast(editId ? 'Zmiany zostały zapisane!' : 'Nagranie dodane!', 'success');
      setTimeout(() => { window.location.href = 'audio.html'; }, 1200);
    } catch (err) {
      UI.showToast(`Błąd zapisu: ${err.message}`, 'error');
      btn.disabled    = false;
      btn.textContent = editId ? 'Zapisz zmiany' : 'Zapisz nagranie';
    }
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    const infoEl = document.getElementById('file-info');
    detectedDuration = null;

    if (!file) {
      infoEl.textContent = '';
      return;
    }

    infoEl.textContent = `Wybrany plik: ${file.name}`;

    const url = URL.createObjectURL(file);
    const audioEl = new window.HTMLAudioElement
      ? document.createElement('audio')
      : new globalThis.Audio(url);

    audioEl.src = url;
    audioEl.onloadedmetadata = () => {
      detectedDuration = Math.round(audioEl.duration);
      const m = Math.floor(detectedDuration / 60);
      const s = String(detectedDuration % 60).padStart(2, '0');
      infoEl.textContent = `Wybrany plik: ${file.name} | Czas trwania: ${m}:${s}`;
      URL.revokeObjectURL(url);
    };
  }

  async function init() {
    await Auth.checkAuth();
    UI.initSidebar('audio');
    await UI.populateUserBadge();

    editId = getUrlId();

    try {
      await loadMonuments();

      if (editId) {
        document.getElementById('page-title').textContent   = 'Edytuj nagranie';
        document.getElementById('topbar-title').textContent = 'Edytuj nagranie';
        document.getElementById('save-btn').textContent     = 'Zapisz zmiany';
        await loadAudioGuide(editId);
      }
    } catch (err) {
      UI.showToast(`Błąd ładowania danych: ${err.message}`, 'error');
    }

    document.getElementById('audio-file')
      .addEventListener('change', handleFileChange);

    document.getElementById('save-btn')
      .addEventListener('click', saveAudio);

    document.getElementById('cancel-btn')
      .addEventListener('click', () => { window.location.href = 'audio.html'; });
  }

  return { init };
})();

window.AddAudio = AddAudio;
