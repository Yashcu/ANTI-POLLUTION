import { ClearButton } from './Icons';
import { SFText } from './SFText';

interface SearchInputProps {
    origin: string;
    setOrigin: (val: string) => void;
    destination: string;
    setDestination: (val: string) => void;
}

export function SearchInput({ origin, setOrigin, destination, setDestination }: SearchInputProps) {
    return (
        <div className="bg-white/60 rounded-[14px] shadow-[0_2px_10px_rgb(0,0,0,0.02)] ring-1 ring-black/5 px-4 relative flex flex-col backdrop-blur-md">
            {/* Origin */}
            <div className="flex items-center h-[46px] border-b border-black/[0.04] relative pr-12">
                <div className="w-2.5 h-2.5 rounded-full border-[1.25px] border-[#007AFF] mr-3 shrink-0" />
                <input
                    className={`w-full bg-transparent ${SFText.Body} text-black placeholder:text-black/30 focus:outline-none`}
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    placeholder="Starting Point"
                />
                {origin && <ClearButton onClick={() => setOrigin("")} className="right-9" />}
            </div>

            {/* Destination */}
            <div className="flex items-center h-[46px] relative pr-12">
                <div className="w-2.5 h-2.5 rounded-full border-[1.25px] border-[#FF3B30] mr-3 shrink-0" />
                <input
                    className={`w-full bg-transparent ${SFText.Body} text-black placeholder:text-black/30 focus:outline-none`}
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Destination"
                />
                {destination && <ClearButton onClick={() => setDestination("")} className="right-9" />}
            </div>

            {/* Swap Button */}
            <button
                onClick={() => {
                    const temp = origin;
                    setOrigin(destination);
                    setDestination(temp);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-white border border-black/[0.08] hover:bg-black/[0.02] shadow-[0_2px_4px_rgba(0,0,0,0.04)] rounded-full text-black/60 transition-colors z-10"
                aria-label="Swap Origin and Destination"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
                </svg>
            </button>
        </div>
    );
}
