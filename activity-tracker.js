class ActivityTracker {
  constructor() {
    this.key = 'activity-tracker-data';
    this.session = this.loadSession();

    this.renderWidget();
    this.trackPageView();
    this.initEventListeners();

    // Initial sync to show existing data
    this.refreshUI();
       
  }

  loadSession() {
    const saved = localStorage.getItem(this.key);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Corrupt session data.");
      }
    }
    // Default JSON structure for all requirements
    return {
      sessionId: "session_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8),
      startedAt: Date.now(),
      events: []
    };
  }

  save() {
    localStorage.setItem(this.key, JSON.stringify(this.session));
  }
    trackPageView() {
    const page = window.location.pathname.split('/').pop() || 'index.html';
    this.recordEvent('pageview', 'Viewed ' + page);
  }
  recordEvent(type, details) {
    const now = Date.now();
    const last = this.session.events[this.session.events.length - 1];   

// Anti-duplicate logic
    if (last && last.type === type && last.details === details && (now - last.time < 1000)) {
      return;
    }
    this.session.events.push({
      type: type,
      details: details,
      time: now
    });
    this.save();
    this.refreshUI();
  }

    initEventListeners() {
// Event Delegation for clicks
    document.addEventListener('click', (e) => {
      if (e.target.closest('#at-widget')) return; 

      const el = e.target;
        const tag = el.tagName.toLowerCase();
        const text = el.textContent.trim().substring(0, 20);
        let desc = tag;

        if (el.id) desc += ` (#${el.id})`;
        if (text) desc += ` "${text}"`; 

        this.recordEvent('click', desc);
    }, true); 
    
    // Event Delegation for form submission
    document.addEventListener('submit', (e) => {
        if (e.target.closest('#at-widget')) return;
        const id = e.target.id ? ` (#${e.target.id})` : 'Form';
        this.recordEvent('form', 'Submitted ' + id);
        }, true);
    }

    renderWidget() {
        if (document.getElementById('at-widget')) return;

        const widget = document.createElement('div');
        widget.id = 'at-widget';
        widget.innerHTML = `
            <button id="at-toggle">Tracker - <span id="at-badge">0</span></button>
            <div id="at-panel" class="at-hidden">
                <div id="at-header">
                <span>Session: ${this.session.sessionId.slice(-6)}</span>
                <button id="at-close">&times;</button>
            </div>
            <div id="at-stats">
                <div class="at-sbox"><span id="at-p-cnt">0</span><label>Pages</label></div>
                <div class="at-sbox"><span id="at-c-cnt">0</span><label>Clicks</label></div>
                <div class="at-sbox"><span id="at-f-cnt">0</span><label>Forms</label></div>
            </div>
            <div id="at-subhead">
                <span>Timeline</span>
                <button id="at-clear">Clear</button>
            </div>
            <ul id="at-list"></ul>
        </div>
    `;

    document.body.appendChild(widget);

    // UI Handlers

    document.getElementById('at-toggle').onclick = () => { 
        document.getElementById('at-panel').classList.toggle('at-hidden');
    };

    document.getElementById('at-close').onclick = () => {
        document.getElementById('at-panel').classList.add('at-hidden');
    };

    document.getElementById('at-clear').onclick = () => {
       if (confirm("Reset tracking?")) {
           this.session.events = [];
           this.save();
           this.refreshUI();    
       }
    }; 
}

refreshUI() {
    const evts = this.session.events || [];

    // Update stats
    const p = evts.filter(e => e.type === 'pageview').length;
    const c = evts.filter(e => e.type === 'click').length;
    const f = evts.filter(e => e.type === 'form').length;

    if (document.getElementById('at-badge')) {
        document.getElementById('at-badge').innerText = evts.length;
        document.getElementById('at-p-cnt').innerText = p;
        document.getElementById('at-c-cnt').innerText = c;
        document.getElementById('at-f-cnt').innerText = f;
    }

    // Update timeline
    const list = document.getElementById('at-list');
    if (!list) return;

    list.innerHTML = '';
    [...evts].reverse().forEach(ev => {
        const li = document.createElement('li');
        li.className = 'at-item';
        const time = new Date(ev.time).toLocaleTimeString([], { hour12: false });
        li.innerHTML = `<div><strong>${ev.type}</strong>: ${ev.details}</div><span class="at-time">${time}</span>`;
        list.appendChild(li);
    });
}
}

// Instantiate on DOM ready
document.addEventListener('DOMContentLoaded', () => new ActivityTracker());