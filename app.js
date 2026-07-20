/* STREAMING_CHUNK: Initializing frontend runtime and configuration state... */
/**
 * ==========================================================
 * PILKADES VICTORY SYSTEM - CLIENT SIDE ENGINE RUNTIME v5.6
 * Features: Auto simulation mode fallback, routing, and high-fidelity views
 * ==========================================================
 */

// !!! SALIN URL WEB APP GOOGLE APPS SCRIPT ANDA DI SINI !!!
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbyCctiDjoWcgTPHqDghNC-HUfuUSuLHa0nqoSX384HuAtrtujumwsr-DpylQyVK6gYA/exec"; 

const appEngine = {
  isSimulation: false,
  session: {
    user: null,
    settings: null,
    dbCache: null
  },

  // STREAMING_CHUNK: Bootloader initialization routing hook...
  init: async function() {
    this.checkDatabaseFallback();
    this.auth.checkSession();
  },

  // Check and setup LocalStorage simulation mode if Cloud URL is empty
  checkDatabaseFallback: function() {
    if (!GAS_API_URL || GAS_API_URL.trim() === "") {
      this.isSimulation = true;
      console.log("PVS INFO: GAS URL Kosong. Beralih ke Mode Simulasi.");
      
      // Initialize simulated local storage tables if not exist
      if (!localStorage.getItem("sim_app_settings")) {
        localStorage.setItem("sim_app_settings", JSON.stringify({
          nama_calon_kades: "Ahmad Dwi Saputra"
        }));
      }
      if (!localStorage.getItem("sim_data_dpt")) {
        localStorage.setItem("sim_data_dpt", JSON.stringify([
          { nik: "3201010101010001", nama_warga: "Supardi", tps_id: "TPS-01" },
          { nik: "3201010101010002", nama_warga: "Maimunah", tps_id: "TPS-01" },
          { nik: "3201010101010003", nama_warga: "Joko Widodo", tps_id: "TPS-02" }
        ]));
      }
      if (!localStorage.getItem("sim_warga_voters")) {
        localStorage.setItem("sim_warga_voters", JSON.stringify([
          { voter_id: "VTR-1", nik: "3201010101010001", klasifikasi: "Pro", input_by: "timses1", created_at: new Date().toISOString() }
        ]));
      }
      if (!localStorage.getItem("sim_tps_real_count")) {
        localStorage.setItem("sim_tps_real_count", JSON.stringify([
          { tps_id: "TPS-01", nama_tps: "TPS 01 Desa Krajan", total_dpt_tps: 300, suara_calon_kita: 150, suara_lawan_1: 80, suara_lawan_2: 40, suara_tidak_sah: 10, saksi_user_id: "saksi1", status_lock_suara: "No" },
          { tps_id: "TPS-02", nama_tps: "TPS 02 Desa Ngraho", total_dpt_tps: 250, suara_calon_kita: 0, suara_lawan_1: 0, suara_lawan_2: 0, suara_tidak_sah: 0, saksi_user_id: "", status_lock_suara: "No" }
        ]));
      }
    }
  },

  // STREAMING_CHUNK: Defining fetch client and api gateways...
  request: async function(action, payload = {}) {
    // If running in simulation mode, bypass cloud and handle locally
    if (this.isSimulation) {
      return this.handleLocalSimulation(action, payload);
    }

    try {
      const response = await fetch(GAS_API_URL, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action, payload })
      });
      return await response.json();
    } catch (error) {
      console.error("Cloud connection failed, falling back to local simulation:", error);
      this.isSimulation = true;
      return this.handleLocalSimulation(action, payload);
    }
  },

  // Local Simulation Engine for complete preview testing offline
  handleLocalSimulation: function(action, payload) {
    const settings = JSON.parse(localStorage.getItem("sim_app_settings"));
    const voters = JSON.parse(localStorage.getItem("sim_warga_voters"));
    const realCount = JSON.parse(localStorage.getItem("sim_tps_real_count"));
    const dpt = JSON.parse(localStorage.getItem("sim_data_dpt"));

    switch(action) {
      case "login":
        if ((payload.username === "admin" && payload.password === "admin123") ||
            (payload.username === "timses1" && payload.password === "timses123") ||
            (payload.username === "saksi1" && payload.password === "saksi123")) {
          let role = "Admin";
          let tps_id = "";
          let nama = "Ahmad Dwi Saputra";
          
          if(payload.username === "timses1") { role = "Timses"; nama = "Rahmat Lapangan"; }
          if(payload.username === "saksi1") { role = "Saksi"; tps_id = "TPS-01"; nama = "Agus Saksi TPS 1"; }
          
          return {
            success: true,
            user: { user_id: payload.username, username: payload.username, nama_lengkap: nama, role: role, tps_id: tps_id }
          };
        }
        return { success: false, message: "Kredensial salah! Gunakan: admin/admin123, timses1/timses123, saksi1/saksi123" };

      case "getAppSettings":
        return { success: true, data: settings };

      case "updateAppSettings":
        localStorage.setItem("sim_app_settings", JSON.stringify({ nama_calon_kades: payload.nama_calon_kades }));
        return { success: true, message: "Konfigurasi lokal berhasil disimpan!" };

      case "voterValidation":
        const foundDpt = dpt.find(d => d.nik === payload.nik.toString());
        if (!foundDpt) return { success: false, message: "Data warga tidak terdaftar dalam DPT!" };
        
        const duplicate = voters.find(v => v.nik === payload.nik.toString());
        if (duplicate) return { success: false, message: "NIK ini sudah didata sebelumnya oleh Timses!" };
        
        voters.push({ voter_id: "VTR-" + Date.now(), nik: payload.nik.toString(), klasifikasi: payload.klasifikasi, input_by: payload.user_id, created_at: new Date().toISOString() });
        localStorage.setItem("sim_warga_voters", JSON.stringify(voters));
        return { success: true, message: "Data Pemilih berhasil diverifikasi dan disimpan!" };

      case "submitRealCount":
        const tps = realCount.find(r => r.tps_id === payload.tps_id);
        if (!tps) return { success: false, message: "ID TPS tidak sinkron!" };
        if (tps.status_lock_suara === "Yes") return { success: false, message: "Data Real Count TPS Anda telah dikunci Pusat!" };

        tps.suara_calon_kita = payload.suara_calon_kita;
        tps.suara_lawan_1 = payload.suara_lawan_1;
        tps.suara_lawan_2 = payload.suara_lawan_2;
        tps.suara_tidak_sah = payload.suara_tidak_sah;
        tps.status_lock_suara = "Yes"; // auto-lock on submit for preview feel
        localStorage.setItem("sim_tps_real_count", JSON.stringify(realCount));
        return { success: true, message: "Data Real Count TPS berhasil dikunci dan dikirim!" };

      case "getDashboardData":
        // convert to matching GAS array format for backward compatibility
        const formattedRC = realCount.map(r => [r.tps_id, r.nama_tps, r.total_dpt_tps, r.suara_calon_kita, r.suara_lawan_1, r.suara_lawan_2, r.suara_tidak_sah, r.saksi_user_id, r.status_lock_suara]);
        const formattedVoters = voters.map(v => [v.voter_id, v.nik, v.klasifikasi, v.input_by, v.created_at]);
        return {
          success: true,
          votersCount: voters.length,
          dptCount: dpt.length,
          realCountData: formattedRC,
          votersList: formattedVoters
        };
    }
  },

  // STREAMING_CHUNK: Managing routing and views loading transitions...
  router: {
    views: {
      login: "login.html",
      Admin: "dashboard-admin.html",
      Timses: "dashboard-timses.html",
      Saksi: "dashboard-timses.html"
    },

    loadView: async function(role) {
      const container = document.getElementById("app-shell");
      container.innerHTML = `
        <div class="flex-1 flex flex-col items-center justify-center bg-navy-dark text-white p-8">
          <div class="animate-spin rounded-full h-10 w-10 border-4 border-t-transparent border-amber-400 mb-3"></div>
          <p class="text-xs text-gold tracking-widest font-bold uppercase">Memuat Template UI...</p>
        </div>`;
      
      try {
        const viewFile = this.views[role] || this.views.login;
        const res = await fetch(viewFile);
        if (!res.ok) throw new Error("Template HTML tidak ditemukan");
        
        container.innerHTML = await res.text();
        
        // Execute Hooks
        if (role === "Admin") appEngine.admin.initDashboard();
        if (role === "Timses" || role === "Saksi") appEngine.field.initFieldView(role);
      } catch (err) {
        container.innerHTML = `
          <div class="p-8 text-center text-red-600 font-bold bg-white min-h-screen flex flex-col items-center justify-center">
            <i class="fa-solid fa-triangle-exclamation text-4xl mb-3"></i>
            <p class="text-sm uppercase tracking-wide">Gagal Memuat Arsitektur UI</p>
            <p class="text-xs text-slate-400 mt-1">Pastikan file template HTML berada pada root repositori GitHub Anda.</p>
          </div>`;
      }
    },

    switchTab: function(tabId) {
      document.querySelectorAll(".tab-content").forEach(el => el.classList.add("hidden"));
      document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("text-gold", "bg-slate-800/60"));
      
      const activeTab = document.getElementById(`tab-${tabId}`);
      if(activeTab) activeTab.classList.remove("hidden");
      
      if(event && event.currentTarget) {
        event.currentTarget.classList.add("text-gold", "bg-slate-800/60");
      }
    }
  },

  // STREAMING_CHUNK: Admin Dashboard control systems...
  admin: {
    initDashboard: async function() {
      // Dynamic fallback badge updates
      const badge = document.getElementById("system-mode-badge");
      if (badge) {
        if (appEngine.isSimulation) {
          badge.innerText = "SIMULATION LOCAL DB";
          badge.className = "px-2.5 py-1 bg-amber-100 text-amber-800 text-[9px] font-black uppercase rounded-md tracking-wider border border-amber-200 shadow-sm";
        } else {
          badge.innerText = "LIVE CLOUD API";
          badge.className = "px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase rounded-md tracking-wider border border-emerald-200 shadow-sm";
        }
      }

      const profileName = document.getElementById("admin-profile-name");
      if(profileName && appEngine.session.user) profileName.innerText = appEngine.session.user.nama_lengkap;
      
      const settingsRes = await appEngine.request("getAppSettings");
      if(settingsRes.success && settingsRes.data) {
        appEngine.session.settings = settingsRes.data;
        const inputCandidate = document.getElementById("setting-candidate-name");
        if(inputCandidate) inputCandidate.value = settingsRes.data.nama_calon_kades;
        const bannerTitle = document.getElementById("hero-candidate-banner");
        if (bannerTitle && settingsRes.data.nama_calon_kades) {
          bannerTitle.innerText = `BERSAMA MEMBANGUN DESA DENGAN ${settingsRes.data.nama_calon_kades.toUpperCase()}`;
        }
      }

      const res = await appEngine.request("getDashboardData");
      if(res.success) {
        appEngine.session.dbCache = res;
        this.renderStatsAndTables(res);
      }
    },

    syncData: async function() {
      const btn = document.querySelector("header button");
      if(btn) btn.innerHTML = `<i class="fa-solid fa-rotate animate-spin text-xs"></i> MEMUAT...`;
      await this.initDashboard();
      if(btn) btn.innerHTML = `<i class="fa-solid fa-rotate text-xs"></i> SINKRON`;
    },

    renderStatsAndTables: function(data) {
      document.getElementById("stat-total-dpt").innerText = data.dptCount;
      document.getElementById("stat-total-voters").innerText = data.votersCount;
      
      const lockedTps = data.realCountData.filter(r => r[8].toString() === "Yes").length;
      const progress = data.realCountData.length > 0 ? Math.round((lockedTps / data.realCountData.length) * 100) : 0;
      document.getElementById("stat-realcount-progress").innerText = progress + "%";
      
      const tbodyTps = document.querySelector("#table-rekap-tps tbody");
      if(tbodyTps) {
        tbodyTps.innerHTML = "";
        let totalKita = 0, totalL1 = 0, totalL2 = 0;
        
        data.realCountData.forEach(row => {
          totalKita += Number(row[3] || 0);
          totalL1 += Number(row[4] || 0);
          totalL2 += Number(row[5] || 0);
          
          tbodyTps.innerHTML += `
            <tr class="hover:bg-slate-50 transition border-b border-slate-100">
              <td class="p-3 font-bold text-slate-800">${row[1]}</td>
              <td class="p-3 text-center text-emerald-600 font-black">${row[3] || 0}</td>
              <td class="p-3 text-center text-slate-700">${row[4] || 0}</td>
              <td class="p-3 text-center text-slate-700">${row[5] || 0}</td>
              <td class="p-3 text-center">
                <span class="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border ${row[8].toString() === 'Yes' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}">
                  ${row[8].toString() === 'Yes' ? 'KUNCI':'OPEN'}
                </span>
              </td>
            </tr>`;
        });
        
        this.initChart(totalKita, totalL1, totalL2);
      }
      
      const tbodyVoters = document.querySelector("#table-voters-list tbody");
      if(tbodyVoters) {
        tbodyVoters.innerHTML = "";
        data.votersList.forEach(row => {
          let badgeColor = "bg-blue-50 text-blue-800 border-blue-200";
          if(row[2] === "Pro") badgeColor = "bg-emerald-50 text-emerald-800 border-emerald-200";
          if(row[2] === "Kontra") badgeColor = "bg-red-50 text-red-800 border-red-200";
          
          tbodyVoters.innerHTML += `
            <tr class="hover:bg-slate-50 border-b border-slate-100 transition">
              <td class="p-3 font-mono font-bold text-slate-700 tracking-wider">${row[1]}</td>
              <td class="p-3"><span class="px-2.5 py-0.5 rounded-full text-[9px] font-black border ${badgeColor}">${row[2]}</span></td>
              <td class="p-3 text-slate-500 font-medium">${row[3]}</td>
              <td class="p-3 text-slate-400 font-medium">${new Date(row[4]).toLocaleDateString('id-ID')}</td>
            </tr>`;
        });
      }
    },

    initChart: function(kita, l1, l2) {
      const canvas = document.getElementById('chart-real-count-admin');
      if(!canvas) return;
      const ctx = canvas.getContext('2d');
      if(window.myPVSChart) window.myPVSChart.destroy();
      
      window.myPVSChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Calon Kita', 'Lawan 1', 'Lawan 2'],
          datasets: [{
            data: [kita, l1, l2],
            backgroundColor: ['#0B192C', '#EF4444', '#F59E0B'],
            borderColor: '#FFFFFF',
            borderWidth: 3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { boxWidth: 10, padding: 15, font: { size: 10, weight: 'bold' } }
            }
          }
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
      if(res.success) this.initDashboard();
    }
  },

  // STREAMING_CHUNK: Authentication systems...
  auth: {
    submit: async function(e) {
      e.preventDefault();
      const btn = document.getElementById("btn-login-submit");
      const alertBox = document.getElementById("login-alert");
      
      btn.disabled = true;
      btn.innerHTML = `<i class="fa-solid fa-spinner animate-spin"></i> Memverifikasi...`;
      
      const payload = {
        username: document.getElementById("login-username").value,
        password: document.getElementById("login-password").value
      };
      
      const res = await appEngine.request("login", payload);
      
      if(res.success) {
        localStorage.setItem("pvs_session_v56", JSON.stringify(res.user));
        appEngine.session.user = res.user;
        appEngine.router.loadView(res.user.role);
      } else {
        alertBox.className = "mb-5 p-4 rounded-2xl text-xs font-bold bg-red-50 text-red-700 border border-red-200 shadow-sm";
        alertBox.innerText = res.message;
        alertBox.classList.remove("hidden");
        btn.disabled = false;
        btn.innerHTML = `<span>MASUK KE SISTEM</span><i class="fa-solid fa-right-to-bracket text-xs"></i>`;
      }
    },

    checkSession: function() {
      const stored = localStorage.getItem("pvs_session_v56");
      if (stored) {
        appEngine.session.user = JSON.parse(stored);
        appEngine.router.loadView(appEngine.session.user.role);
      } else {
        appEngine.router.loadView("login");
      }
    },

    logout: function() {
      localStorage.removeItem("pvs_session_v56");
      appEngine.session.user = null;
      appEngine.router.loadView("login");
    }
  },

  // STREAMING_CHUNK: Field operations systems...
  field: {
    initFieldView: function(role) {
      document.getElementById("timses-profile-name").innerText = appEngine.session.user.nama_lengkap + ` [${role}]`;
      
      if(role === "Saksi") {
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
        
        if(myTps && myTps[8].toString() === "Yes") {
          const btn = document.getElementById("btn-rc-submit");
          if(btn) {
            btn.disabled = true;
            btn.className = "w-full mt-3 py-4 bg-slate-200 text-slate-400 font-extrabold text-xs tracking-widest rounded-2xl cursor-not-allowed flex items-center justify-center gap-2 border border-slate-300";
            btn.innerHTML = `<i class="fa-solid fa-lock text-sm"></i> DATA DIKUNCI OLEH PUSAT`;
          }
          document.querySelectorAll("#form-realcount-submission input").forEach(input => input.disabled = true);
          this.showToast("field-alert", "Data Berita Acara TPS Anda telah dikunci rapat di cloud server.", "error");
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
      
      this.showToast("field-alert", res.message, res.success ? "success" : "error");
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
      this.showToast("field-alert", res.message, res.success ? "success" : "error");
      if(res.success) this.checkTpsLockStatus();
    },

    showToast: function(boxId, message, status) {
      const box = document.getElementById(boxId);
      if(!box) return;
      box.innerText = message;
      box.className = `p-4 rounded-2xl text-xs font-bold tracking-wide shadow-sm ${status === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`;
      box.classList.remove("hidden");
    }
  },

  // Utilities systems...
  utils: {
    exportTableCSV: function(tableId) {
      const table = document.getElementById(tableId);
      if(!table) return;
      let csv = [];
      for (let i = 0; i < table.rows.length; i++) {
        let row = [], cols = table.rows[i].cells;
        for (let j = 0; j < cols.length; j++) row.push('"' + cols[j].innerText.trim().replace(/"/g, '""') + '"');
        csv.push(row.join(","));
      }
      const csvBlob = new Blob([csv.join("\n")], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(csvBlob);
      link.setAttribute("download", `PVS_Export_${tableId}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },

    printTable: function() {
      window.print();
    }
  }
};

window.addEventListener("DOMContentLoaded", () => appEngine.init());
