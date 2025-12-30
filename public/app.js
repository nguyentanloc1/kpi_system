// ===== GLOBAL STATE =====
let currentUser = null;
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth() + 1;
let currentTab = 'commitment'; // 'commitment', 'kpi', 'level', 'dashboard', 'recruitment', 'admin'
let kpiMonthYear = null; // Store selected KPI month/year, format: { month, year }

// ===== UTILITY FUNCTIONS =====
function formatLargeNumber(value, kpiName = '', forceShort = false) {
  if (!value || value === '-') return '-';
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  
  // Special case: value = 1
  // If kpi_name contains "Tỷ lệ" (any ratio/percentage) -> show as 100%
  // Otherwise (e.g., "Số lượng") -> show as 1
  if (num === 1) {
    if (kpiName && kpiName.includes('Tỷ lệ')) {
      return '100%';
    }
    return '1';
  }
  
  // If value is between 0 and 1 (excluding 1), treat as percentage
  if (num > 0 && num < 1) {
    return (num * 100) + '%';
  }
  
  // For "Tỷ lệ %" indicators with value > 1, show as percentage directly
  if (kpiName && kpiName.includes('Tỷ lệ %') && num >= 1 && num <= 200) {
    return num.toFixed(1).replace('.0', '') + '%';
  }
  
  // Short format for very large numbers (revenue)
  if (num >= 1000000000) {
    const billions = num / 1000000000;
    return billions.toFixed(billions >= 10 ? 0 : 1).replace('.0', '') + ' tỷ';
  } else if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace('.0', '') + ' triệu';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1).replace('.0', '') + 'K';
  }
  return num.toLocaleString('vi-VN');
}

// ===== AUTH =====
function checkAuth() {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    currentUser = JSON.parse(userStr);
    return true;
  }
  return false;
}

function logout() {
  localStorage.removeItem('user');
  currentUser = null;
  renderApp();
}

// ===== MAIN APP =====
function renderApp() {
  const app = document.getElementById('app');
  if (!checkAuth()) {
    app.innerHTML = renderLoginPage();
    setupLoginListeners();
  } else {
    app.innerHTML = renderMainPage();
    setupMainPageListeners();
  }
}

// ===== LOGIN PAGE =====
function renderLoginPage() {
  return `
    <div class="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500"></div>
      <div class="absolute inset-0 overflow-hidden">
        <div class="absolute top-20 left-20 w-72 h-72 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div class="absolute bottom-20 right-20 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl"></div>
      </div>
      <div class="relative z-10 bg-white/95 backdrop-blur-xl p-10 rounded-3xl shadow-2xl w-full max-w-md">
        <div class="text-center mb-8">
          <div class="inline-block p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <i class="fas fa-chart-line text-5xl text-white"></i>
          </div>
          <h1 class="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Hệ thống KPI
          </h1>
          <p class="text-gray-600 mt-2 text-lg">Công ty Nhân Kiệt</p>
        </div>
        <div id="login-error" class="hidden mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg">
          <i class="fas fa-exclamation-circle mr-2"></i>
          <span id="error-message"></span>
        </div>
        <form id="login-form" class="space-y-6">
          <div>
            <label class="block text-gray-700 font-semibold mb-2">
              <i class="fas fa-user mr-2 text-blue-500"></i>
              Tên đăng nhập
            </label>
            <input type="text" id="username" class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="Nhập tên đăng nhập" required>
          </div>
          <div>
            <label class="block text-gray-700 font-semibold mb-2">
              <i class="fas fa-lock mr-2 text-purple-500"></i>
              Mật khẩu
            </label>
            <input type="password" id="password" class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all" placeholder="Nhập mật khẩu" required>
          </div>
          <button type="submit" class="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
            <i class="fas fa-sign-in-alt mr-2"></i>
            Đăng nhập
          </button>
        </form>
      </div>
    </div>
  `;
}

function setupLoginListeners() {
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('login-error');
    const errorMsg = document.getElementById('error-message');
    
    try {
      const response = await axios.post('/api/login', { username, password });
      if (response.data.success) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        if (response.data.adminRegions && response.data.adminRegions.length > 0) {
          localStorage.setItem('adminRegions', JSON.stringify(response.data.adminRegions));
        }
        currentUser = response.data.user;
        renderApp();
      }
    } catch (error) {
      errorDiv.classList.remove('hidden');
      errorMsg.textContent = error.response?.data?.error || 'Đã xảy ra lỗi';
    }
  });
}

// ===== MAIN PAGE =====
function renderMainPage() {
  const isAdmin = currentUser.username === 'admin';
  
  return `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <header class="bg-white shadow-lg sticky top-0 z-50">
        <div class="container mx-auto px-6 py-4">
          <!-- Mobile Header -->
          <div class="lg:hidden">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center space-x-2">
                <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <i class="fas fa-chart-line text-lg text-white"></i>
                </div>
                <div>
                  <h1 class="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Hệ thống KPI
                  </h1>
                  <p class="text-xs text-gray-600">Công ty Nhân Kiệt</p>
                </div>
              </div>
              <button onclick="showChangePasswordModal()" class="px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg text-sm mr-2" title="Đổi mật khẩu">
                <i class="fas fa-key"></i>
              </button>
              <button onclick="logout()" class="px-3 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg text-sm">
                <i class="fas fa-sign-out-alt"></i>
              </button>
            </div>
            <div class="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
              <p class="font-semibold text-sm text-gray-800 mb-1">${currentUser.full_name}</p>
              <div class="flex items-center space-x-2">
                <span class="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
                  <i class="fas fa-map-marker-alt mr-1"></i>${currentUser.region_name}
                </span>
                <span class="text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded-full">
                  <i class="fas fa-user-tie mr-1"></i>${currentUser.position_display}
                </span>
              </div>
            </div>
          </div>
          
          <!-- Desktop Header -->
          <div class="hidden lg:flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <i class="fas fa-chart-line text-2xl text-white"></i>
              </div>
              <div>
                <h1 class="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Hệ thống KPI
                </h1>
                <p class="text-sm text-gray-600">Công ty Nhân Kiệt</p>
              </div>
            </div>
            <div class="flex items-center space-x-4">
              <div class="text-right">
                <p class="font-semibold text-gray-800">${currentUser.full_name}</p>
                <div class="flex items-center justify-end space-x-2 mt-1">
                  <span class="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full border border-blue-300">
                    <i class="fas fa-map-marker-alt mr-1"></i>${currentUser.region_name}
                  </span>
                  <span class="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full border border-purple-300">
                    <i class="fas fa-user-tie mr-1"></i>${currentUser.position_display}
                  </span>
                </div>
              </div>
              <div class="flex space-x-2">
                <button onclick="showChangePasswordModal()" class="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:shadow-lg transition-all duration-300" title="Đổi mật khẩu">
                  <i class="fas fa-key mr-2"></i>
                  Đổi mật khẩu
                </button>
                <button onclick="logout()" class="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all duration-300">
                  <i class="fas fa-sign-out-alt mr-2"></i>
                  Đăng xuất
                </button>
              </div>
            </div>
          </div>
          
          <!-- Desktop Tabs -->
          <div class="hidden lg:flex space-x-2 mt-6 border-b border-gray-200">
            ${!isAdmin ? `
              <button onclick="switchTab('commitment')" id="tab-commitment" class="px-6 py-3 font-semibold transition-all duration-300 rounded-t-lg">
                <i class="fas fa-file-contract mr-2"></i>Cam Kết Mục Tiêu 2026
              </button>
              <button onclick="switchTab('kpi')" id="tab-kpi" class="px-6 py-3 font-semibold transition-all duration-300 rounded-t-lg">
                <i class="fas fa-edit mr-2"></i>Nhập KPI
              </button>
              <button onclick="switchTab('level')" id="tab-level" class="px-6 py-3 font-semibold transition-all duration-300 rounded-t-lg">
                <i class="fas fa-star mr-2"></i>Level
              </button>
              <button onclick="switchTab('tracking')" id="tab-tracking" class="px-6 py-3 font-semibold transition-all duration-300 rounded-t-lg">
                <i class="fas fa-history mr-2"></i>Theo dõi KPI/Level
              </button>
              <button onclick="switchTab('dashboard')" id="tab-dashboard" class="px-6 py-3 font-semibold transition-all duration-300 rounded-t-lg">
                <i class="fas fa-chart-bar mr-2"></i>Dashboard
              </button>
              ${currentUser.position_id === 4 ? `
                <button onclick="switchTab('recruitment')" id="tab-recruitment" class="px-6 py-3 font-semibold transition-all duration-300 rounded-t-lg">
                  <i class="fas fa-chart-line mr-2"></i>Biểu đồ Tuyển dụng
                </button>
              ` : ''}
            ` : `
              <button onclick="switchTab('admin')" id="tab-admin" class="px-6 py-3 font-semibold transition-all duration-300 rounded-t-lg">
                <i class="fas fa-cog mr-2"></i>Admin
              </button>
            `}
          </div>
        </div>
      </header>
      
      <!-- Main Content with padding for mobile bottom nav -->
      <main class="container mx-auto px-3 lg:px-6 py-4 lg:py-8 pb-20 lg:pb-8">
        <div id="tab-content"></div>
      </main>
      
      <!-- Mobile Bottom Navigation (Fixed at bottom) -->
      <nav class="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-50">
        <div class="grid ${!isAdmin ? 'grid-cols-5' : 'grid-cols-1'}">
          ${!isAdmin ? `
            <button onclick="switchTab('commitment')" id="mobile-tab-commitment" class="flex flex-col items-center justify-center py-2.5 px-1 transition-all duration-200">
              <i class="fas fa-file-contract text-xl mb-1"></i>
              <span class="text-[10px] font-medium">Cam Kết</span>
            </button>
            <button onclick="switchTab('kpi')" id="mobile-tab-kpi" class="flex flex-col items-center justify-center py-2.5 px-1 transition-all duration-200">
              <i class="fas fa-edit text-xl mb-1"></i>
              <span class="text-[10px] font-medium">KPI</span>
            </button>
            <button onclick="switchTab('level')" id="mobile-tab-level" class="flex flex-col items-center justify-center py-2.5 px-1 transition-all duration-200">
              <i class="fas fa-star text-xl mb-1"></i>
              <span class="text-[10px] font-medium">Level</span>
            </button>
            <button onclick="switchTab('tracking')" id="mobile-tab-tracking" class="flex flex-col items-center justify-center py-2.5 px-1 transition-all duration-200">
              <i class="fas fa-history text-xl mb-1"></i>
              <span class="text-[10px] font-medium">Theo dõi</span>
            </button>
            <button onclick="switchTab('dashboard')" id="mobile-tab-dashboard" class="flex flex-col items-center justify-center py-2.5 px-1 transition-all duration-200">
              <i class="fas fa-chart-bar text-xl mb-1"></i>
              <span class="text-[10px] font-medium">Biểu đồ</span>
            </button>
          ` : `
            <button onclick="switchTab('admin')" id="mobile-tab-admin" class="flex flex-col items-center justify-center py-3 transition-all duration-200">
              <i class="fas fa-cog text-2xl mb-1"></i>
              <span class="text-sm font-medium">Admin</span>
            </button>
          `}
        </div>
      </nav>
    </div>
  `;
}

function setupMainPageListeners() {
  const isAdmin = currentUser.username === 'admin';
  if (isAdmin) {
    switchTab('admin');
  } else {
    switchTab('kpi');
  }
}

function switchTab(tab) {
  currentTab = tab;
  
  // Update desktop tab styling
  document.querySelectorAll('[id^="tab-"]').forEach(btn => {
    btn.classList.remove('bg-gradient-to-r', 'from-blue-500', 'to-purple-600', 'text-white', 'shadow-lg');
    btn.classList.add('text-gray-600', 'hover:text-gray-800');
  });
  
  const activeTab = document.getElementById(`tab-${tab}`);
  if (activeTab) {
    activeTab.classList.add('bg-gradient-to-r', 'from-blue-500', 'to-purple-600', 'text-white', 'shadow-lg');
    activeTab.classList.remove('text-gray-600', 'hover:text-gray-800');
  }
  
  // Update mobile tab styling
  document.querySelectorAll('[id^="mobile-tab-"]').forEach(btn => {
    btn.classList.remove('bg-gradient-to-t', 'from-blue-500', 'to-purple-600', 'text-white');
    btn.classList.add('text-gray-500');
  });
  
  const activeMobileTab = document.getElementById(`mobile-tab-${tab}`);
  if (activeMobileTab) {
    activeMobileTab.classList.add('bg-gradient-to-t', 'from-blue-500', 'to-purple-600', 'text-white');
    activeMobileTab.classList.remove('text-gray-500');
  }
  
  // Render content
  const content = document.getElementById('tab-content');
  if (tab === 'kpi') {
    renderKpiTab(content);
  } else if (tab === 'level') {
    renderLevelTab(content);
  } else if (tab === 'tracking') {
    renderTrackingTab(content);
  } else if (tab === 'dashboard') {
    renderDashboardTab(content);
  } else if (tab === 'commitment') {
    renderCommitmentTab(content);
  } else if (tab === 'recruitment') {
    renderRecruitmentTab(content);
  } else if (tab === 'admin') {
    renderAdminTab(content);
  }
}

// ===== KPI TAB =====
function renderKpiTab(container) {
  container.innerHTML = `
    <div class="bg-white rounded-xl lg:rounded-2xl shadow-lg lg:shadow-xl p-4 lg:p-8">
      <!-- Header Section -->
      <div class="mb-4 lg:mb-6">
        <h2 class="text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3 lg:mb-4">
          <i class="fas fa-edit mr-2"></i>Nhập chỉ số KPI
        </h2>
        
        <!-- Mobile: Stacked layout -->
        <div class="lg:hidden space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1.5">Tháng</label>
              <select id="kpi-month" class="w-full px-3 py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                ${Array.from({length: 12}, (_, i) => i + 1).map(m => 
                  `<option value="${m}" ${m === currentMonth ? 'selected' : ''}>Tháng ${m}</option>`
                ).join('')}
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1.5">Năm</label>
              <select id="kpi-year" class="w-full px-3 py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="2026" selected>Năm 2026</option>
              </select>
            </div>
          </div>
          <button id="load-kpi-btn" class="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all">
            <i class="fas fa-sync-alt mr-2"></i>Tải dữ liệu
          </button>
        </div>
        
        <!-- Desktop: Horizontal layout -->
        <div class="hidden lg:flex items-end space-x-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">Tháng</label>
            <select id="kpi-month-desktop" class="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              ${Array.from({length: 12}, (_, i) => i + 1).map(m => 
                `<option value="${m}" ${m === currentMonth ? 'selected' : ''}>Tháng ${m}</option>`
              ).join('')}
            </select>
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">Năm</label>
            <select id="kpi-year-desktop" class="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="2026" selected>Năm 2026</option>
            </select>
          </div>
          <div>
            <button id="load-kpi-btn-desktop" class="px-6 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg hover:shadow-lg transition-all">
              <i class="fas fa-sync-alt mr-2"></i>Tải dữ liệu
            </button>
          </div>
        </div>
      </div>
      
      <div id="kpi-form-container" class="text-center py-12 text-gray-500">
        <i class="fas fa-spinner fa-spin text-3xl lg:text-4xl mb-4"></i>
        <p class="text-sm lg:text-base">Đang tải dữ liệu...</p>
      </div>
      
      <div id="kpi-save-section" class="mt-4 lg:mt-6 hidden">
        <button id="save-kpi-btn" class="w-full px-4 lg:px-6 py-3 lg:py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg lg:rounded-xl font-bold text-base lg:text-lg hover:shadow-xl transform hover:-translate-y-1 transition-all">
          <i class="fas fa-save mr-2"></i>Lưu dữ liệu KPI
        </button>
        <div id="kpi-save-message" class="mt-3 lg:mt-4"></div>
        
        <!-- KPI Summary Box -->
        <div id="kpi-summary" class="mt-4 lg:mt-6 hidden bg-gradient-to-r from-blue-50 to-purple-50 p-4 lg:p-6 rounded-lg lg:rounded-xl border-2 border-blue-300 shadow-lg">
          <h3 class="text-lg lg:text-xl font-bold text-blue-800 mb-3 lg:mb-4 flex items-center">
            <i class="fas fa-chart-pie mr-2"></i>Tổng kết KPI
          </h3>
          <div class="bg-white p-3 lg:p-4 rounded-lg shadow">
            <div class="text-center">
              <p class="text-xs lg:text-sm text-gray-600 mb-2">% KPI đạt được</p>
              <p id="kpi-total-percent" class="text-3xl lg:text-4xl font-bold text-blue-600">0%</p>
            </div>
          </div>
        </div>
        
        <!-- KPI History Table -->
        <div id="kpi-history" class="mt-6 lg:mt-8 hidden">
          <h3 class="text-lg lg:text-xl font-bold text-blue-800 mb-3 lg:mb-4 flex items-center">
            <i class="fas fa-history mr-2"></i>Lịch sử nhập KPI các tháng
          </h3>
          <div id="kpi-history-content"></div>
        </div>
      </div>
    </div>
  `;
  
  loadKpiData();
  
  // Setup mobile listeners
  document.getElementById('load-kpi-btn').addEventListener('click', loadKpiData);
  document.getElementById('save-kpi-btn').addEventListener('click', saveKpiData);
  document.getElementById('kpi-month').addEventListener('change', () => {
    const month = document.getElementById('kpi-month').value;
    const desktopMonth = document.getElementById('kpi-month-desktop');
    if (desktopMonth) desktopMonth.value = month;
    loadKpiData();
    if (currentTab === 'level') {
      loadLevelData();
    }
  });
  document.getElementById('kpi-year').addEventListener('change', () => {
    const year = document.getElementById('kpi-year').value;
    const desktopYear = document.getElementById('kpi-year-desktop');
    if (desktopYear) desktopYear.value = year;
    loadKpiData();
    if (currentTab === 'level') {
      loadLevelData();
    }
  });
  
  // Setup desktop listeners (if exists)
  const desktopLoadBtn = document.getElementById('load-kpi-btn-desktop');
  if (desktopLoadBtn) {
    desktopLoadBtn.addEventListener('click', loadKpiData);
    document.getElementById('kpi-month-desktop').addEventListener('change', () => {
      const month = document.getElementById('kpi-month-desktop').value;
      document.getElementById('kpi-month').value = month;
      loadKpiData();
      if (currentTab === 'level') {
        loadLevelData();
      }
    });
    document.getElementById('kpi-year-desktop').addEventListener('change', () => {
      const year = document.getElementById('kpi-year-desktop').value;
      document.getElementById('kpi-year').value = year;
      loadKpiData();
      if (currentTab === 'level') {
        loadLevelData();
      }
    });
  }
}

async function loadKpiData() {
  const month = document.getElementById('kpi-month').value;
  const year = document.getElementById('kpi-year').value;
  const container = document.getElementById('kpi-form-container');
  
  // Store selected month/year for Level tab
  kpiMonthYear = { month: parseInt(month), year: parseInt(year) };
  
  container.innerHTML = '<div class="text-center py-12"><i class="fas fa-spinner fa-spin text-4xl text-blue-500"></i></div>';
  
  try {
    // Use new API with revenue plan
    const response = await axios.get(
      `/api/kpi-form-data/${currentUser.id}/${currentUser.position_id}/${year}/${month}?type=kpi`
    );
    const { templates, revenuePlan, existingData } = response.data;
    
    // Create data map
    const dataMap = {};
    existingData.forEach(item => {
      // Convert decimal back to percentage for display (0.7 -> 70)
      let displayValue = item.actual_value;
      const isRevenueGrowthKpi = item.kpi_name && item.kpi_name.includes('doanh thu tăng trưởng');
      const isPercentageKpi = item.kpi_name && item.kpi_name.includes('Tỷ lệ') && !isRevenueGrowthKpi;
      if (isPercentageKpi && displayValue < 2) {
        displayValue = item.actual_value * 100;
      }
      dataMap[item.kpi_template_id] = displayValue;
    });
    
    // Check if user position has revenue KPIs (PTGĐ=1, GĐKDCC=5, GĐKD=2, TLKD=3)
    const hasRevenue = [1, 2, 3, 5].includes(currentUser.position_id);
    
    // Render form
    let html = '';
    
    // Revenue plan info (if applicable)
    if (hasRevenue && revenuePlan) {
      html += `
        <div class="bg-gradient-to-r from-green-50 to-emerald-50 p-5 rounded-xl mb-6 border-2 border-green-200">
          <div class="flex items-center space-x-3">
            <i class="fas fa-chart-line text-2xl text-green-600"></i>
            <p class="font-bold text-green-900 text-lg">Kế hoạch doanh thu tháng ${month}: ${formatLargeNumber(revenuePlan)}</p>
          </div>
        </div>
      `;
    } else if (hasRevenue && !revenuePlan) {
      html += `
        <div class="bg-yellow-50 p-4 rounded-lg mb-6 border border-yellow-300">
          <i class="fas fa-exclamation-triangle text-yellow-600 mr-2"></i>
          <span class="text-yellow-800">Chưa có kế hoạch doanh thu cho tháng ${month}. Vui lòng liên hệ Admin.</span>
        </div>
      `;
    }
    
    // Render KPI inputs
    html += '<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">';
    
    const half = Math.ceil(templates.length / 2);
    const leftTemplates = templates.slice(0, half);
    const rightTemplates = templates.slice(half);
    
    // Left column
    html += '<div>';
    leftTemplates.forEach((template, idx) => {
      html += renderKpiInput(template, idx + 1, dataMap[template.id] || '', revenuePlan, hasRevenue, month);
    });
    html += '</div>';
    
    // Right column  
    html += '<div>';
    rightTemplates.forEach((template, idx) => {
      html += renderKpiInput(template, half + idx + 1, dataMap[template.id] || '', revenuePlan, hasRevenue, month);
    });
    html += '</div>';
    
    html += '</div>';
    
    container.innerHTML = html;
    document.getElementById('kpi-save-section').classList.remove('hidden');
    
    // Load history for the year
    await loadKpiHistory(year);
    
  } catch (error) {
    console.error('Error loading KPI:', error);
    container.innerHTML = `<div class="text-center py-12 text-red-500"><i class="fas fa-exclamation-triangle mr-2"></i>Lỗi tải dữ liệu</div>`;
  }
}

function renderKpiInput(template, index, value, revenuePlan, hasRevenue, month) {
  const isRevenueKpi = template.kpi_name && template.kpi_name.includes('doanh thu tăng trưởng');
  
  let inputHtml = '';
  let infoHtml = '';
  
  if (isRevenueKpi && hasRevenue) {
    // Revenue KPI - show special input with or without plan
    if (revenuePlan) {
      // Has plan - show calculator
      inputHtml = `
        <div class="space-y-3">
          <div>
            <label class="text-sm font-bold text-gray-700 mb-2 block bg-yellow-50 px-3 py-2 rounded-lg border border-yellow-200">
              <i class="fas fa-hand-point-right mr-2 text-orange-500"></i>
              Nhập doanh thu thực tế tháng ${month} (Tỷ VNĐ):
            </label>
            <input 
              type="number" 
              step="0.01"
              data-template-id="${template.id}"
              data-type="kpi"
              data-is-revenue="true"
              data-revenue-plan="${revenuePlan}"
              class="kpi-input w-full px-3 lg:px-4 py-2.5 lg:py-3 text-sm lg:text-base border-2 border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-all font-semibold"
              placeholder="VD: 5.5 (nghĩa là 5.5 tỷ VNĐ)"
              value="${value}"
              oninput="calculateRevenuePercent(this)"
            >
          </div>
          <div id="revenue-result-${template.id}" class="hidden bg-blue-50 p-3 rounded-lg border border-blue-200">
            <span class="text-sm text-blue-800 font-semibold">
              <i class="fas fa-calculator mr-1"></i>Tỷ lệ đạt: <span id="revenue-percent-${template.id}" class="text-lg font-bold text-blue-900">0%</span>
            </span>
          </div>
        </div>
      `;
    } else {
      // No plan - just show input with warning
      inputHtml = `
        <div class="space-y-3">
          <div class="bg-orange-50 p-3 rounded-lg border border-orange-300 mb-3">
            <i class="fas fa-exclamation-triangle text-orange-600 mr-2"></i>
            <span class="text-sm text-orange-800 font-semibold">
              Chưa có kế hoạch doanh thu. Hệ thống sẽ dùng giá trị chuẩn để tính %.
            </span>
          </div>
          <div>
            <label class="text-sm font-bold text-gray-700 mb-2 block bg-yellow-50 px-3 py-2 rounded-lg border border-yellow-200">
              <i class="fas fa-hand-point-right mr-2 text-orange-500"></i>
              Nhập doanh thu thực tế tháng ${month} (Tỷ VNĐ):
            </label>
            <input 
              type="number" 
              step="0.01"
              data-template-id="${template.id}"
              data-type="kpi"
              class="kpi-input w-full px-3 lg:px-4 py-2.5 lg:py-3 text-sm lg:text-base border-2 border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-semibold"
              placeholder="VD: 5.5 (nghĩa là 5.5 tỷ VNĐ)"
              value="${value}"
            >
          </div>
        </div>
      `;
    }
    
    // No instructions needed - removed per user request
    infoHtml = '';
  } else {
    // Normal input with auto-calculate
    const isRevenueGrowthKpi = template.kpi_name && template.kpi_name.includes('doanh thu tăng trưởng');
    const isPercentageKpi = template.kpi_name && template.kpi_name.includes('Tỷ lệ') && !isRevenueGrowthKpi;
    const placeholder = isPercentageKpi ? 'Nhập số % (ví dụ: 70 cho 70%)' : 'Nhập giá trị thực tế đạt được';
    
    inputHtml = `
      <input 
        type="number" 
        step="0.01"
        data-template-id="${template.id}"
        data-standard="${template.standard_value}"
        data-is-percentage="${isPercentageKpi}"
        data-type="kpi"
        class="kpi-input w-full px-3 lg:px-4 py-2.5 lg:py-3 text-sm lg:text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        placeholder="${placeholder}"
        value="${value}"
        oninput="calculateKpiPercent(this)"
      >
      <div id="kpi-result-${template.id}" class="hidden mt-2 bg-blue-50 p-3 rounded-lg border border-blue-200">
        <span class="text-sm text-blue-800 font-semibold">
          <i class="fas fa-calculator mr-1"></i>Tỷ lệ đạt: <span id="kpi-percent-${template.id}" class="text-lg font-bold text-blue-900">0%</span>
        </span>
      </div>
    `;
  }
  
  return `
    <div class="bg-gradient-to-r from-blue-50 to-purple-50 p-3 lg:p-6 rounded-lg lg:rounded-xl mb-3 lg:mb-4 hover:shadow-lg transition-all border-2 border-blue-100">
      <div class="flex items-start space-x-2 lg:space-x-4">
        <div class="flex-shrink-0 w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm lg:text-base shadow-md">
          ${index}
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="font-bold text-gray-800 mb-2 lg:mb-3 text-sm lg:text-lg leading-snug">${template.kpi_name}</h3>
          <div class="flex flex-wrap items-center gap-2 mb-2 lg:mb-3">
            <span class="text-xs lg:text-sm px-2 lg:px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full border border-yellow-300 font-semibold whitespace-nowrap">
              <i class="fas fa-weight-hanging mr-1"></i>Trọng số: ${(template.weight * 100).toFixed(0)}%
            </span>
            <span class="text-xs lg:text-sm px-2 lg:px-3 py-1 bg-green-100 text-green-800 rounded-full border border-green-300 font-semibold whitespace-nowrap">
              <i class="fas fa-check-circle mr-1"></i>Chuẩn: ${formatLargeNumber(template.standard_value, template.kpi_name)}
            </span>
          </div>
          ${inputHtml}
          ${infoHtml}
        </div>
      </div>
    </div>
  `;
}

function calculateRevenuePercent(input) {
  const templateId = input.dataset.templateId;
  const revenuePlan = parseFloat(input.dataset.revenuePlan);
  const actualRevenue = parseFloat(input.value) || 0;
  
  const percent = Math.min((actualRevenue / revenuePlan) * 100, 150);
  
  const resultDiv = document.getElementById(`revenue-result-${templateId}`);
  const percentSpan = document.getElementById(`revenue-percent-${templateId}`);
  
  if (actualRevenue > 0) {
    resultDiv.classList.remove('hidden');
    percentSpan.textContent = percent.toFixed(1) + '%';
    percentSpan.className = percent >= 100 ? 'text-lg font-bold text-green-600' : 'text-lg font-bold text-orange-600';
  } else {
    resultDiv.classList.add('hidden');
  }
}

function calculateKpiPercent(input) {
  const templateId = input.dataset.templateId;
  const standardValue = parseFloat(input.dataset.standard);
  const actualValue = parseFloat(input.value) || 0;
  const isPercentage = input.dataset.isPercentage === 'true';
  
  if (!standardValue || standardValue === 0) return;
  
  // If it's a percentage KPI, convert input (70) to decimal (0.7)
  const adjustedValue = isPercentage ? actualValue / 100 : actualValue;
  
  const percent = Math.min((adjustedValue / standardValue) * 100, 150);
  
  const resultDiv = document.getElementById(`kpi-result-${templateId}`);
  const percentSpan = document.getElementById(`kpi-percent-${templateId}`);
  
  if (actualValue > 0) {
    resultDiv.classList.remove('hidden');
    percentSpan.textContent = percent.toFixed(1) + '%';
    percentSpan.className = percent >= 100 ? 'text-lg font-bold text-green-600' : 'text-lg font-bold text-orange-600';
  } else {
    resultDiv.classList.add('hidden');
  }
}

async function saveKpiData() {
  const month = document.getElementById('kpi-month').value;
  const year = document.getElementById('kpi-year').value;
  const messageDiv = document.getElementById('kpi-save-message');
  
  messageDiv.innerHTML = '<div class="text-center text-blue-600"><i class="fas fa-spinner fa-spin mr-2"></i>Đang lưu...</div>';
  
  const inputs = document.querySelectorAll('.kpi-input');
  const kpiData = [];
  
  inputs.forEach(input => {
    const value = parseFloat(input.value);
    if (!isNaN(value)) {
      kpiData.push({
        templateId: parseInt(input.dataset.templateId),
        actualValue: value
      });
    }
  });
  
  try {
    await axios.post('/api/kpi-data', {
      userId: currentUser.id,
      year: parseInt(year),
      month: parseInt(month),
      kpiData
    });
    
    messageDiv.innerHTML = `
      <div class="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-lg">
        <i class="fas fa-check-circle mr-2"></i>
        Lưu dữ liệu thành công! Dữ liệu Level đã được tự động điền.
      </div>
    `;
    
    // Load and show KPI summary
    await loadKpiSummary(year, month);
    
    // Load and show KPI history
    await loadKpiHistory(year);
    
    setTimeout(() => {
      messageDiv.innerHTML = '';
    }, 3000);
    
  } catch (error) {
    messageDiv.innerHTML = `
      <div class="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg">
        <i class="fas fa-exclamation-circle mr-2"></i>
        Lỗi lưu dữ liệu
      </div>
    `;
  }
}

async function loadKpiSummary(year, month) {
  try {
    const response = await axios.get(`/api/summary/${currentUser.id}/${year}/${month}`);
    const summary = response.data.summary;
    
    if (summary) {
      const summaryBox = document.getElementById('kpi-summary');
      const percentDiv = document.getElementById('kpi-total-percent');
      
      const kpiPercent = ((summary.total_kpi_score || 0) * 100).toFixed(1);
      percentDiv.textContent = kpiPercent + '%';
      percentDiv.className = `text-4xl font-bold ${kpiPercent >= 100 ? 'text-green-600' : 'text-orange-600'}`;
      
      summaryBox.classList.remove('hidden');
    }
  } catch (error) {
    console.error('Error loading KPI summary:', error);
  }
}

async function loadKpiHistory(year) {
  try {
    const response = await axios.get(`/api/monthly-summary/${currentUser.id}/${year}`);
    const summaries = response.data.summaries || [];
    
    if (summaries.length > 0) {
      const historyBox = document.getElementById('kpi-history');
      const contentDiv = document.getElementById('kpi-history-content');
      
      let html = `
        <div class="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-xl border-2 border-blue-200">
          <div class="overflow-x-auto">
            <table class="w-full border-collapse">
              <thead>
                <tr class="bg-blue-100">
                  <th class="border border-blue-300 px-4 py-3 text-left font-bold">Tháng</th>
                  <th class="border border-blue-300 px-4 py-3 text-center font-bold">% KPI</th>
                  <th class="border border-blue-300 px-4 py-3 text-center font-bold">Ngày nhập</th>
                </tr>
              </thead>
              <tbody>
      `;
      
      summaries.forEach(summary => {
        const kpiPercent = ((summary.total_kpi_score || 0) * 100).toFixed(1);
        const kpiColor = kpiPercent >= 100 ? 'text-green-600' : kpiPercent >= 50 ? 'text-yellow-600' : 'text-red-600';
        const date = new Date(summary.created_at).toLocaleDateString('vi-VN');
        
        html += `
          <tr class="hover:bg-blue-50">
            <td class="border border-blue-200 px-4 py-3 font-semibold">Tháng ${summary.month}</td>
            <td class="border border-blue-200 px-4 py-3 text-center ${kpiColor} font-bold text-lg">${kpiPercent}%</td>
            <td class="border border-blue-200 px-4 py-3 text-center text-gray-600 text-sm">${date}</td>
          </tr>
        `;
      });
      
      html += `
              </tbody>
            </table>
          </div>
        </div>
      `;
      
      contentDiv.innerHTML = html;
      historyBox.classList.remove('hidden');
    }
  } catch (error) {
    console.error('Error loading KPI history:', error);
  }
}

async function loadLevelSummary(year, month) {
  try {
    const response = await axios.get(`/api/summary/${currentUser.id}/${year}/${month}`);
    const summary = response.data.summary;
    
    if (summary && summary.total_level_score) {
      const summaryBox = document.getElementById('level-summary');
      const percentDiv = document.getElementById('level-total-percent');
      const classDiv = document.getElementById('level-classification');
      
      const levelPercent = ((summary.total_level_score || 0) * 100).toFixed(1);
      percentDiv.textContent = levelPercent + '%';
      percentDiv.className = `text-4xl font-bold ${levelPercent >= 100 ? 'text-green-600' : 'text-orange-600'}`;
      
      classDiv.textContent = summary.performance_level || '-';
      const levelColor = getLevelColor(summary.performance_level);
      classDiv.className = `text-2xl font-bold ${levelColor}`;
      
      summaryBox.classList.remove('hidden');
    }
  } catch (error) {
    console.error('Error loading Level summary:', error);
  }
}

async function loadLevelHistory(year) {
  try {
    const response = await axios.get(`/api/monthly-summary/${currentUser.id}/${year}`);
    const summaries = response.data.summaries || [];
    
    if (summaries.length > 0) {
      const historyBox = document.getElementById('level-history');
      const contentDiv = document.getElementById('level-history-content');
      
      let html = `
        <div class="bg-gradient-to-r from-purple-50 to-pink-50 p-4 md:p-6 rounded-xl border-2 border-purple-200">
          <div class="overflow-x-auto -mx-4 md:mx-0">
            <table class="w-full border-collapse min-w-[500px]">
              <thead>
                <tr class="bg-purple-100">
                  <th class="border border-purple-300 px-2 md:px-4 py-2 md:py-3 text-left font-bold text-xs md:text-sm">Tháng</th>
                  <th class="border border-purple-300 px-2 md:px-4 py-2 md:py-3 text-center font-bold text-xs md:text-sm">% Level</th>
                  <th class="border border-purple-300 px-2 md:px-4 py-2 md:py-3 text-center font-bold text-xs md:text-sm">Xếp loại</th>
                  <th class="border border-purple-300 px-2 md:px-4 py-2 md:py-3 text-center font-bold text-xs md:text-sm">Ngày nhập</th>
                </tr>
              </thead>
              <tbody>
      `;
      
      summaries.forEach(summary => {
        const levelPercent = ((summary.total_level_score || 0) * 100).toFixed(1);
        const levelColor = levelPercent >= 100 ? 'text-green-600' : levelPercent >= 50 ? 'text-yellow-600' : 'text-red-600';
        const perfLevelColor = getLevelColor(summary.performance_level);
        const date = new Date(summary.created_at).toLocaleDateString('vi-VN');
        
        html += `
          <tr class="hover:bg-purple-50">
            <td class="border border-purple-200 px-2 md:px-4 py-2 md:py-3 font-semibold text-xs md:text-base">Tháng ${summary.month}</td>
            <td class="border border-purple-200 px-2 md:px-4 py-2 md:py-3 text-center ${levelColor} font-bold text-sm md:text-lg">${levelPercent}%</td>
            <td class="border border-purple-200 px-2 md:px-4 py-2 md:py-3 text-center">
              ${summary.performance_level ? `<span class="px-2 md:px-3 py-1 rounded-full text-white text-[10px] md:text-sm font-semibold ${perfLevelColor}">${summary.performance_level}</span>` : '-'}
            </td>
            <td class="border border-purple-200 px-2 md:px-4 py-2 md:py-3 text-center text-gray-600 text-[10px] md:text-sm">${date}</td>
          </tr>
        `;
      });
      
      html += `
              </tbody>
            </table>
          </div>
        </div>
      `;
      
      contentDiv.innerHTML = html;
      historyBox.classList.remove('hidden');
    }
  } catch (error) {
    console.error('Error loading Level history:', error);
  }
}

// ===== LEVEL TAB =====
function renderLevelTab(container) {
  container.innerHTML = `
    <div class="bg-white rounded-2xl shadow-xl p-4 md:p-8">
      <!-- Header Section -->
      <div class="mb-6">
        <h2 class="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
          <i class="fas fa-star mr-2"></i>Level
        </h2>
        <p class="text-xs md:text-sm text-gray-500">Level được tự động tính từ dữ liệu KPI đã nhập</p>
      </div>
      
      <!-- Month/Year Selector - Responsive -->
      <div class="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border-2 border-purple-200 mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div class="flex flex-col sm:flex-row gap-3 flex-1">
            <div class="flex-1">
              <label class="block text-xs md:text-sm font-semibold text-gray-700 mb-1">Tháng</label>
              <select id="level-month" class="w-full px-3 py-2 text-sm md:text-base border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                ${Array.from({length: 12}, (_, i) => i + 1).map(m => 
                  `<option value="${m}" ${m === currentMonth ? 'selected' : ''}>Tháng ${m}</option>`
                ).join('')}
              </select>
            </div>
            <div class="flex-1">
              <label class="block text-xs md:text-sm font-semibold text-gray-700 mb-1">Năm</label>
              <select id="level-year" class="w-full px-3 py-2 text-sm md:text-base border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option value="2026" selected>Năm 2026</option>
              </select>
            </div>
          </div>
          <div class="sm:pt-6">
            <button id="load-level-btn" class="w-full sm:w-auto px-4 md:px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm md:text-base rounded-lg hover:shadow-lg transition-all">
              <i class="fas fa-sync-alt mr-2"></i>Tải dữ liệu
            </button>
          </div>
        </div>
      </div>
      
      <!-- Level Data Container -->
      <div id="level-data-container" class="text-center py-8 md:py-12 text-gray-500">
        <i class="fas fa-info-circle text-3xl md:text-4xl mb-3 md:mb-4 text-purple-400"></i>
        <p class="text-sm md:text-lg px-4">Chọn tháng/năm và nhấn <strong>"Tải dữ liệu"</strong> để xem Level</p>
      </div>
      
      <!-- Level Summary Box -->
      <div id="level-summary" class="mt-6 hidden bg-gradient-to-r from-purple-50 to-pink-50 p-4 md:p-6 rounded-xl border-2 border-purple-300 shadow-lg">
        <h3 class="text-lg md:text-xl font-bold text-purple-800 mb-4 flex items-center">
          <i class="fas fa-trophy mr-2"></i>Tổng kết Level
        </h3>
        <div class="grid grid-cols-2 gap-3 md:gap-4">
          <div class="bg-white p-3 md:p-4 rounded-lg shadow">
            <p class="text-xs md:text-sm text-gray-600 mb-2">% Level đạt được</p>
            <p id="level-total-percent" class="text-2xl md:text-4xl font-bold text-purple-600">0%</p>
          </div>
          <div class="bg-white p-3 md:p-4 rounded-lg shadow">
            <p class="text-xs md:text-sm text-gray-600 mb-2">Xếp hạng Level</p>
            <p id="level-classification" class="text-xl md:text-2xl font-bold text-purple-600">-</p>
          </div>
        </div>
      </div>
      
      <!-- Level History Table -->
      <div id="level-history" class="mt-6 md:mt-8 hidden">
        <h3 class="text-lg md:text-xl font-bold text-purple-800 mb-4 flex items-center">
          <i class="fas fa-history mr-2"></i>Lịch sử Level các tháng
        </h3>
        <div id="level-history-content"></div>
      </div>
    </div>
  `;
  
  document.getElementById('load-level-btn').addEventListener('click', loadLevelDataNew);
}

async function loadLevelDataNew() {
  const month = parseInt(document.getElementById('level-month').value);
  const year = parseInt(document.getElementById('level-year').value);
  const container = document.getElementById('level-data-container');
  
  container.innerHTML = '<div class="text-center py-12"><i class="fas fa-spinner fa-spin text-4xl text-purple-500"></i><p class="mt-4 text-gray-600">Đang tải dữ liệu Level...</p></div>';
  
  try {
    // Load Level templates
    const templatesRes = await axios.get(`/api/kpi-templates/${currentUser.position_id}?type=level`);
    const templates = templatesRes.data.templates;
    
    // Load Level data (auto-filled from KPI by backend)
    const dataRes = await axios.get(`/api/kpi-data/${currentUser.id}/${year}/${month}`);
    const allData = dataRes.data.data || [];
    
    // Filter Level data only
    const levelTemplateIds = new Set(templates.map(t => t.id));
    const levelData = allData.filter(item => levelTemplateIds.has(item.kpi_template_id));
    
    // Create data map
    const dataMap = {};
    levelData.forEach(item => {
      dataMap[item.kpi_template_id] = {
        value: item.actual_value,
        percent: item.completion_percent,
        score: item.weighted_score
      };
    });
    
    // Render Level cards - Responsive design
    let html = '<div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">';
    
    templates.forEach((template, idx) => {
      const data = dataMap[template.id];
      const hasData = !!data;
      
      html += `
        <div class="bg-gradient-to-r from-purple-50 to-pink-50 p-4 md:p-6 rounded-xl hover:shadow-lg transition-all border-2 ${hasData ? 'border-green-300' : 'border-gray-200'}">
          <div class="flex items-start space-x-3 md:space-x-4">
            <!-- Number Badge -->
            <div class="flex-shrink-0 w-10 h-10 md:w-14 md:h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-white font-bold text-lg md:text-2xl shadow-lg">
              ${idx + 1}
            </div>
            
            <!-- Content -->
            <div class="flex-1 min-w-0">
              <!-- Header -->
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <h3 class="font-bold text-gray-800 text-sm md:text-lg leading-tight">${template.name}</h3>
                ${hasData ? '<span class="text-xs px-2 py-1 bg-green-500 text-white rounded-full whitespace-nowrap self-start"><i class="fas fa-check mr-1"></i>Tự động</span>' : ''}
              </div>
              
              <!-- Meta Info -->
              <div class="flex flex-wrap items-center gap-2 mb-3 md:mb-4">
                <span class="text-xs md:text-sm px-2 md:px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full border border-yellow-300 font-semibold whitespace-nowrap">
                  <i class="fas fa-weight-hanging mr-1"></i>Trọng số: ${(template.weight * 100).toFixed(0)}%
                </span>
                <span class="text-xs md:text-sm px-2 md:px-3 py-1 bg-blue-100 text-blue-800 rounded-full border border-blue-300 font-semibold whitespace-nowrap">
                  <i class="fas fa-check-circle mr-1"></i>Chuẩn: ${formatLargeNumber(template.standard_value, template.name)}
                </span>
              </div>
              
              <!-- Data Display -->
              ${hasData ? `
                <div class="grid grid-cols-3 gap-2 md:gap-3">
                  <div class="bg-white p-2 md:p-3 rounded-lg border-2 border-blue-200 shadow-sm">
                    <p class="text-[10px] md:text-xs text-gray-600 mb-1 font-semibold">Giá trị</p>
                    <p class="text-sm md:text-lg font-bold text-blue-700 truncate" title="${formatLargeNumber(data.value, template.name)}">${formatLargeNumber(data.value, template.name)}</p>
                  </div>
                  <div class="bg-white p-2 md:p-3 rounded-lg border-2 border-green-200 shadow-sm">
                    <p class="text-[10px] md:text-xs text-gray-600 mb-1 font-semibold">% Hoàn thành</p>
                    <p class="text-sm md:text-lg font-bold ${data.percent >= 100 ? 'text-green-600' : 'text-orange-600'}">${data.percent.toFixed(1)}%</p>
                  </div>
                  <div class="bg-white p-2 md:p-3 rounded-lg border-2 border-purple-200 shadow-sm">
                    <p class="text-[10px] md:text-xs text-gray-600 mb-1 font-semibold">Tỷ lệ Đạt</p>
                    <p class="text-sm md:text-lg font-bold text-purple-700">${(data.score * 100).toFixed(1)}%</p>
                  </div>
                </div>
              ` : `
                <div class="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-3 md:p-4 text-center">
                  <i class="fas fa-exclamation-triangle text-yellow-600 text-xl md:text-2xl mb-2"></i>
                  <p class="text-xs md:text-sm text-yellow-800 font-semibold">Chưa có dữ liệu Level</p>
                  <p class="text-[10px] md:text-xs text-yellow-700 mt-1">Vui lòng nhập KPI trước</p>
                </div>
              `}
            </div>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    // Load Level summary and history
    await loadLevelSummary(year, month);
    await loadLevelHistory(year);
    
  } catch (error) {
    console.error('Error loading Level data:', error);
    container.innerHTML = `
      <div class="text-center py-12 text-red-500">
        <i class="fas fa-exclamation-circle text-4xl mb-4"></i>
        <p class="text-lg font-semibold">Lỗi tải dữ liệu Level</p>
        <p class="text-sm mt-2">${error.message}</p>
      </div>
    `;
  }
}

async function loadLevelData() {
  const container = document.getElementById('level-form-container');
  const periodDisplay = document.getElementById('level-current-period');
  
  // Check if KPI month/year has been selected
  if (!kpiMonthYear) {
    if (periodDisplay) {
      periodDisplay.textContent = '-';
    }
    
    if (!container) return;
    
    container.innerHTML = `
      <div class="text-center py-12 text-gray-500">
        <i class="fas fa-info-circle text-4xl mb-4 text-purple-400"></i>
        <p class="text-lg mb-2">Vui lòng vào tab <strong>KPI</strong> trước để chọn tháng/năm</p>
        <p class="text-sm text-gray-400">Sau đó quay lại tab Level để xem dữ liệu</p>
      </div>
    `;
    return;
  }
  
  const month = kpiMonthYear.month;
  const year = kpiMonthYear.year;
  
  // Update period display
  if (periodDisplay) {
    periodDisplay.textContent = `Tháng ${month}/${year}`;
  }
  
  if (!container) return;
  
  container.innerHTML = '<div class="text-center py-12"><i class="fas fa-spinner fa-spin text-4xl text-purple-500"></i><p class="mt-4 text-gray-600">Đang tải dữ liệu Level...</p></div>';
  
  try {
    // Load Level templates
    const response = await axios.get(`/api/kpi-templates/${currentUser.position_id}?type=level`);
    const templates = response.data.templates;
    
    // Load existing Level data (auto-filled from KPI)
    const dataRes = await axios.get(`/api/kpi-data/${currentUser.id}/${year}/${month}`);
    const existingData = dataRes.data.data || [];
    
    // Create set of Level template IDs
    const levelTemplateIds = new Set(templates.map(t => t.id));
    
    // Create data map for Level data only (match by template ID)
    const dataMap = {};
    existingData.forEach(item => {
      if (levelTemplateIds.has(item.kpi_template_id)) { // Level data
        dataMap[item.kpi_template_id] = {
          value: item.actual_value,
          percent: item.completion_percent,
          score: item.weighted_score
        };
      }
    });
    
    // Render Level indicators in 2 columns
    const leftColumn = templates.slice(0, 2).map((template, idx) => {
      const data = dataMap[template.id];
      const hasData = !!data;
      
      return `
        <div class="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl hover:shadow-lg transition-all border-2 ${hasData ? 'border-green-300' : 'border-purple-100'}">
          <div class="flex items-start space-x-4">
            <div class="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
              ${idx + 1}
            </div>
            <div class="flex-1">
              <div class="flex items-center justify-between mb-3">
                <h3 class="font-bold text-gray-800 text-lg">${template.name}</h3>
                ${hasData ? '<span class="text-xs px-2 py-1 bg-green-500 text-white rounded-full"><i class="fas fa-check mr-1"></i>Tự động</span>' : ''}
              </div>
              <div class="flex items-center space-x-3 mb-4">
                <span class="text-sm px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full border border-yellow-300 font-semibold">
                  <i class="fas fa-weight-hanging mr-1"></i>Trọng số: ${(template.weight * 100).toFixed(0)}%
                </span>
                <span class="text-sm px-3 py-1 bg-green-100 text-green-800 rounded-full border border-green-300 font-semibold">
                  <i class="fas fa-check-circle mr-1"></i>Chuẩn: ${formatLargeNumber(template.standard_value, template.name)}
                </span>
              </div>
              
              ${hasData ? `
                <div class="grid grid-cols-3 gap-3">
                  <div class="bg-white p-3 rounded-lg border-2 border-blue-200">
                    <p class="text-xs text-gray-600 mb-1">Giá trị thực tế</p>
                    <p class="text-lg font-bold text-blue-700">${formatLargeNumber(data.value, template.name)}</p>
                  </div>
                  <div class="bg-white p-3 rounded-lg border-2 border-green-200">
                    <p class="text-xs text-gray-600 mb-1">% Hoàn thành</p>
                    <p class="text-lg font-bold ${data.percent >= 100 ? 'text-green-600' : 'text-orange-600'}">${data.percent.toFixed(1)}%</p>
                  </div>
                  <div class="bg-white p-3 rounded-lg border-2 border-purple-200">
                    <p class="text-xs text-gray-600 mb-1">Tỷ lệ Đạt</p>
                    <p class="text-lg font-bold text-purple-700">${(data.score * 100).toFixed(1)}%</p>
                  </div>
                </div>
              ` : `
                <div class="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 text-center">
                  <i class="fas fa-exclamation-triangle text-yellow-600 text-2xl mb-2"></i>
                  <p class="text-sm text-yellow-800">Chưa có dữ liệu. Vui lòng nhập KPI trước.</p>
                </div>
              `}
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    const rightColumn = templates.slice(2, 4).map((template, idx) => {
      const data = dataMap[template.id];
      const hasData = !!data;
      
      return `
        <div class="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl hover:shadow-lg transition-all border-2 ${hasData ? 'border-green-300' : 'border-purple-100'}">
          <div class="flex items-start space-x-4">
            <div class="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
              ${idx + 3}
            </div>
            <div class="flex-1">
              <div class="flex items-center justify-between mb-3">
                <h3 class="font-bold text-gray-800 text-lg">${template.name}</h3>
                ${hasData ? '<span class="text-xs px-2 py-1 bg-green-500 text-white rounded-full"><i class="fas fa-check mr-1"></i>Tự động</span>' : ''}
              </div>
              <div class="flex items-center space-x-3 mb-4">
                <span class="text-sm px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full border border-yellow-300 font-semibold">
                  <i class="fas fa-weight-hanging mr-1"></i>Trọng số: ${(template.weight * 100).toFixed(0)}%
                </span>
                <span class="text-sm px-3 py-1 bg-green-100 text-green-800 rounded-full border border-green-300 font-semibold">
                  <i class="fas fa-check-circle mr-1"></i>Chuẩn: ${formatLargeNumber(template.standard_value, template.name)}
                </span>
              </div>
              
              ${hasData ? `
                <div class="grid grid-cols-3 gap-3">
                  <div class="bg-white p-3 rounded-lg border-2 border-blue-200">
                    <p class="text-xs text-gray-600 mb-1">Giá trị thực tế</p>
                    <p class="text-lg font-bold text-blue-700">${formatLargeNumber(data.value, template.name)}</p>
                  </div>
                  <div class="bg-white p-3 rounded-lg border-2 border-green-200">
                    <p class="text-xs text-gray-600 mb-1">% Hoàn thành</p>
                    <p class="text-lg font-bold ${data.percent >= 100 ? 'text-green-600' : 'text-orange-600'}">${data.percent.toFixed(1)}%</p>
                  </div>
                  <div class="bg-white p-3 rounded-lg border-2 border-purple-200">
                    <p class="text-xs text-gray-600 mb-1">Tỷ lệ Đạt</p>
                    <p class="text-lg font-bold text-purple-700">${(data.score * 100).toFixed(1)}%</p>
                  </div>
                </div>
              ` : `
                <div class="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 text-center">
                  <i class="fas fa-exclamation-triangle text-yellow-600 text-2xl mb-2"></i>
                  <p class="text-sm text-yellow-800">Chưa có dữ liệu. Vui lòng nhập KPI trước.</p>
                </div>
              `}
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    const html = `
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="space-y-6">${leftColumn}</div>
        <div class="space-y-6">${rightColumn}</div>
      </div>
    `;
    
    container.innerHTML = html;
    
    // Load Level summary and history
    loadLevelSummary(year, month);
    loadLevelHistory(year);
    
  } catch (error) {
    console.error('Error loading Level data:', error);
    container.innerHTML = `
      <div class="text-center py-12 text-red-500">
        <i class="fas fa-exclamation-circle text-4xl mb-4"></i>
        <p>Lỗi tải dữ liệu Level. Vui lòng thử lại.</p>
      </div>
    `;
  }
}
// ===== TRACKING TAB =====
function renderTrackingTab(container) {
  const now = new Date();
  const currentYear = now.getFullYear();
  
  container.innerHTML = `
    <div class="bg-white rounded-2xl shadow-xl p-8">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          <i class="fas fa-history mr-2"></i>Theo dõi KPI & Level theo tháng
        </h2>
        <div class="flex items-center space-x-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">Năm</label>
            <select id="tracking-year" class="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="2026" selected>Năm 2026</option>
            </select>
          </div>
          <div class="pt-6">
            <button id="load-tracking-btn" class="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all">
              <i class="fas fa-sync-alt mr-2"></i>Tải dữ liệu
            </button>
          </div>
        </div>
      </div>
      
      <div id="tracking-container" class="space-y-8">
        <div class="text-center py-12 text-gray-500">
          <i class="fas fa-spinner fa-spin text-4xl mb-4"></i>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    </div>
  `;
  
  loadTrackingData();
  
  document.getElementById('load-tracking-btn').addEventListener('click', loadTrackingData);
}

async function loadTrackingData() {
  const year = document.getElementById('tracking-year').value;
  const container = document.getElementById('tracking-container');
  
  container.innerHTML = '<div class="text-center py-12"><i class="fas fa-spinner fa-spin text-4xl text-indigo-500"></i></div>';
  
  try {
    // Load all monthly data for the year
    const response = await axios.get(`/api/tracking/${currentUser.id}/${year}`);
    const { kpiData, levelData, templates } = response.data;
    
    // Render KPI tracking section
    let html = `
      <div class="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-xl border-2 border-blue-200">
        <h3 class="text-xl font-bold text-blue-800 mb-4 flex items-center">
          <i class="fas fa-chart-line mr-2"></i>Theo dõi KPI
        </h3>
        <div class="overflow-x-auto">
          <table class="w-full border-collapse">
            <thead>
              <tr class="bg-blue-100">
                <th class="border border-blue-300 px-4 py-2 text-left">Chỉ tiêu</th>
                ${Array.from({length: 12}, (_, i) => `<th class="border border-blue-300 px-2 py-2 text-center">T${i + 1}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
    `;
    
    // Render each KPI indicator
    templates.kpi.forEach((template) => {
      html += `
        <tr class="hover:bg-blue-50">
          <td class="border border-blue-200 px-4 py-2 font-semibold">${template.kpi_name}</td>
      `;
      
      for (let month = 1; month <= 12; month++) {
        const data = kpiData.find(d => d.month === month && d.kpi_template_id === template.id);
        if (data) {
          // For percentage KPIs, multiply by 100 to show the original input value
          const isPercentKpi = template.kpi_name.includes('Tỷ lệ %');
          let displayValue = data.actual_value;
          if (isPercentKpi && displayValue < 2) {
            displayValue = displayValue * 100; // Convert 0.7 → 70
          }
          const percent = data.completion_percent * 100;
          const color = percent >= 100 ? 'text-green-600' : percent >= 50 ? 'text-yellow-600' : 'text-red-600';
          html += `<td class="border border-blue-200 px-2 py-2 text-center ${color} font-semibold">${formatLargeNumber(displayValue, template.kpi_name)}</td>`;
        } else {
          html += `<td class="border border-blue-200 px-2 py-2 text-center text-gray-400">-</td>`;
        }
      }
      
      html += `</tr>`;
    });
    
    // Add total %KPI row
    html += `
      <tr class="bg-blue-100 font-bold">
        <td class="border border-blue-300 px-4 py-2">% KPI tổng</td>
    `;
    
    for (let month = 1; month <= 12; month++) {
      const monthData = kpiData.filter(d => d.month === month);
      if (monthData.length > 0) {
        const totalScore = monthData.reduce((sum, d) => sum + d.weighted_score, 0);
        const percent = totalScore * 100;
        const color = percent >= 100 ? 'text-green-700' : percent >= 50 ? 'text-yellow-700' : 'text-red-700';
        html += `<td class="border border-blue-300 px-2 py-2 text-center ${color}">${percent.toFixed(1)}%</td>`;
      } else {
        html += `<td class="border border-blue-300 px-2 py-2 text-center text-gray-400">-</td>`;
      }
    }
    
    html += `
      </tr>
    `;
    
    // Add KPI Classification row
    html += `
      <tr class="bg-blue-50 font-semibold">
        <td class="border border-blue-300 px-4 py-2">Xếp loại KPI</td>
    `;
    
    for (let month = 1; month <= 12; month++) {
      const monthData = kpiData.filter(d => d.month === month);
      if (monthData.length > 0) {
        const totalScore = monthData.reduce((sum, d) => sum + d.weighted_score, 0);
        const percent = totalScore * 100;
        const classification = getKpiClassification(percent);
        const color = percent >= 120 ? 'text-green-700' : percent >= 90 ? 'text-blue-700' : percent >= 70 ? 'text-yellow-700' : percent >= 50 ? 'text-orange-700' : 'text-red-700';
        html += `<td class="border border-blue-300 px-2 py-2 text-center ${color} font-semibold">${classification}</td>`;
      } else {
        html += `<td class="border border-blue-300 px-2 py-2 text-center text-gray-400">-</td>`;
      }
    }
    
    html += `
      </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div class="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border-2 border-purple-200">
        <h3 class="text-xl font-bold text-purple-800 mb-4 flex items-center">
          <i class="fas fa-star mr-2"></i>Theo dõi Level
        </h3>
        <div class="overflow-x-auto">
          <table class="w-full border-collapse">
            <thead>
              <tr class="bg-purple-100">
                <th class="border border-purple-300 px-4 py-2 text-left">Chỉ tiêu</th>
                ${Array.from({length: 12}, (_, i) => `<th class="border border-purple-300 px-2 py-2 text-center">T${i + 1}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
    `;
    
    // Render each Level indicator
    templates.level.forEach((template) => {
      html += `
        <tr class="hover:bg-purple-50">
          <td class="border border-purple-200 px-4 py-2 font-semibold">${template.name}</td>
      `;
      
      for (let month = 1; month <= 12; month++) {
        const data = levelData.find(d => d.month === month && d.kpi_template_id === template.id);
        if (data) {
          // For percentage KPIs, multiply by 100 to show the original input value
          const isPercentKpi = template.name.includes('Tỷ lệ %');
          let displayValue = data.actual_value;
          if (isPercentKpi && displayValue < 2) {
            displayValue = displayValue * 100; // Convert 0.7 → 70
          }
          const percent = data.completion_percent * 100;
          const color = percent >= 100 ? 'text-green-600' : percent >= 50 ? 'text-yellow-600' : 'text-red-600';
          html += `<td class="border border-purple-200 px-2 py-2 text-center ${color} font-semibold">${formatLargeNumber(displayValue, template.name)}</td>`;
        } else {
          html += `<td class="border border-purple-200 px-2 py-2 text-center text-gray-400">-</td>`;
        }
      }
      
      html += `</tr>`;
    });
    
    // Add total %Level row
    html += `
      <tr class="bg-purple-100 font-bold">
        <td class="border border-purple-300 px-4 py-2">% Level tổng</td>
    `;
    
    for (let month = 1; month <= 12; month++) {
      const monthData = levelData.filter(d => d.month === month);
      if (monthData.length > 0) {
        const totalScore = monthData.reduce((sum, d) => sum + d.weighted_score, 0);
        const percent = totalScore * 100;
        const color = percent >= 100 ? 'text-green-700' : percent >= 50 ? 'text-yellow-700' : 'text-red-700';
        html += `<td class="border border-purple-300 px-2 py-2 text-center ${color}">${percent.toFixed(1)}%</td>`;
      } else {
        html += `<td class="border border-purple-300 px-2 py-2 text-center text-gray-400">-</td>`;
      }
    }
    
    html += `
      </tr>
    `;
    
    // Add Level Classification row
    html += `
      <tr class="bg-purple-50 font-semibold">
        <td class="border border-purple-300 px-4 py-2">Xếp loại Level</td>
    `;
    
    for (let month = 1; month <= 12; month++) {
      const monthData = levelData.filter(d => d.month === month);
      if (monthData.length > 0) {
        const totalScore = monthData.reduce((sum, d) => sum + d.weighted_score, 0);
        const percent = totalScore * 100;
        const classification = getLevelClassification(percent, currentUser.position_id);
        const color = percent >= 155 ? 'text-green-700' : percent >= 131 ? 'text-blue-700' : percent > 100 ? 'text-yellow-700' : percent >= 50 ? 'text-orange-700' : 'text-red-700';
        html += `<td class="border border-purple-300 px-2 py-2 text-center ${color} font-semibold">${classification}</td>`;
      } else {
        html += `<td class="border border-purple-300 px-2 py-2 text-center text-gray-400">-</td>`;
      }
    }
    
    html += `
      </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
    
    container.innerHTML = html;
    
  } catch (error) {
    console.error('Error loading tracking data:', error);
    container.innerHTML = `<div class="text-center py-12 text-red-500"><i class="fas fa-exclamation-triangle mr-2"></i>Lỗi tải dữ liệu</div>`;
  }
}

// ===== DASHBOARD TAB =====
function renderDashboardTab(container) {
  container.innerHTML = `
    <div class="bg-white rounded-xl lg:rounded-2xl shadow-lg lg:shadow-xl p-4 lg:p-8">
      <!-- Header Section -->
      <div class="mb-4 lg:mb-6">
        <h2 class="text-xl lg:text-2xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent mb-3 lg:mb-4">
          <i class="fas fa-chart-bar mr-2"></i>Dashboard - Xếp hạng KPI & Level
        </h2>
        
        <!-- Mobile: Stacked layout -->
        <div class="lg:hidden space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1.5">Tháng</label>
              <select id="dash-month" class="w-full px-3 py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                ${Array.from({length: 12}, (_, i) => i + 1).map(m => 
                  `<option value="${m}" ${m === currentMonth ? 'selected' : ''}>Tháng ${m}</option>`
                ).join('')}
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1.5">Năm</label>
              <select id="dash-year" class="w-full px-3 py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="2026" selected>Năm 2026</option>
              </select>
            </div>
          </div>
          <button id="load-dash-btn" class="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all">
            <i class="fas fa-sync-alt mr-2"></i>Tải dữ liệu
          </button>
        </div>
        
        <!-- Desktop: Horizontal layout -->
        <div class="hidden lg:flex items-end space-x-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">Tháng</label>
            <select id="dash-month-desktop" class="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
              ${Array.from({length: 12}, (_, i) => i + 1).map(m => 
                `<option value="${m}" ${m === currentMonth ? 'selected' : ''}>Tháng ${m}</option>`
              ).join('')}
            </select>
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">Năm</label>
            <select id="dash-year-desktop" class="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="2026" selected>Năm 2026</option>
            </select>
          </div>
          <div>
            <button id="load-dash-btn-desktop" class="px-6 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg hover:shadow-lg transition-all">
              <i class="fas fa-sync-alt mr-2"></i>Tải dữ liệu
            </button>
          </div>
        </div>
      </div>
      
      <div id="dashboard-container" class="text-center py-12 text-gray-500">
        <i class="fas fa-spinner fa-spin text-3xl lg:text-4xl mb-4"></i>
        <p class="text-sm lg:text-base">Đang tải dữ liệu...</p>
      </div>
    </div>
  `;
  
  loadDashboardData();
  
  // Setup mobile listeners
  document.getElementById('load-dash-btn').addEventListener('click', loadDashboardData);
  document.getElementById('dash-month').addEventListener('change', () => {
    const month = document.getElementById('dash-month').value;
    const desktopMonth = document.getElementById('dash-month-desktop');
    if (desktopMonth) desktopMonth.value = month;
  });
  document.getElementById('dash-year').addEventListener('change', () => {
    const year = document.getElementById('dash-year').value;
    const desktopYear = document.getElementById('dash-year-desktop');
    if (desktopYear) desktopYear.value = year;
  });
  
  // Setup desktop listeners (if exists)
  const desktopLoadBtn = document.getElementById('load-dash-btn-desktop');
  if (desktopLoadBtn) {
    desktopLoadBtn.addEventListener('click', loadDashboardData);
    document.getElementById('dash-month-desktop').addEventListener('change', () => {
      const month = document.getElementById('dash-month-desktop').value;
      document.getElementById('dash-month').value = month;
    });
    document.getElementById('dash-year-desktop').addEventListener('change', () => {
      const year = document.getElementById('dash-year-desktop').value;
      document.getElementById('dash-year').value = year;
    });
  }
}

async function loadDashboardData() {
  const month = document.getElementById('dash-month').value;
  const year = document.getElementById('dash-year').value;
  const container = document.getElementById('dashboard-container');
  
  container.innerHTML = '<div class="text-center py-12"><i class="fas fa-spinner fa-spin text-4xl text-green-500"></i></div>';
  
  try {
    const response = await axios.get(`/api/dashboard/${currentUser.id}/${year}/${month}`);
    const data = response.data.dashboard;
    const isAdmin = response.data.isAdmin;
    
    if (!data || data.length === 0) {
      container.innerHTML = '<p class="text-center text-gray-500 py-12">Chưa có dữ liệu</p>';
      return;
    }
    
    // If admin: group by region and show 4 tables
    if (isAdmin) {
      renderAdminDashboard(data, container);
    } else {
      // Normal user: 2-column layout (KPI left, Level right)
      renderTwoColumnDashboard(data, container);
    }
    
  } catch (error) {
    console.error('Dashboard error:', error);
    container.innerHTML = `<div class="text-center py-12 text-red-500"><i class="fas fa-exclamation-triangle mr-2"></i>Lỗi tải dữ liệu</div>`;
  }
}

function renderAdminDashboard(data, container) {
  // Group by region
  const regions = {};
  data.forEach(user => {
    if (!regions[user.region_name]) {
      regions[user.region_name] = [];
    }
    regions[user.region_name].push(user);
  });
  
  const regionColors = {
    'Bình Dương': 'blue',
    'Hà Nội': 'green',
    'Miền Trung': 'purple',
    'Hồ Chí Minh': 'orange'
  };
  
  let html = '<div class="space-y-8">';
  
  Object.keys(regions).forEach(regionName => {
    const color = regionColors[regionName] || 'gray';
    const regionUsers = regions[regionName];
    
    html += `
      <div class="border-2 border-${color}-200 rounded-xl p-4 lg:p-6 mb-6 lg:mb-0">
        <h3 class="text-lg lg:text-2xl font-bold mb-3 lg:mb-4 text-${color}-700 flex items-center">
          <i class="fas fa-map-marker-alt mr-2"></i>${regionName}
          <span class="ml-2 lg:ml-4 text-xs lg:text-sm font-normal text-gray-500">(${regionUsers.length} nhân viên)</span>
        </h3>
        
        <!-- Mobile: Stacked, Desktop: 2 Columns -->
        <div class="dashboard-grid grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          <!-- Left: KPI Ranking -->
          <div>
            <h4 class="text-base lg:text-lg font-bold mb-2 lg:mb-3 text-${color}-600 flex items-center">
              <i class="fas fa-trophy mr-2"></i>Xếp hạng KPI
            </h4>
            <div class="space-y-2">
              ${regionUsers
                .sort((a, b) => (b.total_kpi_score || 0) - (a.total_kpi_score || 0))
                .map((user, idx) => `
                  <div class="flex items-center justify-between p-2 lg:p-3 rounded-lg ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'} border border-gray-200 hover:border-${color}-300 transition-all">
                    <div class="flex items-center space-x-2 lg:space-x-3 min-w-0">
                      <div class="flex-shrink-0 w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-gradient-to-br from-${color}-400 to-${color}-600 flex items-center justify-center text-white font-bold text-sm">
                        ${idx + 1}
                      </div>
                      <div class="min-w-0">
                        <div class="font-semibold text-sm lg:text-base text-gray-800 truncate">${user.full_name}</div>
                        <div class="text-xs text-gray-500 truncate">${user.position_name}</div>
                      </div>
                    </div>
                    <div class="text-right flex-shrink-0 ml-2">
                      <div class="font-bold text-sm lg:text-base text-${color}-600">
                        ${user.total_kpi_score ? ((user.total_kpi_score * 100).toFixed(1) + '%') : '-'}
                      </div>
                      ${user.kpi_level ? `<div class="text-xs mt-1"><span class="px-1.5 lg:px-2 py-0.5 rounded-full text-white text-[10px] lg:text-xs ${getLevelColor(user.kpi_level)}">${user.kpi_level}</span></div>` : ''}
                    </div>
                  </div>
                `).join('')}
            </div>
          </div>
          
          <!-- Right: Level Ranking -->
          <div>
            <h4 class="text-base lg:text-lg font-bold mb-2 lg:mb-3 text-${color}-600 flex items-center">
              <i class="fas fa-star mr-2"></i>Xếp hạng Level
            </h4>
            <div class="space-y-2">
              ${regionUsers
                .sort((a, b) => (b.total_level_score || 0) - (a.total_level_score || 0))
                .map((user, idx) => `
                  <div class="flex items-center justify-between p-2 lg:p-3 rounded-lg ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'} border border-gray-200 hover:border-${color}-300 transition-all">
                    <div class="flex items-center space-x-2 lg:space-x-3 min-w-0">
                      <div class="flex-shrink-0 w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-gradient-to-br from-${color}-400 to-${color}-600 flex items-center justify-center text-white font-bold text-sm">
                        ${idx + 1}
                      </div>
                      <div class="min-w-0">
                        <div class="font-semibold text-sm lg:text-base text-gray-800 truncate">${user.full_name}</div>
                        <div class="text-xs text-gray-500 truncate">${user.position_name}</div>
                      </div>
                    </div>
                    <div class="text-right flex-shrink-0 ml-2">
                      <div class="font-bold text-sm lg:text-base text-${color}-600">
                        ${user.total_level_score ? ((user.total_level_score * 100).toFixed(1) + '%') : '-'}
                      </div>
                      ${user.performance_level ? `<div class="text-xs mt-1"><span class="px-1.5 lg:px-2 py-0.5 rounded-full text-white text-[10px] lg:text-xs ${getLevelColor(user.performance_level)}">${user.performance_level}</span></div>` : ''}
                    </div>
                  </div>
                `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  container.innerHTML = html;
}

function renderTwoColumnDashboard(data, container) {
  // Group by position
  const byPosition = {};
  const positionNames = {};
  
  data.forEach(user => {
    const posId = user.position_id;
    if (!byPosition[posId]) {
      byPosition[posId] = [];
      positionNames[posId] = user.position_name;
    }
    byPosition[posId].push(user);
  });
  
  // Sort positions: 1, 5, 2, 3, 4
  const sortedPositions = Object.keys(byPosition).map(Number).sort((a, b) => {
    const order = {1: 1, 5: 2, 2: 3, 3: 4, 4: 5};
    return order[a] - order[b];
  });
  
  let html = '<div class="space-y-8">';
  
  sortedPositions.forEach(posId => {
    const users = byPosition[posId];
    const posName = positionNames[posId];
    
    const kpiSorted = [...users].sort((a, b) => (b.total_kpi_score || 0) - (a.total_kpi_score || 0));
    const levelSorted = [...users].sort((a, b) => (b.total_level_score || 0) - (a.total_level_score || 0));
    
    html += `
      <div class="bg-gradient-to-r from-blue-50 to-purple-50 p-4 lg:p-6 rounded-xl lg:rounded-2xl border-2 border-blue-200 mb-6 lg:mb-0">
        <h2 class="text-lg lg:text-2xl font-bold mb-4 lg:mb-6 text-gray-800 flex items-center">
          <i class="fas fa-users mr-2 lg:mr-3 text-blue-600"></i>
          ${posName}
          <span class="ml-2 lg:ml-3 text-xs lg:text-sm font-normal px-2 lg:px-3 py-1 bg-white rounded-full text-gray-600">${users.length} người</span>
        </h2>
        
        <!-- Mobile: Stacked, Desktop: 2 Columns -->
        <div class="dashboard-grid grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
          <!-- Left: KPI Ranking -->
          <div>
            <h3 class="text-base lg:text-lg font-bold mb-3 lg:mb-4 text-blue-700 flex items-center bg-white px-3 lg:px-4 py-2 lg:py-3 rounded-lg shadow-sm">
              <i class="fas fa-trophy mr-2"></i>Xếp hạng KPI
            </h3>
            <div class="space-y-2 lg:space-y-3">
              ${kpiSorted.map((user, idx) => `
                <div class="flex items-center justify-between p-3 lg:p-4 rounded-lg lg:rounded-xl ${user.id === currentUser.id ? 'bg-blue-200 border-2 border-blue-500' : 'bg-white border border-gray-200'} hover:shadow-lg transition-all">
                  <div class="flex items-center space-x-2 lg:space-x-4 min-w-0">
                    <div class="flex-shrink-0 w-8 h-8 lg:w-10 lg:h-10 rounded-full ${idx < 3 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 'bg-gradient-to-br from-blue-400 to-blue-600'} flex items-center justify-center text-white font-bold text-sm lg:text-lg shadow-lg">
                      ${idx + 1}
                    </div>
                    <div class="min-w-0">
                      <div class="font-bold text-sm lg:text-base text-gray-900 ${user.id === currentUser.id ? 'text-blue-700' : ''} truncate">
                        ${user.full_name}
                        ${user.id === currentUser.id ? '<span class="ml-1 lg:ml-2 text-[10px] lg:text-xs bg-blue-600 text-white px-1.5 lg:px-2 py-0.5 rounded-full">Bạn</span>' : ''}
                      </div>
                      <div class="text-xs text-gray-600 truncate">${user.region_name}</div>
                      ${user.planned_revenue ? `<div class="text-xs text-green-600 font-semibold mt-0.5 truncate"><i class="fas fa-bullseye mr-1"></i>KH: ${formatLargeNumber(user.planned_revenue)}</div>` : ''}
                    </div>
                  </div>
                  <div class="text-right flex-shrink-0 ml-2">
                    <div class="text-lg lg:text-2xl font-bold text-blue-600">
                      ${user.total_kpi_score ? ((user.total_kpi_score * 100).toFixed(1) + '%') : '-'}
                    </div>
                    ${user.kpi_level ? `<div class="mt-1"><span class="px-1.5 lg:px-2 py-0.5 rounded-full text-white text-[10px] lg:text-xs font-semibold ${getLevelColor(user.kpi_level)}">${user.kpi_level}</span></div>` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          
          <!-- Right: Level Ranking -->
          <div>
            <h3 class="text-base lg:text-lg font-bold mb-3 lg:mb-4 text-purple-700 flex items-center bg-white px-3 lg:px-4 py-2 lg:py-3 rounded-lg shadow-sm">
              <i class="fas fa-star mr-2"></i>Xếp hạng Level
            </h3>
            <div class="space-y-2 lg:space-y-3">
              ${levelSorted.map((user, idx) => `
                <div class="flex items-center justify-between p-3 lg:p-4 rounded-lg lg:rounded-xl ${user.id === currentUser.id ? 'bg-purple-200 border-2 border-purple-500' : 'bg-white border border-gray-200'} hover:shadow-lg transition-all">
                  <div class="flex items-center space-x-2 lg:space-x-4 min-w-0">
                    <div class="flex-shrink-0 w-8 h-8 lg:w-10 lg:h-10 rounded-full ${idx < 3 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 'bg-gradient-to-br from-purple-400 to-purple-600'} flex items-center justify-center text-white font-bold text-sm lg:text-lg shadow-lg">
                      ${idx + 1}
                    </div>
                    <div class="min-w-0">
                      <div class="font-bold text-sm lg:text-base text-gray-900 ${user.id === currentUser.id ? 'text-purple-700' : ''} truncate">
                        ${user.full_name}
                        ${user.id === currentUser.id ? '<span class="ml-1 lg:ml-2 text-[10px] lg:text-xs bg-purple-600 text-white px-1.5 lg:px-2 py-0.5 rounded-full">Bạn</span>' : ''}
                      </div>
                      <div class="text-xs text-gray-600 truncate">${user.region_name}</div>
                      ${user.planned_revenue ? `<div class="text-xs text-green-600 font-semibold mt-0.5 truncate"><i class="fas fa-bullseye mr-1"></i>KH: ${formatLargeNumber(user.planned_revenue)}</div>` : ''}
                    </div>
                  </div>
                  <div class="text-right flex-shrink-0 ml-2">
                    <div class="text-lg lg:text-2xl font-bold text-purple-600">
                      ${user.total_level_score ? ((user.total_level_score * 100).toFixed(1) + '%') : '-'}
                    </div>
                    ${user.performance_level ? `<div class="mt-1"><span class="px-1.5 lg:px-2 py-0.5 rounded-full text-white text-[10px] lg:text-xs font-semibold ${getLevelColor(user.performance_level)}">${user.performance_level}</span></div>` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  container.innerHTML = html;
}

// Helper function to get KPI classification based on percentage
function getKpiClassification(percent) {
  if (percent >= 120) return 'Xuất sắc';
  if (percent >= 90) return 'Giỏi';
  if (percent >= 70) return 'Khá';
  if (percent >= 50) return 'Trung Bình';
  return 'Cần Cải Thiện';
}

// Helper function to get Level classification based on percentage and position
// positionId: 1=PTGĐ, 2=GĐKD, 3=TLKD, 4=Giám sát, 5=GĐKDCC
function getLevelClassification(percent, positionId) {
  if (!positionId || positionId === 1 || positionId === 5) {
    // PTGĐ & GĐKDCC
    if (percent >= 155) return 'Level 4';
    if (percent >= 131) return 'Level 3';
    if (percent > 100) return 'Level 2';
    if (percent >= 50) return 'Level 1';
  } else if (positionId === 2 || positionId === 3) {
    // GĐKD & Trợ lý KD
    if (percent >= 140) return 'Level 5';
    if (percent >= 121) return 'Level 4';
    if (percent >= 101) return 'Level 3';
    if (percent >= 81) return 'Level 2';
    if (percent >= 50) return 'Level 1';
  } else if (positionId === 4) {
    // Giám sát
    if (percent >= 150) return 'Level 5';
    if (percent >= 131) return 'Level 4';
    if (percent >= 101) return 'Level 3';
    if (percent >= 76) return 'Level 2';
    if (percent >= 50) return 'Level 1';
  }
  return 'Xem xét lại';
}

function getLevelColor(level) {
  // Based on xep loai level.xlsx - Different thresholds per position
  // PTGĐ/GĐKDCC: Level 1-4 only
  // GĐKD/TLKD/Giám sát: Level 1-5
  if (level === 'Tốt' || level.includes('Level 5')) return 'bg-purple-500 shadow-lg shadow-purple-300';   // Level 5 - Xuất sắc nhất
  if (level === 'Tốt' || level.includes('Level 4')) return 'bg-green-500 shadow-lg shadow-green-300';      // Level 4 - Tốt
  if (level === 'Khá' || level.includes('Level 3')) return 'bg-blue-500 shadow-lg shadow-blue-300';       // Level 3 - Khá
  if (level === 'Đạt chuẩn' || level.includes('Level 2')) return 'bg-yellow-500 shadow-lg shadow-yellow-300'; // Level 2 - Đạt chuẩn
  if (level.includes('Level 1')) return 'bg-orange-500 shadow-lg shadow-orange-300';                      // Level 1
  return 'bg-red-500 shadow-lg shadow-red-300';  // Xem xét lại (<50%)
}

// ===== ADMIN TAB - COMPLETE REWRITE =====
function renderAdminTab(container) {
  container.innerHTML = `
    <div class="space-y-6">
      <!-- Sub-tabs for Admin -->
      <div class="bg-white rounded-2xl shadow-xl p-4">
        <div class="flex flex-wrap gap-2">
          <button onclick="showAdminSubTab('overview')" class="admin-subtab px-6 py-3 rounded-lg font-semibold transition-all" data-tab="overview">
            <i class="fas fa-chart-line mr-2"></i>Tổng quan
          </button>
          <button onclick="showAdminSubTab('users')" class="admin-subtab px-6 py-3 rounded-lg font-semibold transition-all" data-tab="users">
            <i class="fas fa-users-cog mr-2"></i>Người dùng
          </button>
          <button onclick="showAdminSubTab('ptgd')" class="admin-subtab px-6 py-3 rounded-lg font-semibold transition-all" data-tab="ptgd">
            <i class="fas fa-user-tie mr-2"></i>PTGĐ/GĐKDCC
          </button>
          <button onclick="showAdminSubTab('gdkd')" class="admin-subtab px-6 py-3 rounded-lg font-semibold transition-all" data-tab="gdkd">
            <i class="fas fa-user-shield mr-2"></i>GĐKD
          </button>
          <button onclick="showAdminSubTab('tlkd')" class="admin-subtab px-6 py-3 rounded-lg font-semibold transition-all" data-tab="tlkd">
            <i class="fas fa-user-check mr-2"></i>Trợ lý kinh doanh
          </button>
          <button onclick="showAdminSubTab('gs')" class="admin-subtab px-6 py-3 rounded-lg font-semibold transition-all" data-tab="gs">
            <i class="fas fa-user mr-2"></i>Giám sát
          </button>
          <button onclick="showAdminSubTab('revenue-plan')" class="admin-subtab px-6 py-3 rounded-lg font-semibold transition-all" data-tab="revenue-plan">
            <i class="fas fa-file-invoice-dollar mr-2"></i>Kế hoạch Doanh thu
          </button>
          <button onclick="showAdminSubTab('lock-month')" class="admin-subtab px-6 py-3 rounded-lg font-semibold transition-all" data-tab="lock-month">
            <i class="fas fa-lock mr-2"></i>Khóa tháng
          </button>
          
          <!-- Separator -->
          <div class="w-full border-t border-gray-300 my-2"></div>
          
          <!-- KPI Detail Tabs -->
          <div class="w-full text-sm text-gray-600 font-semibold">📊 Thống kê chỉ số trọng điểm</div>
          <button onclick="showAdminSubTab('ptgd-kpi')" class="admin-subtab px-4 py-2 rounded-lg text-sm transition-all" data-tab="ptgd-kpi">
            <i class="fas fa-chart-line mr-1"></i>PTGĐ/GĐKDCC - Doanh thu
          </button>
          <button onclick="showAdminSubTab('gdkd-kpi')" class="admin-subtab px-4 py-2 rounded-lg text-sm transition-all" data-tab="gdkd-kpi">
            <i class="fas fa-chart-line mr-1"></i>GĐKD - Doanh thu
          </button>
          <button onclick="showAdminSubTab('tlkd-kpi')" class="admin-subtab px-4 py-2 rounded-lg text-sm transition-all" data-tab="tlkd-kpi">
            <i class="fas fa-chart-line mr-1"></i>Trợ lý kinh doanh - Doanh thu và Zalo
          </button>
          <button onclick="showAdminSubTab('gs-kpi')" class="admin-subtab px-4 py-2 rounded-lg text-sm transition-all" data-tab="gs-kpi">
            <i class="fas fa-users mr-1"></i>GS - Tuyển dụng
          </button>
        </div>
      </div>

      <!-- Tab Contents -->
      <div id="admin-subtab-content"></div>
    </div>
  `;
  
  // Show overview by default
  showAdminSubTab('overview');
}

// Handle sub-tab switching
function showAdminSubTab(tabName) {
  // Update tab styles
  document.querySelectorAll('.admin-subtab').forEach(btn => {
    if (btn.dataset.tab === tabName) {
      btn.className = 'admin-subtab px-6 py-3 rounded-lg font-semibold transition-all bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg';
    } else {
      btn.className = 'admin-subtab px-6 py-3 rounded-lg font-semibold transition-all bg-gray-100 text-gray-700 hover:bg-gray-200';
    }
  });
  
  const content = document.getElementById('admin-subtab-content');
  
  if (tabName === 'overview') {
    renderAdminOverview(content);
  } else if (tabName === 'users') {
    renderAdminUsers(content);
  } else if (tabName === 'ptgd') {
    renderPositionDashboard(content, '1,5', 'PTGĐ/GĐKDCC'); // position 1 and 5
  } else if (tabName === 'gdkd') {
    renderPositionDashboard(content, '2', 'GĐKD');
  } else if (tabName === 'tlkd') {
    renderPositionDashboard(content, '3', 'Trợ lý kinh doanh');
  } else if (tabName === 'gs') {
    renderPositionDashboard(content, '4', 'Giám sát');
  } else if (tabName === 'revenue-plan') {
    renderRevenuePlan(content);
  } else if (tabName === 'ptgd-kpi') {
    renderKpiDetail(content, '1,5', 'PTGĐ/GĐKDCC - Doanh thu', [7]); // KPI ID 7: Doanh thu
  } else if (tabName === 'gdkd-kpi') {
    renderKpiDetail(content, '2', 'GĐKD - Doanh thu', [17]); // KPI ID 17: Doanh thu
  } else if (tabName === 'tlkd-kpi') {
    renderKpiDetail(content, '3', 'Trợ lý kinh doanh - Doanh thu và Zalo', [27, 29]); // KPI ID 27: Doanh thu, 29: Zalo
  } else if (tabName === 'gs-kpi') {
    renderKpiDetail(content, '4', 'Giám sát', [38]); // KPI ID 38: Tuyển dụng
  } else if (tabName === 'lock-month') {
    renderLockMonthTab(content);
  }
}

function renderAdminOverview(container) {
  container.innerHTML = `
    <div class="space-y-6">
      <!-- Statistics Cards -->
      <div class="bg-white rounded-2xl shadow-xl p-6">
        <h3 class="text-xl font-bold text-gray-800 mb-4">
          <i class="fas fa-chart-bar mr-2 text-blue-600"></i>Thống kê nhân sự
        </h3>
        <div id="admin-statistics" class="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div class="text-center p-4 bg-gray-50 rounded-lg">
            <i class="fas fa-spinner fa-spin text-2xl text-gray-400"></i>
          </div>
        </div>
      </div>

      <!-- KPI Templates Reference -->
      <div class="bg-white rounded-2xl shadow-xl p-6">
        <h3 class="text-xl font-bold text-gray-800 mb-4">
          <i class="fas fa-table mr-2 text-green-600"></i>Bảng KPI & Level Templates
        </h3>
        <div id="kpi-templates-table" class="overflow-x-auto">
          <div class="text-center py-8">
            <i class="fas fa-spinner fa-spin text-2xl text-gray-400"></i>
          </div>
        </div>
      </div>
    </div>
  `;
  
  loadAdminStatistics();
  loadKpiTemplates();
}

function renderAdminUsers(container) {
  container.innerHTML = `
    <div class="bg-white rounded-2xl shadow-xl p-8">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
          <i class="fas fa-users-cog mr-2"></i>Quản lý tài khoản
        </h2>
        <button 
          onclick="showCreateUserForm()"
          class="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all"
        >
          <i class="fas fa-user-plus mr-2"></i>Tạo tài khoản mới
        </button>
      </div>
      
      <!-- Edit User Modal (hidden by default) -->
      <div id="edit-user-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <h3 class="text-2xl font-bold text-gray-800 mb-6">
            <i class="fas fa-user-edit mr-2 text-blue-600"></i>Chỉnh sửa thông tin tài khoản
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2">
              <label class="block text-sm font-semibold text-gray-700 mb-2">Tên đăng nhập</label>
              <input type="text" id="edit-username" class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-gray-100" disabled>
              <p class="text-xs text-gray-500 mt-1">Không thể thay đổi tên đăng nhập</p>
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-semibold text-gray-700 mb-2">Họ và tên *</label>
              <input type="text" id="edit-fullname" class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-semibold text-gray-700 mb-2">Mật khẩu mới</label>
              <input type="password" id="edit-password" class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Để trống nếu không đổi">
              <p class="text-xs text-gray-500 mt-1">Chỉ nhập nếu muốn đổi mật khẩu</p>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Khối vận hành *</label>
              <select id="edit-region" class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Chọn khối</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Vị trí *</label>
              <select id="edit-position" class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Chọn vị trí</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Team</label>
              <input type="text" id="edit-team" class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ví dụ: BD1U1, HCM2, MT1">
              <p class="text-xs text-gray-500 mt-1">Mã team của nhân viên</p>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Ngày nhận việc *</label>
              <input type="date" id="edit-startdate" class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                <i class="fas fa-image mr-2 text-purple-600"></i>Ảnh Cover (Bảng giao chỉ tiêu)
              </label>
              <input 
                type="text" 
                id="edit-cover-url" 
                class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" 
                placeholder="https://www.genspark.ai/api/files/s/..."
              >
              <p class="text-xs text-gray-500 mt-1">
                <i class="fas fa-info-circle mr-1"></i>Paste URL ảnh từ GenSpark AI Drive (VD: https://www.genspark.ai/api/files/s/wWzr8gPf)
              </p>
              <div id="edit-cover-preview" class="mt-2 hidden">
                <img src="" alt="Cover Preview" class="w-full max-h-48 object-contain rounded-lg border-2 border-purple-200">
              </div>
            </div>
          </div>
          <div class="flex items-center space-x-4 mt-8">
            <button 
              onclick="saveEditUser()"
              class="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              <i class="fas fa-save mr-2"></i>Lưu thay đổi
            </button>
            <button 
              onclick="hideEditUserModal()"
              class="flex-1 px-6 py-3 bg-gray-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              <i class="fas fa-times mr-2"></i>Hủy
            </button>
          </div>
        </div>
      </div>
      
      <!-- Create User Form (hidden by default) -->
      <div id="create-user-form" class="hidden mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200">
        <h3 class="text-xl font-bold text-gray-800 mb-4">
          <i class="fas fa-user-plus mr-2"></i>Tạo tài khoản mới
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Tên đăng nhập *</label>
            <input type="text" id="new-username" class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ví dụ: gs_binhduong_02">
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Mật khẩu *</label>
            <input type="password" id="new-password" class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Mật khẩu">
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Họ tên *</label>
            <input type="text" id="new-fullname" class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Họ và tên đầy đủ">
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Khối vận hành *</label>
            <select id="new-region" class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" onchange="loadPotentialManagers()">
              <option value="">Chọn khối</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Vị trí *</label>
            <select id="new-position" class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" onchange="loadPotentialManagers()">
              <option value="">Chọn vị trí</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Team</label>
            <input type="text" id="new-team" class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ví dụ: BD1U1, HCM2, MT1">
            <p class="text-xs text-gray-500 mt-1">Mã team của nhân viên</p>
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Ngày nhận việc *</label>
            <input type="date" id="new-startdate" class="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          </div>
        </div>
        <div class="flex items-center space-x-4 mt-6">
          <button 
            onclick="createNewUser()"
            class="px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            <i class="fas fa-check mr-2"></i>Tạo tài khoản
          </button>
          <button 
            onclick="hideCreateUserForm()"
            class="px-6 py-3 bg-gray-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            <i class="fas fa-times mr-2"></i>Hủy
          </button>
        </div>
      </div>
      
      <!-- Search and Filter Section -->
      <div class="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
        <h3 class="text-lg font-bold text-gray-800 mb-4">
          <i class="fas fa-search mr-2 text-blue-600"></i>Tìm kiếm & Lọc
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- Search Box -->
          <div class="md:col-span-2">
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              <i class="fas fa-user mr-1"></i>Tìm theo tên hoặc username
            </label>
            <input 
              type="text" 
              id="user-search" 
              placeholder="Nhập tên hoặc username..."
              oninput="filterUsers()"
              class="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
          </div>
          
          <!-- Filter by Region -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              <i class="fas fa-map-marker-alt mr-1"></i>Khối
            </label>
            <select 
              id="filter-region" 
              onchange="filterUsers()"
              class="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả khối</option>
            </select>
          </div>
          
          <!-- Filter by Position -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">
              <i class="fas fa-briefcase mr-1"></i>Vị trí
            </label>
            <select 
              id="filter-position" 
              onchange="filterUsers()"
              class="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả vị trí</option>
            </select>
          </div>
        </div>
        
        <!-- Filter Summary -->
        <div id="filter-summary" class="mt-3 text-sm text-gray-600 font-medium">
          <i class="fas fa-info-circle mr-1"></i>
          <span id="filter-count">0</span> người dùng
        </div>
      </div>
      
      <div id="admin-users-container" class="text-center py-12 text-gray-500">
        <i class="fas fa-spinner fa-spin text-4xl mb-4"></i>
        <p>Đang tải danh sách người dùng...</p>
      </div>
      
      <div id="admin-message" class="mt-4"></div>
    </div> <!-- end bg-white -->
  `;
  
  // Only load user-related data, NOT statistics or templates
  loadAdminMetadata();
  loadAdminUsers();
}

let adminMetadata = { regions: [], positions: [] };
let allUsers = []; // Store all users for filtering

async function loadAdminStatistics() {
  try {
    const response = await axios.get('/api/admin/statistics', {
      params: {
        userId: currentUser?.id,
        username: currentUser?.username
      }
    });
    
    const stats = response.data.positionCounts;
    const container = document.getElementById('admin-statistics');
    
    const colors = [
      { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'fa-user-tie' },
      { bg: 'bg-purple-50', text: 'text-purple-600', icon: 'fa-user-shield' },
      { bg: 'bg-green-50', text: 'text-green-600', icon: 'fa-user-check' },
      { bg: 'bg-orange-50', text: 'text-orange-600', icon: 'fa-user' },
      { bg: 'bg-pink-50', text: 'text-pink-600', icon: 'fa-user-graduate' }
    ];
    
    container.innerHTML = stats.map((stat, idx) => `
      <div class="${colors[idx]?.bg || 'bg-gray-50'} rounded-lg p-4 text-center">
        <i class="fas ${colors[idx]?.icon || 'fa-user'} text-3xl ${colors[idx]?.text || 'text-gray-600'} mb-2"></i>
        <div class="text-2xl font-bold ${colors[idx]?.text || 'text-gray-600'}">${stat.count}</div>
        <div class="text-sm text-gray-600 mt-1">${stat.display_name}</div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading statistics:', error);
  }
}

async function loadKpiTemplates() {
  try {
    const response = await axios.get('/api/admin/kpi-templates');
    const templates = response.data.templates;
    const container = document.getElementById('kpi-templates-table');
    
    // Group by position
    const grouped = {};
    templates.forEach(t => {
      if (!grouped[t.position_name]) grouped[t.position_name] = { kpi: [], level: [] };
      if (t.is_for_kpi) grouped[t.position_name].kpi.push(t);
      else grouped[t.position_name].level.push(t);
    });
    
    let html = '<div class="space-y-6">';
    
    Object.keys(grouped).forEach(posName => {
      html += `
        <div>
          <h4 class="font-bold text-lg text-gray-800 mb-3 bg-gray-100 px-4 py-2 rounded-lg">
            ${posName}
          </h4>
          <div class="grid md:grid-cols-2 gap-4">
            <!-- KPI -->
            <div>
              <h5 class="font-semibold text-blue-600 mb-2">KPI Chỉ số</h5>
              <table class="w-full text-sm">
                <thead class="bg-blue-50">
                  <tr>
                    <th class="px-3 py-2 text-left">Tên chỉ số</th>
                    <th class="px-3 py-2 text-center">Trọng số</th>
                    <th class="px-3 py-2 text-center">Mức chuẩn</th>
                  </tr>
                </thead>
                <tbody>
                  ${grouped[posName].kpi.map(t => `
                    <tr class="border-b">
                      <td class="px-3 py-2">${t.kpi_name}</td>
                      <td class="px-3 py-2 text-center">${(t.weight * 100)}%</td>
                      <td class="px-3 py-2 text-center">${formatLargeNumber(t.standard_value, t.kpi_name)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            <!-- Level -->
            <div>
              <h5 class="font-semibold text-green-600 mb-2">Level Chỉ số</h5>
              <table class="w-full text-sm">
                <thead class="bg-green-50">
                  <tr>
                    <th class="px-3 py-2 text-left">Tên chỉ số</th>
                    <th class="px-3 py-2 text-center">Trọng số</th>
                    <th class="px-3 py-2 text-center">Mức chuẩn</th>
                  </tr>
                </thead>
                <tbody>
                  ${grouped[posName].level.map(t => `
                    <tr class="border-b">
                      <td class="px-3 py-2">${t.kpi_name}</td>
                      <td class="px-3 py-2 text-center">${(t.weight * 100)}%</td>
                      <td class="px-3 py-2 text-center">${formatLargeNumber(t.standard_value, t.kpi_name)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    container.innerHTML = html;
  } catch (error) {
    console.error('Error loading KPI templates:', error);
  }
}

async function loadAdminMetadata() {
  try {
    const response = await axios.get('/api/admin/metadata');
    adminMetadata = response.data;
    
    // Populate region dropdown (for create form)
    const regionSelect = document.getElementById('new-region');
    if (regionSelect) {
      regionSelect.innerHTML = '<option value="">Chọn khối</option>' +
        adminMetadata.regions.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
    }
    
    // Populate position dropdown (for create form)
    const positionSelect = document.getElementById('new-position');
    if (positionSelect) {
      positionSelect.innerHTML = '<option value="">Chọn vị trí</option>' +
        adminMetadata.positions.map(p => `<option value="${p.id}">${p.display_name}</option>`).join('');
    }
    
    // Populate filter dropdowns
    const filterRegion = document.getElementById('filter-region');
    if (filterRegion) {
      filterRegion.innerHTML = '<option value="">Tất cả khối</option>' +
        adminMetadata.regions.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
    }
    
    const filterPosition = document.getElementById('filter-position');
    if (filterPosition) {
      filterPosition.innerHTML = '<option value="">Tất cả vị trí</option>' +
        adminMetadata.positions.map(p => `<option value="${p.id}">${p.display_name}</option>`).join('');
    }
  } catch (error) {
    console.error('Error loading metadata:', error);
  }
}

async function loadPotentialManagers() {
  const regionId = document.getElementById('new-region').value;
  const positionId = document.getElementById('new-position').value;
  const managerSelect = document.getElementById('new-manager');
  
  if (!regionId || !positionId) {
    managerSelect.innerHTML = '<option value="">Chọn quản lý (nếu có)</option>';
    return;
  }
  
  try {
    const response = await axios.get(`/api/admin/potential-managers/${regionId}/${positionId}`);
    const managers = response.data.managers;
    
    if (managers.length === 0) {
      managerSelect.innerHTML = '<option value="">Không có quản lý cấp trên (Phó Tổng)</option>';
    } else {
      managerSelect.innerHTML = '<option value="">Chọn quản lý</option>' +
        managers.map(m => `<option value="${m.id}">${m.full_name} (${m.username})</option>`).join('');
    }
  } catch (error) {
    console.error('Error loading managers:', error);
  }
}

function showCreateUserForm() {
  document.getElementById('create-user-form').classList.remove('hidden');
}

function hideCreateUserForm() {
  document.getElementById('create-user-form').classList.add('hidden');
  // Clear form
  document.getElementById('new-username').value = '';
  document.getElementById('new-password').value = '';
  document.getElementById('new-fullname').value = '';
  document.getElementById('new-region').value = '';
  document.getElementById('new-position').value = '';
  document.getElementById('new-manager').value = '';
  document.getElementById('new-startdate').value = '';
}

async function createNewUser() {
  const username = document.getElementById('new-username').value.trim();
  const password = document.getElementById('new-password').value;
  const fullName = document.getElementById('new-fullname').value.trim();
  const regionId = document.getElementById('new-region').value;
  const positionId = document.getElementById('new-position').value;
  const team = document.getElementById('new-team').value.trim();
  const startDate = document.getElementById('new-startdate').value;
  const messageDiv = document.getElementById('admin-message');
  
  // Validation
  if (!username || !password || !fullName || !regionId || !positionId || !startDate) {
    messageDiv.innerHTML = `
      <div class="p-4 bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 rounded-lg">
        <i class="fas fa-exclamation-triangle mr-2"></i>Vui lòng điền đầy đủ thông tin bắt buộc (*)
      </div>
    `;
    return;
  }
  
  try {
    await axios.post('/api/admin/users', {
      username,
      password,
      full_name: fullName,
      region_id: parseInt(regionId),
      position_id: parseInt(positionId),
      start_date: startDate,
      team: team || null
    });
    
    messageDiv.innerHTML = `
      <div class="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-lg">
        <i class="fas fa-check-circle mr-2"></i>Tạo tài khoản thành công!
      </div>
    `;
    
    hideCreateUserForm();
    loadAdminUsers();
    
    setTimeout(() => {
      messageDiv.innerHTML = '';
    }, 3000);
    
  } catch (error) {
    messageDiv.innerHTML = `
      <div class="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg">
        <i class="fas fa-exclamation-circle mr-2"></i>${error.response?.data?.error || 'Lỗi tạo tài khoản'}
      </div>
    `;
  }
}

async function loadAdminUsers() {
  const container = document.getElementById('admin-users-container');
  
  try {
    const response = await axios.get('/api/admin/users', {
      params: {
        userId: currentUser?.id,
        username: currentUser?.username
      }
    });
    allUsers = response.data.users; // Store for filtering
    
    renderUserTable(allUsers); // Render with all users initially
  } catch (error) {
    console.error('Error loading users:', error);
    container.innerHTML = '<div class="text-center py-8 text-red-500">Lỗi tải danh sách người dùng</div>';
  }
}

function renderUserTable(users) {
  const container = document.getElementById('admin-users-container');
  
  if (users.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 text-gray-500">
        <i class="fas fa-user-slash text-4xl mb-3"></i>
        <p class="text-lg">Không tìm thấy người dùng nào</p>
      </div>
    `;
    document.getElementById('filter-count').textContent = '0';
    return;
  }
  
  const html = `
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="bg-gradient-to-r from-red-500 to-pink-600 text-white">
            <th class="px-4 py-3 text-left">STT</th>
            <th class="px-4 py-3 text-left">Tên đăng nhập</th>
            <th class="px-4 py-3 text-left">Họ tên</th>
            <th class="px-4 py-3 text-left">Khối</th>
            <th class="px-4 py-3 text-left">Team</th>
            <th class="px-4 py-3 text-left">Vị trí</th>
            <th class="px-4 py-3 text-left">Ngày nhận việc</th>
            <th class="px-4 py-3 text-center">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          ${users.map((user, idx) => `
            <tr class="border-b hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">
              <td class="px-4 py-3 font-semibold">${idx + 1}</td>
              <td class="px-4 py-3 text-blue-600">${user.username}</td>
              <td class="px-4 py-3 font-semibold">${user.full_name}</td>
              <td class="px-4 py-3">
                <span class="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                  ${user.region_name}
                </span>
              </td>
              <td class="px-4 py-3">
                <span class="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-mono">
                  ${user.team || '-'}
                </span>
              </td>
              <td class="px-4 py-3">
                <span class="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                  ${user.position_name}
                </span>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">
                ${user.start_date || '<span class="text-gray-400 italic">Chưa có</span>'}
              </td>
              <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center space-x-2">
                  <button 
                    onclick="showEditUserModal(${user.id})"
                    class="px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:shadow-lg transition-all text-sm"
                    title="Sửa thông tin"
                  >
                    <i class="fas fa-edit"></i>
                  </button>
                  <button 
                    onclick="deleteUser(${user.id}, '${user.full_name}')"
                    class="px-3 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all text-sm"
                    title="Xóa tài khoản"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    <div class="mt-4 text-sm text-gray-600">
      <i class="fas fa-info-circle mr-2"></i>
      <strong>Cấu trúc phân cấp:</strong> Giám sát → Trợ lý KD → GĐKD → GĐKDCC → PTGĐ
    </div>
  `;
  
  container.innerHTML = html;
  document.getElementById('filter-count').textContent = users.length;
}

function filterUsers() {
  const searchText = document.getElementById('user-search')?.value.toLowerCase() || '';
  const filterRegionId = document.getElementById('filter-region')?.value || '';
  const filterPositionId = document.getElementById('filter-position')?.value || '';
  
  let filtered = allUsers.filter(user => {
    // Search by name or username
    const matchSearch = !searchText || 
      user.full_name.toLowerCase().includes(searchText) ||
      user.username.toLowerCase().includes(searchText);
    
    // Filter by region
    const matchRegion = !filterRegionId || user.region_id == filterRegionId;
    
    // Filter by position
    const matchPosition = !filterPositionId || user.position_id == filterPositionId;
    
    return matchSearch && matchRegion && matchPosition;
  });
  
  renderUserTable(filtered);
}

// Old render code removed, replaced with renderUserTable()

async function updateUser(userId) {
  const dateInput = document.getElementById(`date-${userId}`);
  const startDate = dateInput.value;
  const messageDiv = document.getElementById('admin-message');
  
  if (!startDate) {
    messageDiv.innerHTML = `
      <div class="p-4 bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700 rounded-lg">
        <i class="fas fa-exclamation-triangle mr-2"></i>Vui lòng chọn ngày nhận việc
      </div>
    `;
    return;
  }
  
  try {
    await axios.put(`/api/admin/users/${userId}`, { 
      start_date: startDate,
      manager_id: null // Will be managed through create form for now
    });
    
    messageDiv.innerHTML = `
      <div class="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-lg">
        <i class="fas fa-check-circle mr-2"></i>Cập nhật thành công!
      </div>
    `;
    
    setTimeout(() => {
      messageDiv.innerHTML = '';
    }, 3000);
    
  } catch (error) {
    messageDiv.innerHTML = `
      <div class="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg">
        <i class="fas fa-exclamation-circle mr-2"></i>Lỗi cập nhật
      </div>
    `;
  }
}

async function deleteUser(userId, fullName) {
  if (!confirm(`Bạn có chắc muốn xóa tài khoản "${fullName}"?\n\nLưu ý: Tất cả dữ liệu KPI của người này sẽ bị xóa.`)) {
    return;
  }
  
  const messageDiv = document.getElementById('admin-message');
  
  try {
    await axios.delete(`/api/admin/users/${userId}`);
    
    messageDiv.innerHTML = `
      <div class="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-lg">
        <i class="fas fa-check-circle mr-2"></i>Xóa tài khoản thành công!
      </div>
    `;
    
    loadAdminUsers();
    
    setTimeout(() => {
      messageDiv.innerHTML = '';
    }, 3000);
    
  } catch (error) {
    messageDiv.innerHTML = `
      <div class="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg">
        <i class="fas fa-exclamation-circle mr-2"></i>${error.response?.data?.error || 'Lỗi xóa tài khoản'}
      </div>
    `;
  }
}

// ===== EDIT USER FUNCTIONS =====
let currentEditUserId = null;

async function showEditUserModal(userId) {
  currentEditUserId = userId;
  
  // Fetch user data
  try {
    const response = await axios.get('/api/admin/users');
    const user = response.data.users.find(u => u.id === userId);
    
    if (!user) {
      alert('Không tìm thấy người dùng');
      return;
    }
    
    // Populate form
    document.getElementById('edit-username').value = user.username;
    document.getElementById('edit-fullname').value = user.full_name;
    document.getElementById('edit-password').value = ''; // Always empty
    document.getElementById('edit-startdate').value = user.start_date || '';
    
    // Populate region dropdown
    const regionSelect = document.getElementById('edit-region');
    regionSelect.innerHTML = '<option value="">Chọn khối</option>' +
      adminMetadata.regions.map(r => 
        `<option value="${r.id}" ${r.id === user.region_id ? 'selected' : ''}>${r.name}</option>`
      ).join('');
    
    // Populate position dropdown
    const positionSelect = document.getElementById('edit-position');
    positionSelect.innerHTML = '<option value="">Chọn vị trí</option>' +
      adminMetadata.positions.map(p => 
        `<option value="${p.id}" ${p.id === user.position_id ? 'selected' : ''}>${p.display_name}</option>`
      ).join('');
    
    // Populate team field
    document.getElementById('edit-team').value = user.team || '';
    
    // Populate cover image URL
    const coverUrlInput = document.getElementById('edit-cover-url');
    const coverPreview = document.getElementById('edit-cover-preview');
    coverUrlInput.value = user.cover_image_url || '';
    
    // Show preview if URL exists
    if (user.cover_image_url) {
      coverPreview.querySelector('img').src = user.cover_image_url;
      coverPreview.classList.remove('hidden');
    } else {
      coverPreview.classList.add('hidden');
    }
    
    // Add input listener for preview
    coverUrlInput.addEventListener('input', (e) => {
      const url = e.target.value.trim();
      if (url) {
        coverPreview.querySelector('img').src = url;
        coverPreview.classList.remove('hidden');
      } else {
        coverPreview.classList.add('hidden');
      }
    });
    
    // Show modal
    document.getElementById('edit-user-modal').classList.remove('hidden');
    
  } catch (error) {
    console.error('Error loading user data:', error);
    alert('Lỗi tải thông tin người dùng');
  }
}

function hideEditUserModal() {
  document.getElementById('edit-user-modal').classList.add('hidden');
  currentEditUserId = null;
  
  // Clear form
  document.getElementById('edit-username').value = '';
  document.getElementById('edit-fullname').value = '';
  document.getElementById('edit-password').value = '';
  document.getElementById('edit-region').value = '';
  document.getElementById('edit-position').value = '';
  document.getElementById('edit-manager').value = '';
  document.getElementById('edit-startdate').value = '';
}

async function loadEditPotentialManagers() {
  const regionId = document.getElementById('edit-region').value;
  const positionId = document.getElementById('edit-position').value;
  const managerSelect = document.getElementById('edit-manager');
  
  if (!regionId || !positionId) {
    managerSelect.innerHTML = '<option value="">Chọn quản lý (nếu có)</option>';
    return;
  }
  
  try {
    const response = await axios.get(`/api/admin/potential-managers/${regionId}/${positionId}`);
    const managers = response.data.managers;
    
    const currentManagerId = managerSelect.value; // Remember current selection
    
    if (managers.length === 0) {
      managerSelect.innerHTML = '<option value="">Không có quản lý cấp trên (Phó Tổng)</option>';
    } else {
      managerSelect.innerHTML = '<option value="">Chọn quản lý</option>' +
        managers.map(m => 
          `<option value="${m.id}" ${m.id == currentManagerId ? 'selected' : ''}>${m.full_name} (${m.username})</option>`
        ).join('');
    }
  } catch (error) {
    console.error('Error loading managers:', error);
  }
}

async function saveEditUser() {
  if (!currentEditUserId) return;
  
  const fullName = document.getElementById('edit-fullname').value.trim();
  const password = document.getElementById('edit-password').value.trim();
  const regionId = document.getElementById('edit-region').value;
  const positionId = document.getElementById('edit-position').value;
  const team = document.getElementById('edit-team').value.trim();
  const startDate = document.getElementById('edit-startdate').value;
  const coverImageUrl = document.getElementById('edit-cover-url').value.trim();
  
  // Validation
  if (!fullName || !regionId || !positionId || !startDate) {
    alert('Vui lòng điền đầy đủ thông tin bắt buộc (*)');
    return;
  }
  
  const messageDiv = document.getElementById('admin-message');
  
  try {
    // Build update data
    const updateData = {
      full_name: fullName,
      region_id: parseInt(regionId),
      position_id: parseInt(positionId),
      team: team || null,
      start_date: startDate,
      cover_image_url: coverImageUrl || null
    };
    
    // Only include password if provided
    if (password) {
      updateData.password = password;
    }
    
    await axios.put(`/api/admin/users/${currentEditUserId}`, updateData);
    
    messageDiv.innerHTML = `
      <div class="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-lg">
        <i class="fas fa-check-circle mr-2"></i>Cập nhật thông tin thành công!
      </div>
    `;
    
    hideEditUserModal();
    loadAdminUsers();
    
    setTimeout(() => {
      messageDiv.innerHTML = '';
    }, 3000);
    
  } catch (error) {
    messageDiv.innerHTML = `
      <div class="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg">
        <i class="fas fa-exclamation-circle mr-2"></i>${error.response?.data?.error || 'Lỗi cập nhật thông tin'}
      </div>
    `;
  }
}

// ===== COMMITMENT TAB =====
function renderCommitmentTab(container) {
  container.innerHTML = `
    <div class="bg-white rounded-2xl shadow-xl p-8">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center space-x-3">
          <div class="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
            <i class="fas fa-file-contract text-2xl text-white"></i>
          </div>
          <div>
            <h2 class="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Cam Kết Mục Tiêu 2026
            </h2>
            <p class="text-sm text-gray-600">Bảng giao chỉ tiêu cá nhân</p>
          </div>
        </div>
      </div>
      
      ${currentUser.cover_image_url ? `
        <div class="relative bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border-2 border-orange-200 shadow-lg">
          <div class="absolute top-4 right-4 z-10">
            <span class="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full shadow-md">
              <i class="fas fa-star mr-1"></i>Năm 2026
            </span>
          </div>
          ${currentUser.cover_image_url.toLowerCase().endsWith('.pdf') ? `
            <embed 
              src="${currentUser.cover_image_url}" 
              type="application/pdf" 
              class="w-full rounded-lg" 
              style="height: 700px;"
            />
          ` : `
            <img 
              src="${currentUser.cover_image_url}" 
              alt="Bảng Cam Kết Mục Tiêu 2026" 
              class="w-full max-h-[600px] object-contain rounded-lg"
              onerror="this.parentElement.innerHTML='<p class=\\'text-center text-gray-500 py-12\\'><i class=\\'fas fa-exclamation-triangle mr-2\\'></i>Không thể tải ảnh</p>'"
            >
          `}
          <div class="mt-4 text-center">
            <p class="text-sm text-gray-600">
              <i class="fas fa-info-circle mr-2"></i>
              Đây là bảng cam kết mục tiêu được giao cho bạn trong năm 2026
            </p>
          </div>
        </div>
      ` : `
        <div class="max-w-2xl mx-auto">
          <div class="text-center py-8">
            <div class="inline-block p-6 bg-gray-100 rounded-full mb-4">
              <i class="fas fa-image text-6xl text-gray-400"></i>
            </div>
            <h3 class="text-xl font-semibold text-gray-700 mb-2">
              Chưa có Bảng Cam Kết Mục Tiêu
            </h3>
            <p class="text-gray-500 mb-6">
              Tải lên bảng cam kết mục tiêu 2026 của bạn (file ảnh hoặc PDF)
            </p>
          </div>

          <!-- Upload Form -->
          <div class="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border-2 border-orange-200 shadow-lg">
            <label class="block mb-4 text-sm font-semibold text-gray-700">
              <i class="fas fa-file-upload mr-2 text-orange-600"></i>
              Chọn file từ máy tính (tối đa 2MB)
            </label>
            
            <!-- File Input (Hidden) -->
            <input 
              type="file" 
              id="user-cover-file" 
              accept="image/png,image/jpeg,image/jpg,application/pdf"
              class="hidden"
              onchange="handleFileSelect(event)"
            />
            
            <!-- Custom Upload Button -->
            <button 
              onclick="document.getElementById('user-cover-file').click()"
              class="w-full px-6 py-4 bg-white border-2 border-dashed border-orange-400 rounded-lg hover:border-orange-600 hover:bg-orange-50 transition-all duration-300 mb-4"
            >
              <div class="flex flex-col items-center">
                <i class="fas fa-cloud-upload-alt text-4xl text-orange-500 mb-2"></i>
                <span class="text-gray-700 font-medium">Click để chọn file</span>
                <span class="text-gray-500 text-sm mt-1">PNG, JPG hoặc PDF (tối đa 2MB)</span>
              </div>
            </button>

            <!-- Selected File Info -->
            <div id="selected-file-info" class="hidden mb-4 p-3 bg-white rounded-lg border border-orange-300">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <i class="fas fa-file-alt text-orange-600 text-xl"></i>
                  <div>
                    <p id="file-name" class="text-sm font-medium text-gray-800"></p>
                    <p id="file-size" class="text-xs text-gray-500"></p>
                  </div>
                </div>
                <button onclick="clearFileSelection()" class="text-red-500 hover:text-red-700">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
            
            <!-- Preview Area -->
            <div id="user-cover-preview" class="hidden mb-4">
              <p class="text-sm text-gray-600 mb-2">
                <i class="fas fa-eye mr-2"></i>Preview:
              </p>
              <div id="preview-content" class="w-full rounded-lg border-2 border-orange-300 shadow-md bg-white" style="min-height: 300px;">
                <!-- Image or PDF preview will be inserted here -->
              </div>
            </div>

            <button 
              id="upload-btn"
              onclick="uploadUserCover()"
              class="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled
            >
              <i class="fas fa-save mr-2"></i>Tải lên và Lưu Cam Kết Mục Tiêu
            </button>

            <div id="user-cover-message" class="mt-4 hidden"></div>

            <div class="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p class="text-sm text-gray-600">
                <i class="fas fa-info-circle text-blue-600 mr-2"></i>
                Click vào khung bên trên để chọn file ảnh (PNG/JPG) hoặc PDF (tối đa 2MB), xem preview và click "Tải lên và Lưu"
              </p>
            </div>
          </div>
        </div>
      `}
    </div>
  `;

  // No need for event listeners since we use onchange and onclick directly
}

// Global variable for upload
let selectedCoverFile = null;

// Handle file selection
function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Validate file size (2MB max to avoid stack overflow with base64)
  const maxSize = 2 * 1024 * 1024; // 2MB
  if (file.size > maxSize) {
    alert('File quá lớn! Vui lòng chọn file nhỏ hơn 2MB, hoặc sử dụng tab "Paste URL" để upload file lớn từ GenSpark AI Drive');
    document.getElementById('user-cover-file').value = '';
    return;
  }

  // Validate file type
  const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
  if (!validTypes.includes(file.type)) {
    alert('Định dạng file không hợp lệ! Chỉ chấp nhận PNG, JPG hoặc PDF');
    document.getElementById('user-cover-file').value = '';
    return;
  }

  selectedCoverFile = file;

  // Show file info
  const fileInfo = document.getElementById('selected-file-info');
  const fileName = document.getElementById('file-name');
  const fileSize = document.getElementById('file-size');
  const uploadBtn = document.getElementById('upload-btn');

  fileName.textContent = file.name;
  fileSize.textContent = formatFileSize(file.size);
  fileInfo.classList.remove('hidden');
  uploadBtn.disabled = false;

  // Show preview
  const previewDiv = document.getElementById('user-cover-preview');
  const previewContent = document.getElementById('preview-content');

  if (file.type === 'application/pdf') {
    // PDF preview using iframe
    const reader = new FileReader();
    reader.onload = (e) => {
      previewContent.innerHTML = `
        <embed 
          src="${e.target.result}" 
          type="application/pdf" 
          class="w-full" 
          style="height: 500px;"
        />
      `;
      previewDiv.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  } else {
    // Image preview
    const reader = new FileReader();
    reader.onload = (e) => {
      previewContent.innerHTML = `
        <img 
          src="${e.target.result}" 
          class="w-full h-auto" 
          style="max-height: 500px; object-fit: contain;"
        />
      `;
      previewDiv.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  }
}

// Clear file selection
function clearFileSelection() {
  selectedCoverFile = null;
  document.getElementById('user-cover-file').value = '';
  document.getElementById('selected-file-info').classList.add('hidden');
  document.getElementById('user-cover-preview').classList.add('hidden');
  document.getElementById('upload-btn').disabled = true;
}

// Format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Upload user cover image
async function uploadUserCover() {
  const messageDiv = document.getElementById('user-cover-message');
  const uploadBtn = document.getElementById('upload-btn');

  if (!selectedCoverFile) {
    messageDiv.className = 'mt-4 p-4 bg-red-100 border border-red-300 rounded-lg text-red-800';
    messageDiv.innerHTML = '<i class="fas fa-exclamation-circle mr-2"></i>Vui lòng chọn file trước';
    messageDiv.classList.remove('hidden');
    return;
  }

  // Show uploading state
  uploadBtn.disabled = true;
  uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Đang tải lên...';
  messageDiv.className = 'mt-4 p-4 bg-blue-100 border border-blue-300 rounded-lg text-blue-800';
  messageDiv.innerHTML = '<i class="fas fa-info-circle mr-2"></i>Đang tải file lên server...';
  messageDiv.classList.remove('hidden');

  try {
    const formData = new FormData();
    formData.append('file', selectedCoverFile);
    formData.append('userId', currentUser.id);

    const response = await fetch('/api/users/upload-cover', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Lỗi khi upload');
    }

    // Success
    messageDiv.className = 'mt-4 p-4 bg-green-100 border border-green-300 rounded-lg text-green-800';
    messageDiv.innerHTML = '<i class="fas fa-check-circle mr-2"></i>Upload thành công! Đang tải lại...';

    // Update currentUser and reload
    currentUser.cover_image_url = data.coverUrl;
    setTimeout(() => {
      const container = document.getElementById('tab-content');
      renderCommitmentTab(container);
    }, 1500);
  } catch (error) {
    console.error('Upload cover error:', error);
    messageDiv.className = 'mt-4 p-4 bg-red-100 border border-red-300 rounded-lg text-red-800';
    messageDiv.innerHTML = `<i class="fas fa-exclamation-circle mr-2"></i>${error.message}`;
    uploadBtn.disabled = false;
    uploadBtn.innerHTML = '<i class="fas fa-upload mr-2"></i>Tải lên và Lưu';
  }
}

// ===== RECRUITMENT CHART TAB =====
function renderRecruitmentTab(container) {
  container.innerHTML = `
    <div class="bg-white rounded-2xl shadow-xl p-8">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center space-x-3">
          <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center">
            <i class="fas fa-chart-line text-2xl text-white"></i>
          </div>
          <div>
            <h2 class="text-2xl font-bold text-gray-800">Biểu đồ Tuyển dụng</h2>
            <p class="text-sm text-gray-500">Số lượng lao động nhận việc mỗi tháng</p>
          </div>
        </div>
        <div class="flex items-center space-x-4">
          <select id="chart-year" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
            <option value="2026" selected>Năm 2026</option>
          </select>
          <select id="chart-month" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
            ${Array.from({length: 12}, (_, i) => i + 1).map(m => 
              `<option value="${m}" ${m === currentMonth ? 'selected' : ''}>Tháng ${m}</option>`
            ).join('')}
          </select>
          <button onclick="loadRecruitmentChart()" class="px-6 py-2 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg hover:shadow-lg transition-all duration-300">
            <i class="fas fa-sync-alt mr-2"></i>Tải dữ liệu
          </button>
        </div>
      </div>

      <div id="chart-container" class="relative">
        <div class="flex items-center justify-center py-20">
          <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500"></div>
        </div>
      </div>
    </div>
  `;
  
  // Load chart data
  setTimeout(() => loadRecruitmentChart(), 100);
}

async function loadRecruitmentChart() {
  const year = document.getElementById('chart-year').value;
  const month = document.getElementById('chart-month').value;
  const container = document.getElementById('chart-container');
  
  try {
    container.innerHTML = '<div class="flex items-center justify-center py-20"><div class="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500"></div></div>';
    
    const response = await fetch(`/api/recruitment-chart/${year}/${month}`);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to load chart');
    }
    
    renderRecruitmentChart(result);
  } catch (error) {
    container.innerHTML = `
      <div class="text-center py-10 text-red-600">
        <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
        <p class="text-lg">Lỗi tải dữ liệu: ${error.message}</p>
      </div>
    `;
  }
}

function renderRecruitmentChart(chartData) {
  const container = document.getElementById('chart-container');
  const { data, standard } = chartData;
  
  // Filter users with data and sort by actual_value
  const usersWithData = data.filter(u => u.actual_value !== null).sort((a, b) => b.actual_value - a.actual_value);
  const usersWithoutData = data.filter(u => u.actual_value === null);
  
  // Calculate company average
  const totalRecruitment = usersWithData.reduce((sum, u) => sum + u.actual_value, 0);
  const companyAverage = usersWithData.length > 0 ? Math.round(totalRecruitment / usersWithData.length * 10) / 10 : 0;
  
  if (usersWithData.length === 0) {
    container.innerHTML = `
      <div class="text-center py-20 text-gray-500">
        <i class="fas fa-chart-bar text-6xl mb-4 opacity-20"></i>
        <p class="text-xl">Chưa có dữ liệu cho tháng này</p>
        <p class="text-sm mt-2">Vui lòng nhập KPI để xem thống kê</p>
      </div>
    `;
    return;
  }
  
  // Get top 10 and users need improvement (< 15 people)
  const top10 = usersWithData.slice(0, 10);
  const needImprovement = usersWithData.filter(u => u.actual_value < 15).sort((a, b) => a.actual_value - b.actual_value);
  
  // Find current user position
  const currentUserIndex = usersWithData.findIndex(u => u.id === currentUser.id);
  const currentUserData = usersWithData[currentUserIndex];
  const currentUserRank = currentUserIndex >= 0 ? currentUserIndex + 1 : null;

  
  container.innerHTML = `
    <!-- Summary Cards -->
    <div class="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="p-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-lg border-2 border-green-200">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
            <i class="fas fa-flag-checkered text-white"></i>
          </div>
          <div>
            <p class="text-xs text-gray-600">Mức chuẩn</p>
            <p class="text-xl font-bold text-green-600">${standard} người</p>
          </div>
        </div>
      </div>
      
      <div class="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <i class="fas fa-chart-line text-white"></i>
          </div>
          <div>
            <p class="text-xs text-gray-600">Trung bình công ty</p>
            <p class="text-xl font-bold text-blue-600">${companyAverage} người</p>
          </div>
        </div>
      </div>
      
      <div class="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
            <i class="fas fa-user text-white"></i>
          </div>
          <div>
            <p class="text-xs text-gray-600">Vị trí của bạn</p>
            <p class="text-xl font-bold text-purple-600">${currentUserRank ? '#' + currentUserRank : 'N/A'}</p>
          </div>
        </div>
      </div>
      
      <div class="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border-2 border-gray-200">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center">
            <i class="fas fa-users text-white"></i>
          </div>
          <div>
            <p class="text-xs text-gray-600">Có dữ liệu</p>
            <p class="text-xl font-bold text-gray-800">${usersWithData.length}/${data.length}</p>
          </div>
        </div>
      </div>
    </div>

    ${currentUserData ? `
    <!-- Current User Status -->
    <div class="mb-6 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
      <h3 class="text-lg font-bold text-gray-800 mb-4">
        <i class="fas fa-user-circle mr-2 text-purple-600"></i>Thống kê của bạn
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="text-center">
          <p class="text-sm text-gray-600">Số lượng tuyển dụng</p>
          <p class="text-3xl font-bold text-purple-600">${currentUserData.actual_value}</p>
        </div>
        <div class="text-center">
          <p class="text-sm text-gray-600">So với mức chuẩn</p>
          <p class="text-2xl font-bold ${currentUserData.actual_value >= standard ? 'text-green-600' : 'text-red-600'}">
            ${currentUserData.actual_value >= standard ? '+' : ''}${currentUserData.actual_value - standard}
            <span class="text-sm">(${currentUserData.actual_value >= standard ? 'Đạt' : 'Chưa đạt'})</span>
          </p>
        </div>
        <div class="text-center">
          <p class="text-sm text-gray-600">So với trung bình</p>
          <p class="text-2xl font-bold ${currentUserData.actual_value >= companyAverage ? 'text-green-600' : 'text-orange-600'}">
            ${currentUserData.actual_value >= companyAverage ? '+' : ''}${Math.round((currentUserData.actual_value - companyAverage) * 10) / 10}
            <span class="text-sm">(${currentUserData.actual_value >= companyAverage ? 'Trên TB' : 'Dưới TB'})</span>
          </p>
        </div>
        <div class="text-center">
          <p class="text-sm text-gray-600">Xếp hạng</p>
          <p class="text-3xl font-bold text-purple-600">#${currentUserRank}</p>
          <p class="text-xs text-gray-500">/${usersWithData.length} người</p>
        </div>
      </div>
    </div>
    ` : ''}

    <!-- Top 10 and Bottom 10 Tables -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Top 10 -->
      <div class="bg-white rounded-xl border-2 border-green-200 overflow-hidden">
        <div class="bg-gradient-to-r from-green-500 to-teal-600 p-4">
          <h3 class="text-lg font-bold text-white">
            <i class="fas fa-trophy mr-2"></i>Top 10 Tuyển dụng tốt nhất
          </h3>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-green-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700">Hạng</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700">Họ tên</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-gray-700">Số lượng</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-gray-700">So chuẩn</th>
              </tr>
            </thead>
            <tbody>
              ${top10.map((user, idx) => `
                <tr class="border-b hover:bg-green-50 ${user.id === currentUser.id ? 'bg-purple-50' : ''}">>
                  <td class="px-4 py-3">
                    <span class="inline-flex items-center justify-center w-8 h-8 rounded-full ${
                      idx === 0 ? 'bg-yellow-400 text-yellow-900' :
                      idx === 1 ? 'bg-gray-300 text-gray-700' :
                      idx === 2 ? 'bg-orange-400 text-orange-900' :
                      'bg-gray-100 text-gray-600'
                    } font-bold text-sm">
                      ${idx + 1}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-sm font-semibold ${user.id === currentUser.id ? 'text-purple-600' : 'text-gray-800'}">>
                    ${user.full_name}
                    ${user.id === currentUser.id ? '<span class="text-purple-600 ml-1">(Bạn)</span>' : ''}
                  </td>
                  <td class="px-4 py-3 text-right">
                    <span class="text-lg font-bold text-green-600">${user.actual_value}</span>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <span class="text-sm font-semibold ${user.actual_value >= standard ? 'text-green-600' : 'text-gray-600'}">
                      ${user.actual_value >= standard ? '+' : ''}${user.actual_value - standard}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Need Improvement (< 15) -->
      <div class="bg-white rounded-xl border-2 border-red-200 overflow-hidden">
        <div class="bg-gradient-to-r from-red-500 to-pink-600 p-4">
          <h3 class="text-lg font-bold text-white">
            <i class="fas fa-exclamation-triangle mr-2"></i>Cần cải thiện (< 15 người/tháng)
          </h3>
        </div>
        ${needImprovement.length > 0 ? `
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-red-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700">STT</th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700">Họ tên</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-gray-700">Số lượng</th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-gray-700">So chuẩn</th>
              </tr>
            </thead>
            <tbody>
              ${needImprovement.map((user, idx) => `
                <tr class="border-b hover:bg-red-50 ${user.id === currentUser.id ? 'bg-purple-50' : ''}">>
                  <td class="px-4 py-3">
                    <span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600 font-bold text-sm">
                      ${idx + 1}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-sm font-semibold ${user.id === currentUser.id ? 'text-purple-600' : 'text-gray-800'}">>
                    ${user.full_name}
                    ${user.id === currentUser.id ? '<span class="text-purple-600 ml-1">(Bạn)</span>' : ''}
                  </td>
                  <td class="px-4 py-3 text-right">
                    <span class="text-lg font-bold text-red-600">${user.actual_value}</span>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <span class="text-sm font-semibold text-red-600">
                      ${user.actual_value - standard}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : `
        <div class="text-center py-10 text-gray-500">
          <i class="fas fa-smile text-5xl mb-3 text-green-500"></i>
          <p class="text-lg font-semibold text-gray-700">Tuyệt vời!</p>
          <p class="text-sm">Không có ai dưới 15 người/tháng</p>
        </div>
        `}
      </div>
    </div>
  `;
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', renderApp);

// Position Dashboard with 12 months data
function renderPositionDashboard(container, positionIds, positionName) {
  container.innerHTML = `
    <div class="bg-white rounded-2xl shadow-xl p-6">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-2xl font-bold text-gray-800">
          <i class="fas fa-chart-bar mr-2 text-blue-600"></i>Dashboard ${positionName} - Năm 2026
        </h3>
        <select id="position-year" class="px-4 py-2 border-2 border-gray-300 rounded-lg" onchange="loadPositionDashboard('${positionIds}', '${positionName}')">
          <option value="2026" selected>2026</option>
        </select>
      </div>
      <div id="position-dashboard-content" class="overflow-x-auto">
        <div class="text-center py-12">
          <i class="fas fa-spinner fa-spin text-4xl text-gray-400 mb-4"></i>
          <p class="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    </div>
  `;
  
  loadPositionDashboard(positionIds, positionName);
}

async function loadPositionDashboard(positionIds, positionName) {
  try {
    const year = document.getElementById('position-year')?.value || '2026';
    
    const response = await axios.get(`/api/admin/dashboard/${positionIds}/${year}`, {
      params: {
        userId: currentUser?.id,
        username: currentUser?.username
      }
    });
    
    const { users, templates, monthlyData } = response.data;
    const container = document.getElementById('position-dashboard-content');
    
    if (!users || users.length === 0) {
      container.innerHTML = '<div class="text-center py-8 text-gray-500">Không có dữ liệu</div>';
      return;
    }
    
    // Group monthly data by user
    const userMonthlyData = {};
    monthlyData.forEach(m => {
      if (!userMonthlyData[m.user_id]) userMonthlyData[m.user_id] = {};
      userMonthlyData[m.user_id][m.month] = m;
    });
    
    // Create TWO separate tables: KPI and Level
    let html = '<div class="space-y-6">';
    
    // ===== TABLE 1: KPI =====
    html += '<div>';
    html += '<h4 class="text-lg font-bold text-blue-600 mb-3"><i class="fas fa-chart-line mr-2"></i>Bảng tổng hợp KPI</h4>';
    html += '<div class="overflow-x-auto">';
    html += '<table class="w-full text-sm border-collapse">';
    
    // KPI Header
    html += '<thead class="bg-gradient-to-r from-blue-500 to-blue-600 text-white sticky top-0">';
    html += '<tr>';
    html += '<th class="border px-3 py-2 text-left sticky left-0 bg-blue-600 z-10">Họ và tên</th>';
    html += '<th class="border px-3 py-2 text-left">Khu vực</th>';
    
    // 12 months columns
    for (let m = 1; m <= 12; m++) {
      html += `<th class="border px-2 py-2 text-center">T${m}</th>`;
    }
    
    html += '</tr>';
    html += '</thead>';
    
    // KPI Body
    html += '<tbody>';
    users.forEach((user, idx) => {
      html += `<tr class="${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50">`;
      html += `<td class="border px-3 py-2 font-semibold sticky left-0 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} z-5">${user.full_name}</td>`;
      html += `<td class="border px-3 py-2 text-xs">${user.region_name}</td>`;
      
      // 12 months KPI data
      for (let m = 1; m <= 12; m++) {
        const monthData = userMonthlyData[user.id]?.[m];
        if (monthData) {
          const kpiPercent = Math.round(monthData.total_kpi_score || 0);
          const kpiColor = kpiPercent >= 100 ? 'text-green-600' : kpiPercent >= 80 ? 'text-blue-600' : 'text-orange-600';
          
          html += `<td class="border px-2 py-2 text-center">
            <span class="${kpiColor} font-bold text-base">${kpiPercent}%</span>
          </td>`;
        } else {
          html += '<td class="border px-2 py-2 text-center text-gray-400">-</td>';
        }
      }
      
      html += '</tr>';
    });
    html += '</tbody>';
    html += '</table>';
    html += '</div>'; // end overflow-x-auto
    html += '</div>'; // end KPI table
    
    // ===== TABLE 2: LEVEL =====
    html += '<div>';
    html += '<h4 class="text-lg font-bold text-green-600 mb-3"><i class="fas fa-star mr-2"></i>Bảng tổng hợp Level</h4>';
    html += '<div class="overflow-x-auto">';
    html += '<table class="w-full text-sm border-collapse">';
    
    // Level Header
    html += '<thead class="bg-gradient-to-r from-green-500 to-green-600 text-white sticky top-0">';
    html += '<tr>';
    html += '<th class="border px-3 py-2 text-left sticky left-0 bg-green-600 z-10">Họ và tên</th>';
    html += '<th class="border px-3 py-2 text-left">Khu vực</th>';
    
    // 12 months columns
    for (let m = 1; m <= 12; m++) {
      html += `<th class="border px-2 py-2 text-center">T${m}</th>`;
    }
    
    html += '</tr>';
    html += '</thead>';
    
    // Level Body
    html += '<tbody>';
    users.forEach((user, idx) => {
      html += `<tr class="${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-green-50">`;
      html += `<td class="border px-3 py-2 font-semibold sticky left-0 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} z-5">${user.full_name}</td>`;
      html += `<td class="border px-3 py-2 text-xs">${user.region_name}</td>`;
      
      // 12 months Level data
      for (let m = 1; m <= 12; m++) {
        const monthData = userMonthlyData[user.id]?.[m];
        if (monthData) {
          const levelPercent = Math.round(monthData.total_level_score || 0);
          const levelColor = levelPercent >= 100 ? 'text-green-600' : levelPercent >= 80 ? 'text-blue-600' : 'text-orange-600';
          
          html += `<td class="border px-2 py-2 text-center">
            <span class="${levelColor} font-bold text-base">${levelPercent}%</span>
          </td>`;
        } else {
          html += '<td class="border px-2 py-2 text-center text-gray-400">-</td>';
        }
      }
      
      html += '</tr>';
    });
    html += '</tbody>';
    html += '</table>';
    html += '</div>'; // end overflow-x-auto
    html += '</div>'; // end Level table
    
    html += '</div>'; // end space-y-6
    
    container.innerHTML = html;
  } catch (error) {
    console.error('Error loading position dashboard:', error);
    document.getElementById('position-dashboard-content').innerHTML = 
      '<div class="text-center py-8 text-red-500">Lỗi tải dữ liệu</div>';
  }
}

// ===== KPI DETAIL DASHBOARD =====
function renderKpiDetail(container, positionIds, positionName, kpiIds) {
  container.innerHTML = `
    <div class="bg-white rounded-2xl shadow-xl p-6">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-2xl font-bold text-gray-800">
          <i class="fas fa-chart-line mr-2 text-orange-600"></i>${positionName} - Thống kê chỉ số trọng điểm
        </h3>
        <select id="kpi-year" class="px-4 py-2 border-2 border-gray-300 rounded-lg" onchange="loadKpiDetail('${positionIds}', '${positionName}', [${kpiIds}])">
          <option value="2026" selected>2026</option>
        </select>
      </div>
      <div id="kpi-detail-content" class="overflow-x-auto">
        <div class="text-center py-12">
          <i class="fas fa-spinner fa-spin text-4xl text-gray-400 mb-4"></i>
          <p class="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    </div>
  `;
  
  loadKpiDetail(positionIds, positionName, kpiIds);
}

async function loadKpiDetail(positionIds, positionName, kpiIds) {
  try {
    const year = document.getElementById('kpi-year')?.value || '2026';
    const response = await axios.get(`/api/admin/kpi-detail/${positionIds}/${year}/${kpiIds.join(',')}`, {
      params: {
        userId: currentUser?.id,
        username: currentUser?.username
      }
    });
    
    const { users, kpiTemplates, kpiData } = response.data;
    const container = document.getElementById('kpi-detail-content');
    
    if (!users || users.length === 0) {
      container.innerHTML = '<div class="text-center py-8 text-gray-500">Không có dữ liệu</div>';
      return;
    }
    
    // Group data by user and kpi
    const userKpiData = {};
    kpiData.forEach(d => {
      if (!userKpiData[d.user_id]) userKpiData[d.user_id] = {};
      if (!userKpiData[d.user_id][d.kpi_template_id]) userKpiData[d.user_id][d.kpi_template_id] = {};
      userKpiData[d.user_id][d.kpi_template_id][d.month] = d;
    });
    
    let html = '<div class="space-y-8">';
    
    // Create one table per KPI
    kpiTemplates.forEach(kpi => {
      html += '<div>';
      html += `<h4 class="text-lg font-bold text-orange-600 mb-3"><i class="fas fa-chart-bar mr-2"></i>${kpi.kpi_name}</h4>`;
      html += '<div class="overflow-x-auto">';
      html += '<table class="w-full text-sm border-collapse">';
      
      // Header
      html += '<thead class="bg-gradient-to-r from-orange-500 to-red-600 text-white sticky top-0">';
      html += '<tr>';
      html += '<th class="border px-3 py-2 text-left sticky left-0 bg-orange-600 z-10">Họ và tên</th>';
      html += '<th class="border px-3 py-2 text-left">Khu vực</th>';
      
      // 12 months
      for (let m = 1; m <= 12; m++) {
        html += `<th class="border px-2 py-2 text-center">T${m}</th>`;
      }
      
      html += '</tr>';
      html += '</thead>';
      
      // Body
      html += '<tbody>';
      users.forEach((user, idx) => {
        html += `<tr class="${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-orange-50">`;
        html += `<td class="border px-3 py-2 font-semibold sticky left-0 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} z-5">${user.full_name}</td>`;
        html += `<td class="border px-3 py-2 text-xs">${user.region_name}</td>`;
        
        // 12 months data
        for (let m = 1; m <= 12; m++) {
          const monthData = userKpiData[user.id]?.[kpi.id]?.[m];
          if (monthData && monthData.actual_value !== null) {
            const value = formatLargeNumber(monthData.actual_value, kpi.kpi_name);
            html += `<td class="border px-2 py-2 text-center">
              <span class="font-bold text-blue-600">${value}</span>
            </td>`;
          } else {
            html += '<td class="border px-2 py-2 text-center text-gray-400">-</td>';
          }
        }
        
        html += '</tr>';
      });
      html += '</tbody>';
      html += '</table>';
      html += '</div>'; // end overflow-x-auto
      html += '</div>'; // end table div
    });
    
    html += '</div>'; // end space-y-8
    
    container.innerHTML = html;
  } catch (error) {
    console.error('Error loading KPI detail:', error);
    document.getElementById('kpi-detail-content').innerHTML = 
      '<div class="text-center py-8 text-red-500">Lỗi tải dữ liệu</div>';
  }
}

// ===== REVENUE PLAN MANAGEMENT =====
function renderRevenuePlan(container) {
  container.innerHTML = `
    <div class="bg-white rounded-2xl shadow-xl p-6">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-2xl font-bold text-gray-800">
          <i class="fas fa-file-invoice-dollar mr-2 text-green-600"></i>Quản lý Kế hoạch Doanh thu
        </h3>
        <div class="flex items-center gap-3">
          <button 
            onclick="exportRevenuePlanTemplate()"
            class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            title="Tải file Excel mẫu"
          >
            <i class="fas fa-download mr-2"></i>Tải file mẫu
          </button>
          <button 
            onclick="document.getElementById('import-file').click()"
            class="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
            title="Import file Excel"
          >
            <i class="fas fa-upload mr-2"></i>Import Excel
          </button>
          <input type="file" id="import-file" accept=".xlsx,.xls" style="display:none" onchange="importRevenuePlan(event)" />
          <select id="plan-year" class="px-4 py-2 border-2 border-gray-300 rounded-lg" onchange="loadRevenuePlan()">
            <option value="2026" selected>2026</option>
          </select>
        </div>
      </div>
      
      <div class="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p class="text-sm text-blue-800">
          <i class="fas fa-info-circle mr-2"></i>
          <strong>Hướng dẫn:</strong> Nhập kế hoạch doanh thu (tỷ VNĐ) cho từng người theo từng tháng. 
          Hệ thống sẽ tự động tính % đạt được khi nhân viên nhập doanh thu thực tế.
        </p>
      </div>
      
      <div id="revenue-plan-content">
        <div class="text-center py-12">
          <i class="fas fa-spinner fa-spin text-4xl text-gray-400 mb-4"></i>
          <p class="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    </div>
  `;
  
  loadRevenuePlan();
}

async function loadRevenuePlan() {
  try {
    const year = document.getElementById('plan-year')?.value || '2026';
    const response = await axios.get(`/api/admin/revenue-plan/${year}`, {
      params: {
        userId: currentUser?.id,
        username: currentUser?.username
      }
    });
    
    const { users, plans } = response.data;
    const container = document.getElementById('revenue-plan-content');
    
    if (!users || users.length === 0) {
      container.innerHTML = '<div class="text-center py-8 text-gray-500">Không có dữ liệu</div>';
      return;
    }
    
    // Group plans by user and month
    const userPlans = {};
    plans.forEach(p => {
      if (!userPlans[p.user_id]) userPlans[p.user_id] = {};
      userPlans[p.user_id][p.month] = p.planned_revenue;
    });
    
    let html = '<div class="overflow-x-auto">';
    html += '<table class="w-full text-sm border-collapse">';
    
    // Header
    html += '<thead class="bg-gradient-to-r from-green-500 to-teal-600 text-white sticky top-0">';
    html += '<tr>';
    html += '<th class="border px-3 py-2 text-left sticky left-0 bg-green-600 z-10">Họ và tên</th>';
    html += '<th class="border px-3 py-2 text-left">Khu vực</th>';
    html += '<th class="border px-3 py-2 text-left">Vị trí</th>';
    
    // 12 months
    for (let m = 1; m <= 12; m++) {
      html += `<th class="border px-2 py-2 text-center">T${m}</th>`;
    }
    
    html += '<th class="border px-3 py-2 text-center bg-yellow-500 text-white font-bold">Tổng</th>';
    html += '<th class="border px-3 py-2 text-center">Thao tác</th>';
    html += '</tr>';
    html += '</thead>';
    
    // Body
    html += '<tbody>';
    users.forEach((user, idx) => {
      html += `<tr class="${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-green-50">`;
      html += `<td class="border px-3 py-2 font-semibold sticky left-0 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} z-5">${user.full_name}</td>`;
      html += `<td class="border px-3 py-2 text-xs">${user.region_name}</td>`;
      html += `<td class="border px-3 py-2 text-xs">${user.position_name}</td>`;
      
      // 12 months input
      for (let m = 1; m <= 12; m++) {
        const value = userPlans[user.id]?.[m] || '';
        html += `<td class="border px-2 py-2">
          <input 
            type="number" 
            step="0.1"
            placeholder="0"
            value="${value}"
            data-user="${user.id}"
            data-month="${m}"
            class="w-16 px-1 py-1 text-center border rounded focus:ring-2 focus:ring-green-500"
            oninput="calculateRowTotal(${user.id})"
          >
        </td>`;
      }
      
      // Total column
      let total = 0;
      for (let m = 1; m <= 12; m++) {
        total += parseFloat(userPlans[user.id]?.[m] || 0);
      }
      html += `<td class="border px-3 py-2 text-center bg-yellow-50 font-bold text-green-700" id="total-${user.id}">
        ${formatLargeNumber(total)}
      </td>`;
      
      html += `<td class="border px-3 py-2 text-center">
        <button 
          onclick="saveUserPlan(${user.id})"
          class="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs"
        >
          <i class="fas fa-save mr-1"></i>Lưu
        </button>
      </td>`;
      html += '</tr>';
    });
    html += '</tbody>';
    html += '</table>';
    html += '</div>';
    
    // Bulk save button
    html += `
      <div class="mt-6 flex justify-end">
        <button 
          onclick="saveAllPlans()"
          class="px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg font-semibold hover:shadow-lg"
        >
          <i class="fas fa-save mr-2"></i>Lưu tất cả kế hoạch
        </button>
      </div>
    `;
    
    container.innerHTML = html;
  } catch (error) {
    console.error('Error loading revenue plan:', error);
    document.getElementById('revenue-plan-content').innerHTML = 
      '<div class="text-center py-8 text-red-500">Lỗi tải dữ liệu</div>';
  }
}

async function saveUserPlan(userId) {
  try {
    const year = document.getElementById('plan-year')?.value || '2026';
    const inputs = document.querySelectorAll(`input[data-user="${userId}"]`);
    
    const plans = [];
    inputs.forEach(input => {
      const month = parseInt(input.dataset.month);
      const value = parseFloat(input.value) || 0;
      plans.push({ month, planned_revenue: value });
    });
    
    await axios.post('/api/admin/revenue-plan', {
      user_id: userId,
      year: parseInt(year),
      plans
    });
    
    alert('✅ Lưu kế hoạch thành công!');
  } catch (error) {
    console.error('Error saving plan:', error);
    alert('❌ Lỗi lưu kế hoạch: ' + (error.response?.data?.error || error.message));
  }
}

async function saveAllPlans() {
  try {
    const year = document.getElementById('plan-year')?.value || '2026';
    const inputs = document.querySelectorAll('input[data-user][data-month]');
    
    const allPlans = {};
    inputs.forEach(input => {
      const userId = parseInt(input.dataset.user);
      const month = parseInt(input.dataset.month);
      const value = parseFloat(input.value) || 0;
      
      if (!allPlans[userId]) allPlans[userId] = [];
      allPlans[userId].push({ month, planned_revenue: value });
    });
    
    for (const [userId, plans] of Object.entries(allPlans)) {
      await axios.post('/api/admin/revenue-plan', {
        user_id: parseInt(userId),
        year: parseInt(year),
        plans
      });
    }
    
    alert('✅ Lưu tất cả kế hoạch thành công!');
    loadRevenuePlan();
  } catch (error) {
    console.error('Error saving all plans:', error);
    alert('❌ Lỗi lưu kế hoạch: ' + (error.response?.data?.error || error.message));
  }
}

// Calculate row total
function calculateRowTotal(userId) {
  const inputs = document.querySelectorAll(`input[data-user="${userId}"]`);
  let total = 0;
  inputs.forEach(input => {
    total += parseFloat(input.value) || 0;
  });
  
  const totalCell = document.getElementById(`total-${userId}`);
  if (totalCell) {
    totalCell.textContent = formatLargeNumber(total);
  }
}

// Export revenue plan template
async function exportRevenuePlanTemplate() {
  try {
    const year = document.getElementById('plan-year')?.value || '2026';
    const response = await axios.get(`/api/admin/revenue-plan/${year}`, {
      params: {
        userId: currentUser?.id,
        username: currentUser?.username
      }
    });
    
    const { users, plans } = response.data;
    
    // Group plans by user
    const userPlans = {};
    plans.forEach(p => {
      if (!userPlans[p.user_id]) userPlans[p.user_id] = {};
      userPlans[p.user_id][p.month] = p.planned_revenue;
    });
    
    // Create Excel workbook
    const wb = XLSX.utils.book_new();
    
    // Prepare data
    const data = [];
    
    // Header row
    const header = ['STT', 'User ID', 'Họ và tên', 'Khu vực', 'Vị trí'];
    for (let m = 1; m <= 12; m++) {
      header.push(`T${m} (Tỷ VNĐ)`);
    }
    header.push('Tổng');
    data.push(header);
    
    // Data rows
    users.forEach((user, idx) => {
      const row = [
        idx + 1,
        user.id,
        user.full_name,
        user.region_name,
        user.position_name
      ];
      
      let total = 0;
      for (let m = 1; m <= 12; m++) {
        const value = userPlans[user.id]?.[m] || '';
        row.push(value);
        total += parseFloat(value) || 0;
      }
      
      // Add total with formula (optional, or just the calculated value)
      row.push(total);
      data.push(row);
    });
    
    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(data);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 5 },  // STT
      { wch: 10 }, // User ID
      { wch: 25 }, // Họ và tên
      { wch: 15 }, // Khu vực
      { wch: 20 }, // Vị trí
      ...Array(12).fill({ wch: 10 }), // T1-T12
      { wch: 12 }  // Tổng
    ];
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Kế hoạch Doanh thu');
    
    // Generate and download
    XLSX.writeFile(wb, `Ke_Hoach_Doanh_Thu_${year}.xlsx`);
    
    alert('✅ Tải file mẫu Excel thành công!');
  } catch (error) {
    console.error('Error exporting template:', error);
    alert('❌ Lỗi tải file: ' + (error.response?.data?.error || error.message));
  }
}

// Import revenue plan from file
async function importRevenuePlan(event) {
  try {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      
      // Get first sheet
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON (array of arrays)
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // Skip header row
      const dataRows = jsonData.slice(1);
      
      const year = document.getElementById('plan-year')?.value || '2026';
      
      for (const row of dataRows) {
        if (!row || row.length < 17) continue;
        
        const userId = parseInt(row[1]);
        if (!userId) continue;
        
        const plans = [];
        for (let m = 0; m < 12; m++) {
          const value = parseFloat(row[5 + m]) || 0;
          plans.push({ month: m + 1, planned_revenue: value });
        }
        
        await axios.post('/api/admin/revenue-plan', {
          user_id: userId,
          year: parseInt(year),
          plans
        });
      }
      
      alert('✅ Import dữ liệu từ Excel thành công!');
      loadRevenuePlan();
    };
    
    reader.readAsArrayBuffer(file);
    
    // Reset file input
    event.target.value = '';
  } catch (error) {
    console.error('Error importing file:', error);
    alert('❌ Lỗi import file: ' + (error.response?.data?.error || error.message));
  }
}
// Change Password Modal
function showChangePasswordModal() {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="bg-white rounded-xl p-6 max-w-md w-full mx-4">
      <h3 class="text-xl font-bold mb-4">Đổi mật khẩu</h3>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-semibold mb-1">Mật khẩu cũ</label>
          <input type="password" id="old-password" class="w-full px-3 py-2 border rounded-lg" />
        </div>
        <div>
          <label class="block text-sm font-semibold mb-1">Mật khẩu mới (≥6 ký tự)</label>
          <input type="password" id="new-password" class="w-full px-3 py-2 border rounded-lg" />
        </div>
        <div>
          <label class="block text-sm font-semibold mb-1">Nhập lại mật khẩu mới</label>
          <input type="password" id="confirm-password" class="w-full px-3 py-2 border rounded-lg" />
        </div>
        <div id="password-message"></div>
        <div class="flex space-x-2">
          <button onclick="submitChangePassword()" class="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
            Đổi mật khẩu
          </button>
          <button onclick="this.closest('.fixed').remove()" class="flex-1 bg-gray-300 py-2 rounded-lg hover:bg-gray-400">
            Hủy
          </button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

async function submitChangePassword() {
  const oldPwd = document.getElementById('old-password').value;
  const newPwd = document.getElementById('new-password').value;
  const confirmPwd = document.getElementById('confirm-password').value;
  const msgDiv = document.getElementById('password-message');
  
  if (!oldPwd || !newPwd || !confirmPwd) {
    msgDiv.innerHTML = '<p class="text-red-600 text-sm">Vui lòng điền đầy đủ thông tin</p>';
    return;
  }
  
  if (newPwd.length < 6) {
    msgDiv.innerHTML = '<p class="text-red-600 text-sm">Mật khẩu mới phải có ít nhất 6 ký tự</p>';
    return;
  }
  
  if (newPwd !== confirmPwd) {
    msgDiv.innerHTML = '<p class="text-red-600 text-sm">Mật khẩu mới không khớp</p>';
    return;
  }
  
  try {
    const response = await fetch('/api/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.id,
        oldPassword: oldPwd,
        newPassword: newPwd
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      msgDiv.innerHTML = '<p class="text-green-600 text-sm">✓ Đổi mật khẩu thành công!</p>';
      setTimeout(() => document.querySelector('.fixed').remove(), 1500);
    } else {
      msgDiv.innerHTML = `<p class="text-red-600 text-sm">${data.error}</p>`;
    }
  } catch (error) {
    msgDiv.innerHTML = '<p class="text-red-600 text-sm">Lỗi kết nối</p>';
  }
}

// Lock Month Management for Admin
function renderLockMonthTab(container) {
  container.innerHTML = `
    <div class="bg-white rounded-xl shadow-xl p-6">
      <h3 class="text-2xl font-bold mb-4">
        <i class="fas fa-lock mr-2"></i>Quản lý Khóa tháng KPI/Level
      </h3>
      <div class="mb-4 flex space-x-2">
        <select id="lock-year" class="px-4 py-2 border rounded-lg">
          <option value="2026" selected>2026</option>
        </select>
        <button onclick="loadLockMonths()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <i class="fas fa-sync mr-2"></i>Tải dữ liệu
        </button>
      </div>
      <div id="lock-month-content">Đang tải...</div>
    </div>
  `;
  setTimeout(() => loadLockMonths(), 100);
}

async function loadLockMonths() {
  const year = document.getElementById('lock-year').value;
  const content = document.getElementById('lock-month-content');
  
  try {
    const response = await fetch(`/api/admin/locked-months/${year}`);
    const data = await response.json();
    
    const positions = [
      { id: 1, name: 'PTGĐ' },
      { id: 5, name: 'GĐKDCC' },
      { id: 2, name: 'GĐKD' },
      { id: 3, name: 'TLKD' },
      { id: 4, name: 'Giám sát' }
    ];
    
    let html = '<div class="overflow-x-auto"><table class="w-full"><thead class="bg-gray-100"><tr>';
    html += '<th class="px-4 py-2 text-left">Tháng</th>';
    positions.forEach(p => html += `<th class="px-4 py-2 text-center">${p.name}</th>`);
    html += '</tr></thead><tbody>';
    
    for (let month = 1; month <= 12; month++) {
      html += `<tr class="border-b"><td class="px-4 py-2 font-semibold">Tháng ${month}</td>`;
      
      for (const pos of positions) {
        const lock = data.locks.find(l => l.month === month && l.position_id === pos.id);
        if (lock) {
          html += `<td class="px-4 py-2 text-center">
            <span class="inline-block px-2 py-1 bg-red-100 text-red-600 rounded text-xs">
              <i class="fas fa-lock"></i> Đã khóa
            </span>
            <button onclick="unlockMonth(${year}, ${month}, ${pos.id})" 
              class="ml-1 text-xs text-blue-600 hover:underline">Mở</button>
          </td>`;
        } else {
          html += `<td class="px-4 py-2 text-center">
            <button onclick="lockMonth(${year}, ${month}, ${pos.id})" 
              class="px-2 py-1 bg-green-100 text-green-600 rounded text-xs hover:bg-green-200">
              <i class="fas fa-check"></i> Duyệt
            </button>
          </td>`;
        }
      }
      html += '</tr>';
    }
    
    html += '</tbody></table></div>';
    content.innerHTML = html;
  } catch (error) {
    content.innerHTML = '<p class="text-red-600">Lỗi tải dữ liệu</p>';
  }
}

async function lockMonth(year, month, positionId) {
  if (!confirm(`Duyệt và khóa tháng ${month}/${year}?\nSau khi khóa, user không thể sửa KPI/Level!`)) return;
  
  try {
    const response = await fetch('/api/admin/lock-month', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        year, month, positionId,
        userId: currentUser.id
      })
    });
    
    const data = await response.json();
    if (response.ok) {
      alert(data.message);
      loadLockMonths();
    } else {
      alert('Lỗi: ' + data.error);
    }
  } catch (error) {
    alert('Lỗi kết nối');
  }
}

async function unlockMonth(year, month, positionId) {
  if (!confirm(`Mở khóa tháng ${month}/${year}?\nUser sẽ có thể sửa lại KPI/Level!`)) return;
  
  try {
    const response = await fetch('/api/admin/unlock-month', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year, month, positionId })
    });
    
    const data = await response.json();
    if (response.ok) {
      alert(data.message);
      loadLockMonths();
    } else {
      alert('Lỗi: ' + data.error);
    }
  } catch (error) {
    alert('Lỗi kết nối');
  }
}
