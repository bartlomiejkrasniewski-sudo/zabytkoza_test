const Facts = (() => {
  let allFacts = [];

  async function loadFacts() {
    const { data, error } = await window.supabaseClient
      .from('facts')
      .select('id, content, monument_id, is_published, created_at, monuments(name)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    allFacts = data || [];
    return allFacts;
  }

  async function deleteFact(id) {
    const confirmed = confirm('Czy na pewno chcesz usunąć tę ciekawostkę? Tej operacji nie można cofnąć.');
    if (!confirmed) return false;

    const { error } = await window.supabaseClient
      .from('facts')
      .delete()
      .eq('id', id);

    if (error) throw error;
    allFacts = allFacts.filter(f => f.id !== id);
    return true;
  }

  async function togglePublish(id, currentStatus) {
    const newStatus = !currentStatus;

    const { error } = await window.supabaseClient
      .from('facts')
      .update({ is_published: newStatus })
      .eq('id', id);

    if (error) throw error;

    const fact = allFacts.find(f => f.id === id);
    if (fact) fact.is_published = newStatus;
    return newStatus;
  }

  function filterFacts(query) {
    if (!query || query.trim() === '') return [...allFacts];
    const q = query.trim().toLowerCase();
    return allFacts.filter(f => f.content && f.content.toLowerCase().includes(q));
  }

  return { loadFacts, deleteFact, togglePublish, filterFacts };
})();

window.Facts = Facts;
