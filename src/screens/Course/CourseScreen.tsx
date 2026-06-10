import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../../constants/theme';
import { courseApi } from '../../network/courseApi';
import { userApi } from '../../network/userApi';
import { useAuthStore } from '../../store/authStore';
import type {
  CourseItem,
  EnrollmentRequestItem,
  StudentItem,
  TeacherListItem,
} from '../../types/course';
import Avatar from '../../components/Avatar';
import {
  MOCK_COURSES,
  MOCK_REQUESTS,
  MOCK_STUDENTS,
  MOCK_TEACHER_LIST,
} from '../../utils/mockData';

const pendingKey = (userId: string) => `pending_teacher_ids_${userId}`;

const PAGE_SIZE = 10;

const ensureOnline = async () => {
  const state = await NetInfo.fetch();
  if (!state.isConnected) {
    Alert.alert('Không có kết nối mạng');
    return false;
  }
  return true;
};

export default function CourseScreen() {
  const { user } = useAuthStore();
  const isTeacher = user?.role === 'GV';

  return (
    <SafeAreaView style={styles.container}>
      {isTeacher ? <TeacherView /> : <StudentView />}
    </SafeAreaView>
  );
}

// ─── TEACHER VIEW ─────────────────────────────────────────────────────────────

function TeacherView() {
  const navigation = useNavigation<any>();
  const { token } = useAuthStore();
  const [tab, setTab] = useState<'requests' | 'students'>('requests');
  const [requests, setRequests] = useState<EnrollmentRequestItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [menuTarget, setMenuTarget] = useState<StudentItem | null>(null);

  const load = useCallback(async () => {
    if (!token) {
      return;
    }
    if (token === 'mock-token') {
      setRequests(MOCK_REQUESTS);
      setStudents(MOCK_STUDENTS);
      return;
    }
    if (!(await ensureOnline())) {
      return;
    }
    setLoading(true);
    try {
      // allSettled để NO_DATA từ một API không làm hỏng API còn lại
      const [requestResult, studentResult] = await Promise.allSettled([
        courseApi.getRequestedEnrollment({
          token,
          index: '0',
          count: PAGE_SIZE.toString(),
        }),
        courseApi.getListStudents({
          token,
          index: '0',
          count: PAGE_SIZE.toString(),
        }),
      ]);

      if (requestResult.status === 'fulfilled') {
        const mappedRequests = Array.isArray(requestResult.value?.data)
          ? requestResult.value.data.map((item: any) => item.request)
          : [];
        setRequests(mappedRequests);
      } else {
        setRequests([]);
      }

      if (studentResult.status === 'fulfilled') {
        setStudents(
          Array.isArray(studentResult.value?.students)
            ? studentResult.value.students
            : [],
        );
      } else {
        setStudents([]);
      }
    } catch (error: any) {
      Alert.alert(error?.message || 'Không thể tải danh sách');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const approveRequest = async (id: string, accept: boolean) => {
    if (!token) {
      return;
    }
    if (token === 'mock-token') {
      setRequests(current => current.filter(item => item.id !== id));
      return;
    }
    const confirmed = await new Promise<boolean>(resolve => {
      Alert.alert(
        accept ? 'Xác nhận duyệt?' : 'Xác nhận từ chối?',
        'Bạn chắc chắn muốn tiếp tục?',
        [
          { text: 'Hủy', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Đồng ý', onPress: () => resolve(true) },
        ],
      );
    });
    if (!confirmed) {
      return;
    }
    if (!(await ensureOnline())) {
      return;
    }
    try {
      await courseApi.setApproveEnrollment({
        token,
        user_id: id,
        is_accept: accept ? '1' : '0',
      });
      load();
    } catch (error: any) {
      Alert.alert(error?.message || 'Không thể cập nhật yêu cầu');
    }
  };

  const blockStudent = async (studentId: string) => {
    if (!token) {
      return;
    }
    if (token === 'mock-token') {
      setMenuTarget(null);
      return;
    }
    if (!(await ensureOnline())) {
      return;
    }
    try {
      await userApi.setBlock({ token, userId: studentId, type: '0' });
      setMenuTarget(null);
    } catch (error: any) {
      Alert.alert(error?.message || 'Không thể chặn người dùng');
    }
  };

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lớp học của tôi</Text>
        <Pressable
          onPress={() =>
            navigation.navigate('VideoPickerScreen', { isTeacherCreating: true })
          }
          style={styles.headerAction}>
          <Text style={styles.headerActionText}>+ Tạo bài tập</Text>
        </Pressable>
      </View>

      {/* Tabs — underline style, 48px height */}
      <View style={styles.tabs}>
        <Pressable
          onPress={() => setTab('requests')}
          style={[styles.tabButton, tab === 'requests' && styles.tabActive]}>
          <Text
            style={[
              styles.tabText,
              tab === 'requests' && styles.tabTextActive,
            ]}>
            Xin vào lớp{requests.length > 0 ? ` (${requests.length})` : ''}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTab('students')}
          style={[styles.tabButton, tab === 'students' && styles.tabActive]}>
          <Text
            style={[
              styles.tabText,
              tab === 'students' && styles.tabTextActive,
            ]}>
            Học viên{students.length > 0 ? ` (${students.length})` : ''}
          </Text>
        </Pressable>
      </View>

      {/* Card tạo bài tập — nổi bật để GV dễ thấy */}
      <Pressable
        style={styles.createExerciseCard}
        onPress={() =>
          navigation.navigate('VideoPickerScreen', { isTeacherCreating: true })
        }>
        <View style={styles.createExerciseIconWrap}>
          <Text style={styles.createExerciseIcon}>📹</Text>
        </View>
        <View style={styles.createExerciseInfo}>
          <Text style={styles.createExerciseTitle}>Tạo bài tập mới</Text>
          <Text style={styles.createExerciseDesc}>
            Quay 2 góc video mẫu · Học viên nộp lại · Bạn chấm điểm
          </Text>
        </View>
        <Text style={styles.createExerciseArrow}>›</Text>
      </Pressable>

      {tab === 'requests' ? (
        <FlatList
          data={requests}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={load}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>📭</Text>
                <Text style={styles.emptyText}>Không có yêu cầu mới</Text>
                <Text style={styles.emptySubtext}>Kéo xuống để làm mới</Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            // Facebook "Friend Requests" style card
            <View style={styles.requestCard}>
              {/* Top row: avatar + name (pressable) */}
              <Pressable
                style={styles.userArea}
                onPress={() =>
                  navigation.navigate('UserProfile', {
                    userId: item.id,
                    username: item.user_name,
                    avatar: item.avatar,
                  })
                }>
                <Avatar uri={item.avatar} name={item.user_name} size={52} />
                <View style={styles.requestInfo}>
                  <Text style={styles.requestName}>{item.user_name}</Text>
                  <Text style={styles.requestSub}>Muốn tham gia lớp học</Text>
                </View>
              </Pressable>
              {/* Bottom row: 2 full-width action buttons + 3-dot */}
              <View style={styles.requestActions}>
                <Pressable
                  style={styles.approveButton}
                  onPress={() => approveRequest(item.id, true)}>
                  <Text style={styles.approveButtonText}>Duyệt</Text>
                </Pressable>
                <Pressable
                  style={styles.rejectButton}
                  onPress={() => approveRequest(item.id, false)}>
                  <Text style={styles.rejectButtonText}>Từ chối</Text>
                </Pressable>
                <Pressable
                  style={styles.menuButton}
                  onPress={() =>
                    setMenuTarget({
                      id: item.id,
                      name: item.user_name,
                      avatar: item.avatar,
                    })
                  }>
                  <Text style={styles.menuDots}>•••</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      ) : (
        <FlatList
          data={students}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={load}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>👥</Text>
                <Text style={styles.emptyText}>Chưa có học viên nào</Text>
                <Text style={styles.emptySubtext}>Danh sách học viên sẽ hiện ở đây</Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <View style={styles.studentRow}>
              <Pressable
                style={styles.userArea}
                onPress={() =>
                  navigation.navigate('UserProfile', {
                    userId: item.id,
                    username: item.name,
                    avatar: item.avatar,
                  })
                }>
                <Avatar uri={item.avatar} name={item.name} size={44} />
                <Text style={styles.studentName}>{item.name}</Text>
              </Pressable>
              <Pressable
                style={styles.menuButton}
                onPress={() => setMenuTarget(item)}>
                <Text style={styles.menuDots}>•••</Text>
              </Pressable>
            </View>
          )}
        />
      )}

      <Modal transparent visible={!!menuTarget} animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setMenuTarget(null)}>
          <View style={styles.menuCard}>
            <Text style={styles.menuTitle}>{menuTarget?.name}</Text>
            <Pressable
              style={styles.menuItem}
              onPress={() => menuTarget && blockStudent(menuTarget.id)}>
              <Text style={styles.menuItemDanger}>Chặn</Text>
            </Pressable>
            <Pressable
              style={styles.menuItem}
              onPress={() => setMenuTarget(null)}>
              <Text style={styles.menuItemCancel}>Hủy</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

// ─── STUDENT VIEW ─────────────────────────────────────────────────────────────

function StudentView() {
  const navigation = useNavigation<any>();
  const { token, user } = useAuthStore();
  const [tab, setTab] = useState<'teachers' | 'courses'>('teachers');

  // Danh sách GV lấy từ GET /users, lọc role=GV ở client
  const [teachers, setTeachers] = useState<TeacherListItem[]>([]);
  // Lớp đã tham gia — từ /get_list_courses_of_student
  const [enrolledCourses, setEnrolledCourses] = useState<CourseItem[]>([]);
  // IDs đã gửi request — lưu AsyncStorage vì server không có API query phía học sinh
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  // IDs đã được duyệt
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());

  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [loadingEnrolled, setLoadingEnrolled] = useState(false);
  const [requesting, setRequesting] = useState<Set<string>>(new Set());

  const loadTeachers = useCallback(async () => {
    if (!token) {
      return;
    }
    if (token === 'mock-token') {
      setTeachers(MOCK_TEACHER_LIST);
      return;
    }
    if (!(await ensureOnline())) {
      return;
    }
    setLoadingTeachers(true);
    try {
      // GET /users trả về tất cả users — lọc GV ở client
      const data: any[] = await userApi.getAllUsers();
      const list: TeacherListItem[] = (Array.isArray(data) ? data : [])
        .filter((u: any) => u.role === 'GV' && u.status === 'ACTIVE')
        .map((u: any) => ({
          teacher_id: u.id,
          username: u.username ?? 'Giáo viên',
          avatar: u.avatar ?? '',
          is_enrolled: '0',
          is_requested: '0',
        }));
      setTeachers(list);
    } catch {
      setTeachers([]);
    } finally {
      setLoadingTeachers(false);
    }
  }, [token]);

  const loadEnrolledCourses = useCallback(async () => {
    if (!token || !user?.id) {
      return;
    }
    if (token === 'mock-token') {
      setEnrolledCourses(MOCK_COURSES);
      setEnrolledIds(new Set(MOCK_COURSES.map(c => c.id)));
      return;
    }
    if (!(await ensureOnline())) {
      return;
    }
    setLoadingEnrolled(true);
    try {
      const data = await courseApi.getListCoursesOfStudent({
        token,
        user_id: user.id,
        index: '0',
        count: '50',
      });
      const courses: CourseItem[] = Array.isArray(data?.courses)
        ? data.courses
        : [];
      setEnrolledCourses(courses);
      const ids = new Set(courses.map(c => c.id));
      setEnrolledIds(ids);
      // Xóa khỏi pending những ID đã được duyệt
      if (user?.id) {
        setPendingIds(prev => {
          const next = new Set([...prev].filter(id => !ids.has(id)));
          AsyncStorage.setItem(pendingKey(user.id!), JSON.stringify([...next]));
          return next;
        });
      }
    } catch {
      setEnrolledCourses([]);
    } finally {
      setLoadingEnrolled(false);
    }
  }, [token, user?.id]);

  const loadPending = useCallback(async () => {
    if (!user?.id) {
      return;
    }
    const stored = await AsyncStorage.getItem(pendingKey(user.id));
    if (stored) {
      try {
        setPendingIds(new Set(JSON.parse(stored) as string[]));
      } catch {
        setPendingIds(new Set());
      }
    }
  }, [user?.id]);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  useEffect(() => {
    loadTeachers();
  }, [loadTeachers]);

  useEffect(() => {
    loadEnrolledCourses();
  }, [loadEnrolledCourses]);

  const requestJoin = async (teacherId: string) => {
    if (!token || !user?.id) {
      return;
    }
    if (token === 'mock-token') {
      setPendingIds(prev => new Set([...prev, teacherId]));
      return;
    }
    if (!(await ensureOnline())) {
      return;
    }
    setRequesting(prev => new Set([...prev, teacherId]));
    try {
      await courseApi.setRequestCourse({
        token,
        course_id: teacherId,
        user_id: user.id,
      });
      // Lưu pending vào AsyncStorage
      const next = new Set([...pendingIds, teacherId]);
      setPendingIds(next);
      await AsyncStorage.setItem(
        pendingKey(user.id),
        JSON.stringify([...next]),
      );
    } catch (err: any) {
      Alert.alert(err?.message || 'Không thể gửi yêu cầu');
    } finally {
      setRequesting(prev => {
        const n = new Set(prev);
        n.delete(teacherId);
        return n;
      });
    }
  };

  const refresh = () => {
    loadTeachers();
    loadEnrolledCourses();
  };

  const enrolledCount = enrolledCourses.length;

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Khóa học</Text>
      </View>

      {/* Tabs — underline style, 48px height */}
      <View style={styles.tabs}>
        <Pressable
          onPress={() => setTab('teachers')}
          style={[styles.tabButton, tab === 'teachers' && styles.tabActive]}>
          <Text
            style={[
              styles.tabText,
              tab === 'teachers' && styles.tabTextActive,
            ]}>
            Giáo viên
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTab('courses')}
          style={[styles.tabButton, tab === 'courses' && styles.tabActive]}>
          <Text
            style={[
              styles.tabText,
              tab === 'courses' && styles.tabTextActive,
            ]}>
            Lớp của tôi{enrolledCount > 0 ? ` (${enrolledCount})` : ''}
          </Text>
        </Pressable>
      </View>

      {tab === 'teachers' ? (
        <FlatList
          data={teachers}
          keyExtractor={item => item.teacher_id}
          contentContainerStyle={styles.list}
          refreshing={loadingTeachers}
          onRefresh={refresh}
          ListEmptyComponent={
            !loadingTeachers ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>🏫</Text>
                <Text style={styles.emptyText}>Chưa có giáo viên nào</Text>
                <Text style={styles.emptySubtext}>Kéo xuống để làm mới</Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            const isEnrolled = enrolledIds.has(item.teacher_id);
            const isPending = pendingIds.has(item.teacher_id);
            const isRequesting = requesting.has(item.teacher_id);

            // Facebook "People You May Know" style card
            return (
              <View style={styles.teacherCard}>
                <Pressable
                  style={styles.userArea}
                  onPress={() =>
                    navigation.navigate('UserProfile', {
                      userId: item.teacher_id,
                      username: item.username,
                      avatar: item.avatar,
                    })
                  }>
                  <Avatar uri={item.avatar} name={item.username} size={64} />
                  <View style={styles.teacherInfo}>
                    <Text style={styles.teacherName}>{item.username}</Text>
                    <Text style={styles.teacherRoleLabel}>Giáo viên</Text>
                  </View>
                </Pressable>

                {isEnrolled ? (
                  <View style={[styles.statusBadge, styles.enrolledBadge]}>
                    <Text style={[styles.statusText, styles.enrolledText]}>
                      Đã tham gia
                    </Text>
                  </View>
                ) : isPending ? (
                  <View style={[styles.statusBadge, styles.pendingBadge]}>
                    <Text style={[styles.statusText, styles.pendingText]}>
                      Đang chờ
                    </Text>
                  </View>
                ) : (
                  <Pressable
                    style={[
                      styles.joinButton,
                      isRequesting && styles.joinButtonLoading,
                    ]}
                    onPress={() => requestJoin(item.teacher_id)}
                    disabled={isRequesting}>
                    {isRequesting ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.joinButtonText}>Xin vào lớp</Text>
                    )}
                  </Pressable>
                )}
              </View>
            );
          }}
        />
      ) : (
        <FlatList
          data={enrolledCourses}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshing={loadingEnrolled}
          onRefresh={loadEnrolledCourses}
          ListEmptyComponent={
            !loadingEnrolled ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>📚</Text>
                <Text style={styles.emptyText}>Chưa tham gia lớp học nào</Text>
                <Text style={styles.emptySubtext}>
                  Chuyển sang tab Giáo viên để xin vào lớp
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <View style={styles.enrolledCard}>
              <Pressable
                style={styles.userArea}
                onPress={() =>
                  navigation.navigate('UserProfile', {
                    userId: item.id,
                    username: item.name,
                    avatar: item.avatar,
                  })
                }>
                <Avatar uri={item.avatar} name={item.name} size={52} />
                <View style={styles.teacherInfo}>
                  <Text style={styles.teacherName}>{item.name}</Text>
                  <Text style={styles.teacherRoleLabel}>Giáo viên của bạn</Text>
                </View>
              </Pressable>
              <Pressable
                style={styles.submitBtn}
                onPress={() =>
                  navigation.navigate('VideoPickerScreen', {
                    courseId: item.id,
                    exerciseTitle: `Nộp bài cho ${item.name}`,
                  })
                }>
                <Text style={styles.submitBtnText}>📤 Nộp bài</Text>
              </Pressable>
            </View>
          )}
        />
      )}
    </>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },

  // ─── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E4E6EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#050505',
  },
  headerAction: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: '#E7F3FF',
  },
  headerActionText: {
    color: '#1877F2',
    fontWeight: '600',
    fontSize: 14,
  },

  // ─── Tabs — underline style, 48px height ───────────────────────────────────
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E4E6EB',
  },
  tabButton: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#1877F2',
  },
  tabText: {
    color: '#65676B',
    fontWeight: '600',
    fontSize: 14,
  },
  tabTextActive: {
    color: '#1877F2',
    fontWeight: '700',
  },

  // ─── List ──────────────────────────────────────────────────────────────────
  list: {
    paddingBottom: 32,
    paddingTop: 4,
  },

  // ─── Empty state ───────────────────────────────────────────────────────────
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    color: '#050505',
    fontWeight: '700',
    fontSize: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#65676B',
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
  },

  // ─── Teacher card — Facebook "People You May Know" style ──────────────────
  teacherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    // Subtle shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  teacherInfo: {
    flex: 1,
  },
  teacherName: {
    fontWeight: '700',
    color: '#050505',
    fontSize: 15,
  },
  teacherRoleLabel: {
    color: '#65676B',
    fontSize: 13,
    marginTop: 2,
  },

  // ─── Join button — pill-shaped Facebook blue ───────────────────────────────
  joinButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1877F2',
    borderRadius: 9999,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButtonLoading: {
    backgroundColor: '#CED0D4',
  },
  joinButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },

  // ─── Status badges — pill-shaped ──────────────────────────────────────────
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  statusText: {
    fontWeight: '700',
    fontSize: 12,
  },
  // "Đã tham gia": green pill
  enrolledBadge: {
    backgroundColor: '#E6F4EA',
  },
  enrolledText: {
    color: '#1E8E3E',
  },
  // "Đang chờ": orange pill
  pendingBadge: {
    backgroundColor: '#FEF3E2',
  },
  pendingText: {
    color: '#E37400',
  },

  // ─── Shared user pressable area (avatar + name) ────────────────────────────
  userArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  // ─── Request card — Facebook "Friend Requests" style ──────────────────────
  requestCard: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    fontWeight: '700',
    color: '#050505',
    fontSize: 15,
  },
  requestSub: {
    color: '#65676B',
    fontSize: 13,
    marginTop: 2,
  },
  // Bottom action row: 2 full-width buttons + 3-dot
  requestActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  approveButton: {
    flex: 1,
    height: 36,
    backgroundColor: '#1877F2',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  rejectButton: {
    flex: 1,
    height: 36,
    backgroundColor: '#E4E6EB',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButtonText: {
    color: '#050505',
    fontWeight: '600',
    fontSize: 14,
  },

  // ─── Student row (teacher view – students tab) ─────────────────────────────
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  studentName: {
    flex: 1,
    fontWeight: '600',
    color: '#050505',
    fontSize: 15,
  },

  // ─── Three-dot menu button ─────────────────────────────────────────────────
  menuButton: {
    height: 36,
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#F0F2F5',
  },
  menuDots: {
    color: '#65676B',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1,
  },

  // ─── Modal ─────────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  menuCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  menuTitle: {
    fontWeight: '700',
    color: '#050505',
    marginBottom: 8,
    fontSize: 15,
  },
  menuItem: {
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderTopColor: '#E4E6EB',
  },
  menuItemDanger: {
    color: '#FA3E3E',
    fontWeight: '700',
    fontSize: 15,
  },
  menuItemCancel: {
    color: '#65676B',
    fontWeight: '600',
    fontSize: 15,
  },

  // ─── Enrolled course card (HV đã vào lớp) ────────────────────────────────
  enrolledCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  submitBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#1877F2',
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },

  // ─── Teacher create exercise card ──────────────────────────────────────────
  createExerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 4,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    padding: 14,
    gap: 12,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  createExerciseIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createExerciseIcon: {
    fontSize: 22,
  },
  createExerciseInfo: {
    flex: 1,
  },
  createExerciseTitle: {
    fontWeight: '800',
    color: '#fff',
    fontSize: 15,
  },
  createExerciseDesc: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    marginTop: 2,
  },
  createExerciseArrow: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '300',
  },
});
