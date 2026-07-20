/**
 * ==========================================================
 * PILKADES VICTORY SYSTEM - CLIENT SIDE ENGINE RUNTIME v7.0
 * Features: Auto simulation mode fallback, decoupling routers, 
 *           multi-tab analytics, and high-fidelity views controller.
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
    this.auth.checkSession();
  },

  checkDatabaseFallback: function() {
    if (!GAS_API_URL || GAS_API_URL.trim() === "") {
      this.isSimulation = true;
      console.log("⚠️ TRISULA KERNEL: GAS_API_URL kosong. Beralih ke Mode Simulasi Offline.");
      
      if (!localStorage.getItem("sim_app_settings")) {
        localStorage.setItem("sim_app_settings", JSON.stringify({
          nama_calon_kades: "Ahmad Dwi Saputra",
          drive_id_foto_paslon: "",
          drive_id_banner_login: ""
        }));
      }
      if (!localStorage.getItem("sim_users")) {
        localStorage.setItem("sim_users", JSON.stringify([
          { user_id: "USR-01", username: "admin", password_hash: "admin123", nama_lengkap: "Ahmad Dwi Saputra", role: "ADMIN", status_aktif: "Active" },
          { user_id: "USR-02", username: "timses1", password_hash: "timses123", nama_lengkap: "Rahmat Lapangan", role: "TIMSES", status_aktif: "Active" }
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
          { voter_id: "VTR-01", nik: "3201010101010005", klasifikasi: "PRO", input_by_user_id: "USR-02", created_at: new Date().toISOString() }
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
        const raguCount = voters.filter(v => v.klasifikasi === "RAGU-RAGU").length;
        
        const votersList = voters.map(v => {
          const d = dpt.find(item => item.nik === v.nik) || {};
          const u = users.find(user => user.user_id === v.input_by_user_id) || {};
          return {
            voter_id: v.voter_id,
            nik: v.nik,
            nama: d.nama_warga || "Tidak Terdaftar",
            dusun: d.dusun || "-",
            rt_rw: `RT ${d.rt || '-'} / RW ${d.rw || '-'}`,
            klasifikasi: v.klasifikasi,
            input_by: u.nama_lengkap || "Sistem",
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
              if (v.klasifikasi === "RAGU-RAGU") zoneMap[key].ragu++;
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
          zoning: Object.keys(zoneMap).map(k => zoneMap[k])
        };
      default:
        return { status: "error", message: "Unknown action" };
    }
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
        console.log("⚡ TRISULA KERNEL: Form login dinamis berhasil dikunci.");
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
        console.log("⚡ TRISULA KERNEL: Tombol logout dinamis berhasil dikunci.");
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
        localStorage.setItem("pvs_session_v70", JSON.stringify({ token: res.token, user: res.user }));
        appEngine.session.user = res.user;
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
      const stored = localStorage.getItem("pvs_session_v70");
      if (stored) {
        const sessionData = JSON.parse(stored);
        appEngine.session.user = sessionData.user;
        appEngine.router.loadView(sessionData.user.role);
      } else {
        appEngine.router.loadView("login");
      }
    },

    logout: function() {
      localStorage.removeItem("pvs_session_v70");
      appEngine.session.user = null;
      appEngine.router.loadView("login");
    }
  },

  admin: {
    activeSubTab: "subtab-dpt",

    initDashboard: async function() {
      const modeBadge = document.getElementById("system-mode-badge");
      if (modeBadge) {
        modeBadge.innerText = this.isSimulation ? "MODE SIMULASI (OFFLINE)" : "LIVE SYNC ACTIVE";
      }

      const res = await appEngine.request("getAdminDashboard", { token: appEngine.session.user.token });
      if (res.status === "success") {
        appEngine.session.dbCache = res;
        this.renderMetrics(res.metrics);
        this.renderTPSRecapTable(res.zoning);
        this.renderZoningChart(res.metrics);
        this.renderAnalyticsTable();
      }
    },

    syncData: async function() { await this.initDashboard(); },

    renderMetrics: function(metrics) {
      document.getElementById("stat-total-dpt").innerText = metrics.total_dpt;
      document.getElementById("stat-total-voters").innerText = metrics.total_terdata;
      document.getElementById("stat-realcount-progress").innerText = metrics.pro_percentage + "%";
    },

    renderTPSRecapTable: function(zoning) {
      const tbody = document.querySelector("#table-rekap-tps tbody");
      if (!tbody) return;
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
      if (!canvas) return;
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

    switchSubTab: function(subTabId) {
      this.activeSubTab = subTabId;
      this.renderAnalyticsTable();
    },

    renderAnalyticsTable: function() {
      const head = document.getElementById("table-analytics-head");
      const body = document.getElementById("table-analytics-body");
      if (!head || !body) return;
      head.innerHTML = `<tr><th class="p-3">Nama Warga</th><th class="p-3">NIK</th><th class="p-3">Dusun</th><th class="p-3 text-center">RT/RW</th></tr>`;
      body.innerHTML = "";
      
      const dptList = JSON.parse(localStorage.getItem("sim_data_dpt")) || [];
      dptList.forEach(item => {
        body.innerHTML += `<tr class="border-b"><td class="p-3 font-bold">${item.nama_warga}</td><td class="p-3 font-mono">${item.nik}</td><td class="p-3">${item.dusun}</td><td class="p-3 text-center">RT ${item.rt} / RW ${item.rw}</td></tr>`;
      });
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

      const res = await appEngine.request("submitVoter", { nik, klasifikasi });

      if (alertBox) {
        alertBox.className = `p-4 rounded-2xl text-xs font-extrabold mb-4 shadow-sm ${res.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`;
        alertBox.innerHTML = res.status === 'success' 
          ? `<i class="fa-solid fa-circle-check mr-2"></i> ${res.message}`
          : `<i class="fa-solid fa-triangle-exclamation mr-2"></i> ${res.message}`;
        alertBox.classList.remove("hidden");
      }

      if (res.status === "success") {
        document.getElementById("form-voter-submission").reset();
      }
    }
  },

  utils: {
    printTable: function() { window.print(); },
    exportTableCSV: function() { alert('CSV Export triggered'); }
  }
};

window.addEventListener("DOMContentLoaded", () => appEngine.init());
