const Encyclopedia = (() => {
  let allEntries = [];

  async function loadEntries() {
    const { data, error } = await window.supabaseClient
      .from('encyclopedia')
      .select('id, title, category, monument_id, is_published, created_at, monuments(name)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    allEntries = data || [];
    return allEntries;
  }

  async function deleteEntry(id) {
    const confirmed = confirm('Czy na pewno chcesz usunąć ten artykuł? Tej operacji nie można cofnąć.');
    if (!confirmed) return false;

    const { error } = await window.supabaseClient
      .from('encyclopedia')
      .delete()
      .eq('id', id);

    if (error) throw error;
    allEntries = allEntries.filter(e => e.id !== id);
    return true;
  }

  async function togglePublish(id, currentStatus) {
    const newStatus = !currentStatus;

    const { error } = await window.supabaseClient
      .from('encyclopedia')
      .update({ is_published: newStatus })
      .eq('id', id);

    if (error) throw error;

    const entry = allEntries.find(e => e.id === id);
    if (entry) entry.is_published = newStatus;
    return newStatus;
  }

  function filterEntries(query, category) {
    let result = [...allEntries];

    if (query && query.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter(e => e.title && e.title.toLowerCase().includes(q));
    }

    if (category && category.trim()) {
      result = result.filter(e => e.category === category);
    }

    return result;
  }

  return { loadEntries, deleteEntry, togglePublish, filterEntries };
})();

window.Encyclopedia = Encyclopedia;
