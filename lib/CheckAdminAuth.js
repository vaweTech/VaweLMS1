"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "./firebase"; // make sure db = getFirestore(app)
import { doc, getDoc } from "firebase/firestore";

export default function CheckAdminAuth({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push("/auth/login"); // not logged in
        return;
      }

      try {
        // get user doc from Firestore
        const userDocRef = doc(db, "users", user.uid); // assuming user.uid is your doc id
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();

          if (userData.role === "admin" || userData.role === "superadmin") {
            setIsLoading(false); // allow access for admin and superadmin
          } else {
            router.push("/not-authorized"); // redirect non-admins
          }
        } else {
          router.push("/not-authorized"); // no user doc found
        }
      } catch (error) {
        console.error("Error checking user role:", error);
        router.push("/error");
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (isLoading) {
    return <p>Loading...</p>;
  }

  return <>{children}</>;
}
