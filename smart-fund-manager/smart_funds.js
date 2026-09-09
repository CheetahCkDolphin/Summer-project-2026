/**
 * Smart Funds Manager - Core State & Application Logic
 * Grounded in Chirag Hope Google Sheets (Evergreen Bay Area Chapter & National Chapters Overview)
 */

(function(window) {
  'use strict';

  const STORAGE_KEY = 'smart_funds_manager_state_v1';

  // Spreadsheet Baseline Data Initializer
  function getInitialDataset() {
    return {
      organization: "Chirag Hope",
      chapters: [
        { name: "Evergreen Bay Area Chapter", raised: 20070, withdrawals: 13186, balance: 6884 },
        { name: "Washington D.C Chapter", raised: 22000, withdrawals: 10000, balance: 12000 },
        { name: "Orange County Chapter", raised: 13093, withdrawals: 12000, balance: 1093 },
        { name: "Fremont Chapter", raised: 9000, withdrawals: 0, balance: 9000 },
        { name: "San Jose Chapter", raised: 3000, withdrawals: 3000, balance: 0 },
        { name: "Sunnyvale Chapter", raised: 0, withdrawals: 472, balance: -472 },
        { name: "Cupertino Chapter", raised: 0, withdrawals: 0, balance: 0 },
        { name: "Frisco Chapter", raised: 0, withdrawals: 0, balance: 0 },
        { name: "Michigan Chapter", raised: 0, withdrawals: 0, balance: 0 },
        { name: "New Jersey Chapter", raised: 0, withdrawals: 0, balance: 0 },
        { name: "Seattle Chapter", raised: 0, withdrawals: 0, balance: 0 },
        { name: "Virginia Chapter", raised: 0, withdrawals: 0, balance: 0 }
      ],
      projects: [
        {
          id: "p1",
          name: "Aid4Afghans",
          chapter: "Evergreen Bay Area Chapter",
          target: 120,
          raised: 120,
          withdrawn: 120,
          status: "Complete",
          progress: 100,
          notes: "Relief funds delivered to Afghan refugee families."
        },
        {
          id: "p2",
          name: "Chirag O2 & Food - Support for 2nd Covid Wave",
          chapter: "Evergreen Bay Area Chapter",
          target: 1500,
          raised: 1500,
          withdrawn: 1500,
          status: "Complete",
          progress: 100,
          notes: "Oxygen concentrators and meal packages distributed."
        },
        {
          id: "p3",
          name: "Education support and Seats of Hope for rural India",
          chapter: "Evergreen Bay Area Chapter",
          target: 6000,
          raised: 6000,
          withdrawn: 6000,
          status: "Complete",
          progress: 100,
          notes: "Classroom benches and school kits delivered."
        },
        {
          id: "p4",
          name: "Education support and Seats of Hope for rural India Phase 2",
          chapter: "Evergreen Bay Area Chapter",
          target: 9000,
          raised: 9000,
          withdrawn: 2116,
          status: "In Progress",
          progress: 65,
          notes: "Phase 2 in progress: furniture ordered for 8 village schools."
        },
        {
          id: "p5",
          name: "Mini-Library & Sports Club",
          chapter: "Evergreen Bay Area Chapter",
          target: 3450,
          raised: 3450,
          withdrawn: 3450,
          status: "Complete",
          progress: 100,
          notes: "Books, shelves, and sports kits deployed."
        },
        {
          id: "p6",
          name: "MIssionKids",
          chapter: "Fremont Chapter",
          target: 9000,
          raised: 9000,
          withdrawn: 0,
          status: "In Progress",
          progress: 50,
          notes: "Health & nutrition drive underway."
        },
        {
          id: "p7",
          name: "Anganwadi",
          chapter: "Orange County Chapter",
          target: 12000,
          raised: 13093,
          withdrawn: 12000,
          status: "In Progress",
          progress: 90,
          notes: "Preschool center infrastructure upgrades ongoing."
        },
        {
          id: "p8",
          name: "Safe School #1",
          chapter: "San Jose Chapter",
          target: 3000,
          raised: 3000,
          withdrawn: 3000,
          status: "Complete",
          progress: 100,
          notes: "Sanitation and clean drinking water facilities completed."
        },
        {
          id: "p9",
          name: "Aid4Amputees",
          chapter: "Washington D.C Chapter",
          target: 35000,
          raised: 22000,
          withdrawn: 10000,
          status: "In Progress",
          progress: 60,
          notes: "Prosthetic limb fittings organized."
        },
        {
          id: "p10",
          name: "Vision Rehab Treatment",
          chapter: "Washington D.C Chapter",
          target: 3500,
          raised: 0,
          withdrawn: 0,
          status: "Planning",
          progress: 10,
          notes: "Doctor partnership finalized."
        },
        {
          id: "p11",
          name: "CHIRAG O2 & FOOD",
          chapter: "Michigan Chapter",
          target: 7000,
          raised: 0,
          withdrawn: 0,
          status: "Planning",
          progress: 0,
          notes: "Campaign kickoff scheduled."
        },
        {
          id: "p12",
          name: "DEESHA Project Noteworthy",
          chapter: "Sunnyvale Chapter",
          target: 472,
          raised: 0,
          withdrawn: 472,
          status: "Execution",
          progress: 75,
          notes: "Educational devices procured via bridge funding."
        },
        {
          id: "p13",
          name: "General Donation",
          chapter: "New Jersey Chapter",
          target: 2000,
          raised: 0,
          withdrawn: 0,
          status: "Planning",
          progress: 0,
          notes: "General chapter operations support."
        },
        {
          id: "p14",
          name: "Project X",
          chapter: "Cupertino Chapter",
          target: 200,
          raised: 0,
          withdrawn: 0,
          status: "Planning",
          progress: 0,
          notes: "Pilot community initiative."
        }
      ],
      volunteers: [
        {
          name: "Shasta Mudda",
          chapter: "Evergreen Bay Area Chapter",
          email: "shasta@chiraghope.org",
          assignments: [
            { project: "Education support and Seats of Hope for rural India", target: 5000, raised: 5000, withdrawn: 5000 },
            { project: "Education support and Seats of Hope for rural India Phase 2", target: 3000, raised: 3000, withdrawn: 1000 },
            { project: "Mini-Library & Sports Club", target: 810, raised: 810, withdrawn: 810 }
          ]
        },
        {
          name: "Ojasvi Mudda",
          chapter: "Evergreen Bay Area Chapter",
          email: "ojasvi@chiraghope.org",
          assignments: [
            { project: "Mini-Library & Sports Club", target: 1784, raised: 1784, withdrawn: 1784 },
            { project: "Chirag O2 & Food - Support for 2nd Covid Wave", target: 1500, raised: 1500, withdrawn: 1500 },
            { project: "Education support and Seats of Hope for rural India Phase 2", target: 3000, raised: 3000, withdrawn: 1116 },
            { project: "Education support and Seats of Hope for rural India", target: 1000, raised: 1000, withdrawn: 1000 }
          ]
        },
        {
          name: "Shreshtha Mudda",
          chapter: "Evergreen Bay Area Chapter",
          email: "shreshtha@chiraghope.org",
          assignments: [
            { project: "Education support and Seats of Hope for rural India Phase 2", target: 3000, raised: 3000, withdrawn: 0 },
            { project: "Mini-Library & Sports Club", target: 0, raised: 0, withdrawn: 0 }
          ]
        },
        {
          name: "Esha Shivkumar",
          chapter: "Evergreen Bay Area Chapter",
          email: "esha@chiraghope.org",
          assignments: [
            { project: "Mini-Library & Sports Club", target: 310, raised: 310, withdrawn: 310 }
          ]
        },
        {
          name: "Pranati Prashanth",
          chapter: "Evergreen Bay Area Chapter",
          email: "pranati@chiraghope.org",
          assignments: [
            { project: "Mini-Library & Sports Club", target: 200, raised: 200, withdrawn: 200 }
          ]
        },
        {
          name: "Sindu Sirigineni",
          chapter: "Evergreen Bay Area Chapter",
          email: "sindu@chiraghope.org",
          assignments: [
            { project: "Mini-Library & Sports Club", target: 150, raised: 150, withdrawn: 150 }
          ]
        },
        {
          name: "Kaavya Kethini",
          chapter: "Evergreen Bay Area Chapter",
          email: "kaavya@chiraghope.org",
          assignments: [
            { project: "Mini-Library & Sports Club", target: 150, raised: 150, withdrawn: 150 }
          ]
        },
        {
          name: "Samhita Mahadevan",
          chapter: "Evergreen Bay Area Chapter",
          email: "samhita@chiraghope.org",
          assignments: [
            { project: "Mini-Library & Sports Club", target: 0, raised: 0, withdrawn: 0 }
          ]
        },
        {
          name: "Anh Tran",
          chapter: "Evergreen Bay Area Chapter",
          email: "anh@chiraghope.org",
          assignments: [
            { project: "Mini-Library & Sports Club", target: 0, raised: 0, withdrawn: 0 }
          ]
        },
        {
          name: "General",
          chapter: "Evergreen Bay Area Chapter",
          email: "general@chiraghope.org",
          assignments: [
            { project: "Mini-Library & Sports Club", target: 46, raised: 46, withdrawn: 46 },
            { project: "Aid4Afghans", target: 120, raised: 120, withdrawn: 120 }
          ]
        }
      ],
      transactions: [
        {
          id: "tx-init-1",
          date: "2026-06-15",
          type: "donation",
          volunteer: "Shasta Mudda",
          chapter: "Evergreen Bay Area Chapter",
          project: "Education support and Seats of Hope for rural India Phase 2",
          amount: 3000,
          donor: "Community Donors & Matching",
          notes: "Campaign kickoff for school benches"
        },
        {
          id: "tx-init-2",
          date: "2026-07-02",
          type: "withdrawal",
          volunteer: "Shasta Mudda",
          chapter: "Evergreen Bay Area Chapter",
          project: "Education support and Seats of Hope for rural India Phase 2",
          amount: 1000,
          purpose: "Down payment to wood furniture vendor for 4 schools",
          notes: "Receipt #WH-4401"
        }
      ],
      activeUser: null // Current session { role: 'volunteer'|'chapter_admin'|'nonprofit_admin', name: string, chapter: string }
    };
  }

  // Load or initialize state
  function loadState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.chapters && parsed.projects && parsed.volunteers) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Could not load Smart Funds state from localStorage, initializing fresh:", e);
    }
    const fresh = getInitialDataset();
    saveState(fresh);
    return fresh;
  }

  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("Failed to persist Smart Funds state:", e);
    }
  }

  // Helper formatting
  function formatCurrency(amount) {
    const num = Number(amount) || 0;
    return (num < 0 ? "-" : "") + "$" + Math.abs(num).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  // Smart Funds Manager Object
  const SmartFunds = {
    state: loadState(),

    resetToDefault() {
      this.state = getInitialDataset();
      saveState(this.state);
      this.notifySubscribers();
    },

    // Session Management
    login(role, name, chapter) {
      this.state.activeUser = {
        role: role,
        name: name || (role === 'volunteer' ? 'Shasta Mudda' : role === 'chapter_admin' ? 'Evergreen Admin' : 'Chirag Hope Executive Admin'),
        chapter: chapter || 'Evergreen Bay Area Chapter'
      };
      saveState(this.state);
      this.notifySubscribers();
      return this.state.activeUser;
    },

    logout() {
      this.state.activeUser = null;
      saveState(this.state);
      this.notifySubscribers();
    },

    getActiveUser() {
      return this.state.activeUser;
    },

    // Financial Calculation Engines
    getVolunteerMetrics(volunteerName) {
      const v = this.state.volunteers.find(vol => vol.name.toLowerCase() === volunteerName.toLowerCase()) || { assignments: [] };
      let totalRaised = 0;
      let totalTarget = 0;
      let totalWithdrawn = 0;

      v.assignments.forEach(a => {
        totalRaised += (Number(a.raised) || 0);
        totalTarget += (Number(a.target) || 0);
        totalWithdrawn += (Number(a.withdrawn) || 0);
      });

      const toBeRaised = Math.max(0, totalTarget - totalRaised);
      const balance = totalRaised - totalWithdrawn;

      return {
        volunteer: v,
        totalRaised,
        totalTarget,
        toBeRaised,
        totalWithdrawn,
        balance
      };
    },

    getChapterMetrics(chapterName) {
      const c = this.state.chapters.find(chap => chap.name.toLowerCase() === chapterName.toLowerCase());
      const chapterProjects = this.state.projects.filter(p => p.chapter.toLowerCase() === chapterName.toLowerCase());
      const chapterVolunteers = this.state.volunteers.filter(v => v.chapter.toLowerCase() === chapterName.toLowerCase());

      let totalRaised = 0;
      let totalTarget = 0;
      let totalWithdrawn = 0;

      chapterProjects.forEach(p => {
        totalRaised += (Number(p.raised) || 0);
        totalTarget += (Number(p.target) || 0);
        totalWithdrawn += (Number(p.withdrawn) || 0);
      });

      const toBeRaised = Math.max(0, totalTarget - totalRaised);
      const balance = totalRaised - totalWithdrawn;

      return {
        chapter: c || { name: chapterName },
        projects: chapterProjects,
        volunteers: chapterVolunteers,
        totalRaised,
        totalTarget,
        toBeRaised,
        totalWithdrawn,
        balance
      };
    },

    getChapterVolunteersOverview(chapterName) {
      const chapterVolunteers = this.state.volunteers.filter(v => v.chapter.toLowerCase() === chapterName.toLowerCase());
      return chapterVolunteers.map(v => {
        let totalRaised = 0;
        let totalTarget = 0;
        let totalWithdrawn = 0;
        const projectNames = [];

        (v.assignments || []).forEach(a => {
          totalRaised += (Number(a.raised) || 0);
          totalTarget += (Number(a.target) || 0);
          totalWithdrawn += (Number(a.withdrawn) || 0);
          if (a.project && !projectNames.includes(a.project)) {
            projectNames.push(a.project);
          }
        });

        const toBeRaised = Math.max(0, totalTarget - totalRaised);
        const balance = totalRaised - totalWithdrawn;
        const progress = totalTarget > 0 ? Math.round((totalRaised / totalTarget) * 100) : 100;

        return {
          name: v.name,
          email: v.email || `${v.name.toLowerCase().replace(/\s+/g, '.')}@chiraghope.org`,
          chapter: v.chapter,
          projectsCount: (v.assignments || []).length,
          projectNames: projectNames,
          totalRaised,
          totalTarget,
          toBeRaised,
          totalWithdrawn,
          balance,
          progress,
          assignments: v.assignments || []
        };
      });
    },

    getChapterVolunteerDetail(chapterName, volunteerName) {
      const overview = this.getChapterVolunteersOverview(chapterName);
      return overview.find(v => v.name.toLowerCase() === volunteerName.toLowerCase()) || null;
    },

    getNonprofitMetrics() {
      let totalRaised = 0;
      let totalTarget = 0;
      let totalWithdrawn = 0;

      this.state.projects.forEach(p => {
        totalRaised += (Number(p.raised) || 0);
        totalTarget += (Number(p.target) || 0);
        totalWithdrawn += (Number(p.withdrawn) || 0);
      });

      const totalBalance = totalRaised - totalWithdrawn;

      return {
        organization: this.state.organization,
        totalRaised,
        totalTarget,
        totalWithdrawn,
        totalBalance,
        totalChapters: this.state.chapters.length,
        totalProjects: this.state.projects.length,
        chapters: this.state.chapters
      };
    },

    // Operations
    // 1. Volunteer raises funds for a project
    raiseFunds(volunteerName, projectName, amount, donorName, notes) {
      amount = parseFloat(amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Contribution amount must be a positive number.");
      }

      // 1. Update Project
      const project = this.state.projects.find(p => p.name.toLowerCase() === projectName.toLowerCase());
      if (!project) {
        throw new Error(`Project "${projectName}" not found.`);
      }
      project.raised = (Number(project.raised) || 0) + amount;
      if (project.raised >= project.target && project.status === "Planning") {
        project.status = "In Progress";
      }

      // 2. Update Chapter
      const chapter = this.state.chapters.find(c => c.name.toLowerCase() === project.chapter.toLowerCase());
      if (chapter) {
        chapter.raised = (Number(chapter.raised) || 0) + amount;
        chapter.balance = chapter.raised - chapter.withdrawals;
      }

      // 3. Update Volunteer Assignment
      let volunteer = this.state.volunteers.find(v => v.name.toLowerCase() === volunteerName.toLowerCase());
      if (!volunteer) {
        volunteer = {
          name: volunteerName,
          chapter: project.chapter,
          email: `${volunteerName.toLowerCase().replace(/\s+/g, '.')}@chiraghope.org`,
          assignments: []
        };
        this.state.volunteers.push(volunteer);
      }

      let assignment = volunteer.assignments.find(a => a.project.toLowerCase() === projectName.toLowerCase());
      if (!assignment) {
        assignment = { project: project.name, target: amount, raised: 0, withdrawn: 0 };
        volunteer.assignments.push(assignment);
      }
      assignment.raised = (Number(assignment.raised) || 0) + amount;

      // 4. Record Transaction
      const tx = {
        id: "tx-" + Date.now(),
        date: new Date().toISOString().split('T')[0],
        type: "donation",
        volunteer: volunteerName,
        chapter: project.chapter,
        project: project.name,
        amount: amount,
        donor: donorName || "Anonymous Supporter",
        notes: notes || "Direct fundraising contribution"
      };
      this.state.transactions.unshift(tx);

      saveState(this.state);
      this.notifySubscribers();
      return { success: true, transaction: tx, project: project };
    },

    // 2. Volunteer / Chapter executes project updates
    executeProject(projectName, progressPercent, status, updateNotes) {
      const project = this.state.projects.find(p => p.name.toLowerCase() === projectName.toLowerCase());
      if (!project) {
        throw new Error(`Project "${projectName}" not found.`);
      }

      if (progressPercent !== undefined && progressPercent !== null && progressPercent !== "") {
        project.progress = Math.min(100, Math.max(0, parseInt(progressPercent, 10) || 0));
      }
      if (status) {
        project.status = status;
        if (status === "Complete") {
          project.progress = 100;
        }
      }
      if (updateNotes) {
        project.notes = updateNotes;
      }

      saveState(this.state);
      this.notifySubscribers();
      return { success: true, project: project };
    },

    // 3. Volunteer / Chapter withdraws funds for project execution
    withdrawFunds(volunteerName, projectName, amount, purpose, vendorReceipt) {
      amount = parseFloat(amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Withdrawal amount must be a positive number.");
      }

      const project = this.state.projects.find(p => p.name.toLowerCase() === projectName.toLowerCase());
      if (!project) {
        throw new Error(`Project "${projectName}" not found.`);
      }

      const currentBalance = (Number(project.raised) || 0) - (Number(project.withdrawn) || 0);
      if (amount > currentBalance) {
        throw new Error(`Insufficient funds: Requested withdrawal of ${formatCurrency(amount)} exceeds available project balance of ${formatCurrency(currentBalance)}.`);
      }

      // Update Project
      project.withdrawn = (Number(project.withdrawn) || 0) + amount;

      // Update Chapter
      const chapter = this.state.chapters.find(c => c.name.toLowerCase() === project.chapter.toLowerCase());
      if (chapter) {
        chapter.withdrawals = (Number(chapter.withdrawals) || 0) + amount;
        chapter.balance = chapter.raised - chapter.withdrawals;
      }

      // Update Volunteer Assignment
      if (volunteerName) {
        const volunteer = this.state.volunteers.find(v => v.name.toLowerCase() === volunteerName.toLowerCase());
        if (volunteer) {
          const assignment = volunteer.assignments.find(a => a.project.toLowerCase() === projectName.toLowerCase());
          if (assignment) {
            assignment.withdrawn = (Number(assignment.withdrawn) || 0) + amount;
          }
        }
      }

      // Record Transaction
      const tx = {
        id: "tx-" + Date.now(),
        date: new Date().toISOString().split('T')[0],
        type: "withdrawal",
        volunteer: volunteerName || "Chapter Admin",
        chapter: project.chapter,
        project: project.name,
        amount: amount,
        purpose: purpose || "Project Execution Expense",
        notes: vendorReceipt || "Disbursement documented"
      };
      this.state.transactions.unshift(tx);

      saveState(this.state);
      this.notifySubscribers();
      return { success: true, transaction: tx, project: project };
    },

    // Change listeners for UI reactivity
    subscribers: [],
    subscribe(callback) {
      if (typeof callback === 'function') {
        this.subscribers.push(callback);
      }
    },
    notifySubscribers() {
      this.subscribers.forEach(cb => {
        try { cb(this.state); } catch (e) { console.error("Subscriber error:", e); }
      });
    },

    formatCurrency: formatCurrency
  };

  window.SmartFunds = SmartFunds;
})(window);
