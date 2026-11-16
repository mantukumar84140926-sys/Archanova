"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight, BookOpen, GraduationCap, Search, Sparkles, Brain,
  ClipboardCheck, Trophy, PlayCircle, Languages, Menu, X, BookMarked,
  Target, Zap, ChevronRight
} from "lucide-react";

const categories = ["All", "School", "College", "Competitive Exams"] as const;

const resources = [
  { title: "Class 10 Learning Hub", type: "School", detail: "Chapter-wise notes, lessons and practice", tag: "Coming soon", icon: BookOpen },
  { title: "Class 12 Learning Hub", type: "School", detail: "Board preparation made simpler", tag: "Coming soon", icon: GraduationCap },
  { title: "College Study Corner", type: "College", detail: "Study material for college learners", tag: "Coming soon", icon: BookMarked },
  { title: "Competitive Exam Prep", type: "Competitive Exams", detail: "Build concepts and practice daily", tag: "Coming soon", icon: Target },
  { title: "Daily MCQ Practice", type: "All", detail: "Test your knowledge one question at a time", tag: "Coming soon", icon: ClipboardCheck },
  { title: "Video Lessons", type: "All", detail: "Learn difficult topics with simple explainers", tag: "Coming soon", icon: PlayCircle }
];

const features = [
  { icon: BookOpen, title: "Notes & PDFs", text: "Organised study material, topic by topic." },
  { icon: PlayCircle, title: "Video lessons", text: "Understand concepts with clear explanations." },
  { icon: Brain, title: "AI doubt helper", text: "Get help when a topic feels confusing." },
  { icon: ClipboardCheck, title: "MCQ & mock tests", text: "Practise, check answers and improve." },
  { icon: Trophy, title: "Progress & leaderboard", text: "Track your learning milestones." },
  { icon: Languages, title: "Hindi + English", text: "Learn in the language that works for you." }
];

export default function Home() {
  const [active, setActive] = useState<(typeof categories)[number]>("All");
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const visibleResources = useMemo(() => resources.filter((item) => {
    const matchesCategory = active === "All" || item.type === active || item.type === "All";
    const matchesQuery = (item.title + " " + item.detail).toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesQuery;
  }), [active, query]);

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#" aria-label="AJEDUVERSE home">
          <span className="brand-mark"><GraduationCap size={23} /></span>
          <span>AJEDU<span className="brand-accent">VERSE</span><small>LEARN · GROW · SUCCEED</small></span>
        </a>
        <nav className={menuOpen ? "nav-links open" : "nav-links"}>
          <a href="#explore" onClick={() => setMenuOpen(false)}>Explore</a>
          <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
          <a href="#about" onClick={() => setMenuOpen(false)}>About</a>
        </nav>
        <a className="header-cta" href="#explore">Start learning <ArrowRight size={16} /></a>
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">{menuOpen ? <X /> : <Menu />}</button>
      </header>

      <section className="hero">
        <div className="hero-glow glow-one" /><div className="hero-glow glow-two" />
        <div className="hero-content">
          <div className="eyebrow"><Sparkles size={15} /> YOUR LEARNING JOURNEY STARTS HERE</div>
          <h1>Big dreams need<br /><span>the right learning</span> universe.</h1>
          <p className="hero-copy">One place for school, college and competitive exam preparation. Learn at your pace, in Hindi or English — completely free.</p>
          <div className="hero-actions">
            <a className="button-primary" href="#explore">Explore learning <ArrowRight size={18} /></a>
            <a className="button-secondary" href="#features"><PlayCircle size={18} /> Discover features</a>
          </div>
          <div className="hero-proof"><span className="proof-icon"><Zap size={16} /></span><span><strong>100% free learning</strong><small>No paid courses. Just keep growing.</small></span></div>
        </div>
        <div className="hero-art" aria-label="Learning illustration">
          <div className="orbit orbit-a" /><div className="orbit orbit-b" />
          <div className="float-card card-top"><span className="float-icon purple"><Brain size={20} /></span><span><b>Learn smarter</b><small>One step at a time</small></span></div>
          <div className="book-stack"><div className="book book-back"><span>GROW</span></div><div className="book book-mid"><span>LEARN</span></div><div className="book book-front"><GraduationCap size={54} /><b>YOUR<br />FUTURE</b></div><div className="book-shadow" /></div>
          <div className="float-card card-bottom"><span className="float-icon orange"><Trophy size={20} /></span><span><b>Every goal counts</b><small>Celebrate your progress</small></span></div>
          <div className="sparkle sparkle-a">✦</div><div className="sparkle sparkle-b">✧</div>
        </div>
        <div className="hero-bottom"><span>FOR EVERY LEARNER</span><div><span>School</span><i /> <span>College</span><i /> <span>Competitive exams</span></div></div>
      </section>

      <section className="explore-section section-wrap" id="explore">
        <div className="section-heading">
          <div><div className="eyebrow dark"><span className="eyebrow-dot" /> FIND YOUR NEXT STEP</div><h2>What do you want to <span>learn?</span></h2><p>Pick your path. We’ll help you move forward.</p></div>
          <div className="search-box"><Search size={19} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search classes, subjects..." aria-label="Search learning resources" /></div>
        </div>
        <div className="filter-row">{categories.map((category) => <button key={category} className={active === category ? "filter active" : "filter"} onClick={() => setActive(category)}>{category}</button>)}</div>
        <div className="resource-grid">
          {visibleResources.map((item) => { const Icon = item.icon; return <article className="resource-card" key={item.title}><div className="resource-icon"><Icon size={23} /></div><span className="coming-tag">{item.tag}</span><h3>{item.title}</h3><p>{item.detail}</p><a href="#join" className="text-link">Explore path <ChevronRight size={16} /></a></article>; })}
          {visibleResources.length === 0 && <div className="empty-state">No matching learning paths yet. Try another search.</div>}
        </div>
      </section>

      <section className="features-section" id="features"><div className="section-wrap">
        <div className="center-heading"><div className="eyebrow dark"><span className="eyebrow-dot" /> EVERYTHING IN ONE PLACE</div><h2>More than lessons.<br /><span>A better way to learn.</span></h2><p>Useful tools to help you understand, practise and keep improving.</p></div>
        <div className="feature-grid">{features.map((feature) => { const Icon = feature.icon; return <div className="feature-item" key={feature.title}><div className="feature-icon"><Icon size={22} /></div><h3>{feature.title}</h3><p>{feature.text}</p></div>; })}</div>
      </div></section>

      <section className="join-section section-wrap" id="join"><div className="join-card"><div className="join-orb" /><div className="join-copy"><div className="eyebrow"><Sparkles size={15} /> YOUR FUTURE IS WORTH IT</div><h2>Start small.<br /><span>Dream big.</span></h2><p>Great learning should be accessible to everyone. AJEDUVERSE is being built to make that possible.</p><a href="#explore" className="button-light">Explore learning <ArrowRight size={17} /></a></div><div className="join-stamp"><GraduationCap size={55} /><strong>LEARN<br />WITHOUT<br />LIMITS</strong><span>AJEDUVERSE</span></div></div></section>

      <footer id="about"><div className="footer-inner"><a className="brand footer-brand" href="#"><span className="brand-mark"><GraduationCap size={22} /></span><span>AJEDU<span className="brand-accent">VERSE</span><small>A UNIVERSE OF FREE LEARNING</small></span></a><p>Made for curious minds and big dreams. ✨</p><span className="copyright">© {new Date().getFullYear()} AJEDUVERSE. All rights reserved.</span></div></footer>
    </main>
  );
}