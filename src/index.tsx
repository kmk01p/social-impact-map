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
        <script>
          tailwind.config = {
            theme: {
              extend: {
                colors: {
                  primary: {
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#1e293b',
                    900: '#0f172a'
                  },
                  accent: {
                    blue: '#3b82f6',
                    emerald: '#10b981',
                    amber: '#f59e0b'
                }
                },
                fontFamily: {
                  'sans': ['Inter', 'system-ui', '-apple-system', 'sans-serif']
                },
                boxShadow: {
                  'elegant': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  'elegant-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                }
              }
            }
          }
        </script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
        <link href="/static/style.css" rel="stylesheet">
    </head>
    <body class="elegant-bg font-sans min-h-screen">
        <!-- 배경 장식 -->
        <div class="fixed inset-0 overflow-hidden pointer-events-none">
            <div class="absolute -top-40 -right-40 w-80 h-80 bg-primary-100/30 rounded-full blur-3xl"></div>
            <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-50/40 rounded-full blur-3xl"></div>
        </div>

        <!-- 네비게이션 -->
        <nav class="elegant-nav relative z-50">
            <div class="max-w-7xl mx-auto px-6 lg:px-8">
                <div class="flex justify-between items-center py-4">
                    <div class="flex items-center space-x-4">
                        <div class="nav-logo">
                            <div class="w-10 h-10 bg-accent-blue rounded-lg flex items-center justify-center shadow-elegant">
                                <i class="fas fa-heart text-white"></i>
                            </div>
                        </div>
                        <div>
                            <h1 class="text-xl font-bold text-primary-900">
                                소셜 임팩트 맵
                            </h1>
                            <p class="text-sm text-primary-500">봉사의 가치를 세상에</p>
                        </div>
                    </div>
                    <div class="flex space-x-1">
                        <button id="mapTab" class="nav-btn nav-active">
                            <i class="fas fa-map-marked-alt"></i>
                            <span>지도</span>
                        </button>
                        <button id="activitiesTab" class="nav-btn">
                            <i class="fas fa-hands-helping"></i>
                            <span>활동기록</span>
                        </button>
                        <button id="badgesTab" class="nav-btn">
                            <i class="fas fa-medal"></i>
                            <span>뱃지</span>
                        </button>
                        <button id="profileTab" class="nav-btn">
                            <i class="fas fa-user-circle"></i>
                            <span>프로필</span>
                        </button>
                    </div>
                </div>
            </div>
        </nav>

        <!-- 메인 컨테이너 -->
        <div class="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-8">
            <!-- 대시보드 통계 -->
            <div id="statsSection" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div class="stat-card">
                    <div class="flex items-center">
                        <div class="stat-icon bg-accent-blue">
                            <i class="fas fa-users text-white"></i>
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-primary-500 mb-1">총 참가자</div>
                            <div id="totalUsers" class="text-2xl font-bold text-primary-900">-</div>
                        </div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="flex items-center">
                        <div class="stat-icon bg-accent-emerald">
                            <i class="fas fa-hands-helping text-white"></i>
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-primary-500 mb-1">총 활동</div>
                            <div id="totalActivities" class="text-2xl font-bold text-primary-900">-</div>
                        </div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="flex items-center">
                        <div class="stat-icon bg-accent-amber">
                            <i class="fas fa-clock text-white"></i>
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-primary-500 mb-1">총 봉사시간</div>
                            <div id="totalHours" class="text-2xl font-bold text-primary-900">-</div>
                        </div>
                    </div>
                </div>

                <div class="stat-card">
                    <div class="flex items-center">
                        <div class="stat-icon bg-primary-600">
                            <i class="fas fa-medal text-white"></i>
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-primary-500 mb-1">획득 뱃지</div>
                            <div id="totalBadges" class="text-2xl font-bold text-primary-900">-</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 지도 섹션 -->
            <div id="mapSection" class="elegant-card mb-6">
                <div class="card-header">
                    <div class="flex items-center">
                        <div class="w-8 h-8 bg-accent-blue rounded-lg flex items-center justify-center mr-3">
                            <i class="fas fa-map-marked-alt text-white text-sm"></i>
                        </div>
                        <div>
                            <h2 class="text-xl font-bold text-primary-900">봉사활동 지도</h2>
                            <p class="text-primary-500 text-sm">전국 봉사활동 현황을 한눈에</p>
                        </div>
                    </div>
                </div>
                
                <div class="map-container mb-4">
                    <div id="map" class="w-full h-96"></div>
                </div>

                <div class="flex flex-wrap gap-2">
                    <button id="showAll" class="filter-btn filter-active">
                        <i class="fas fa-globe-asia mr-2"></i>전체
                    </button>
                    <button id="showEnvironment" class="filter-btn" data-category="환경보호">
                        <i class="fas fa-leaf mr-2"></i>환경보호
                    </button>
                    <button id="showEducation" class="filter-btn" data-category="교육">
                        <i class="fas fa-graduation-cap mr-2"></i>교육
                    </button>
                    <button id="showWelfare" class="filter-btn" data-category="복지">
                        <i class="fas fa-heart mr-2"></i>복지
                    </button>
                    <button id="showCulture" class="filter-btn" data-category="문화예술">
                        <i class="fas fa-palette mr-2"></i>문화예술
                    </button>
                </div>
            </div>

            <!-- 활동기록 섹션 -->
            <div id="activitiesSection" class="elegant-card mb-6 hidden">
                <div class="card-header">
                    <div class="flex items-center">
                        <div class="w-8 h-8 bg-accent-emerald rounded-lg flex items-center justify-center mr-3">
                            <i class="fas fa-hands-helping text-white text-sm"></i>
                        </div>
                        <div>
                            <h2 class="text-xl font-bold text-primary-900">봉사활동 기록</h2>
                            <p class="text-primary-500 text-sm">나의 봉사활동 여정</p>
                        </div>
                    </div>
                    <button id="addActivityBtn" class="btn-primary">
                        <i class="fas fa-plus mr-2"></i>활동 추가
                    </button>
                </div>
                <div id="activitiesList" class="space-y-3">
                    <!-- 활동 목록이 여기에 표시됩니다 -->
                </div>
            </div>

            <!-- 뱃지 섹션 -->
            <div id="badgesSection" class="elegant-card mb-6 hidden">
                <div class="card-header">
                    <div class="flex items-center">
                        <div class="w-8 h-8 bg-accent-amber rounded-lg flex items-center justify-center mr-3">
                            <i class="fas fa-medal text-white text-sm"></i>
                        </div>
                        <div>
                            <h2 class="text-xl font-bold text-primary-900">뱃지 컬렉션</h2>
                            <p class="text-primary-500 text-sm">나의 성취와 기록</p>
                        </div>
                    </div>
                </div>
                <div id="badgesList" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    <!-- 뱃지 목록이 여기에 표시됩니다 -->
                </div>
            </div>

            <!-- 프로필 섹션 -->
            <div id="profileSection" class="elegant-card hidden">
                <div class="card-header">
                    <div class="flex items-center">
                        <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center mr-3">
                            <i class="fas fa-user-circle text-white text-sm"></i>
                        </div>
                        <div>
                            <h2 class="text-xl font-bold text-primary-900">내 프로필</h2>
                            <p class="text-primary-500 text-sm">개인 통계 및 성과</p>
                        </div>
                    </div>
                </div>
                <div id="profileContent">
                    <!-- 프로필 내용이 여기에 표시됩니다 -->
                </div>
            </div>
        </div>

        <!-- 활동 추가 모달 -->
        <div id="addActivityModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm hidden items-center justify-center z-50 p-4">
            <div class="modal fade-in">
                <div class="modal-header">
                    <h3 class="text-lg font-bold text-primary-900 flex items-center">
                        <i class="fas fa-plus-circle mr-2 text-accent-emerald"></i>
                        새 봉사활동 추가
                    </h3>
                    <button id="closeModalBtn" class="text-primary-400 hover:text-primary-600 transition-colors">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <form id="addActivityForm" class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="input-group">
                            <label class="input-label">활동 제목</label>
                            <input type="text" id="activityTitle" class="form-input" placeholder="예: 한강 환경정화 활동" required>
                        </div>
                        <div class="input-group">
                            <label class="input-label">카테고리</label>
                            <select id="activityCategory" class="form-select" required>
                                <option value="">카테고리 선택</option>
                                <option value="환경보호">🌱 환경보호</option>
                                <option value="교육">📚 교육</option>
                                <option value="복지">❤️ 복지</option>
                                <option value="문화예술">🎨 문화예술</option>
                                <option value="의료">🏥 의료</option>
                                <option value="재해구호">🆘 재해구호</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="input-group">
                            <label class="input-label">활동 날짜</label>
                            <input type="date" id="activityDate" class="form-input" required>
                        </div>
                        <div class="input-group">
                            <label class="input-label">봉사 시간</label>
                            <input type="number" id="activityHours" class="form-input" step="0.5" min="0" placeholder="0.0" required>
                        </div>
                    </div>
                    
                    <div class="input-group">
                        <label class="input-label">활동 장소</label>
                        <input type="text" id="activityLocation" class="form-input" placeholder="예: 서울시 마포구 한강공원" required>
                    </div>
                    
                    <div class="input-group">
                        <label class="input-label">활동 설명</label>
                        <textarea id="activityDescription" class="form-textarea" rows="3" placeholder="봉사활동에 대한 상세한 설명을 입력해주세요..."></textarea>
                    </div>
                    
                    <div class="flex space-x-3 pt-2">
                        <button type="submit" class="btn-primary flex-1">
                            <i class="fas fa-check mr-2"></i>활동 등록
                        </button>
                        <button type="button" id="cancelAddActivity" class="btn-secondary flex-1">
                            <i class="fas fa-times mr-2"></i>취소
                        </button>
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