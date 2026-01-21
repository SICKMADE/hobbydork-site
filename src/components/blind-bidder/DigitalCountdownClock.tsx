import { useEffect, useState } from "react";


export function DigitalCountdownClock({ endTime }: { endTime: Date }) {
  const [remaining, setRemaining] = useState(() => Math.max(0, endTime.getTime() - Date.now()));

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining(Math.max(0, endTime.getTime() - Date.now()));
    }, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  const hours = Math.floor(remaining / 1000 / 60 / 60);
  const minutes = Math.floor((remaining / 1000 / 60) % 60);
  const seconds = Math.floor((remaining / 1000) % 60);

  return (
    <div className="font-mono text-lg md:text-xl lg:text-2xl px-2 py-1 rounded bg-black border border-zinc-700 text-emerald-300 tracking-widest text-center shadow-inner select-none">
      {hours.toString().padStart(2, '0')}
      :{minutes.toString().padStart(2, '0')}
      :{seconds.toString().padStart(2, '0')}
    </div>
  );
}
