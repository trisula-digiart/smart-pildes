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

  // Inisialisasi awal aplikasi saat halaman dimuat
  init: async function() {
    this.checkDatabaseFallback();
    this.auth.checkSession();
  },

  // Mengatur database cadangan di browser jika GAS_API_URL masih kosong
  checkDatabaseFallback: function() {
    if (!GAS_API_URL || GAS_API_URL.trim() === "") {
      this.isSimulation = true;
      console.log("⚠️ TRISULA KERNEL: GAS_API_URL kosong. Beralih ke Mode Simulasi Offline.");
      
      // Setup data default untuk simulasi interaktif
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

  // Request broker pusat untuk komunikasi asinkronus ke server / lokal
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

  // Simulating backend logic inside browser storage
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

      case "getAppSettings":
        return { status: "success", data: settings };

      case "updateAppSettings":
        settings.nama_calon_kades = payload.nama_calon_kades;
        localStorage.setItem("sim_app_settings", JSON.stringify(settings));
        return { status: "success", message: "Konfigurasi lokal berhasil disimpan!" };

      case "registerTimses":
        const duplicate = users.find(u => u.username === payload.username);
        if (duplicate) return { status: "error", message: "Username sudah terdaftar!" };
        users.push({
          user_id: "USR-0" + (users.length + 1),
          username: payload.username,
          password_hash: payload.password,
          nama_lengkap: payload.nama_lengkap,
          role: "TIMSES",
          status_aktif: "Active"
        });
        localStorage.setItem("sim_users", JSON.stringify(users));
        return { status: "success", message: "Petugas lapangan baru berhasil didaftarkan!" };

      case "submitVoter":
        const dptMatch = dpt.find(d => d.nik === payload.nik.toString());
        if (!dptMatch) return { status: "error", message: "Data warga tidak terdaftar dalam DPT!" };
        
        const voterDuplicate = voters.find(v => v.nik === payload.nik.toString());
        if (voterDuplicate) return { status: "error", message: "NIK ini sudah didata sebelumnya oleh Timses!" };

        voters.push({
          voter_id: "VTR-" + Math.floor(Math.random() * 1000),
          nik: payload.nik.toString(),
          klasifikasi: payload.klasifikasi,
          input_by_user_id: this.session.user.user_id,
          created_at: new Date().toISOString()
        });
        localStorage.setItem("sim_warga_voters", JSON.stringify(voters));
        return { status: "success", message: `Data pemilih "${dptMatch.nama_warga}" berhasil diamankan!` };

      case "getAdminDashboard":
        const proCount = voters.filter(v => v.klasifikasi === "PRO").length;
        const kontraCount = voters.filter(v => v.klasifikasi === "KONTRA").length;
        const raguCount = voters.filter(v => v.klasifikasi === "RAGU-RAGU").length;
        
        // Formating lists for data tables
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

        // Spatial zoning maps
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
    }
  },

  // Sistem router pemindah halaman dinamis (Single Page Application)
  router: {
    // KUNCI UTAMA PERBAIKAN: Mengubah underscore (_) menjadi strip (-) agar sesuai nama file di GitHub
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

        // Lifecycle trigger setelah visual berhasil diinjeksi
        if (normalizedRole === "ADMIN") appEngine.admin.initDashboard();
        if (normalizedRole === "TIMSES") appEngine.field.initFieldView();
      } catch (err) {
        console.error("Router error:", err);
        container.innerHTML = `
          <div class="p-8 text-center text-red-500 font-bold bg-white min-h-screen flex flex-col items-center justify-center">
            <i class="fa-solid fa-triangle-exclamation text-4xl mb-3 text-gold"></i>
            <p class="text-sm uppercase tracking-wide">CORS / Template Loading Error</p>
            <p class="text-xs text-slate-400 font-normal mt-2 max-w-sm leading-relaxed">
              Pastikan Anda membuka file index.html menggunakan Local Web Server (seperti Live Server VS Code) atau jalankan langsung lewat GitHub Pages!
            </p>
          </div>`;
      }
    },

    switchTab: function(tabId) {
      document.querySelectorAll(".tab-content").forEach(el => el.classList.add("hidden"));
      document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("text-gold", "bg-slate-800/60"));

      const activeTab = document.getElementById(`tab-${tabId}`);
      if (activeTab) activeTab.classList.remove("hidden");

      if (window.event && window.event.currentTarget) {
        window.event.currentTarget.classList.add("text-gold", "bg-slate-800/60");
      }
    }
  },

  // Subsistem Otentikasi Pengguna
  auth: {
    submit: async function(e) {
      if (e) e.preventDefault();
      const btn = document.getElementById("btn-login-submit");
      const alertBox = document.getElementById("login-alert");

      if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-rotate animate-spin mr-2"></i> MEMVERIFIKASI...`;
      }

      const usernameEl = document.getElementById("login-username");
      const passwordEl = document.getElementById("login-password");
      const username = usernameEl ? usernameEl.value : "";
      const password = passwordEl ? passwordEl.value : "";

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

  // Subsistem Ruang Kontrol Admin (Desktop)
  admin: {
    activeSubTab: "subtab-dpt",

    initDashboard: async function() {
      const modeBadge = document.getElementById("system-mode-badge");
      if (modeBadge) {
        if (appEngine.isSimulation) {
          modeBadge.innerText = "MODE SIMULASI (OFFLINE)";
          modeBadge.className = "px-2.5 py-1 bg-amber-500/10 text-amber-400 text-[9px] font-black uppercase rounded-md tracking-wider border border-amber-500/30";
        } else {
          modeBadge.innerText = "LIVE SYNC ACTIVE";
          modeBadge.className = "px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase rounded-md tracking-wider border border-emerald-500/30";
        }
      }

      const profileName = document.getElementById("admin-profile-name");
      if (profileName && appEngine.session.user) {
        profileName.innerText = appEngine.session.user.nama_lengkap;
      }

      // Ambil seluruh data analitik dari server/fallback simulator
      const res = await appEngine.request("getAdminDashboard", { token: appEngine.session.user.token });
      if (res.status === "success") {
        appEngine.session.dbCache = res;
        
        // Update Brand Kades
        const candidateBanner = document.getElementById("hero-candidate-banner");
        if (candidateBanner && res.branding) {
          candidateBanner.innerText = `BERSAMA ${res.branding.nama_calon_kades.toUpperCase()} KITA SUKSESKAN PILKADES DAMAI`;
        }

        this.renderMetrics(res.metrics);
        this.renderTPSRecapTable(res.zoning);
        this.renderZoningChart(res.metrics);
        this.renderAnalyticsTable();
      }
    },

    syncData: async function() {
      await this.initDashboard();
    },

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
            <td class="p-3 text-center text-red-500 font-semibold">${zone.kontra}</td>
            <td class="p-3 text-center text-amber-500 font-semibold">${zone.ragu}</td>
          </tr>`;
      });
    },

    renderZoningChart: function(metrics) {
      const canvas = document.getElementById("chart-real-count-admin");
      if (!canvas) return;
      const ctx = canvas.getContext("2d");

      if (window.myPVSChart) window.myPVSChart.destroy();

      window.myPVSChart = new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: ["PRO (Dukukangan)", "KONTRA (Oposisi)", "RAGU-RAGU"],
          datasets: [{
            data: [metrics.pro, metrics.kontra, metrics.ragu],
            backgroundColor: ["#0B192C", "#EF4444", "#F59E0B"],
            borderColor: "#FFFFFF",
            borderWidth: 3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "bottom",
              labels: { boxWidth: 10, padding: 15, font: { size: 10, weight: "bold" } }
            }
          }
        }
      });
    },

    // Sistem Sub-Tabs Data Pemilih Lapangan
    switchSubTab: function(subTabId) {
      this.activeSubTab = subTabId;
      document.querySelectorAll(".sub-tab-btn").forEach(btn => {
        btn.className = "sub-tab-btn px-4 py-2 bg-white text-slate-500 hover:text-navy-dark text-xs font-bold rounded-xl border border-slate-100 transition";
      });
      const activeBtn = document.getElementById(`subtab-btn-${subTabId.replace('subtab-', '')}`);
      if (activeBtn) {
        activeBtn.className = "sub-tab-btn px-4 py-2 bg-navy-dark text-gold text-xs font-extrabold rounded-xl transition shadow-sm";
      }
      this.renderAnalyticsTable();
    },

    renderAnalyticsTable: function() {
      const data = appEngine.session.dbCache;
      if (!data) return;

      const head = document.getElementById("table-analytics-head");
      const body = document.getElementById("table-analytics-body");
      if (!head || !body) return;

      head.innerHTML = "";
      body.innerHTML = "";

      switch(this.activeSubTab) {
        case "subtab-dpt":
          head.innerHTML = `
            <tr>
              <th class="p-3">Nama Warga</th>
              <th class="p-3">NIK</th>
              <th class="p-3">Dusun</th>
              <th class="p-3 text-center">RT/RW</th>
              <th class="p-3 text-center">Orientasi</th>
            </tr>`;
          
          if (appEngine.isSimulation) {
            const dptList = JSON.parse(localStorage.getItem("sim_data_dpt"));
            const voters = JSON.parse(localStorage.getItem("sim_warga_voters"));
            
            dptList.forEach(item => {
              const match = voters.find(v => v.nik === item.nik);
              const badge = match 
                ? `<span class="px-2 py-0.5 rounded-full text-[9px] font-black border bg-emerald-50 text-emerald-800 border-emerald-200">${match.klasifikasi}</span>`
                : `<span class="px-2 py-0.5 rounded-full text-[9px] font-black border bg-slate-50 text-slate-400 border-slate-200">Belum Didata</span>`;
              
              body.innerHTML += `
                <tr class="hover:bg-slate-50 transition border-b border-slate-100">
                  <td class="p-3 font-bold text-slate-800">${item.nama_warga}</td>
                  <td class="p-3 font-mono text-slate-600">${item.nik}</td>
                  <td class="p-3">${item.dusun}</td>
                  <td class="p-3 text-center">RT ${item.rt} / RW ${item.rw}</td>
                  <td class="p-3 text-center">${badge}</td>
                </tr>`;
            });
          }
          break;

        case "subtab-rt-rw":
          head.innerHTML = `
            <tr>
              <th class="p-3">Lokasi RT/RW</th>
              <th class="p-3 text-center">Target DPT</th>
              <th class="p-3 text-center text-emerald-600">PRO</th>
              <th class="p-3 text-center text-red-500">KONTRA</th>
              <th class="p-3 text-center text-amber-500">RAGU-RAGU</th>
            </tr>`;

          data.zoning.forEach(zone => {
            body.innerHTML += `
              <tr class="hover:bg-slate-50 transition border-b border-slate-100">
                <td class="p-3 font-bold text-slate-800">${zone.zone}</td>
                <td class="p-3 text-center font-bold">${zone.dpt}</td>
                <td class="p-3 text-center text-emerald-600 font-extrabold">${zone.pro}</td>
                <td class="p-3 text-center text-red-500 font-extrabold">${zone.kontra}</td>
                <td class="p-3 text-center text-amber-500 font-extrabold">${zone.ragu}</td>
              </tr>`;
          });
          break;

        case "subtab-kk":
          head.innerHTML = `
            <tr>
              <th class="p-3">Nomor Kartu Keluarga (KK)</th>
              <th class="p-3">Dusun / RT / RW</th>
              <th class="p-3">Nama Kepala / Anggota</th>
              <th class="p-3 text-center">Status Pemetaan KK</th>
            </tr>`;

          if (appEngine.isSimulation) {
            const dptList = JSON.parse(localStorage.getItem("sim_data_dpt"));
            const voters = JSON.parse(localStorage.getItem("sim_warga_voters"));
            
            const kkMap = {};
            dptList.forEach(item => {
              if (!kkMap[item.no_kk]) {
                kkMap[item.no_kk] = { dusun: item.dusun, rt: item.rt, rw: item.rw, members: [], proCount: 0 };
              }
              const match = voters.find(v => v.nik === item.nik);
              kkMap[item.no_kk].members.push(item.nama_warga + (match ? ` (${match.klasifikasi})` : ''));
              if (match && match.klasifikasi === "PRO") kkMap[item.no_kk].proCount++;
            });

            for (let kk in kkMap) {
              const statusBadge = kkMap[kk].proCount > 0 
                ? `<span class="px-2 py-0.5 rounded-full text-[9px] font-black border bg-emerald-50 text-emerald-800 border-emerald-200">Aman (${kkMap[kk].proCount} Pro)</span>`
                : `<span class="px-2 py-0.5 rounded-full text-[9px] font-black border bg-red-50 text-red-800 border-red-200">Rentan</span>`;

              body.innerHTML += `
                <tr class="hover:bg-slate-50 transition border-b border-slate-100">
                  <td class="p-3 font-mono font-bold text-slate-800">${kk}</td>
                  <td class="p-3">${kkMap[kk].dusun} (RT ${kkMap[kk].rt}/RW ${kkMap[kk].rw})</td>
                  <td class="p-3 text-slate-500 font-medium">${kkMap[kk].members.join(", ")}</td>
                  <td class="p-3 text-center">${statusBadge}</td>
                </tr>`;
            }
          }
          break;

        case "subtab-timses":
          head.innerHTML = `
            <tr>
              <th class="p-3">Petugas Penginput (Timses)</th>
              <th class="p-3 text-center">Jumlah Warga Didata</th>
              <th class="p-3 text-center">Kontribusi Lapangan</th>
            </tr>`;

          const timsesStats = {};
          data.voters.forEach(v => {
            if (!timsesStats[v.input_by]) timsesStats[v.input_by] = 0;
            timsesStats[v.input_by]++;
          });

          const totalDataVoters = data.voters.length || 1;
          for (let name in timsesStats) {
            const percent = ((timsesStats[name] / totalDataVoters) * 100).toFixed(1);
            body.innerHTML += `
              <tr class="hover:bg-slate-50 transition border-b border-slate-100">
                <td class="p-3 font-bold text-slate-800">${name}</td>
                <td class="p-3 text-center font-extrabold text-blue-950">${timsesStats[name]} Warga</td>
                <td class="p-3 text-center font-bold text-slate-700">${percent}%</td>
              </tr>`;
          }
          break;

        case "subtab-unvisited":
          head.innerHTML = `
            <tr>
              <th class="p-3">Nama Warga</th>
              <th class="p-3">NIK</th>
              <th class="p-3">Dusun / RT / RW</th>
              <th class="p-3">Keterangan Status</th>
            </tr>`;

          if (appEngine.isSimulation) {
            const dptList = JSON.parse(localStorage.getItem("sim_data_dpt"));
            const voters = JSON.parse(localStorage.getItem("sim_warga_voters"));

            dptList.forEach(item => {
              const match = voters.find(v => v.nik === item.nik);
              const isRagu = match && match.klasifikasi === "RAGU-RAGU";
              const isUnvisited = !match;

              if (isRagu || isUnvisited) {
                const label = isRagu 
                  ? `<span class="px-2 py-0.5 rounded-full text-[9px] font-black border bg-amber-50 text-amber-800 border-amber-200">Konstituen Ragu-Ragu</span>`
                  : `<span class="px-2 py-0.5 rounded-full text-[9px] font-black border bg-red-50 text-red-800 border-red-200">Belum Dikunjungi</span>`;

                body.innerHTML += `
                  <tr class="hover:bg-slate-50 transition border-b border-slate-100">
                    <td class="p-3 font-bold text-slate-800">${item.nama_warga}</td>
                    <td class="p-3 font-mono text-slate-500">${item.nik}</td>
                    <td class="p-3">${item.dusun} / RT ${item.rt} / RW ${item.rw}</td>
                    <td class="p-3">${label}</td>
                  </tr>`;
              }
            });
          }
          break;
      }
    },

    saveSettings: async function(e) {
      if (e) e.preventDefault();
      const payload = {
        nama_calon_kades: document.getElementById("setting-candidate-name").value
      };
      const res = await appEngine.request("updateAppSettings", payload);
      alert(res.message);
      if (res.status === "success") this.initDashboard();
    },

    submitRegister: async function(e) {
      if (e) e.preventDefault();
      const alertBox = document.getElementById("register-alert");
      const payload = {
        nama_lengkap: document.getElementById("reg-name").value,
        username: document.getElementById("reg-username").value,
        password: document.getElementById("reg-password").value
      };

      const res = await appEngine.request("registerTimses", payload);
      
      if (alertBox) {
        alertBox.className = `p-3 rounded-xl text-xs font-bold mb-4 ${res.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`;
        alertBox.innerText = res.message;
        alertBox.classList.remove("hidden");
      }

      if (res.status === "success") {
        document.getElementById("form-register-timses").reset();
      }
    }
  },

  // Subsistem Operasional Lapangan (Mobile View Timses)
  field: {
    initFieldView: function() {
      const profileName = document.getElementById("timses-profile-name");
      if (profileName && appEngine.session.user) {
        profileName.innerText = appEngine.session.user.nama_lengkap;
      }
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
    exportTableCSV: function(tableId) {
      const table = document.getElementById(tableId);
      if (!table) return;
      let csv = [];
      for (let i = 0; i < table.rows.length; i++) {
        let row = [], cols = table.rows[i].cells;
        for (let j = 0; j < cols.length; j++) {
          row.push('"' + cols[j].innerText.trim().replace(/"/g, '""') + '"');
        }
        csv.push(row.join(","));
      }
      const csvBlob = new Blob([csv.join("\n")], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(csvBlob);
      link.setAttribute("download", `PVS_DATA_${tableId}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },

    printTable: function() {
      window.print();
    }
  }
};

// Menjalankan inisialisasi bootloader saat DOM siap
window.addEventListener("DOMContentLoaded", () => appEngine.init());
