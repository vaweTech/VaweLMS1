"use client";

/**
 * Firebase Helper - Manages dual Firebase setup
 * 
 * Primary Firebase (firebase.js): 
 *   - User authentication (students, trainers, admins)
 *   - Courses metadata
 *   - Student data, enrollments
 *   - Unlocks and chapter access
 *   - Payments and receipts
 * 
 * MCQ Firebase (firebaseMCQs.js):
 *   - Assignments (Progress Tests)
 *   - MCQ Questions
 *   - Submissions
 *   - Test results
 */

import { db } from './firebase';
import { mcqDb } from './firebaseMCQs';
import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  Timestamp
} from 'firebase/firestore';

/**
 * Get the appropriate database for a given collection
 * @param {string} collectionName - The name of the collection
 * @returns {Firestore} - The appropriate Firestore instance
 */
export const getDbForCollection = (collectionName) => {
  // Collections stored in MCQ Firebase
  const mcqCollections = ['progressTests', 'mcqQuestions'];
  
  // For assignments subcollection, we store in MCQ Firebase
  if (collectionName === 'assignments' || collectionName === 'submissions') {
    return mcqDb;
  }
  
  if (mcqCollections.includes(collectionName)) {
    return mcqDb;
  }
  
  // Default to primary Firebase
  return db;
};

/**
 * Assignment Management Functions
 * These handle storing assignments and submissions in the MCQ Firebase
 */

export const assignmentHelpers = {
  /**
   * Get all assignments for a course
   */
  async getAssignments(courseId) {
    try {
      const assignmentsRef = collection(mcqDb, 'courses', courseId, 'assignments');
      const snapshot = await getDocs(assignmentsRef);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching assignments:', error);
      throw error;
    }
  },

  /**
   * Get a single assignment
   */
  async getAssignment(courseId, assignmentId) {
    try {
      const assignmentRef = doc(mcqDb, 'courses', courseId, 'assignments', assignmentId);
      const snapshot = await getDoc(assignmentRef);
      
      if (!snapshot.exists()) {
        return null;
      }
      
      return {
        id: snapshot.id,
        ...snapshot.data()
      };
    } catch (error) {
      console.error('Error fetching assignment:', error);
      throw error;
    }
  },

  /**
   * Create a new assignment
   */
  async createAssignment(courseId, assignmentData) {
    try {
      const assignmentsRef = collection(mcqDb, 'courses', courseId, 'assignments');
      const docRef = await addDoc(assignmentsRef, {
        ...assignmentData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating assignment:', error);
      throw error;
    }
  },

  /**
   * Update an assignment
   */
  async updateAssignment(courseId, assignmentId, assignmentData) {
    try {
      const assignmentRef = doc(mcqDb, 'courses', courseId, 'assignments', assignmentId);
      await updateDoc(assignmentRef, {
        ...assignmentData,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating assignment:', error);
      throw error;
    }
  },

  /**
   * Delete an assignment
   */
  async deleteAssignment(courseId, assignmentId) {
    try {
      const assignmentRef = doc(mcqDb, 'courses', courseId, 'assignments', assignmentId);
      await deleteDoc(assignmentRef);
    } catch (error) {
      console.error('Error deleting assignment:', error);
      throw error;
    }
  },

  /**
   * Get submissions for an assignment
   */
  async getSubmissions(courseId, assignmentId) {
    try {
      const submissionsRef = collection(mcqDb, 'courses', courseId, 'assignments', assignmentId, 'submissions');
      const snapshot = await getDocs(submissionsRef);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching submissions:', error);
      throw error;
    }
  },

  /**
   * Create a submission
   */
  async createSubmission(courseId, assignmentId, submissionData) {
    try {
      const submissionsRef = collection(mcqDb, 'courses', courseId, 'assignments', assignmentId, 'submissions');
      const docRef = await addDoc(submissionsRef, {
        ...submissionData,
        submittedAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating submission:', error);
      throw error;
    }
  },

  /**
   * Update a submission
   */
  async updateSubmission(courseId, assignmentId, submissionId, submissionData) {
    try {
      const submissionRef = doc(mcqDb, 'courses', courseId, 'assignments', assignmentId, 'submissions', submissionId);
      await updateDoc(submissionRef, submissionData);
    } catch (error) {
      console.error('Error updating submission:', error);
      throw error;
    }
  }
};

/**
 * Course Management Functions
 * These are for course metadata stored in the primary Firebase
 */
export const courseHelpers = {
  /**
   * Get all courses
   */
  async getCourses() {
    try {
      const coursesRef = collection(db, 'courses');
      const snapshot = await getDocs(coursesRef);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw error;
    }
  },

  /**
   * Get a single course
   */
  async getCourse(courseId) {
    try {
      const courseRef = doc(db, 'courses', courseId);
      const snapshot = await getDoc(courseRef);
      
      if (!snapshot.exists()) {
        return null;
      }
      
      return {
        id: snapshot.id,
        ...snapshot.data()
      };
    } catch (error) {
      console.error('Error fetching course:', error);
      throw error;
    }
  }
};

/**
 * Export databases for direct access when needed
 */
export { db as primaryDb, mcqDb };

