const Tours = (() => {
  let allTours = [];

  function formatDuration(min) {
    if (!min && min !== 0) return '—';
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (h === 0) return `${m} min`;
    if (m === 0) return `${h} h`;
    return `${h} h ${m} min`;
  }

  function formatDistance(meters) {
    if (!meters && meters !== 0) return '—';
    return (meters / 1000).toFixed(1).replace('.', ',') + ' km';
  }

  function difficultyBadge(val) {
    const map = {
      easy:   { label: 'Łatwy',  cls: 'badge-easy' },
      medium: { label: 'Średni', cls: 'badge-medium' },
      hard:   { label: 'Trudny', cls: 'badge-hard' },
    };
    return map[val] || { label: val || '—', cls: '' };
  }

  async function loadTours() {
    const { data, error } = await window.supabaseClient
      .from('tours')
      .select('id, name, difficulty, duration_minutes, distance_meters, is_published, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    allTours = data || [];
    return allTours;
  }

  async function deleteTour(id) {
    const confirmed = confirm('Czy na pewno chcesz usunąć ten szlak? Tej operacji nie można cofnąć.');
    if (!confirmed) return false;

    const { error } = await window.supabaseClient
      .from('tours')
      .delete()
      .eq('id', id);

    if (error) throw error;
    allTours = allTours.filter(t => t.id !== id);
    return true;
  }

  async function togglePublish(id, currentStatus) {
    const newStatus = !currentStatus;

    const { error } = await window.supabaseClient
      .from('tours')
      .update({ is_published: newStatus })
      .eq('id', id);

    if (error) throw error;

    const tour = allTours.find(t => t.id === id);
    if (tour) tour.is_published = newStatus;
    return newStatus;
  }

  function filterTours(query) {
    if (!query || query.trim() === '') return [...allTours];
    const q = query.trim().toLowerCase();
    return allTours.filter(t => t.name && t.name.toLowerCase().includes(q));
  }

  return { loadTours, deleteTour, togglePublish, filterTours, formatDuration, formatDistance, difficultyBadge };
})();

window.Tours = Tours;
