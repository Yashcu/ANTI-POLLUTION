export function LeafIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.984 3.016c0 0 4.095-.562 7.03 2.373s2.373 7.03 2.373 7.03c0 9.375-12.188 12.188-12.188 12.188S-.625 21 0 11.625c0 0 .562-4.096 3.497-7.03s7.03-2.373 7.03-2.373l-.001.001zm-.055 2.112c-2.316 0-5.592 1.956-7.859 4.223-2.094 2.094-2.618 5.485-2.618 5.485s4.305-.989 6.83-3.514 6.887-9.524 6.887-9.524c0 0-1.875 3.33-3.24 6.643zm8.397 5.263c-1.353-2.228-4.437-4.63-6.666-4.63 0 0 .97 3.39-1.321 5.682-2.735 2.735-9.255 3.193-9.255 3.193s10.375-1.572 13.921-5.118c2.618-2.618 3.321-5.694 3.321-5.694l.001.001z" />
        </svg>
    );
}

export function ClearButton({ onClick, className }: { onClick: () => void, className?: string }) {
    return (
        <button
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-[#8E8E93]/20 hover:bg-[#8E8E93]/40 text-black/60 transition-colors ${className || "right-2"}`}
            aria-label="Clear"
        >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
    );
}
