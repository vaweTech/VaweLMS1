
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { auth, db } from "../../../lib/firebase";
import {
  onAuthStateChanged,
  signOut
} from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  updateDoc,
  getDoc
} from "firebase/firestore";
// Cloudinary upload function
async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default');
  
  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );
    
    if (!response.ok) {
      throw new Error('Upload failed');
    }
    
    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
}
import CheckAdminAuth from "@/lib/CheckAdminAuth";

export default function ManageMCQs() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const [question, setQuestion] = useState("");
  const [questionImage, setQuestionImage] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [optionImages, setOptionImages] = useState(["", "", "", ""]);
  const [answers, setAnswers] = useState([]); // Changed to array for multiple answers
  const [category, setCategory] = useState(""); // Will be set dynamically from first course
  const [selectedChapterForMCQ, setSelectedChapterForMCQ] = useState(""); // Chapter category for MCQ
  const [chaptersForMCQForm, setChaptersForMCQForm] = useState([]); // Chapters for MCQ form
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null); // Track category being edited

  const [mcqs, setMcqs] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all"); // Changed default to "all"
  const [courses, setCourses] = useState([]); // Dynamic courses from Firestore
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [chapters, setChapters] = useState([]); // Chapters for selected course
  const [selectedChapter, setSelectedChapter] = useState("all"); // Selected chapter filter

  // Load courses from Firestore
  useEffect(() => {
    async function fetchCourses() {
      try {
        const coursesSnap = await getDocs(collection(db, "courses"));
        const coursesList = coursesSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCourses(coursesList);
        
        // Set first course as default category if available
        if (coursesList.length > 0 && !category) {
          setCategory(coursesList[0].id);
          // Load chapters for the first course
          loadChaptersForForm(coursesList[0].id);
        }
        
        console.log("Loaded courses:", coursesList);
      } catch (error) {
        console.error("Error loading courses:", error);
      } finally {
        setLoadingCourses(false);
      }
    }
    fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auth check
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Check if user is admin or superadmin
        const userRef = doc(db, "users", u.uid);
        const userSnap = await getDoc(userRef);
        const userRole = userSnap.exists() ? userSnap.data().role : null;
        setIsAdmin(userRole === "admin" || userRole === "superadmin");
        
        if (courses.length > 0 && (userRole === "admin" || userRole === "superadmin")) {
          loadMCQs("all");
        }
      }
      setLoading(false);
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courses]);

  // Load chapters for MCQ form
  async function loadChaptersForForm(courseId) {
    try {
      if (!courseId) {
        setChaptersForMCQForm([]);
        setSelectedChapterForMCQ("");
        return;
      }
      
      const chaptersRef = collection(db, "courses", courseId, "chapters");
      const snap = await getDocs(chaptersRef);
      const chaptersList = snap.docs.map((d) => ({ 
        id: d.id, 
        ...d.data()
      })).sort((a, b) => (a.order || 0) - (b.order || 0));
      
      setChaptersForMCQForm(chaptersList);
      // Set first chapter as default if available
      if (chaptersList.length > 0 && !selectedChapterForMCQ) {
        setSelectedChapterForMCQ(chaptersList[0].title);
      }
    } catch (error) {
      console.error("Error loading chapters for form:", error);
      setChaptersForMCQForm([]);
    }
  }

  // Load chapters for a specific course (for filtering)
  async function loadChapters(courseId) {
    try {
      if (courseId === "all") {
        setChapters([]);
        setSelectedChapter("all");
        return;
      }
      
      const chaptersRef = collection(db, "courses", courseId, "chapters");
      const snap = await getDocs(chaptersRef);
      const chaptersList = snap.docs.map((d) => ({ 
        id: d.id, 
        ...d.data()
      })).sort((a, b) => (a.order || 0) - (b.order || 0));
      
      setChapters(chaptersList);
      setSelectedChapter("all"); // Reset chapter filter when course changes
    } catch (error) {
      console.error("Error loading chapters:", error);
      setChapters([]);
    }
  }

  // Load MCQs by category (using dynamic courses with subcollections) and chapter
  async function loadMCQs(cat, chapterFilter = "all") {
    try {
      let allMcqs = [];
      
      if (cat === "all") {
        // Load all MCQs from all course categories
        for (const course of courses) {
          const questionsRef = collection(db, "mcqs", course.id, "questions");
          const snap = await getDocs(questionsRef);
          const categoryMcqs = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id, 
              ...data,
              courseCategory: course.id, // Course ID
              categoryTitle: course.title, // Course title for display
              // The 'category' field from data is the chapter name
              questionCategory: data.category || "Uncategorized"
            };
          });
          allMcqs = [...allMcqs, ...categoryMcqs];
        }
      } else {
        // Load MCQs for specific category (course)
        const questionsRef = collection(db, "mcqs", cat, "questions");
        const snap = await getDocs(questionsRef);
        const courseTitle = courses.find(c => c.id === cat)?.title || cat;
        allMcqs = snap.docs.map((d) => { 
          const data = d.data();
          return {
            id: d.id, 
            ...data,
            courseCategory: cat, // Course ID
            categoryTitle: courseTitle, // Course title
            // The 'category' field from data is the chapter name
            questionCategory: data.category || "Uncategorized"
          };
        });
      }
      
      // Filter by chapter if selected
      if (chapterFilter !== "all") {
        allMcqs = allMcqs.filter(mcq => mcq.questionCategory === chapterFilter);
      }
      
      setMcqs(allMcqs);
    } catch (error) {
      console.error("Error loading MCQs:", error);
      alert("Failed to load MCQs. Please try again.");
    }
  }

  // Upload image to Cloudinary
  async function uploadImage(file) {
    if (!file) {
      console.log("No file provided to uploadImage");
      return "";
    }
    
    try {
      console.log("=== Starting Cloudinary upload ===");
      console.log("File name:", file.name);
      console.log("File size:", file.size, "bytes");
      console.log("File type:", file.type);
      
      // Check if Cloudinary environment variables are set
      if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
        console.error("Cloudinary cloud name not configured!");
        alert("Cloudinary configuration missing. Please check environment variables.");
        return "";
      }
      
      console.log("Uploading to Cloudinary...");
      const imageUrl = await uploadToCloudinary(file);
      console.log("=== Image uploaded successfully to Cloudinary ===");
      console.log("Image URL:", imageUrl);
      
      return imageUrl;
    } catch (error) {
      console.error("=== Error uploading image to Cloudinary ===");
      console.error("Error details:", error);
      console.error("Error message:", error.message);
      
      let errorMessage = "Failed to upload image to Cloudinary. ";
      if (error.message.includes('Upload failed')) {
        errorMessage += "Upload request failed. Please check your Cloudinary configuration.";
      } else {
        errorMessage += "Please try again.";
      }
      
      alert(errorMessage);
      return "";
    }
  }

  // Handle question image upload
  async function handleQuestionImageUpload(file) {
    console.log("Handling question image upload:", file.name);
    const imageUrl = await uploadImage(file);
    console.log("Question image URL set to:", imageUrl);
    setQuestionImage(imageUrl);
  }

  // Handle image upload for specific option
  async function handleImageUpload(file, index) {
    console.log("Handling option image upload:", file.name, "for index:", index);
    const imageUrl = await uploadImage(file);
    console.log("Option image URL set to:", imageUrl, "for index:", index);
    const newImages = [...optionImages];
    newImages[index] = imageUrl;
    setOptionImages(newImages);
  }

  // Save or Update MCQ
  async function saveMCQ() {
    const filteredOptions = options.filter(opt => opt.trim() !== "");
    if (!question || filteredOptions.length < 2 || answers.length === 0) {
      alert("Please fill question, at least 2 options, and select at least one correct answer.");
      return;
    }
    
    if (!selectedChapterForMCQ) {
      alert("Please select a chapter/category for this MCQ.");
      return;
    }

    // Create options with images
    const optionsWithImages = options.map((opt, index) => ({
      text: opt,
      image: optionImages[index] || ""
    })).filter(opt => opt.text.trim() !== "");

    const payload = {
      question,
      questionImage: questionImage || "",
      options: optionsWithImages,
      answers: answers, // Now supports multiple answers
      answer: answers[0], // Keep backward compatibility
      category: selectedChapterForMCQ || "Uncategorized", // Save chapter name as category
      courseId: category, // Save course ID for reference
      description: description?.trim() || "",
      createdAt: new Date().toISOString()
    };

    console.log("Saving MCQ with payload:", payload);
    console.log("Question image:", questionImage);
    console.log("Option images:", optionImages);

    try {
      // Reference to the course's questions subcollection (category is course ID)
      const questionsRef = collection(db, "mcqs", category, "questions");
      
      if (editingId && editingCategory) {
        // If course changed, delete from old course and add to new
        if (editingCategory !== category) {
          // Delete from old course
          await deleteDoc(doc(db, "mcqs", editingCategory, "questions", editingId));
          // Add to new course
          const docRef = await addDoc(questionsRef, payload);
          console.log("MCQ moved to new course with ID:", docRef.id);
        } else {
          // Update existing question in the same course subcollection
          await updateDoc(doc(db, "mcqs", category, "questions", editingId), payload);
          console.log("MCQ updated successfully");
        }
      } else {
        // Add new question to the course subcollection
        const docRef = await addDoc(questionsRef, payload);
        console.log("MCQ saved successfully with ID:", docRef.id);
      }
      
      setQuestion("");
      setQuestionImage("");
      setOptions(["", "", "", ""]);
      setOptionImages(["", "", "", ""]);
      setAnswers([]);
      const defaultCourseId = courses.length > 0 ? courses[0].id : "";
      setCategory(defaultCourseId);
      setSelectedChapterForMCQ("");
      if (defaultCourseId) {
        loadChaptersForForm(defaultCourseId);
      }
      setDescription("");
      setEditingId(null);
      setEditingCategory(null);
      loadMCQs(selectedCategory, selectedChapter);
    } catch (error) {
      console.error("Error saving MCQ:", error);
      alert("Failed to save MCQ. Please try again.");
    }
  }

  function startEdit(mcq) {
    setEditingId(mcq.id);
    // Determine course ID: new structure has courseId or courseCategory, old has category
    const courseId = mcq.courseId || mcq.courseCategory || (courses.length > 0 ? courses[0].id : "");
    setEditingCategory(courseId); // Track original category (course ID)
    setQuestion(mcq.question || "");
    setQuestionImage(mcq.questionImage || "");
    
    // Handle options with images
    const baseOptions = Array.isArray(mcq.options) ? mcq.options : [];
    const padded = [...baseOptions, ...Array(Math.max(0, 4 - baseOptions.length)).fill({ text: "", image: "" })];
    
    const optionTexts = padded.slice(0, 4).map(opt => 
      typeof opt === 'string' ? opt : (opt.text || "")
    );
    const optionImages = padded.slice(0, 4).map(opt => 
      typeof opt === 'string' ? "" : (opt.image || "")
    );
    
    setOptions(optionTexts);
    setOptionImages(optionImages);
    
    // Handle multiple answers (backward compatible with single answer)
    if (Array.isArray(mcq.answers)) {
      setAnswers(mcq.answers);
    } else if (mcq.answer) {
      setAnswers([mcq.answer]);
    } else {
      setAnswers([]);
    }
    
    setCategory(courseId);
    // Set chapter category - questionCategory is the chapter name from the new structure
    const chapterName = mcq.questionCategory || "";
    setSelectedChapterForMCQ(chapterName);
    loadChaptersForForm(courseId); // Load chapters for the course
    setDescription(mcq.description || "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingCategory(null);
    setQuestion("");
    setQuestionImage("");
    setOptions(["", "", "", ""]);
    setOptionImages(["", "", "", ""]);
    setAnswers([]);
    const defaultCourseId = courses.length > 0 ? courses[0].id : "";
    setCategory(defaultCourseId);
    setSelectedChapterForMCQ("");
    if (defaultCourseId) {
      loadChaptersForForm(defaultCourseId);
    }
    setDescription("");
  }

  // Delete MCQ
  async function deleteMCQ(id, courseId) {
    if (confirm("Are you sure you want to delete this question?")) {
      try {
        await deleteDoc(doc(db, "mcqs", courseId, "questions", id));
        console.log("MCQ deleted successfully");
        loadMCQs(selectedCategory, selectedChapter);
      } catch (error) {
        console.error("Error deleting MCQ:", error);
        alert("Failed to delete MCQ. Please try again.");
      }
    }
  }

  function handleCategoryChange(e) {
    const newCategory = e.target.value;
    setSelectedCategory(newCategory);
    loadChapters(newCategory); // Load chapters for the selected course
    loadMCQs(newCategory, "all"); // Reset chapter filter when course changes
  }

  function handleChapterChange(e) {
    const newChapter = e.target.value;
    setSelectedChapter(newChapter);
    loadMCQs(selectedCategory, newChapter);
  }

  // Handle checkbox for multiple answers
  function handleAnswerCheckbox(optionText) {
    setAnswers(prev => {
      if (prev.includes(optionText)) {
        // Remove if already selected
        return prev.filter(ans => ans !== optionText);
      } else {
        // Add if not selected
        return [...prev, optionText];
      }
    });
  }

  // Migrate old flat MCQs to subcollection structure
  async function migrateOldMCQs() {
    if (!confirm("This will migrate MCQs from flat structure (mcqs collection) to subcollection structure (mcqs/{courseId}/questions). Continue?")) {
      return;
    }

    try {
      console.log("=== Starting MCQ Migration to Subcollections ===");
      
      // Get all MCQs from flat structure
      const oldMcqsRef = collection(db, "mcqs");
      const oldSnapshot = await getDocs(oldMcqsRef);
      
      let migratedCount = 0;
      let errorCount = 0;
      let unmappedCount = 0;
      
      for (const docSnap of oldSnapshot.docs) {
        try {
          const oldData = docSnap.data();
          
          // Skip if it's a category document (not an actual MCQ)
          if (!oldData.question) {
            console.log(`Skipping document ${docSnap.id} (not an MCQ)`);
            continue;
          }
          
          // Try to find matching course
          let targetCourseId = null;
          const oldCategory = oldData.category || "";
          
          // Find course by matching category name with course title or ID
          const matchingCourse = courses.find(c => 
            c.id === oldCategory || 
            c.title.toLowerCase().includes(oldCategory.toLowerCase()) ||
            oldCategory.toLowerCase().includes(c.title.toLowerCase())
          );
          
          if (matchingCourse) {
            targetCourseId = matchingCourse.id;
          } else if (courses.length > 0) {
            // Default to first course if no match found
            targetCourseId = courses[0].id;
            unmappedCount++;
            console.log(`No matching course for category "${oldCategory}", using default: ${courses[0].title}`);
          } else {
            console.error("No courses available for migration");
            errorCount++;
            continue;
          }
          
          // Add to new subcollection structure
          const newMcqRef = collection(db, "mcqs", targetCourseId, "questions");
          await addDoc(newMcqRef, {
            ...oldData,
            category: targetCourseId // Update category to course ID
          });
          
          console.log(`Migrated MCQ: ${docSnap.id} to course: ${targetCourseId}`);
          migratedCount++;
          
          // Optional: Delete from old structure (commented out for safety)
          // await deleteDoc(doc(db, "mcqs", docSnap.id));
          
        } catch (error) {
          console.error(`Error migrating MCQ ${docSnap.id}:`, error);
          errorCount++;
        }
      }
      
      console.log("=== Migration Complete ===");
      console.log(`Successfully migrated: ${migratedCount}`);
      console.log(`Unmapped to default course: ${unmappedCount}`);
      console.log(`Errors: ${errorCount}`);
      
      alert(`Migration complete!\nMigrated: ${migratedCount}\nUnmapped (used default): ${unmappedCount}\nErrors: ${errorCount}\n\nNote: Old MCQs were not deleted for safety. You can manually delete them after verifying the migration.`);
      
      // Reload MCQs
      loadMCQs(selectedCategory, selectedChapter);
      
    } catch (error) {
      console.error("Migration failed:", error);
      alert(`Migration failed: ${error.message}`);
    }
  }

  // Test Cloudinary connection
  async function testCloudinaryConnection() {
    try {
      console.log("=== Testing Cloudinary Connection ===");
      console.log("Cloud name:", process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME);
      console.log("Upload preset:", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);
      
      // Try to create a simple test image
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#4F46E5';
      ctx.fillRect(0, 0, 100, 100);
      ctx.fillStyle = 'white';
      ctx.font = '16px Arial';
      ctx.fillText('Test', 30, 55);
      
      canvas.toBlob(async (blob) => {
        const testFile = new File([blob], 'test.png', { type: 'image/png' });
        
        console.log("Test file created:", testFile.name, testFile.size, "bytes");
        
        const testURL = await uploadToCloudinary(testFile);
        console.log("Test upload successful:", testURL);
        
        alert("Cloudinary is working correctly!");
      }, 'image/png');
      
    } catch (error) {
      console.error("Cloudinary test failed:", error);
      alert(`Cloudinary test failed: ${error.message}`);
    }
  }

  if (loading || loadingCourses) return <div className="flex items-center justify-center min-h-screen"><div>Loading...</div></div>;
  if (!user || !isAdmin) return <div className="flex items-center justify-center min-h-screen"><div>Access Denied</div></div>;
  if (courses.length === 0) return <div className="flex items-center justify-center min-h-screen"><div>No courses found. Please add courses first.</div></div>;

  return (
    <CheckAdminAuth>
      <div className="p-6 bg-gray-100 min-h-screen">
        <div className="flex justify-between items-center mb-6">
          <Link href="/Admin">
            <button className="bg-slate-400 hover:bg-slate-500 text-white px-4 py-2 rounded">Back</button>
          </Link>
          <h1 className="text-2xl font-bold">Manage MCQs</h1>
          <div className="flex gap-2">
            {process.env.NODE_ENV === 'development' && (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    console.log("Current state:");
                    console.log("Question:", question);
                    console.log("Question Image:", questionImage);
                    console.log("Options:", options);
                    console.log("Option Images:", optionImages);
                    console.log("Answers:", answers);
                    console.log("Category:", category);
                  }}
                  className="bg-sky-400 hover:bg-sky-500 text-white px-4 py-2 rounded text-sm"
                >
                  Debug State
                </button>
                <button
                  onClick={testCloudinaryConnection}
                  className="bg-emerald-400 hover:bg-emerald-500 text-white px-4 py-2 rounded text-sm"
                >
                  Test Cloudinary
                </button>
                <button
                  onClick={migrateOldMCQs}
                  className="bg-violet-400 hover:bg-violet-500 text-white px-4 py-2 rounded text-sm"
                >
                  Migrate MCQs
                </button>
              </div>
            )}
            <button onClick={() => signOut(auth)} className="bg-rose-400 hover:bg-rose-500 text-white px-4 py-2 rounded">
              Logout
            </button>
          </div>
        </div>

        {/* Add MCQ */}
        <div className="bg-white p-6 rounded shadow mb-8">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">{editingId ? "Edit MCQ" : "Add MCQ"}</h2>
            {selectedChapterForMCQ && (
              <span className="text-xs bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-medium">
                📚 Category: {selectedChapterForMCQ}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Course
              </label>
              <select
                value={category}
                onChange={(e) => {
                  const newCourseId = e.target.value;
                  setCategory(newCourseId);
                  loadChaptersForForm(newCourseId);
                  setSelectedChapterForMCQ(""); // Reset chapter selection
                }}
                className="border p-2 w-full rounded"
              >
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Chapter/Category
              </label>
              {chaptersForMCQForm.length > 0 ? (
                <select
                  value={selectedChapterForMCQ}
                  onChange={(e) => setSelectedChapterForMCQ(e.target.value)}
                  className="border p-2 w-full rounded"
                >
                  <option value="">Select a chapter...</option>
                  {chaptersForMCQForm.map(chapter => (
                    <option key={chapter.id} value={chapter.title}>
                      {chapter.title}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="border p-2 w-full rounded bg-gray-50 text-gray-500 text-sm">
                  No chapters available for this course
                </div>
              )}
            </div>
          </div>

          <input
            type="text"
            placeholder="Enter question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="border p-2 w-full mb-3"
          />

          {/* Question Image Upload */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Image (Optional)
            </label>
            <div className="flex gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files[0]) {
                    handleQuestionImageUpload(e.target.files[0]);
                  }
                }}
                className="border p-2 flex-1"
              />
              {questionImage && (
                <button
                  onClick={() => setQuestionImage("")}
                  className="bg-rose-400 hover:bg-rose-500 text-white px-3 py-2 rounded text-sm"
                >
                  Remove
                </button>
              )}
            </div>
            {questionImage && (
              <div className="mt-2">
                <Image 
                  src={questionImage} 
                  alt="Question image"
                  width={200}
                  height={128}
                  className="max-w-xs max-h-32 object-contain border rounded"
                />
              </div>
            )}
          </div>

          {/* Optional description */}
          <textarea
            placeholder="Enter optional description (e.g., explanation, context)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border p-2 w-full mb-3"
            rows={3}
          />

          {options.map((opt, idx) => (
            <div key={idx} className="mb-4 p-3 border rounded">
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder={`Option ${idx + 1}`}
                  value={opt}
                  onChange={(e) => {
                    const newOpts = [...options];
                    const oldValue = newOpts[idx];
                    newOpts[idx] = e.target.value;
                    setOptions(newOpts);
                    // Update answers if the old option was selected
                    if (answers.includes(oldValue)) {
                      setAnswers(prev => prev.filter(ans => ans !== oldValue));
                    }
                  }}
                  className="border p-2 flex-1"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files[0]) {
                      handleImageUpload(e.target.files[0], idx);
                    }
                  }}
                  className="border p-2"
                />
              </div>
              
              {/* Display uploaded image */}
              {optionImages[idx] && (
                <div className="mt-2">
                  <Image 
                    src={optionImages[idx]} 
                    alt={`Option ${idx + 1} image`}
                    width={200}
                    height={128}
                    className="max-w-xs max-h-32 object-contain border rounded"
                  />
                  <button
                    onClick={() => {
                      const newImages = [...optionImages];
                      newImages[idx] = "";
                      setOptionImages(newImages);
                    }}
                    className="ml-2 bg-rose-400 hover:bg-rose-500 text-white px-2 py-1 rounded text-sm"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Select correct answer(s) from entered options */}
          <div className="border p-4 rounded mb-3">
            <p className="font-semibold mb-2">Select Correct Answer(s):</p>
            {options
              .filter(opt => opt.trim() !== "")
              .map((opt, i) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id={`answer-${i}`}
                    checked={answers.includes(opt)}
                    onChange={() => handleAnswerCheckbox(opt)}
                    className="w-4 h-4"
                  />
                  <label htmlFor={`answer-${i}`} className="cursor-pointer">
                    {opt}
                  </label>
                </div>
              ))}
            {options.filter(opt => opt.trim() !== "").length === 0 && (
              <p className="text-gray-500 text-sm">Enter options above to select answers</p>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={saveMCQ} className="bg-emerald-400 hover:bg-emerald-500 text-white px-4 py-2 rounded">
              {editingId ? "Update MCQ" : "Save MCQ"}
            </button>
            {editingId && (
              <button onClick={cancelEdit} className="bg-slate-300 hover:bg-slate-400 text-white px-4 py-2 rounded">
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Show MCQs */}
        <div className="bg-white p-6 rounded shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Existing MCQs ({mcqs.length})</h2>
            <div className="flex gap-3">
              <select
                value={selectedCategory}
                onChange={handleCategoryChange}
                className="border p-2 rounded"
              >
                <option value="all">All Courses</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
              
              {/* Chapter filter - only show when a specific course is selected */}
              {selectedCategory !== "all" && (
                chapters.length > 0 ? (
                  <select
                    value={selectedChapter}
                    onChange={handleChapterChange}
                    className="border p-2 rounded"
                  >
                    <option value="all">All Chapters</option>
                    {chapters.map(chapter => (
                      <option key={chapter.id} value={chapter.title}>
                        {chapter.title}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-sm text-gray-500 italic px-2">
                    No chapters found for this course
                  </span>
                )
              )}
            </div>
          </div>

          {mcqs.length === 0 && <p>No MCQs found for this course.</p>}

          {mcqs.map((m) => {
            // Get answers array (backward compatible)
            const correctAnswers = Array.isArray(m.answers) ? m.answers : (m.answer ? [m.answer] : []);
            
            // Get course title for display
            const courseTitle = m.categoryTitle || courses.find(c => c.id === (m.courseCategory || m.courseId))?.title || "Unknown Course";
            
            return (
              <div key={m.id} className="bg-gray-50 p-3 rounded mt-2 flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold">{m.question}</p>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {courseTitle}
                    </span>
                    {m.questionCategory && m.questionCategory !== "Uncategorized" && (
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                        📚 {m.questionCategory}
                      </span>
                    )}
                  </div>
                  {m.questionImage && (
                    <div className="mt-2">
                      <Image 
                        src={m.questionImage} 
                        alt="Question image"
                        width={200}
                        height={128}
                        className="max-w-xs max-h-32 object-contain border rounded"
                      />
                    </div>
                  )}
                  {m.description && (
                    <p className="text-sm text-gray-600 mt-1">Description: {m.description}</p>
                  )}
                  <ul className="list-disc ml-6">
                    {m.options.map((opt, i) => {
                      const optText = typeof opt === 'string' ? opt : opt.text;
                      const isCorrect = correctAnswers.includes(optText);
                      
                      return (
                        <li key={i} className={`mb-2 ${isCorrect ? 'text-green-700 font-semibold' : ''}`}>
                          <div className="flex items-center gap-2">
                            <span>
                              {optText}
                              {isCorrect && ' ✓'}
                            </span>
                            {typeof opt === 'object' && opt.image && (
                              <Image 
                                src={opt.image} 
                                alt={`Option ${i + 1} image`}
                                width={200}
                                height={96}
                                className="max-w-xs max-h-24 object-contain border rounded"
                              />
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="text-green-600 font-semibold">
                    Correct Answer{correctAnswers.length > 1 ? 's' : ''}: {correctAnswers.join(', ')}
                  </p>
                </div>
                <div className="flex gap-2 h-fit">
                  <button
                    onClick={() => startEdit(m)}
                    className="bg-sky-400 hover:bg-sky-500 text-white px-3 py-1 rounded"
                  >
                    Edit
                  </button>
                <button
                  onClick={() => deleteMCQ(m.id, m.courseCategory || m.courseId || m.category)}
                  className="bg-rose-400 hover:bg-rose-500 text-white px-3 py-1 rounded"
                >
                  Delete
                </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </CheckAdminAuth>
  );
}
