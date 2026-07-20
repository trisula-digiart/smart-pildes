/**
 * PILKADES VICTORY SYSTEM - FRONTEND APP ENGINE
 * Handling Session Router, UI Layout Injection & Async API Communications
 */

// GANTI DENGAN URL WEB APP GOOGLE APPS SCRIPT ANDA SETELAH DEPLOY
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbyCctiDjoWcgTPHqDghNC-HUfuUSuLHa0nqoSX384HuAtrtujumwsr-DpylQyVK6gYA/exec"; 

const appEngine = {
  // Session State Storage
  session: {
    user: null,
    settings: null,
    dbCache: null
  },

  // Initialize System Application
  init: async function() {
    await this.settings.load();
    this.auth.checkSession();
  },

  // Fetch API Asynchronous Base Layer
  request: async function(action, payload = {}) {
    try {
      const response = await fetch(GAS_API_URL, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action, payload })
      });
      return await response.json();
    } catch (error) {
      console.error("API Gateway error:", error);
      return { success: false, message: "Koneksi ke server terputus. Periksa jaringan Anda." };
    }
  },

  // Component Layout Injector Router Engine
  router: {
    views: {
      login: "login.html",
      Admin: "dashboard-admin.html",
      Timses: "dashboard-timses.html",
      Saksi: "dashboard-timses.html"
    },

    loadView: async function(role) {
      const container = document.getElementById("app-shell");
      container.innerHTML = `<div class="flex-1 flex flex-col items-center justify-center bg-navy-dark text-white"><div class="animate-spin rounded-full h-10 w-10 border-4 border-t-transparent border-yellow-500 mb-2"></div><p class="text-xs text-gold">Memuat Halaman...</p></div>`;
      
      try {
        const viewFile = this.views[role] || this.views.login;
        const res = await fetch(viewFile);
        if (!res.ok) throw new Error("View template file load failed");
        
        container.innerHTML = await res.text();
        
        // Execute Hook context modifiers after rendering layout UI
        if (role === "Admin") appEngine.admin.initDashboard();
        if (role === "Timses" || role === "Saksi") appEngine.field.initFieldView(role);
      } catch (err) {
        container.innerHTML = `<div class="p-6 text-center text-red-600 font-bold"><i class="fa-solid fa-triangle-exclamation text-3xl mb-2"></i><br>Gagal memuat arsitektur UI. Pastikan file HTML tersedia di root GitHub Pages!</div>`;
      }
    },

    switchTab: function(tabId) {
      document.querySelectorAll(".tab-content").forEach(el => el.classList.add("hidden"));
      document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("text-gold", "bg-slate-800/50"));
      
      const activeTab = document.getElementById(`tab-${tabId}`);
      if(activeTab) activeTab.classList.remove("hidden");
      
      const target = event.currentTarget;
      if(target && target.classList) target.classList.add("text-gold", "bg-slate-800/50");
    }
  },

  // Authentication Management System
  auth: {
    submit: async function(e) {
      e.preventDefault();
      const btn = document.getElementById("btn-login-submit");
      const alertBox = document.getElementById("login-alert");
      
      btn.disabled = true;
      btn.innerHTML = `<i class="fa-solid fa-circle-notch animate-spin"></i> Memverifikasi...`;
      
      const payload = {
        username: document.getElementById("login-username").value,
        password: document.getElementById("login-password").value
      };
      
      const res = await appEngine.request("login", payload);
      
      if(res.success) {
        localStorage.setItem("pvs_session", JSON.stringify(res.user));
        appEngine.session.user = res.user;
        appEngine.router.loadView(res.user.role);
      } else {
        alertBox.className = "mb-4 p-4 rounded-xl text-sm font-medium bg-red-50 text-red-700 border border-red-200";
        alertBox.innerText = res.message;
        alertBox.classList.remove("hidden");
        btn.disabled = false;
        btn.innerHTML = `<span>MASUK KE SISTEM</span><i class="fa-solid fa-arrow-right-to-bracket text-xs"></i>`;
      }
    },

    checkSession: function() {
      const stored = localStorage.getItem("pvs_session");
      if (stored) {
        appEngine.session.user = JSON.parse(stored);
        appEngine.router.loadView(appEngine.session.user.role);
      } else {
        appEngine.router.loadView("login");
      }
    },

    logout: function() {
      localStorage.removeItem("pvs_session");
      appEngine.session.user = null;
      appEngine.router.loadView("login");
    }
  },

  // Admin Dashboard Room Feature Controller
  admin: {
    initDashboard: async function() {
      document.getElementById("admin-profile-name").innerText = appEngine.session.user.nama_lengkap;
      if (appEngine.session.settings) {
        document.getElementById("setting-candidate-name").value = appEngine.session.settings.nama_calon_kades;
      }
      
      const res = await appEngine.request("getDashboardData");
      if(res.success) {
        appEngine.session.dbCache = res;
        this.renderStatsAndTables(res);
      }
    },

    renderStatsAndTables: function(data) {
      document.getElementById("stat-total-dpt").innerText = data.dptCount;
      document.getElementById("stat-total-voters").innerText = data.votersCount;
      
      // Hitung progress input real count
      const lockedTps = data.realCountData.filter(r => r[8] === "Yes").length;
      const progress = data.realCountData.length > 0 ? Math.round((lockedTps / data.realCountData.length) * 100) : 0;
      document.getElementById("stat-realcount-progress").innerText = progress + "%";
      
      // Render Table Rekapitulasi TPS
      const tbodyTps = document.querySelector("#table-rekap-tps tbody");
      tbodyTps.innerHTML = "";
      let totalKita = 0, totalL1 = 0, totalL2 = 0;
      
      data.realCountData.forEach(row => {
        totalKita += Number(row[3] || 0);
        totalL1 += Number(row[4] || 0);
        totalL2 += Number(row[5] || 0);
        
        tbodyTps.innerHTML += `
          <tr class="hover:bg-slate-50 transition border-b border-slate-100">
            <td class="p-3 font-medium text-slate-800">${row[1]}</td>
            <td class="p-3 text-center text-emerald-600 font-bold">${row[3] || 0}</td>
            <td class="p-3 text-center text-slate-700">${row[4] || 0}</td>
            <td class="p-3 text-center text-slate-700">${row[5] || 0}</td>
            <td class="p-3 text-center"><span class="px-2 py-0.5 rounded-full text-[10px] font-semibold ${row[8] === 'Yes' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200':'bg-amber-50 text-amber-700 border border-amber-200'}">${row[8] === 'Yes' ? 'Locked':'Open'}</span></td>
          </tr>
        `;
      });
      
      // Render Data Pemilih Terkunci Lapangan
      const tbodyVoters = document.querySelector("#table-voters-list tbody");
      tbodyVoters.innerHTML = "";
      data.votersList.forEach(row => {
        tbodyVoters.innerHTML += `
          <tr class="hover:bg-slate-50 border-b border-slate-100">
            <td class="p-3 font-mono font-medium">${row[1]}</td>
            <td class="p-3"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">${row[2]}</span></td>
            <td class="p-3 text-slate-500">${row[3]}</td>
            <td class="p-3 text-slate-400">${new Date(row[4]).toLocaleDateString('id-ID')}</td>
          </tr>
        `;
      });

      this.initChart(totalKita, totalL1, totalL2);
    },

    initChart: function(kita, l1, l2) {
      const ctx = document.getElementById('chart-real-count-admin').getContext('2d');
      if(window.myRCChart) window.myRCChart.destroy();
      
      window.myRCChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Calon Kita', 'Lawan 1', 'Lawan 2'],
          datasets: [{
            data: [kita, l1, l2],
            backgroundColor: ['#0B192C', '#EF4444', '#F59E0B'],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } }
        }
      });
    },

    saveSettings: async function(e) {
      e.preventDefault();
      const payload = {
        nama_calon_kades: document.getElementById("setting-candidate-name").value
      };
      
      const res = await appEngine.request("updateAppSettings", payload);
      alert(res.message);
      if(res.success) appEngine.settings.load();
    }
  },

  // Field Operation Feature Controller (Timses & Saksi View Router Hooks)
  field: {
    initFieldView: function(role) {
      document.getElementById("timses-profile-name").innerText = appEngine.session.user.nama_lengkap + ` (${role})`;
      
      if(role === "Saksi") {
        // Condition Engine Rule: Saksi Form Modification Rule
        document.getElementById("pane-timses-voter").classList.add("hidden");
        document.getElementById("pane-saksi-realcount").classList.remove("hidden");
        this.checkTpsLockStatus();
      }
    },

    checkTpsLockStatus: async function() {
      const res = await appEngine.request("getDashboardData");
      if(res.success) {
        const tpsId = appEngine.session.user.tps_id;
        const myTps = res.realCountData.find(row => row[0].toString() === tpsId.toString());
        if(myTps && myTps[8] === "Yes") {
          const btn = document.getElementById("btn-rc-submit");
          btn.disabled = true;
          btn.className = "w-full mt-2 py-3 bg-slate-300 text-slate-500 font-bold text-xs tracking-wider rounded-xl cursor-not-allowed flex items-center justify-center gap-2";
          btn.innerHTML = `<i class="fa-solid fa-lock"></i> SUARA DIKUNCI ADMIN`;
          
          document.querySelectorAll("#form-realcount-submission input").forEach(input => input.disabled = true);
          this.showToast("field-alert", "status-lock", "Data Real Count TPS Anda telah dikunci oleh Pusat. Tidak dapat diubah kembali.", "error");
        }
      }
    },

    submitVoter: async function(e) {
      e.preventDefault();
      const nik = document.getElementById("field-voter-nik").value;
      const cls = document.getElementById("field-voter-class").value;
      
      const res = await appEngine.request("voterValidation", {
        nik: nik,
        klasifikasi: cls,
        user_id: appEngine.session.user.user_id
      });
      
      appEngine.field.showToast("field-alert", "voter-toast", res.message, res.success ? "success" : "error");
      if(res.success) document.getElementById("form-voter-submission").reset();
    },

    submitRealCount: async function(e) {
      e.preventDefault();
      const payload = {
        tps_id: appEngine.session.user.tps_id,
        suara_calon_kita: document.getElementById("rc-suara-kita").value,
        suara_lawan_1: document.getElementById("rc-suara-lawan1").value,
        suara_lawan_2: document.getElementById("rc-suara-lawan2").value,
        suara_tidak_sah: document.getElementById("rc-suara-rusak").value,
        user_id: appEngine.session.user.user_id
      };
      
      const res = await appEngine.request("submitRealCount", payload);
      appEngine.field.showToast("field-alert", "rc-toast", res.message, res.success ? "success" : "error");
      if(res.success) this.checkTpsLockStatus();
    },

    showToast: function(boxId, type, message, status) {
      const box = document.getElementById(boxId);
      box.innerText = message;
      box.className = `p-4 rounded-xl text-xs font-semibold shadow-sm ${status === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`;
      box.classList.remove("hidden");
    }
  },

  // App Global Dynamic Settings Loader
  settings: {
    load: async function() {
      const res = await appEngine.request("getAppSettings");
      if(res.success) {
        appEngine.session.settings = res.data;
      }
    }
  },

  // Export & Printing Client-Side Utilities Engine
  utils: {
    exportTableCSV: function(tableId) {
      const table = document.getElementById(tableId);
      let csv = [];
      for (let i = 0; i < table.rows.length; i++) {
        let row = [], cols = table.rows[i].cells;
        for (let j = 0; j < cols.length; j++) row.push('"' + cols[j].innerText.trim() + '"');
        csv.push(row.join(","));
      }
      const csvBlob = new Blob([csv.join("\n")], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(csvBlob);
      link.setAttribute("download", `Laporan_${tableId}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },

    printTable: function() {
      window.print();
    }
  }
};

// Start Runtime Engine Core Trigger
window.addEventListener("DOMContentLoaded", () => appEngine.init());
