import Link from "next/link";
import {
  Activity, ArrowRight, Bell, BookOpen, Brain, CalendarDays, CheckCircle2,
  ClipboardList, FileText, GraduationCap, LayoutDashboard, MessageCircle,
  Plus, ShieldCheck, Sparkles, Target, Trophy, Users, Video
} from "lucide-react";
import "./portal.css";

type Role = "student" | "teacher" | "admin";

const config = {
  student: {
    label: "Student workspace", title: "Welcome back, learner!", subtitle: "Your next step starts here. Pick up where you left off.",
    icon: GraduationCap, accent: "blue",
    stats: [{label:"Courses enrolled",value:"04",note:"Your learning paths",icon:BookOpen},{label:"Lessons completed",value:"18",note:"Keep your momentum",icon:CheckCircle2},{label:"Practice score",value:"82%",note:"Across recent quizzes",icon:Target},{label:"Learning streak",value:"05 days",note:"You’re building a habit",icon:Trophy}],
    section:"Continue learning", sectionNote:"A little progress every day adds up.",
    items:[{title:"Build strong foundations",meta:"Mathematics · Chapter 3",progress:68,icon:BookOpen},{title:"Understand the world",meta:"Science · Chapter 2",progress:42,icon:Brain},{title:"Practice your knowledge",meta:"General practice · 20 questions",progress:25,icon:ClipboardList}],
    sideTitle:"Your next goals", tasks:["Finish one lesson today","Try a 10-question practice set","Review your saved notes"],
    notice:"Your learning space is ready. Course progress and results will connect to your account when authentication and the learning database are enabled."
  },
  teacher: {
    label: "Teacher workspace", title: "Good to see you, teacher!", subtitle: "Create clear lessons, support learners and track course activity.",
    icon:GraduationCap, accent:"green",
    stats:[{label:"My courses",value:"06",note:"Courses you manage",icon:BookOpen},{label:"Learners",value:"248",note:"Across your courses",icon:Users},{label:"Study resources",value:"32",note:"Lessons and notes",icon:FileText},{label:"Pending reviews",value:"03",note:"Items to check",icon:ClipboardList}],
    section:"Your teaching workspace",sectionNote:"Quick access to the tools you use most.",
    items:[{title:"Manage courses",meta:"Create, edit and organise learning paths",progress:100,icon:BookOpen},{title:"Upload lesson materials",meta:"Video links, notes and PDFs",progress:100,icon:Video},{title:"Build a practice test",meta:"Question bank and quiz builder",progress:100,icon:ClipboardList}],
    sideTitle:"Teaching checklist",tasks:["Review course content before publishing","Add a short lesson summary","Respond to learner questions"],
    notice:"Teacher approval and publishing permissions will be enforced through the secure backend before real course management goes live."
  },
  admin: {
    label:"Administration",title:"Platform overview",subtitle:"A clear view of the learning community and the content it uses.",
    icon:ShieldCheck,accent:"violet",
    stats:[{label:"Registered learners",value:"1,284",note:"Illustrative dashboard data",icon:Users},{label:"Teachers",value:"42",note:"Illustrative dashboard data",icon:GraduationCap},{label:"Published courses",value:"86",note:"Illustrative dashboard data",icon:BookOpen},{label:"Items to review",value:"12",note:"Illustrative dashboard data",icon:ClipboardList}],
    section:"Platform management",sectionNote:"Core areas for keeping AJEDUVERSE organised and safe.",
    items:[{title:"Review teacher applications",meta:"Verify teacher details and permissions",progress:100,icon:Users},{title:"Approve learning content",meta:"Courses, notes and video lessons",progress:100,icon:FileText},{title:"Monitor platform activity",meta:"Reports, feedback and audit history",progress:100,icon:Activity}],
    sideTitle:"Admin priorities",tasks:["Check new teacher applications","Review reported content","Check platform health and activity"],
    notice:"Admin metrics shown here are sample placeholders, not live user or platform statistics. Real access will require server-verified admin permissions."
  }
} as const;

const nav = [
  {label:"Overview",href:"#overview",icon:LayoutDashboard},
  {label:"Courses & content",href:"#workspace",icon:BookOpen},
  {label:"Tests & activity",href:"#workspace",icon:ClipboardList},
  {label:"Messages & updates",href:"#updates",icon:MessageCircle}
];

export default function PortalDashboard({role}:{role:Role}) {
  const data = config[role];
  const Icon = data.icon;
  return <main className="portal-page" id="overview">
    <aside className="portal-sidebar">
      <Link className="portal-brand" href="/"><span className="portal-brand-icon"><GraduationCap size={22}/></span><span>AJEDU<span>VERSE</span><small>LEARN · GROW · SUCCEED</small></span></Link>
      <div className="portal-side-label">{data.label}</div>
      <nav className="portal-nav">{nav.map((item,i)=>{const NavIcon=item.icon;return <a className={i===0?"selected":""} href={item.href} key={item.label}><NavIcon size={17}/>{item.label}</a>})}</nav>
      <div className="portal-sidebar-bottom"><div className="help-card"><Sparkles size={18}/><strong>Keep growing</strong><p>Small steps create big progress.</p></div><Link href="/" className="back-home">← Back to AJEDUVERSE</Link></div>
    </aside>
    <section className="portal-main">
      <header className="portal-topbar"><div className="portal-breadcrumb">AJEDUVERSE <span>/</span> {data.label}</div><div className="portal-top-actions"><span className="preview-pill">Preview workspace</span><button aria-label="Notifications" className="icon-button"><Bell size={18}/></button><div className="avatar"><Icon size={18}/></div></div></header>
      <div className="portal-content">
        <div className="portal-welcome"><div><div className="portal-kicker">{data.label}</div><h1>{data.title}</h1><p>{data.subtitle}</p></div><div className="welcome-date"><CalendarDays size={16}/> Your learning universe</div></div>
        <div className="portal-stats">{data.stats.map((stat)=>{const StatIcon=stat.icon;return <article className="portal-stat" key={stat.label}><div className="stat-top"><span>{stat.label}</span><span className="stat-icon"><StatIcon size={18}/></span></div><strong>{stat.value}</strong><small>{stat.note}</small></article>})}</div>
        <div className="portal-columns" id="workspace">
          <section className="portal-panel"><div className="panel-heading"><div><h2>{data.section}</h2><p>{data.sectionNote}</p></div><button className="subtle-button">View all <ArrowRight size={15}/></button></div>
            <div className="portal-item-list">{data.items.map((item)=>{const ItemIcon=item.icon;return <article className="portal-item" key={item.title}><div className="item-icon"><ItemIcon size={19}/></div><div className="item-copy"><strong>{item.title}</strong><span>{item.meta}</span><div className="progress-track"><i style={{width:item.progress+"%"}}/></div></div><ArrowRight className="item-arrow" size={17}/></article>})}</div>
          </section>
          <aside className="portal-panel goals-panel"><div className="panel-heading"><div><h2>{data.sideTitle}</h2><p>Suggested next actions</p></div><Target size={19}/></div><ul className="goal-list">{data.tasks.map((task)=><li key={task}><span><CheckCircle2 size={16}/></span>{task}</li>)}</ul><div className="weekly-card"><div className="weekly-icon"><Sparkles size={18}/></div><div><strong>Learn at your pace</strong><p>There’s no race. Keep showing up.</p></div></div></aside>
        </div>
        <div className="portal-notice" id="updates"><span><Bell size={18}/></span><div><strong>Platform preview</strong><p>{data.notice}</p></div></div>
        <footer className="portal-footer">© {new Date().getFullYear()} AJEDUVERSE <span>LEARN · GROW · SUCCEED</span></footer>
      </div>
    </section>
  </main>;
}
