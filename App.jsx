import { useState, useEffect, useCallback } from "react";

const HABITS = [
  { id: "workout", label: "Workout", icon: "💪", color: "#E8553A" },
  { id: "productive", label: "Productive Day", icon: "⚡", color: "#2D9CDB" },
  { id: "bible", label: "Bible Reading", icon: "📖", color: "#8B5CF6" },
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const STORAGE_KEY = "3for3-habit-data";

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function getWeekDates(offset = 0) {
  const today = new Date();
  const day = today.getDay();
  const start = new Date(today);
  start.setDate(today.getDate() - day + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function getStreak(data, habitId) {
  let streak = 0;
  const d = new Date();
  const todayData = data[dateKey(d)];
  if (!todayData || !todayData[habitId]) d.setDate(d.getDate() - 1);
  while (true) {
    const key = dateKey(d);
    if (data[key] && data[key][habitId]) { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }
  return streak;
}

function getWeeklyStats(data, weekOffset = 0) {
  const week = getWeekDates(weekOffset);
  const today = new Date();
  const stats = {};
  let totalPossible = 0, totalDone = 0;
  HABITS.forEach(h => { stats[h.id] = { done: 0, total: 0 }; });
  week.forEach(d => {
    if (d > today && dateKey(d) !== dateKey(today)) return;
    const key = dateKey(d);
    HABITS.forEach(h => {
      stats[h.id].total++;
      totalPossible++;
      if (data[key]?.[h.id]) { stats[h.id].done++; totalDone++; }
    });
  });
  return { habits: stats, overall: totalPossible > 0 ? Math.round((totalDone / totalPossible) * 100) : 0 };
}

function getMonthlyStats(data, monthOffset = 0) {
  const today = new Date();
  const targetMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const year = targetMonth.getFullYear();
  const month = targetMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const lastDay = (year === today.getFullYear() && month === today.getMonth()) ? today.getDate() : daysInMonth;
  const stats = {};
  let totalPossible = 0, totalDone = 0;
  HABITS.forEach(h => { stats[h.id] = { done: 0, total: 0 }; });
  for (let day = 1; day <= lastDay; day++) {
    const key = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    HABITS.forEach(h => {
      stats[h.id].total++;
      totalPossible++;
      if (data[key]?.[h.id]) { stats[h.id].done++; totalDone++; }
    });
  }
  return { habits: stats, overall: totalPossible > 0 ? Math.round((totalDone / totalPossible) * 100) : 0, label: `${MONTHS_SHORT[month]} ${year}` };
}

function getYearlyStats(data, yearOffset = 0) {
  const today = new Date();
  const year = today.getFullYear() + yearOffset;
  const stats = {};
  let totalPossible = 0, totalDone = 0;
  HABITS.forEach(h => { stats[h.id] = { done: 0, total: 0 }; });
  const endMonth = year === today.getFullYear() ? today.getMonth() : 11;
  for (let month = 0; month <= endMonth; month++) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const lastDay = (year === today.getFullYear() && month === today.getMonth()) ? today.getDate() : daysInMonth;
    for (let day = 1; day <= lastDay; day++) {
      const key = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
      HABITS.forEach(h => {
        stats[h.id].total++;
        totalPossible++;
        if (data[key]?.[h.id]) { stats[h.id].done++; totalDone++; }
      });
    }
  }
  return { habits: stats, overall: totalPossible > 0 ? Math.round((totalDone / totalPossible) * 100) : 0, label: `${year}` };
}

function CircularProgress({ pct, color, size = 80, strokeWidth = 6, children }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {children}
      </div>
    </div>
  );
}

function ProgressBar({ pct, color }) {
  return (
    <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden", flex: 1 }}>
      <div style={{
        height: "100%", borderRadius: 3, background: color, width: `${pct}%`,
        transition: "width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
      }} />
    </div>
  );
}

export default function App() {
  const [data, setData] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch { return {}; }
  });
  const [weekOffset, setWeekOffset] = useState(0);
  const [animateIn, setAnimateIn] = useState(false);
  const [view, setView] = useState("tracker");
  const [statsPeriod, setStatsPeriod] = useState("weekly");
  const [statsOffset, setStatsOffset] = useState(0);

  useEffect(() => { setTimeout(() => setAnimateIn(true), 50); }, []);

  const save = useCallback((newData) => {
    setData(newData);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(newData)); } catch (e) {}
  }, []);

  const toggle = (date, habitId) => {
    const key = dateKey(date);
    const newData = { ...data };
    if (!newData[key]) newData[key] = {};
    newData[key] = { ...newData[key], [habitId]: !newData[key][habitId] };
    save(newData);
  };

  const week = getWeekDates(weekOffset);
  const today = new Date();
  const todayStr = dateKey(today);
  const todayComplete = HABITS.every(h => data[todayStr]?.[h.id]);
  const todayCount = HABITS.filter(h => data[todayStr]?.[h.id]).length;

  const statsData = statsPeriod === "weekly" ? getWeeklyStats(data, statsOffset)
    : statsPeriod === "monthly" ? getMonthlyStats(data, statsOffset)
    : getYearlyStats(data, statsOffset);

  const statsLabel = statsPeriod === "weekly"
    ? (statsOffset === 0 ? "This Week" : statsOffset === -1 ? "Last Week" : `${Math.abs(statsOffset)} weeks ago`)
    : statsData.label;

  return (
    <div style={{
      minHeight: "100dvh", background: "#0D0D0F", color: "#E8E6E1",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      WebkitTapHighlightColor: "transparent",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { margin: 0; background: #0D0D0F; overscroll-behavior: none; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { transform: scale(0.85); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes checkPop { 0% { transform: scale(1); } 50% { transform: scale(1.25); } 100% { transform: scale(1); } }
        .habit-cell { transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1); cursor: pointer; -webkit-user-select: none; user-select: none; }
        .habit-cell:hover { transform: scale(1.12); }
        .habit-cell:active { transform: scale(0.95); }
        .check-pop { animation: checkPop 0.3s cubic-bezier(0.34,1.56,0.64,1); }
        .btn-hover { transition: all 0.15s ease; -webkit-user-select: none; user-select: none; }
        .btn-hover:hover { background: rgba(255,255,255,0.08) !important; }
        .btn-hover:active { transform: scale(0.96); }
        .tab-btn { transition: all 0.2s ease; cursor: pointer; border: none; font-family: inherit; -webkit-user-select: none; user-select: none; }
        .tab-btn:active { transform: scale(0.96); }
        @media (display-mode: standalone) {
          body { padding-top: env(safe-area-inset-top); }
        }
      `}</style>

      <div style={{
        maxWidth: 520, margin: "0 auto", padding: "28px 20px 60px",
        paddingTop: "calc(28px + env(safe-area-inset-top, 0px))",
        opacity: animateIn ? 1 : 0, transform: animateIn ? "translateY(0)" : "translateY(10px)",
        transition: "all 0.6s cubic-bezier(0.16,1,0.3,1)",
      }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h1 style={{
                fontFamily: "'Playfair Display', serif", fontSize: 34, fontWeight: 900, margin: 0,
                letterSpacing: "-0.02em",
                background: "linear-gradient(135deg, #E8E6E1 0%, #A09C94 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
                3 for 3
              </h1>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#4A4845", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 500 }}>
                {todayCount}/3 today · {MONTHS_SHORT[today.getMonth()]} {today.getDate()}
              </p>
            </div>
            {todayComplete && <span style={{ fontSize: 28, animation: "scaleIn 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>🔥</span>}
          </div>
        </div>

        {/* View toggle */}
        <div style={{
          display: "flex", background: "rgba(255,255,255,0.03)", borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.06)", padding: 3, marginBottom: 24, gap: 2,
        }}>
          {[{ id: "tracker", label: "Tracker" }, { id: "stats", label: "Stats" }].map(v => (
            <button key={v.id} className="tab-btn" onClick={() => { setView(v.id); setStatsOffset(0); }}
              style={{
                flex: 1, padding: "10px 0", borderRadius: 10, fontSize: 13, fontWeight: 600,
                letterSpacing: "0.02em",
                background: view === v.id ? "rgba(255,255,255,0.08)" : "transparent",
                color: view === v.id ? "#E8E6E1" : "#6B6965",
              }}>
              {v.label}
            </button>
          ))}
        </div>

        {/* TRACKER VIEW */}
        {view === "tracker" && (
          <div>
            {/* Streak cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 28 }}>
              {HABITS.map(h => {
                const streak = getStreak(data, h.id);
                return (
                  <div key={h.id} style={{
                    background: `linear-gradient(145deg, ${h.color}12, ${h.color}06)`,
                    border: `1px solid ${h.color}20`, borderRadius: 14, padding: "14px 12px", textAlign: "center",
                  }}>
                    <div style={{ fontSize: 20, marginBottom: 3 }}>{h.icon}</div>
                    <div style={{ fontSize: 26, fontFamily: "'Playfair Display', serif", fontWeight: 900, color: h.color, lineHeight: 1 }}>{streak}</div>
                    <div style={{ fontSize: 9, color: "#6B6965", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 500, marginTop: 2 }}>day streak</div>
                  </div>
                );
              })}
            </div>

            {/* Week nav */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <button className="btn-hover" onClick={() => setWeekOffset(w => w - 1)}
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "#A09C94", borderRadius: 10, padding: "7px 14px", cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: "inherit" }}>
                ‹ Prev
              </button>
              <span style={{ fontSize: 13, color: weekOffset === 0 ? "#E8E6E1" : "#6B6965", fontWeight: 500 }}>
                {weekOffset === 0 ? "This Week" : weekOffset === -1 ? "Last Week" : `${Math.abs(weekOffset)} wk ago`}
              </span>
              <button className="btn-hover" onClick={() => setWeekOffset(w => Math.min(0, w + 1))}
                style={{ background: weekOffset < 0 ? "rgba(255,255,255,0.04)" : "transparent", border: weekOffset < 0 ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent", color: weekOffset < 0 ? "#A09C94" : "#333", borderRadius: 10, padding: "7px 14px", cursor: weekOffset < 0 ? "pointer" : "default", fontSize: 13, fontWeight: 500, fontFamily: "inherit" }}>
                Next ›
              </button>
            </div>

            {/* Grid */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 18, padding: "18px 14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "90px repeat(7, 1fr)", gap: 5, marginBottom: 10 }}>
                <div />
                {week.map(d => {
                  const isToday = dateKey(d) === todayStr;
                  return (
                    <div key={d.toISOString()} style={{ textAlign: "center", fontSize: 10, fontWeight: 500, letterSpacing: "0.04em" }}>
                      <div style={{ color: isToday ? "#E8E6E1" : "#4A4845", textTransform: "uppercase" }}>{DAYS[d.getDay()]}</div>
                      <div style={{
                        color: isToday ? "#E8E6E1" : "#6B6965", fontSize: 15, fontWeight: isToday ? 700 : 400, marginTop: 2,
                        ...(isToday ? { background: "rgba(232,85,58,0.15)", borderRadius: 8, padding: "2px 0" } : {}),
                      }}>{d.getDate()}</div>
                    </div>
                  );
                })}
              </div>
              {HABITS.map((h, hi) => (
                <div key={h.id} style={{
                  display: "grid", gridTemplateColumns: "90px repeat(7, 1fr)", gap: 5, alignItems: "center",
                  padding: "7px 0", borderTop: hi > 0 ? "1px solid rgba(255,255,255,0.04)" : "none",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ fontSize: 14 }}>{h.icon}</span>
                    <span style={{ fontSize: 11, fontWeight: 500, color: "#A09C94", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{h.label}</span>
                  </div>
                  {week.map(d => {
                    const key = dateKey(d);
                    const checked = data[key]?.[h.id];
                    const isFuture = d > today && key !== todayStr;
                    return (
                      <div key={d.toISOString()} className={`habit-cell ${checked ? "check-pop" : ""}`}
                        onClick={() => !isFuture && toggle(d, h.id)}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "center", height: 36, borderRadius: 9,
                          background: checked ? `${h.color}20` : isFuture ? "rgba(255,255,255,0.01)" : "rgba(255,255,255,0.03)",
                          border: checked ? `1.5px solid ${h.color}50` : "1.5px solid rgba(255,255,255,0.05)",
                          opacity: isFuture ? 0.3 : 1, cursor: isFuture ? "default" : "pointer",
                        }}>
                        {checked && (
                          <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                            <path d="M4 9.5L7.5 13L14 5.5" stroke={h.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Quick toggle */}
            <div style={{ marginTop: 22 }}>
              <div style={{ fontSize: 10, color: "#4A4845", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 500, marginBottom: 8 }}>
                Quick toggle — Today
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {HABITS.map(h => {
                  const checked = data[todayStr]?.[h.id];
                  return (
                    <button key={h.id} onClick={() => toggle(today, h.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        background: checked ? `linear-gradient(135deg, ${h.color}15, ${h.color}08)` : "rgba(255,255,255,0.02)",
                        border: checked ? `1px solid ${h.color}30` : "1px solid rgba(255,255,255,0.05)",
                        borderRadius: 13, padding: "13px 16px", cursor: "pointer", width: "100%", textAlign: "left",
                        transition: "all 0.2s ease", color: "#E8E6E1", fontFamily: "inherit",
                      }}>
                      <div style={{
                        width: 26, height: 26, borderRadius: 7,
                        background: checked ? h.color : "rgba(255,255,255,0.06)",
                        display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s ease", flexShrink: 0,
                      }}>
                        {checked
                          ? <svg width="14" height="14" viewBox="0 0 18 18" fill="none"><path d="M4 9.5L7.5 13L14 5.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          : <span style={{ fontSize: 13 }}>{h.icon}</span>
                        }
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, textDecoration: checked ? "line-through" : "none", opacity: checked ? 0.5 : 1 }}>{h.label}</span>
                      {checked && <span style={{ marginLeft: "auto", fontSize: 11, color: h.color, fontWeight: 600 }}>Done ✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {todayComplete && (
              <div style={{
                marginTop: 24, textAlign: "center", padding: "18px",
                background: "linear-gradient(135deg, rgba(232,85,58,0.08), rgba(139,92,246,0.08))",
                borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)",
                animation: "scaleIn 0.4s cubic-bezier(0.34,1.56,0.64,1)",
              }}>
                <div style={{ fontSize: 26, marginBottom: 4 }}>🎉</div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700 }}>3 for 3 today!</div>
                <div style={{ fontSize: 12, color: "#6B6965", marginTop: 3 }}>Keep the momentum going.</div>
              </div>
            )}
          </div>
        )}

        {/* STATS VIEW */}
        {view === "stats" && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>
            <div style={{
              display: "flex", background: "rgba(255,255,255,0.03)", borderRadius: 11,
              border: "1px solid rgba(255,255,255,0.06)", padding: 3, marginBottom: 22, gap: 2,
            }}>
              {[{ id: "weekly", label: "Week" }, { id: "monthly", label: "Month" }, { id: "yearly", label: "Year" }].map(p => (
                <button key={p.id} className="tab-btn" onClick={() => { setStatsPeriod(p.id); setStatsOffset(0); }}
                  style={{
                    flex: 1, padding: "9px 0", borderRadius: 9, fontSize: 12, fontWeight: 600,
                    background: statsPeriod === p.id ? "rgba(255,255,255,0.08)" : "transparent",
                    color: statsPeriod === p.id ? "#E8E6E1" : "#6B6965",
                  }}>
                  {p.label}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <button className="btn-hover" onClick={() => setStatsOffset(o => o - 1)}
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "#A09C94", borderRadius: 10, padding: "7px 14px", cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: "inherit" }}>
                ‹
              </button>
              <span style={{ fontSize: 14, color: "#E8E6E1", fontWeight: 600 }}>{statsLabel}</span>
              <button className="btn-hover" onClick={() => setStatsOffset(o => Math.min(0, o + 1))}
                style={{ background: statsOffset < 0 ? "rgba(255,255,255,0.04)" : "transparent", border: statsOffset < 0 ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent", color: statsOffset < 0 ? "#A09C94" : "#333", borderRadius: 10, padding: "7px 14px", cursor: statsOffset < 0 ? "pointer" : "default", fontSize: 13, fontWeight: 500, fontFamily: "inherit" }}>
                ›
              </button>
            </div>

            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32,
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: 20, padding: "28px 20px",
            }}>
              <CircularProgress pct={statsData.overall} color="#E8553A" size={120} strokeWidth={8}>
                <div style={{ textAlign: "center" }}>
                  <div style={{
                    fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 900,
                    background: "linear-gradient(135deg, #E8553A, #8B5CF6)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  }}>
                    {statsData.overall}%
                  </div>
                </div>
              </CircularProgress>
              <div style={{ marginTop: 10, fontSize: 12, color: "#6B6965", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Overall Completion
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {HABITS.map(h => {
                const s = statsData.habits[h.id];
                const pct = s.total > 0 ? Math.round((s.done / s.total) * 100) : 0;
                return (
                  <div key={h.id} style={{
                    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
                    borderRadius: 16, padding: "18px 20px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 20 }}>{h.icon}</span>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{h.label}</span>
                      </div>
                      <span style={{ fontSize: 22, fontFamily: "'Playfair Display', serif", fontWeight: 900, color: h.color }}>{pct}%</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <ProgressBar pct={pct} color={h.color} />
                      <span style={{ fontSize: 11, color: "#6B6965", fontWeight: 500, whiteSpace: "nowrap" }}>{s.done}/{s.total} days</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {statsData.overall > 0 && (
              <div style={{
                marginTop: 24, padding: "18px 20px",
                background: statsData.overall >= 80
                  ? "linear-gradient(135deg, rgba(232,85,58,0.08), rgba(139,92,246,0.08))"
                  : statsData.overall >= 50 ? "rgba(45,156,219,0.06)" : "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, textAlign: "center",
              }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>
                  {statsData.overall >= 80 ? "🔥" : statsData.overall >= 50 ? "💪" : "🌱"}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                  {statsData.overall >= 80 ? "Crushing it!" : statsData.overall >= 50 ? "Solid consistency!" : "Building the habit!"}
                </div>
                <div style={{ fontSize: 12, color: "#6B6965" }}>
                  {statsData.overall >= 80 ? "You're showing up and it shows." : statsData.overall >= 50 ? "Keep pushing toward that 3 for 3." : "Every check mark counts. Keep going."}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
