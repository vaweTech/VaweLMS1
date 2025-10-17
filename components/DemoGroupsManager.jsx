"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, updateDoc, doc } from "firebase/firestore";
import { motion } from "framer-motion";
import { Plus, Edit, Users, Calendar, BookOpen, Clock, X } from "lucide-react";
import DemoGroupCard from "./DemoGroupCard";
import Modal from "./Modal";

export default function DemoGroupsManager({ 
  user, 
  role,
  onClose 
}) {
  const [demoGroups, setDemoGroups] = useState([]);
  const [loadingDemoGroups, setLoadingDemoGroups] = useState(false);
  const [showCreateGroupForm, setShowCreateGroupForm] = useState(false);
  const [newGroupData, setNewGroupData] = useState({
    name: '',
    course: '',
    startDate: '',
    schedule: '',
    maxStudents: '20',
    description: ''
  });
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [editGroupData, setEditGroupData] = useState(null);
  const [savingGroupChanges, setSavingGroupChanges] = useState(false);

  useEffect(() => {
    fetchDemoGroups();
  }, []);

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
        maxStudents: '20',
        description: ''
      });
      setShowCreateGroupForm(false);
      await fetchDemoGroups();
    } catch (err) {
      console.error('Failed to create demo group:', err);
      alert('Failed to create demo group. Please try again.');
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
      
      alert('Demo group updated successfully!');
      setShowEditGroupModal(false);
      setSelectedGroup(null);
      setEditGroupData(null);
      await fetchDemoGroups();
    } catch (err) {
      console.error('Failed to update demo group:', err);
      alert('Failed to update demo group. Please try again.');
    } finally {
      setSavingGroupChanges(false);
    }
  };

  if (loadingDemoGroups) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Demo Groups Management</h2>
          <p className="text-gray-600 text-sm mt-1">Manage demo sessions and student enrollments</p>
        </div>
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateGroupForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={20} />
            Create Group
          </motion.button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          )}
        </div>
      </div>

      {/* Demo Groups Grid */}
      {demoGroups.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Users size={48} className="mx-auto mb-4 opacity-50" />
          <p>No demo groups created yet</p>
          <p className="text-sm mt-2">Create your first demo group to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {demoGroups.map(group => (
            <DemoGroupCard
              key={group.id}
              group={group}
              onEdit={handleEditGroup}
              onRefresh={fetchDemoGroups}
            />
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateGroupForm && (
        <Modal onClose={() => setShowCreateGroupForm(false)}>
          <h3 className="text-xl font-bold mb-4">Create New Demo Group</h3>
          <form onSubmit={handleCreateDemoGroup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Group Name *
              </label>
              <input
                type="text"
                value={newGroupData.name}
                onChange={(e) => setNewGroupData({ ...newGroupData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course *
              </label>
              <input
                type="text"
                value={newGroupData.course}
                onChange={(e) => setNewGroupData({ ...newGroupData, course: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                value={newGroupData.startDate}
                onChange={(e) => setNewGroupData({ ...newGroupData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                onChange={(e) => setNewGroupData({ ...newGroupData, schedule: e.target.value })}
                placeholder="e.g., Mon-Fri 10AM-12PM"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Students
              </label>
              <input
                type="number"
                value={newGroupData.maxStudents}
                onChange={(e) => setNewGroupData({ ...newGroupData, maxStudents: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={newGroupData.description}
                onChange={(e) => setNewGroupData({ ...newGroupData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowCreateGroupForm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Group
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Group Modal */}
      {showEditGroupModal && editGroupData && (
        <Modal onClose={() => {
          setShowEditGroupModal(false);
          setSelectedGroup(null);
          setEditGroupData(null);
        }}>
          <h3 className="text-xl font-bold mb-4">Edit Demo Group</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Group Name *
              </label>
              <input
                type="text"
                value={editGroupData.name}
                onChange={(e) => setEditGroupData({ ...editGroupData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course *
              </label>
              <input
                type="text"
                value={editGroupData.course}
                onChange={(e) => setEditGroupData({ ...editGroupData, course: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                value={editGroupData.startDate}
                onChange={(e) => setEditGroupData({ ...editGroupData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Schedule
              </label>
              <input
                type="text"
                value={editGroupData.schedule}
                onChange={(e) => setEditGroupData({ ...editGroupData, schedule: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Students
              </label>
              <input
                type="number"
                value={editGroupData.maxStudents}
                onChange={(e) => setEditGroupData({ ...editGroupData, maxStudents: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={editGroupData.status}
                onChange={(e) => setEditGroupData({ ...editGroupData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={editGroupData.description}
                onChange={(e) => setEditGroupData({ ...editGroupData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditGroupModal(false);
                  setSelectedGroup(null);
                  setEditGroupData(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                disabled={savingGroupChanges}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveGroupChanges}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                disabled={savingGroupChanges}
              >
                {savingGroupChanges ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

