export type EnrollmentRequestItem = {
  id: string;
  user_name: string;
  avatar?: string;
  created?: string;
};

export type StudentItem = {
  id: string;
  name: string;
  avatar?: string;
};

export type CourseItem = {
  id: string;
  name: string;
  avatar?: string;
};

// Trả về từ POST /get_list_courses — mỗi item là một bài đăng của GV
// is_enrolled: '1' nếu học sinh đã được vào lớp
// is_requested: '1' nếu học sinh đã gửi yêu cầu chờ duyệt
export type CourseListItem = {
  course_id: string;
  description: string;
  username: string;
  avatar: string;
  left_video: string;
  right_video: string;
  is_enrolled: '0' | '1';
  is_requested: '0' | '1';
};

// Trả về từ POST /get_list_teachers — danh sách GV user (không phụ thuộc vào bài đăng)
export type TeacherListItem = {
  teacher_id: string;
  username: string;
  avatar: string;
  is_enrolled: '0' | '1';
  is_requested: '0' | '1';
};
