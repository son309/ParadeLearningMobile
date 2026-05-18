import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { theme } from '../../constants/theme';
import { courseApi } from '../../network/courseApi';
import { userApi } from '../../network/userApi';
import { useAuthStore } from '../../store/authStore';
import type {
  CourseItem,
  EnrollmentRequestItem,
  StudentItem,
} from '../../types/course';
import Avatar from '../../components/Avatar';
import {
  MOCK_COURSES,
  MOCK_REQUESTS,
  MOCK_STUDENTS,
} from '../../utils/mockData';

const PAGE_SIZE = 10;

const ensureOnline = async () => {
  const state = await NetInfo.fetch();
  if (!state.isConnected) {
    Alert.alert('No Internet Connection');
    return false;
  }
  return true;
};

const pendingKey = (userId: string) => `pending_requests_${userId}`;

export default function CourseScreen() {
  const { token, user } = useAuthStore();
  const role = user?.role;
  const isTeacher = role === 'GV';

  return (
    <SafeAreaView style={styles.container}>
      {isTeacher ? <TeacherView /> : <StudentView />}
    </SafeAreaView>
  );
}

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
      const [requestData, studentData] = await Promise.all([
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

      const mappedRequests = Array.isArray(requestData?.data)
        ? requestData.data.map((item: any) => item.request)
        : [];
      setRequests(mappedRequests);
      setStudents(
        Array.isArray(studentData?.students) ? studentData.students : [],
      );
    } catch (error: any) {
      Alert.alert(error?.message || 'Khong the tai danh sach');
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
        accept ? 'Xac nhan duyet?' : 'Xac nhan tu choi?',
        'Ban chac chan muon tiep tuc?',
        [
          { text: 'Huy', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Dong y', onPress: () => resolve(true) },
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
      Alert.alert(error?.message || 'Khong the cap nhat yeu cau');
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
      Alert.alert(error?.message || 'Khong the chan nguoi dung');
    }
  };

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Course Requests</Text>
        <Pressable
          onPress={() => navigation.navigate('Search')}
          style={styles.headerAction}
        >
          <Text style={styles.headerActionText}>Search</Text>
        </Pressable>
      </View>
      <View style={styles.tabs}>
        <Pressable
          onPress={() => setTab('requests')}
          style={[styles.tabButton, tab === 'requests' && styles.tabActive]}
        >
          <Text
            style={[styles.tabText, tab === 'requests' && styles.tabTextActive]}
          >
            Requests
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTab('students')}
          style={[styles.tabButton, tab === 'students' && styles.tabActive]}
        >
          <Text
            style={[styles.tabText, tab === 'students' && styles.tabTextActive]}
          >
            Students
          </Text>
        </Pressable>
      </View>

      {tab === 'requests' ? (
        <FlatList
          data={requests}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={load}
          ListEmptyComponent={
            !loading ? (
              <Text style={styles.emptyText}>Khong co yeu cau</Text>
            ) : null
          }
          renderItem={({ item }) => (
            <View style={styles.requestCard}>
              <Avatar uri={item.avatar} name={item.user_name} size={52} />
              <View style={styles.requestInfo}>
                <Text style={styles.requestName}>{item.user_name}</Text>
                <Text style={styles.requestSub}>Muon tham gia lop</Text>
                <View style={styles.requestActions}>
                  <Pressable
                    style={styles.primaryButton}
                    onPress={() => approveRequest(item.id, true)}
                  >
                    <Text style={styles.primaryButtonText}>Accept</Text>
                  </Pressable>
                  <Pressable
                    style={styles.secondaryButton}
                    onPress={() => approveRequest(item.id, false)}
                  >
                    <Text style={styles.secondaryButtonText}>Delete</Text>
                  </Pressable>
                </View>
              </View>
              <Pressable
                style={styles.menuButton}
                onPress={() =>
                  setMenuTarget({
                    id: item.id,
                    name: item.user_name,
                    avatar: item.avatar,
                  })
                }
              >
                <Text style={styles.menuText}>...</Text>
              </Pressable>
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
              <Text style={styles.emptyText}>Chua co hoc vien</Text>
            ) : null
          }
          renderItem={({ item }) => (
            <View style={styles.studentRow}>
              <Avatar uri={item.avatar} name={item.name} size={44} />
              <Text style={styles.studentName}>{item.name}</Text>
              <Pressable
                style={styles.menuButton}
                onPress={() => setMenuTarget(item)}
              >
                <Text style={styles.menuText}>...</Text>
              </Pressable>
            </View>
          )}
        />
      )}

      <Modal transparent visible={!!menuTarget} animationType="fade">
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setMenuTarget(null)}
        >
          <View style={styles.menuCard}>
            <Text style={styles.menuTitle}>{menuTarget?.name}</Text>
            <Pressable
              style={styles.menuItem}
              onPress={() => menuTarget && blockStudent(menuTarget.id)}
            >
              <Text style={styles.menuItemText}>Block</Text>
            </Pressable>
            <Pressable
              style={styles.menuItem}
              onPress={() => setMenuTarget(null)}
            >
              <Text style={styles.menuItemCancel}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

function StudentView() {
  const navigation = useNavigation<any>();
  const { token, user } = useAuthStore();
  const [teacherId, setTeacherId] = useState('');
  const [pending, setPending] = useState<string[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPending = useCallback(async () => {
    if (!user?.id) {
      return;
    }
    const stored = await AsyncStorage.getItem(pendingKey(user.id));
    if (stored) {
      try {
        setPending(JSON.parse(stored) as string[]);
      } catch {
        setPending([]);
      }
    }
  }, [user?.id]);

  const loadCourses = useCallback(async () => {
    if (!token || !user?.id) {
      return;
    }
    if (token === 'mock-token') {
      setCourses(MOCK_COURSES);
      return;
    }
    if (!(await ensureOnline())) {
      return;
    }
    setLoading(true);
    try {
      const data = await courseApi.getListCoursesOfStudent({
        token,
        user_id: user.id,
        index: '0',
        count: PAGE_SIZE.toString(),
      });
      const nextCourses = Array.isArray(data?.courses) ? data.courses : [];
      setCourses(nextCourses);

      const approvedIds = new Set(
        nextCourses.map((course: CourseItem) => course.id),
      );
      const nextPending = pending.filter(id => !approvedIds.has(id));
      if (nextPending.length !== pending.length) {
        setPending(nextPending);
        await AsyncStorage.setItem(
          pendingKey(user.id),
          JSON.stringify(nextPending),
        );
      }
    } catch (error: any) {
      Alert.alert(error?.message || 'Khong the tai danh sach khoa hoc');
    } finally {
      setLoading(false);
    }
  }, [token, user?.id, pending]);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const submitRequest = async () => {
    if (!token || !user?.id) {
      return;
    }
    if (!teacherId.trim()) {
      return;
    }
    if (token === 'mock-token') {
      const nextPending = Array.from(new Set([teacherId.trim(), ...pending]));
      setPending(nextPending);
      if (user?.id) {
        await AsyncStorage.setItem(
          pendingKey(user.id),
          JSON.stringify(nextPending),
        );
      }
      setTeacherId('');
      return;
    }
    if (!(await ensureOnline())) {
      return;
    }
    try {
      await courseApi.setRequestCourse({
        token,
        course_id: teacherId.trim(),
        user_id: user.id,
      });

      const nextPending = Array.from(new Set([teacherId.trim(), ...pending]));
      setPending(nextPending);
      await AsyncStorage.setItem(
        pendingKey(user.id),
        JSON.stringify(nextPending),
      );
      setTeacherId('');
      loadCourses();
    } catch (error: any) {
      Alert.alert(error?.message || 'Khong the gui yeu cau');
    }
  };

  const approvedIds = useMemo(() => new Set(courses.map(c => c.id)), [courses]);

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Requests</Text>
        <Pressable
          onPress={() => navigation.navigate('Search')}
          style={styles.headerAction}
        >
          <Text style={styles.headerActionText}>Search</Text>
        </Pressable>
      </View>
      <View style={styles.studentCard}>
        <Text style={styles.studentTitle}>Send request</Text>
        <TextInput
          value={teacherId}
          onChangeText={setTeacherId}
          placeholder="Teacher ID"
          placeholderTextColor={theme.colors.muted}
          style={styles.input}
        />
        <Pressable style={styles.primaryButton} onPress={submitRequest}>
          <Text style={styles.primaryButtonText}>Request</Text>
        </Pressable>
      </View>
      <FlatList
        data={pending}
        keyExtractor={item => item}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={loadCourses}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.emptyText}>Khong co yeu cau</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>{item}</Text>
            <Text style={styles.statusValue}>
              {approvedIds.has(item) ? 'Approved' : 'Pending'}
            </Text>
          </View>
        )}
        ListHeaderComponent={
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Approval status</Text>
          </View>
        }
      />
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Enrolled courses</Text>
      </View>
      <FlatList
        data={courses}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.emptyText}>Chua co khoa hoc</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.studentRow}>
            <Avatar uri={item.avatar} name={item.name} size={44} />
            <Text style={styles.studentName}>{item.name}</Text>
          </View>
        )}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  headerAction: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surface2,
  },
  headerActionText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    color: theme.colors.muted,
    fontWeight: '600',
  },
  tabTextActive: {
    color: theme.colors.primary,
  },
  list: {
    paddingBottom: theme.spacing.lg,
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.muted,
    paddingVertical: theme.spacing.lg,
  },
  requestCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.sm,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    fontWeight: '700',
    color: theme.colors.text,
  },
  requestSub: {
    color: theme.colors.muted,
    fontSize: 12,
  },
  requestActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  primaryButton: {
    flex: 1,
    height: 40,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: theme.colors.surface,
    fontWeight: '700',
  },
  secondaryButton: {
    flex: 1,
    height: 40,
    backgroundColor: theme.colors.surface2,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  menuButton: {
    height: 32,
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: theme.colors.surface2,
  },
  menuText: {
    color: theme.colors.muted,
    fontWeight: '700',
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  studentName: {
    flex: 1,
    fontWeight: '600',
    color: theme.colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  menuCard: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
  },
  menuTitle: {
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  menuItem: {
    paddingVertical: theme.spacing.sm,
  },
  menuItemText: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  menuItemCancel: {
    color: theme.colors.muted,
    fontWeight: '600',
  },
  studentCard: {
    margin: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  studentTitle: {
    fontWeight: '700',
    color: theme.colors.text,
  },
  input: {
    backgroundColor: theme.colors.surface2,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    color: theme.colors.text,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.sm,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statusLabel: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  statusValue: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  sectionHeader: {
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  sectionTitle: {
    fontWeight: '700',
    color: theme.colors.text,
  },
});
