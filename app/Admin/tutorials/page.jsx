 "use client";
import { useEffect, useState } from "react";
import { db } from "../../../lib/firebase";
import { mcqDb } from "../../../lib/firebaseMCQs";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import CheckAdminAuth from "@/lib/CheckAdminAuth";

export default function AdminPage() {
    const router = useRouter();
  const [courses, setCourses] = useState([]);
  const [newCourse, setNewCourse] = useState({ title: "", description: "", syllabus: "", courseCode: "" });
  const [newChapter, setNewChapter] = useState({ id: null, title: "", topics: "", video: "", liveClassLink: "", recordedClassLink: "", pdfDocument: "", classDocs: "", order: 0 });
  const [newAssignment, setNewAssignment] = useState({ 
    id: null, 
    title: "", 
    dueDate: "", 
    day: 1, // Day number for chapter association
    type: "mcq", // "mcq" or "coding"
    questions: []
  });
  const [currentQuestion, setCurrentQuestion] = useState({
    question: "",
    options: ["", "", "", ""],
    correctAnswers: [], // Changed to array to support multiple correct answers
    explanation: ""
  });
  const [codingQuestion, setCodingQuestion] = useState({
    question: "",
    description: "",
    testCases: [],
    language: "javascript"
  });
  const [currentTestCase, setCurrentTestCase] = useState({
    input: "",
    expectedOutput: ""
  });
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [editingChapterId, setEditingChapterId] = useState(null);
  const [showingAssignmentsForChapter, setShowingAssignmentsForChapter] = useState(null);
  const [showingChapterForm, setShowingChapterForm] = useState(null);
  const [practiceQuestions, setPracticeQuestions] = useState([]);
  const [showQuestionBank, setShowQuestionBank] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [selectedMCQCategory, setSelectedMCQCategory] = useState("all");
  const [selectedMCQChapter, setSelectedMCQChapter] = useState("all");
  const [selectedCodingLevel, setSelectedCodingLevel] = useState("all");
  const [selectedCodingTopic, setSelectedCodingTopic] = useState("all");
  const [showProgressTestForm, setShowProgressTestForm] = useState(false);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);
  const [currentChapterContext, setCurrentChapterContext] = useState(null); // Store current chapter for category

  // Concept/Topic categorization for coding questions
  const codingConceptTopics = [
    'Basic Syntax & Structure',
    'Data Types & Variables',
    'Operators & Expressions',
    'Conditional Statements',
    'Loops & Iterations',
    'Arrays & Lists',
    'Strings & Character Handling',
    'Functions / Methods',
    'Recursion',
    'Time & Space Complexity (Big O)',
    'Object-Oriented Programming (OOP)',
    'Exception & File Handling',
    'Searching Algorithms',
    'Sorting Algorithms',
    'Stack & Queue',
    'Linked List',
    'Hashing (HashMap / HashSet)',
    'Tree & Binary Search Tree (BST)',
    'Heap / Priority Queue',
    'Graph & Graph Algorithms',
    'Greedy Algorithms',
    'Dynamic Programming (DP)',
    'Backtracking',
    'Bit Manipulation'
  ];

  // Helpers for matching fixed labels to course titles
  const normalizeLabel = (str) => (str || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const isCourseMatchForLabel = (courseTitle, label) => {
    const courseNorm = normalizeLabel(courseTitle);
    const labelNorm = normalizeLabel(label);
    return courseNorm.includes(labelNorm) || labelNorm.includes(courseNorm);
  };

  // Fetch courses with chapters + assignments
  // Courses and chapters from primary Firebase, assignments from MCQ Firebase
  async function fetchCourses() {
    const snap = await getDocs(collection(db, "courses"));
    const courseList = [];

    for (const courseDoc of snap.docs) {
      const courseData = { id: courseDoc.id, ...courseDoc.data(), chapters: [], assignments: [] };

      // Fetch chapters from primary Firebase
      const chapterSnap = await getDocs(collection(db, "courses", courseDoc.id, "chapters"));
      courseData.chapters = chapterSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Fetch assignments from MCQ Firebase for better memory management
      const assignmentSnap = await getDocs(collection(mcqDb, "courses", courseDoc.id, "assignments"));
      courseData.assignments = assignmentSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      courseList.push(courseData);
    }

    setCourses(courseList);
  }

  useEffect(() => {
    fetchCourses();
  }, []);

  // Add or Update Course
  async function handleAddOrUpdateCourse(e) {
    e.preventDefault();
    const syllabusArray = typeof newCourse.syllabus === "string"
  ? newCourse.syllabus.split(",")
  : [];

    if (newCourse.id) {
      await updateDoc(doc(db, "courses", newCourse.id), {
        title: newCourse.title,
        description: newCourse.description,
        courseCode: newCourse.courseCode,
        syllabus: syllabusArray
      });
    } else {
      await addDoc(collection(db, "courses"), {
        title: newCourse.title,
        description: newCourse.description,
        courseCode: newCourse.courseCode,
        syllabus: syllabusArray,
        createdAt: new Date().toISOString()
      });
    }
    setNewCourse({ title: "", description: "", syllabus: "", courseCode: "" });
    fetchCourses();
  }

  async function handleDeleteCourse(id) {
    if (confirm("Are you sure you want to delete this course?")) {
      await deleteDoc(doc(db, "courses", id));
      fetchCourses();
    }
  }

  // Add or Update Chapter
  async function handleAddOrUpdateChapter(courseId, e) {
    e.preventDefault();
    
    // Calculate order for new chapters
    let chapterOrder = newChapter.order;
    if (!newChapter.id) {
      // For new chapters, get the highest order and add 1, or use timestamp if no order specified
      if (chapterOrder === 0) {
        const course = courses.find(c => c.id === courseId);
        if (course && course.chapters.length > 0) {
          const maxOrder = Math.max(...course.chapters.map(ch => ch.order || 0));
          chapterOrder = maxOrder + 1;
        } else {
          chapterOrder = 1;
        }
      }
    }
    
    if (newChapter.id) {
      await updateDoc(doc(db, "courses", courseId, "chapters", newChapter.id), {
        title: newChapter.title,
        topics: newChapter.topics,
        video: newChapter.video,
        liveClassLink: newChapter.liveClassLink,
        recordedClassLink: newChapter.recordedClassLink,
        pdfDocument: newChapter.pdfDocument,
        classDocs: newChapter.classDocs,
        order: chapterOrder
      });
    } else {
      await addDoc(collection(db, "courses", courseId, "chapters"), {
        title: newChapter.title,
        topics: newChapter.topics,
        video: newChapter.video,
        liveClassLink: newChapter.liveClassLink,
        recordedClassLink: newChapter.recordedClassLink,
        pdfDocument: newChapter.pdfDocument,
        classDocs: newChapter.classDocs,
        order: chapterOrder,
        createdAt: new Date().toISOString()
      });
    }
    clearChapterForm();
    fetchCourses();
  }

  async function handleDeleteChapter(courseId, chapterId) {
    if (confirm("Delete this chapter?")) {
      await deleteDoc(doc(db, "courses", courseId, "chapters", chapterId));
      fetchCourses();
    }
  }

  // Clear chapter form
  function clearChapterForm() {
    setNewChapter({ 
      id: null, 
      title: "", 
      topics: "", 
      video: "", 
      liveClassLink: "", 
      recordedClassLink: "", 
      pdfDocument: "", 
      classDocs: "",
      order: 0
    });
    setEditingChapterId(null);
  }

  // Add or Update Assignment - with day parameter
  async function handleAddOrUpdateAssignmentWithDay(courseId, assignmentData) {
    // Basic validation
    const safeTitle = (assignmentData.title || "").trim();
    const safeDue = assignmentData.dueDate || "";
    const safeDay = parseInt(assignmentData.day) || 1;
    const safeType = assignmentData.type || "mcq";

    // Sanitize questions array to remove undefined values
    const safeQuestions = Array.isArray(assignmentData.questions)
      ? assignmentData.questions.map((q) => {
          const base = {
            type: q?.type || safeType,
          };
          if ((q?.type || safeType) === "mcq") {
            // Handle both new correctAnswers (array) and old correctAnswer (single number) format
            let correctAnswers = [];
            if (Array.isArray(q?.correctAnswers)) {
              correctAnswers = q.correctAnswers;
            } else if (typeof q?.correctAnswer === "number") {
              correctAnswers = [q.correctAnswer];
            }
            
            return {
              ...base,
              question: (q?.question || "").trim(),
              options: Array.isArray(q?.options)
                ? q.options.map((opt) => (opt || ""))
                : ["", "", "", ""],
              correctAnswers: correctAnswers,
              explanation: q?.explanation || "",
              category: q?.category || currentChapterContext?.title || "Uncategorized", // Save category to Firebase
            };
          } else {
            return {
              ...base,
              question: (q?.question || "").trim(),
              description: (q?.description || ""),  // Preserve newlines in description
              language: q?.language || "javascript",
              testCases: Array.isArray(q?.testCases) ? q.testCases : [],  // Test cases with preserved newlines
              category: q?.category || currentChapterContext?.title || "Uncategorized", // Save category to Firebase
            };
          }
        })
      : [];

    const payload = {
      title: safeTitle,
      dueDate: safeDue,
      day: safeDay,
      type: safeType,
      questions: safeQuestions,
      category: currentChapterContext?.title || "Uncategorized", // Save chapter name as category
      chapterId: currentChapterContext?.id || null, // Save chapter ID for reference
    };

    try {
      if (assignmentData.id) {
        // Update assignment in MCQ Firebase
        await updateDoc(doc(mcqDb, "courses", courseId, "assignments", assignmentData.id), payload);
      } else {
        // Create assignment in MCQ Firebase
        await addDoc(collection(mcqDb, "courses", courseId, "assignments"), payload);
      }
      setNewAssignment({ id: null, title: "", dueDate: "", day: 1, type: "mcq", questions: [] });
      setCodingQuestion({ question: "", description: "", testCases: [], language: "javascript" });
      setCurrentQuestion({ question: "", options: ["", "", "", ""], correctAnswers: [], explanation: "" });
      setCurrentTestCase({ input: "", expectedOutput: "" });
      setShowProgressTestForm(false);
      setEditingQuestionIndex(null);
      await fetchCourses();
      alert("✅ Progress test saved successfully!");
    } catch (err) {
      console.error("Error saving assignment:", err);
      alert("❌ Failed to save assignment. Please verify fields and try again.");
    }
  }

  // Add or Update Assignment - legacy function (kept for compatibility)
  async function handleAddOrUpdateAssignment(courseId, e) {
    e.preventDefault();
    await handleAddOrUpdateAssignmentWithDay(courseId, newAssignment);
  }

  async function handleDeleteAssignment(courseId, assignmentId) {
    if (confirm("Delete this assignment?")) {
      // Delete assignment from MCQ Firebase
      await deleteDoc(doc(mcqDb, "courses", courseId, "assignments", assignmentId));
      fetchCourses();
    }
  }

  // Add MCQ Question
  function addMCQQuestion() {
    if (currentQuestion.question.trim() && currentQuestion.options.some(opt => opt.trim()) && currentQuestion.correctAnswers.length > 0) {
      if (editingQuestionIndex !== null) {
        // Update existing question
        const updatedQuestions = [...newAssignment.questions];
        updatedQuestions[editingQuestionIndex] = { 
          ...currentQuestion, 
          type: "mcq",
          category: currentChapterContext?.title || "Uncategorized"
        };
        setNewAssignment({
          ...newAssignment,
          questions: updatedQuestions
        });
        setEditingQuestionIndex(null);
      } else {
        // Add new question with chapter title as category
        setNewAssignment({
          ...newAssignment,
          questions: [...newAssignment.questions, { 
            ...currentQuestion, 
            type: "mcq",
            category: currentChapterContext?.title || "Uncategorized"
          }]
        });
      }
      setCurrentQuestion({
        question: "",
        options: ["", "", "", ""],
        correctAnswers: [],
        explanation: ""
      });
    } else if (currentQuestion.correctAnswers.length === 0) {
      alert("Please select at least one correct answer");
    }
  }

  // Toggle correct answer selection (for multiple choice support)
  function toggleCorrectAnswer(index) {
    const updatedAnswers = currentQuestion.correctAnswers.includes(index)
      ? currentQuestion.correctAnswers.filter(i => i !== index)
      : [...currentQuestion.correctAnswers, index];
    setCurrentQuestion({ ...currentQuestion, correctAnswers: updatedAnswers });
  }

  // Add Coding Question
  function addCodingQuestion() {
    if (codingQuestion.question.trim() && codingQuestion.description.trim()) {
      if (editingQuestionIndex !== null) {
        // Update existing question
        const updatedQuestions = [...newAssignment.questions];
        updatedQuestions[editingQuestionIndex] = { 
          ...codingQuestion, 
          type: "coding",
          category: currentChapterContext?.title || "Uncategorized"
        };
        setNewAssignment({
          ...newAssignment,
          questions: updatedQuestions
        });
        setEditingQuestionIndex(null);
      } else {
        // Add new question with chapter title as category
        setNewAssignment({
          ...newAssignment,
          questions: [...newAssignment.questions, { 
            ...codingQuestion, 
            type: "coding",
            category: currentChapterContext?.title || "Uncategorized"
          }]
        });
      }
      setCodingQuestion({
        question: "",
        description: "",
        testCases: [],
        language: "javascript"
      });
    }
  }

  // Add Test Case to Coding Question
  function addTestCase() {
    // Validate that there's content (trim for checking only, don't modify the actual data)
    if (currentTestCase.input.trim() && currentTestCase.expectedOutput.trim()) {
      setCodingQuestion({
        ...codingQuestion,
        testCases: [...codingQuestion.testCases, { 
          input: currentTestCase.input,  // Store with newlines preserved
          expectedOutput: currentTestCase.expectedOutput  // Store with newlines preserved
        }]
      });
      setCurrentTestCase({
        input: "",
        expectedOutput: ""
      });
    }
  }

  // Remove Test Case from Coding Question
  function removeTestCase(index) {
    const updatedTestCases = codingQuestion.testCases.filter((_, i) => i !== index);
    setCodingQuestion({ ...codingQuestion, testCases: updatedTestCases });
  }

  // Edit Test Case
  function editTestCase(index) {
    const testCaseToEdit = codingQuestion.testCases[index];
    setCurrentTestCase({
      input: testCaseToEdit.input,
      expectedOutput: testCaseToEdit.expectedOutput
    });
    // Remove the test case from the list (it will be re-added when they click "Add Test Case")
    removeTestCase(index);
  }

  // Remove Question
  function removeQuestion(index) {
    const updatedQuestions = newAssignment.questions.filter((_, i) => i !== index);
    setNewAssignment({ ...newAssignment, questions: updatedQuestions });
    
    // If we're editing this question, cancel the edit
    if (editingQuestionIndex === index) {
      setEditingQuestionIndex(null);
      setCurrentQuestion({ question: "", options: ["", "", "", ""], correctAnswers: [], explanation: "" });
      setCodingQuestion({ question: "", description: "", testCases: [], language: "javascript" });
    } else if (editingQuestionIndex !== null && editingQuestionIndex > index) {
      // Adjust the editing index if we removed a question before it
      setEditingQuestionIndex(editingQuestionIndex - 1);
    }
  }
  
  // Cancel editing a question
  function cancelEditQuestion() {
    setEditingQuestionIndex(null);
    setCurrentQuestion({ question: "", options: ["", "", "", ""], correctAnswers: [], explanation: "" });
    setCodingQuestion({ question: "", description: "", testCases: [], language: "javascript" });
  }

  // Edit Question
  function editQuestion(index) {
    const questionToEdit = newAssignment.questions[index];
    
    if (questionToEdit.type === "mcq") {
      // Populate MCQ form
      setCurrentQuestion({
        question: questionToEdit.question,
        options: questionToEdit.options,
        correctAnswers: questionToEdit.correctAnswers,
        explanation: questionToEdit.explanation || ""
      });
    } else if (questionToEdit.type === "coding") {
      // Populate coding form
      setCodingQuestion({
        question: questionToEdit.question,
        description: questionToEdit.description,
        testCases: questionToEdit.testCases || [],
        language: questionToEdit.language || "javascript"
      });
    }
    
    // Set editing index instead of removing the question
    setEditingQuestionIndex(index);
    
    // Scroll to the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Update MCQ option
  function updateMCQOption(index, value) {
    const updatedOptions = [...currentQuestion.options];
    updatedOptions[index] = value;
    setCurrentQuestion({ ...currentQuestion, options: updatedOptions });
  }

  // Fetch practice questions: if courseId provided, load only that course
  async function fetchPracticeQuestions(courseId) {
    try {
      let loadedMcqs = [];
      if (courseId) {
        const course = courses.find(c => c.id === courseId);
        const questionsRef = collection(db, "mcqs", courseId, "questions");
        const snap = await getDocs(questionsRef);
        loadedMcqs = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          categoryId: courseId,
          categoryTitle: course?.title || "",
        }));
        setSelectedMCQCategory(courseId);
      } else {
        for (const course of courses) {
          const questionsRef = collection(db, "mcqs", course.id, "questions");
          const snap = await getDocs(questionsRef);
          const courseMcqs = snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
            categoryId: course.id,
            categoryTitle: course.title,
          }));
          loadedMcqs = loadedMcqs.concat(courseMcqs);
        }
        setSelectedMCQCategory("all");
      }
      setPracticeQuestions(loadedMcqs);
      setSelectedDifficulty("all");
      setSelectedMCQChapter("all");
      setShowQuestionBank(true);
    } catch (error) {
      console.error("Error loading practice MCQs:", error);
      setPracticeQuestions([]);
      setShowQuestionBank(true);
    }
  }

  // Fetch coding questions from practice bank
  async function fetchCodingQuestions() {
    try {
      const snap = await getDocs(collection(mcqDb, "codingQuestions"));
      const questions = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPracticeQuestions(questions);
      setSelectedDifficulty("all");
      setSelectedMCQCategory("all");
      setSelectedMCQChapter("all");
      setSelectedCodingLevel("all");
      setSelectedCodingTopic("all");
      setShowQuestionBank(true);
    } catch (error) {
      console.error("Error fetching coding questions:", error);
      setPracticeQuestions([]);
      setShowQuestionBank(true);
    }
  }

  // Add selected practice questions to assignment
  function addSelectedPracticeQuestions() {
    const questionsToAdd = selectedQuestions.map(qId => {
      const question = practiceQuestions.find(q => q.id === qId);
      
      if (newAssignment.type === "mcq") {
        // Handle both string and object options
        const processedOptions = question.options.map(opt => 
          typeof opt === 'object' ? opt.text : opt
        );
        // Determine correct answer indices (supports answers array or single answer)
        let correctIndices = [];
        if (Array.isArray(question.answers) && question.answers.length > 0) {
          // Multiple correct answers
          question.answers.forEach(answer => {
            const idx = processedOptions.findIndex(t => t === answer);
            if (idx >= 0) correctIndices.push(idx);
          });
        } else if (question.answer) {
          // Single correct answer
          const idx = processedOptions.indexOf(question.answer);
          if (idx >= 0) correctIndices.push(idx);
        }
        if (correctIndices.length === 0) correctIndices = [0];

        return {
          question: (question.title || question.question || ""),
          options: processedOptions,
          correctAnswers: correctIndices,
          explanation: "",
          type: "mcq"
        };
      } else {
        return {
          question: (question.title || question.question || ""),
          description: question.description,
          language: question.language || "javascript",
          testCases: Array.isArray(question.testCases) ? question.testCases : [],
          type: "coding"
        };
      }
    });

    setNewAssignment({
      ...newAssignment,
      questions: [...newAssignment.questions, ...questionsToAdd]
    });
    setSelectedQuestions([]);
    setSelectedDifficulty("all");
    setSelectedMCQCategory("all");
    setSelectedMCQChapter("all");
    setShowQuestionBank(false);
  }

  // Toggle question selection
  function toggleQuestionSelection(questionId) {
    setSelectedQuestions(prev => 
      prev.includes(questionId) 
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  }

  // Move chapter up in order
  async function moveChapterUp(courseId, chapterId) {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;
    
    const chapters = course.chapters.sort((a, b) => (a.order || 0) - (b.order || 0));
    const currentIndex = chapters.findIndex(ch => ch.id === chapterId);
    
    if (currentIndex > 0) {
      const currentChapter = chapters[currentIndex];
      const previousChapter = chapters[currentIndex - 1];
      
      // Swap orders
      await updateDoc(doc(db, "courses", courseId, "chapters", currentChapter.id), {
        order: previousChapter.order || 0
      });
      await updateDoc(doc(db, "courses", courseId, "chapters", previousChapter.id), {
        order: currentChapter.order || 0
      });
      
      fetchCourses();
    }
  }

  // Move chapter down in order
  async function moveChapterDown(courseId, chapterId) {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;
    
    const chapters = course.chapters.sort((a, b) => (a.order || 0) - (b.order || 0));
    const currentIndex = chapters.findIndex(ch => ch.id === chapterId);
    
    if (currentIndex < chapters.length - 1) {
      const currentChapter = chapters[currentIndex];
      const nextChapter = chapters[currentIndex + 1];
      
      // Swap orders
      await updateDoc(doc(db, "courses", courseId, "chapters", currentChapter.id), {
        order: nextChapter.order || 0
      });
      await updateDoc(doc(db, "courses", courseId, "chapters", nextChapter.id), {
        order: currentChapter.order || 0
      });
      
      fetchCourses();
    }
  }

  // Reorder all chapters sequentially
  async function reorderChapters(courseId) {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;
    
    const chapters = course.chapters.sort((a, b) => (a.order || 0) - (b.order || 0));
    
    // Update each chapter with sequential order
    for (let i = 0; i < chapters.length; i++) {
      await updateDoc(doc(db, "courses", courseId, "chapters", chapters[i].id), {
        order: i + 1
      });
    }
    
    fetchCourses();
  }

  return (
    <CheckAdminAuth>
    <div className="p-8 bg-gray-100 min-h-screen">
      <button
        onClick={() => router.back()}
        className="mb-4 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
      >
        ⬅ Back
      </button>
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* Add / Edit Course */}
      <div className="bg-white p-6 rounded shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">{newCourse.id ? "Edit Course" : "Add New Course"}</h2>
        <form onSubmit={handleAddOrUpdateCourse} className="grid grid-cols-2 gap-4">
          <input className="border p-2 rounded" placeholder="Course Title" value={newCourse.title} onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })} />
          <input className="border p-2 rounded" placeholder="Course Code (Unique)" value={newCourse.courseCode} onChange={(e) => setNewCourse({ ...newCourse, courseCode: e.target.value })} />
          <textarea className="border p-2 rounded col-span-2" placeholder="Description" value={newCourse.description} onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })} />
          <textarea className="border p-2 rounded col-span-2" placeholder="Syllabus (comma separated)" value={newCourse.syllabus} onChange={(e) => setNewCourse({ ...newCourse, syllabus: e.target.value })} />
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded col-span-2">{newCourse.id ? "Update Course" : "Add Course"}</button>
        </form>
      </div>

      {/* Course List */}
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Courses</h2>
        {courses.map((course) => (
          <div key={course.id} className="border rounded p-4 mb-4">
            <div className="flex justify-between">
              <div>
                <h3 className="font-bold text-lg">{course.title}</h3>
                <p className="text-sm">{course.description}</p>
                <p className="text-xs text-gray-500">Code: {course.courseCode}</p>
              </div>
              <div className="flex gap-2">
                <button className="bg-yellow-500 text-white px-3 py-1 rounded" onClick={() => setNewCourse(course)}>Edit</button>
                <button className="bg-red-500 text-white px-3 py-1 rounded" onClick={() => handleDeleteCourse(course.id)}>Delete</button>
                <button className="bg-gray-500 text-white px-3 py-1 rounded" onClick={() => setSelectedCourseId(selectedCourseId === course.id ? null : course.id)}>{selectedCourseId === course.id ? "Hide" : "View"}</button>
              </div>
            </div>

            {/* Expanded Details */}
            {selectedCourseId === course.id && (
              <div className="mt-4">
                {/* Chapters */}
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold">Chapters</h4>
                  {course.chapters.length > 0 && (
                    <button 
                      onClick={() => reorderChapters(course.id)}
                      className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                      title="Reorder chapters sequentially"
                    >
                      🔄 Reorder
                    </button>
                  )}
                </div>
                {course.chapters
                  .sort((a, b) => (a.order || 0) - (b.order || 0))
                  .map((ch) => (
                  <div key={ch.id} className="border p-3 rounded mb-2">
                    <div className="flex justify-between">
                                              <div>
                          <div className="flex items-center gap-2">
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-medium">
                              Order: {ch.order || 0}
                            </span>
                            <p className="font-bold">{ch.title}</p>
                          </div>
                          <p className="text-sm text-gray-600">{ch.topics}</p>
                           <div className="flex flex-wrap gap-2 mt-2">
                            {ch.video && <a href={ch.video} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline text-sm">Video</a>}
                            {ch.liveClassLink && <a href={ch.liveClassLink} target="_blank" rel="noopener noreferrer" className="text-green-500 underline text-sm">Live Class</a>}
                            {ch.recordedClassLink && <a href={ch.recordedClassLink} target="_blank" rel="noopener noreferrer" className="text-purple-500 underline text-sm">Watch Video</a>}
                            {ch.pdfDocument && <span className="text-red-500 text-sm">📄 PDF: {ch.pdfDocument.substring(0, 50)}...</span>}
                            {ch.classDocs && <span className="text-orange-500 text-sm">📊 PPTs: {ch.classDocs.substring(0, 50)}...</span>}
                          </div>
                        </div>
                                             <div className="flex gap-2">
                         <button 
                           className="text-blue-600" 
                           onClick={() => moveChapterUp(course.id, ch.id)}
                           title="Move Up"
                         >
                           ⬆️
                         </button>
                         <button 
                           className="text-blue-600" 
                           onClick={() => moveChapterDown(course.id, ch.id)}
                           title="Move Down"
                         >
                           ⬇️
                         </button>
                         <button className="text-yellow-600" onClick={() => {
                           setNewChapter({
                             ...ch,
                             classDocs: ch.classDocs || "",
                             liveClassLink: ch.liveClassLink || "",
                             recordedClassLink: ch.recordedClassLink || "",
                             pdfDocument: ch.pdfDocument || "",
                             order: ch.order || 0
                           });
                           setEditingChapterId(ch.id);
                           setShowingAssignmentsForChapter(null);
                           setShowingChapterForm(null);
                           setCurrentChapterContext(null); // Clear chapter context when editing chapter
                         }}>Edit</button>
                         <button 
                          className="text-purple-600" 
                          onClick={() => {
                            const isClosing = showingAssignmentsForChapter === ch.id;
                            setShowingAssignmentsForChapter(isClosing ? null : ch.id);
                            setEditingChapterId(null);
                            setShowingChapterForm(null);
                            setShowProgressTestForm(false);
                            setNewAssignment({ id: null, title: "", dueDate: "", day: 1, type: "mcq", questions: [] });
                            // Set or clear chapter context based on opening/closing
                            setCurrentChapterContext(isClosing ? null : ch);
                          }}
                        >
                          Progress Tests
                        </button>
                         <button className="text-red-600" onClick={() => handleDeleteChapter(course.id, ch.id)}>Delete</button>
                       </div>
                    </div>
                    
                    {/* Inline Edit Form - appears when this chapter is being edited */}
                    {editingChapterId === ch.id && (
                      <div className="mt-4 border-t pt-4 bg-gray-50 p-3 rounded">
                        <h5 className="font-semibold mb-3 text-blue-600">Editing: {ch.title}</h5>
                        <form onSubmit={(e) => handleAddOrUpdateChapter(course.id, e)} className="grid grid-cols-2 gap-2">
                          <input className="border p-2 rounded" placeholder="Chapter Title" value={newChapter.title || ""} onChange={(e) => setNewChapter({ ...newChapter, title: e.target.value })} />
                          <input 
                            type="number" 
                            className="border p-2 rounded" 
                            placeholder="Order (Optional)" 
                            value={newChapter.order || ""} 
                            onChange={(e) => setNewChapter({ ...newChapter, order: parseInt(e.target.value) || 0 })} 
                          />
                          <input className="border p-2 rounded" placeholder="Video URL (Optional)" value={newChapter.video || ""} onChange={(e) => setNewChapter({ ...newChapter, video: e.target.value })} />
                          <input className="border p-2 rounded" placeholder="Live Class Link (Optional)" value={newChapter.liveClassLink || ""} onChange={(e) => setNewChapter({ ...newChapter, liveClassLink: e.target.value })} />
                          <input className="border p-2 rounded" placeholder="Class Live Video Link (Optional)" value={newChapter.recordedClassLink || ""} onChange={(e) => setNewChapter({ ...newChapter, recordedClassLink: e.target.value })} />
                          <input className="border p-2 rounded" placeholder="PPTs (Google Drive Link)" value={newChapter.classDocs || ""} onChange={(e) => setNewChapter({ ...newChapter, classDocs: e.target.value })} />
                         <input className="border p-2 rounded" placeholder="PDF Document (Google Drive Link)" value={newChapter.pdfDocument || ""} onChange={(e) => setNewChapter({ ...newChapter, pdfDocument: e.target.value })} />
                                         <textarea className="border p-2 rounded col-span-2" placeholder="topics" value={newChapter.topics || ""} onChange={(e) => setNewChapter({ ...newChapter, topics: e.target.value })} />
                          <div className="col-span-2 flex gap-2">
                            <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded flex-1">{newChapter.id ? "Update Chapter" : "Add Chapter"}</button>
                            <button type="button" onClick={clearChapterForm} className="bg-gray-500 text-white px-4 py-2 rounded">Cancel</button>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* Inline Progress Tests Section - appears when Progress Tests button is clicked */}
                    {showingAssignmentsForChapter === ch.id && (
                      <div className="mt-4 border-t pt-4 bg-purple-50 p-3 rounded">
                        <h5 className="font-semibold mb-3 text-purple-600">Progress Tests for: {ch.title}</h5>
                        
                        {/* Display existing progress tests for this chapter */}
                        <div className="mb-4">
                          <h6 className="font-medium mb-2">Existing Progress Tests</h6>
                          {course.assignments
                            .filter(a => a.day === ch.order)
                            .map((a) => (
                              <div key={a.id} className="border p-3 rounded mb-2 bg-white">
                                <div className="flex justify-between">
                                  <div>
                                    <p className="font-bold">{a.title}</p>
                                    <p className="text-sm text-gray-600">Due: {a.dueDate} | Day: {a.day || 1}</p>
                                    {a.category && (
                                      <p className="text-xs text-purple-600 font-medium">📚 Category: {a.category}</p>
                                    )}
                                    <p className="text-xs text-gray-500">
                                      Type: {a.type === "mcq" ? "MCQ" : "Coding"} | 
                                      Questions: {a.questions ? a.questions.length : 0}
                                    </p>
                                    {a.questions && a.questions.length > 0 && (
                                      <div className="mt-2">
                                        {a.questions.slice(0, 2).map((q, idx) => (
                                          <p key={idx} className="text-xs text-gray-600">
                                            {idx + 1}. {(q.question || "").substring(0, 50)}...
                                          </p>
                                        ))}
                                        {a.questions.length > 2 && (
                                          <p className="text-xs text-gray-500">+{a.questions.length - 2} more questions</p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex gap-2">
                                    <button className="text-yellow-600" onClick={() => {
                                      setNewAssignment({
                                      ...a,
                                      questions: a.questions || []
                                      });
                                      // Preserve chapter context when editing
                                      if (!currentChapterContext || currentChapterContext.id !== ch.id) {
                                        setCurrentChapterContext(ch);
                                      }
                                      setShowProgressTestForm(true);
                                    }}>Edit</button>
                                    <button className="text-red-600" onClick={() => handleDeleteAssignment(course.id, a.id)}>Delete</button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          {course.assignments.filter(a => a.day === ch.order).length === 0 && (
                            <p className="text-sm text-gray-500 italic">No progress tests for this chapter yet.</p>
                          )}
                        </div>

                        {/* Add New Progress Test Button */}
                        {!showProgressTestForm && (
                          <button 
                            onClick={() => setShowProgressTestForm(true)}
                            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded w-full mb-4"
                          >
                            ➕ Add New Progress Test
                          </button>
                        )}

                        {/* Progress Test Form */}
                        {showProgressTestForm && (
                        <div className="border p-4 rounded bg-white">
                          <div className="flex justify-between items-center mb-3">
                            <h6 className="font-semibold">{newAssignment.id ? "Edit Progress Test" : "Add New Progress Test"}</h6>
                            {currentChapterContext && (
                              <span className="text-xs bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
                                📚 Category: {currentChapterContext.title}
                              </span>
                            )}
                          </div>
                          
                          <form onSubmit={(e) => {
                            e.preventDefault();
                            // Set the day to match chapter order before submitting
                            const assignmentWithDay = { ...newAssignment, day: ch.order || 1 };
                            
                            // Call handler with the correct day value
                            handleAddOrUpdateAssignmentWithDay(course.id, assignmentWithDay);
                          }} className="space-y-4">
                            <div className="space-y-3">
                              <input 
                                className="border p-2 rounded w-full" 
                                placeholder="Progress Test Title" 
                                value={newAssignment.title || ""} 
                                onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })} 
                              />
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <input 
                                    type="date" 
                                    className="border p-2 rounded w-full" 
                                    value={newAssignment.dueDate || ""} 
                                    onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })} 
                                  />
                                  <p className="text-xs text-gray-500 mt-1">Optional: Auto-set to 3 days after unlock</p>
                                </div>
                                <div>
                                  <input 
                                    type="number" 
                                    min="1"
                                    className="border p-2 rounded bg-gray-100 w-full" 
                                    placeholder="Day Number" 
                                    value={ch.order || 1}
                                    disabled
                                    title="Day is automatically set to chapter order"
                                  />
                                  <p className="text-xs text-gray-500 mt-1">Auto-set to chapter order</p>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              <button 
                                type="button"
                                className={`px-3 py-1 rounded ${newAssignment.type === "mcq" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
                                onClick={() => setNewAssignment({ ...newAssignment, type: "mcq" })}
                              >
                                MCQ Questions
                              </button>
                              <button 
                                type="button"
                                className={`px-3 py-1 rounded ${newAssignment.type === "coding" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
                                onClick={() => setNewAssignment({ ...newAssignment, type: "coding" })}
                              >
                                Coding Questions
                              </button>
                            </div>

                            {/* MCQ Question Form */}
                            {newAssignment.type === "mcq" && (
                              <div className="border p-3 rounded">
                                <div className="flex justify-between items-center mb-2">
                                  <h6 className="font-medium">Add MCQ Question</h6>
                                  <button 
                                    type="button" 
                                    onClick={() => fetchPracticeQuestions(selectedCourseId)}
                                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                                  >
                                    Select from Practice Bank
                                  </button>
                                </div>
                                <div className="space-y-2">
                                  <textarea 
                                    className="border p-2 rounded w-full" 
                                    placeholder="Question" 
                                    value={currentQuestion.question || ""} 
                                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, question: e.target.value })} 
                                  />
                                  <div className="space-y-2">
                                    <p className="text-xs text-gray-600 italic">✓ Check all correct answers (supports multiple)</p>
                                    {currentQuestion.options.map((option, index) => (
                                      <div key={index} className="flex items-center gap-2">
                                        <input 
                                          type="checkbox" 
                                          checked={currentQuestion.correctAnswers.includes(index)}
                                          onChange={() => toggleCorrectAnswer(index)}
                                          className="w-4 h-4"
                                        />
                                        <input 
                                          className="border p-2 rounded flex-1" 
                                          placeholder={`Option ${index + 1}`} 
                                          value={option || ""} 
                                          onChange={(e) => updateMCQOption(index, e.target.value)} 
                                        />
                                      </div>
                                    ))}
                                  </div>
                                  <textarea 
                                    className="border p-2 rounded w-full" 
                                    placeholder="Explanation (Optional)" 
                                    value={currentQuestion.explanation || ""} 
                                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, explanation: e.target.value })} 
                                  />
                                  <div className="flex gap-2">
                                    <button 
                                      type="button" 
                                      onClick={addMCQQuestion}
                                      className="bg-green-500 text-white px-3 py-1 rounded flex-1"
                                    >
                                      {editingQuestionIndex !== null ? "Update MCQ Question" : "Add MCQ Question"}
                                    </button>
                                    {editingQuestionIndex !== null && (
                                      <button 
                                        type="button" 
                                        onClick={cancelEditQuestion}
                                        className="bg-gray-500 text-white px-3 py-1 rounded"
                                      >
                                        Cancel
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Coding Question Form */}
                            {newAssignment.type === "coding" && (
                              <div className="border p-3 rounded">
                                <div className="flex justify-between items-center mb-2">
                                  <h6 className="font-medium">Add Coding Question</h6>
                                  <button 
                                    type="button" 
                                    onClick={fetchCodingQuestions}
                                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                                  >
                                    Select from Practice Bank
                                  </button>
                                </div>
                                
                                <div className="space-y-3 mt-3">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Question Title</label>
                                    <input 
                                      className="border p-2 rounded w-full" 
                                      placeholder="Enter question title" 
                                      value={codingQuestion.question || ""} 
                                      onChange={(e) => setCodingQuestion({ ...codingQuestion, question: e.target.value })} 
                                    />
                                  </div>
                                  
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea 
                                      className="border p-2 rounded w-full font-mono" 
                                      placeholder="Enter question description and requirements (formatting will be preserved)" 
                                      rows="6"
                                      value={codingQuestion.description || ""} 
                                      onChange={(e) => setCodingQuestion({ ...codingQuestion, description: e.target.value })} 
                                    />
                                    <p className="text-xs text-gray-500 mt-1">💡 Formatting preserved: Use Enter for new lines, spaces for indentation</p>
                                  </div>
                                  
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Programming Language</label>
                                    <select 
                                      className="border p-2 rounded w-full"
                                      value={codingQuestion.language || "javascript"}
                                      onChange={(e) => setCodingQuestion({ ...codingQuestion, language: e.target.value })}
                                    >
                                      <option value="javascript">JavaScript</option>
                                      <option value="python">Python</option>
                                      <option value="java">Java</option>
                                      <option value="cpp">C++</option>
                                      <option value="c">C</option>
                                    </select>
                                  </div>
                                  
                                  {/* Test Cases Section */}
                                  <div className="border-t pt-3">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Test Cases</label>
                                    
                                    {/* Display existing test cases */}
                                    {codingQuestion.testCases && codingQuestion.testCases.length > 0 && (
                                      <div className="mb-3 space-y-2">
                                        {codingQuestion.testCases.map((tc, index) => (
                                          <div key={index} className="bg-gray-50 p-3 rounded">
                                            <div className="flex justify-between items-start mb-2">
                                              <p className="text-sm font-medium">Test Case {index + 1}</p>
                                              <div className="flex gap-2">
                                                <button 
                                                  type="button" 
                                                  onClick={() => editTestCase(index)}
                                                  className="text-yellow-600 text-sm hover:text-yellow-700"
                                                >
                                                  Edit
                                                </button>
                                                <button 
                                                  type="button" 
                                                  onClick={() => removeTestCase(index)}
                                                  className="text-red-500 text-sm hover:text-red-600"
                                                >
                                                  Remove
                                                </button>
                                              </div>
                                            </div>
                                            <div className="space-y-1">
                                              <div>
                                                <p className="text-xs font-medium text-gray-700">Input:</p>
                                                <p className="text-xs text-gray-600 whitespace-pre-wrap bg-white p-2 rounded border">{tc.input}</p>
                                              </div>
                                              <div>
                                                <p className="text-xs font-medium text-gray-700">Expected Output:</p>
                                                <p className="text-xs text-gray-600 whitespace-pre-wrap bg-white p-2 rounded border">{tc.expectedOutput}</p>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    
                                    {/* Add new test case */}
                                    <div className="bg-blue-50 p-3 rounded space-y-2">
                                      <p className="text-sm font-medium text-blue-800">Add New Test Case</p>
                                      <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Input</label>
                                        <textarea 
                                          className="border p-2 rounded w-full text-sm font-mono" 
                                          placeholder="Enter input for test case (newlines will be preserved)
Example:
4
2 7 11 15
9" 
                                          rows="4"
                                          value={currentTestCase.input || ""} 
                                          onChange={(e) => setCurrentTestCase({ ...currentTestCase, input: e.target.value })} 
                                        />
                                        <p className="text-xs text-gray-500 mt-1">💡 Tip: Press Enter to add new lines - they will be preserved exactly as typed</p>
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Expected Output</label>
                                        <textarea 
                                          className="border p-2 rounded w-full text-sm font-mono" 
                                          placeholder="Enter expected output (newlines will be preserved)" 
                                          rows="4"
                                          value={currentTestCase.expectedOutput || ""} 
                                          onChange={(e) => setCurrentTestCase({ ...currentTestCase, expectedOutput: e.target.value })} 
                                        />
                                        <p className="text-xs text-gray-500 mt-1">💡 Tip: Press Enter to add new lines - they will be preserved exactly as typed</p>
                                      </div>
                                      <button 
                                        type="button" 
                                        onClick={addTestCase}
                                        className="bg-blue-500 text-white px-3 py-1 rounded text-sm w-full"
                                      >
                                        Add Test Case
                                      </button>
                                    </div>
                                  </div>
                                  
                                  <div className="flex gap-2">
                                    <button 
                                      type="button" 
                                      onClick={addCodingQuestion}
                                      className="bg-green-500 text-white px-4 py-2 rounded flex-1"
                                      disabled={!codingQuestion.question.trim() || !codingQuestion.description.trim()}
                                    >
                                      {editingQuestionIndex !== null ? "Update Coding Question" : "Add Coding Question"}
                                    </button>
                                    {editingQuestionIndex !== null && (
                                      <button 
                                        type="button" 
                                        onClick={cancelEditQuestion}
                                        className="bg-gray-500 text-white px-4 py-2 rounded"
                                      >
                                        Cancel
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Display Added Questions */}
                            {newAssignment.questions && newAssignment.questions.length > 0 && (
                              <div className="border p-3 rounded">
                                <h6 className="font-medium mb-2">Added Questions ({newAssignment.questions.length})</h6>
                                <div className="space-y-2">
                                  {newAssignment.questions.map((q, index) => (
                                    <div key={index} className={`p-3 rounded border-2 ${editingQuestionIndex === index ? 'bg-yellow-50 border-yellow-400' : 'bg-gray-50 border-transparent'}`}>
                                      <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium">
                                              {index + 1}. {q.question}
                                            </p>
                                            {editingQuestionIndex === index && (
                                              <span className="text-xs bg-yellow-500 text-white px-2 py-1 rounded">Editing</span>
                                            )}
                                          </div>
                                          <p className="text-xs text-gray-500 mt-1">Type: {q.type === "mcq" ? "MCQ" : "Coding"}</p>
                                          {q.category && (
                                            <p className="text-xs text-purple-600 mt-1">📚 Category: {q.category}</p>
                                          )}
                                          {q.type === "coding" && q.description && (
                                            <p className="text-xs text-gray-600 mt-2 whitespace-pre-wrap">{q.description.substring(0, 100)}{q.description.length > 100 ? "..." : ""}</p>
                                          )}
                                          {q.type === "coding" && q.testCases && (
                                            <p className="text-xs text-blue-600 mt-1">Test Cases: {q.testCases.length}</p>
                                          )}
                                        </div>
                                        <div className="flex gap-2 ml-3">
                                          <button 
                                            type="button" 
                                            onClick={() => editQuestion(index)}
                                            className="text-yellow-600 text-sm hover:text-yellow-700 font-medium"
                                            disabled={editingQuestionIndex === index}
                                          >
                                            Edit
                                          </button>
                                          <button 
                                            type="button" 
                                            onClick={() => removeQuestion(index)}
                                            className="text-red-500 text-sm hover:text-red-600 font-medium"
                                          >
                                            Remove
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="flex gap-2">
                              <button type="submit" className="bg-purple-500 text-white px-4 py-2 rounded flex-1">
                                {newAssignment.id ? "Update Progress Test" : "Add Progress Test"}
                              </button>
                              <button 
                                type="button" 
                                onClick={() => {
                                  setNewAssignment({ id: null, title: "", dueDate: "", day: 1, type: "mcq", questions: [] });
                                  setCodingQuestion({ question: "", description: "", testCases: [], language: "javascript" });
                                  setCurrentQuestion({ question: "", options: ["", "", "", ""], correctAnswers: [], explanation: "" });
                                  setCurrentTestCase({ input: "", expectedOutput: "" });
                                  setShowProgressTestForm(false);
                                  setEditingQuestionIndex(null);
                                  // Keep chapter context when canceling (it's still in the same chapter section)
                                }}
                                className="bg-gray-500 text-white px-4 py-2 rounded"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Add Chapter Button - appears at bottom of chapters */}
                <div className="mt-3 mb-4">
                  <button 
                    onClick={() => {
                      setShowingChapterForm(showingChapterForm === course.id ? null : course.id);
                      setEditingChapterId(null);
                      setShowingAssignmentsForChapter(null);
                      clearChapterForm();
                      setCurrentChapterContext(null); // Clear chapter context when adding new chapter
                    }}
                    className="bg-green-500 text-white px-4 py-2 rounded w-full"
                  >
                    ➕ Add New Chapter
                  </button>
                </div>
                
                {/* Add New Chapter Form - appears when Add Chapter button is clicked */}
                {showingChapterForm === course.id && (
                  <div className="border p-4 rounded mb-4 bg-green-50">
                    <h5 className="font-semibold mb-3 text-green-600">Add New Chapter</h5>
                    <form onSubmit={(e) => {
                      handleAddOrUpdateChapter(course.id, e);
                      setShowingChapterForm(null);
                    }} className="grid grid-cols-2 gap-2">
                      <input className="border p-2 rounded" placeholder="Chapter Title" value={newChapter.title || ""} onChange={(e) => setNewChapter({ ...newChapter, title: e.target.value })} />
                      <input 
                        type="number" 
                        className="border p-2 rounded" 
                        placeholder="Order (Optional)" 
                        value={newChapter.order || ""} 
                        onChange={(e) => setNewChapter({ ...newChapter, order: parseInt(e.target.value) || 0 })} 
                      />
                      <input className="border p-2 rounded" placeholder="Video URL (Optional)" value={newChapter.video || ""} onChange={(e) => setNewChapter({ ...newChapter, video: e.target.value })} />
                      <input className="border p-2 rounded" placeholder="Live Class Link (Optional)" value={newChapter.liveClassLink || ""} onChange={(e) => setNewChapter({ ...newChapter, liveClassLink: e.target.value })} />
                      <input className="border p-2 rounded" placeholder="Class Live Video Link (Optional)" value={newChapter.recordedClassLink || ""} onChange={(e) => setNewChapter({ ...newChapter, recordedClassLink: e.target.value })} />
                      <input className="border p-2 rounded" placeholder="PPTs (Google Drive Link)" value={newChapter.classDocs || ""} onChange={(e) => setNewChapter({ ...newChapter, classDocs: e.target.value })} />
                      <input className="border p-2 rounded" placeholder="PDF Document (Google Drive Link)" value={newChapter.pdfDocument || ""} onChange={(e) => setNewChapter({ ...newChapter, pdfDocument: e.target.value })} />
                      <textarea className="border p-2 rounded col-span-2" placeholder="topics" value={newChapter.topics || ""} onChange={(e) => setNewChapter({ ...newChapter, topics: e.target.value })} />
                      <div className="col-span-2 flex gap-2">
                        <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded flex-1">Add Chapter</button>
                        <button type="button" onClick={() => {
                          clearChapterForm();
                          setShowingChapterForm(null);
                        }} className="bg-gray-500 text-white px-4 py-2 rounded">Cancel</button>
                      </div>
                    </form>
                  </div>
                )}
                
                {/* Chapter Form - Only show when not editing any chapter */}
                {false && !editingChapterId && (
                  <form onSubmit={(e) => handleAddOrUpdateChapter(course.id, e)} className="grid grid-cols-2 gap-2 mt-2">
                   <input className="border p-2 rounded" placeholder="Chapter Title" value={newChapter.title || ""} onChange={(e) => setNewChapter({ ...newChapter, title: e.target.value })} />
                   <input 
                     type="number" 
                     className="border p-2 rounded" 
                     placeholder="Order (Optional)" 
                     value={newChapter.order || ""} 
                     onChange={(e) => setNewChapter({ ...newChapter, order: parseInt(e.target.value) || 0 })} 
                   />
                   <input className="border p-2 rounded" placeholder="Video URL (Optional)" value={newChapter.video || ""} onChange={(e) => setNewChapter({ ...newChapter, video: e.target.value })} />
                   <input className="border p-2 rounded" placeholder="Live Class Link (Optional)" value={newChapter.liveClassLink || ""} onChange={(e) => setNewChapter({ ...newChapter, liveClassLink: e.target.value })} />
                   <input className="border p-2 rounded" placeholder="Class Live Video Link (Optional)" value={newChapter.recordedClassLink || ""} onChange={(e) => setNewChapter({ ...newChapter, recordedClassLink: e.target.value })} />
                   <input className="border p-2 rounded" placeholder="PPTs (Google Drive Link)" value={newChapter.classDocs || ""} onChange={(e) => setNewChapter({ ...newChapter, classDocs: e.target.value })} />
                  <input className="border p-2 rounded" placeholder="PDF Document (Google Drive Link)" value={newChapter.pdfDocument || ""} onChange={(e) => setNewChapter({ ...newChapter, pdfDocument: e.target.value })} />
                                     <textarea className="border p-2 rounded col-span-2" placeholder="topics" value={newChapter.topics || ""} onChange={(e) => setNewChapter({ ...newChapter, topics: e.target.value })} />
                   <div className="col-span-2 flex gap-2">
                     <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded flex-1">{newChapter.id ? "Update Chapter" : "Add Chapter"}</button>
                     <button type="button" onClick={clearChapterForm} className="bg-gray-500 text-white px-4 py-2 rounded">Clear Form</button>
                   </div>
                  </form>
                )}

                {/* Progress Tests - Hidden: Now managed per chapter inline */}
                {false && <h4 className="font-semibold mt-4">Progress Tests</h4>}
                                 {false && course.assignments.map((a) => (
                   <div key={a.id} className="border p-3 rounded mb-2">
                     <div className="flex justify-between">
                       <div>
                         <p className="font-bold">{a.title}</p>
                         <p className="text-sm text-gray-600">Due: {a.dueDate} | Day: {a.day || 1}</p>
                         <p className="text-xs text-gray-500">
                           Type: {a.type === "mcq" ? "MCQ" : "Coding"} | 
                           Questions: {a.questions ? a.questions.length : 0}
                         </p>
                         {a.questions && a.questions.length > 0 && (
                           <div className="mt-2">
                             {a.questions.slice(0, 2).map((q, idx) => (
                               <p key={idx} className="text-xs text-gray-600">
                                 {idx + 1}. {(q.question || "").substring(0, 50)}...
                               </p>
                             ))}
                             {a.questions.length > 2 && (
                               <p className="text-xs text-gray-500">+{a.questions.length - 2} more questions</p>
                             )}
                           </div>
                         )}
                       </div>
                       <div className="flex gap-2">
                         <button className="text-yellow-600" onClick={() => setNewAssignment({
                           ...a,
                           questions: a.questions || []
                         })}>Edit</button>
                         <button className="text-red-600" onClick={() => handleDeleteAssignment(course.id, a.id)}>Delete</button>
                       </div>
                     </div>
                   </div>
                 ))}
                                 {/* Progress Test Form - Hidden: Now managed per chapter inline */}
                 {false && <div className="border p-4 rounded mt-4">
                   <h5 className="font-semibold mb-3">{newAssignment.id ? "Edit Progress Test" : "Add New Progress Test"}</h5>
                   
                   <form onSubmit={(e) => handleAddOrUpdateAssignment(course.id, e)} className="space-y-4">
                     <div className="space-y-3">
                       <input 
                         className="border p-2 rounded w-full" 
                         placeholder="Progress Test Title" 
                         value={newAssignment.title || ""} 
                         onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })} 
                       />
                       <div className="grid grid-cols-2 gap-4">
                         <div>
                           <input 
                             type="date" 
                             className="border p-2 rounded w-full" 
                             value={newAssignment.dueDate || ""} 
                             onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })} 
                           />
                           <p className="text-xs text-gray-500 mt-1">Optional: Auto-set to 3 days after unlock</p>
                         </div>
                         <div>
                           <input 
                             type="number" 
                             min="1"
                             className="border p-2 rounded w-full" 
                             placeholder="Day Number" 
                             value={newAssignment.day || 1} 
                             onChange={(e) => setNewAssignment({ ...newAssignment, day: parseInt(e.target.value) || 1 })} 
                           />
                           <p className="text-xs text-gray-500 mt-1">Day number for chapter association</p>
                         </div>
                       </div>
                     </div>
                     
                     <div className="flex gap-2">
                       <button 
                         type="button"
                         className={`px-3 py-1 rounded ${newAssignment.type === "mcq" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
                         onClick={() => setNewAssignment({ ...newAssignment, type: "mcq" })}
                       >
                         MCQ Questions
                       </button>
                       <button 
                         type="button"
                         className={`px-3 py-1 rounded ${newAssignment.type === "coding" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
                         onClick={() => setNewAssignment({ ...newAssignment, type: "coding" })}
                       >
                         Coding Questions
                       </button>
                     </div>

                                           {/* MCQ Question Form */}
                      {newAssignment.type === "mcq" && (
                        <div className="border p-3 rounded">
                          <div className="flex justify-between items-center mb-2">
                            <h6 className="font-medium">Add MCQ Question</h6>
                            <button 
                              type="button" 
                              onClick={() => fetchPracticeQuestions(selectedCourseId)}
                              className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                            >
                              Select from Practice Bank
                            </button>
                          </div>
                          <div className="space-y-2">
                           <textarea 
                             className="border p-2 rounded w-full" 
                             placeholder="Question" 
                             value={currentQuestion.question || ""} 
                             onChange={(e) => setCurrentQuestion({ ...currentQuestion, question: e.target.value })} 
                           />
                           <div className="space-y-2">
                             <p className="text-xs text-gray-600 italic">✓ Check all correct answers (supports multiple)</p>
                             {currentQuestion.options.map((option, index) => (
                               <div key={index} className="flex items-center gap-2">
                                 <input 
                                   type="checkbox" 
                                   checked={currentQuestion.correctAnswers.includes(index)}
                                   onChange={() => toggleCorrectAnswer(index)}
                                   className="w-4 h-4"
                                 />
                                 <input 
                                   className="border p-2 rounded flex-1" 
                                   placeholder={`Option ${index + 1}`} 
                                   value={option || ""} 
                                   onChange={(e) => updateMCQOption(index, e.target.value)} 
                                 />
                               </div>
                             ))}
                           </div>
                           <textarea 
                             className="border p-2 rounded w-full" 
                             placeholder="Explanation (Optional)" 
                             value={currentQuestion.explanation || ""} 
                             onChange={(e) => setCurrentQuestion({ ...currentQuestion, explanation: e.target.value })} 
                           />
                           <div className="flex gap-2">
                             <button 
                               type="button" 
                               onClick={addMCQQuestion}
                               className="bg-green-500 text-white px-3 py-1 rounded flex-1"
                             >
                               {editingQuestionIndex !== null ? "Update MCQ Question" : "Add MCQ Question"}
                             </button>
                             {editingQuestionIndex !== null && (
                               <button 
                                 type="button" 
                                 onClick={cancelEditQuestion}
                                 className="bg-gray-500 text-white px-3 py-1 rounded"
                               >
                                 Cancel
                               </button>
                             )}
                           </div>
                         </div>
                       </div>
                     )}

                                                                 {/* Coding Question Form */}
                      {newAssignment.type === "coding" && (
                        <div className="border p-3 rounded">
                          <div className="flex justify-between items-center mb-2">
                            <h6 className="font-medium">Add Coding Question</h6>
                            <button 
                              type="button" 
                              onClick={fetchCodingQuestions}
                              className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                            >
                              Select from Practice Bank
                            </button>
                          </div>
                         
                         <div className="space-y-3 mt-3">
                           <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Question Title</label>
                             <input 
                               className="border p-2 rounded w-full" 
                               placeholder="Enter question title" 
                               value={codingQuestion.question || ""} 
                               onChange={(e) => setCodingQuestion({ ...codingQuestion, question: e.target.value })} 
                             />
                           </div>
                           
                           <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                             <textarea 
                               className="border p-2 rounded w-full font-mono" 
                               placeholder="Enter question description and requirements (formatting will be preserved)" 
                               rows="6"
                               value={codingQuestion.description || ""} 
                               onChange={(e) => setCodingQuestion({ ...codingQuestion, description: e.target.value })} 
                             />
                             <p className="text-xs text-gray-500 mt-1">💡 Formatting preserved: Use Enter for new lines, spaces for indentation</p>
                           </div>
                           
                           <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Programming Language</label>
                             <select 
                               className="border p-2 rounded w-full"
                               value={codingQuestion.language || "javascript"}
                               onChange={(e) => setCodingQuestion({ ...codingQuestion, language: e.target.value })}
                             >
                               <option value="javascript">JavaScript</option>
                               <option value="python">Python</option>
                               <option value="java">Java</option>
                               <option value="cpp">C++</option>
                               <option value="c">C</option>
                             </select>
                           </div>
                           
                           {/* Test Cases Section */}
                           <div className="border-t pt-3">
                             <label className="block text-sm font-medium text-gray-700 mb-2">Test Cases</label>
                             
                             {/* Display existing test cases */}
                             {codingQuestion.testCases && codingQuestion.testCases.length > 0 && (
                               <div className="mb-3 space-y-2">
                                 {codingQuestion.testCases.map((tc, index) => (
                                   <div key={index} className="bg-gray-50 p-3 rounded">
                                     <div className="flex justify-between items-start mb-2">
                                       <p className="text-sm font-medium">Test Case {index + 1}</p>
                                       <div className="flex gap-2">
                                         <button 
                                           type="button" 
                                           onClick={() => editTestCase(index)}
                                           className="text-yellow-600 text-sm hover:text-yellow-700"
                                         >
                                           Edit
                                         </button>
                                         <button 
                                           type="button" 
                                           onClick={() => removeTestCase(index)}
                                           className="text-red-500 text-sm hover:text-red-600"
                                         >
                                           Remove
                                         </button>
                                       </div>
                                     </div>
                                     <div className="space-y-1">
                                       <div>
                                         <p className="text-xs font-medium text-gray-700">Input:</p>
                                         <p className="text-xs text-gray-600 whitespace-pre-wrap bg-white p-2 rounded border">{tc.input}</p>
                                       </div>
                                       <div>
                                         <p className="text-xs font-medium text-gray-700">Expected Output:</p>
                                         <p className="text-xs text-gray-600 whitespace-pre-wrap bg-white p-2 rounded border">{tc.expectedOutput}</p>
                                       </div>
                                     </div>
                                   </div>
                                 ))}
                               </div>
                             )}
                             
                             {/* Add new test case */}
                             <div className="bg-blue-50 p-3 rounded space-y-2">
                               <p className="text-sm font-medium text-blue-800">Add New Test Case</p>
                               <div>
                                 <label className="block text-xs font-medium text-gray-700 mb-1">Input</label>
                                 <textarea 
                                   className="border p-2 rounded w-full text-sm font-mono" 
                                   placeholder="Enter input for test case (newlines will be preserved)
Example:
4
2 7 11 15
9" 
                                   rows="4"
                                   value={currentTestCase.input || ""} 
                                   onChange={(e) => setCurrentTestCase({ ...currentTestCase, input: e.target.value })} 
                                 />
                                 <p className="text-xs text-gray-500 mt-1">💡 Tip: Press Enter to add new lines - they will be preserved exactly as typed</p>
                               </div>
                               <div>
                                 <label className="block text-xs font-medium text-gray-700 mb-1">Expected Output</label>
                                 <textarea 
                                   className="border p-2 rounded w-full text-sm font-mono" 
                                   placeholder="Enter expected output (newlines will be preserved)" 
                                   rows="4"
                                   value={currentTestCase.expectedOutput || ""} 
                                   onChange={(e) => setCurrentTestCase({ ...currentTestCase, expectedOutput: e.target.value })} 
                                 />
                                 <p className="text-xs text-gray-500 mt-1">💡 Tip: Press Enter to add new lines - they will be preserved exactly as typed</p>
                               </div>
                               <button 
                                 type="button" 
                                 onClick={addTestCase}
                                 className="bg-blue-500 text-white px-3 py-1 rounded text-sm w-full"
                               >
                                 Add Test Case
                               </button>
                             </div>
                           </div>
                           
                           <div className="flex gap-2">
                             <button 
                               type="button" 
                               onClick={addCodingQuestion}
                               className="bg-green-500 text-white px-4 py-2 rounded flex-1"
                               disabled={!codingQuestion.question.trim() || !codingQuestion.description.trim()}
                             >
                               {editingQuestionIndex !== null ? "Update Coding Question" : "Add Coding Question"}
                             </button>
                             {editingQuestionIndex !== null && (
                               <button 
                                 type="button" 
                                 onClick={cancelEditQuestion}
                                 className="bg-gray-500 text-white px-4 py-2 rounded"
                               >
                                 Cancel
                               </button>
                             )}
                           </div>
                         </div>
                        </div>
                      )}

                     {/* Display Added Questions */}
                     {newAssignment.questions && newAssignment.questions.length > 0 && (
                       <div className="border p-3 rounded">
                         <h6 className="font-medium mb-2">Added Questions ({newAssignment.questions.length})</h6>
                         <div className="space-y-2">
                           {newAssignment.questions.map((q, index) => (
                             <div key={index} className={`p-3 rounded border-2 ${editingQuestionIndex === index ? 'bg-yellow-50 border-yellow-400' : 'bg-gray-50 border-transparent'}`}>
                               <div className="flex justify-between items-start mb-2">
                                 <div className="flex-1">
                                   <div className="flex items-center gap-2">
                                     <p className="text-sm font-medium">
                                       {index + 1}. {q.question}
                                     </p>
                                     {editingQuestionIndex === index && (
                                       <span className="text-xs bg-yellow-500 text-white px-2 py-1 rounded">Editing</span>
                                     )}
                                   </div>
                                   <p className="text-xs text-gray-500 mt-1">Type: {q.type === "mcq" ? "MCQ" : "Coding"}</p>
                                   {q.category && (
                                     <p className="text-xs text-purple-600 mt-1">📚 Category: {q.category}</p>
                                   )}
                                   {q.type === "coding" && q.description && (
                                     <p className="text-xs text-gray-600 mt-2 whitespace-pre-wrap">{q.description.substring(0, 100)}{q.description.length > 100 ? "..." : ""}</p>
                                   )}
                                   {q.type === "coding" && q.testCases && (
                                     <p className="text-xs text-blue-600 mt-1">Test Cases: {q.testCases.length}</p>
                                   )}
                                 </div>
                                 <div className="flex gap-2 ml-3">
                                   <button 
                                     type="button" 
                                     onClick={() => editQuestion(index)}
                                     className="text-yellow-600 text-sm hover:text-yellow-700 font-medium"
                                     disabled={editingQuestionIndex === index}
                                   >
                                     Edit
                                   </button>
                                   <button 
                                     type="button" 
                                     onClick={() => removeQuestion(index)}
                                     className="text-red-500 text-sm hover:text-red-600 font-medium"
                                   >
                                     Remove
                                   </button>
                                 </div>
                               </div>
                             </div>
                           ))}
                         </div>
                       </div>
                     )}

                     <div className="flex gap-2">
                       <button type="submit" className="bg-purple-500 text-white px-4 py-2 rounded flex-1">
                         {newAssignment.id ? "Update Progress Test" : "Add Progress Test"}
                       </button>
                       <button 
                         type="button" 
                         onClick={() => setNewAssignment({ id: null, title: "", dueDate: "", type: "mcq", questions: [] })}
                         className="bg-gray-500 text-white px-4 py-2 rounded"
                       >
                         Clear Form
                       </button>
                                          </div>
                   </form>
                 </div>}
               </div>
             )}
           </div>
         ))}
       </div>
     </div>

      {/* Question Bank Modal */}
      {showQuestionBank && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-4xl max-h-[80vh] overflow-y-auto">
                         <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-semibold">
                 Select {newAssignment.type === "mcq" ? "MCQ" : "Coding"} Questions from Practice Bank
               </h3>
               <button 
                 onClick={() => setShowQuestionBank(false)}
                 className="text-gray-500 hover:text-gray-700"
               >
                 ✕
               </button>
             </div>
             
            {/* Topic and Level Filter for Coding Questions */}
            {newAssignment.type === "coding" && (
              <div className="mb-4 space-y-3">
                {/* Topic Filter (First) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Concept/Topic:</label>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      type="button"
                      className={`px-3 py-1 rounded text-sm ${
                        selectedCodingTopic === "all" ? "bg-blue-500 text-white" : "bg-gray-200"
                      }`}
                      onClick={() => setSelectedCodingTopic("all")}
                    >
                      All Topics
                    </button>
                    {codingConceptTopics.map((topic) => (
                      <button
                        key={topic}
                        type="button"
                        className={`px-3 py-1 rounded text-sm ${
                          selectedCodingTopic === topic ? "bg-purple-500 text-white" : "bg-gray-200"
                        }`}
                        onClick={() => setSelectedCodingTopic(topic)}
                      >
                        📚 {topic}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Level Filter (Second) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Difficulty Level:</label>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      type="button"
                      className={`px-3 py-1 rounded text-sm ${
                        selectedCodingLevel === "all" ? "bg-blue-500 text-white" : "bg-gray-200"
                      }`}
                      onClick={() => setSelectedCodingLevel("all")}
                    >
                      All Levels
                    </button>
                    <button
                      type="button"
                      className={`px-3 py-1 rounded text-sm ${
                        selectedCodingLevel === "Level 1" ? "bg-green-500 text-white" : "bg-gray-200"
                      }`}
                      onClick={() => setSelectedCodingLevel("Level 1")}
                    >
                      🟢 Level 1: Beginner
                    </button>
                    <button
                      type="button"
                      className={`px-3 py-1 rounded text-sm ${
                        selectedCodingLevel === "Level 2" ? "bg-yellow-500 text-white" : "bg-gray-200"
                      }`}
                      onClick={() => setSelectedCodingLevel("Level 2")}
                    >
                      🟡 Level 2: Intermediate
                    </button>
                    <button
                      type="button"
                      className={`px-3 py-1 rounded text-sm ${
                        selectedCodingLevel === "Level 3" ? "bg-red-500 text-white" : "bg-gray-200"
                      }`}
                      onClick={() => setSelectedCodingLevel("Level 3")}
                    >
                      🔵 Level 3: Advanced
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Chapter Filter for MCQ Questions */}
            {newAssignment.type === "mcq" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Chapter:</label>
                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    className={`px-3 py-1 rounded text-sm ${
                      selectedMCQChapter === "all" ? "bg-blue-500 text-white" : "bg-gray-200"
                    }`}
                    onClick={() => setSelectedMCQChapter("all")}
                  >
                    All Chapters
                  </button>
                  {courses
                    .filter(course => course.id === selectedMCQCategory || selectedMCQCategory === "all")
                    .flatMap(course => course.chapters)
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map((chapter) => (
                      <button
                        key={chapter.id}
                        type="button"
                        className={`px-3 py-1 rounded text-sm ${
                          selectedMCQChapter === chapter.title ? "bg-purple-500 text-white" : "bg-gray-200"
                        }`}
                        onClick={() => setSelectedMCQChapter(chapter.title)}
                      >
                        📚 {chapter.title}
                      </button>
                    ))}
                </div>
              </div>
            )}
            
                         <div className="space-y-4">
                              {/* Question count */}
                              <div className="text-sm text-gray-600 font-medium pb-2 border-b">
                                Showing {practiceQuestions
                                  .filter(q => {
                                    if (newAssignment.type === "coding") {
                                      // Filter by topic first
                                      if (selectedCodingTopic !== "all" && q.topic !== selectedCodingTopic) {
                                        return false;
                                      }
                                      // Then filter by level
                                      if (selectedCodingLevel !== "all" && q.level !== selectedCodingLevel) {
                                        return false;
                                      }
                                      // Legacy support
                                      if (selectedDifficulty !== "all" && q.category === selectedDifficulty) {
                                        return true;
                                      }
                                    } else if (newAssignment.type === "mcq") {
                                      // Filter by chapter for MCQ questions
                                      if (selectedMCQChapter !== "all" && q.category !== selectedMCQChapter) {
                                        return false;
                                      }
                                    }
                                    return true;
                                  }).length} question(s)
                              </div>
                              
                              {practiceQuestions
                 .filter(q => {
                   if (newAssignment.type === "coding") {
                     // Filter by topic first
                     if (selectedCodingTopic !== "all" && q.topic !== selectedCodingTopic) {
                       return false;
                     }
                     // Then filter by level
                     if (selectedCodingLevel !== "all" && q.level !== selectedCodingLevel) {
                       return false;
                     }
                     // Legacy: also support old category field (Easy/Medium/Hard)
                     if (selectedDifficulty !== "all" && q.category === selectedDifficulty) {
                       return true;
                     }
                   } else if (newAssignment.type === "mcq") {
                     // Filter by chapter for MCQ questions
                     if (selectedMCQChapter !== "all" && q.category !== selectedMCQChapter) {
                       return false;
                     }
                   }
                   return true;
                 })
                .map((q) => (
                 <div 
                   key={q.id} 
                   className={`border p-3 rounded cursor-pointer ${
                     selectedQuestions.includes(q.id) ? 'bg-blue-100 border-blue-300' : 'bg-gray-50'
                   }`}
                   onClick={() => toggleQuestionSelection(q.id)}
                 >
                   <div className="flex items-start gap-3">
                     <input 
                       type="checkbox" 
                       checked={selectedQuestions.includes(q.id)}
                       onChange={() => toggleQuestionSelection(q.id)}
                       className="mt-1"
                     />
                     <div className="flex-1">
                       <p className="font-medium">{q.title || q.question}</p>
                       {/* Show course title under question for MCQs */}
                       {newAssignment.type === "mcq" && (q.categoryTitle || q.category) && (
                         <p className="text-xs text-gray-500">Course: {q.categoryTitle || q.category}</p>
                       )}
                       
                       {/* Show options for MCQ questions */}
                       {q.options && (
                         <div className="mt-2 space-y-1">
                           {q.options.map((opt, idx) => (
                             <p key={idx} className={`text-sm ${
                               (typeof opt === 'object' ? opt.text : opt) === q.answer ? 'text-green-600 font-medium' : 'text-gray-600'
                             }`}>
                               {String.fromCharCode(65 + idx)}. {typeof opt === 'object' ? opt.text : opt}
                             </p>
                           ))}
                         </div>
                       )}
                       
                      {/* Show description for coding questions */}
                      {q.description && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{q.description.substring(0, 200)}{q.description.length > 200 ? "..." : ""}</p>
                        </div>
                      )}
                      
                        <div className="flex flex-wrap gap-2 mt-2">
                        {/* Show level and topic for new categorization */}
                        {q.level && (
                          <span className={`text-xs px-2 py-1 rounded font-medium ${
                            q.level === "Level 1" ? "bg-green-100 text-green-800" :
                            q.level === "Level 2" ? "bg-yellow-100 text-yellow-800" :
                            q.level === "Level 3" ? "bg-red-100 text-red-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {q.level === "Level 1" ? "🟢 Level 1" :
                             q.level === "Level 2" ? "🟡 Level 2" :
                             q.level === "Level 3" ? "🔵 Level 3" :
                             q.level}
                          </span>
                        )}
                        {q.topic && (
                          <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-800 font-medium">
                            📚 {q.topic}
                          </span>
                        )}
                        
                        {/* Show category for MCQ or legacy coding questions */}
                        {!q.level && (q.categoryTitle || q.category) && (
                          <p className="text-xs text-gray-500">Category: {q.categoryTitle || q.category}</p>
                        )}
                        
                        {q.language && (
                          <p className="text-xs text-blue-500 px-2 py-1 bg-blue-50 rounded">Language: {q.language}</p>
                        )}
                        
                        {/* Legacy difficulty badge for old questions */}
                        {!q.level && (["Easy", "Medium", "Hard"].includes(q.category)) && (
                          <span className={`text-xs px-2 py-1 rounded ${
                            q.category === "Easy" ? "bg-green-100 text-green-800" :
                            q.category === "Medium" ? "bg-yellow-100 text-yellow-800" :
                            "bg-red-100 text-red-800"
                          }`}>
                            {q.category}
                          </span>
                        )}
                        
                        {/* Show test cases count */}
                        {q.testCases && q.testCases.length > 0 && (
                          <span className="text-xs text-gray-600">
                            ✅ {q.testCases.length} test case{q.testCases.length !== 1 ? 's' : ''}
                          </span>
                        )}
                       </div>
                     </div>
                   </div>
                 </div>
               ))}
             </div>
            
            <div className="flex justify-end gap-2 mt-4">
              <button 
                onClick={() => setShowQuestionBank(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button 
                onClick={addSelectedPracticeQuestions}
                disabled={selectedQuestions.length === 0}
                className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
              >
                Add Selected ({selectedQuestions.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </CheckAdminAuth>
  );
}
