import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock, Award, Search, ArrowRight, RotateCcw,
  PlayCircle, RefreshCcw, CheckCircle2,
  Code2, Shield, Calendar, BookOpen,
  BarChart2, Lock, Timer, CalendarClock, CalendarX2, Hourglass, Zap, AlarmClock,
} from "lucide-react";
import PageContainer from "../../../components/layout/PageContainer";
import Spinner from "../../../components/common/Spinner";
import Alert from "../../../components/feedback/Alert";
import Button from "../../../components/common/Button";
import EmptyState from "../../../components/common/EmptyState";
import { AttemptStatusBadge } from "../components/AttemptStatusBadge";
import assessmentService from "../services/assessmentService";
import { ROUTES } from "../../../constants/routes";
import { ATTEMPT_STATUS } from "../constants/assessmentConstants";
import { useAssessmentTimeState } from "../hooks/useAssessmentTimeState";

/* ── Time state badge config ──────────────────────────────────────────── */
const TIME_STATE_CONFIG = {
  locked:       { icon: "alarm",    label: "Scheduled",    bg: "rgba(99,102,241,0.12)",   border: "rgba(99,102,241,0.3)",   color: "#a5b4fc", cardBorder: "rgba(99,102,241,0.25)", prefix: "Opens in" },
  open:         { icon: "zap",      label: "Open",         bg: "rgba(16,185,129,0.12)",   border: "rgba(16,185,129,0.3)",   color: "#34d399", cardBorder: "rgba(16,185,129,0.3)",  prefix: "Closes in" },
  closing_soon: { icon: "timer",    label: "Closing Soon", bg: "rgba(239,68,68,0.15)",    border: "rgba(239,68,68,0.4)",    color: "#f87171", cardBorder: "rgba(239,68,68,0.45)", prefix: "Closes in" },
  expired:      { icon: "calX",     label: "Expired",      bg: "rgba(100,116,139,0.12)",  border: "rgba(100,116,139,0.25)", color: "#64748b", cardBorder: "rgba(100,116,139,0.2)", prefix: "" },
  open_ended:   { icon: "calClock", label: "Always Open",  bg: "rgba(59,130,246,0.12)",   border: "rgba(59,130,246,0.25)", color: "#60a5fa", cardBorder: "var(--border-color)",   prefix: "" },
};

const StateIcons = {
  alarm: AlarmClock, zap: Zap, timer: Timer, calX: CalendarX2, calClock: CalendarClock,
};

/* ── TimeStateBadge ────────────────────────────────────────────────────── */
function TimeStateBadge({ startTime, endTime }) {
  const ts = useAssessmentTimeState(startTime, endTime);
  const cfg = TIME_STATE_CONFIG[ts.state] ?? TIME_STATE_CONFIG.open_ended;
  const Icon = StateIcons[cfg.icon] ?? CalendarClock;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "4px 10px", borderRadius: 8,
      background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color,
      fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
      animation: ts.state === "closing_soon" ? "pulse-badge 1.5s ease infinite" : "none",
    }}>
      <Icon size={12} />
      {cfg.label}
      {ts.countdown && <span style={{ opacity: 0.85, fontWeight: 800 }}>· {ts.countdown}</span>}
    </span>
  );
}

/* ── MetricCell ─────────────────────────────────────────────────────────── */
function MetricCell({ icon, iconBg, iconColor, label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ padding: 5, borderRadius: 6, background: iconBg, color: iconColor, display: "flex", flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.04em" }}>{label}</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0" }}>{value}</div>
      </div>
    </div>
  );
}

/* ── button style helpers ────────────────────────────────────────────────── */
const primaryBtn = (from, to, shadow) => ({
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "8px 18px", borderRadius: 99, border: "none",
  background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
  color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer",
  boxShadow: shadow, transition: "all 0.2s ease", whiteSpace: "nowrap",
});
const analyticsBtn = {
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "8px 14px", borderRadius: 99,
  border: "1px solid rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.1)",
  color: "#a5b4fc", fontSize: 12, fontWeight: 700, cursor: "pointer",
  transition: "all 0.2s ease", whiteSpace: "nowrap",
};

/* ── AssessmentCard ─────────────────────────────────────────────────────── */
function AssessmentCard({ item, info, onStart, onResume, onResult, onRetake }) {
  const ts = useAssessmentTimeState(item.startTime, item.endTime);
  const cfg = TIME_STATE_CONFIG[ts.state] ?? TIME_STATE_CONFIG.open_ended;

  const isLocked = ts.state === "locked";
  const isExpired = ts.state === "expired";
  const isClosingSoon = ts.state === "closing_soon";
  const isInProgress = info.status === ATTEMPT_STATUS.IN_PROGRESS;
  const isCompleted = [ATTEMPT_STATUS.SUBMITTED, ATTEMPT_STATUS.TIMED_OUT, ATTEMPT_STATUS.EVALUATED, ATTEMPT_STATUS.EXPIRED].includes(info.status);
  const isAnalyticsEnabled = item.showResultAnalytics !== false;
  const used = info.attemptsUsed ?? 0;
  const configuredMax = item.maxAttempts || 1;
  const attemptsPct = Math.min(100, (used / configuredMax) * 100);

  const fmtDate = (iso) => iso ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }) : "";

  const topAccent = isClosingSoon ? "linear-gradient(90deg,#ef4444,#f97316)"
    : isLocked ? "linear-gradient(90deg,#6366f1,#8b5cf6)"
    : isExpired ? "rgba(100,116,139,0.3)"
    : isInProgress ? "linear-gradient(90deg,#6366f1,#3b82f6)"
    : isCompleted ? "linear-gradient(90deg,#10b981,#34d399)"
    : "linear-gradient(90deg,#10b981,#3b82f6)";

  const renderAction = () => {
    if (isLocked) return (
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#6366f1", fontSize: 12, fontWeight: 600 }}>
        <AlarmClock size={14} /> Opens {fmtDate(item.startTime)}
      </div>
    );
    if (isExpired && !isCompleted) return (
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#64748b", fontSize: 12, fontWeight: 600 }}>
        <CalendarX2 size={14} /> Submission closed
      </div>
    );
    if (isInProgress) return (
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {isAnalyticsEnabled && isCompleted && <button onClick={onResult} style={analyticsBtn}><BarChart2 size={13} /> Results</button>}
        <button onClick={onResume} style={primaryBtn("#6366f1","#4f46e5","0 4px 14px rgba(99,102,241,0.35)")}><PlayCircle size={14} /> Resume <ArrowRight size={13} /></button>
      </div>
    );
    if (isCompleted) return (
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {isAnalyticsEnabled
          ? <button onClick={onResult} style={analyticsBtn}><BarChart2 size={13} /> View Results</button>
          : <button disabled style={{ ...analyticsBtn, opacity: 0.4, cursor: "not-allowed" }}><Lock size={13} /> Hidden</button>}
        {info.canRetake && <button onClick={onRetake} style={primaryBtn("#6366f1","#4f46e5","0 2px 10px rgba(99,102,241,0.25)")}><RefreshCcw size={13} /> Retake</button>}
      </div>
    );
    const disabled = isLocked || isExpired;
    return (
      <button onClick={disabled ? undefined : onStart} disabled={disabled}
        style={disabled ? { ...primaryBtn("#475569","#334155","none"), cursor:"not-allowed", opacity:0.5 } : primaryBtn("#10b981","#059669","0 4px 14px rgba(16,185,129,0.35)")}>
        <PlayCircle size={14} /> Start Assessment <ArrowRight size={13} />
      </button>
    );
  };

  return (
    <div
      style={{
        background: "linear-gradient(160deg,#161922 0%,#11131a 100%)",
        border: `1.5px solid ${isClosingSoon ? "rgba(239,68,68,0.5)" : cfg.cardBorder}`,
        borderRadius: 18, padding: 22,
        display: "flex", flexDirection: "column", gap: 14,
        boxShadow: isClosingSoon ? "0 0 0 1px rgba(239,68,68,0.15),0 8px 30px rgba(239,68,68,0.08)" : "0 6px 24px rgba(0,0,0,0.3)",
        transition: "all 0.2s ease", position: "relative", overflow: "hidden",
        opacity: isExpired && !isCompleted ? 0.65 : 1,
        animation: isClosingSoon ? "pulse-border 2s ease infinite" : "none",
      }}
      onMouseEnter={(e) => { if(!isExpired) { e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow="0 12px 36px rgba(0,0,0,0.4)"; }}}
      onMouseLeave={(e) => { e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow=isClosingSoon?"0 0 0 1px rgba(239,68,68,0.15),0 8px 30px rgba(239,68,68,0.08)":"0 6px 24px rgba(0,0,0,0.3)"; }}
    >
      {/* Top accent line */}
      <div style={{ position:"absolute",top:0,left:0,right:0,height:2,background:topAccent,borderRadius:"18px 18px 0 0" }} />

      {/* Row 1: time badge + attempt status */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:6 }}>
        <TimeStateBadge startTime={item.startTime} endTime={item.endTime} />
        <div style={{ display:"flex",gap:6,alignItems:"center" }}>
          <span style={{
            padding:"3px 8px",borderRadius:6,fontSize:10,fontWeight:700,display:"flex",alignItems:"center",gap:3,
            background:isAnalyticsEnabled?"rgba(99,102,241,0.12)":"rgba(255,255,255,0.04)",
            border:`1px solid ${isAnalyticsEnabled?"rgba(99,102,241,0.25)":"rgba(255,255,255,0.08)"}`,
            color:isAnalyticsEnabled?"#818cf8":"#475569",
          }}>
            {isAnalyticsEnabled ? <BarChart2 size={10} /> : <Lock size={10} />}
            {isAnalyticsEnabled ? "Analytics On" : "Analytics Off"}
          </span>
          {info.status !== "NOT_STARTED" && <AttemptStatusBadge status={info.status} size="sm" />}
        </div>
      </div>

      {/* Title & Description */}
      <div>
        <h3 style={{ margin:"0 0 5px",fontSize:16,fontWeight:800,color:"#f8fafc",lineHeight:1.4 }}>{item.title}</h3>
        <p style={{ margin:0,fontSize:12,color:"#64748b",lineHeight:1.55,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden" }}>
          {item.description || "Timed evaluation covering algorithm design and problem-solving skills."}
        </p>
      </div>

      {/* Metrics */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:"8px 12px",background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:10,padding:"12px 14px" }}>
        <MetricCell icon={<Clock size={12} />} iconBg="rgba(59,130,246,0.15)" iconColor="#60a5fa" label="Duration" value={`${item.durationMinutes} min`} />
        <MetricCell icon={<Award size={12} />} iconBg="rgba(245,158,11,0.15)" iconColor="#fbbf24" label="Weightage" value={`${item.totalMarks} Marks`} />
        <MetricCell icon={<RotateCcw size={12} />} iconBg="rgba(168,85,247,0.15)" iconColor="#c084fc" label="Attempts"
          value={info.canRetake && used >= configuredMax ? `${used} Used · Retake Granted` : `${used} / ${configuredMax} Used`} />
        <MetricCell icon={<Shield size={12} />} iconBg="rgba(16,185,129,0.15)" iconColor="#34d399" label="Proctoring" value="Anti-Cheat On" />
      </div>

      {/* Scheduling Window */}
      {(item.startTime || item.endTime) && (
        <div style={{ display:"flex",flexDirection:"column",gap:5 }}>
          {item.startTime && (
            <div style={{ display:"flex",alignItems:"center",gap:6,fontSize:11,color:"#64748b" }}>
              <CalendarClock size={12} style={{ color:"#6366f1" }} />
              Opens: <strong style={{ color:"#a5b4fc" }}>{fmtDate(item.startTime)}</strong>
            </div>
          )}
          {item.endTime && (
            <div style={{ display:"flex",alignItems:"center",gap:6,fontSize:11,color:"#64748b" }}>
              <CalendarX2 size={12} style={{ color:isClosingSoon?"#ef4444":"#94a3b8" }} />
              Closes: <strong style={{ color:isClosingSoon?"#f87171":"#94a3b8" }}>{fmtDate(item.endTime)}</strong>
            </div>
          )}
          {ts.windowPct > 0 && ts.windowPct < 100 && (
            <div style={{ height:3,background:"rgba(255,255,255,0.06)",borderRadius:3,overflow:"hidden",marginTop:2 }}>
              <div style={{ height:"100%",width:`${ts.windowPct}%`,background:isClosingSoon?"linear-gradient(90deg,#ef4444,#f97316)":"linear-gradient(90deg,#6366f1,#10b981)",borderRadius:3,transition:"width 1s linear" }} />
            </div>
          )}
        </div>
      )}

      {/* Score when completed */}
      {isCompleted && info.score != null && (
        <div style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"rgba(16,185,129,0.07)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:10 }}>
          <CheckCircle2 size={16} style={{ color:"#10b981",flexShrink:0 }} />
          <div>
            <div style={{ fontSize:11,color:"#64748b",fontWeight:600 }}>Score Achieved</div>
            <div style={{ fontSize:16,fontWeight:800,color:"#34d399" }}>
              {info.score} / {info.totalMarks ?? item.totalMarks}
              {info.percentage != null && <span style={{ fontSize:12,fontWeight:600,color:"#10b981",marginLeft:8 }}>({Math.round(info.percentage)}%)</span>}
            </div>
          </div>
        </div>
      )}

      {/* Attempt progress bar */}
      {used > 0 && (
        <div>
          <div style={{ display:"flex",justifyContent:"space-between",fontSize:10,marginBottom:4,color:"#64748b",fontWeight:600 }}>
            <span style={{ textTransform:"uppercase",letterSpacing:"0.05em" }}>Attempt Usage</span>
            <span style={{ color:used>=configuredMax&&!info.canRetake?"#ef4444":"#10b981" }}>{used}/{configuredMax}</span>
          </div>
          <div style={{ height:3,background:"rgba(255,255,255,0.06)",borderRadius:3,overflow:"hidden" }}>
            <div style={{ height:"100%",width:`${attemptsPct}%`,background:isInProgress?"#6366f1":info.canRetake?"#10b981":used>=configuredMax?"#ef4444":"#10b981",borderRadius:3,transition:"width 0.5s ease" }} />
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ borderTop:"1px solid rgba(255,255,255,0.07)",paddingTop:12,marginTop:"auto",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <div style={{ fontSize:11,color:"#475569",fontWeight:600 }}>
          {isLocked && <span style={{ color:"#6366f1" }}>⏳ Scheduled</span>}
          {isClosingSoon && <span style={{ color:"#ef4444" }}>🔴 Closing soon!</span>}
          {isExpired && !isCompleted && <span>📅 Window closed</span>}
          {isInProgress && <span style={{ color:"#818cf8" }}>● Active session</span>}
          {isCompleted && <span style={{ color:"#34d399" }}>✓ Evaluation saved</span>}
          {!isLocked && !isExpired && !isInProgress && !isCompleted && isClosingSoon === false && <span>Timed · Proctored</span>}
        </div>
        {renderAction()}
      </div>
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────────────────── */
export const AssessmentListPage = () => {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [attemptMap, setAttemptMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchAssessments = async () => {
    setLoading(true); setError(null);
    try {
      const res = await assessmentService.list();
      const items = res?.content ?? res?.data?.data?.content ?? res?.data?.content ?? (Array.isArray(res) ? res : []);
      setAssessments(items);
      const results = await Promise.allSettled(items.map((a) =>
        assessmentService.getAttemptHistory(a.id).then((r) => ({ assessmentId: a.id, history: Array.isArray(r) ? r : (r?.data?.data ?? r?.data ?? []) }))
      ));
      const map = {};
      results.forEach((r) => {
        if (r.status === "fulfilled") {
          const { assessmentId, history } = r.value;
          const arr = Array.isArray(history) ? history : (history?.content ?? []);
          if (arr.length > 0) {
            const latest = [...arr].sort((a,b)=>b.attemptNumber-a.attemptNumber)[0];
            map[assessmentId] = { status:latest.status, attemptNumber:latest.attemptNumber, attemptsUsed:arr.length, attemptId:latest.attemptId||latest.id, score:latest.score??latest.obtainedMarks, totalMarks:latest.totalMarks, percentage:latest.percentage, extraAttempts:latest.extraAttempts??0, canRetake:latest.canRetake??false, showResultAnalytics:latest.showResultAnalytics };
          } else {
            map[assessmentId] = { status:"NOT_STARTED", attemptsUsed:0, extraAttempts:0, canRetake:true };
          }
        }
      });
      setAttemptMap(map);
    } catch (err) {
      setError(err?.message || "Failed to load assessments");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAssessments(); }, []);

  const getInfo = (id) => attemptMap[id] ?? { status:"NOT_STARTED", attemptsUsed:0, canRetake:true };
  const total = assessments.length;
  const inProg = assessments.filter((a) => getInfo(a.id).status === ATTEMPT_STATUS.IN_PROGRESS).length;
  const done = assessments.filter((a) => [ATTEMPT_STATUS.SUBMITTED,ATTEMPT_STATUS.TIMED_OUT,ATTEMPT_STATUS.EVALUATED,ATTEMPT_STATUS.EXPIRED].includes(getInfo(a.id).status)).length;
  const pending = total - inProg - done;

  const FILTERS = [
    { value:"ALL", label:"All", count:total },
    { value:"NOT_STARTED", label:"Pending", count:pending },
    { value:ATTEMPT_STATUS.IN_PROGRESS, label:"In Progress", count:inProg },
    { value:ATTEMPT_STATUS.SUBMITTED, label:"Completed", count:done },
  ];

  const filtered = assessments.filter((a) => {
    const m = a.title?.toLowerCase().includes(search.toLowerCase()) || a.description?.toLowerCase().includes(search.toLowerCase());
    if (!m) return false;
    if (statusFilter === "ALL") return true;
    const s = getInfo(a.id).status;
    if (statusFilter === ATTEMPT_STATUS.SUBMITTED) return [ATTEMPT_STATUS.SUBMITTED,ATTEMPT_STATUS.TIMED_OUT,ATTEMPT_STATUS.EVALUATED,ATTEMPT_STATUS.EXPIRED].includes(s);
    return s === statusFilter;
  });

  return (
    <PageContainer title="My Assessments" subtitle="Timed evaluations and coding challenges assigned to you."
      actions={
        <button onClick={fetchAssessments} style={{ display:"inline-flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:99,border:"1px solid rgba(255,255,255,0.12)",background:"rgba(255,255,255,0.06)",color:"#f8fafc",fontSize:12,fontWeight:600,cursor:"pointer" }}>
          <RefreshCcw size={13} /> Refresh
        </button>
      }
    >
      {/* KPI Stats */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:12,marginBottom:24 }}>
        {[
          { label:"Total Assigned",value:total,      icon:<BookOpen size={18} />,   color:"#818cf8",bg:"rgba(99,102,241,0.1)",  border:"rgba(99,102,241,0.2)" },
          { label:"In Progress",   value:inProg,     icon:<Hourglass size={18} />,  color:"#fbbf24",bg:"rgba(245,158,11,0.1)", border:"rgba(245,158,11,0.2)" },
          { label:"Completed",     value:done,       icon:<CheckCircle2 size={18}/>, color:"#34d399",bg:"rgba(16,185,129,0.1)", border:"rgba(16,185,129,0.2)" },
          { label:"Pending",       value:pending,    icon:<Timer size={18} />,       color:"#60a5fa",bg:"rgba(59,130,246,0.1)", border:"rgba(59,130,246,0.2)" },
        ].map(({label,value,icon,color,bg,border}) => (
          <div key={label} style={{ background:bg,border:`1px solid ${border}`,borderRadius:14,padding:"14px 18px",display:"flex",alignItems:"center",gap:12 }}>
            <div style={{ width:38,height:38,borderRadius:10,background:"rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"center",color }}>{icon}</div>
            <div>
              <div style={{ fontSize:11,color:"#64748b",fontWeight:600 }}>{label}</div>
              <div style={{ fontSize:22,fontWeight:800,color }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div style={{ display:"flex",flexWrap:"wrap",gap:10,marginBottom:24,alignItems:"center",justifyContent:"space-between" }}>
        <div style={{ position:"relative",flex:1,minWidth:240,maxWidth:400 }}>
          <Search size={14} style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#475569" }} />
          <input type="text" placeholder="Search assessments…" value={search} onChange={(e)=>setSearch(e.target.value)}
            onFocus={(e)=>{ e.target.style.borderColor="#6366f1"; }}
            onBlur={(e)=>{ e.target.style.borderColor="rgba(255,255,255,0.1)"; }}
            style={{ width:"100%",padding:"9px 14px 9px 36px",borderRadius:10,border:"1px solid rgba(255,255,255,0.1)",background:"rgba(0,0,0,0.3)",color:"#f8fafc",fontSize:13,outline:"none",boxSizing:"border-box",transition:"border-color 0.2s" }} />
        </div>
        <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
          {FILTERS.map(({value,label,count}) => {
            const active = statusFilter === value;
            return (
              <button key={value} onClick={()=>setStatusFilter(value)} style={{ padding:"7px 14px",borderRadius:99,fontSize:12,fontWeight:active?700:600,cursor:"pointer",background:active?"linear-gradient(135deg,#6366f1 0%,#4f46e5 100%)":"rgba(255,255,255,0.04)",color:active?"#fff":"#94a3b8",border:active?"1px solid transparent":"1px solid rgba(255,255,255,0.08)",boxShadow:active?"0 2px 12px rgba(99,102,241,0.35)":"none",transition:"all 0.2s ease" }}>
                {label} <span style={{ opacity:0.8,fontSize:11 }}>({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cards */}
      {loading ? <Spinner fullPage={false} />
        : error ? <Alert tone="error">{error}</Alert>
        : filtered.length === 0 ? <EmptyState title="No assessments found" description="No published assessments match your current filter." />
        : (
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(360px,1fr))",gap:20 }}>
            {filtered.map((item) => {
              const info = getInfo(item.id);
              return (
                <AssessmentCard key={item.id} item={item} info={info}
                  onStart={() => navigate(ROUTES.ASSESSMENT_ATTEMPT(item.id))}
                  onResume={() => navigate(ROUTES.ASSESSMENT_ATTEMPT(item.id))}
                  onResult={() => navigate(ROUTES.ASSESSMENT_RESULT(info.attemptId))}
                  onRetake={() => navigate(ROUTES.ASSESSMENT_ATTEMPT(item.id))}
                />
              );
            })}
          </div>
        )
      }

      <style>{`
        @keyframes pulse-badge { 0%,100%{opacity:1} 50%{opacity:0.7} }
        @keyframes pulse-border { 0%,100%{box-shadow:0 0 0 1px rgba(239,68,68,0.15),0 8px 30px rgba(239,68,68,0.08)} 50%{box-shadow:0 0 0 2px rgba(239,68,68,0.35),0 8px 30px rgba(239,68,68,0.18)} }
      `}</style>
    </PageContainer>
  );
};

export default AssessmentListPage;
