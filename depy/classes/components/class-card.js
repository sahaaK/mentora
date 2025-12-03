class ClassCard extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        
        .card {
          background: rgba(15, 23, 42, 0.5);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.4s ease;
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        
        .card:hover {
          background: rgba(15, 23, 42, 0.8);
          transform: translateY(-5px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.4);
        }
        
        .card-image {
          width: 100%;
          height: 160px;
          object-fit: cover;
        }
        
        .card-content {
          padding: 1.5rem;
          flex-grow: 1;
          display: flex;
          flex-direction: column;
        }
        
        .card-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #e2e8f0;
        }
        
        .card-meta {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1rem;
          font-size: 0.875rem;
          color: #94a3b8;
        }
        
        .card-stats {
          display: flex;
          justify-content: space-between;
          margin-top: auto;
          padding-top: 1rem;
        }
        
        .stat {
          text-align: center;
        }
        
        .stat-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: #c7d2fe;
        }
        
        .stat-label {
          font-size: 0.75rem;
          color: #94a3b8;
        }
        
        .progress-container {
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          overflow: hidden;
          margin-top: 0.5rem;
        }
        
        .progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #6366f1, #8b5cf6);
          border-radius: 3px;
        }
      </style>
      
      <div class="card">
        <img src="" alt="Class Image" class="card-image" id="classImage">
        <div class="card-content">
          <h3 class="card-title" id="className">Class Name</h3>
          <div class="card-meta">
            <span id="classProgram">Program</span>
            <span id="classYear">Year</span>
          </div>
          <div class="progress-container">
            <div class="progress-bar" id="progressBar"></div>
          </div>
          <div class="card-stats">
            <div class="stat">
              <div class="stat-value" id="studentCount">0</div>
              <div class="stat-label">Students</div>
            </div>
            <div class="stat">
              <div class="stat-value" id="teacherCount">0</div>
              <div class="stat-label">Teachers</div>
            </div>
            <div class="stat">
              <div class="stat-value" id="courseCount">0</div>
              <div class="stat-label">Courses</div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Set data if attributes are provided
    this.updateCard();
  }
  
  static get observedAttributes() {
    return ['class-data'];
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'class-data') {
      this.updateCard();
    }
  }
  
  updateCard() {
    const classData = JSON.parse(this.getAttribute('class-data') || '{}');
    
    if (!classData) return;
    
    const classImage = this.shadowRoot.getElementById('classImage');
    const className = this.shadowRoot.getElementById('className');
    const classProgram = this.shadowRoot.getElementById('classProgram');
    const classYear = this.shadowRoot.getElementById('classYear');
    const progressBar = this.shadowRoot.getElementById('progressBar');
    const studentCount = this.shadowRoot.getElementById('studentCount');
    const teacherCount = this.shadowRoot.getElementById('teacherCount');
    const courseCount = this.shadowRoot.getElementById('courseCount');
    
    if (classImage) classImage.src = classData.imageUrl || 'http://static.photos/education/640x360/1';
    if (className) className.textContent = classData.name || 'Class Name';
    if (classProgram) classProgram.textContent = classData.program || 'Program';
    if (classYear) classYear.textContent = `Year ${classData.year || '-'}`;
    
    const capacity = classData.maxCapacity || 30;
    const students = classData.students || 0;
    const percentage = capacity ? Math.round((students / capacity) * 100) : 0;
    
    if (progressBar) progressBar.style.width = `${percentage}%`;
    if (studentCount) studentCount.textContent = students;
    if (teacherCount) teacherCount.textContent = classData.teachers || 0;
    if (courseCount) courseCount.textContent = classData.courses || 0;
  }
}

customElements.define('class-card', ClassCard);