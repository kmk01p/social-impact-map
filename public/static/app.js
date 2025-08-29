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
    document.querySelectorAll('[id^="show"]').forEach(btn => {
        btn.classList.remove('ring-2', 'ring-blue-300');
    });
    event.target.classList.add('ring-2', 'ring-blue-300');
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
        tab.classList.remove('bg-blue-500');
        tab.classList.add('hover:bg-blue-500');
    });
    
    // 활성 탭 버튼 스타일링
    tabs[activeTab].classList.add('bg-blue-500');
    tabs[activeTab].classList.remove('hover:bg-blue-500');
    
    // 모든 섹션 숨기기
    Object.values(sections).forEach(section => {
        section.classList.add('hidden');
    });
    
    // 활성 섹션 표시
    sections[activeTab].classList.remove('hidden');
    
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
        container.innerHTML = '<p class="text-gray-500 text-center py-8">등록된 봉사활동이 없습니다.</p>';
        return;
    }
    
    container.innerHTML = activities.map(activity => `
        <div class="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <h3 class="font-semibold text-lg">${activity.title}</h3>
                    <p class="text-gray-600 text-sm mb-2">${activity.description || ''}</p>
                    <div class="flex flex-wrap gap-2 text-sm">
                        <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded">${activity.category}</span>
                        <span class="px-2 py-1 bg-green-100 text-green-800 rounded">${activity.hours}시간</span>
                        <span class="px-2 py-1 bg-gray-100 text-gray-800 rounded">${activity.activity_date}</span>
                        <span class="px-2 py-1 ${getStatusColor(activity.verification_status)} rounded">${getStatusText(activity.verification_status)}</span>
                    </div>
                    ${activity.location_name ? `<p class="text-gray-500 text-sm mt-1"><i class="fas fa-map-marker-alt mr-1"></i>${activity.location_name}</p>` : ''}
                    ${activity.organization_name ? `<p class="text-gray-500 text-sm"><i class="fas fa-building mr-1"></i>${activity.organization_name}</p>` : ''}
                </div>
                <div class="ml-4">
                    <button onclick="viewActivityDetail(${activity.id})" class="text-blue-500 hover:text-blue-700">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// 인증 상태 색상
function getStatusColor(status) {
    switch (status) {
        case 'verified': return 'bg-green-100 text-green-800';
        case 'pending': return 'bg-yellow-100 text-yellow-800';
        case 'rejected': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

// 인증 상태 텍스트
function getStatusText(status) {
    switch (status) {
        case 'verified': return '인증완료';
        case 'pending': return '인증대기';
        case 'rejected': return '인증거부';
        default: return '미확인';
    }
}

// 활동 추가 모달 설정
function setupActivityModal() {
    const modal = document.getElementById('addActivityModal');
    const addBtn = document.getElementById('addActivityBtn');
    const cancelBtn = document.getElementById('cancelAddActivity');
    const form = document.getElementById('addActivityForm');
    
    addBtn.addEventListener('click', () => {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    });
    
    cancelBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        form.reset();
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
            <div class="p-4 border rounded-lg text-center ${isEarned ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'}">
                <div class="text-3xl mb-2">${isEarned ? '🏆' : '🔒'}</div>
                <h3 class="font-semibold ${isEarned ? 'text-yellow-800' : 'text-gray-500'}">${badge.name}</h3>
                <p class="text-sm ${isEarned ? 'text-yellow-600' : 'text-gray-400'} mt-1">${badge.description}</p>
                <p class="text-xs ${isEarned ? 'text-yellow-500' : 'text-gray-400'} mt-2">
                    ${getRequirementText(badge.requirement_type, badge.requirement_value)}
                </p>
                ${isEarned ? '<p class="text-xs text-green-600 mt-1">✅ 획득완료</p>' : '<p class="text-xs text-gray-400 mt-1">미획득</p>'}
            </div>
        `;
    }).join('');
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
    
    container.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- 기본 정보 -->
            <div class="space-y-4">
                <div class="flex items-center space-x-4">
                    <div class="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                        ${user.name.charAt(0)}
                    </div>
                    <div>
                        <h3 class="text-2xl font-bold">${user.name}</h3>
                        <p class="text-gray-600">${user.email}</p>
                        <p class="text-sm text-blue-600 font-medium">레벨 ${user.level} (${user.experience_points} XP)</p>
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div class="bg-blue-50 p-4 rounded-lg text-center">
                        <div class="text-2xl font-bold text-blue-600">${user.total_hours || 0}</div>
                        <div class="text-sm text-blue-500">총 봉사시간</div>
                    </div>
                    <div class="bg-green-50 p-4 rounded-lg text-center">
                        <div class="text-2xl font-bold text-green-600">${user.total_activities || 0}</div>
                        <div class="text-sm text-green-500">총 활동수</div>
                    </div>
                </div>
                
                <button onclick="generateCertificate()" class="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors">
                    <i class="fas fa-certificate mr-2"></i>
                    봉사활동 인증서 발급
                </button>
            </div>
            
            <!-- 획득한 뱃지 -->
            <div>
                <h4 class="text-xl font-bold mb-4">획득한 뱃지 (${badges.length}개)</h4>
                <div class="grid grid-cols-3 gap-3">
                    ${badges.length > 0 ? badges.map(badge => `
                        <div class="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                            <div class="text-2xl mb-1">🏆</div>
                            <div class="text-xs font-medium text-yellow-800">${badge.name}</div>
                            <div class="text-xs text-yellow-600">${new Date(badge.earned_at).toLocaleDateString()}</div>
                        </div>
                    `).join('') : '<p class="text-gray-500 text-sm col-span-3 text-center py-4">아직 획득한 뱃지가 없습니다.</p>'}
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
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
        type === 'success' ? 'bg-green-500 text-white' :
        type === 'error' ? 'bg-red-500 text-white' :
        'bg-blue-500 text-white'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// 활동 상세보기 (향후 구현)
function viewActivityDetail(activityId) {
    showNotification('활동 상세보기 기능은 향후 구현됩니다.', 'info');
}