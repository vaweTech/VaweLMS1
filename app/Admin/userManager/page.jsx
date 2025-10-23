"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  addDoc,
  writeBatch,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useRouter } from "next/navigation";
import CheckAdminAuth from "@/lib/CheckAdminAuth";
import AdmissionForm from "@/components/AdmissionForm";

export default function UserManagerPage() {
  const router = useRouter();
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [showAdmissionModal, setShowAdmissionModal] = useState(false);
  const [expandedClasses, setExpandedClasses] = useState({});
  const [showEditClassModal, setShowEditClassModal] = useState(false);
  const [editClassId, setEditClassId] = useState("");
  const [editClassName, setEditClassName] = useState("");
  const [editSelectedStudentIds, setEditSelectedStudentIds] = useState([]);
  const [moveTargetClassId, setMoveTargetClassId] = useState("");
  const [selectedCoursesToRemove, setSelectedCoursesToRemove] = useState([]);
  const [studentCourses, setStudentCourses] = useState([]); // Courses from students' chapterAccess

  // 🔹 State
  const [searchEmail, setSearchEmail] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [assignClass, setAssignClass] = useState("");

  const [selectedStudentIds, setSelectedStudentIds] = useState([]);

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedChapters, setSelectedChapters] = useState([]);
  const [newClass, setNewClass] = useState({ name: "" });

  // Student edit and sorting
  const [sortBy, setSortBy] = useState("name"); // "name" or "regNo"
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [editStudent, setEditStudent] = useState(null);

  

  // Fetch Data
  useEffect(() => {
    fetchClasses();
    fetchStudents();
    fetchCourses();
  }, []);

  async function handleAddClass(e) {
    e.preventDefault();
    if (!newClass.name) return alert("Class name is required");
    await addDoc(collection(db, "classes"), newClass);
    setNewClass({ name: "" });
    fetchClasses();
  }

  async function fetchClasses() {
    const snap = await getDocs(collection(db, "classes"));
    setClasses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }

  async function fetchStudents() {
    const snap = await getDocs(collection(db, "students"));
    setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }

  async function fetchCourses() {
    const snap = await getDocs(collection(db, "courses"));
    setCourses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }

  

  // Edit Class helpers
  function openEditClass(c) {
    setEditClassId(c.id);
    setEditClassName(c.name || "");
    const classStudents = students.filter((s) => Array.isArray(s.classIds) ? s.classIds.includes(c.id) : s.classId === c.id);
    setEditSelectedStudentIds(classStudents.map((s) => s.id));
    setMoveTargetClassId("");
    setSelectedCoursesToRemove([]);
    
    // Get courses from students' chapterAccess
    const coursesMap = new Map();
    classStudents.forEach((student) => {
      if (student.chapterAccess) {
        Object.keys(student.chapterAccess).forEach((courseId) => {
          // Only add if there are actual chapters assigned
          if (Array.isArray(student.chapterAccess[courseId]) && student.chapterAccess[courseId].length > 0) {
            if (!coursesMap.has(courseId)) {
              const course = courses.find((c) => c.id === courseId);
              if (course) {
                coursesMap.set(courseId, {
                  id: courseId,
                  title: course.title,
                  studentCount: 1
                });
              }
            } else {
              const existing = coursesMap.get(courseId);
              existing.studentCount += 1;
            }
          }
        });
      }
    });
    
    setStudentCourses(Array.from(coursesMap.values()));
    setShowEditClassModal(true);
  }

  function toggleEditSelectOne(studentId) {
    setEditSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  }

  function editSelectAllInClass() {
    const classStudents = students.filter((s) => Array.isArray(s.classIds) ? s.classIds.includes(editClassId) : s.classId === editClassId);
    setEditSelectedStudentIds(classStudents.map((s) => s.id));
  }

  function editClearSelection() {
    setEditSelectedStudentIds([]);
  }

  async function handleRenameClass(e) {
    e.preventDefault();
    if (!editClassId || !editClassName.trim()) return;
    await updateDoc(doc(db, "classes", editClassId), { name: editClassName.trim() });
    await fetchClasses();
    alert("✅ Class renamed");
  }

  async function handleRemoveSelectedFromClass() {
    if (!editClassId || editSelectedStudentIds.length === 0) return alert("Select students to remove");
    
    // Get the class data to find assigned courses
    const currentClass = classes.find((c) => c.id === editClassId);
    const classCoursesIds = currentClass?.courseIds || [];
    const classCourseTitles = currentClass?.courseTitles || [];
    
    const confirmed = confirm(
      `Remove ${editSelectedStudentIds.length} student(s) from this class?\n\nThis will also remove course access granted through this class (if not available in their other classes).`
    );
    if (!confirmed) return;
    
    const batch = writeBatch(db);
    
    editSelectedStudentIds.forEach((studentId) => {
      const student = students.find((s) => s.id === studentId);
      if (!student) return;
      
      const studentRef = doc(db, "students", studentId);
      
      // Remove the class ID
      batch.update(studentRef, { classIds: arrayRemove(editClassId) });
      
      // Check if student is in other classes
      const otherClassIds = (student.classIds || []).filter((id) => id !== editClassId);
      
      // Get courses from other classes the student is in
      const otherClassesCourses = new Set();
      otherClassIds.forEach((classId) => {
        const otherClass = classes.find((c) => c.id === classId);
        if (otherClass?.courseIds) {
          otherClass.courseIds.forEach((courseId) => otherClassesCourses.add(courseId));
        }
      });
      
      // Remove course access and titles that are ONLY from this class
      const updatedChapterAccess = { ...student.chapterAccess };
      const updatedCoursesTitle = [...(student.coursesTitle || [])];
      
      classCoursesIds.forEach((courseId, index) => {
        // Only remove if student doesn't have access through another class
        if (!otherClassesCourses.has(courseId)) {
          delete updatedChapterAccess[courseId];
          
          // Remove corresponding course title
          const courseTitle = classCourseTitles[index];
          if (courseTitle) {
            const titleIndex = updatedCoursesTitle.indexOf(courseTitle);
            if (titleIndex > -1) {
              updatedCoursesTitle.splice(titleIndex, 1);
            }
          }
        }
      });
      
      // Update the student document with cleaned data
      batch.update(studentRef, { 
        chapterAccess: updatedChapterAccess,
        coursesTitle: updatedCoursesTitle
      });
    });
    
    await batch.commit();
    await fetchStudents();
    alert("✅ Removed selected students from class and cleaned up course access");
  }

  async function handleMoveSelectedToClass() {
    if (!editClassId || editSelectedStudentIds.length === 0) return alert("Select students to move");
    if (!moveTargetClassId) return alert("Select a target class");
    if (moveTargetClassId === editClassId) return alert("Target class is same as current class");
    const batch = writeBatch(db);
    editSelectedStudentIds.forEach((id) => {
      const ref = doc(db, "students", id);
      batch.update(ref, { classIds: arrayRemove(editClassId) });
      batch.update(ref, { classIds: arrayUnion(moveTargetClassId) });
    });
    await batch.commit();
    await fetchStudents();
    alert("✅ Moved selected students to target class");
  }

  async function handleRemoveCoursesFromClass() {
    if (!editClassId || selectedCoursesToRemove.length === 0) {
      return alert("Select courses to remove");
    }

    const currentClass = classes.find((c) => c.id === editClassId);
    const classStudents = students.filter((s) => 
      Array.isArray(s.classIds) ? s.classIds.includes(editClassId) : s.classId === editClassId
    );

    const confirmed = confirm(
      `Remove ${selectedCoursesToRemove.length} course(s) from this class?\n\n` +
      `This will affect ${classStudents.length} student(s).\n` +
      `Course access will be removed from students who don't have it through other classes.`
    );
    if (!confirmed) return;

    try {
      const batch = writeBatch(db);

      // Update each student
      classStudents.forEach((student) => {
        const studentRef = doc(db, "students", student.id);
        
        // Get other classes the student is in
        const otherClassIds = (student.classIds || []).filter((id) => id !== editClassId);
        
        // Get courses from other classes
        const otherClassesCourses = new Set();
        otherClassIds.forEach((classId) => {
          const otherClass = classes.find((c) => c.id === classId);
          if (otherClass?.courseIds) {
            otherClass.courseIds.forEach((courseId) => otherClassesCourses.add(courseId));
          }
        });

        // Remove course access for selected courses
        const updatedChapterAccess = { ...student.chapterAccess };
        const updatedCoursesTitle = [...(student.coursesTitle || [])];

        selectedCoursesToRemove.forEach((courseId) => {
          // Only remove if student doesn't have access through another class
          if (!otherClassesCourses.has(courseId)) {
            delete updatedChapterAccess[courseId];

            // Find and remove course title
            const course = courses.find((c) => c.id === courseId);
            if (course?.title) {
              const titleIndex = updatedCoursesTitle.indexOf(course.title);
              if (titleIndex > -1) {
                updatedCoursesTitle.splice(titleIndex, 1);
              }
            }
          }
        });

        batch.update(studentRef, {
          chapterAccess: updatedChapterAccess,
          coursesTitle: updatedCoursesTitle
        });
      });

      // Update the class document - remove the courses
      const classRef = doc(db, "classes", editClassId);
      const updatedCourseIds = (currentClass?.courseIds || []).filter(
        (id) => !selectedCoursesToRemove.includes(id)
      );
      const updatedCourseTitles = (currentClass?.courseTitles || []).filter((title) => {
        const course = courses.find((c) => c.title === title);
        return !course || !selectedCoursesToRemove.includes(course.id);
      });

      // Remove course chapter access for removed courses
      const updatedCourseChapterAccess = { ...(currentClass?.courseChapterAccess || {}) };
      selectedCoursesToRemove.forEach((courseId) => {
        delete updatedCourseChapterAccess[courseId];
      });

      batch.update(classRef, {
        courseIds: updatedCourseIds,
        courseTitles: updatedCourseTitles,
        courseChapterAccess: updatedCourseChapterAccess
      });

      await batch.commit();
      await fetchStudents();
      await fetchClasses();
      
      setSelectedCoursesToRemove([]);
      alert(`✅ Successfully removed ${selectedCoursesToRemove.length} course(s) from class`);
    } catch (error) {
      console.error("Error removing courses from class:", error);
      alert("❌ Failed to remove courses. Please try again.");
    }
  }

  async function handleDeleteClass() {
    if (!editClassId) return;
    const classStudents = students.filter((s) => Array.isArray(s.classIds) ? s.classIds.includes(editClassId) : s.classId === editClassId);
    
    // Get the class data to find assigned courses
    const classToDelete = classes.find((c) => c.id === editClassId);
    const classCoursesIds = classToDelete?.courseIds || [];
    const classCourseTitles = classToDelete?.courseTitles || [];
    
    const confirmed = confirm(
      classStudents.length > 0
        ? `This class has ${classStudents.length} student(s) and ${classCoursesIds.length} course(s) assigned.\n\nDeleting will:\n- Remove this class from students\n- Remove all course access granted through this class\n- Clear chapter access for assigned courses\n\nDo you want to continue?`
        : "Delete this class?"
    );
    if (!confirmed) return;

    // Remove class and associated course data from all students
    if (classStudents.length > 0) {
      const batch = writeBatch(db);
      
      classStudents.forEach((student) => {
        const studentRef = doc(db, "students", student.id);
        
        // Remove the class ID
        batch.update(studentRef, { classIds: arrayRemove(editClassId) });
        
        // Check if student is in other classes
        const otherClassIds = (student.classIds || []).filter((id) => id !== editClassId);
        
        // Get courses from other classes the student is in
        const otherClassesCourses = new Set();
        otherClassIds.forEach((classId) => {
          const otherClass = classes.find((c) => c.id === classId);
          if (otherClass?.courseIds) {
            otherClass.courseIds.forEach((courseId) => otherClassesCourses.add(courseId));
          }
        });
        
        // Remove course access and titles that are ONLY from this class
        const updatedChapterAccess = { ...student.chapterAccess };
        const updatedCoursesTitle = [...(student.coursesTitle || [])];
        
        classCoursesIds.forEach((courseId, index) => {
          // Only remove if student doesn't have access through another class
          if (!otherClassesCourses.has(courseId)) {
            delete updatedChapterAccess[courseId];
            
            // Remove corresponding course title
            const courseTitle = classCourseTitles[index];
            if (courseTitle) {
              const titleIndex = updatedCoursesTitle.indexOf(courseTitle);
              if (titleIndex > -1) {
                updatedCoursesTitle.splice(titleIndex, 1);
              }
            }
          }
        });
        
        // Update the student document with cleaned data
        batch.update(studentRef, { 
          chapterAccess: updatedChapterAccess,
          coursesTitle: updatedCoursesTitle
        });
      });
      
      await batch.commit();
      await fetchStudents();
    }

    // Delete the class document
    await deleteDoc(doc(db, "classes", editClassId));
    await fetchClasses();
    setShowEditClassModal(false);
    alert("🗑️ Class and all associated course access deleted successfully");
  }

  async function fetchChapters(courseId) {
    if (!courseId) {
      setChapters([]);
      return;
    }
    const snap = await getDocs(collection(db, "courses", courseId, "chapters"));
    const chaptersData = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    
    // Sort chapters by order field (if exists) or by creation timestamp
    const sortedChapters = chaptersData.sort((a, b) => {
      // If both have order, sort by order
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      // If only one has order, prioritize the one with order
      if (a.order !== undefined) return -1;
      if (b.order !== undefined) return 1;
      // If neither has order, maintain original order
      return 0;
    });
    
    setChapters(sortedChapters);
  }

  // 🔎 Helpers for filtering and selection
  const filteredStudents = students.filter((s) => {
    const emailMatch = !searchEmail.trim() || (s.email || "").toLowerCase().includes(searchEmail.trim().toLowerCase());
    return emailMatch;
  });

  // Sort students based on selected option
  const sortedStudents = [...students].sort((a, b) => {
    if (sortBy === "regNo") {
      const regNoA = a.registrationNumber || a.regdNo || a.regNo || a.regnNo || "";
      const regNoB = b.registrationNumber || b.regdNo || b.regNo || b.regnNo || "";
      
      // Extract numeric part from registration number for numeric sorting
      const numA = parseInt(regNoA.replace(/\D/g, '')) || 0;
      const numB = parseInt(regNoB.replace(/\D/g, '')) || 0;
      
      // If both have numbers, sort numerically
      if (numA && numB) {
        return numA - numB;
      }
      
      // Otherwise, fallback to string comparison
      return regNoA.localeCompare(regNoB);
    } else {
      // Sort by name alphabetically
      const nameA = (a.name || "").toLowerCase();
      const nameB = (b.name || "").toLowerCase();
      return nameA.localeCompare(nameB);
    }
  });

  function toggleSelectOne(studentId) {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  }

  function handleSelectAllStudents() {
    setSelectedStudentIds(students.map((s) => s.id));
  }

  function handleSelectAllFiltered() {
    setSelectedStudentIds(filteredStudents.map((s) => s.id));
  }

  function handleClearSelection() {
    setSelectedStudentIds([]);
  }

  // 🔹 Assign Student(s) to Class
  async function handleAssignStudentToClass(e) {
    e.preventDefault();
    if (!assignClass) return alert("Select a class first.");
    if (!selectedStudentIds.length)
      return alert("Select at least one student.");

    const batch = writeBatch(db);
    selectedStudentIds.forEach((id) => {
      const ref = doc(db, "students", id);
      // Support both legacy classId and new classIds
      batch.update(ref, { classIds: arrayUnion(assignClass) });
    });

    await batch.commit();

    alert(`✅ Added ${selectedStudentIds.length} student(s) to class!`);
    fetchStudents();
    setSelectedStudentIds([]);
  }

  // 🔹 Edit Student Functions
  function openEditStudent(student) {
    setEditStudent({ ...student });
    setShowEditStudentModal(true);
  }

  async function handleSaveStudentEdit(e) {
    e.preventDefault();
    if (!editStudent || !editStudent.id) return;

    try {
      const studentRef = doc(db, "students", editStudent.id);
      const updateData = {
        name: editStudent.name || "",
        email: editStudent.email || "",
        phone: editStudent.phone || "",
        registrationNumber: editStudent.registrationNumber || editStudent.regdNo || "",
        // Add any other fields you want to update
      };

      await updateDoc(studentRef, updateData);
      await fetchStudents();
      setShowEditStudentModal(false);
      setEditStudent(null);
      alert("✅ Student details updated successfully!");
    } catch (error) {
      console.error("Error updating student:", error);
      alert("❌ Failed to update student details");
    }
  }

  // 🔹 Assign Course & Chapters to Class
  async function handleAssignCourseToClass(e) {
    e.preventDefault();
    if (!selectedClass) return alert("Select a class first.");
    if (!selectedCourse) return alert("Select a course first.");

    // Get all students in the selected class
    const classStudents = students.filter((s) => Array.isArray(s.classIds) ? s.classIds.includes(selectedClass) : s.classId === selectedClass);
    if (classStudents.length === 0) {
      alert("No students found in this class.");
      return;
    }

    // Update all students in the class with course access
    const batch = writeBatch(db);
    const selectedCourseTitle = courses.find(c => c.id === selectedCourse)?.title || selectedCourse;
    
    classStudents.forEach((student) => {
      const studentRef = doc(db, "students", student.id);
      const updatedAccess = {
        ...(student.chapterAccess || {}),
        [selectedCourse]: selectedChapters,
      };
      
      // Update coursesTitle array - add course title if not already present
      const currentCoursesTitle = student.coursesTitle || [];
      const updatedCoursesTitle = currentCoursesTitle.includes(selectedCourseTitle) 
        ? currentCoursesTitle 
        : [...currentCoursesTitle, selectedCourseTitle];
      
      batch.update(studentRef, { 
        chapterAccess: updatedAccess,
        coursesTitle: updatedCoursesTitle
      });
    });

    // Also store the assigned course on the class document
    const classRef = doc(db, "classes", selectedClass);
    batch.update(classRef, {
      courseIds: arrayUnion(selectedCourse),
      courseTitles: arrayUnion(selectedCourseTitle),
      [`courseChapterAccess.${selectedCourse}`]: selectedChapters,
    });

    await batch.commit();

    alert(`✅ Course & chapters assigned to ${classStudents.length} students in class!`);
    fetchStudents();
  }


  return (
    <CheckAdminAuth>
      <div className="p-8 bg-gray-100 min-h-screen">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-4 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
        >
          ⬅ Back
        </button>

        <h1 className="text-3xl font-bold mb-6">User Manager</h1>

        <div className="bg-white p-6 rounded shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Add Class</h2>
        <form onSubmit={handleAddClass} className="flex gap-4">
          <input
            className="border p-2 rounded flex-1"
            placeholder="Class Name"
            value={newClass.name}
            onChange={(e) => setNewClass({ name: e.target.value })}
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Add
          </button>
        </form>
      </div>

        {/* Admission - Better UX */}
        <div className="bg-white p-6 rounded shadow mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Admissions</h2>
            <p className="text-sm text-gray-500">Create a new student admission using the guided form.</p>
          </div>
          <button
            onClick={() => setShowAdmissionModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            + Create New Admission
          </button>
        </div>

        {/* All Classes - Expandable with Student Lists */}
        <div className="bg-white p-6 rounded shadow mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">All Classes</h2>
            <div className="flex gap-2 items-center">
              <button
                className="text-sm bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"
                onClick={() => {
                  const allExpanded = {};
                  classes.forEach((c) => { allExpanded[c.id] = true; });
                  setExpandedClasses(allExpanded);
                }}
              >
                Expand All
              </button>
              <button
                className="text-sm bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"
                onClick={() => setExpandedClasses({})}
              >
                Collapse All
              </button>
              <span className="text-sm text-gray-500">Total: {classes.length}</span>
            </div>
          </div>
          {classes.length === 0 ? (
            <p className="text-gray-500">No classes yet. Add your first class above.</p>
          ) : (
            <div className="divide-y">
              {classes.map((c) => {
                const classStudents = students.filter((s) => Array.isArray(s.classIds) ? s.classIds.includes(c.id) : s.classId === c.id);
                const isOpen = !!expandedClasses[c.id];
                return (
                  <div key={c.id} className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          className="w-8 h-8 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200"
                          onClick={() => setExpandedClasses((prev) => ({ ...prev, [c.id]: !prev[c.id] }))}
                          aria-label={isOpen ? 'Collapse' : 'Expand'}
                        >
                          {isOpen ? '−' : '+'}
                        </button>
                        <h3 className="font-semibold text-gray-800">{c.name}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
                          {classStudents.length} student{classStudents.length === 1 ? '' : 's'}
                        </span>
                        <button
                          onClick={() => openEditClass(c)}
                          className="text-sm bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded"
                        >
                          Edit
                        </button>
                        
                      </div>
                    </div>
                    {isOpen && (
                      <div className="mt-3 bg-gray-50 border rounded">
                        {classStudents.length === 0 ? (
                          <p className="text-sm text-gray-500 p-3">No students in this class yet.</p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-gray-200">
                                  <th className="p-2 text-left">Name</th>
                                  <th className="p-2 text-left">Email</th>
                                  <th className="p-2 text-left">Courses</th>
                                </tr>
                              </thead>
                              <tbody>
                                {classStudents.map((s) => (
                                  <tr key={s.id} className="border-t">
                                    <td className="p-2">{s.name || '-'}</td>
                                    <td className="p-2">{s.email || '-'}</td>
                                    <td className="p-2">
                                      {Array.isArray(s.coursesTitle)
                                        ? s.coursesTitle.join(', ')
                                        : s.coursesTitle || '-'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 🔹 Assign Student(s) to Class */}
        <div className="bg-white p-6 rounded shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">Assign Student(s) to Batch</h2>
          <form onSubmit={handleAssignStudentToClass} className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search by Email"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="border p-2 rounded flex-1"
              />
            </div>

            {/* Students Multi-select */}
            <div className="border rounded p-3 max-h-64 overflow-auto">
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={handleSelectAllStudents}
                  className="bg-gray-200 px-3 py-1 rounded"
                >
                  Select All Students
                </button>
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="bg-gray-200 px-3 py-1 rounded"
                >
                  Select All (Filtered)
                </button>
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="bg-gray-200 px-3 py-1 rounded"
                >
                  Clear
                </button>
                <span className="text-sm text-gray-600">
                  Selected: {selectedStudentIds.length} / {students.length}
                </span>
              </div>
              {filteredStudents.length === 0 ? (
                <p className="text-sm text-gray-500">No students match your search.</p>
              ) : (
                <ul className="space-y-1">
                  {filteredStudents.map((s) => (
                    <li key={s.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedStudentIds.includes(s.id)}
                        onChange={() => toggleSelectOne(s.id)}
                      />
                      <span className="text-sm">
                        {s.name} — {s.email || "No email"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Select Class for Student */}
            <select
              value={assignClass}
              onChange={(e) => setAssignClass(e.target.value)}
              className="border p-2 rounded w-full"
            >
              <option value="">Select Class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Assign Selected
            </button>
          </form>
        </div>

        

        {/* 🔹 Assign Course & Chapters to Class */}
        <div className="bg-white p-6 rounded shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">Assign Course Access to Entire Batch</h2>
          <form onSubmit={handleAssignCourseToClass} className="space-y-4">
            {/* Select Class */}
            <select
              value={selectedClass}
              onChange={(e) => {
                const classId = e.target.value;
                setSelectedClass(classId);
                setSelectedCourse("");
                setSelectedChapters([]);
                
                // If a class is selected, show which courses are already assigned
                if (classId) {
                  const currentClass = classes.find((c) => c.id === classId);
                  if (currentClass?.courseIds && currentClass.courseIds.length > 0) {
                    // Show a message about existing course assignments
                    console.log(`Class "${currentClass.name}" has ${currentClass.courseIds.length} course(s) already assigned`);
                  }
                }
              }}
              className="border p-2 rounded w-full"
            >
              <option value="">Select Class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Show existing course assignments for selected class */}
            {selectedClass && (
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <h4 className="font-semibold text-blue-800 mb-2">Current Course Assignments</h4>
                {(() => {
                  const currentClass = classes.find((c) => c.id === selectedClass);
                  if (currentClass?.courseIds && currentClass.courseIds.length > 0) {
                    return (
                      <div className="space-y-1">
                        <p className="text-sm text-blue-700">
                          This class has {currentClass.courseIds.length} course(s) assigned:
                        </p>
                        <ul className="text-sm text-blue-600 ml-4">
                          {currentClass.courseTitles?.map((title, index) => (
                            <li key={index} className="list-disc">
                              {title}
                              {currentClass.courseChapterAccess?.[currentClass.courseIds[index]] && (
                                <span className="text-xs text-gray-500 ml-2">
                                  ({currentClass.courseChapterAccess[currentClass.courseIds[index]].length} chapters)
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                        <p className="text-xs text-blue-500 mt-2">
                          💡 When you select a course below, previously assigned chapters will be pre-checked.
                        </p>
                      </div>
                    );
                  } else {
                    return (
                      <p className="text-sm text-blue-600">
                        No courses assigned yet. Select a course below to assign chapters.
                      </p>
                    );
                  }
                })()}
              </div>
            )}

            {/* Select Course */}
            <select
              value={selectedCourse}
              onChange={(e) => {
                const courseId = e.target.value;
                setSelectedCourse(courseId);
                fetchChapters(courseId);
                // Prefill selectedChapters based on previous assignments for this class
                if (selectedClass && courseId) {
                  const currentClass = classes.find((c) => c.id === selectedClass);
                  if (currentClass?.courseChapterAccess?.[courseId]) {
                    // Use the class's stored chapter access
                    setSelectedChapters(currentClass.courseChapterAccess[courseId]);
                  } else {
                    // Fallback: check students' chapter access
                    const classStudents = students.filter((s) => 
                      Array.isArray(s.classIds) ? s.classIds.includes(selectedClass) : s.classId === selectedClass
                    );
                    const studentWithAccess = classStudents.find((s) => 
                      Array.isArray(s?.chapterAccess?.[courseId]) && s.chapterAccess[courseId].length > 0
                    );
                    if (studentWithAccess) {
                      setSelectedChapters(studentWithAccess.chapterAccess[courseId]);
                    } else {
                      setSelectedChapters([]);
                    }
                  }
                } else {
                  setSelectedChapters([]);
                }
              }}
              className="border p-2 rounded w-full"
            >
              <option value="">Select Course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>

            {/* Select Chapters */}
            {selectedCourse && chapters.length > 0 && (
              <div className="space-y-2 border p-3 rounded">
                <p className="font-semibold">Select Chapters</p>
                {chapters.map((chapter) => (
                  <label key={chapter.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedChapters.includes(chapter.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedChapters([...selectedChapters, chapter.id]);
                        } else {
                          setSelectedChapters(
                            selectedChapters.filter((id) => id !== chapter.id)
                          );
                        }
                      }}
                    />
                    <span>{chapter.title}</span>
                  </label>
                ))}
              </div>
            )}

            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Assign Course
            </button>
          </form>
        </div>

        {/* Students List */}
        <div className="bg-white p-6 rounded shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Students</h2>
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border p-2 rounded text-sm"
              >
                <option value="name">Name (Alphabetically A-Z)</option>
                <option value="regNo">Regd. No. (Numerically 1-2-3)</option>
              </select>
              <span className="text-sm text-gray-500">Total: {students.length}</span>
            </div>
          </div>
          {students.length === 0 ? (
            <p className="text-gray-500">No students yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border p-2">Regd. No.</th>
                    <th className="border p-2">Name</th>
                    <th className="border p-2">Email</th>
                    <th className="border p-2">Class</th>
                    <th className="border p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedStudents.map((s) => (
                    <tr key={s.id}>
                      <td className="border p-2 font-semibold text-gray-700">
                        {s.registrationNumber || s.regdNo || s.regNo || s.regnNo || '-'}
                      </td>
                      <td className="border p-2">{s.name}</td>
                      <td className="border p-2">{s.email}</td>
                      <td className="border p-2">
                        {Array.isArray(s.classIds) && s.classIds.length > 0
                          ? s.classIds
                              .map((cid) => classes.find((c) => c.id === cid)?.name)
                              .filter(Boolean)
                              .join(', ')
                          : (classes.find((c) => c.id === s.classId)?.name || "N/A")}
                      </td>
                      <td className="border p-2">
                        <button
                          onClick={() => openEditStudent(s)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Admission Modal */}
      {showAdmissionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-0 md:p-4">
          <div className="bg-white w-full h-full max-h-screen overflow-y-auto md:h-auto md:max-h-[90vh] md:rounded-lg md:max-w-4xl shadow-lg">
            <div className="flex items-center justify-between px-5 py-3 border-b sticky top-0 bg-white z-10">
              <h3 className="text-lg font-semibold">New Admission</h3>
              <button
                onClick={() => setShowAdmissionModal(false)}
                className="text-gray-600 hover:text-gray-800"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="p-5">
              <AdmissionForm
                onStudentAdded={() => {
                  fetchStudents();
                  setShowAdmissionModal(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Class Modal */}
      {showEditClassModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl">
            <div className="flex items-center justify-between px-5 py-3 border-b">
              <h3 className="text-lg font-semibold">Edit Class</h3>
              <button
                onClick={() => setShowEditClassModal(false)}
                className="text-gray-600 hover:text-gray-800"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-5">
              <form onSubmit={handleRenameClass} className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class Name</label>
                  <input
                    className="border p-2 rounded w-full"
                    value={editClassName}
                    onChange={(e) => setEditClassName(e.target.value)}
                    placeholder="Enter class name"
                  />
                </div>
                <button type="submit" className="h-10 mt-6 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded">Rename</button>
                <button type="button" onClick={handleDeleteClass} className="h-10 mt-6 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">Delete Class</button>
              </form>

              <div className="border rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Students in this class</h4>
                  <div className="flex gap-2">
                    <button onClick={editSelectAllInClass} className="text-sm bg-gray-200 px-3 py-1 rounded">Select All</button>
                    <button onClick={editClearSelection} className="text-sm bg-gray-200 px-3 py-1 rounded">Clear</button>
                  </div>
                </div>
                <div className="max-h-60 overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-2 text-left">Select</th>
                        <th className="p-2 text-left">Name</th>
                        <th className="p-2 text-left">Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.filter((s) => Array.isArray(s.classIds) ? s.classIds.includes(editClassId) : s.classId === editClassId).map((s) => (
                        <tr key={s.id} className="border-t">
                          <td className="p-2">
                            <input
                              type="checkbox"
                              checked={editSelectedStudentIds.includes(s.id)}
                              onChange={() => toggleEditSelectOne(s.id)}
                            />
                          </td>
                          <td className="p-2">{s.name || '-'}</td>
                          <td className="p-2">{s.email || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={handleRemoveSelectedFromClass} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">Remove from Class</button>
                <div className="flex items-center gap-2">
                  <select
                    value={moveTargetClassId}
                    onChange={(e) => setMoveTargetClassId(e.target.value)}
                    className="border p-2 rounded"
                  >
                    <option value="">Move to class...</option>
                    {classes.filter((c) => c.id !== editClassId).map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <button onClick={handleMoveSelectedToClass} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">Move Selected</button>
                </div>
              </div>

              {/* Course Management Section - Based on Students' chapterAccess */}
              <div className="border rounded p-3 mt-4 bg-blue-50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Courses (from Student Access)</h4>
                  <span className="text-sm text-gray-500">
                    {studentCourses.length} course(s)
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-3">
                  These courses are based on students&apos; actual chapterAccess data
                </p>
                
                {studentCourses.length === 0 ? (
                  <p className="text-sm text-gray-500 py-2">No courses found in students&apos; chapterAccess.</p>
                ) : (
                  <>
                    <div className="max-h-40 overflow-auto space-y-2">
                      {studentCourses.map((course) => (
                        <label key={course.id} className="flex items-center justify-between p-2 hover:bg-blue-100 rounded bg-white">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={selectedCoursesToRemove.includes(course.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedCoursesToRemove([...selectedCoursesToRemove, course.id]);
                                } else {
                                  setSelectedCoursesToRemove(
                                    selectedCoursesToRemove.filter((id) => id !== course.id)
                                  );
                                }
                              }}
                            />
                            <span className="text-sm font-medium">{course.title}</span>
                          </div>
                          <span className="text-xs bg-blue-100 px-2 py-1 rounded">
                            {course.studentCount} student{course.studentCount > 1 ? 's' : ''}
                          </span>
                        </label>
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => {
                          setSelectedCoursesToRemove(studentCourses.map(c => c.id));
                        }}
                        className="text-sm bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
                      >
                        Select All
                      </button>
                      <button
                        onClick={() => setSelectedCoursesToRemove([])}
                        className="text-sm bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
                      >
                        Clear
                      </button>
                      <button
                        onClick={handleRemoveCoursesFromClass}
                        disabled={selectedCoursesToRemove.length === 0}
                        className="ml-auto bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded text-sm"
                      >
                        Remove Selected Courses ({selectedCoursesToRemove.length})
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {showEditStudentModal && editStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-3 border-b sticky top-0 bg-white z-10">
              <h3 className="text-lg font-semibold">Edit Student Details</h3>
              <button
                onClick={() => {
                  setShowEditStudentModal(false);
                  setEditStudent(null);
                }}
                className="text-gray-600 hover:text-gray-800"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="p-5">
              <form onSubmit={handleSaveStudentEdit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Registration Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editStudent.registrationNumber || editStudent.regdNo || ""}
                    onChange={(e) => setEditStudent({ ...editStudent, registrationNumber: e.target.value })}
                    className="border p-2 rounded w-full"
                    placeholder="e.g., REG001"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editStudent.name || ""}
                    onChange={(e) => setEditStudent({ ...editStudent, name: e.target.value })}
                    className="border p-2 rounded w-full"
                    placeholder="Student Name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={editStudent.email || ""}
                    onChange={(e) => setEditStudent({ ...editStudent, email: e.target.value })}
                    className="border p-2 rounded w-full"
                    placeholder="student@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={editStudent.phone || ""}
                    onChange={(e) => setEditStudent({ ...editStudent, phone: e.target.value })}
                    className="border p-2 rounded w-full"
                    placeholder="Phone Number"
                  />
                </div>

                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-sm text-gray-600">
                    <strong>Current Classes:</strong>{" "}
                    {Array.isArray(editStudent.classIds) && editStudent.classIds.length > 0
                      ? editStudent.classIds
                          .map((cid) => classes.find((c) => c.id === cid)?.name)
                          .filter(Boolean)
                          .join(", ")
                      : classes.find((c) => c.id === editStudent.classId)?.name || "None"}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>Courses:</strong>{" "}
                    {Array.isArray(editStudent.coursesTitle)
                      ? editStudent.coursesTitle.join(", ")
                      : editStudent.coursesTitle || "None"}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    To change classes or courses, use the assignment sections above.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditStudentModal(false);
                      setEditStudent(null);
                    }}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </CheckAdminAuth>
  );
}
