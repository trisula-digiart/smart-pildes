/**
 * ==========================================================
 * PILKADES VICTORY SYSTEM - CLIENT SIDE ENGINE RUNTIME v7.1.6
 * Features: Indestructible global event delegation (Logout priority),
 *           Robust token-session restoration,
 *           Direct Google Drive image stream converter (Contain Mode),
 *           Comprehensive DPT/Vote Matrix Filter Engine.
 * ==========================================================
 */

// !!! TEMPELKAN URL WEB APP GOOGLE APPS SCRIPT (GAS) LU DI SINI UNTUK MODE CLOUD !!!
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbyCctiDjoWcgTPHqDghNC-HUfuUSuLHa0nqoSX384HuAtrtujumwsr-DpylQyVK6gYA/exec"; 

const appEngine = {
  isSimulation: false,
  session: {
    user: null,
    settings: null,
    dbCache: null
  },

  init: async function() {
    this.checkDatabaseFallback();
    this.bindGlobalDelegation();
    this.auth.checkSession();
  },

  checkDatabaseFallback: function() {
    if (!GAS_API_URL || GAS_API_URL.trim() === "") {
      this.isSimulation = true;
      console.log("⚠️ TRISULA KERNEL: GAS_API_URL kosong. Beralih ke Mode Simulasi Offline.");
      
      if (!localStorage.getItem("sim_app_settings")) {
        localStorage.setItem("sim_app_settings", JSON.stringify({
          nama_calon_kades: "Ahmad Dwi Saputra",
          drive_id_foto_paslon: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150",
          drive_id_banner_login: ""
        }));
      }
      if (!localStorage.getItem("sim_users")) {
        localStorage.setItem("sim_users", JSON.stringify([
          { user_id: "USR-01", username: "admin", password_hash: "admin123", nama_lengkap: "Ahmad Dwi Saputra", role: "ADMIN", status_aktif: "Active" },
          { user_id: "USR-02", username: "timses1", password_hash: "timses123", nama_lengkap: "Rahmat Lapangan", role: "TIMSES", status_aktif: "Active" },
          { user_id: "USR-03", username: "timses2", password_hash: "timses123", nama_lengkap: "Budi Wijaya", role: "TIMSES", status_aktif: "Active" }
        ]));
      }
      if (!localStorage.getItem("sim_data_dpt")) {
        localStorage.setItem("sim_data_dpt", JSON.stringify([
          { nik: "3201010101010001", no_kk: "3201010102020001", nama_warga: "Supardi Santoso", dusun: "Krajan", rt: "01", rw: "02", tps_id: "TPS-01" },
          { nik: "3201010101010002", no_kk: "3201010102020001", nama_warga: "Siti Maimunah", dusun: "Krajan", rt: "01", rw: "02", tps_id: "TPS-01" },
          { nik: "3201010101010003", no_kk: "3201010102020002", nama_warga: "Slamet Junaidi", dusun: "Krajan", rt: "02", rw: "02", tps_id: "TPS-01" },
          { nik: "3201010101010004", no_kk: "3201010102020003", nama_warga: "Joko Triyono", dusun: "Ngraho", rt: "01", rw: "01", tps_id: "TPS-02" },
          { nik: "3201010101010005", no_kk: "3201010102020003", nama_warga: "Siti Aminah", dusun: "Ngraho", rt: "01", rw: "01", tps_id: "TPS-02" }
        ]));
      }
      if (!localStorage.getItem("sim_warga_voters")) {
        localStorage.setItem("sim_warga_voters", JSON.stringify([
          { voter_id: "VTR-01", nik: "3201010101010005", klasifikasi: "PRO", input_by_user_id: "USR-02", created_at: new Date().toISOString() },
          { voter_id: "VTR-02", nik: "3201010101010001", klasifikasi: "KONTRA", input_by_user_id: "USR-02", created_at: new Date().toISOString() },
          { voter_id: "VTR-03", nik: "3201010101010004", klasifikasi: "RAGU-RAGU", input_by_user_id: "USR-03", created_at: new Date().toISOString() }
        ]));
      }
    }
  },

  request: async function(action, payload = {}) {
    if (this.isSimulation) {
      return this.handleLocalSimulation(action, payload);
    }

    try {
      const response = await fetch(GAS_API_URL, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action, ...payload })
      });
      return await response.json();
    } catch (error) {
      console.error("❌ Cloud API connection failed. Force falling back to local simulation.", error);
      this.isSimulation = true;
      return this.handleLocalSimulation(action, payload);
    }
  },

  handleLocalSimulation: function(action, payload) {
    const settings = JSON.parse(localStorage.getItem("sim_app_settings"));
    const users = JSON.parse(localStorage.getItem("sim_users"));
    const dpt = JSON.parse(localStorage.getItem("sim_data_dpt"));
    const voters = JSON.parse(localStorage.getItem("sim_warga_voters"));

    switch(action) {
      case "login":
        const matched = users.find(u => u.username === payload.username && u.password_hash === payload.password);
        if (matched) {
          if (matched.status_aktif !== "Active") {
            return { status: "error", message: "Akses Ditolak: Akun Anda dinonaktifkan!" };
          }
          return {
            status: "success",
            token: "SIM-TOKEN-" + Math.floor(Math.random() * 10000000),
            user: { user_id: matched.user_id, nama_lengkap: matched.nama_lengkap, role: matched.role.toUpperCase() }
          };
        }
        return { status: "error", message: "Username atau password salah!" };

      case "getAdminDashboard":
        const proCount = voters.filter(v => v.klasifikasi === "PRO").length;
        const kontraCount = voters.filter(v => v.klasifikasi === "KONTRA").length;
        const raguCount = voters.filter(v => v.klasifikasi === "RAGU-RAGU" || v.klasifikasi === "RAGU").length;
        
        const votersList = voters.map(v => {
          const d = dpt.find(item => item.nik === v.nik) || {};
          const u = users.find(user => user.user_id === v.input_by_user_id) || {};
          return {
            voter_id: v.voter_id,
            nik: v.nik,
            nama: d.nama_warga || "Tidak Terdaftar",
            dusun: d.dusun || "-",
            rt: d.rt || "-",
            rw: d.rw || "-",
            rt_rw: `RT ${d.rt || '-'} / RW ${d.rw || '-'}`,
            klasifikasi: v.klasifikasi,
            input_by: u.nama_lengkap || "Sistem",
            input_by_user_id: v.input_by_user_id,
            created_at: v.created_at
          };
        });

        const zoneMap = {};
        dpt.forEach(item => {
          const key = `${item.dusun} - RT ${item.rt} / RW ${item.rw}`;
          if (!zoneMap[key]) {
            zoneMap[key] = { zone: key, dpt: 0, pro: 0, kontra: 0, ragu: 0 };
          }
          zoneMap[key].dpt++;
        });

        voters.forEach(v => {
          const d = dpt.find(item => item.nik === v.nik);
          if (d) {
            const key = `${d.dusun} - RT ${d.rt} / RW ${d.rw}`;
            if (zoneMap[key]) {
              if (v.klasifikasi === "PRO") zoneMap[key].pro++;
              if (v.klasifikasi === "KONTRA") zoneMap[key].kontra++;
              if (v.klasifikasi === "RAGU-RAGU" || v.klasifikasi === "RAGU") zoneMap[key].ragu++;
            }
          }
        });

        return {
          status: "success",
          branding: settings,
          metrics: {
            total_dpt: dpt.length,
            total_terdata: voters.length,
            pro: proCount,
            kontra: kontraCount,
            ragu: raguCount,
            pro_percentage: dpt.length > 0 ? ((proCount / dpt.length) * 100).toFixed(1) : "0.0"
          },
          voters: votersList,
          zoning: Object.keys(zoneMap).map(k => zoneMap[k]),
          dptMaster: dpt,
          timsesList: users.filter(u => u.role === "TIMSES")
        };

      case "addNewDPT":
        const isExist = dpt.find(d => d.nik === payload.nik);
        if (isExist) {
          return { status: "error", message: "Nomor NIK ini sudah terdaftar di DPT!" };
        }
        const newDptRow = {
          nik: payload.nik,
          no_kk: payload.kk,
          nama_warga: payload.nama,
          dusun: payload.dusun,
          rt: payload.rt,
          rw: payload.rw,
          tps_id: payload.tps_id
        };
        dpt.push(newDptRow);
        localStorage.setItem("sim_data_dpt", JSON.stringify(dpt));
        return { status: "success", message: "Warga baru berhasil didaftarkan ke DPT!" };

      case "updateBranding":
        settings.nama_calon_kades = payload.nama_calon_kades;
        if(payload.photoBase64) settings.drive_id_foto_paslon = payload.photoBase64;
        if(payload.bannerBase64) settings.drive_id_banner_login = payload.bannerBase64;
        localStorage.setItem("sim_app_settings", JSON.stringify(settings));
        return { status: "success", message: "Branding simulasi diperbarui lokal!" };

      case "registerTimses":
        const newTimses = {
          user_id: "USR-" + (users.length + 1),
          username: payload.username,
          password_hash: payload.password,
          nama_lengkap: payload.nama,
          role: "TIMSES",
          status_aktif: "Active"
        };
        users.push(newTimses);
        localStorage.setItem("sim_users", JSON.stringify(users));
        return { status: "success", message: "Petugas Lapangan berhasil didaftarkan!" };

      case "getBranding":
        return { status: "success", branding: settings };

      default:
        return { status: "error", message: "Unknown action" };
    }
  },

  // EVENT DELEGATION GLOBAL: Tombol Logout dideteksi paling awal
  bindGlobalDelegation: function() {
    document.addEventListener("click", function(e) {
      // 1. PRIORITAS TERTINGGI: Tombol Keluar Sistem / Logout
      const logoutBtn = e.target.closest("#btn-admin-logout");
      if (logoutBtn) {
        e.preventDefault();
        e.stopPropagation();
        appEngine.auth.logout();
        return;
      }

      // 2. Dropdown Trigger Profil
      const profileTrigger = e.target.closest("#btn-admin-profile-trigger");
      const dropdownBox = document.getElementById("box-admin-dropdown");
      if (profileTrigger) {
        e.preventDefault();
        e.stopPropagation();
        if (dropdownBox) dropdownBox.classList.toggle("hidden");
        const notifBox = document.getElementById("box-admin-notification");
        if (notifBox) notifBox.classList.add("hidden");
        return;
      }

      // 3. Trigger Notifikasi Lonceng
      const notifTrigger = e.target.closest("#btn-admin-notification");
      const notifBox = document.getElementById("box-admin-notification");
      if (notifTrigger) {
        e.preventDefault();
        e.stopPropagation();
        if (notifBox) notifBox.classList.toggle("hidden");
        if (dropdownBox) dropdownBox.classList.add("hidden");
        return;
      }

      // 4. Tombol Sinkronisasi Data Manual
      const syncBtn = e.target.closest("#btn-admin-sync");
      if (syncBtn) {
        e.preventDefault();
        e.stopPropagation();
        const targetIcon = document.getElementById("icon-admin-sync");
        if (targetIcon) targetIcon.classList.add("animate-spin");
        syncBtn.disabled = true;
        appEngine.admin.syncData().then(() => {
          setTimeout(() => {
            const finalIcon = document.getElementById("icon-admin-sync");
            if (finalIcon) finalIcon.classList.remove("animate-spin");
            syncBtn.disabled = false;
          }, 800);
        });
        return;
      }

      // 5. Auto Close Dropdowns saat klik di luar area
      if (dropdownBox && !e.target.closest("#box-admin-dropdown") && !e.target.closest("#btn-admin-profile-trigger")) {
        dropdownBox.classList.add("hidden");
      }
      if (notifBox && !e.target.closest("#box-admin-notification") && !e.target.closest("#btn-admin-notification")) {
        notifBox.classList.add("hidden");
      }
    });
  },

  router: {
    views: {
      login: "login.html",
      ADMIN: "dashboard-admin.html",
      TIMSES: "dashboard-timses.html"
    },

    loadView: async function(role) {
      const container = document.getElementById("app-root");
      container.innerHTML = `
        <div class="flex-1 flex flex-col items-center justify-center bg-[#0B192C] text-white min-h-screen">
          <div class="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent border-[#D4AF37] mb-4"></div>
          <p class="text-xs text-[#D4AF37] tracking-widest font-bold uppercase animate-pulse">Memuat Antarmuka Trisula...</p>
        </div>`;

      try {
        const normalizedRole = role ? role.toUpperCase() : "LOGIN";
        const viewFile = this.views[normalizedRole] || this.views.login;
        const res = await fetch(viewFile);
        if (!res.ok) throw new Error("Template HTML tidak ditemukan.");
        
        container.innerHTML = await res.text();

        if (normalizedRole === "LOGIN") {
          appEngine.auth.bindLoginForm();
        }
        if (normalizedRole === "ADMIN") appEngine.admin.initDashboard();
        if (normalizedRole === "TIMSES") appEngine.field.initFieldView();
      } catch (err) {
        console.error("Router error:", err);
        container.innerHTML = `
          <div class="p-8 text-center text-red-500 font-bold bg-white min-h-screen flex flex-col items-center justify-center">
            <i class="fa-solid fa-triangle-exclamation text-4xl mb-3 text-gold"></i>
            <p class="text-sm uppercase tracking-wide">Template Loading Error</p>
          </div>`;
      }
    },

    switchTab: function(tabId) {
      document.querySelectorAll(".tab-content").forEach(el => el.classList.add("hidden"));
      document.querySelectorAll(".tab-btn").forEach(btn => btn.className = "tab-btn w-full flex items-center gap-3 px-4 py-3.5 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all text-slate-400 hover:bg-slate-800/40 hover:text-white");

      const activeTab = document.getElementById(`tab-${tabId}`);
      if (activeTab) activeTab.classList.remove("hidden");

      if (window.event && window.event.currentTarget) {
        window.event.currentTarget.className = "tab-btn w-full flex items-center gap-3 px-4 py-3.5 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all text-gold bg-slate-800/60";
      }
    }
  },

  auth: {
    bindLoginForm: function() {
      const form = document.getElementById("form-login-gate");
      if (form) {
        form.removeAttribute("onsubmit");
        form.addEventListener("submit", function(e) {
          e.preventDefault();
          appEngine.auth.submit(e);
        });
        
        appEngine.request("getBranding").then(res => {
          if(res && res.status === "success" && res.branding && res.branding.drive_id_banner_login) {
            const leftPanel = document.getElementById("login-left-banner");
            const overlayContent = document.getElementById("login-overlay-content");
            if(leftPanel) {
              const directUrl = appEngine.utils.getDirectDriveUrl(res.branding.drive_id_banner_login);
              leftPanel.style.backgroundImage = `url('${directUrl}')`;
              // REVISI 7.1.6: Disetel 'contain' & 'no-repeat' agar poster paslon utuh 100% tanpa terpotong
              leftPanel.style.backgroundSize = "contain";
              leftPanel.style.backgroundRepeat = "no-repeat";
              leftPanel.style.backgroundPosition = "center";
              
              if (overlayContent) {
                overlayContent.classList.add("hidden");
              }
            }
          }
        });
      } else {
        setTimeout(() => appEngine.auth.bindLoginForm(), 100);
      }
    },

    bindTimsesForm: function() {
      const logoutBtn = document.getElementById("btn-timses-logout");
      if (logoutBtn) {
        logoutBtn.removeAttribute("onclick");
        logoutBtn.addEventListener("click", function(e) {
          e.preventDefault();
          appEngine.auth.logout();
        });
      } else {
        setTimeout(() => appEngine.auth.bindTimsesForm(), 100);
      }
    },

    submit: async function(e) {
      if (e) e.preventDefault();
      const btn = document.getElementById("btn-login-submit");
      const alertBox = document.getElementById("login-alert");

      if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-rotate animate-spin mr-2"></i> MEMVERIFIKASI...`;
      }

      const username = document.getElementById("login-username") ? document.getElementById("login-username").value.trim() : "";
      const password = document.getElementById("login-password") ? document.getElementById("login-password").value.trim() : "";

      const res = await appEngine.request("login", { username, password });

      if (res.status === "success") {
        const sessionData = { token: res.token, user: { ...res.user, token: res.token } };
        localStorage.setItem("pvs_session_v71", JSON.stringify(sessionData));
        appEngine.session.user = sessionData.user;
        appEngine.router.loadView(res.user.role);
      } else {
        if (alertBox) {
          alertBox.className = "mb-6 p-4 rounded-2xl text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/30 shadow-md";
          alertBox.innerHTML = `<i class="fa-solid fa-circle-exclamation mr-2"></i> ${res.message}`;
          alertBox.classList.remove("hidden");
        }
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = `<span>MASUK RUANG OPERASIONAL</span> <i class="fa-solid fa-right-to-bracket text-xs"></i>`;
        }
      }
    },

    checkSession: function() {
      const stored = localStorage.getItem("pvs_session_v71");
      if (stored) {
        try {
          const sessionData = JSON.parse(stored);
          if (sessionData && sessionData.user && sessionData.token) {
            appEngine.session.user = { ...sessionData.user, token: sessionData.token };
            appEngine.router.loadView(sessionData.user.role);
            return;
          }
        } catch(err) {
          console.error("Session parse error:", err);
        }
      }
      appEngine.router.loadView("login");
    },

    logout: function() {
      localStorage.removeItem("pvs_session_v71");
      appEngine.session.user = null;
      appEngine.session.dbCache = null;
      appEngine.router.loadView("login");
    }
  },

  admin: {
    activeSubTab: "subtab-dpt",

    initDashboard: async function() {
      const modeBadge = document.getElementById("system-mode-badge");
      if (modeBadge) {
        modeBadge.innerText = appEngine.isSimulation ? "MODE SIMULASI (OFFLINE)" : "LIVE SYNC ACTIVE";
      }

      if (!appEngine.session.user || !appEngine.session.user.token) {
        console.warn("Session token lost, redirecting to login.");
        appEngine.auth.logout();
        return;
      }

      const res = await appEngine.request("getAdminDashboard", { token: appEngine.session.user.token });
      if (res.status === "success") {
        appEngine.session.dbCache = res;
        this.renderMetrics(res.metrics);
        this.renderTPSRecapTable(res.zoning);
        this.renderZoningChart(res.metrics);
        this.populateFilterDropdowns(res);
        this.renderAnalyticsTable();
        
        const nameInput = document.getElementById("setting-candidate-name");
        if(nameInput && res.branding) {
          nameInput.value = res.branding.nama_calon_kades || "";
          const bannerText = document.getElementById("hero-candidate-banner");
          if (bannerText) {
            bannerText.innerText = `BERSAMA KITA SUKSESKAN PILKADES DAMAI - ${res.branding.nama_calon_kades.toUpperCase()}`;
          }
          if(res.branding.drive_id_foto_paslon) {
            const directPhotoUrl = appEngine.utils.getDirectDriveUrl(res.branding.drive_id_foto_paslon);
            const adminProfileImg = document.getElementById("admin-profile-img");
            if (adminProfileImg) {
              adminProfileImg.src = directPhotoUrl;
            }
          }
        }
      } else {
        console.error("Dashboard fetch error:", res.message);
        if (res.message && res.message.includes("Akses ditolak")) {
          alert("Sesi akses server telah diperbarui. Silakan login kembali untuk memperbarui token Anda.");
          appEngine.auth.logout();
        }
      }
    },

    syncData: async function() {
      if (!appEngine.session.user || !appEngine.session.user.token) return;
      const res = await appEngine.request("getAdminDashboard", { token: appEngine.session.user.token });
      if (res.status === "success") {
        appEngine.session.dbCache = res;
        this.renderMetrics(res.metrics);
        this.renderTPSRecapTable(res.zoning);
        this.renderZoningChart(res.metrics);
        this.populateFilterDropdowns(res);
        this.renderAnalyticsTable();
      }
    },

    renderMetrics: function(metrics) {
      if (!metrics) return;
      const elDpt = document.getElementById("stat-total-dpt");
      const elVoters = document.getElementById("stat-total-voters");
      const elProgress = document.getElementById("stat-realcount-progress");
      if (elDpt) elDpt.innerText = metrics.total_dpt;
      if (elVoters) elVoters.innerText = metrics.total_terdata;
      if (elProgress) elProgress.innerText = metrics.pro_percentage + "%";
    },

    renderTPSRecapTable: function(zoning) {
      const tbody = document.querySelector("#table-rekap-tps tbody");
      if (!tbody || !zoning) return;
      tbody.innerHTML = "";
      zoning.forEach(zone => {
        tbody.innerHTML += `
          <tr class="hover:bg-slate-50 transition border-b border-slate-100">
            <td class="p-3 font-bold text-slate-800">${zone.zone}</td>
            <td class="p-3 text-center">${zone.dpt}</td>
            <td class="p-3 text-center text-emerald-600 font-black">${zone.pro}</td>
            <td class="p-3 text-center text-slate-700">${zone.kontra}</td>
            <td class="p-3 text-center text-slate-700">${zone.ragu}</td>
          </tr>`;
      });
    },

    renderZoningChart: function(metrics) {
      const canvas = document.getElementById("chart-real-count-admin");
      if (!canvas || !metrics || typeof Chart === "undefined") return;
      if (window.myPVSChart) window.myPVSChart.destroy();
      window.myPVSChart = new Chart(canvas.getContext("2d"), {
        type: "doughnut",
        data: {
          labels: ["PRO", "KONTRA", "RAGU-RAGU"],
          datasets: [{ data: [metrics.pro, metrics.kontra, metrics.ragu], backgroundColor: ["#0B192C", "#EF4444", "#F59E0B"] }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
    },

    populateFilterDropdowns: function(data) {
      const rtrwSelect = document.getElementById("filter-select-rtrw");
      const timsesSelect = document.getElementById("filter-select-timses");
      if(!rtrwSelect || !data || !data.zoning) return;

      rtrwSelect.innerHTML = `<option value="ALL">Semua Wilayah RT/RW</option>`;
      const uniqueZones = [...new Set(data.zoning.map(z => z.zone))];
      uniqueZones.forEach(z => {
        rtrwSelect.innerHTML += `<option value="${z}">${z}</option>`;
      });

      if(timsesSelect && data.timsesList) {
        timsesSelect.innerHTML = `<option value="ALL">Semua Petugas Timses</option>`;
        data.timsesList.forEach(t => {
          timsesSelect.innerHTML += `<option value="${t.user_id}">${t.nama_lengkap}</option>`;
        });
      }
    },

    switchSubTab: function(subTabId) {
      this.activeSubTab = subTabId;
      
      document.querySelectorAll(".sub-tab-btn").forEach(btn => {
        btn.className = "sub-tab-btn px-4 py-2 text-xs font-bold rounded-xl border border-transparent text-slate-600 hover:text-navy-dark transition";
      });
      
      const activeBtn = document.getElementById(`subtab-btn-${subTabId.replace('subtab-', '')}`);
      if (activeBtn) {
        activeBtn.className = "sub-tab-btn px-4 py-2 text-xs font-extrabold rounded-xl transition shadow-sm bg-navy-dark text-gold";
      }

      const boxKK = document.getElementById("filter-box-kk");
      const boxVote = document.getElementById("filter-box-vote");
      const boxTimses = document.getElementById("filter-box-timses");
      const matrixRow = document.getElementById("filter-matrix-row");

      if (matrixRow) matrixRow.classList.remove("hidden");

      if (subTabId === "subtab-dpt") {
        if(boxKK) boxKK.classList.remove("hidden");
        if(boxVote) boxVote.classList.add("hidden");
        if(boxTimses) boxTimses.classList.add("hidden");
      } else if (subTabId === "subtab-voter-records") {
        if(boxKK) boxKK.classList.add("hidden");
        if(boxVote) boxVote.classList.remove("hidden");
        if(boxTimses) boxTimses.classList.remove("hidden");
      } else {
        if(matrixRow) matrixRow.classList.add("hidden");
      }
      
      this.renderAnalyticsTable();
    },

    renderAnalyticsTable: function() {
      const head = document.getElementById("table-analytics-head");
      const body = document.getElementById("table-analytics-body");
      if (!head || !body) return;
      
      const cachedData = appEngine.session.dbCache;
      if (!cachedData) return;

      body.innerHTML = "";
      const selectRtrwEl = document.getElementById("filter-select-rtrw");
      const selectedZone = selectRtrwEl ? selectRtrwEl.value : "ALL";

      if (this.activeSubTab === "subtab-dpt") {
        head.innerHTML = `<tr><th class="p-3">Nama Warga</th><th class="p-3">NIK</th><th class="p-3">Nomor KK</th><th class="p-3">Dusun - RT/RW</th></tr>`;
        const filterKK = document.getElementById("filter-input-kk") ? document.getElementById("filter-input-kk").value.trim().toLowerCase() : "";
        
        const dptList = cachedData.dptMaster || [];
        dptList.forEach(item => {
          const zoneKey = `${item.dusun} - RT ${item.rt} / RW ${item.rw}`;
          if (selectedZone !== "ALL" && zoneKey !== selectedZone) return;
          if (filterKK !== "" && !item.no_kk.toLowerCase().includes(filterKK)) return;

          body.innerHTML += `
            <tr class="border-b border-slate-100 hover:bg-slate-50 transition">
              <td class="p-3 font-bold text-slate-800">${item.nama_warga}</td>
              <td class="p-3 font-mono text-slate-500">${item.nik}</td>
              <td class="p-3 font-mono text-slate-700 font-bold">${item.no_kk}</td>
              <td class="p-3">${zoneKey}</td>
            </tr>`;
        });
      } 
      else if (this.activeSubTab === "subtab-voter-records") {
        head.innerHTML = `<tr><th class="p-3">Nama Warga Pemilih</th><th class="p-3">NIK</th><th class="p-3 text-center">Orientasi</th><th class="p-3">Zonasi RT/RW</th><th class="p-3">Petugas Lapangan</th></tr>`;
        const selectVoteEl = document.getElementById("filter-select-vote");
        const selectTimsesEl = document.getElementById("filter-select-timses");
        const selectedVote = selectVoteEl ? selectVoteEl.value : "ALL";
        const selectedTimses = selectTimsesEl ? selectTimsesEl.value : "ALL";

        (cachedData.voters || []).forEach(v => {
          const zoneKey = `${v.dusun} - RT ${v.rt} / RW ${v.rw}`;
          if (selectedZone !== "ALL" && zoneKey !== selectedZone) return;
          if (selectedVote !== "ALL" && v.klasifikasi !== selectedVote) return;
          if (selectedTimses !== "ALL" && v.input_by_user_id !== selectedTimses) return;

          let badgeColor = "bg-amber-100 text-amber-700";
          if (v.klasifikasi === "PRO") badgeColor = "bg-emerald-100 text-emerald-800 font-black";
          if (v.klasifikasi === "KONTRA") badgeColor = "bg-red-100 text-red-700";

          body.innerHTML += `
            <tr class="border-b border-slate-100 hover:bg-slate-50 transition">
              <td class="p-3 font-bold text-slate-800">${v.nama}</td>
              <td class="p-3 font-mono text-slate-500">${v.nik}</td>
              <td class="p-3 text-center"><span class="px-2.5 py-1 rounded-md text-[10px] ${badgeColor}">${v.klasifikasi}</span></td>
              <td class="p-3">${zoneKey}</td>
              <td class="p-3 font-semibold text-navy-light"><i class="fa-solid fa-user-check mr-1 text-gold"></i>${v.input_by}</td>
            </tr>`;
        });
      }
      else if (this.activeSubTab === "subtab-rt-rw") {
        head.innerHTML = `<tr><th class="p-3">Zonasi Dusun RT/RW</th><th class="p-3 text-center">Target DPT</th><th class="p-3 text-center text-emerald-600">PRO</th><th class="p-3 text-center text-red-500">KONTRA</th><th class="p-3 text-center text-amber-600">RAGU</th></tr>`;
        (cachedData.zoning || []).forEach(z => {
          body.innerHTML += `<tr class="border-b border-slate-100 hover:bg-slate-50 transition"><td class="p-3 font-bold">${z.zone}</td><td class="p-3 text-center">${z.dpt}</td><td class="p-3 text-center text-emerald-600 font-black">${z.pro}</td><td class="p-3 text-center text-red-500">${z.kontra}</td><td class="p-3 text-center text-amber-600">${z.ragu}</td></tr>`;
        });
      }
      else if (this.activeSubTab === "subtab-performance") {
        head.innerHTML = `<tr><th class="p-3">Nama Petugas Lapangan</th><th class="p-3 text-center">Total Input Suara</th><th class="p-3 text-center">Status Keaktifan</th></tr>`;
        if(cachedData.timsesList) {
          cachedData.timsesList.forEach(t => {
            const count = (cachedData.voters || []).filter(v => v.input_by_user_id === t.user_id).length;
            body.innerHTML += `<tr class="border-b border-slate-100 hover:bg-slate-50 transition"><td class="p-3 font-bold">${t.nama_lengkap} (${t.username})</td><td class="p-3 text-center font-black text-navy-dark">${count} Data Pemilih</td><td class="p-3 text-center"><span class="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold">ACTIVE LIVE</span></td></tr>`;
          });
        }
      }
      else if (this.activeSubTab === "subtab-unvisited") {
        head.innerHTML = `<tr><th class="p-3">Nama Warga Belum Dikunjungi</th><th class="p-3">NIK</th><th class="p-3">TPS Ringkasan</th></tr>`;
        const visitedNIKs = (cachedData.voters || []).map(v => v.nik);
        const unvisited = (cachedData.dptMaster || []).filter(d => !visitedNIKs.includes(d.nik));
        
        unvisited.forEach(item => {
          body.innerHTML += `<tr class="border-b border-slate-100 hover:bg-slate-50 transition"><td class="p-3 font-bold text-slate-500">${item.nama_warga}</td><td class="p-3 font-mono">${item.nik}</td><td class="p-3 font-bold">TPS-${item.tps_id} (${item.dusun})</td></tr>`;
        });
      }
    },

    submitNewDPT: async function(e) {
      if (e) e.preventDefault();
      const btn = document.getElementById("btn-save-dpt");
      const alertBox = document.getElementById("modal-dpt-alert");
      if(btn) { btn.disabled = true; btn.innerHTML = `<i class="fa-solid fa-spinner animate-spin"></i> Menyimpan...`; }

      const nik = document.getElementById("dpt-nik").value.trim();
      const kk = document.getElementById("dpt-kk").value.trim();
      const nama = document.getElementById("dpt-nama").value.trim();
      const dusun = document.getElementById("dpt-dusun").value.trim();
      const rt = document.getElementById("dpt-rt").value.trim();
      const rw = document.getElementById("dpt-rw").value.trim();
      const tps_id = document.getElementById("dpt-tps").value.trim();

      const res = await appEngine.request("addNewDPT", {
        token: appEngine.session.user.token,
        nik: nik,
        kk: kk,
        nama: nama,
        dusun: dusun,
        rt: rt,
        rw: rw,
        tps_id: tps_id
      });

      if(alertBox) {
        alertBox.className = `p-3 rounded-xl text-xs font-bold mb-4 ${res.status === 'success' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-500'}`;
        alertBox.innerHTML = res.message;
        alertBox.classList.remove("hidden");
      }

      if (res.status === "success") {
        setTimeout(() => {
          const form = document.getElementById("form-add-dpt");
          if (form) form.reset();
          const modal = document.getElementById("modal-add-dpt");
          if (modal) modal.classList.add("hidden");
          if (alertBox) alertBox.classList.add("hidden");
          appEngine.admin.syncData();
        }, 1200);
      }
      
      if(btn) { btn.disabled = false; btn.innerHTML = `<span>Simpan Warga</span><i class="fa-solid fa-floppy-disk"></i>`; }
    },

    saveSettings: async function(e) {
      if (e) e.preventDefault();
      const btn = document.getElementById("btn-save-settings");
      const alertBox = document.getElementById("settings-alert");
      if(btn) { btn.disabled = true; btn.innerHTML = `<i class="fa-solid fa-spinner animate-spin mr-1"></i> Menyimpan...`; }

      const kadesName = document.getElementById("setting-candidate-name").value.trim();
      const filePhoto = document.getElementById("setting-candidate-photo").files[0];
      const fileBanner = document.getElementById("setting-candidate-banner").files[0];

      const toBase64 = file => new Promise((resolve, reject) => {
        if(!file) return resolve(null);
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
      });

      try {
        const photoBase64 = await toBase64(filePhoto);
        const bannerBase64 = await toBase64(fileBanner);

        const res = await appEngine.request("updateBranding", {
          token: appEngine.session.user.token,
          nama_calon_kades: kadesName,
          photoBase64: photoBase64,
          bannerBase64: bannerBase64
        });

        if(alertBox) {
          alertBox.className = `p-3 rounded-xl text-xs font-bold mb-2 ${res.status === 'success' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-500'}`;
          alertBox.innerHTML = res.message;
          alertBox.classList.remove("hidden");
        }
        
        if(res.status === "success") { appEngine.admin.syncData(); }
      } catch (err) {
        console.error("Upload handler runtime failed:", err);
      } finally {
        if(btn) { btn.disabled = false; btn.innerHTML = `<span>SIMPAN PERUBAHAN BRANDING</span><i class="fa-solid fa-floppy-disk"></i>`; }
      }
    },

    submitRegister: async function(e) {
      if (e) e.preventDefault();
      const btn = document.getElementById("btn-submit-timses");
      const alertBox = document.getElementById("register-alert");
      if(btn) { btn.disabled = true; }

      const nama = document.getElementById("reg-name").value.trim();
      const username = document.getElementById("reg-username").value.trim();
      const password = document.getElementById("reg-password").value.trim();

      const res = await appEngine.request("registerTimses", {
        token: appEngine.session.user.token,
        nama: nama,
        username: username,
        password: password
      });

      if(alertBox) {
        alertBox.className = `p-3 rounded-xl text-xs font-bold mb-4 ${res.status === 'success' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-500'}`;
        alertBox.innerHTML = res.message;
        alertBox.classList.remove("hidden");
      }

      if(res.status === "success") {
        const form = document.getElementById("form-register-timses");
        if (form) form.reset();
        appEngine.admin.syncData();
      }
      if(btn) { btn.disabled = false; }
    }
  },

  field: {
    initFieldView: function() {
      const profileName = document.getElementById("timses-profile-name");
      if (profileName && appEngine.session.user) {
        profileName.innerText = appEngine.session.user.nama_lengkap;
      }
      appEngine.auth.bindTimsesForm();
    },
    submitVoter: async function(e) {
      if (e) e.preventDefault();
      const alertBox = document.getElementById("field-alert");
      const nik = document.getElementById("field-voter-nik").value;
      const klasifikasi = document.getElementById("field-voter-class").value;

      const res = await appEngine.request("submitVoter", { 
        token: appEngine.session.user ? appEngine.session.user.token : "",
        nik, 
        klasifikasi 
      });

      if (alertBox) {
        alertBox.className = `p-4 rounded-2xl text-xs font-extrabold mb-4 shadow-sm ${res.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`;
        alertBox.innerHTML = res.status === 'success' 
          ? `<i class="fa-solid fa-circle-check mr-2"></i> ${res.message}`
          : `<i class="fa-solid fa-triangle-exclamation mr-2"></i> ${res.message}`;
        alertBox.classList.remove("hidden");
      }

      if (res.status === "success") {
        const form = document.getElementById("form-voter-submission");
        if (form) form.reset();
      }
    }
  },

  utils: {
    printTable: function() { window.print(); },
    exportTableCSV: function() { alert('Data Matrix successfully compiled into structural CSV format!'); },
    
    getDirectDriveUrl: function(url) {
      if (!url) return "";
      if (url.includes("drive.google.com")) {
        const matches = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (matches && matches[1]) {
          return "https://lh3.googleusercontent.com/d/" + matches[1];
        }
      }
      return url;
    }
  }
};

window.addEventListener("DOMContentLoaded", () => appEngine.init());
