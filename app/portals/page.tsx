import Link from "next/link";
import { ArrowRight, GraduationCap, ShieldCheck, Users } from "lucide-react";
import "../components/portal.css";

const panels = [
  {title:"Student Panel",description:"Courses, notes, video lessons, practice tests and your learning progress.",href:"/student",icon:GraduationCap,tone:"student",tag:"For learners"},
  {title:"Teacher Panel",description:"Manage courses, organise chapters, upload resources and support students.",href:"/teacher",icon:Users,tone:"teacher",tag:"For educators"},
  {title:"Admin Panel",description:"Oversee users, verify teachers, review content and manage the platform.",href:"/admin",icon:ShieldCheck,tone:"admin",tag:"Platform control"}
];

export default function PortalsPage(){
 return <main className="portal-picker">
  <header className="picker-header"><Link href="/" className="portal-brand"><span className="portal-brand-icon"><GraduationCap size={22}/></span><span>AJEDU<span>VERSE</span><small>LEARN · GROW · SUCCEED</small></span></Link><span className="preview-pill">Workspace preview</span></header>
  <section className="picker-content"><div className="portal-kicker">ONE LEARNING UNIVERSE · THREE WORKSPACES</div><h1>Choose your <span>workspace.</span></h1><p className="picker-intro">A simple space for every role. Select the panel that matches what you do at AJEDUVERSE.</p>
   <div className="picker-grid">{panels.map((panel)=>{const Icon=panel.icon;return <article className={"picker-card "+panel.tone} key={panel.href}><div className="picker-card-top"><span className="picker-icon"><Icon size={24}/></span><span className="picker-tag">{panel.tag}</span></div><h2>{panel.title}</h2><p>{panel.description}</p><Link href={panel.href}>Open workspace <ArrowRight size={16}/></Link></article>})}</div>
   <div className="picker-footnote">These are front-end dashboard previews. Secure sign-in, verified roles and live data will be connected in the next development phase.</div>
   <Link href="/" className="picker-back">← Back to homepage</Link>
  </section>
 </main>;
}
