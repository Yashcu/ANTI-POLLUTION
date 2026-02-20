import React, { useState } from "react";
import { SFText } from "./SFText";

export function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="bg-white/40 border border-black/[0.04] rounded-[14px] overflow-hidden">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-3 transition-colors hover:bg-black/[0.02]"
            >
                <span className={`${SFText.Subheadline} font-semibold text-black/70`}>{title}</span>
                <svg
                    className={`w-4 h-4 text-black/30 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </button>
            {open && <div className="px-4 pb-4 pt-1 leading-relaxed">{children}</div>}
        </div>
    );
}

export function Row({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
    return (
        <div className="flex justify-between items-center py-1">
            <span className={`${SFText.Caption1} text-black/50`}>{label}</span>
            <span className={`${SFText.Caption1} ${valueClass || "text-black/80 font-medium"}`}>{value}</span>
        </div>
    );
}
