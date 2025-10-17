"use client"; 
import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { doc, getDoc, collection, getDocs, query, where, orderBy, addDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { 
  User, 
  BookOpen, 
  Activity, 
  Clock,
  Users, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  UserPlus, 
  Eye, 
  Phone,
  Mail,
  CheckCircle,
  AlertCircle,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download,
  RefreshCw,
  Trash2,
  X,
  Plus,
  Edit,
  UserCheck
} from "lucide-react";
import { motion } from "framer-motion";
import CheckAuth from "../../lib/CheckAuth";
import { makeAuthenticatedRequest } from "@/lib/authUtils";
import { createCourseUrl } from "../../lib/urlUtils";
import EnquiryManager from "../../components/EnquiryManager";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [courseTitles, setCourseTitles] = useState([]);
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [studentDocId, setStudentDocId] = useState(null);
  const [totalFee, setTotalFee] = useState(0);
  const [paidFee, setPaidFee] = useState(0);
  const [payAmount, setPayAmount] = useState("");
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const [phone, setPhone] = useState("");
  const [courseName, setCourseName] = useState("");
    const [courseProgress, setCourseProgress] = useState({});

  // Admin Analytics Data
  const [analyticsData, setAnalyticsData] = useState({
    totalStudents: 0,
    newJoiners: [],
    totalRevenue: 0,
    pendingPayments: 0,
    enquiries: [],
    demoSessions: [],
    paymentStats: [],
    attendanceStats: [],
    courseStats: {},
    enquiryStats: {},
    demoStats: {}
  });
  
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  
  // New Joiners pagination
  const [newJoinersPage, setNewJoinersPage] = useState(0);
  const joinersPerPage = 5;
  
  // Admin-specific state
  const [showEmailList, setShowEmailList] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [adminEnquiries, setAdminEnquiries] = useState([]);
  const [loadingEnquiries, setLoadingEnquiries] = useState(false);
  const [adminDemoSessions, setAdminDemoSessions] = useState([]);
  const [loadingDemoSessions, setLoadingDemoSessions] = useState(false);
  
  // Demo Groups Management
  const [showDemoGroupsModal, setShowDemoGroupsModal] = useState(false);
  const [demoGroups, setDemoGroups] = useState([]);
  const [loadingDemoGroups, setLoadingDemoGroups] = useState(false);
  const [showCreateGroupForm, setShowCreateGroupForm] = useState(false);
  const [newGroupData, setNewGroupData] = useState({
    name: '',
    course: '',
    startDate: '',
    schedule: '',
    maxStudents: '',
    description: ''
  });
  
  // Allow Demo - Assign enquiry to demo group
  const [showAssignDemoModal, setShowAssignDemoModal] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [assigningToGroup, setAssigningToGroup] = useState(false);
  
  // Edit Demo Group
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [editGroupData, setEditGroupData] = useState(null);
  const [removingStudent, setRemovingStudent] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [savingGroupChanges, setSavingGroupChanges] = useState(false);
  
  // Send Email Modal
  const [showSendEmailModal, setShowSendEmailModal] = useState(false);
  const [demoLink, setDemoLink] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push("/auth/login");
        return;
      }

      setUser(u);

      // Get user role from users collection
      const userRef = doc(db, "users", u.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const udata = userSnap.data();
        setRole(udata.role || "user");
      } else {
        setRole("user");
      }
      

      // Query students collection where uid == authenticated user uid
      const studentsRef = collection(db, "students");
      const q = query(studentsRef, where("uid", "==", u.uid));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const docRefSnap = querySnapshot.docs[0];
        const studentData = docRefSnap.data();
        setStudentDocId(docRefSnap.id);
        setDisplayName(studentData.name || u.email);

        const titles = Array.isArray(studentData.coursesTitle)
          ? studentData.coursesTitle
          : studentData.coursesTitle
          ? [studentData.coursesTitle]
          : [];

        setCourseTitles(titles);
        const tf = Number(studentData.totalFee ?? 0);
        const pf = Number(studentData.PayedFee ?? 0); // Use correct field name from Firebase
        setTotalFee(tf);
        setPaidFee(pf);
        const dueCalc = Math.max(tf - pf, 0);
        setPayAmount(dueCalc > 0 ? String(dueCalc) : "");
        
        // Extract phone and course info
        setPhone(studentData.phone || "");
        setCourseName(titles.length > 0 ? titles.join(", ") : "");
      } else {
        setDisplayName(u.email);
        setCourseTitles([]);
        setStudentDocId(null);
        setTotalFee(0);
        setPaidFee(0);
        setPayAmount("");
        setPhone("");
        setCourseName("");
      }

      setLoading(false);
    });

    return () => unsub();
  }, [router]);

  // Fetch course progress data
  useEffect(() => {
    async function fetchCourseProgress() {
      if (!user || !studentDocId || courseTitles.length === 0) return;

      try {
        const progressData = {};
        
        // Get all courses
        const coursesRef = collection(db, "courses");
        const coursesSnap = await getDocs(coursesRef);
        const allCourses = coursesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        // Get student data for chapter access
        const studentRef = doc(db, "students", studentDocId);
        const studentSnap = await getDoc(studentRef);
        const studentData = studentSnap.exists() ? studentSnap.data() : {};

        for (const courseTitle of courseTitles) {
          // Find matching course
          const course = allCourses.find(c => c.title === courseTitle);
          if (!course) continue;

          // Get total chapters for this course
          const chaptersRef = collection(db, "courses", course.id, "chapters");
          const chaptersQuery = query(chaptersRef, orderBy("order", "asc"));
          const chaptersSnap = await getDocs(chaptersQuery);
          const totalChapters = chaptersSnap.size;

          // Get accessible chapters
          const accessibleChapters = studentData.chapterAccess?.[course.id] || [];
          const openedChapters = accessibleChapters.length;

          // Calculate percentage
          const percentage = totalChapters > 0 ? Math.round((openedChapters / totalChapters) * 100) : 0;

          progressData[courseTitle] = {
            courseId: course.id,
            totalChapters,
            openedChapters,
            percentage,
            courseSlug: createCourseUrl(courseTitle)
          };
        }

        setCourseProgress(progressData);
      } catch (error) {
        console.error("Error fetching course progress:", error);
      }
    }

    fetchCourseProgress();
  }, [user, studentDocId, courseTitles]);

  const fetchAdminEnquiries = async () => {
    if (role !== "admin" && role !== "superadmin") return;
    
    setLoadingEnquiries(true);
    try {
      // Use client-side Firebase to avoid Windows SSL/Admin SDK issues
      const enquiriesRef = collection(db, "enquiries");
      const enquiriesQuery = query(enquiriesRef, orderBy("createdAt", "desc"));
      const enquiriesSnap = await getDocs(enquiriesQuery);
      
      const enquiries = enquiriesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
      }));

      setAdminEnquiries(enquiries);
    } catch (err) {
      console.error('Failed to fetch enquiries:', err);
    } finally {
      setLoadingEnquiries(false);
    }
  };

  const fetchAdminDemoSessions = async () => {
    if (role !== "admin" && role !== "superadmin") return;
    
    setLoadingDemoSessions(true);
    try {
      // Use client-side Firebase to avoid Windows SSL/Admin SDK issues
      const demoSessionsRef = collection(db, "demoSessions");
      const demoSessionsQuery = query(demoSessionsRef, orderBy("createdAt", "desc"));
      const demoSessionsSnap = await getDocs(demoSessionsQuery);
      
      const demoSessions = demoSessionsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
      }));

      setAdminDemoSessions(demoSessions);
    } catch (err) {
      console.error('Failed to fetch demo sessions:', err);
    } finally {
      setLoadingDemoSessions(false);
    }
  };

  const fetchDemoGroups = async () => {
    setLoadingDemoGroups(true);
    try {
      const demoGroupsRef = collection(db, "demoGroups");
      const demoGroupsSnap = await getDocs(demoGroupsRef);
      const groups = demoGroupsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDemoGroups(groups);
    } catch (err) {
      console.error('Failed to fetch demo groups:', err);
      alert('Failed to load demo groups');
    } finally {
      setLoadingDemoGroups(false);
    }
  };

  const handleCreateDemoGroup = async (e) => {
    e.preventDefault();
    
    if (!newGroupData.name || !newGroupData.course || !newGroupData.startDate) {
      alert('Please fill in all required fields (Name, Course, Start Date)');
      return;
    }

    try {
      const demoGroupsRef = collection(db, "demoGroups");
      const newGroup = {
        ...newGroupData,
        maxStudents: parseInt(newGroupData.maxStudents) || 20,
        enrolledStudents: [],
        createdAt: new Date().toISOString(),
        createdBy: user.uid,
        status: 'active'
      };

      await addDoc(demoGroupsRef, newGroup);
      
      alert('Demo group created successfully!');
      setNewGroupData({
        name: '',
        course: '',
        startDate: '',
        schedule: '',
        maxStudents: '',
        description: ''
      });
      setShowCreateGroupForm(false);
      fetchDemoGroups();
    } catch (err) {
      console.error('Failed to create demo group:', err);
      alert('Failed to create demo group. Please try again.');
    }
  };

  const handleOpenDemoGroups = () => {
    setShowDemoGroupsModal(true);
    fetchDemoGroups();
  };

  const handleAllowDemo = (enquiry) => {
    setSelectedEnquiry(enquiry);
    setShowAssignDemoModal(true);
    fetchDemoGroups(); // Load demo groups for selection
  };

  const handleAssignToGroup = async (groupId) => {
    if (!selectedEnquiry || !groupId) return;
    
    setAssigningToGroup(true);
    try {
      // Get the selected group details
      const group = demoGroups.find(g => g.id === groupId);
      if (!group) {
        alert('Demo group not found');
        return;
      }

      // Create a demo session entry
      const demoSessionsRef = collection(db, "demoSessions");
      const newDemoSession = {
        studentName: selectedEnquiry.name,
        email: selectedEnquiry.email,
        phone: selectedEnquiry.phone,
        course: selectedEnquiry.course || group.course,
        groupId: groupId,
        groupName: group.name,
        scheduledDate: group.startDate,
        schedule: group.schedule || '',
        attendance: 'pending',
        notes: `Assigned from enquiry on ${new Date().toLocaleDateString()}`,
        enquiryId: selectedEnquiry.id,
        createdAt: new Date().toISOString(),
        createdBy: user.uid,
        status: 'scheduled'
      };

      await addDoc(demoSessionsRef, newDemoSession);

      // Update the enquiry status to "demo_scheduled" (use client-side Firestore)
      if (selectedEnquiry.id) {
        const enquiryRef = doc(db, "enquiries", selectedEnquiry.id);
        await updateDoc(enquiryRef, {
          status: 'demo_scheduled',
          demoGroupId: groupId,
          demoGroupName: group.name,
          updatedAt: serverTimestamp()
        });
      }

      // Update group's enrolled students
      const groupRef = doc(db, "demoGroups", groupId);
      const groupSnap = await getDoc(groupRef);
      if (groupSnap.exists()) {
        const currentEnrolled = groupSnap.data().enrolledStudents || [];
        await updateDoc(groupRef, {
          enrolledStudents: [...currentEnrolled, {
            name: selectedEnquiry.name,
            email: selectedEnquiry.email,
            phone: selectedEnquiry.phone,
            addedAt: new Date().toISOString()
          }]
        });
      }

      alert(`Successfully assigned ${selectedEnquiry.name} to ${group.name}!`);
      
      // Refresh data
      fetchAdminEnquiries();
      fetchAdminDemoSessions();
      fetchDemoGroups();
      
      // Close modals
      setShowAssignDemoModal(false);
      setSelectedEnquiry(null);
    } catch (err) {
      console.error('Failed to assign to demo group:', err);
      alert('Failed to assign student to demo group. Please try again.');
    } finally {
      setAssigningToGroup(false);
    }
  };

  const handleEditGroup = (group) => {
    setSelectedGroup(group);
    setEditGroupData({
      name: group.name || '',
      course: group.course || '',
      startDate: group.startDate || '',
      schedule: group.schedule || '',
      maxStudents: group.maxStudents || 20,
      description: group.description || '',
      status: group.status || 'active'
    });
    setShowEditGroupModal(true);
  };

  const handleSaveGroupChanges = async () => {
    if (!selectedGroup || !editGroupData) return;
    
    if (!editGroupData.name || !editGroupData.course || !editGroupData.startDate) {
      alert('Please fill in all required fields (Name, Course, Start Date)');
      return;
    }

    setSavingGroupChanges(true);
    try {
      const groupRef = doc(db, "demoGroups", selectedGroup.id);
      await updateDoc(groupRef, {
        name: editGroupData.name,
        course: editGroupData.course,
        startDate: editGroupData.startDate,
        schedule: editGroupData.schedule,
        maxStudents: parseInt(editGroupData.maxStudents) || 20,
        description: editGroupData.description,
        status: editGroupData.status,
        updatedAt: new Date().toISOString()
      });

      // Update local state
      const updatedGroup = {
        ...selectedGroup,
        ...editGroupData,
        maxStudents: parseInt(editGroupData.maxStudents) || 20
      };
      
      setSelectedGroup(updatedGroup);
      setDemoGroups(demoGroups.map(g => 
        g.id === selectedGroup.id ? updatedGroup : g
      ));

      alert('Demo group updated successfully!');
      fetchDemoGroups(); // Refresh to get latest data
    } catch (err) {
      console.error('Failed to update demo group:', err);
      alert('Failed to update demo group. Please try again.');
    } finally {
      setSavingGroupChanges(false);
    }
  };

  const handleRemoveStudentFromGroup = async (studentEmail) => {
    if (!selectedGroup || !studentEmail) return;
    
    if (!confirm(`Are you sure you want to remove this student from ${selectedGroup.name}?\n\nThis will also update their enquiry status back to "contacted".`)) {
      return;
    }

    setRemovingStudent(true);
    try {
      const groupRef = doc(db, "demoGroups", selectedGroup.id);
      const groupSnap = await getDoc(groupRef);
      
      if (groupSnap.exists()) {
        const currentEnrolled = groupSnap.data().enrolledStudents || [];
        const updatedEnrolled = currentEnrolled.filter(s => s.email !== studentEmail);
        
        await updateDoc(groupRef, {
          enrolledStudents: updatedEnrolled
        });

        // Find and update the corresponding enquiry status
        try {
          const enquiriesRef = collection(db, "enquiries");
          const enquiryQuery = query(enquiriesRef, where("email", "==", studentEmail));
          const enquirySnapshot = await getDocs(enquiryQuery);
          
          if (!enquirySnapshot.empty) {
            // Update the first matching enquiry (client-side Firestore only)
            const enquiryDoc = enquirySnapshot.docs[0];
            await updateDoc(doc(db, "enquiries", enquiryDoc.id), {
              status: 'contacted',
              demoGroupId: null,
              demoGroupName: null,
              removedFromGroupAt: new Date().toISOString(),
              updatedAt: serverTimestamp()
            });
          }
        } catch (enquiryErr) {
          console.warn('Could not update enquiry status:', enquiryErr);
          // Continue anyway - group update is more important
        }

        // Update demo session status if exists
        try {
          const demoSessionsRef = collection(db, "demoSessions");
          const sessionQuery = query(
            demoSessionsRef, 
            where("email", "==", studentEmail),
            where("groupId", "==", selectedGroup.id)
          );
          const sessionSnapshot = await getDocs(sessionQuery);
          
          if (!sessionSnapshot.empty) {
            // Mark demo session as cancelled
            for (const sessionDoc of sessionSnapshot.docs) {
              await updateDoc(doc(db, "demoSessions", sessionDoc.id), {
                status: 'cancelled',
                attendance: 'cancelled',
                cancelledAt: new Date().toISOString(),
                cancellationReason: 'Removed from demo group'
              });
            }
          }
        } catch (sessionErr) {
          console.warn('Could not update demo session:', sessionErr);
        }

        // Update local state
        setSelectedGroup({
          ...selectedGroup,
          enrolledStudents: updatedEnrolled
        });

        // Update demoGroups list
        setDemoGroups(demoGroups.map(g => 
          g.id === selectedGroup.id 
            ? { ...g, enrolledStudents: updatedEnrolled }
            : g
        ));

        // Refresh enquiries and demo sessions to show updated status
        if (role === "superadmin") {
          fetchAnalytics();
        }
        fetchAdminEnquiries();
        fetchAdminDemoSessions();

        alert('✅ Student removed successfully!\n\n• Removed from demo group\n• Enquiry status updated to "contacted"\n• Demo session cancelled');
      }
    } catch (err) {
      console.error('Failed to remove student:', err);
      alert('❌ Failed to remove student. Please try again.');
    } finally {
      setRemovingStudent(false);
    }
  };

  const handleOpenSendEmailModal = (group) => {
    setSelectedGroup(group);
    setShowSendEmailModal(true);
    setDemoLink('');
  };

  const handleDeleteDemoGroup = async (groupId, groupName) => {
    if (!confirm(`⚠️ Are you sure you want to delete "${groupName}"?\n\nThis will:\n• Remove all enrolled students from the group\n• Update their enquiry status back to "contacted"\n• Cancel all associated demo sessions\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      const groupRef = doc(db, "demoGroups", groupId);
      const groupSnap = await getDoc(groupRef);
      
      if (groupSnap.exists()) {
        const groupData = groupSnap.data();
        const enrolledStudents = groupData.enrolledStudents || [];

        // Update all enquiries associated with this group
        if (enrolledStudents.length > 0) {
          for (const student of enrolledStudents) {
            try {
              // Find and update enquiry
              const enquiriesRef = collection(db, "enquiries");
              const enquiryQuery = query(enquiriesRef, where("email", "==", student.email));
              const enquirySnapshot = await getDocs(enquiryQuery);
              
              if (!enquirySnapshot.empty) {
                const enquiryDoc = enquirySnapshot.docs[0];
                await updateDoc(doc(db, "enquiries", enquiryDoc.id), {
                  status: 'contacted',
                  demoGroupId: null,
                  demoGroupName: null,
                  groupDeletedAt: new Date().toISOString(),
                  updatedAt: serverTimestamp()
                });
              }

              // Cancel demo sessions
              const demoSessionsRef = collection(db, "demoSessions");
              const sessionQuery = query(
                demoSessionsRef,
                where("email", "==", student.email),
                where("groupId", "==", groupId)
              );
              const sessionSnapshot = await getDocs(sessionQuery);
              
              if (!sessionSnapshot.empty) {
                for (const sessionDoc of sessionSnapshot.docs) {
                  await updateDoc(doc(db, "demoSessions", sessionDoc.id), {
                    status: 'cancelled',
                    attendance: 'cancelled',
                    cancelledAt: new Date().toISOString(),
                    cancellationReason: 'Demo group deleted'
                  });
                }
              }
            } catch (err) {
              console.warn(`Failed to update records for ${student.email}:`, err);
            }
          }
        }

        // Delete the group
        await deleteDoc(groupRef);

        alert(`✅ Demo group "${groupName}" deleted successfully!\n\n• ${enrolledStudents.length} students removed\n• Enquiries updated\n• Demo sessions cancelled`);
        
        // Refresh data
        fetchDemoGroups();
        if (role === "superadmin") {
          fetchAnalytics();
        }
        fetchAdminEnquiries();
        fetchAdminDemoSessions();
        
        // Close any open modals
        setShowEditGroupModal(false);
        setShowDemoGroupsModal(false);
      }
    } catch (err) {
      console.error('Failed to delete demo group:', err);
      alert('❌ Failed to delete demo group. Please try again.');
    }
  };

  const handleSendEmailToGroup = async () => {
    if (!selectedGroup) return;
    
    const students = selectedGroup.enrolledStudents || [];
    if (students.length === 0) {
      alert('No students in this group to email.');
      return;
    }

    // Validate demo link (optional but recommended)
    if (demoLink && !demoLink.startsWith('http')) {
      alert('Please enter a valid URL starting with http:// or https://');
      return;
    }

    if (!confirm(`Send demo invitation email to ${students.length} student(s)?\n\nEmails will be sent using BCC for privacy.`)) {
      return;
    }

    setSendingEmail(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/demo-sessions/send-group-email', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupId: selectedGroup.id,
          demoLink: demoLink || '',
          group: {
            id: selectedGroup.id,
            name: selectedGroup.name,
            course: selectedGroup.course,
            startDate: selectedGroup.startDate,
            schedule: selectedGroup.schedule || '',
            enrolledStudents: selectedGroup.enrolledStudents || []
          }
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert(`✅ Success!\n\nEmails sent to ${result.recipientCount} students using BCC.\n\nGroup: ${result.groupName}\n\nAll students will receive the demo invitation email from Vawe Institute.`);
        setShowSendEmailModal(false);
        setDemoLink('');
        setSelectedGroup(null);
      } else {
        throw new Error(result.error || 'Failed to send emails');
      }
    } catch (err) {
      console.error('Failed to send group email:', err);
      alert(`❌ Failed to send emails.\n\nError: ${err.message}\n\nPlease check your email configuration and try again.`);
    } finally {
      setSendingEmail(false);
    }
  };

  useEffect(() => {
    if (role === "superadmin") {
      fetchAnalytics();
      fetchAdminEnquiries();
      fetchAdminDemoSessions();
      fetchDemoGroups();
    } else if (role === "admin") {
      fetchAdminEnquiries();
      fetchAdminDemoSessions();
      fetchDemoGroups();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod, role]);

  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        console.warn("No auth token available, using fallback data");
        throw new Error("No auth token");
      }

      const response = await fetch(`/api/admin/analytics?period=${selectedPeriod}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.warn(`Analytics API returned status ${response.status}, using fallback data`);
        throw new Error(`API returned status ${response.status}`);
      }

      const result = await response.json();
      if (result.success && result.analytics) {
        setAnalyticsData(result.analytics);
        setLoadingAnalytics(false);
        return;
      } else {
        console.warn("Invalid analytics response, using fallback data");
        throw new Error(result.error || 'Invalid response format');
      }
    } catch (error) {
      console.warn("Analytics API failed, loading basic data from Firestore:", error.message);
      
      // Fallback to basic student data from Firestore
      try {
        const studentsSnapshot = await getDocs(collection(db, "students"));
        const students = studentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        const totalRevenue = students.reduce((sum, student) => {
          return sum + (Number(student.PayedFee) || 0);
        }, 0);

        const pendingPayments = students.reduce((sum, student) => {
          const totalFee = Number(student.totalFee) || 0;
          const paidFee = Number(student.PayedFee) || 0;
          return sum + Math.max(0, totalFee - paidFee);
        }, 0);

        // Get recent joiners (last 30 days)
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const newJoiners = students.filter(student => {
          if (student.createdAt) {
            const createdDate = student.createdAt.toDate ? student.createdAt.toDate() : new Date(student.createdAt);
            return createdDate >= thirtyDaysAgo;
          }
          return false;
        });

        setAnalyticsData({
          totalStudents: students.length,
          newJoiners: newJoiners,
          totalRevenue,
          pendingPayments,
          enquiries: [],
          demoSessions: [],
          paymentStats: [],
          attendanceStats: [],
          courseStats: {},
          enquiryStats: {},
          demoStats: {}
        });

        console.log("✅ Loaded basic analytics data from Firestore");
      } catch (fallbackError) {
        console.error("Fallback analytics fetch failed:", fallbackError);
        // Set minimal empty data to prevent UI crashes
        setAnalyticsData({
          totalStudents: 0,
          newJoiners: [],
          totalRevenue: 0,
          pendingPayments: 0,
          enquiries: [],
          demoSessions: [],
          paymentStats: [],
          attendanceStats: [],
          courseStats: {},
          enquiryStats: {},
          demoStats: {}
        });
      }
    }
    setLoadingAnalytics(false);
  };

  if (!user || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-600">
        Loading Dashboard...
      </div>
    );
  }

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const handleEnquirySubmit = async (enquiryFormData) => {
    try {
      // Use client-side Firebase to avoid Windows SSL/Admin SDK issues
      const enquiriesRef = collection(db, "enquiries");
      
      const enquiryData = {
        ...enquiryFormData,
        status: enquiryFormData.status || 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        assignedTo: null,
        notes: '',
        followUpDate: null,
        source: 'admin_dashboard'
      };

      await addDoc(enquiriesRef, enquiryData);
      
      alert('Enquiry submitted successfully!');
      
      // Refresh analytics/enquiries to show new enquiry
      if (role === "superadmin") {
        fetchAnalytics();
      }
      fetchAdminEnquiries();
    } catch (err) {
      console.error('Failed to submit enquiry:', err);
      alert(err.message || 'Failed to submit enquiry. Please try again.');
      throw err; // Re-throw to let the component know submission failed
    }
  };

  const handleDeleteEnquiry = async (enquiryId) => {
    if (!confirm('Are you sure you want to delete this enquiry?')) {
      return;
    }

    try {
      // Use client-side Firebase to avoid Windows SSL/Admin SDK issues
      const enquiryRef = doc(db, "enquiries", enquiryId);
      await deleteDoc(enquiryRef);
      
      alert('Enquiry deleted successfully!');
      
      // Refresh the lists
      if (role === "superadmin") {
        fetchAnalytics();
      }
      fetchAdminEnquiries();
    } catch (err) {
      console.error('Failed to delete enquiry:', err);
      alert(err.message || 'Failed to delete enquiry. Please try again.');
    }
  };

  const exportEnquiryEmails = async () => {
    try {
      // Use adminEnquiries state data (already fetched from client-side Firestore)
      if (!adminEnquiries || adminEnquiries.length === 0) {
        alert('No enquiries to export');
        return;
      }
      
      const emails = adminEnquiries.map(e => e.email).join(', ');
      
      // Copy to clipboard
      await navigator.clipboard.writeText(emails);
      alert(`${adminEnquiries.length} email addresses copied to clipboard!\n\nEmail list:\n${emails}`);
    } catch (err) {
      console.error('Failed to export emails:', err);
      alert('Failed to copy emails. Please try again.');
    }
  };

  const downloadEnquiriesCSV = async () => {
    try {
      // Use adminEnquiries state data (already fetched from client-side Firestore)
      if (!adminEnquiries || adminEnquiries.length === 0) {
        alert('No enquiries to download');
        return;
      }
      
      // Create CSV content
      const headers = ['Name', 'Email', 'Phone', 'Course', 'Status', 'Gender', 'Qualification', 'College', 'Year of Passing', 'Work Experience', 'Company', 'Timings Preferred', 'Reference', 'Message', 'Created At'];
      const csvRows = [headers.join(',')];
      
      adminEnquiries.forEach(enquiry => {
        const row = [
          enquiry.name || '',
          enquiry.email || '',
          enquiry.phone || '',
          enquiry.course || '',
          enquiry.status || 'pending',
          enquiry.gender || '',
          enquiry.qualification || '',
          enquiry.college || '',
          enquiry.yearOfPassing || '',
          enquiry.workExp || '',
          enquiry.company || '',
          enquiry.timingsPreferred || '',
          enquiry.reference || '',
          `"${(enquiry.message || '').replace(/"/g, '""')}"`, // Escape quotes in message
          enquiry.createdAt ? new Date(enquiry.createdAt).toLocaleString('en-IN') : ''
        ].map(field => `"${String(field).replace(/"/g, '""')}"`); // Escape all fields
        
        csvRows.push(row.join(','));
      });
      
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `enquiries-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to download CSV:', err);
      alert('Failed to download CSV. Please try again.');
    }
  };

  const createWeeklyBackup = async () => {
    if (!confirm('Create a backup of this week\'s data? This will store all enquiries, new students, and demo sessions.')) {
      return;
    }

    setCreatingBackup(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/admin/weekly-backup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert(`Weekly backup created successfully!\n\nWeek: ${new Date(result.weekStart).toLocaleDateString()} - ${new Date(result.weekEnd).toLocaleDateString()}\n\nEnquiries: ${result.summary.totalEnquiries}\nNew Students: ${result.summary.totalNewStudents}\nDemo Sessions: ${result.summary.totalDemoSessions}\nRevenue: ₹${result.summary.weeklyRevenue}`);
      } else {
        alert(result.error || 'Failed to create backup');
      }
    } catch (err) {
      alert('Network error. Please try again.');
    } finally {
      setCreatingBackup(false);
    }
  };

  function loadRazorpayScript() {
    return new Promise((resolve) => {
      if (typeof window !== "undefined" && window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  const dueAmount = Math.max(totalFee - paidFee, 0);

  function setAmountClamped(val) {
    const num = Number(val);
    if (Number.isNaN(num)) {
      setPayAmount("");
      setPayError("Enter a valid amount");
      return;
    }
    if (num < 0) {
      setPayAmount("0");
      setPayError("Amount cannot be negative");
      return;
    }
    if (num > dueAmount) {
      setPayAmount(String(dueAmount));
      setPayError(`Max allowed is ₹${dueAmount}`);
      return;
    }
    setPayError("");
    setPayAmount(String(num));
  }

  async function handlePayWithRazorpay() {
    if (!studentDocId) return;
    const amountNum = Number(payAmount);
    if (!amountNum || amountNum <= 0) {
      setPayError("Enter a valid amount greater than 0");
      return;
    }
    if (amountNum > dueAmount) {
      setPayError(`Amount cannot exceed due of ₹${dueAmount}`);
      return;
    }

    setPaying(true);
    const sdkLoaded = await loadRazorpayScript();
    if (!sdkLoaded) {
      alert("Failed to load Razorpay SDK");
      setPaying(false);
      return;
    }

    try {
      // Rely on makeAuthenticatedRequest to refresh token; avoid aggressive sign-out here
      if (!auth.currentUser) {
        alert("Please login to continue.");
        router.push("/auth/login");
        return;
      }

      const orderRes = await makeAuthenticatedRequest("/api/payments/razorpay/order-user", {
        method: "POST",
        body: JSON.stringify({ amount: Math.round(amountNum * 100), receipt: studentDocId || user.uid })
      });
      const order = await orderRes.json().catch(() => ({}));
      if (!orderRes.ok) {
        if (orderRes.status === 401) {
          alert("Session expired. Please login again.");
          await signOut(auth);
          router.push("/auth/login");
          return;
        }
        if (orderRes.status === 403) {
          alert(order.error || "Not authorized to pay from this account.");
          setPaying(false);
          return;
        }
        throw new Error(order.error || "Failed to create order");
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Fee Payment",
        description: "Course Fee",
        order_id: order.id,
        prefill: { name: displayName, email: user.email },
        handler: async function (response) {
          try {
            // Verify payment and update fee on server
            const verifyRes = await makeAuthenticatedRequest("/api/verify-payment", {
              method: "POST",
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                amount: Math.round(amountNum * 100),
                studentId: studentDocId,
              }),
            });

            const verifyData = await verifyRes.json().catch(() => ({}));
            if (!verifyRes.ok) throw new Error(verifyData.error || "Verification failed");

            // Server already updated fee; use response to refresh local state
            const newPaid = typeof verifyData.newPaid === 'number' ? verifyData.newPaid : (paidFee + amountNum);
            const newTotal = typeof verifyData.totalFee === 'number' ? verifyData.totalFee : totalFee;
            setPaidFee(newPaid);
            const newDue = Math.max(newTotal - newPaid, 0);
            setPayAmount(newDue > 0 ? String(newDue) : "");
            setPayError("");

            // Redirect to printable receipt with details
            console.log('Receipt params:', {
              totalFee: totalFee,
              paidFee: paidFee,
              amountNum: amountNum,
              phone: phone,
              courseName: courseName,
              dueAmount: totalFee - paidFee
            });
            
            const params = new URLSearchParams({
              payment_id: verifyData.payment_id || response.razorpay_payment_id || "",
              order_id: verifyData.order_id || response.razorpay_order_id || "",
              amount: String(Math.round(amountNum * 100)),
              studentId: studentDocId,
              name: displayName || "",
              email: user.email || "",
              phone: phone || "",
              course: courseName || "",
              totalFee: String(Math.round(totalFee * 100)),
              paidFee: String(Math.round(paidFee * 100)),
              dueAmount: String(Math.round((totalFee - paidFee) * 100)),
              date: new Date().toISOString(),
              paymentMethod: 'online',
              type: 'fee_payment',
            });
            router.push(`/receipt?${params.toString()}`);
          } catch (e) {
            alert(e.message || "Payment processed but update failed");
          } finally {
            setPaying(false);
          }
        },
        modal: { ondismiss: function () { setPaying(false); } },
        theme: { color: "#4F46E5" }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) {
      console.error(e);
      alert(e.message || "Could not start payment");
      setPaying(false);
    }
  }

  // Super Admin Dashboard View (Analytics)
  if (role === "superadmin") {
    return (
      <CheckAuth>
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <div className="bg-white shadow-sm border-b">
            <div className="px-6 py-4">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
                  <p className="text-gray-600 mt-1">Analytics & Management Center</p>
                </div>
                <div className="flex items-center space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push("/Admin")}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg flex items-center space-x-2"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                      <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="font-semibold">Management Panel</span>
                  </motion.button>
                  <button
                    onClick={createWeeklyBackup}
                    disabled={creatingBackup}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center text-sm"
                    title="Backup this week's data"
                  >
                    <Download className={`w-4 h-4 mr-1 ${creatingBackup ? 'animate-bounce' : ''}`} />
                    {creatingBackup ? 'Backing up...' : 'Backup'}
                  </button>
                  <select 
                    value={selectedPeriod} 
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="7d">Last 7 days</option>
                    <option value="15d">Last 15 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="60d">Last 60 days</option>
                    <option value="90d">Last 90 days</option>
                    <option value="all">All Time</option>
                  </select>
                  <button
                    onClick={fetchAnalytics}
                    disabled={loadingAnalytics}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loadingAnalytics ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {loadingAnalytics && (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            )}

            {!loadingAnalytics && (
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-6 rounded-xl shadow-sm border"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Students</p>
                        <p className="text-3xl font-bold text-gray-900">{analyticsData.totalStudents}</p>
                      </div>
                      <div className="p-3 bg-blue-100 rounded-full">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                      <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-green-600 font-medium">+{analyticsData.newJoiners?.length || 0}</span>
                      <span className="text-gray-500 ml-1">new this period</span>
                    </div>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white p-6 rounded-xl shadow-sm border"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                        <p className="text-3xl font-bold text-gray-900">₹{analyticsData.totalRevenue?.toLocaleString() || 0}</p>
                      </div>
                      <div className="p-3 bg-green-100 rounded-full">
                        <DollarSign className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                      <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-green-600 font-medium">+12.5%</span>
                      <span className="text-gray-500 ml-1">from last period</span>
                    </div>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white p-6 rounded-xl shadow-sm border"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                        <p className="text-3xl font-bold text-gray-900">₹{analyticsData.pendingPayments?.toLocaleString() || 0}</p>
                      </div>
                      <div className="p-3 bg-orange-100 rounded-full">
                        <AlertCircle className="w-6 h-6 text-orange-600" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                      <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
                      <span className="text-red-600 font-medium">-5.2%</span>
                      <span className="text-gray-500 ml-1">from last period</span>
                    </div>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white p-6 rounded-xl shadow-sm border"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">New Enquiries</p>
                        <p className="text-3xl font-bold text-gray-900">{analyticsData.enquiries?.length || 0}</p>
                      </div>
                      <div className="p-3 bg-purple-100 rounded-full">
                        <Phone className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm">
                      <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-green-600 font-medium">+{analyticsData.enquiries?.length || 0}</span>
                      <span className="text-gray-500 ml-1">this period</span>
                    </div>
                  </motion.div>
                </div>

                {/* Analytics Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Payment Analytics */}
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white p-6 rounded-xl shadow-sm border"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">Payment Analytics</h3>
                      <div className="flex items-center space-x-2">
                        <Filter className="w-4 h-4 text-gray-400" />
                        <Download className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      {analyticsData.paymentStats?.slice(-7).map((stat, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-sm text-gray-600">{stat.date}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">₹{stat.amount?.toLocaleString() || 0}</p>
                            <p className="text-xs text-gray-500">{stat.transactions || 0} transactions</p>
                          </div>
                        </div>
                      )) || (
                        <div className="text-center py-8 text-gray-500">
                          <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>No payment data available</p>
                        </div>
                      )}
                    </div>
                  </motion.div>

                  {/* Demo Session Attendance */}
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white p-6 rounded-xl shadow-sm border"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">Demo Attendance</h3>
                      <div className="flex items-center space-x-2">
                        <Activity className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-600 font-medium">{analyticsData.demoStats?.attendance || 0}%</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {analyticsData.attendanceStats?.slice(-7).map((stat, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-gray-600">{stat.date}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{stat.attendance || 0}%</p>
                            <p className="text-xs text-gray-500">{stat.totalSessions || 0} sessions</p>
                          </div>
                        </div>
                      )) || (
                        <div className="text-center py-8 text-gray-500">
                          <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p>No attendance data available</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>

                {/* Data Tables Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* New Joiners */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl shadow-sm border"
                  >
                    <div className="p-6 border-b">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">New Joiners ({selectedPeriod})</h3>
                        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                          View All
                        </button>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4">
                        {analyticsData.newJoiners
                          ?.slice(newJoinersPage * joinersPerPage, (newJoinersPage + 1) * joinersPerPage)
                          .map((student, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <UserPlus className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{student.name}</p>
                                <p className="text-xs text-gray-500">{student.email}</p>
                                <p className="text-xs text-blue-600 mt-0.5">{student.coursesTitle?.[0] || 'No Course'}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-medium text-gray-700">
                                {student.createdAt ? new Date(student.createdAt).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                }) : 'Recent'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {student.createdAt ? new Date(student.createdAt).toLocaleTimeString('en-IN', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : ''}
                              </p>
                            </div>
                          </div>
                        ))}
                        {(!analyticsData.newJoiners || analyticsData.newJoiners.length === 0) && (
                          <div className="text-center py-8 text-gray-500">
                            <UserPlus className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>No new joiners in this period</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Pagination Controls */}
                      {analyticsData.newJoiners && analyticsData.newJoiners.length > joinersPerPage && (
                        <div className="mt-4 flex items-center justify-between border-t pt-4">
                          <button
                            onClick={() => setNewJoinersPage(Math.max(0, newJoinersPage - 1))}
                            disabled={newJoinersPage === 0}
                            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            ← Previous
                          </button>
                          <span className="text-xs text-gray-500">
                            Showing {newJoinersPage * joinersPerPage + 1}-{Math.min((newJoinersPage + 1) * joinersPerPage, analyticsData.newJoiners.length)} of {analyticsData.newJoiners.length}
                          </span>
                          <button
                            onClick={() => setNewJoinersPage(newJoinersPage + 1)}
                            disabled={(newJoinersPage + 1) * joinersPerPage >= analyticsData.newJoiners.length}
                            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Next →
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>

                  {/* Recent Enquiries - Add New */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <EnquiryManager
                      onSubmit={handleEnquirySubmit}
                      onExportEmails={exportEnquiryEmails}
                      onDownloadCSV={downloadEnquiriesCSV}
                    />
                  </motion.div>

                  {/* Recent Enquiries - List View */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-white rounded-xl shadow-sm border"
                  >
                    <div className="p-6 border-b">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Enquiries List</h3>
                        {analyticsData.enquiries && analyticsData.enquiries.length > 0 && (
                          <button
                            onClick={() => setShowEmailList(!showEmailList)}
                            className="text-xs text-purple-600 hover:text-purple-700 font-medium px-3 py-1.5 rounded-lg border border-purple-200 hover:bg-purple-50"
                          >
                            {showEmailList ? '← Back to List' : '📧 View Email List'}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="p-6">
                      {/* Email List Display */}
                      {showEmailList ? (
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-gray-900">Email Addresses ({analyticsData.enquiries?.length || 0})</h4>
                            <button
                              onClick={exportEnquiryEmails}
                              className="text-xs text-green-600 hover:text-green-700 font-medium"
                            >
                              Copy All
                            </button>
                          </div>
                          <div className="max-h-60 overflow-y-auto">
                            <div className="space-y-1">
                              {analyticsData.enquiries?.map((enquiry, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200 hover:bg-gray-50">
                                  <span className="text-xs text-gray-700">{enquiry.email}</span>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(enquiry.email);
                                      alert('Email copied: ' + enquiry.email);
                                    }}
                                    className="text-xs text-blue-600 hover:text-blue-700"
                                  >
                                    Copy
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                            <p className="text-xs text-blue-800 font-mono break-all">
                              {analyticsData.enquiries?.map(e => e.email).join(', ')}
                            </p>
                          </div>
                        </div>
                      ) : (
                        /* Enquiries List */
                        <div className="space-y-4">
                          {analyticsData.enquiries?.slice(0, 5).map((enquiry, index) => (
                            <div key={enquiry.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                  <Phone className="w-4 h-4 text-purple-600" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{enquiry.name}</p>
                                  <p className="text-xs text-gray-500">{enquiry.email}</p>
                                  <p className="text-xs text-gray-500">{enquiry.phone}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3">
                                <div className="text-right">
                                  {enquiry.demoGroupName ? (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-300">
                                      <Users className="w-3 h-3 mr-1" />
                                      {enquiry.demoGroupName}
                                    </span>
                                  ) : (
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      enquiry.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-blue-100 text-blue-800'
                                    }`}>
                                      {enquiry.status === 'pending' ? 'Pending' : 'Contacted'}
                                    </span>
                                  )}
                                  <p className="text-xs text-gray-500 mt-1">{enquiry.course}</p>
                                </div>
                                <button
                                  onClick={() => handleDeleteEnquiry(enquiry.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete enquiry"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                          {(!analyticsData.enquiries || analyticsData.enquiries.length === 0) && (
                            <div className="text-center py-8 text-gray-500">
                              <Phone className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                              <p>No enquiries in this period</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>

                {/* Demo Sessions */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-xl shadow-sm border"
                >
                  <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Activity className="w-5 h-5 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Demo Sessions</h3>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handleOpenDemoGroups}
                          className="px-3 py-2 text-sm bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 flex items-center transition-colors shadow-md"
                        >
                          <Users className="w-4 h-4 mr-1.5" />
                          Manage Groups
                        </button>
                        <button
                          onClick={() => {
                            fetchAdminDemoSessions();
                            fetchDemoGroups();
                          }}
                          disabled={loadingDemoSessions || loadingDemoGroups}
                          className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center transition-colors"
                        >
                          <RefreshCw className={`w-4 h-4 mr-1.5 ${(loadingDemoSessions || loadingDemoGroups) ? 'animate-spin' : ''}`} />
                          Refresh
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    {loadingDemoGroups ? (
                      <div className="text-center py-12">
                        <RefreshCw className="w-10 h-10 mx-auto mb-4 text-blue-400 animate-spin" />
                        <p className="text-gray-600 font-medium">Loading demo groups...</p>
                      </div>
                    ) : demoGroups && demoGroups.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {demoGroups.map((group) => {
                          const enrolled = group.enrolledStudents?.length || 0;
                          const maxStudents = group.maxStudents || 20;
                          const percentage = maxStudents > 0 ? Math.round((enrolled / maxStudents) * 100) : 0;
                          
                          return (
                            <motion.div
                              key={group.id}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="bg-gradient-to-br from-white to-blue-50 border border-blue-200 rounded-lg p-3 hover:shadow-md transition-all hover:border-blue-300"
                            >
                              {/* Group Header */}
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-md">
                                    <Users className="w-4 h-4 text-white" />
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-sm text-gray-900 line-clamp-1">{group.name}</h4>
                                    <span className={`inline-block px-1.5 py-0.5 text-[10px] font-medium rounded-full ${
                                      group.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {group.status || 'active'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Group Details */}
                              <div className="space-y-1.5 mb-2">
                                <div className="flex items-center space-x-1.5 text-xs">
                                  <BookOpen className="w-3 h-3 text-purple-600 flex-shrink-0" />
                                  <span className="text-gray-700 font-medium line-clamp-1">{group.course}</span>
                                </div>
                                <div className="flex items-center space-x-1.5 text-xs">
                                  <Calendar className="w-3 h-3 text-blue-600 flex-shrink-0" />
                                  <span className="text-gray-600">
                                    {new Date(group.startDate).toLocaleDateString('en-IN', {
                                      day: '2-digit',
                                      month: 'short'
                                    })}
                                  </span>
                                </div>
                                {group.schedule && (
                                  <div className="flex items-center space-x-1.5 text-xs">
                                    <Clock className="w-3 h-3 text-orange-600 flex-shrink-0" />
                                    <span className="text-gray-600 line-clamp-1">{group.schedule}</span>
                                  </div>
                                )}
                              </div>

                              {/* Enrollment Progress */}
                              <div className="mb-2">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[10px] font-semibold text-gray-700">
                                    <UserCheck className="w-3 h-3 inline mr-0.5" />
                                    Students
                                  </span>
                                  <span className="text-xs font-bold text-blue-600">
                                    {enrolled}/{maxStudents}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                  <div
                                    className={`h-1.5 rounded-full transition-all ${
                                      percentage >= 100 ? 'bg-red-500' : percentage >= 75 ? 'bg-orange-500' : 'bg-blue-500'
                                    }`}
                                    style={{ width: `${Math.min(100, percentage)}%` }}
                                  />
                                </div>
                              </div>

                              {group.description && (
                                <p className="text-[10px] text-gray-600 mb-2 p-1.5 bg-blue-50 rounded border border-blue-200 line-clamp-2">
                                  {group.description}
                                </p>
                              )}

                              {/* Action Buttons */}
                              <div className="space-y-1 pt-2 border-t border-blue-200">
                                <div className="grid grid-cols-2 gap-1">
                                  <button
                                    onClick={() => handleEditGroup(group)}
                                    className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-[10px] font-medium flex items-center justify-center space-x-1"
                                  >
                                    <Edit className="w-3 h-3" />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    onClick={() => handleOpenSendEmailModal(group)}
                                    disabled={enrolled === 0}
                                    className="px-2 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded hover:from-purple-700 hover:to-pink-700 transition-colors text-[10px] font-medium flex items-center justify-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <Mail className="w-3 h-3" />
                                    <span>Email</span>
                                  </button>
                                </div>
                                <button
                                  onClick={() => handleDeleteDemoGroup(group.id, group.name)}
                                  className="w-full px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-[10px] font-medium flex items-center justify-center space-x-1"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Users className="w-8 h-8 text-blue-300" />
                        </div>
                        <p className="font-medium">No demo groups found</p>
                        <p className="text-xs mt-1">Create a demo group to get started</p>
                      </div>
                    )}
                  </div>
                </motion.div>

              </>
            )}
          </div>
        </div>
      </CheckAuth>
    );
  }

  // Student/Admin/Trainer Dashboard View (Non-SuperAdmin users)
  return (
    <CheckAuth>
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-10 space-y-4 sm:space-y-0">
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-3">
            {role === "admin" && (
              <button
                onClick={() => router.push("/Admin")}
                className="px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition text-sm sm:text-base"
              >
                Admin Panel
              </button>
            )}
            <button
              onClick={handleLogout}
              className="px-3 sm:px-4 py-2 rounded-xl border hover:bg-gray-100 transition text-sm sm:text-base"
            >
              Log Out
            </button>
          </div>
        </div>

        {/* Profile */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center text-center bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl w-fit mx-auto mb-8 sm:mb-12"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded-full border-4 border-white shadow-lg mb-3 sm:mb-4 bg-white/20">
            <User className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold">{displayName}</h3>
          <p className="text-xs sm:text-sm opacity-80">{user.email}</p>
        </motion.div>

        {/* Stats - Hide for admin */}
        {role !== "admin" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-10">
            <div className="flex items-center space-x-3 sm:space-x-4 bg-white border border-gray-200 p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-md">
              <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
              <div>
                <h4 className="font-bold text-base sm:text-lg">{courseTitles.length}</h4>
                <p className="text-gray-600 text-sm sm:text-base">Active Courses</p>
              </div>
            </div>
          </div>
        )}

        {/* Your Courses Section - only if courses exist */}
        {courseTitles.length > 0 && (
          <>
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Your Courses</h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
              {courseTitles.map((title, idx) => {
                const progress = courseProgress[title] || {
                  totalChapters: 0,
                  openedChapters: 0,
                  percentage: 0,
                  courseSlug: createCourseUrl(title)
                };

                // Single elegant pastel theme with green progress bar and indigo button
                const theme = {
                  gradient: 'from-slate-50 via-gray-50 to-zinc-50',
                  progressBar: 'from-emerald-400 to-green-500',
                  unlockedBg: 'bg-emerald-50',
                  unlockedIcon: 'text-emerald-600',
                  remainingBg: 'bg-slate-50',
                  remainingIcon: 'text-slate-600',
                  button: 'from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700',
                  hoverBorder: 'hover:border-emerald-300 hover:shadow-emerald-100'
                };

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    onClick={() => router.push(`/courses/${progress.courseSlug}`)}
                    className={`bg-white border-2 border-gray-100 rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer group overflow-hidden ${theme.hoverBorder} hover:-translate-y-1`}
                  >
                    {/* Course Header with Subtle Gradient */}
                    <div className={`bg-gradient-to-br ${theme.gradient} p-2.5 sm:p-4 border-b border-gray-100`}>
                      <h3 className="text-xs sm:text-base font-bold text-gray-800 mb-1.5 sm:mb-2 line-clamp-2">{title}</h3>
                      <div className="flex items-center justify-between text-gray-600">
                        <span className="flex items-center gap-1 sm:gap-1.5">
                          <BookOpen className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-500" />
                          <span className="text-[10px] sm:text-xs font-medium">{progress.totalChapters} Chapters</span>
                        </span>
                        <span className="font-bold text-sm sm:text-base text-emerald-600">{progress.percentage}%</span>
                      </div>
                    </div>

                    {/* Progress Section */}
                    <div className="p-2.5 sm:p-4 bg-white">
                      {/* Progress Bar */}
                      <div className="mb-3 sm:mb-4">
                        <div className="flex justify-between items-center mb-1.5 sm:mb-2">
                          <span className="text-[10px] sm:text-xs text-gray-500 font-semibold">Course Progress</span>
                          <span className="text-[10px] sm:text-xs font-bold text-emerald-600">
                            {progress.openedChapters} / {progress.totalChapters} Complete
                          </span>
                        </div>
                        <div className="w-full h-2.5 sm:h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner border border-gray-200">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress.percentage}%` }}
                            transition={{ duration: 0.8, delay: idx * 0.1 + 0.2, ease: "easeOut" }}
                            className={`h-2.5 sm:h-3 bg-gradient-to-r ${theme.progressBar} rounded-full relative`}
                          >
                            {/* Shimmer effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer"></div>
                          </motion.div>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-2 sm:gap-2.5 mb-3 sm:mb-4">
                        <div className={`${theme.unlockedBg} rounded-lg p-2 sm:p-2.5 border border-emerald-100 transition-all hover:border-emerald-200`}>
                          <div className="flex items-center gap-1 sm:gap-1.5 mb-1">
                            <CheckCircle className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${theme.unlockedIcon}`} />
                            <span className="text-[9px] sm:text-xs text-emerald-700 font-bold">Unlocked</span>
                          </div>
                          <p className="text-lg sm:text-xl font-bold text-emerald-700">{progress.openedChapters}</p>
                        </div>
                        <div className={`${theme.remainingBg} rounded-lg p-2 sm:p-2.5 border border-gray-200 transition-all hover:border-gray-300`}>
                          <div className="flex items-center gap-1 sm:gap-1.5 mb-1">
                            <Clock className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${theme.remainingIcon}`} />
                            <span className="text-[9px] sm:text-xs text-slate-700 font-bold">Remaining</span>
                          </div>
                          <p className="text-lg sm:text-xl font-bold text-slate-700">
                            {progress.totalChapters - progress.openedChapters}
                          </p>
                        </div>
                      </div>

                      {/* Continue Button */}
                      <button className={`w-full py-2 sm:py-3 bg-gradient-to-r ${theme.button} text-white rounded-lg font-bold text-xs sm:text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 sm:gap-2 group-hover:scale-[1.02]`}>
                        <span>{progress.openedChapters === 0 ? 'Start Learning' : 'Continue Learning'}</span>
                        <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}

        {/* Pay Fee (Razorpay only) */}
        {studentDocId && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-md p-4 sm:p-6 mb-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg sm:text-xl font-semibold">Pay Fee</h3>
              {totalFee > 0 && (
                <span className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {Math.round((paidFee / Math.max(totalFee, 1)) * 100)}% paid
                </span>
              )}
            </div>

            {/* Progress bar */}
            {totalFee > 0 && (
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-4">
                <div
                  className="h-2 bg-emerald-500"
                  style={{ width: `${Math.min(100, Math.max(0, (paidFee / Math.max(totalFee, 1)) * 100))}%` }}
                />
              </div>
            )}

            <div className="grid sm:grid-cols-3 gap-3 items-end">
              <div>
                <p className="text-sm text-gray-600">Total Fee</p>
                <p className="font-semibold">₹{totalFee}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Paid</p>
                <p className="font-semibold">₹{paidFee}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Due</p>
                <p className="font-semibold">₹{dueAmount}</p>
              </div>
            </div>
            <div className="mt-4 grid sm:grid-cols-[1fr_auto] gap-3">
              <div>
                <div className="flex items-stretch rounded-xl border overflow-hidden">
                  <span className="px-3 py-2 bg-gray-100 text-gray-600">₹</span>
                  <input
                    type="number"
                    min="0"
                    max={dueAmount}
                    step="0.01"
                    value={payAmount}
                    onChange={(e) => setAmountClamped(e.target.value)}
                    disabled={paying || dueAmount <= 0}
                    className="w-full px-3 py-2 outline-none"
                    placeholder="Enter amount"
                  />
                </div>
                {/* Quick amount chips */}
                {dueAmount > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    <button
                      onClick={() => setAmountClamped(Math.max(0, Math.round(dueAmount * 0.25)))}
                      disabled={paying}
                      className="px-2 py-1 text-xs rounded-full border hover:bg-gray-50"
                    >
                      25% (₹{Math.max(0, Math.round(dueAmount * 0.25))})
                    </button>
                    <button
                      onClick={() => setAmountClamped(Math.max(0, Math.round(dueAmount * 0.5)))}
                      disabled={paying}
                      className="px-2 py-1 text-xs rounded-full border hover:bg-gray-50"
                    >
                      50% (₹{Math.max(0, Math.round(dueAmount * 0.5))})
                    </button>
                    <button
                      onClick={() => setAmountClamped(dueAmount)}
                      disabled={paying}
                      className="px-2 py-1 text-xs rounded-full border hover:bg-gray-50"
                    >
                      Pay Due (₹{dueAmount})
                    </button>
                    <button
                      onClick={() => setAmountClamped(0)}
                      disabled={paying}
                      className="px-2 py-1 text-xs rounded-full border hover:bg-gray-50"
                    >
                      Clear
                    </button>
                  </div>
                )}
                {!!payError && (
                  <p className="mt-2 text-xs text-red-600">{payError}</p>
                )}
              </div>
              <button
                onClick={handlePayWithRazorpay}
                disabled={paying || dueAmount <= 0}
                className={`px-4 py-2 rounded-xl text-white whitespace-nowrap ${paying || dueAmount <= 0 ? "bg-gray-400" : "bg-emerald-600 hover:bg-emerald-700"}`}
              >
                {paying ? "Processing..." : `Pay ₹${payAmount || 0}`}
              </button>
            </div>
            {dueAmount <= 0 && (
              <p className="mt-2 text-sm text-green-700">No due amount. You are fully paid.</p>
            )}
            <p className="mt-2 text-xs text-gray-500">Payments are processed securely via Razorpay. Cash is accepted only in institute.</p>
          </div>
        )}

        {/* Admin Panel - Enquiries & Demo Sessions */}
        {(role === "admin" || role === "superadmin") && (
          <div className="space-y-6">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Management</h2>
                <p className="text-sm text-gray-600 mt-1">Manage enquiries and demo sessions</p>
              </div>
            </div>

            {/* Enquiry Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
            <EnquiryManager
              onSubmit={handleEnquirySubmit}
              onExportEmails={exportEnquiryEmails}
              onDownloadCSV={downloadEnquiriesCSV}
            />
            </motion.div>
            
            {/* Enquiries List */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white border border-gray-200 rounded-2xl shadow-md"
            >
              <div className="p-4 sm:p-6 border-b bg-gradient-to-r from-purple-50 to-pink-50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Phone className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Enquiries List</h3>
                      <p className="text-xs text-gray-600">Total: {adminEnquiries?.length || 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                  {adminEnquiries && adminEnquiries.length > 0 && (
                    <button
                      onClick={() => setShowEmailList(!showEmailList)}
                        className="text-xs text-purple-600 hover:text-purple-700 font-medium px-3 py-2 rounded-lg border border-purple-200 hover:bg-purple-50 transition-colors flex items-center space-x-1"
                    >
                        <Mail className="w-3.5 h-3.5" />
                        <span>{showEmailList ? '← Back to List' : 'View Emails'}</span>
                    </button>
                  )}
                    <button
                      onClick={fetchAdminEnquiries}
                      disabled={loadingEnquiries}
                      className="px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center transition-colors"
                    >
                      <RefreshCw className={`w-4 h-4 mr-1.5 ${loadingEnquiries ? 'animate-spin' : ''}`} />
                      <span className="hidden sm:inline">Refresh</span>
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                {loadingEnquiries ? (
                  <div className="text-center py-12">
                    <RefreshCw className="w-10 h-10 mx-auto mb-4 text-purple-400 animate-spin" />
                    <p className="text-gray-600 font-medium">Loading enquiries...</p>
                  </div>
                ) : showEmailList ? (
                  /* Email List Display */
                  <div className="p-4 sm:p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-semibold text-gray-900 flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-purple-600" />
                        <span>Email Addresses ({adminEnquiries?.length || 0})</span>
                      </h4>
                      <button
                        onClick={exportEnquiryEmails}
                        className="text-xs text-green-600 hover:text-green-700 font-medium px-3 py-1.5 bg-white rounded-lg border border-green-200 hover:bg-green-50 transition-colors"
                      >
                        Copy All
                      </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      <div className="space-y-2">
                        {adminEnquiries?.map((enquiry, index) => (
                          <div key={enquiry.id || index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-sm transition-all">
                            <span className="text-sm text-gray-700 font-medium">{enquiry.email}</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(enquiry.email);
                                alert('Email copied: ' + enquiry.email);
                              }}
                              className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded hover:bg-blue-50"
                            >
                              Copy
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
                      <p className="text-xs text-gray-600 mb-2 font-semibold">All Emails (comma-separated):</p>
                      <p className="text-xs text-blue-800 font-mono break-all bg-blue-50 p-2 rounded">
                        {adminEnquiries?.map(e => e.email).join(', ')}
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Enquiries List */
                  <div className="space-y-3">
                    {adminEnquiries?.map((enquiry, index) => (
                      <div key={enquiry.id || index} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-purple-50 rounded-xl hover:from-purple-50 hover:to-pink-50 transition-all border border-gray-200 hover:border-purple-300 hover:shadow-md">
                        <div className="flex items-center space-x-3 mb-3 sm:mb-0">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <Phone className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{enquiry.name}</p>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 mt-1">
                              <div className="flex items-center space-x-1">
                                <Mail className="w-3 h-3 text-gray-400" />
                                <p className="text-xs text-gray-600">{enquiry.email}</p>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Phone className="w-3 h-3 text-gray-400" />
                                <p className="text-xs text-gray-600">{enquiry.phone}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end space-x-2">
                          <div className="text-left sm:text-right">
                            {enquiry.demoGroupName ? (
                              <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-300 shadow-sm">
                                <Users className="w-3.5 h-3.5 mr-1.5" />
                                {enquiry.demoGroupName}
                              </span>
                            ) : (
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                enquiry.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' :
                                'bg-blue-100 text-blue-800 border border-blue-300'
                              }`}>
                                {enquiry.status === 'pending' ? 'Pending' : 'Contacted'}
                              </span>
                            )}
                            <p className="text-xs text-gray-600 mt-1.5 font-medium">{enquiry.course}</p>
                          </div>
                          <button
                            onClick={() => handleAllowDemo(enquiry)}
                            className="px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-colors text-xs font-medium flex items-center space-x-1 shadow-sm"
                            title="Assign to demo group"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Allow Demo</span>
                          </button>
                          <button
                            onClick={() => handleDeleteEnquiry(enquiry.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                            title="Delete enquiry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {(!adminEnquiries || adminEnquiries.length === 0) && (
                      <div className="text-center py-12 text-gray-500">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Phone className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="font-medium">No enquiries found</p>
                        <p className="text-xs mt-1">New enquiries will appear here</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Demo Sessions for Admin */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white border border-gray-200 rounded-2xl shadow-md"
            >
              <div className="p-4 sm:p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Activity className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Demo Sessions</h3>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleOpenDemoGroups}
                      className="px-3 py-2 text-sm bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 flex items-center transition-colors shadow-md"
                    >
                      <Users className="w-4 h-4 mr-1.5" />
                      <span className="hidden sm:inline">Manage Groups</span>
                      <span className="sm:hidden">Groups</span>
                    </button>
                    <button
                      onClick={() => {
                        fetchAdminDemoSessions();
                        fetchDemoGroups();
                      }}
                      disabled={loadingDemoSessions || loadingDemoGroups}
                      className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center transition-colors"
                    >
                      <RefreshCw className={`w-4 h-4 mr-1.5 ${(loadingDemoSessions || loadingDemoGroups) ? 'animate-spin' : ''}`} />
                      <span className="hidden sm:inline">Refresh</span>
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                {loadingDemoGroups ? (
                  <div className="text-center py-12">
                    <RefreshCw className="w-10 h-10 mx-auto mb-4 text-blue-400 animate-spin" />
                    <p className="text-gray-600 font-medium">Loading demo groups...</p>
                  </div>
                ) : demoGroups && demoGroups.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {demoGroups.map((group) => {
                      const enrolled = group.enrolledStudents?.length || 0;
                      const maxStudents = group.maxStudents || 20;
                      const percentage = maxStudents > 0 ? Math.round((enrolled / maxStudents) * 100) : 0;
                      
                      return (
                        <motion.div
                          key={group.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-gradient-to-br from-white to-blue-50 border border-blue-200 rounded-lg p-3 hover:shadow-md transition-all hover:border-blue-300"
                        >
                          {/* Group Header */}
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-md">
                                <Users className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <h4 className="font-bold text-sm text-gray-900 line-clamp-1">{group.name}</h4>
                                <span className={`inline-block px-1.5 py-0.5 text-[10px] font-medium rounded-full ${
                                  group.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {group.status || 'active'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Group Details */}
                          <div className="space-y-1.5 mb-2">
                            <div className="flex items-center space-x-1.5 text-xs">
                              <BookOpen className="w-3 h-3 text-purple-600 flex-shrink-0" />
                              <span className="text-gray-700 font-medium line-clamp-1">{group.course}</span>
                            </div>
                            <div className="flex items-center space-x-1.5 text-xs">
                              <Calendar className="w-3 h-3 text-blue-600 flex-shrink-0" />
                              <span className="text-gray-600">
                                {new Date(group.startDate).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short'
                                })}
                              </span>
                            </div>
                            {group.schedule && (
                              <div className="flex items-center space-x-1.5 text-xs">
                                <Clock className="w-3 h-3 text-orange-600 flex-shrink-0" />
                                <span className="text-gray-600 line-clamp-1">{group.schedule}</span>
                              </div>
                            )}
                          </div>

                          {/* Enrollment Progress */}
                          <div className="mb-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-semibold text-gray-700">
                                <UserCheck className="w-3 h-3 inline mr-0.5" />
                                Students
                              </span>
                              <span className="text-xs font-bold text-blue-600">
                                {enrolled}/{maxStudents}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full transition-all ${
                                  percentage >= 100 ? 'bg-red-500' : percentage >= 75 ? 'bg-orange-500' : 'bg-blue-500'
                                }`}
                                style={{ width: `${Math.min(100, percentage)}%` }}
                              />
                            </div>
                          </div>

                          {group.description && (
                            <p className="text-[10px] text-gray-600 mb-2 p-1.5 bg-blue-50 rounded border border-blue-200 line-clamp-2">
                              {group.description}
                            </p>
                          )}

                          {/* Action Buttons */}
                          <div className="space-y-1 pt-2 border-t border-blue-200">
                            <div className="grid grid-cols-2 gap-1">
                              <button
                                onClick={() => handleEditGroup(group)}
                                className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-[10px] font-medium flex items-center justify-center space-x-1"
                              >
                                <Edit className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleOpenSendEmailModal(group)}
                                disabled={enrolled === 0}
                                className="px-2 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded hover:from-purple-700 hover:to-pink-700 transition-colors text-[10px] font-medium flex items-center justify-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Mail className="w-3 h-3" />
                                <span>Email</span>
                              </button>
                            </div>
                            <button
                              onClick={() => handleDeleteDemoGroup(group.id, group.name)}
                              className="w-full px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-[10px] font-medium flex items-center justify-center space-x-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-blue-300" />
                    </div>
                    <p className="font-medium">No demo groups found</p>
                    <p className="text-xs mt-1">Create a demo group to get started</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Edit Demo Group Modal */}
            {showEditGroupModal && selectedGroup && editGroupData && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                onClick={() => !savingGroupChanges && setShowEditGroupModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden"
                >
                  {/* Modal Header */}
                  <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">✏️ Edit Demo Group</h2>
                        <div className="flex items-center space-x-3 text-sm">
                          <span className="flex items-center space-x-1 text-gray-600">
                            <UserCheck className="w-4 h-4" />
                            <span>{selectedGroup.enrolledStudents?.length || 0} / {editGroupData.maxStudents || 20} Students</span>
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowEditGroupModal(false)}
                        disabled={savingGroupChanges}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <X className="w-6 h-6 text-gray-600" />
                      </button>
                    </div>
                  </div>

                  {/* Modal Content */}
                  <div className="p-6 overflow-y-auto max-h-[calc(85vh-220px)]">
                    {/* Edit Group Form */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 mb-6 border border-blue-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Edit className="w-5 h-5 mr-2 text-blue-600" />
                        Group Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Group Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={editGroupData.name}
                            onChange={(e) => setEditGroupData({...editGroupData, name: e.target.value})}
                            disabled={savingGroupChanges}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                            placeholder="e.g., Python Batch 1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Course <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={editGroupData.course}
                            onChange={(e) => setEditGroupData({...editGroupData, course: e.target.value})}
                            disabled={savingGroupChanges}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                            placeholder="e.g., Python Programming"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Start Date <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            value={editGroupData.startDate}
                            onChange={(e) => setEditGroupData({...editGroupData, startDate: e.target.value})}
                            disabled={savingGroupChanges}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Schedule
                          </label>
                          <input
                            type="text"
                            value={editGroupData.schedule}
                            onChange={(e) => setEditGroupData({...editGroupData, schedule: e.target.value})}
                            disabled={savingGroupChanges}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                            placeholder="e.g., Mon, Wed, Fri - 10 AM"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Max Students
                          </label>
                          <input
                            type="number"
                            value={editGroupData.maxStudents}
                            onChange={(e) => setEditGroupData({...editGroupData, maxStudents: e.target.value})}
                            disabled={savingGroupChanges}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                            placeholder="Default: 20"
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Status
                          </label>
                          <select
                            value={editGroupData.status}
                            onChange={(e) => setEditGroupData({...editGroupData, status: e.target.value})}
                            disabled={savingGroupChanges}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                          >
                            <option value="active">Active</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      </div>
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          value={editGroupData.description}
                          onChange={(e) => setEditGroupData({...editGroupData, description: e.target.value})}
                          disabled={savingGroupChanges}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                          placeholder="Additional details about this demo group..."
                          rows="3"
                        />
                      </div>
                      <div className="mt-4 pt-4 border-t border-blue-300">
                        <button
                          onClick={handleSaveGroupChanges}
                          disabled={savingGroupChanges}
                          className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors font-semibold flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                        >
                          {savingGroupChanges ? (
                            <>
                              <RefreshCw className="w-5 h-5 animate-spin" />
                              <span>Saving Changes...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-5 h-5" />
                              <span>Save Changes</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Enrolled Students List */}
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Users className="w-5 h-5 mr-2 text-blue-600" />
                        Enrolled Students ({selectedGroup.enrolledStudents?.length || 0})
                      </h3>

                      {selectedGroup.enrolledStudents && selectedGroup.enrolledStudents.length > 0 ? (
                        <div className="space-y-3">
                          {selectedGroup.enrolledStudents.map((student, index) => (
                            <motion.div
                              key={student.email || index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200 hover:border-blue-300 transition-all"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                                  <User className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">{student.name}</p>
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 mt-0.5">
                                    <div className="flex items-center space-x-1">
                                      <Mail className="w-3 h-3 text-gray-400" />
                                      <p className="text-xs text-gray-600">{student.email}</p>
                                    </div>
                                    {student.phone && (
                                      <>
                                        <span className="hidden sm:inline text-gray-400">•</span>
                                        <div className="flex items-center space-x-1">
                                          <Phone className="w-3 h-3 text-gray-400" />
                                          <p className="text-xs text-gray-600">{student.phone}</p>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                  {student.addedAt && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      Added: {new Date(student.addedAt).toLocaleDateString('en-IN')}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => handleRemoveStudentFromGroup(student.email)}
                                disabled={removingStudent}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200 disabled:opacity-50"
                                title="Remove from group"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                          <UserPlus className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p className="text-sm font-medium text-gray-600">No students enrolled yet</p>
                          <p className="text-xs text-gray-500 mt-1">Students will appear here when assigned</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setShowEditGroupModal(false);
                          handleOpenSendEmailModal(selectedGroup);
                        }}
                        disabled={!selectedGroup.enrolledStudents || selectedGroup.enrolledStudents.length === 0 || savingGroupChanges}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                      >
                        <Mail className="w-4 h-4" />
                        <span>Send Email to All</span>
                      </button>
                      <button
                        onClick={() => handleDeleteDemoGroup(selectedGroup.id, selectedGroup.name)}
                        disabled={savingGroupChanges}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        title="Delete this demo group"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete Group</span>
                      </button>
                    </div>
                    <button
                      onClick={() => setShowEditGroupModal(false)}
                      disabled={savingGroupChanges}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                      Close
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Assign to Demo Group Modal */}
            {showAssignDemoModal && selectedEnquiry && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                onClick={() => setShowAssignDemoModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden"
                >
                  {/* Modal Header */}
                  <div className="p-6 border-b bg-gradient-to-r from-green-50 to-emerald-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">Assign to Demo Group</h2>
                        <div className="flex items-center space-x-2 text-sm">
                          <span className="text-gray-600">Student:</span>
                          <span className="font-semibold text-gray-900">{selectedEnquiry.name}</span>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-600">{selectedEnquiry.email}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowAssignDemoModal(false)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <X className="w-6 h-6 text-gray-600" />
                      </button>
                    </div>
                  </div>

                  {/* Modal Content */}
                  <div className="p-6 overflow-y-auto max-h-[calc(85vh-180px)]">
                    <p className="text-sm text-gray-600 mb-4">
                      Select a demo group to assign this enquiry. The student will be added to the group and a demo session will be scheduled.
                    </p>

                    {loadingDemoGroups ? (
                      <div className="text-center py-12">
                        <RefreshCw className="w-10 h-10 mx-auto mb-4 text-green-400 animate-spin" />
                        <p className="text-gray-600 font-medium">Loading demo groups...</p>
                      </div>
                    ) : demoGroups.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {demoGroups
                          .filter(group => group.status === 'active')
                          .map((group) => {
                            const enrolled = group.enrolledStudents?.length || 0;
                            const maxStudents = group.maxStudents || 20;
                            const isFull = enrolled >= maxStudents;
                            
                            return (
                              <motion.button
                                key={group.id}
                                onClick={() => !isFull && !assigningToGroup && handleAssignToGroup(group.id)}
                                disabled={isFull || assigningToGroup}
                                whileHover={!isFull ? { scale: 1.02 } : {}}
                                whileTap={!isFull ? { scale: 0.98 } : {}}
                                className={`text-left bg-gradient-to-br from-white to-green-50 border-2 rounded-xl p-5 transition-all ${
                                  isFull 
                                    ? 'border-gray-300 opacity-50 cursor-not-allowed' 
                                    : 'border-green-200 hover:border-green-400 hover:shadow-lg'
                                }`}
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center space-x-2">
                                    <div className={`p-2 rounded-lg ${isFull ? 'bg-gray-200' : 'bg-gradient-to-br from-green-500 to-emerald-500'}`}>
                                      <Users className={`w-5 h-5 ${isFull ? 'text-gray-500' : 'text-white'}`} />
                                    </div>
                                    <div>
                                      <h4 className="font-bold text-gray-900">{group.name}</h4>
                                      <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                                        isFull ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                      }`}>
                                        {isFull ? 'Full' : 'Available'}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-2 mb-3">
                                  <div className="flex items-center space-x-2 text-sm">
                                    <BookOpen className="w-4 h-4 text-purple-600" />
                                    <span className="text-gray-700 font-medium">{group.course}</span>
                                  </div>
                                  <div className="flex items-center space-x-2 text-sm">
                                    <Calendar className="w-4 h-4 text-blue-600" />
                                    <span className="text-gray-600">
                                      Start: {new Date(group.startDate).toLocaleDateString('en-IN', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric'
                                      })}
                                    </span>
                                  </div>
                                  {group.schedule && (
                                    <div className="flex items-center space-x-2 text-sm">
                                      <Clock className="w-4 h-4 text-orange-600" />
                                      <span className="text-gray-600">{group.schedule}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center space-x-2 text-sm">
                                    <UserCheck className="w-4 h-4 text-green-600" />
                                    <span className="text-gray-600">
                                      {enrolled} / {maxStudents} students
                                    </span>
                                  </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                  <div
                                    className={`h-2 rounded-full transition-all ${
                                      isFull ? 'bg-red-500' : 'bg-green-500'
                                    }`}
                                    style={{ width: `${Math.min(100, (enrolled / maxStudents) * 100)}%` }}
                                  />
                                </div>

                                {!isFull && (
                                  <div className="text-xs text-green-600 font-medium mt-3 flex items-center">
                                    <ArrowUpRight className="w-3 h-3 mr-1" />
                                    Click to assign
                                  </div>
                                )}
                              </motion.button>
                            );
                          })}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Users className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="font-medium text-gray-600">No demo groups available</p>
                        <p className="text-xs text-gray-500 mt-1">Create a demo group first</p>
                      </div>
                    )}
                  </div>

                  {/* Modal Footer */}
                  <div className="p-4 border-t bg-gray-50 flex justify-end">
                    <button
                      onClick={() => setShowAssignDemoModal(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Demo Groups Modal */}
            {showDemoGroupsModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                onClick={() => setShowDemoGroupsModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
                >
                  {/* Modal Header */}
                  <div className="p-6 border-b bg-gradient-to-r from-green-50 to-emerald-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Users className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900">Demo Groups Management</h2>
                          <p className="text-sm text-gray-600">Manage and organize demo sessions by groups</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowDemoGroupsModal(false)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <X className="w-6 h-6 text-gray-600" />
                      </button>
                    </div>
                  </div>

                  {/* Modal Content */}
                  <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    {/* Action Buttons */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">
                          {demoGroups.length} {demoGroups.length === 1 ? 'group' : 'groups'} total
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={fetchDemoGroups}
                          disabled={loadingDemoGroups}
                          className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 flex items-center transition-colors"
                        >
                          <RefreshCw className={`w-4 h-4 mr-1.5 ${loadingDemoGroups ? 'animate-spin' : ''}`} />
                          Refresh
                        </button>
                        <button
                          onClick={() => setShowCreateGroupForm(!showCreateGroupForm)}
                          className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 flex items-center transition-colors shadow-md"
                        >
                          <Plus className="w-4 h-4 mr-1.5" />
                          {showCreateGroupForm ? 'Cancel' : 'Create New Group'}
                        </button>
                      </div>
                    </div>

                    {/* Create Group Form */}
                    {showCreateGroupForm && (
                      <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-200 mb-6"
                      >
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <Plus className="w-5 h-5 mr-2 text-green-600" />
                          Create New Demo Group
                        </h3>
                        <form onSubmit={handleCreateDemoGroup} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Group Name <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={newGroupData.name}
                                onChange={(e) => setNewGroupData({...newGroupData, name: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                placeholder="e.g., Python Batch 1"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Course <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={newGroupData.course}
                                onChange={(e) => setNewGroupData({...newGroupData, course: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                placeholder="e.g., Python Programming"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Start Date <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="date"
                                value={newGroupData.startDate}
                                onChange={(e) => setNewGroupData({...newGroupData, startDate: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Schedule
                              </label>
                              <input
                                type="text"
                                value={newGroupData.schedule}
                                onChange={(e) => setNewGroupData({...newGroupData, schedule: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                placeholder="e.g., Mon, Wed, Fri - 10 AM"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Max Students
                              </label>
                              <input
                                type="number"
                                value={newGroupData.maxStudents}
                                onChange={(e) => setNewGroupData({...newGroupData, maxStudents: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                placeholder="Default: 20"
                                min="1"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Description
                            </label>
                            <textarea
                              value={newGroupData.description}
                              onChange={(e) => setNewGroupData({...newGroupData, description: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              placeholder="Additional details about this demo group..."
                              rows="3"
                            />
                          </div>
                          <div className="flex justify-end space-x-3">
                            <button
                              type="button"
                              onClick={() => setShowCreateGroupForm(false)}
                              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-colors shadow-md"
                            >
                              Create Group
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    )}

                    {/* Demo Groups List */}
                    {loadingDemoGroups ? (
                      <div className="text-center py-12">
                        <RefreshCw className="w-10 h-10 mx-auto mb-4 text-green-400 animate-spin" />
                        <p className="text-gray-600 font-medium">Loading demo groups...</p>
                      </div>
                    ) : demoGroups.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        {demoGroups.map((group) => {
                          const enrolled = group.enrolledStudents?.length || 0;
                          const maxStudents = group.maxStudents || 20;
                          const percentage = maxStudents > 0 ? Math.round((enrolled / maxStudents) * 100) : 0;
                          
                          return (
                            <motion.div
                              key={group.id}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="bg-gradient-to-br from-white to-green-50 border border-green-200 rounded-lg p-3 hover:shadow-md transition-all hover:border-green-300"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <div className="p-1.5 bg-gradient-to-br from-green-500 to-emerald-500 rounded-md">
                                    <Users className="w-4 h-4 text-white" />
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-sm text-gray-900 line-clamp-1">{group.name}</h4>
                                    <span className={`inline-block px-1.5 py-0.5 text-[10px] font-medium rounded-full ${
                                      group.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {group.status || 'active'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-1.5 mb-2">
                                <div className="flex items-center space-x-1.5 text-xs">
                                  <BookOpen className="w-3 h-3 text-purple-600 flex-shrink-0" />
                                  <span className="text-gray-700 font-medium line-clamp-1">{group.course}</span>
                                </div>
                                <div className="flex items-center space-x-1.5 text-xs">
                                  <Calendar className="w-3 h-3 text-blue-600 flex-shrink-0" />
                                  <span className="text-gray-600">
                                    {new Date(group.startDate).toLocaleDateString('en-IN', {
                                      day: '2-digit',
                                      month: 'short'
                                    })}
                                  </span>
                                </div>
                                {group.schedule && (
                                  <div className="flex items-center space-x-1.5 text-xs">
                                    <Clock className="w-3 h-3 text-orange-600 flex-shrink-0" />
                                    <span className="text-gray-600 line-clamp-1">{group.schedule}</span>
                                  </div>
                                )}
                              </div>

                              {/* Enrollment Progress */}
                              <div className="mb-2">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[10px] font-semibold text-gray-700">
                                    <UserCheck className="w-3 h-3 inline mr-0.5" />
                                    Students
                                  </span>
                                  <span className="text-xs font-bold text-green-600">
                                    {enrolled}/{maxStudents}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                  <div
                                    className={`h-1.5 rounded-full transition-all ${
                                      percentage >= 100 ? 'bg-red-500' : percentage >= 75 ? 'bg-orange-500' : 'bg-green-500'
                                    }`}
                                    style={{ width: `${Math.min(100, percentage)}%` }}
                                  />
                                </div>
                              </div>

                              {group.description && (
                                <p className="text-[10px] text-gray-600 mb-2 p-1.5 bg-green-50 rounded border border-green-200 line-clamp-2">
                                  {group.description}
                                </p>
                              )}

                              <div className="grid grid-cols-2 gap-1 pt-2 border-t border-green-200">
                                <button
                                  onClick={() => {
                                    setShowDemoGroupsModal(false);
                                    handleEditGroup(group);
                                  }}
                                  className="px-2 py-1 text-[10px] text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center space-x-1 hover:bg-blue-50 rounded transition-colors"
                                >
                                  <Edit className="w-3 h-3" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteDemoGroup(group.id, group.name)}
                                  className="px-2 py-1 text-[10px] text-red-600 hover:text-red-700 font-medium flex items-center justify-center space-x-1 hover:bg-red-50 rounded transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Users className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="font-medium text-gray-600">No demo groups yet</p>
                        <p className="text-xs text-gray-500 mt-1">Click &quot;Create New Group&quot; to get started</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Send Email Modal */}
            {showSendEmailModal && selectedGroup && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                onClick={() => !sendingEmail && setShowSendEmailModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden"
                >
                  {/* Modal Header */}
                  <div className="p-6 border-b bg-gradient-to-r from-purple-50 to-pink-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">📧 Send Demo Invitation</h2>
                        <div className="flex items-center space-x-2 text-sm">
                          <span className="text-gray-600">Group:</span>
                          <span className="font-semibold text-purple-600">{selectedGroup.name}</span>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-600">{selectedGroup.enrolledStudents?.length || 0} students</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowSendEmailModal(false)}
                        disabled={sendingEmail}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <X className="w-6 h-6 text-gray-600" />
                      </button>
                    </div>
                  </div>

                  {/* Modal Content */}
                  <div className="p-6">
                    {/* Info Box */}
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="font-semibold text-blue-900 mb-1">Email will be sent from Vawe Institute</p>
                          <p className="text-blue-700">• All recipients will receive via BCC (for privacy)</p>
                          <p className="text-blue-700">• Recipients won&apos;t see other students&apos; email addresses</p>
                          <p className="text-blue-700">• Professional email template with demo details</p>
                        </div>
                      </div>
                    </div>

                    {/* Group Details Summary */}
                    <div className="mb-6 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">📋 Demo Session Details</h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600">Course:</span>
                          <p className="font-semibold text-gray-900">{selectedGroup.course}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Start Date:</span>
                          <p className="font-semibold text-gray-900">
                            {new Date(selectedGroup.startDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                        {selectedGroup.schedule && (
                          <div className="col-span-2">
                            <span className="text-gray-600">Schedule:</span>
                            <p className="font-semibold text-gray-900">{selectedGroup.schedule}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Demo Link Input */}
                    <div className="mb-6">
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        🎥 Demo Class Link <span className="text-gray-500 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="url"
                        value={demoLink}
                        onChange={(e) => setDemoLink(e.target.value)}
                        disabled={sendingEmail}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="https://meet.google.com/xxx-xxxx-xxx or Zoom link"
                      />
                      <p className="mt-2 text-xs text-gray-500">
                        💡 Enter the Google Meet, Zoom, or other meeting link for the demo session.
                        If not provided, students will receive demo details via email.
                      </p>
                    </div>

                    {/* Student List Preview */}
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">
                        👥 Recipients ({selectedGroup.enrolledStudents?.length || 0})
                      </h3>
                      <div className="max-h-32 overflow-y-auto bg-gray-50 rounded-lg border border-gray-200 p-3">
                        <div className="space-y-1">
                          {selectedGroup.enrolledStudents?.map((student, index) => (
                            <div key={index} className="flex items-center space-x-2 text-xs">
                              <CheckCircle className="w-3 h-3 text-green-600" />
                              <span className="text-gray-700">{student.name}</span>
                              <span className="text-gray-400">•</span>
                              <span className="text-gray-500">{student.email}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Warning */}
                    {!demoLink && (
                      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-yellow-800">
                            No demo link provided. Students will receive demo details but won&apos;t have a direct join link.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Modal Footer */}
                  <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
                    <button
                      onClick={() => setShowSendEmailModal(false)}
                      disabled={sendingEmail}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSendEmailToGroup}
                      disabled={sendingEmail}
                      className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors flex items-center space-x-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sendingEmail ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Sending Emails...</span>
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4" />
                          <span>Send Invitations (BCC)</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </div>
        )}
        

        {/* Trainer Button (non-admin) */}
        {role === "trainer" && (
          <div className="mt-8 sm:mt-10 text-center">
            <button
              onClick={() => router.push("/trainer")}
              className="bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl shadow-md hover:bg-blue-700 transition text-sm sm:text-base"
            >
              Open Trainer Panel
            </button>
          </div>
        )}
      </div>
    </CheckAuth>
  );
}
