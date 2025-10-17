"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, Suspense } from "react";
import Image from "next/image";

function CertificateContent() {
  const searchParams = useSearchParams();
  const [printReady, setPrintReady] = useState(false);
  const [templateSrc, setTemplateSrc] = useState("");

  const data = useMemo(() => {
    const now = new Date();
    const defaultDate = now.toLocaleDateString();
    const name = searchParams.get("name") || "";
    const course = searchParams.get("course") || "";
    const certNo = searchParams.get("certNo") || `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}-${Math.floor(Date.now()/1000)}`;
    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";
    const issued = searchParams.get("issued") || defaultDate;
    return { name, course, certNo, from, to, issued };
  }, [searchParams]);

  const nameLines = useMemo(() => {
    const full = (data.name || "").trim().replace(/\s+/g, " ");
    if (full.length <= 16) return [full, ""];
    const words = full.split(" ");
    let line1 = "";
    let i = 0;
    while (i < words.length) {
      const candidate = line1 ? line1 + " " + words[i] : words[i];
      if (candidate.length < 16) {
        line1 = candidate;
        i++;
        continue;
      }
      if (candidate.length === 16) {
        // If exactly 16 with a whole word, move this whole word to next line
        break;
      }
      // Would exceed 16, stop before this word
      break;
    }
    if (!line1) {
      // fallback: hard split without breaking grapheme clusters excessively
      line1 = full.slice(0, 16);
      return [line1, full.slice(16).trimStart()];
    }
    const line2 = words.slice(i).join(" ");
    return [line1, line2];
  }, [data.name]);

  useEffect(() => {
    // Prefer cc.png if provided by you, then fall back
    const probe = async () => {
      const candidates = [
        "/cc.png"
      ];
      for (const url of candidates) {
        try {
          const res = await fetch(url, { method: "HEAD" });
          if (res.ok) {
            setTemplateSrc(url);
            break;
          }
        } catch {}
      }
      setPrintReady(true);
    };
    probe();
  }, []);

  function handlePrint() {
    if (typeof window !== "undefined") window.print();
  }

  return (
    <div id="certificate-root" className="min-h-screen bg-gray-100 py-6 px-4 print:bg-white">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow print:shadow-none print:border-0 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Image src="/vawe-logo.png" alt="VAWE" width={40} height={40} className="w-10 h-10 object-contain" />
            <h1 className="text-2xl font-extrabold tracking-wide">VAWE</h1>
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-medium">Certificate No:</span> {data.certNo}
          </div>
        </div>

        {/* Use A4-ish ratio; adjust overlay to match cc.png layout */}
        <div className="relative w-full" style={{ aspectRatio: "1.414/1" }}>
          {templateSrc ? (
            <div className="absolute inset-0">
              <Image src={templateSrc} alt="Certificate Template" fill sizes="100vw" className="object-contain" priority />
            </div>
          ) : (
            <div className="absolute inset-0 w-full h-full bg-white" />
          )}

          {/* Overlay text positions - only fill the dotted lines on your template */}
          <div className="absolute inset-0 w-full h-full">
            {/* Name on dotted line under the big title (wrap to next line if >16 chars) */}
            <div className="absolute left-[65%] right-[4%] top-[45%]">
              <p className="text-[28px] md:text-[28px] font-semibold italic text-[#b87333] drop-shadow-sm whitespace-nowrap">
                {nameLines[0]}
              </p>
            </div>
            {nameLines[1] && (
              <div className="absolute left-[35%] right-[10%] top-[52%]">
                <p className="text-[26px] md:text-[26px] font-semibold italic text-[#b87333] drop-shadow-sm">
                  {nameLines[1]}
                </p>
              </div>
            )}

            {/* Course text on both dotted lines (Course ... and Training Programme on ...) */}
            {/* <div className="absolute left-[35%] right-[9%] top-[52%]">
              <p className="text-[18px] md:text-[22px] font-semibold tracking-wide text-[#7a1e16]">
                {data.course}
              </p>
            </div> */}
            <div className="absolute left-[55%] right-[9%] top-[59%]">
              <p className="text-[18px] md:text-[22px] font-semibold tracking-wide text-[#7a1e16]">
                {data.course}
              </p>
            </div>

            {/* Period From/To values placed on their dotted segments */}
            <div className="absolute left-[42%] top-[64%]">
              <p className="text-[18px] md:text-[20px] font-semibold text-[#7a1e16]">{data.from || ""}</p>
            </div>
            <div className="absolute left-[67%] top-[64%]">
              <p className="text-[18px] md:text-[20px] font-semibold text-[#7a1e16]">{data.to || ""}</p>
            </div>

            {/* Issued date bottom-left like template */}
            <div className="absolute left-[39%] bottom-[11%] text-sm">
              <div>{data.issued}</div>
            </div>

            {/* Director/stamp bottom-right */}
            {/* <div className="absolute right-[12%] bottom-[10%] text-center">
              <Image src="/vawe-logo.png" alt="Stamp" width={96} height={96} className="w-24 h-24 mx-auto opacity-90" />
              
            </div> */}
          </div>
        </div>

        <div className="mt-4 flex gap-2 print:hidden">
          <button onClick={handlePrint} disabled={!printReady} className={`px-4 py-2 rounded text-white ${printReady ? "bg-emerald-600 hover:bg-emerald-700" : "bg-gray-400"}`}>
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* Print-only styles */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden !important; }
          #certificate-root, #certificate-root * { visibility: visible !important; }
          #certificate-root { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
}

export default function CertificatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <CertificateContent />
    </Suspense>
  );
}


