const Monuments = (() => {
  let allMonuments = [];

  async function loadMonuments() {
    const { data, error } = await window.supabaseClient
      .from('monuments')
      .select('id, name, category_id, is_published, created_at, categories(name)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    allMonuments = data || [];
    return allMonuments;
  }

  async function deleteMonument(id) {
    const confirmed = confirm('Czy na pewno chcesz usunąć ten zabytek? Tej operacji nie można cofnąć.');
    if (!confirmed) return false;

    const { error } = await window.supabaseClient
      .from('monuments')
      .delete()
      .eq('id', id);

    if (error) throw error;
    allMonuments = allMonuments.filter(m => m.id !== id);
    return true;
  }

  async function togglePublish(id, currentStatus) {
    const newStatus = !currentStatus;

    const { error } = await window.supabaseClient
      .from('monuments')
      .update({ is_published: newStatus })
      .eq('id', id);

    if (error) throw error;

    const monument = allMonuments.find(m => m.id === id);
    if (monument) monument.is_published = newStatus;
    return newStatus;
  }

  function filterMonuments(query, category) {
    let result = [...allMonuments];

    if (category && category !== '') {
      result = result.filter(m => m.category_id === category);
    }

    if (query && query.trim() !== '') {
      const q = query.trim().toLowerCase();
      result = result.filter(m => m.name && m.name.toLowerCase().includes(q));
    }

    return result;
  }

  function getCategories() {
    const cats = allMonuments
      .map(m => m.categories?.name)
      .filter(Boolean);
    return [...new Set(cats)].sort();
  }

  return { loadMonuments, deleteMonument, togglePublish, filterMonuments, getCategories };
})();

window.Monuments = Monuments;
