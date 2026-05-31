const TourStops = (() => {
  let tourId   = null;
  let allStops = [];

  function getUrlId() {
    return new URLSearchParams(window.location.search).get('id');
  }

  async function loadTourName(id) {
    const { data, error } = await window.supabaseClient
      .from('tours')
      .select('name')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data.name;
  }

  async function loadStops(id) {
    const { data, error } = await window.supabaseClient
      .from('tour_stops')
      .select('id, stop_order, description, monuments(name)')
      .eq('tour_id', id)
      .order('stop_order', { ascending: true });

    if (error) throw error;
    allStops = data || [];
    return allStops;
  }

  async function loadMonuments() {
    const { data, error } = await window.supabaseClient
      .from('monuments')
      .select('id, name')
      .eq('is_published', true)
      .order('name');

    if (error) throw error;

    const select = document.getElementById('monument-select');
    select.innerHTML = '<option value="">— wybierz zabytek —</option>';
    (data || []).forEach(m => {
      const opt       = document.createElement('option');
      opt.value       = m.id;
      opt.textContent = m.name;
      select.appendChild(opt);
    });
  }

  async function addStop(monumentId, description) {
    const maxOrder = allStops.length > 0
      ? Math.max(...allStops.map(s => s.stop_order))
      : 0;

    const { error } = await window.supabaseClient
      .from('tour_stops')
      .insert({
        tour_id:     tourId,
        monument_id: monumentId,
        stop_order:  maxOrder + 1,
        description: description || null,
      });

    if (error) throw error;
  }

  async function deleteStop(id) {
    const confirmed = confirm('Czy na pewno chcesz usunąć ten punkt szlaku?');
    if (!confirmed) return false;

    const { error } = await window.supabaseClient
      .from('tour_stops')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  async function moveStop(id, direction) {
    const idx = allStops.findIndex(s => s.id === id);
    if (idx === -1) return;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= allStops.length) return;

    const current = allStops[idx];
    const neighbor = allStops[targetIdx];

    const { error: e1 } = await window.supabaseClient
      .from('tour_stops')
      .update({ stop_order: neighbor.stop_order })
      .eq('id', current.id);
    if (e1) throw e1;

    const { error: e2 } = await window.supabaseClient
      .from('tour_stops')
      .update({ stop_order: current.stop_order })
      .eq('id', neighbor.id);
    if (e2) throw e2;
  }

  function setTourId(id)    { tourId = id; }
  function getAllStops()     { return allStops; }

  return { getUrlId, loadTourName, loadStops, loadMonuments, addStop, deleteStop, moveStop, setTourId, getAllStops };
})();

window.TourStops = TourStops;
