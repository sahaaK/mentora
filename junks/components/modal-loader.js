// Loads modal HTML fragments into placeholders in portal.html
(async function(){
  async function fetchAndInject(path, containerId){
    try{
      const res = await fetch(path);
      if(!res.ok) throw new Error('HTTP '+res.status);
      const html = await res.text();
      const container = document.getElementById(containerId);
      if(container){
        container.innerHTML = html;
        // Re-run feather icons replacement if available
        if(window.feather && typeof feather.replace === 'function'){
          feather.replace();
        }
      }
    }catch(err){
      console.error('Failed to load component', path, err);
    }
  }

  // Paths are relative to `portal.html` (which resides in `junks/`)
  await fetchAndInject('components/programModal.html', 'component-programModal');
  await fetchAndInject('components/addBachelorModal.html', 'component-addBachelorModal');
  // Notify the app that components are now available
  try {
    // Set a global flag so scripts that load after this can detect components
    window.__componentsLoaded = true;
    document.dispatchEvent(new CustomEvent('components:loaded', {
      detail: { components: ['programModal','addBachelorModal'] }
    }));
  } catch (e) {
    // ignore if dispatch fails in older browsers
    console.warn('Could not dispatch components:loaded event', e);
  }
})();
