"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, getDocs, doc, writeBatch } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import CheckAdminAuth from "@/lib/CheckAdminAuth";

export default function ManageTrainersPage() {
  const router = useRouter();
  const [trainers, setTrainers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [newTrainer, setNewTrainer] = useState({ name: "", email: "" });
  const [selectedTrainerId, setSelectedTrainerId] = useState("");
  const [trainerClasses, setTrainerClasses] = useState([]);
  const [trainerCourses, setTrainerCourses] = useState([]);

  useEffect(() => {
    (async () => {
      const [tSnap, cSnap, crSnap] = await Promise.all([
        getDocs(collection(db, "users")),
        getDocs(collection(db, "classes")),
        getDocs(collection(db, "courses")),
      ]);
      setTrainers(tSnap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((u) => u.role === "trainer"));
      setClasses(cSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setCourses(crSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    })();
  }, []);

  async function handleCreateTrainer(e) {
    e.preventDefault();
    if (!newTrainer.name || !newTrainer.email) return alert("Name and Email required");
    // Create via server route to also create Firebase Auth user with default password
    const res = await fetch('/api/create-trainer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newTrainer) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Create trainer failed');
    setNewTrainer({ name: "", email: "" });
    const tSnap = await getDocs(collection(db, "users"));
    setTrainers(tSnap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((u) => u.role === "trainer"));
    alert("Trainer created. Default password: VaweTrainer@2025");
  }

  async function handleAssign() {
    if (!selectedTrainerId) return alert("Select a trainer");
    const batch = writeBatch(db);
    batch.update(doc(db, "users", selectedTrainerId), {
      trainerClasses,
      trainerCourses,
    });
    await batch.commit();
    // refresh trainers list to reflect changes
    const tSnap = await getDocs(collection(db, "users"));
    setTrainers(tSnap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((u) => u.role === "trainer"));
    alert("Access updated for trainer.");
  }

  return (
    <CheckAdminAuth>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Manage Trainers</h1>
          <button
            onClick={() => router.back()}
            className="px-3 py-1.5 rounded bg-gray-600 hover:bg-gray-700 text-white"
          >
            ⬅ Back
          </button>
        </div>

        <form onSubmit={handleCreateTrainer} className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <input className="border p-2 rounded" placeholder="Trainer Name" value={newTrainer.name} onChange={(e) => setNewTrainer({ ...newTrainer, name: e.target.value })} />
          <input className="border p-2 rounded" placeholder="Trainer Email" value={newTrainer.email} onChange={(e) => setNewTrainer({ ...newTrainer, email: e.target.value })} />
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Create Trainer</button>
        </form>

        <div className="bg-white border rounded p-4 mb-6">
          <h2 className="font-semibold mb-2">Select Trainer</h2>
          <select className="border p-2 rounded w-full" value={selectedTrainerId} onChange={(e) => setSelectedTrainerId(e.target.value)}>
            <option value="">Choose…</option>
            {trainers.map((t) => (
              <option key={t.id} value={t.id}>{t.name || t.email}</option>
            ))}
          </select>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white border rounded p-4">
            <h3 className="font-semibold mb-2">Grant Class Access</h3>
            <div className="space-y-2 max-h-60 overflow-auto border rounded p-2">
              {classes.map((c) => (
                <label key={c.id} className="flex items-center gap-2">
                  <input type="checkbox" checked={trainerClasses.includes(c.id)} onChange={(e) => {
                    setTrainerClasses((prev) => e.target.checked ? [...prev, c.id] : prev.filter((id) => id !== c.id));
                  }} />
                  <span>{c.name}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="bg-white border rounded p-4">
            <h3 className="font-semibold mb-2">Grant Course Access</h3>
            <div className="space-y-2 max-h-60 overflow-auto border rounded p-2">
              {courses.map((cr) => (
                <label key={cr.id} className="flex items-center gap-2">
                  <input type="checkbox" checked={trainerCourses.includes(cr.id)} onChange={(e) => {
                    setTrainerCourses((prev) => e.target.checked ? [...prev, cr.id] : prev.filter((id) => id !== cr.id));
                  }} />
                  <span>{cr.title}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <button onClick={handleAssign} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded">Save Access</button>
        </div>

        {/* Trainers List */}
        <div className="mt-8 bg-white border rounded p-4 overflow-x-auto">
          <h2 className="font-semibold mb-3">All Trainers</h2>
          {trainers.length === 0 ? (
            <p className="text-sm text-gray-500">No trainers yet.</p>
          ) : (
            <table className="w-full text-sm border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border text-left">Name</th>
                  <th className="p-2 border text-left">Email</th>
                  <th className="p-2 border text-left">Password</th>
                  <th className="p-2 border text-left">Classes</th>
                  <th className="p-2 border text-left">Courses</th>
                </tr>
              </thead>
              <tbody>
                {trainers.map((t) => {
                  const cls = Array.isArray(t.trainerClasses) ? t.trainerClasses : [];
                  const crs = Array.isArray(t.trainerCourses) ? t.trainerCourses : [];
                  const classNames = cls
                    .map((id) => classes.find((c) => c.id === id)?.name)
                    .filter(Boolean)
                    .join(', ');
                  const courseNames = crs
                    .map((id) => courses.find((c) => c.id === id)?.title)
                    .filter(Boolean)
                    .join(', ');
                  return (
                    <tr key={t.id} className="border-t">
                      <td className="p-2 border">{t.name || '-'}</td>
                      <td className="p-2 border">{t.email || '-'}</td>
                      <td className="p-2 border">{t.trainerPassword || '—'}</td>
                      <td className="p-2 border">{classNames || '-'}</td>
                      <td className="p-2 border">{courseNames || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </CheckAdminAuth>
  );
}


