import type { PostItem } from '../types/post';
import type { ProfileInfo } from '../types/profile';
import type {
  CourseItem,
  EnrollmentRequestItem,
  StudentItem,
} from '../types/course';

export const MOCK_PROFILE: ProfileInfo = {
  id: 'mock-user-1',
  username: 'Nguoi dung test',
  avatar: 'https://i.pravatar.cc/150?img=12',
  coverImage:
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop',
  description: 'Nguoi dung demo cho giao dien.',
  online: '1',
};

export const MOCK_POSTS: PostItem[] = [
  {
    post_id: 'mock-post-1',
    described: 'Video huong dan bai tap khoi dong co ban.',
    created: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    like: '12',
    comment: '3',
    is_liked: '0',
    video: [
      {
        url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      },
    ],
    author: {
      id: 'mock-teacher-1',
      username: 'Coach Linh',
      avatar: 'https://i.pravatar.cc/150?img=47',
      role: 'GV',
      online: '1',
    },
    is_blocked: '0',
    can_comment: '1',
    can_edit: '0',
  },
  {
    post_id: 'mock-post-2',
    described:
      'Hom nay tap trung vao ky thuat giu thang lung va dieu hoa nhip tho.\n\nSee more content in the description for testing.\n\nChan dung bai tap dai dong.',
    created: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    like: '45',
    comment: '8',
    is_liked: '1',
    video: [],
    author: {
      id: 'mock-teacher-2',
      username: 'Coach Ha',
      avatar: 'https://i.pravatar.cc/150?img=32',
      role: 'GV',
      online: '0',
    },
    is_blocked: '0',
    can_comment: '1',
    can_edit: '0',
  },
];

export const MOCK_MY_POSTS: PostItem[] = [
  {
    post_id: 'mock-post-3',
    described: 'Bai tap buoi toi: squat 3 hiep, moi hiep 12 lan.',
    created: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    like: '6',
    comment: '1',
    is_liked: '0',
    video: [],
    author: {
      id: 'mock-user-1',
      username: 'Nguoi dung test',
      avatar: 'https://i.pravatar.cc/150?img=12',
      role: 'HV',
      online: '1',
    },
    is_blocked: '0',
    can_comment: '1',
    can_edit: '1',
  },
];

export const MOCK_SEARCH_RESULTS: PostItem[] = [
  {
    post_id: 'mock-search-1',
    described: 'Ket qua tim kiem demo ve bai tap tay.',
    created: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    like: '18',
    comment: '2',
    is_liked: '0',
    video: [],
    author: {
      id: 'mock-teacher-3',
      username: 'Coach Minh',
      avatar: 'https://i.pravatar.cc/150?img=56',
      role: 'GV',
      online: '1',
    },
    is_blocked: '0',
    can_comment: '1',
    can_edit: '0',
  },
];

export const MOCK_REQUESTS: EnrollmentRequestItem[] = [
  {
    id: 'mock-student-1',
    user_name: 'Hoc vien A',
    avatar: 'https://i.pravatar.cc/150?img=18',
    created: new Date().toISOString(),
  },
  {
    id: 'mock-student-2',
    user_name: 'Hoc vien B',
    avatar: 'https://i.pravatar.cc/150?img=28',
    created: new Date().toISOString(),
  },
];

export const MOCK_STUDENTS: StudentItem[] = [
  {
    id: 'mock-student-3',
    name: 'Hoc vien C',
    avatar: 'https://i.pravatar.cc/150?img=36',
  },
  {
    id: 'mock-student-4',
    name: 'Hoc vien D',
    avatar: 'https://i.pravatar.cc/150?img=44',
  },
];

export const MOCK_COURSES: CourseItem[] = [
  {
    id: 'mock-teacher-1',
    name: 'Coach Linh',
    avatar: 'https://i.pravatar.cc/150?img=47',
  },
];
