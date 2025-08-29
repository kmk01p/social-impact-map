-- 테스트 사용자 데이터
INSERT OR IGNORE INTO users (id, email, name, total_volunteer_hours, level, experience_points) VALUES 
  (1, 'alice@example.com', '김영희', 25, 2, 250),
  (2, 'bob@example.com', '박철수', 15, 1, 150),
  (3, 'charlie@example.com', '이미나', 40, 3, 400);

-- 뱃지 데이터
INSERT OR IGNORE INTO badges (id, name, description, requirement_type, requirement_value) VALUES 
  (1, '첫 걸음', '첫 번째 봉사활동을 완료했습니다', 'activities', 1),
  (2, '열정가', '10시간 이상 봉사활동을 했습니다', 'hours', 10),
  (3, '헌신자', '50시간 이상 봉사활동을 했습니다', 'hours', 50),
  (4, '환경지킴이', '환경보호 활동 5회 이상 참여', 'categories', 5),
  (5, '교육봉사자', '교육 봉사활동 3회 이상 참여', 'categories', 3),
  (6, '지역사랑', '3곳 이상의 다른 지역에서 활동', 'locations', 3);

-- 기관 데이터
INSERT OR IGNORE INTO organizations (id, name, description, category, address, latitude, longitude, verified) VALUES 
  (1, '서울시립아동복지센터', '아동 복지 및 교육 지원', '복지', '서울시 강남구 논현로 123', 37.5172, 127.0286, true),
  (2, '한강공원환경단체', '한강 생태계 보호 및 환경정화', '환경보호', '서울시 영등포구 한강로 456', 37.5247, 126.9007, true),
  (3, '부산해양보호협회', '해양 생태계 보존 활동', '환경보호', '부산시 해운대구 해변로 789', 35.1588, 129.1596, true),
  (4, '대전청소년교육센터', '청소년 멘토링 및 교육 프로그램', '교육', '대전시 유성구 대학로 321', 36.3504, 127.3845, true);

-- 봉사활동 데이터
INSERT OR IGNORE INTO volunteer_activities (id, user_id, organization_id, title, description, category, activity_date, hours, location_name, latitude, longitude, verification_status) VALUES 
  (1, 1, 1, '아동 독서 지도', '초등학생 대상 독서 지도 및 멘토링', '교육', '2024-08-20', 4.0, '서울시립아동복지센터', 37.5172, 127.0286, 'verified'),
  (2, 1, 2, '한강 환경정화', '한강공원 쓰레기 수거 및 분리수거', '환경보호', '2024-08-22', 3.5, '한강공원 여의도구간', 37.5247, 126.9007, 'verified'),
  (3, 2, 3, '해변 정화활동', '해운대 해변 플라스틱 쓰레기 수거', '환경보호', '2024-08-25', 5.0, '해운대 해변', 35.1588, 129.1596, 'verified'),
  (4, 1, 1, '교육 봉사', '저소득층 아동 학습 지원', '교육', '2024-08-28', 6.0, '서울시립아동복지센터', 37.5172, 127.0286, 'pending'),
  (5, 3, 4, '청소년 멘토링', '중학생 진로상담 및 학습지도', '교육', '2024-08-27', 4.5, '대전청소년교육센터', 36.3504, 127.3845, 'verified'),
  (6, 2, 2, '생태계 모니터링', '한강 생태계 조사 및 기록', '환경보호', '2024-08-26', 3.0, '한강공원 반포구간', 37.5247, 126.9007, 'verified');

-- 사용자 뱃지 데이터
INSERT OR IGNORE INTO user_badges (user_id, badge_id) VALUES 
  (1, 1), (1, 2), -- 김영희: 첫 걸음, 열정가
  (2, 1), (2, 2), -- 박철수: 첫 걸음, 열정가  
  (3, 1), (3, 2), (3, 3); -- 이미나: 첫 걸음, 열정가, 헌신자