const Audio = (() => {
  let allAudio = [];

  async function loadAudio() {
    const { data, error } = await window.supabaseClient
      .from('audio_guides')
      .select('id, title, audio_url, duration_seconds, sort_order, is_published, monument_id, monuments(name)')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    allAudio = data || [];
    return allAudio;
  }

  function formatDuration(seconds) {
    if (seconds === null || seconds === undefined) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  async function deleteAudio(id) {
    const confirmed = confirm('Czy na pewno chcesz usunąć to nagranie? Tej operacji nie można cofnąć.');
    if (!confirmed) return false;

    const { error } = await window.supabaseClient
      .from('audio_guides')
      .delete()
      .eq('id', id);

    if (error) throw error;
    allAudio = allAudio.filter(a => a.id !== id);
    return true;
  }

  async function togglePublish(id, currentStatus) {
    const newStatus = !currentStatus;

    const { error } = await window.supabaseClient
      .from('audio_guides')
      .update({ is_published: newStatus })
      .eq('id', id);

    if (error) throw error;

    const item = allAudio.find(a => a.id === id);
    if (item) item.is_published = newStatus;
    return newStatus;
  }

  function filterByMonument(monumentId) {
    if (!monumentId) return [...allAudio];
    return allAudio.filter(a => String(a.monument_id) === String(monumentId));
  }

  return { loadAudio, formatDuration, deleteAudio, togglePublish, filterByMonument };
})();

window.Audio = Audio;
