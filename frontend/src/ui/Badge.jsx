import React from "react";


const palette = {
VPN: "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30",
TOR: "bg-rose-500/20 text-rose-300 border border-rose-400/30",
I2P: "bg-violet-500/20 text-violet-300 border border-violet-400/30",
FREENET: "bg-amber-500/20 text-amber-300 border border-amber-400/30",
ZERONET: "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30",
DEFAULT: "bg-slate-700/40 text-slate-300 border border-slate-500/30",
};


export default function Badge({ value }) {
const cls = palette[value] || palette.DEFAULT;
return (
<span className={`px-2 py-0.5 rounded-md text-xs font-mono ${cls}`}>{value}</span>
);
}