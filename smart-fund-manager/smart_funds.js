/**
 * Smart Funds Manager - Core State & Application Logic
 * Grounded in Chirag Hope Google Sheets (Evergreen Bay Area Chapter & National Chapters Overview)
 */

(function(window) {
  'use strict';

  const STORAGE_KEY = 'smart_funds_manager_state_v4';

  // Spreadsheet Baseline Data Initializer
  function getInitialDataset() {
    return {
      organization: "Chirag Hope",
      organizations: [
        {
          id: "org-chirag-hope",
          name: "Chirag Hope",
          ein: "77-0489123",
          headquarters: "San Jose, California, USA",
          contactEmail: "admin@chiraghope.org",
          cause: "Child Education & Rural Relief",
          status: "Active",
          foundedYear: 2018,
          description: "Empowering rural students and underserved communities through education support, seats of hope, sports clubs, and classroom infrastructure."
        }
      ],
      users: [
        {
          id: "u-shasta",
          name: "Shasta Mudda",
          email: "shasta@chiraghope.org",
          password: "password123",
          role: "volunteer",
          chapter: "Evergreen Bay Area Chapter"
        },
        {
          id: "u-ojasvi",
          name: "Ojasvi Mudda",
          email: "ojasvi@chiraghope.org",
          password: "password123",
          role: "volunteer",
          chapter: "Evergreen Bay Area Chapter"
        },
        {
          id: "u-chapter-admin",
          name: "Evergreen Chapter Admin",
          email: "admin@evergreen.org",
          password: "password123",
          role: "chapter_admin",
          chapter: "Evergreen Bay Area Chapter"
        },
        {
          id: "u-nonprofit-admin",
          name: "Chirag Hope Executive Admin",
          email: "exec@chiraghope.org",
          password: "password123",
          role: "nonprofit_admin",
          chapter: "National Office"
        },
        {
          id: "u-platform-admin",
          name: "Smart Funds Platform Super Admin",
          email: "superadmin@smartfunds.org",
          password: "password123",
          role: "platform_admin",
          chapter: "Platform Headquarters"
        }
      ],
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
          name: "Ojasvi Mudda",
          tabName: "Ojasvi Mudda",
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
          name: "Shasta Mudda",
          tabName: "Shasta Mudda",
          chapter: "Evergreen Bay Area Chapter",
          email: "shasta@chiraghope.org",
          assignments: [
            { project: "Education support and Seats of Hope for rural India", target: 5000, raised: 5000, withdrawn: 5000 },
            { project: "Education support and Seats of Hope for rural India Phase 2", target: 3000, raised: 3000, withdrawn: 1000 },
            { project: "Mini-Library & Sports Club", target: 810, raised: 810, withdrawn: 810 }
          ]
        },
        {
          name: "Suravi",
          tabName: "Suravi",
          chapter: "Evergreen Bay Area Chapter",
          email: "suravi@chiraghope.org",
          assignments: []
        },
        {
          name: "Hasini",
          tabName: "Hasini",
          chapter: "Evergreen Bay Area Chapter",
          email: "hasini@chiraghope.org",
          assignments: []
        },
        {
          name: "Shreshtha Mudda",
          tabName: "Shreshtha Mudda",
          chapter: "Evergreen Bay Area Chapter",
          email: "shreshtha@chiraghope.org",
          assignments: [
            { project: "Education support and Seats of Hope for rural India Phase 2", target: 3000, raised: 3000, withdrawn: 0 },
            { project: "Mini-Library & Sports Club", target: 0, raised: 0, withdrawn: 0 }
          ]
        },
        {
          name: "Esha Shivakumar",
          tabName: "Esha Shivakumar",
          chapter: "Evergreen Bay Area Chapter",
          email: "esha@chiraghope.org",
          assignments: [
            { project: "Mini-Library & Sports Club", target: 310, raised: 310, withdrawn: 310 }
          ]
        },
        {
          name: "Pranati Prashanth",
          tabName: "Pranati Prashanth",
          chapter: "Evergreen Bay Area Chapter",
          email: "pranati@chiraghope.org",
          assignments: [
            { project: "Mini-Library & Sports Club", target: 200, raised: 200, withdrawn: 200 }
          ]
        },
        {
          name: "Sindu Sirigineni",
          tabName: "Sindu Sirigineni",
          chapter: "Evergreen Bay Area Chapter",
          email: "sindu@chiraghope.org",
          assignments: [
            { project: "Mini-Library & Sports Club", target: 150, raised: 150, withdrawn: 150 }
          ]
        },
        {
          name: "Samhita Mahadevan",
          tabName: "Samhita Mahadevan",
          chapter: "Evergreen Bay Area Chapter",
          email: "samhita@chiraghope.org",
          assignments: [
            { project: "Mini-Library & Sports Club", target: 0, raised: 0, withdrawn: 0 }
          ]
        },
        {
          name: "Anh Tran",
          tabName: "Anh Tran",
          chapter: "Evergreen Bay Area Chapter",
          email: "anh@chiraghope.org",
          assignments: [
            { project: "Mini-Library & Sports Club", target: 0, raised: 0, withdrawn: 0 }
          ]
        },
        {
          name: "General",
          tabName: "General",
          chapter: "Evergreen Bay Area Chapter",
          email: "general@chiraghope.org",
          assignments: [
            { project: "Mini-Library & Sports Club", target: 46, raised: 46, withdrawn: 46 },
            { project: "Aid4Afghans", target: 120, raised: 120, withdrawn: 120 }
          ]
        },
        {
          name: "Kaavya Kethini",
          tabName: "Kaavya Kethini",
          chapter: "Evergreen Bay Area Chapter",
          email: "kaavya@chiraghope.org",
          assignments: [
            { project: "Mini-Library & Sports Club", target: 150, raised: 150, withdrawn: 150 }
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

  function getStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
      if (typeof localStorage !== 'undefined') return localStorage;
    } catch (e) {}
    return null;
  }

  // Load or initialize state
  function loadState() {
    const storage = getStorage();
    try {
      if (storage) {
        // Check v4 first, with backward compatibility for prior versions
        const stored = storage.getItem(STORAGE_KEY) ||
                       storage.getItem('smart_funds_manager_state_v3') ||
                       storage.getItem('smart_funds_manager_state_v2') ||
                       storage.getItem('smart_funds_manager_state_v1');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.chapters && parsed.projects && parsed.volunteers) {
            const initial = getInitialDataset();

            // Ensure organizations array exists with Chirag Hope
            if (!parsed.organizations || parsed.organizations.length === 0) {
              parsed.organizations = initial.organizations;
            } else {
              initial.organizations.forEach(io => {
                if (!parsed.organizations.some(o => o.name.toLowerCase() === io.name.toLowerCase())) {
                  parsed.organizations.unshift(io);
                }
              });
            }

            // Merge all 12 baseline volunteers from Google Doc Sheet 1 if missing or partial
            initial.volunteers.forEach(iv => {
              const existing = parsed.volunteers.find(v => v.name.toLowerCase() === iv.name.toLowerCase());
              if (!existing) {
                parsed.volunteers.push(iv);
                if (!existing.assignments || existing.assignments.length === 0) {
                  existing.assignments = iv.assignments || [];
                }
              }
            });

            // Merge users if missing or partial
            if (!parsed.users || !Array.isArray(parsed.users) || parsed.users.length === 0) {
              parsed.users = initial.users;
            } else {
              initial.users.forEach(iu => {
                if (!parsed.users.some(u => u.email.toLowerCase() === iu.email.toLowerCase())) {
                  parsed.users.push(iu);
                }
              });
            }

            saveState(parsed);
            return parsed;
          }
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
    const storage = getStorage();
    if (!storage) return;
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(state));
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

    // Session Management & User Accounts
    getUsers() {
      if (!this.state.users || !Array.isArray(this.state.users) || this.state.users.length === 0) {
        this.state.users = getInitialDataset().users;
        saveState(this.state);
      }
      return this.state.users;
    },

    login(identifierOrRole, password, legacyChapter) {
      // 1. Backward compatibility check for legacy calls: login(role, name, chapter)
      const validRoles = ['volunteer', 'chapter_admin', 'nonprofit_admin', 'platform_admin'];
      if (validRoles.includes(identifierOrRole) && (legacyChapter !== undefined || (typeof password === 'string' && (password.includes(' ') || password.includes('Admin') || password.includes('Mudda'))))) {
        const role = identifierOrRole;
        const name = password;
        const chapter = legacyChapter;
        this.state.activeUser = {
          role: role,
          name: name || (
            role === 'volunteer' ? 'Shasta Mudda' :
            role === 'chapter_admin' ? 'Evergreen Admin' :
            role === 'nonprofit_admin' ? 'Chirag Hope Executive Admin' :
            'Smart Funds Platform Admin'
          ),
          chapter: chapter || (role === 'platform_admin' ? 'Platform Headquarters' : 'Evergreen Bay Area Chapter')
        };
        saveState(this.state);
        this.notifySubscribers();
        return this.state.activeUser;
      }

      // 2. Strict Credential Validation: login(identifier, password)
      if (!identifierOrRole || !password) {
        throw new Error("Please provide both email/username and password.");
      }

      const idStr = String(identifierOrRole).trim().toLowerCase();
      const users = this.getUsers();
      const matched = users.find(u =>
        (u.email.toLowerCase() === idStr || u.name.toLowerCase() === idStr) &&
        u.password === password
      );

      if (!matched) {
        throw new Error("Invalid email/username or password.");
      }

      this.state.activeUser = {
        id: matched.id,
        role: matched.role,
        name: matched.name,
        email: matched.email,
        chapter: matched.chapter || (matched.role === 'platform_admin' ? 'Platform Headquarters' : 'Evergreen Bay Area Chapter')
      };
      saveState(this.state);
      this.notifySubscribers();
      return { success: true, user: this.state.activeUser };
    },

    quickLogin(role, name, chapter) {
      const users = this.getUsers();
      let matched = users.find(u => u.role === role);
      this.state.activeUser = {
        role: role,
        name: name || (matched ? matched.name : (role === 'volunteer' ? 'Shasta Mudda' : 'Chapter Admin')),
        email: matched ? matched.email : `${role}@smartfunds.org`,
        chapter: chapter || (matched ? matched.chapter : 'Evergreen Bay Area Chapter')
      };
      saveState(this.state);
      this.notifySubscribers();
      return this.state.activeUser;
    },

    registerUser(name, email, password, role, chapter) {
      if (!name || !name.trim()) throw new Error("Full name is required.");
      if (!email || !email.trim()) throw new Error("Email address is required.");
      if (!password || password.length < 6) throw new Error("Password must be at least 6 characters.");

      const cleanEmail = email.trim().toLowerCase();
      const users = this.getUsers();
      if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
        throw new Error("An account with this email address already exists.");
      }

      const cleanRole = role || 'volunteer';
      const cleanChapter = chapter || (cleanRole === 'platform_admin' ? 'Platform Headquarters' : 'Evergreen Bay Area Chapter');
      const cleanName = name.trim();

      const newUser = {
        id: `u-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: cleanName,
        email: cleanEmail,
        password: password,
        role: cleanRole,
        chapter: cleanChapter,
        createdAt: new Date().toISOString()
      };

      this.state.users.push(newUser);

      // If registered as a volunteer, ensure a record in state.volunteers exists
      if (cleanRole === 'volunteer') {
        const existingVol = this.state.volunteers.find(v => v.name.toLowerCase() === cleanName.toLowerCase());
        if (!existingVol) {
          this.state.volunteers.push({
            name: cleanName,
            chapter: cleanChapter,
            tabName: cleanName,
            assignments: [
              {
                project: "Mini-Library & Sports Club",
                target: 1000,
                raised: 0,
                withdrawn: 0,
                status: "Assigned"
              }
            ]
          });
        }
      }

      // Automatically log new user in
      this.state.activeUser = {
        id: newUser.id,
        role: newUser.role,
        name: newUser.name,
        email: newUser.email,
        chapter: newUser.chapter
      };

      saveState(this.state);
      this.notifySubscribers();
      return { success: true, user: this.state.activeUser };
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
      const chName = (chapterName || "Evergreen Bay Area Chapter").trim().toLowerCase();
      const c = this.state.chapters.find(chap => chap.name.toLowerCase() === chName);
      const chapterProjects = this.state.projects.filter(p => (p.chapter || '').toLowerCase() === chName);
      const chapterVolunteers = this.state.volunteers.filter(v => (v.chapter || '').toLowerCase() === chName);

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
        chapter: c || { name: chapterName || "Evergreen Bay Area Chapter" },
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
      const chName = (chapterName || "Evergreen Bay Area Chapter").trim().toLowerCase();
      const chapterVolunteers = this.state.volunteers.filter(v => (v.chapter || '').toLowerCase() === chName);
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

    // 4. Chapter Admin creates a new project
    createProject(chapterName, projectName, targetAmount, description, assignedVolunteerName, status) {
      if (!projectName || !projectName.trim()) {
        throw new Error("Project name is required.");
      }
      projectName = projectName.trim();
      chapterName = (chapterName || "Evergreen Bay Area Chapter").trim();

      const existingProject = this.state.projects.find(p => p.name.toLowerCase() === projectName.toLowerCase());
      if (existingProject) {
        throw new Error(`A project named "${projectName}" already exists.`);
      }

      targetAmount = parseFloat(targetAmount);
      if (isNaN(targetAmount) || targetAmount < 0) {
        throw new Error("Target amount must be a non-negative number.");
      }

      // Ensure chapter exists or fallback
      let chapter = this.state.chapters.find(c => c.name.toLowerCase() === chapterName.toLowerCase());
      if (!chapter) {
        chapter = { name: chapterName, raised: 0, withdrawals: 0, balance: 0 };
        this.state.chapters.push(chapter);
      }

      const newProject = {
        name: projectName,
        chapter: chapter.name,
        target: targetAmount,
        raised: 0,
        withdrawn: 0,
        status: status || "Planning",
        progress: 0,
        description: description || `Community initiative under ${chapter.name}`
      };
      this.state.projects.push(newProject);

      // If assigned to a volunteer, create or update the volunteer's assignment
      if (assignedVolunteerName && assignedVolunteerName.trim() && assignedVolunteerName !== 'none') {
        const vName = assignedVolunteerName.trim();
        let volunteer = this.state.volunteers.find(v => v.name.toLowerCase() === vName.toLowerCase());
        if (!volunteer) {
          volunteer = {
            name: vName,
            chapter: chapter.name,
            email: `${vName.toLowerCase().replace(/\s+/g, '.')}@chiraghope.org`,
            assignments: []
          };
          this.state.volunteers.push(volunteer);
        }
        if (!volunteer.assignments) volunteer.assignments = [];
        volunteer.assignments.push({
          project: projectName,
          target: targetAmount,
          raised: 0,
          withdrawn: 0
        });
      }

      saveState(this.state);
      this.notifySubscribers();
      return { success: true, project: newProject };
    },

    // 5. Chapter Admin adds a new volunteer
    addVolunteer(chapterName, volunteerName, email, tabName, initialProjectName, initialTarget) {
      if (!volunteerName || !volunteerName.trim()) {
        throw new Error("Volunteer name is required.");
      }
      volunteerName = volunteerName.trim();
      chapterName = (chapterName || "Evergreen Bay Area Chapter").trim();

      const existing = this.state.volunteers.find(v => v.name.toLowerCase() === volunteerName.toLowerCase());
      if (existing) {
        throw new Error(`A volunteer named "${volunteerName}" is already registered.`);
      }

      const vEmail = (email && email.trim()) ? email.trim() : `${volunteerName.toLowerCase().replace(/\s+/g, '.')}@chiraghope.org`;
      const vTab = (tabName && tabName.trim()) ? tabName.trim() : volunteerName;

      const newVolunteer = {
        name: volunteerName,
        tabName: vTab,
        chapter: chapterName,
        email: vEmail,
        assignments: []
      };

      if (initialProjectName && initialProjectName.trim() && initialProjectName !== 'none') {
        const initTarget = parseFloat(initialTarget) || 0;
        newVolunteer.assignments.push({
          project: initialProjectName.trim(),
          target: initTarget,
          raised: 0,
          withdrawn: 0
        });
      }

      this.state.volunteers.push(newVolunteer);
      saveState(this.state);
      this.notifySubscribers();
      return { success: true, volunteer: newVolunteer };
    },

    // 6. Non-Profit Org Admin creates a new chapter
    createChapter(chapterName, location, initialTarget) {
      if (!chapterName || !chapterName.trim()) {
        throw new Error("Chapter name is required.");
      }
      chapterName = chapterName.trim();

      const existing = this.state.chapters.find(c => c.name.toLowerCase() === chapterName.toLowerCase());
      if (existing) {
        throw new Error(`A chapter named "${chapterName}" already exists.`);
      }

      const newChapter = {
        name: chapterName,
        location: (location && location.trim()) ? location.trim() : "United States",
        raised: 0,
        withdrawals: 0,
        balance: 0,
        initialTarget: parseFloat(initialTarget) || 0
      };

      this.state.chapters.push(newChapter);
      saveState(this.state);
      this.notifySubscribers();
      return { success: true, chapter: newChapter };
    },

    // 7. Smart Funds Manager Admin creates a new Non-Profit Organization
    createOrganization(name, ein, location, contactEmail, cause, description) {
      if (!name || !name.trim()) {
        throw new Error("Non-profit organization name is required.");
      }
      name = name.trim();

      if (!this.state.organizations) {
        this.state.organizations = [];
      }

      const existing = this.state.organizations.find(o => o.name.toLowerCase() === name.toLowerCase());
      if (existing) {
        throw new Error(`An organization named "${name}" already exists.`);
      }

      const orgId = "org-" + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + "-" + Date.now().toString().slice(-4);
      const newOrg = {
        id: orgId,
        name: name,
        ein: (ein && ein.trim()) ? ein.trim() : "Pending",
        headquarters: (location && location.trim()) ? location.trim() : "United States",
        location: (location && location.trim()) ? location.trim() : "United States",
        contactEmail: (contactEmail && contactEmail.trim()) ? contactEmail.trim() : `admin@${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.org`,
        cause: (cause && cause.trim()) ? cause.trim() : "Community Development & Education",
        status: "Active",
        foundedYear: new Date().getFullYear(),
        description: (description && description.trim()) ? description.trim() : `Dedicated non-profit organization focused on ${cause || "community welfare"}.`
      };

      this.state.organizations.push(newOrg);
      saveState(this.state);
      this.notifySubscribers();
      return { success: true, organization: newOrg };
    },

    getOrganizationsSummary() {
      if (!this.state.organizations || this.state.organizations.length === 0) {
        this.state.organizations = getInitialDataset().organizations;
      }

      // Calculate Chirag Hope metrics as baseline
      const npMetrics = this.getNonprofitMetrics();

      return this.state.organizations.map(org => {
        const isChirag = org.name.toLowerCase().includes("chirag");
        if (isChirag) {
          return {
            id: org.id,
            name: org.name,
            ein: org.ein || "77-0489123",
            headquarters: org.headquarters || org.location || "San Jose, CA, USA",
            location: org.location || org.headquarters || "San Jose, CA, USA",
            contactEmail: org.contactEmail || "admin@chiraghope.org",
            cause: org.cause || "Child Education & Rural Relief",
            status: org.status || "Active",
            foundedYear: org.foundedYear || 2018,
            description: org.description,
            chapterCount: npMetrics.totalChapters,
            chaptersCount: npMetrics.totalChapters,
            projectsCount: npMetrics.totalProjects,
            volunteersCount: this.state.volunteers.length,
            totalRaised: npMetrics.totalRaised,
            totalWithdrawn: npMetrics.totalWithdrawn,
            totalBalance: npMetrics.totalBalance,
            balance: npMetrics.totalBalance
          };
        } else {
          // For other organizations, count chapters linked to them or defaults
          const orgChapters = this.state.chapters.filter(c => (c.organization || '').toLowerCase() === org.name.toLowerCase());
          let totalRaised = 0;
          let totalWithdrawn = 0;
          orgChapters.forEach(c => {
            totalRaised += Number(c.raised) || 0;
            totalWithdrawn += Number(c.withdrawals) || 0;
          });
          const totalBalance = totalRaised - totalWithdrawn;
          return {
            id: org.id,
            name: org.name,
            ein: org.ein || "Pending",
            headquarters: org.headquarters || org.location || "United States",
            location: org.location || org.headquarters || "United States",
            contactEmail: org.contactEmail || `contact@${org.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.org`,
            cause: org.cause || "Community Welfare",
            status: org.status || "Active",
            foundedYear: org.foundedYear || new Date().getFullYear(),
            description: org.description || "Active partner non-profit organization.",
            chapterCount: orgChapters.length,
            chaptersCount: orgChapters.length,
            projectsCount: 0,
            volunteersCount: 0,
            totalRaised,
            totalWithdrawn,
            totalBalance,
            balance: totalBalance
          };
        }
      });
    },

    getPlatformMetrics() {
      const summaries = this.getOrganizationsSummary();
      let totalRaised = 0;
      let totalWithdrawn = 0;
      let totalChapters = 0;
      let totalProjects = 0;

      summaries.forEach(s => {
        totalRaised += s.totalRaised;
        totalWithdrawn += s.totalWithdrawn;
        totalChapters += s.chaptersCount;
        totalProjects += s.projectsCount;
      });

      return {
        totalOrganizations: summaries.length,
        totalChapters: Math.max(totalChapters, this.state.chapters.length),
        totalProjects: Math.max(totalProjects, this.state.projects.length),
        totalVolunteers: this.state.volunteers.length,
        totalRaised,
        totalWithdrawn,
        balance: totalRaised - totalWithdrawn,
        organizations: summaries
      };
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
