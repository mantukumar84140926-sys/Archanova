"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, GraduationCap, RotateCcw, Sparkles } from "lucide-react";

type Language = "en" | "hi";

const questions = [
  {
    en: "Which planet is known as the Red Planet?",
    hi: "किस ग्रह को लाल ग्रह कहा जाता है?",
    options: { en: ["Venus", "Mars", "Jupiter", "Mercury"], hi: ["शुक्र", "मंगल", "बृहस्पति", "बुध"] },
    answer: 1,
    explain: { en: "Mars looks reddish because iron minerals in its soil have rusted.", hi: "मंगल की मिट्टी में मौजूद लौह खनिजों के जंग जैसा होने से यह लाल दिखाई देता है।" }
  },
  {
    en: "What is 12 × 8?",
    hi: "12 × 8 कितना होता है?",
    options: { en: ["84", "88", "96", "108"], hi: ["84", "88", "96", "108"] },
    answer: 2,
    explain: { en: "12 groups of 8 make 96.", hi: "12 के 8 समूहों का योग 96 होता है।" }
  },
  {
    en: "What is the capital of Bihar?",
    hi: "बिहार की राजधानी क्या है?",
    options: { en: ["Gaya", "Muzaffarpur", "Bhagalpur", "Patna"], hi: ["गया", "मुजफ्फरपुर", "भागलपुर", "पटना"] },
    answer: 3,
    explain: { en: "Patna is the capital city of Bihar.", hi: "पटना बिहार की राजधानी है।" }
  },
  {
    en: "Which gas do green plants mainly absorb for photosynthesis?",
    hi: "प्रकाश संश्लेषण के लिए हरे पौधे मुख्य रूप से कौन-सी गैस लेते हैं?",
    options: { en: ["Oxygen", "Carbon dioxide", "Nitrogen", "Hydrogen"], hi: ["ऑक्सीजन", "कार्बन डाइऑक्साइड", "नाइट्रोजन", "हाइड्रोजन"] },
    answer: 1,
    explain: { en: "Plants use carbon dioxide and water to make food with sunlight.", hi: "पौधे सूर्य के प्रकाश की मदद से कार्बन डाइऑक्साइड और पानी से भोजन बनाते हैं।" }
  },
  {
    en: "When did the Constitution of India come into effect?",
    hi: "भारत का संविधान कब लागू हुआ?",
    options: { en: ["15 August 1947", "26 November 1949", "26 January 1950", "2 October 1950"], hi: ["15 अगस्त 1947", "26 नवंबर 1949", "26 जनवरी 1950", "2 अक्टूबर 1950"] },
    answer: 2,
    explain: { en: "The Constitution came into effect on 26 January 1950; we celebrate this as Republic Day.", hi: "संविधान 26 जनवरी 1950 को लागू हुआ; इसी दिन गणतंत्र दिवस मनाया जाता है।" }
  }
];

export default function PracticePage() {
  const [language, setLanguage] = useState<Language>("hi");
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const [finished, setFinished] = useState(false);

  const question = questions[current];
  const score = answers.reduce((total, answer, index) => total + (answer === questions[index].answer ? 1 : 0), 0);
  const copy = {
    en: {
      back: "Back to home", label: "FREE SAMPLE PRACTICE", title: "A little practice goes a long way.", subtitle: "Try this 5-question starter quiz. Switch languages whenever you like.",
      progress: "Question", of: "of", check: "Check answer", next: "Next question", finish: "See my result", correct: "Correct answer!", incorrect: "Not quite — keep learning!", explanation: "Why?", result: "Your practice result", outOf: "out of 5 correct", retry: "Try again", home: "Back to AJEDUVERSE",
      note: "Sample quiz · No sign-in · Your answers are not saved"
    },
    hi: {
      back: "होम पर वापस", label: "मुफ्त सैंपल प्रैक्टिस", title: "थोड़ा अभ्यास, बड़ी प्रगति।", subtitle: "5 सवालों का यह छोटा क्विज़ हल करें। भाषा कभी भी बदल सकते हैं।",
      progress: "प्रश्न", of: "में से", check: "उत्तर जाँचें", next: "अगला प्रश्न", finish: "मेरा परिणाम देखें", correct: "बिल्कुल सही!", incorrect: "सही नहीं है — सीखते रहिए!", explanation: "समझें", result: "आपका अभ्यास परिणाम", outOf: "में से सही", retry: "फिर से प्रयास करें", home: "AJEDUVERSE पर वापस",
      note: "सैंपल क्विज़ · लॉगिन की जरूरत नहीं · जवाब सेव नहीं होते"
    }
  }[language];

  function checkAnswer() {
    if (selected === null) return;
    setAnswers((previous) => [...previous.slice(0, current), selected]);
    setChecked(true);
  }

  function goNext() {
    if (current === questions.length - 1) {
      setFinished(true);
      return;
    }
    setCurrent((previous) => previous + 1);
    setSelected(null);
    setChecked(false);
  }

  function restart() {
    setCurrent(0);
    setSelected(null);
    setAnswers([]);
    setChecked(false);
    setFinished(false);
  }

  return (
    <main className="practice-page">
      <header className="practice-header">
        <Link className="practice-brand" href="/">
          <span className="practice-brand-mark"><GraduationCap size={22} /></span>
          <span>AJEDU<span>VERSE</span></span>
        </Link>
        <div className="practice-header-actions">
          <button className="practice-language" onClick={() => setLanguage(language === "hi" ? "en" : "hi")} aria-label="Switch language">
            {language === "hi" ? "English" : "हिन्दी"}
          </button>
          <Link className="practice-back" href="/"><ArrowLeft size={16} /> {copy.back}</Link>
        </div>
      </header>

      <section className="practice-main">
        <div className="practice-intro">
          <div className="practice-eyebrow"><Sparkles size={14} /> {copy.label}</div>
          <h1>{copy.title}</h1>
          <p>{copy.subtitle}</p>
        </div>

        {!finished ? (
          <section className="quiz-card" aria-label="Sample quiz">
            <div className="quiz-topline">
              <span>{copy.progress} {current + 1} {copy.of} {questions.length}</span>
              <span>{Math.round(((current + 1) / questions.length) * 100)}%</span>
            </div>
            <div className="quiz-progress"><span style={{ width: `${((current + 1) / questions.length) * 100}%` }} /></div>
            <h2>{question[language]}</h2>
            <div className="quiz-options">
              {question.options[language].map((option, index) => {
                const isCorrect = index === question.answer;
                const isSelected = selected === index;
                const stateClass = checked && isCorrect ? " correct" : checked && isSelected ? " incorrect" : isSelected ? " selected" : "";
                return (
                  <button
                    className={`quiz-option${stateClass}`}
                    key={option}
                    onClick={() => !checked && setSelected(index)}
                    disabled={checked}
                    aria-pressed={isSelected}
                  >
                    <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                    <span>{option}</span>
                    {checked && isCorrect && <CheckCircle2 size={19} />}
                  </button>
                );
              })}
            </div>

            {checked && (
              <div className={`quiz-feedback ${selected === question.answer ? "feedback-correct" : "feedback-incorrect"}`}>
                <strong>{selected === question.answer ? copy.correct : copy.incorrect}</strong>
                <p><b>{copy.explanation}:</b> {question.explain[language]}</p>
              </div>
            )}

            <div className="quiz-actions">
              <span className="quiz-note">{copy.note}</span>
              {!checked ? (
                <button className="quiz-primary" onClick={checkAnswer} disabled={selected === null}>{copy.check} <ArrowRight size={17} /></button>
              ) : (
                <button className="quiz-primary" onClick={goNext}>{current === questions.length - 1 ? copy.finish : copy.next} <ArrowRight size={17} /></button>
              )}
            </div>
          </section>
        ) : (
          <section className="quiz-card result-card">
            <div className="result-icon"><GraduationCap size={34} /></div>
            <div className="practice-eyebrow">{copy.result}</div>
            <div className="result-score">{score}<span> / 5</span></div>
            <h2>{score} {copy.outOf}</h2>
            <p>{language === "hi" ? "अभ्यास जारी रखें — हर सवाल आपको आगे बढ़ाता है।" : "Keep practising — every question helps you move forward."}</p>
            <button className="quiz-primary" onClick={restart}><RotateCcw size={17} /> {copy.retry}</button>
            <Link className="result-home" href="/">{copy.home}</Link>
          </section>
        )}
      </section>
      <footer className="practice-footer">AJEDUVERSE · LEARN · GROW · SUCCEED</footer>
    </main>
  );
}
