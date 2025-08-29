import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

type Bindings = {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Bindings }>()

// CORS 설정
app.use('/api/*', cors())

// 정적 파일 서빙
app.use('/static/*', serveStatic({ root: './public' }))

// 사용자 관련 API
app.get('/api/users', async (c) => {
  const { DB } = c.env;
  
  try {
    const result = await DB.prepare(`
      SELECT u.*, 
             COUNT(va.id) as total_activities,
             COALESCE(SUM(va.hours), 0) as total_hours
      FROM users u
      LEFT JOIN volunteer_activities va ON u.id = va.user_id AND va.verification_status = 'verified'
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `).all();
    
    return c.json({ users: result.results });
  } catch (error) {
    console.error('Error fetching users:', error);
    return c.json({ error: 'Failed to fetch users' }, 500);
  }
});

app.get('/api/users/:id', async (c) => {
  const { DB } = c.env;
  const userId = c.req.param('id');
  
  try {
    const user = await DB.prepare(`
      SELECT u.*, 
             COUNT(va.id) as total_activities,
             COALESCE(SUM(va.hours), 0) as total_hours
      FROM users u
      LEFT JOIN volunteer_activities va ON u.id = va.user_id AND va.verification_status = 'verified'
      WHERE u.id = ?
      GROUP BY u.id
    `).bind(userId).first();
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    // 사용자 뱃지 조회
    const badges = await DB.prepare(`
      SELECT b.*, ub.earned_at
      FROM badges b
      JOIN user_badges ub ON b.id = ub.badge_id
      WHERE ub.user_id = ?
      ORDER BY ub.earned_at DESC
    `).bind(userId).all();
    
    return c.json({ 
      user, 
      badges: badges.results 
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return c.json({ error: 'Failed to fetch user' }, 500);
  }
});

// 봉사활동 관련 API
app.get('/api/activities', async (c) => {
  const { DB } = c.env;
  const userId = c.req.query('user_id');
  
  try {
    let query = `
      SELECT va.*, u.name as user_name, o.name as organization_name
      FROM volunteer_activities va
      JOIN users u ON va.user_id = u.id
      LEFT JOIN organizations o ON va.organization_id = o.id
    `;
    
    const params = [];
    if (userId) {
      query += ' WHERE va.user_id = ?';
      params.push(userId);
    }
    
    query += ' ORDER BY va.activity_date DESC, va.created_at DESC';
    
    const result = await DB.prepare(query).bind(...params).all();
    
    return c.json({ activities: result.results });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return c.json({ error: 'Failed to fetch activities' }, 500);
  }
});

app.post('/api/activities', async (c) => {
  const { DB } = c.env;
  
  try {
    const body = await c.req.json();
    const {
      user_id,
      organization_id,
      title,
      description,
      category,
      activity_date,
      start_time,
      end_time,
      hours,
      location_name,
      latitude,
      longitude,
      notes
    } = body;
    
    const result = await DB.prepare(`
      INSERT INTO volunteer_activities 
      (user_id, organization_id, title, description, category, activity_date, 
       start_time, end_time, hours, location_name, latitude, longitude, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      user_id, organization_id, title, description, category, activity_date,
      start_time, end_time, hours, location_name, latitude, longitude, notes
    ).run();
    
    return c.json({ 
      id: result.meta.last_row_id,
      message: 'Activity created successfully' 
    });
  } catch (error) {
    console.error('Error creating activity:', error);
    return c.json({ error: 'Failed to create activity' }, 500);
  }
});

app.put('/api/activities/:id/verify', async (c) => {
  const { DB } = c.env;
  const activityId = c.req.param('id');
  const { status } = await c.req.json();
  
  try {
    await DB.prepare(`
      UPDATE volunteer_activities 
      SET verification_status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(status, activityId).run();
    
    // 활동이 승인되면 사용자의 총 봉사시간 업데이트
    if (status === 'verified') {
      await DB.prepare(`
        UPDATE users 
        SET total_volunteer_hours = (
          SELECT COALESCE(SUM(hours), 0)
          FROM volunteer_activities 
          WHERE user_id = (SELECT user_id FROM volunteer_activities WHERE id = ?) 
          AND verification_status = 'verified'
        ),
        experience_points = total_volunteer_hours * 10
        WHERE id = (SELECT user_id FROM volunteer_activities WHERE id = ?)
      `).bind(activityId, activityId).run();
    }
    
    return c.json({ message: 'Activity verification updated' });
  } catch (error) {
    console.error('Error updating verification:', error);
    return c.json({ error: 'Failed to update verification' }, 500);
  }
});

// 기관 관련 API
app.get('/api/organizations', async (c) => {
  const { DB } = c.env;
  
  try {
    const result = await DB.prepare(`
      SELECT o.*, 
             COUNT(va.id) as activity_count,
             COALESCE(SUM(va.hours), 0) as total_volunteer_hours
      FROM organizations o
      LEFT JOIN volunteer_activities va ON o.id = va.organization_id AND va.verification_status = 'verified'
      GROUP BY o.id
      ORDER BY o.name
    `).all();
    
    return c.json({ organizations: result.results });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return c.json({ error: 'Failed to fetch organizations' }, 500);
  }
});

// 뱃지 관련 API
app.get('/api/badges', async (c) => {
  const { DB } = c.env;
  
  try {
    const result = await DB.prepare(`
      SELECT b.*, COUNT(ub.user_id) as earned_count
      FROM badges b
      LEFT JOIN user_badges ub ON b.id = ub.badge_id
      GROUP BY b.id
      ORDER BY b.requirement_value
    `).all();
    
    return c.json({ badges: result.results });
  } catch (error) {
    console.error('Error fetching badges:', error);
    return c.json({ error: 'Failed to fetch badges' }, 500);
  }
});

// 통계 API
app.get('/api/stats', async (c) => {
  const { DB } = c.env;
  
  try {
    const stats = {};
    
    // 총 사용자 수
    const userCount = await DB.prepare('SELECT COUNT(*) as count FROM users').first();
    stats.totalUsers = userCount.count;
    
    // 총 봉사활동 수
    const activityCount = await DB.prepare('SELECT COUNT(*) as count FROM volunteer_activities WHERE verification_status = "verified"').first();
    stats.totalActivities = activityCount.count;
    
    // 총 봉사시간
    const totalHours = await DB.prepare('SELECT COALESCE(SUM(hours), 0) as total FROM volunteer_activities WHERE verification_status = "verified"').first();
    stats.totalHours = totalHours.total;
    
    // 카테고리별 통계
    const categoryStats = await DB.prepare(`
      SELECT category, COUNT(*) as count, COALESCE(SUM(hours), 0) as hours
      FROM volunteer_activities 
      WHERE verification_status = 'verified'
      GROUP BY category
      ORDER BY count DESC
    `).all();
    stats.categoryStats = categoryStats.results;
    
    return c.json({ stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return c.json({ error: 'Failed to fetch stats' }, 500);
  }
});

// 지도 데이터 API
app.get('/api/map-data', async (c) => {
  const { DB } = c.env;
  
  try {
    const activities = await DB.prepare(`
      SELECT va.id, va.title, va.category, va.hours, va.location_name, 
             va.latitude, va.longitude, va.activity_date,
             u.name as user_name, o.name as organization_name
      FROM volunteer_activities va
      JOIN users u ON va.user_id = u.id
      LEFT JOIN organizations o ON va.organization_id = o.id
      WHERE va.verification_status = 'verified' 
      AND va.latitude IS NOT NULL 
      AND va.longitude IS NOT NULL
      ORDER BY va.activity_date DESC
    `).all();
    
    const organizations = await DB.prepare(`
      SELECT id, name, category, address, latitude, longitude,
             (SELECT COUNT(*) FROM volunteer_activities WHERE organization_id = organizations.id AND verification_status = 'verified') as activity_count
      FROM organizations 
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND verified = true
    `).all();
    
    return c.json({ 
      activities: activities.results,
      organizations: organizations.results
    });
  } catch (error) {
    console.error('Error fetching map data:', error);
    return c.json({ error: 'Failed to fetch map data' }, 500);
  }
});

// PDF 인증서 생성 API
app.get('/api/certificate/:userId', async (c) => {
  const { DB } = c.env;
  const userId = c.req.param('userId');
  
  try {
    // 사용자 정보 조회
    const user = await DB.prepare(`
      SELECT u.*, 
             COUNT(va.id) as total_activities,
             COALESCE(SUM(va.hours), 0) as total_hours
      FROM users u
      LEFT JOIN volunteer_activities va ON u.id = va.user_id AND va.verification_status = 'verified'
      WHERE u.id = ?
      GROUP BY u.id
    `).bind(userId).first();
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    // 활동 내역 조회
    const activities = await DB.prepare(`
      SELECT va.title, va.category, va.hours, va.activity_date, va.location_name,
             o.name as organization_name
      FROM volunteer_activities va
      LEFT JOIN organizations o ON va.organization_id = o.id
      WHERE va.user_id = ? AND va.verification_status = 'verified'
      ORDER BY va.activity_date DESC
    `).bind(userId).all();
    
    return c.json({
      user,
      activities: activities.results,
      certificateData: {
        name: user.name,
        totalHours: user.total_hours,
        totalActivities: user.total_activities,
        level: user.level,
        issueDate: new Date().toLocaleDateString('ko-KR')
      }
    });
  } catch (error) {
    console.error('Error generating certificate:', error);
    return c.json({ error: 'Failed to generate certificate' }, 500);
  }
});

// 메인 페이지
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>소셜 임팩트 맵 - 봉사 리워드 플랫폼</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
        <link href="/static/style.css" rel="stylesheet">
    </head>
    <body class="bg-gray-100">
        <!-- 네비게이션 -->
        <nav class="bg-blue-600 text-white p-4 shadow-lg">
            <div class="container mx-auto flex justify-between items-center">
                <div class="flex items-center space-x-2">
                    <i class="fas fa-heart text-red-400 text-2xl"></i>
                    <h1 class="text-xl font-bold">소셜 임팩트 맵</h1>
                </div>
                <div class="flex space-x-4">
                    <button id="mapTab" class="px-4 py-2 rounded bg-blue-500 hover:bg-blue-400 transition-colors">
                        <i class="fas fa-map-marked-alt mr-2"></i>지도
                    </button>
                    <button id="activitiesTab" class="px-4 py-2 rounded hover:bg-blue-500 transition-colors">
                        <i class="fas fa-hands-helping mr-2"></i>활동기록
                    </button>
                    <button id="badgesTab" class="px-4 py-2 rounded hover:bg-blue-500 transition-colors">
                        <i class="fas fa-medal mr-2"></i>뱃지
                    </button>
                    <button id="profileTab" class="px-4 py-2 rounded hover:bg-blue-500 transition-colors">
                        <i class="fas fa-user mr-2"></i>프로필
                    </button>
                </div>
            </div>
        </nav>

        <!-- 메인 컨테이너 -->
        <div class="container mx-auto p-4">
            <!-- 대시보드 통계 -->
            <div id="statsSection" class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div class="bg-white p-4 rounded-lg shadow-md">
                    <div class="flex items-center">
                        <i class="fas fa-users text-blue-500 text-2xl mr-3"></i>
                        <div>
                            <div class="text-sm text-gray-500">총 참가자</div>
                            <div id="totalUsers" class="text-2xl font-bold">-</div>
                        </div>
                    </div>
                </div>
                <div class="bg-white p-4 rounded-lg shadow-md">
                    <div class="flex items-center">
                        <i class="fas fa-hands-helping text-green-500 text-2xl mr-3"></i>
                        <div>
                            <div class="text-sm text-gray-500">총 활동</div>
                            <div id="totalActivities" class="text-2xl font-bold">-</div>
                        </div>
                    </div>
                </div>
                <div class="bg-white p-4 rounded-lg shadow-md">
                    <div class="flex items-center">
                        <i class="fas fa-clock text-orange-500 text-2xl mr-3"></i>
                        <div>
                            <div class="text-sm text-gray-500">총 봉사시간</div>
                            <div id="totalHours" class="text-2xl font-bold">-</div>
                        </div>
                    </div>
                </div>
                <div class="bg-white p-4 rounded-lg shadow-md">
                    <div class="flex items-center">
                        <i class="fas fa-medal text-purple-500 text-2xl mr-3"></i>
                        <div>
                            <div class="text-sm text-gray-500">획득 뱃지</div>
                            <div id="totalBadges" class="text-2xl font-bold">-</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 지도 섹션 -->
            <div id="mapSection" class="bg-white rounded-lg shadow-lg p-6 mb-6">
                <h2 class="text-2xl font-bold mb-4 flex items-center">
                    <i class="fas fa-map-marked-alt text-blue-500 mr-2"></i>
                    봉사활동 지도
                </h2>
                <div id="map" class="h-96 rounded-lg border"></div>
                <div class="mt-4 flex flex-wrap gap-2">
                    <button id="showAll" class="px-3 py-1 bg-blue-500 text-white rounded text-sm">전체</button>
                    <button id="showEnvironment" class="px-3 py-1 bg-green-500 text-white rounded text-sm">환경보호</button>
                    <button id="showEducation" class="px-3 py-1 bg-yellow-500 text-white rounded text-sm">교육</button>
                    <button id="showWelfare" class="px-3 py-1 bg-purple-500 text-white rounded text-sm">복지</button>
                    <button id="showCulture" class="px-3 py-1 bg-pink-500 text-white rounded text-sm">문화예술</button>
                </div>
            </div>

            <!-- 활동기록 섹션 -->
            <div id="activitiesSection" class="bg-white rounded-lg shadow-lg p-6 mb-6 hidden">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-2xl font-bold flex items-center">
                        <i class="fas fa-hands-helping text-green-500 mr-2"></i>
                        봉사활동 기록
                    </h2>
                    <button id="addActivityBtn" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
                        <i class="fas fa-plus mr-2"></i>활동 추가
                    </button>
                </div>
                <div id="activitiesList" class="space-y-4">
                    <!-- 활동 목록이 여기에 표시됩니다 -->
                </div>
            </div>

            <!-- 뱃지 섹션 -->
            <div id="badgesSection" class="bg-white rounded-lg shadow-lg p-6 mb-6 hidden">
                <h2 class="text-2xl font-bold mb-4 flex items-center">
                    <i class="fas fa-medal text-purple-500 mr-2"></i>
                    뱃지 컬렉션
                </h2>
                <div id="badgesList" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <!-- 뱃지 목록이 여기에 표시됩니다 -->
                </div>
            </div>

            <!-- 프로필 섹션 -->
            <div id="profileSection" class="bg-white rounded-lg shadow-lg p-6 hidden">
                <h2 class="text-2xl font-bold mb-4 flex items-center">
                    <i class="fas fa-user text-indigo-500 mr-2"></i>
                    내 프로필
                </h2>
                <div id="profileContent">
                    <!-- 프로필 내용이 여기에 표시됩니다 -->
                </div>
            </div>
        </div>

        <!-- 활동 추가 모달 -->
        <div id="addActivityModal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50">
            <div class="bg-white p-6 rounded-lg max-w-md w-full mx-4">
                <h3 class="text-xl font-bold mb-4">새 봉사활동 추가</h3>
                <form id="addActivityForm">
                    <div class="mb-4">
                        <label class="block text-sm font-medium mb-2">활동 제목</label>
                        <input type="text" id="activityTitle" class="w-full border rounded px-3 py-2" required>
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium mb-2">카테고리</label>
                        <select id="activityCategory" class="w-full border rounded px-3 py-2" required>
                            <option value="">선택하세요</option>
                            <option value="환경보호">환경보호</option>
                            <option value="교육">교육</option>
                            <option value="복지">복지</option>
                            <option value="문화예술">문화예술</option>
                            <option value="의료">의료</option>
                            <option value="재해구호">재해구호</option>
                        </select>
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium mb-2">활동 날짜</label>
                        <input type="date" id="activityDate" class="w-full border rounded px-3 py-2" required>
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium mb-2">봉사 시간</label>
                        <input type="number" id="activityHours" class="w-full border rounded px-3 py-2" step="0.5" min="0" required>
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium mb-2">장소</label>
                        <input type="text" id="activityLocation" class="w-full border rounded px-3 py-2" required>
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium mb-2">설명</label>
                        <textarea id="activityDescription" class="w-full border rounded px-3 py-2 h-20"></textarea>
                    </div>
                    <div class="flex space-x-2">
                        <button type="submit" class="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600">추가</button>
                        <button type="button" id="cancelAddActivity" class="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400">취소</button>
                    </div>
                </form>
            </div>
        </div>

        <script src="/static/app.js"></script>
    </body>
    </html>
  `)
});

export default app