// 글로벌 변수
let map;
let currentUser = { id: 1 }; // 임시 사용자 ID (실제 구현에서는 인증 시스템 필요)
let allActivities = [];
let allOrganizations = [];
let activityMarkers = [];
let organizationMarkers = [];

// DOM 요소들
const tabs = {
    map: document.getElementById('mapTab'),
    activities: document.getElementById('activitiesTab'),
    badges: document.getElementById('badgesTab'),
    profile: document.getElementById('profileTab')
};

const sections = {
    map: document.getElementById('mapSection'),
    activities: document.getElementById('activitiesSection'),
    badges: document.getElementById('badgesSection'),
    profile: document.getElementById('profileSection')
};

// 페이지 초기화
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// 앱 초기화
async function initializeApp() {
    try {
        await loadStats();
        initializeMap();
        await loadMapData();
        setupTabNavigation();
        setupActivityModal();
        await loadActivities();
        await loadBadges();
        await loadUserProfile();
    } catch (error) {
        console.error('앱 초기화 실패:', error);
        showNotification('앱 로딩 중 오류가 발생했습니다.', 'error');
    }
}

// 통계 데이터 로드
async function loadStats() {
    try {
        const response = await axios.get('/api/stats');
        const stats = response.data.stats;
        
        document.getElementById('totalUsers').textContent = stats.totalUsers;
        document.getElementById('totalActivities').textContent = stats.totalActivities;
        document.getElementById('totalHours').textContent = stats.totalHours + 'h';
        
        // 뱃지 수는 나중에 사용자별로 계산
        document.getElementById('totalBadges').textContent = '-';
    } catch (error) {
        console.error('통계 로딩 실패:', error);
    }
}

// 지도 초기화
function initializeMap() {
    // 서울 중심으로 지도 초기화
    map = L.map('map').setView([37.5665, 126.9780], 11);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    // 카테고리 필터 버튼 이벤트
    document.getElementById('showAll').addEventListener('click', () => filterActivities('all'));
    document.getElementById('showEnvironment').addEventListener('click', () => filterActivities('환경보호'));
    document.getElementById('showEducation').addEventListener('click', () => filterActivities('교육'));
    document.getElementById('showWelfare').addEventListener('click', () => filterActivities('복지'));
    document.getElementById('showCulture').addEventListener('click', () => filterActivities('문화예술'));
}

// 지도 데이터 로드
async function loadMapData() {
    try {
        const response = await axios.get('/api/map-data');
        const data = response.data;
        
        allActivities = data.activities;
        allOrganizations = data.organizations;
        
        displayMapMarkers();
    } catch (error) {
        console.error('지도 데이터 로딩 실패:', error);
    }
}

// 지도 마커 표시
function displayMapMarkers() {
    // 기존 마커 제거
    activityMarkers.forEach(marker => map.removeLayer(marker));
    organizationMarkers.forEach(marker => map.removeLayer(marker));
    activityMarkers = [];
    organizationMarkers = [];
    
    // 봉사활동 마커 추가
    allActivities.forEach(activity => {
        if (activity.latitude && activity.longitude) {
            const icon = getActivityIcon(activity.category);
            const marker = L.marker([activity.latitude, activity.longitude], { icon })
                .addTo(map)
                .bindPopup(createActivityPopup(activity));
            
            activityMarkers.push(marker);
        }
    });
    
    // 기관 마커 추가
    allOrganizations.forEach(org => {
        if (org.latitude && org.longitude) {
            const icon = getOrganizationIcon();
            const marker = L.marker([org.latitude, org.longitude], { icon })
                .addTo(map)
                .bindPopup(createOrganizationPopup(org));
            
            organizationMarkers.push(marker);
        }
    });
}

// 카테고리별 아이콘 생성
function getActivityIcon(category) {
    const colors = {
        '환경보호': '#22c55e',
        '교육': '#eab308',
        '복지': '#8b5cf6',
        '문화예술': '#ec4899',
        '의료': '#ef4444',
        '재해구호': '#f97316'
    };
    
    const color = colors[category] || '#3b82f6';
    
    return L.divIcon({
        html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>`,
        iconSize: [20, 20],
        className: 'custom-div-icon'
    });
}

// 기관 아이콘 생성
function getOrganizationIcon() {
    return L.divIcon({
        html: '<div style="background-color: #1f2937; color: white; width: 24px; height: 24px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; box-shadow: 0 1px 3px rgba(0,0,0,0.3);">기</div>',
        iconSize: [24, 24],
        className: 'custom-div-icon'
    });
}

// 활동 팝업 생성
function createActivityPopup(activity) {
    return `
        <div class="p-2">
            <h4 class="font-bold text-sm">${activity.title}</h4>
            <p class="text-xs text-gray-600">${activity.user_name}</p>
            <p class="text-xs"><span class="font-medium">카테고리:</span> ${activity.category}</p>
            <p class="text-xs"><span class="font-medium">시간:</span> ${activity.hours}시간</p>
            <p class="text-xs"><span class="font-medium">날짜:</span> ${activity.activity_date}</p>
            ${activity.organization_name ? `<p class="text-xs"><span class="font-medium">기관:</span> ${activity.organization_name}</p>` : ''}
        </div>
    `;
}

// 기관 팝업 생성
function createOrganizationPopup(org) {
    return `
        <div class="p-2">
            <h4 class="font-bold text-sm">${org.name}</h4>
            <p class="text-xs text-gray-600">${org.category}</p>
            <p class="text-xs"><span class="font-medium">활동 수:</span> ${org.activity_count}회</p>
            ${org.address ? `<p class="text-xs"><span class="font-medium">주소:</span> ${org.address}</p>` : ''}
        </div>
    `;
}

// 활동 필터링
function filterActivities(category) {
    // 모든 마커 제거
    activityMarkers.forEach(marker => map.removeLayer(marker));
    activityMarkers = [];
    
    // 필터된 활동만 표시
    const filteredActivities = category === 'all' 
        ? allActivities 
        : allActivities.filter(activity => activity.category === category);
    
    filteredActivities.forEach(activity => {
        if (activity.latitude && activity.longitude) {
            const icon = getActivityIcon(activity.category);
            const marker = L.marker([activity.latitude, activity.longitude], { icon })
                .addTo(map)
                .bindPopup(createActivityPopup(activity));
            
            activityMarkers.push(marker);
        }
    });
    
    // 버튼 스타일 업데이트
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('filter-active');
    });
    event.target.classList.add('filter-active');
}

// 탭 네비게이션 설정
function setupTabNavigation() {
    Object.keys(tabs).forEach(tabName => {
        tabs[tabName].addEventListener('click', () => switchTab(tabName));
    });
}

// 탭 전환
function switchTab(activeTab) {
    // 모든 탭 버튼 비활성화
    Object.values(tabs).forEach(tab => {
        tab.classList.remove('nav-active');
    });
    
    // 활성 탭 버튼 스타일링
    tabs[activeTab].classList.add('nav-active');
    
    // 모든 섹션 숨기기
    Object.values(sections).forEach(section => {
        section.classList.add('hidden');
    });
    
    // 활성 섹션 표시
    sections[activeTab].classList.remove('hidden');
    sections[activeTab].classList.add('fade-in');
    
    // 지도 탭일 때 지도 크기 재조정
    if (activeTab === 'map') {
        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    }
}

// 활동 목록 로드
async function loadActivities() {
    try {
        const response = await axios.get(`/api/activities?user_id=${currentUser.id}`);
        const activities = response.data.activities;
        
        displayActivities(activities);
    } catch (error) {
        console.error('활동 로딩 실패:', error);
    }
}

// 활동 목록 표시
function displayActivities(activities) {
    const container = document.getElementById('activitiesList');
    
    if (activities.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <div class="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <i class="fas fa-clipboard-list text-2xl text-gray-400"></i>
                </div>
                <p class="text-primary-600 font-medium">등록된 봉사활동이 없습니다</p>
                <p class="text-primary-500 text-sm mt-1">첫 번째 봉사활동을 추가해보세요!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = activities.map(activity => `
        <div class="activity-card">
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <div class="flex items-center mb-3">
                        <div class="w-10 h-10 ${getCategoryColor(activity.category)} rounded-lg flex items-center justify-center mr-3">
                            <i class="${getCategoryIcon(activity.category)} text-white text-sm"></i>
                        </div>
                        <div>
                            <h3 class="font-semibold text-primary-900">${activity.title}</h3>
                            <p class="text-primary-500 text-sm">${activity.activity_date}</p>
                        </div>
                    </div>
                    
                    ${activity.description ? `<p class="text-primary-600 text-sm mb-3 leading-relaxed">${activity.description}</p>` : ''}
                    
                    <div class="flex flex-wrap gap-2 mb-3">
                        <span class="status-badge ${getStatusClass(activity.verification_status)}">${getStatusText(activity.verification_status)}</span>
                        <span class="px-2 py-1 bg-blue-50 text-accent-blue rounded-md text-sm font-medium">
                            <i class="fas fa-clock mr-1"></i>${activity.hours}시간
                        </span>
                    </div>
                    
                    <div class="space-y-1">
                        ${activity.location_name ? `
                            <div class="flex items-center text-primary-500 text-sm">
                                <i class="fas fa-map-marker-alt mr-2 w-4"></i>
                                <span>${activity.location_name}</span>
                            </div>
                        ` : ''}
                        ${activity.organization_name ? `
                            <div class="flex items-center text-primary-500 text-sm">
                                <i class="fas fa-building mr-2 w-4"></i>
                                <span>${activity.organization_name}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="ml-4 flex space-x-2">
                    <button onclick="viewActivityDetail(${activity.id})" class="p-2 text-primary-400 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="editActivity(${activity.id})" class="p-2 text-primary-400 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// 인증 상태 클래스
function getStatusClass(status) {
    switch (status) {
        case 'verified': return 'status-verified';
        case 'pending': return 'status-pending';
        case 'rejected': return 'status-rejected';
        default: return 'status-pending';
    }
}

// 인증 상태 텍스트
function getStatusText(status) {
    switch (status) {
        case 'verified': return '✓ 인증완료';
        case 'pending': return '⏳ 인증대기';
        case 'rejected': return '✗ 인증거부';
        default: return '? 미확인';
    }
}

// 카테고리별 색상
function getCategoryColor(category) {
    switch (category) {
        case '환경보호': return 'bg-green-500';
        case '교육': return 'bg-blue-500';
        case '복지': return 'bg-purple-500';
        case '문화예술': return 'bg-pink-500';
        case '의료': return 'bg-red-500';
        case '재해구호': return 'bg-orange-500';
        default: return 'bg-gray-500';
    }
}

// 카테고리별 아이콘
function getCategoryIcon(category) {
    switch (category) {
        case '환경보호': return 'fas fa-leaf';
        case '교육': return 'fas fa-graduation-cap';
        case '복지': return 'fas fa-heart';
        case '문화예술': return 'fas fa-palette';
        case '의료': return 'fas fa-stethoscope';
        case '재해구호': return 'fas fa-hands-helping';
        default: return 'fas fa-hand-heart';
    }
}

// 활동 추가 모달 설정
function setupActivityModal() {
    const modal = document.getElementById('addActivityModal');
    const addBtn = document.getElementById('addActivityBtn');
    const cancelBtn = document.getElementById('cancelAddActivity');
    const closeBtn = document.getElementById('closeModalBtn');
    const form = document.getElementById('addActivityForm');
    
    function openModal() {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';
        
        // 오늘 날짜를 기본값으로 설정
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('activityDate').value = today;
    }
    
    function closeModal() {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.body.style.overflow = '';
        form.reset();
    }
    
    addBtn.addEventListener('click', openModal);
    cancelBtn.addEventListener('click', closeModal);
    closeBtn.addEventListener('click', closeModal);
    
    // 모달 배경 클릭시 닫기
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // ESC 키로 모달 닫기
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            closeModal();
        }
    });
    
    form.addEventListener('submit', handleAddActivity);
}

// 새 활동 추가 처리
async function handleAddActivity(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const activityData = {
        user_id: currentUser.id,
        title: document.getElementById('activityTitle').value,
        category: document.getElementById('activityCategory').value,
        activity_date: document.getElementById('activityDate').value,
        hours: parseFloat(document.getElementById('activityHours').value),
        location_name: document.getElementById('activityLocation').value,
        description: document.getElementById('activityDescription').value
    };
    
    try {
        await axios.post('/api/activities', activityData);
        
        // 모달 닫기
        document.getElementById('addActivityModal').classList.add('hidden');
        document.getElementById('addActivityModal').classList.remove('flex');
        document.getElementById('addActivityForm').reset();
        
        // 활동 목록 새로고침
        await loadActivities();
        await loadMapData();
        
        showNotification('봉사활동이 성공적으로 등록되었습니다!', 'success');
    } catch (error) {
        console.error('활동 추가 실패:', error);
        showNotification('활동 등록 중 오류가 발생했습니다.', 'error');
    }
}

// 뱃지 목록 로드
async function loadBadges() {
    try {
        const [badgesResponse, userResponse] = await Promise.all([
            axios.get('/api/badges'),
            axios.get(`/api/users/${currentUser.id}`)
        ]);
        
        const allBadges = badgesResponse.data.badges;
        const userBadges = userResponse.data.badges;
        const earnedBadgeIds = userBadges.map(b => b.id);
        
        displayBadges(allBadges, earnedBadgeIds);
        
        // 총 뱃지 수 업데이트
        document.getElementById('totalBadges').textContent = userBadges.length;
    } catch (error) {
        console.error('뱃지 로딩 실패:', error);
    }
}

// 뱃지 목록 표시
function displayBadges(badges, earnedBadgeIds) {
    const container = document.getElementById('badgesList');
    
    container.innerHTML = badges.map(badge => {
        const isEarned = earnedBadgeIds.includes(badge.id);
        
        return `
            <div class="badge-card ${isEarned ? 'earned' : ''}">
                <div class="badge-icon">
                    ${isEarned ? getBadgeIcon(badge.name) : '🔒'}
                </div>
                
                <h3 class="font-bold text-base mb-2 ${isEarned ? 'text-primary-900' : 'text-primary-500'}">
                    ${badge.name}
                </h3>
                
                <p class="text-sm ${isEarned ? 'text-primary-600' : 'text-primary-400'} mb-3 leading-relaxed">
                    ${badge.description}
                </p>
                
                <div class="mb-3">
                    <div class="text-xs font-medium text-primary-500 mb-1">
                        달성 조건
                    </div>
                    <div class="text-sm text-primary-700">
                        ${getRequirementText(badge.requirement_type, badge.requirement_value)}
                    </div>
                </div>
                
                ${isEarned ? `
                    <div class="status-badge status-verified">
                        <i class="fas fa-check-circle mr-1"></i>
                        획득완료
                    </div>
                ` : `
                    <div class="inline-flex items-center px-2 py-1 bg-gray-100 text-primary-500 rounded-full text-xs">
                        <i class="fas fa-lock mr-1"></i>
                        미획득
                    </div>
                `}
            </div>
        `;
    }).join('');
}

// 뱃지별 아이콘
function getBadgeIcon(badgeName) {
    switch (badgeName) {
        case '첫 걸음': return '🥇';
        case '열정가': return '🔥';
        case '헌신자': return '👑';
        case '환경지킴이': return '🌱';
        case '교육봉사자': return '📚';
        case '지역사랑': return '🗺️';
        default: return '🏆';
    }
}

// 뱃지 요구사항 텍스트
function getRequirementText(type, value) {
    switch (type) {
        case 'hours': return `${value}시간 봉사`;
        case 'activities': return `${value}회 활동`;
        case 'locations': return `${value}곳 다른 지역`;
        case 'categories': return `${value}개 다른 분야`;
        default: return `요구사항: ${value}`;
    }
}

// 사용자 프로필 로드
async function loadUserProfile() {
    try {
        const response = await axios.get(`/api/users/${currentUser.id}`);
        const userData = response.data;
        
        displayUserProfile(userData.user, userData.badges);
    } catch (error) {
        console.error('프로필 로딩 실패:', error);
    }
}

// 사용자 프로필 표시
function displayUserProfile(user, badges) {
    const container = document.getElementById('profileContent');
    
    const progressToNextLevel = (user.experience_points % 100);
    
    container.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- 기본 정보 -->
            <div class="space-y-6">
                <!-- 프로필 헤더 -->
                <div class="profile-card">
                    <div class="flex items-center space-x-4 mb-6">
                        <div class="relative">
                            <div class="w-20 h-20 bg-accent-blue rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                                ${user.name.charAt(0)}
                            </div>
                            <div class="absolute -bottom-1 -right-1 w-6 h-6 bg-accent-emerald rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white">
                                ${user.level}
                            </div>
                        </div>
                        <div class="flex-1">
                            <h3 class="text-xl font-bold text-primary-900 mb-1">${user.name}</h3>
                            <p class="text-primary-500 mb-2">${user.email}</p>
                            <div class="flex items-center space-x-3">
                                <span class="px-2 py-1 bg-blue-50 text-accent-blue rounded-full text-sm font-medium">
                                    <i class="fas fa-star mr-1"></i>레벨 ${user.level}
                                </span>
                                <span class="text-sm text-primary-500">${user.experience_points} XP</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 경험치 진행률 -->
                    <div>
                        <div class="flex justify-between text-sm text-primary-500 mb-2">
                            <span>다음 레벨까지</span>
                            <span>${progressToNextLevel}/100 XP</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progressToNextLevel}%"></div>
                        </div>
                    </div>
                </div>
                
                <!-- 통계 카드들 -->
                <div class="grid grid-cols-2 gap-4">
                    <div class="stat-card">
                        <div class="text-center">
                            <div class="stat-icon bg-accent-emerald mx-auto mb-3">
                                <i class="fas fa-clock text-white"></i>
                            </div>
                            <div class="text-2xl font-bold text-primary-900 mb-1">${user.total_hours || 0}</div>
                            <div class="text-sm text-primary-500">총 봉사시간</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="text-center">
                            <div class="stat-icon bg-accent-blue mx-auto mb-3">
                                <i class="fas fa-hands-helping text-white"></i>
                            </div>
                            <div class="text-2xl font-bold text-primary-900 mb-1">${user.total_activities || 0}</div>
                            <div class="text-sm text-primary-500">총 활동수</div>
                        </div>
                    </div>
                </div>
                
                <!-- 인증서 발급 버튼 -->
                <button onclick="generateCertificate()" class="btn-primary w-full">
                    <i class="fas fa-certificate mr-2"></i>
                    봉사활동 인증서 발급
                </button>
            </div>
            
            <!-- 획득한 뱃지 -->
            <div class="profile-card">
                <div class="flex items-center justify-between mb-4">
                    <h4 class="text-lg font-bold text-primary-900">획득한 뱃지</h4>
                    <span class="px-2 py-1 bg-amber-50 text-accent-amber rounded-full text-sm font-bold">
                        ${badges.length}개
                    </span>
                </div>
                
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    ${badges.length > 0 ? badges.map(badge => `
                        <div class="badge-card earned">
                            <div class="text-xl mb-2">${getBadgeIcon(badge.name)}</div>
                            <div class="text-sm font-bold text-primary-900 mb-1">${badge.name}</div>
                            <div class="text-xs text-primary-500">
                                ${new Date(badge.earned_at).toLocaleDateString('ko-KR')}
                            </div>
                        </div>
                    `).join('') : `
                        <div class="col-span-2 sm:col-span-3 text-center py-6">
                            <div class="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                                <i class="fas fa-medal text-xl text-gray-400"></i>
                            </div>
                            <p class="text-primary-600 text-sm">아직 획득한 뱃지가 없습니다</p>
                            <p class="text-primary-400 text-xs mt-1">봉사활동을 통해 뱃지를 획득해보세요!</p>
                        </div>
                    `}
                </div>
            </div>
        </div>
    `;
}

// PDF 인증서 생성
async function generateCertificate() {
    try {
        const response = await axios.get(`/api/certificate/${currentUser.id}`);
        const data = response.data;
        
        // jsPDF 사용하여 PDF 생성
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // 한글 폰트 문제로 영어로 작성 (실제 구현시 한글 폰트 필요)
        doc.setFontSize(20);
        doc.text('Volunteer Activity Certificate', 70, 30);
        
        doc.setFontSize(14);
        doc.text(`This certifies that ${data.certificateData.name}`, 50, 60);
        doc.text(`has completed ${data.certificateData.totalHours} hours of volunteer service`, 40, 80);
        doc.text(`across ${data.certificateData.totalActivities} volunteer activities.`, 60, 100);
        
        doc.text(`Level: ${data.certificateData.level}`, 50, 130);
        doc.text(`Issue Date: ${data.certificateData.issueDate}`, 50, 150);
        
        doc.text('Social Impact Map Platform', 70, 180);
        
        // PDF 다운로드
        doc.save(`volunteer_certificate_${data.user.name}.pdf`);
        
        showNotification('인증서가 성공적으로 생성되었습니다!', 'success');
    } catch (error) {
        console.error('인증서 생성 실패:', error);
        showNotification('인증서 생성 중 오류가 발생했습니다.', 'error');
    }
}

// 알림 표시
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    
    const iconMap = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        info: 'fas fa-info-circle',
        warning: 'fas fa-exclamation-triangle'
    };
    
    notification.className = `notification ${type} fixed top-4 right-4 z-50 transform translate-x-full transition-transform duration-300 ease-out`;
    
    notification.innerHTML = `
        <div class="flex items-center space-x-3">
            <div class="flex-shrink-0">
                <i class="${iconMap[type]}"></i>
            </div>
            <div class="flex-1">
                <p class="font-medium text-sm">${message}</p>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" class="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // 애니메이션 효과
    requestAnimationFrame(() => {
        notification.classList.remove('translate-x-full');
        notification.classList.add('translate-x-0');
    });
    
    // 자동 제거
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

// 활동 상세보기
function viewActivityDetail(activityId) {
    showNotification('활동 상세보기를 준비 중입니다...', 'info');
}

// 활동 편집
function editActivity(activityId) {
    showNotification('활동 편집 기능을 준비 중입니다...', 'info');
}

// 통계 카운터 애니메이션
function animateCounter(element, targetValue, duration = 1000) {
    const startValue = 0;
    const startTime = Date.now();
    
    function updateCounter() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // easeOutCubic 함수
        const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
        const currentValue = Math.floor(startValue + (targetValue - startValue) * easeOutCubic(progress));
        
        if (element.id === 'totalHours') {
            element.textContent = currentValue + 'h';
        } else {
            element.textContent = currentValue;
        }
        
        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        }
    }
    
    updateCounter();
}

// 통계 업데이트 시 애니메이션 적용
const originalLoadStats = loadStats;
loadStats = async function() {
    try {
        const response = await axios.get('/api/stats');
        const stats = response.data.stats;
        
        // 애니메이션과 함께 업데이트
        setTimeout(() => animateCounter(document.getElementById('totalUsers'), stats.totalUsers), 100);
        setTimeout(() => animateCounter(document.getElementById('totalActivities'), stats.totalActivities), 200);
        setTimeout(() => animateCounter(document.getElementById('totalHours'), stats.totalHours), 300);
        
        // 뱃지 수는 나중에 사용자별로 계산
        document.getElementById('totalBadges').textContent = '-';
    } catch (error) {
        console.error('통계 로딩 실패:', error);
    }
}