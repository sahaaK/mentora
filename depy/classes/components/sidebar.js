/* Shared sidebar injector for enrollment pages
   This script inserts the floating sidebar markup into pages that include
   a <div id="sidebar-root"></div> (or into document.body if not present).
   It also runs feather.replace() and sets the active sidebar item based on the
   current page filename.
*/
(function () {
  const navHTML = `
    <nav class="floating-sidebar" aria-label="Main navigation">
        <div class="sidebar-brand" title="Mentora">
            <i data-feather="home" class="w-6 h-6 text-white"></i>
        </div>
        
        <a href="students.html" class="sidebar-item" data-section="registration" title="Add Students">
            <i data-feather="book" class="w-5 h-5"></i>
            <span class="tooltip">Add students</span>
        </a>
        <a href="courses.html" class="sidebar-item" data-section="list" title="Courses">
            <i data-feather="list" class="w-5 h-5"></i>
            <span class="tooltip">Courses</span>
        </a>
       
    </nav>
  `;

  function insertSidebar() {
    const root = document.getElementById('sidebar-root');
    if (root) {
      root.innerHTML = navHTML;
    } else {
      // fallback: insert at the top of the body
      const temp = document.createElement('div');
      temp.innerHTML = navHTML;
      document.body.insertBefore(temp.firstElementChild, document.body.firstChild);
    }

    // Replace feather icons if available
    if (window.feather && typeof window.feather.replace === 'function') {
      window.feather.replace();
    }

    // Set active sidebar item based on current page
    const currentFile = window.location.pathname.split('/').pop();
    document.querySelectorAll('.sidebar-item').forEach(item => {
      if (item.getAttribute('href') === currentFile) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', insertSidebar);
  } else {
    insertSidebar();
  }
})();
