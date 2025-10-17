import { useState, useEffect } from "react";
import { auth, db, storage } from "../lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

export default function UploadPage() {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUserId(user ? user.uid : null);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    if (!file) {
      setMessage("Please select a PDF file.");
      return;
    }
    if (!title.trim()) {
      setMessage("Please enter a title.");
      return;
    }
    if (file.type !== "application/pdf") {
      setMessage("Only PDF files are allowed.");
      return;
    }
    try {
      setIsSubmitting(true);
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
      const storagePath = `uploads/${timestamp}_${sanitizedName}`;
      const fileRef = ref(storage, storagePath);

      await uploadBytes(fileRef, file, { contentType: "application/pdf" });
      const url = await getDownloadURL(fileRef);

      await addDoc(collection(db, "pdfs"), {
        title: title.trim(),
        url,
        createdAt: serverTimestamp(),
        userId: userId || null,
      });

      setMessage("Upload successful!");
      setTitle("");
      setFile(null);
      (document.getElementById("fileInput") || {}).value = "";
    } catch (err) {
      console.error("Upload failed", err);
      setMessage("Upload failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 640, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>Upload PDF</h1>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Title</span>
          <input
            id="title"
            name="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a title"
            style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
            required
          />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span>PDF File</span>
          <input
            id="fileInput"
            name="file"
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
            required
          />
        </label>
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            padding: "10px 14px",
            background: isSubmitting ? "#94a3b8" : "#2563eb",
            color: "white",
            border: 0,
            borderRadius: 8,
            cursor: isSubmitting ? "not-allowed" : "pointer",
          }}
        >
          {isSubmitting ? "Uploading..." : "Upload"}
        </button>
      </form>
      {message && (
        <p style={{ marginTop: 12 }}>{message}</p>
      )}
    </div>
  );
}


