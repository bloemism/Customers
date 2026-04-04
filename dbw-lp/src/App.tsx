import React, { useEffect, useRef, useState } from 'react';
import { Instagram, Youtube } from 'lucide-react';
import {
  type CompanySocialEntry,
  botanism,
  dbwLandingImages as IMG,
  dbwLandingMeta,
  dbwMission,
  debloemenWinkel,
  flowerDisasterFund,
} from './content/dbwLandingContent';
import './App.css';

function CompanySocialLinks({ items }: { items: readonly CompanySocialEntry[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="company-social">
      {items.map((item) => (
        <li key={item.href}>
          <a
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="company-social__link"
            aria-label={item.ariaLabel}
          >
            {item.kind === 'instagram' ? (
              <Instagram className="company-social__icon" size={22} strokeWidth={1.65} aria-hidden />
            ) : (
              <Youtube className="company-social__icon" size={22} strokeWidth={1.65} aria-hidden />
            )}
          </a>
        </li>
      ))}
    </ul>
  );
}

function Reveal({
  children,
  className = '',
  delayMs = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setVisible(true);
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.06 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`company-reveal ${visible ? 'company-reveal--visible' : ''} ${className}`}
      style={{ transitionDelay: visible ? `${delayMs}ms` : '0ms' }}
    >
      {children}
    </div>
  );
}

export default function App() {
  const heroRef = useRef<HTMLElement>(null);
  const [heroInView, setHeroInView] = useState(true);

  useEffect(() => {
    document.title = dbwLandingMeta.documentTitle;
  }, []);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => setHeroInView(e.isIntersecting),
      { threshold: 0.08, rootMargin: '-72px 0px 0px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="company-lp">
      <div className="company-lp__deco-circle company-lp__deco-circle--1" aria-hidden />
      <div className="company-lp__deco-circle company-lp__deco-circle--2" aria-hidden />

      <header
        className={`company-header ${heroInView ? 'company-header--on-hero' : ''}`}
      >
        <a href="#top" className="company-header__brand">
          DBW
        </a>
        <nav className="company-header__nav" aria-label="ページ内ナビゲーション">
          <a href="#mission" className="company-header__link">
            About
          </a>
          <a href="#debloemen" className="company-header__link">
            ブルームン
          </a>
          <a href="#botanism" className="company-header__link">
            Botanism
          </a>
          <a href="#fund" className="company-header__link">
            基金
          </a>
        </nav>
      </header>

      <div className="company-lp__inner" id="top">
        <section ref={heroRef} className="company-hero" aria-label="メインビジュアル">
          <div
            className="company-hero__bg"
            style={{ backgroundImage: `url(${IMG.hero})` }}
            role="img"
            aria-label="生産地の風景（ハウスと山並み）"
          />
          <div className="company-hero__shade" />
          <div className="company-hero__content">
            <p className="company-hero__role company-hero-line">HUB TARMINAL</p>
            <h1 className="company-hero__title company-hero-line">DBW</h1>
            <p className="company-hero__lead company-hero-line">{dbwLandingMeta.heroLead}</p>
            <span className="company-hero__scroll">Scroll</span>
          </div>
        </section>

        <section id="mission" className="company-section company-section--tight">
          <Reveal>
            <p className="company-section__label">{dbwMission.label}</p>
            <h2 className="company-section__title">{dbwMission.title}</h2>
            <div className="company-section__divider" />
            <p className="company-section__body">{dbwMission.body}</p>
          </Reveal>
        </section>

        <section id="brands" className="company-section" aria-label="事業・ブランド">
          <Reveal>
            <p className="company-section__label">Our work</p>
            <h2 className="company-section__title">事業とブランド</h2>
            <div className="company-section__divider" />
          </Reveal>

          <div id="debloemen" className="company-split company-split--anchor" style={{ marginTop: '2.5rem' }}>
            <Reveal className="company-split__visual">
              <img
                className="company-split__img"
                src={IMG.greenhouse}
                alt="ハウス内で育つ植物の列"
                loading="lazy"
              />
            </Reveal>
            <Reveal className="company-split__text" delayMs={80}>
              <p className="company-section__label">{debloemenWinkel.label}</p>
              <h3 className="company-section__title">{debloemenWinkel.nameEn}</h3>
              <p className="company-brand-sub">{debloemenWinkel.nameJa}</p>
              <CompanySocialLinks items={debloemenWinkel.social} />
              <p className="company-section__body">{debloemenWinkel.tagline}</p>

              <h4 className="company-subheading">沿革</h4>
              <ul className="company-timeline">
                {debloemenWinkel.timeline.map((row) => (
                  <li key={row.period + row.text}>
                    <span className="company-timeline__when">{row.period}</span>
                    {row.text}
                  </li>
                ))}
              </ul>

              <h4 className="company-subheading">主な活動・メディア</h4>
              <ul className="company-bullets">
                {debloemenWinkel.highlights.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </Reveal>
          </div>

          <div id="botanism" className="company-botanism company-split--anchor" style={{ marginTop: '3rem' }}>
            <div className="company-split company-split--reverse">
              <Reveal className="company-split__text">
                <img
                  className="company-botanism__mark"
                  src={IMG.botanismMark}
                  alt="Botanism ブランドマーク"
                  loading="lazy"
                />
                <p className="company-section__label">{botanism.label}</p>
                <p className="company-botanism__name">{botanism.name}</p>
                <h3 className="company-section__title">{botanism.nameJa}</h3>
                <p className="company-section__body">{botanism.lead}</p>
                {botanism.paragraphs.map((p, i) => (
                  <p key={i} className="company-section__body company-section__body--spaced">
                    {p}
                  </p>
                ))}
                <CompanySocialLinks items={botanism.social} />
              </Reveal>
              <Reveal className="company-split__visual" delayMs={100}>
                <img
                  className="company-split__img company-split__img--wide"
                  src={IMG.botanismField}
                  alt="圃場に咲くルリタマアザミの花"
                  loading="lazy"
                />
              </Reveal>
            </div>
          </div>

          <div id="fund" className="company-split company-split--reverse company-split--anchor" style={{ marginTop: '3.5rem' }}>
            <Reveal className="company-split__text">
              <p className="company-section__label">{flowerDisasterFund.label}</p>
              <h3 className="company-section__title">{flowerDisasterFund.title}</h3>
              <p className="company-section__body">{flowerDisasterFund.intro}</p>
              <p className="company-section__body company-section__body--spaced">
                {flowerDisasterFund.activities}
              </p>
              <p className="company-section__body company-section__body--spaced">{flowerDisasterFund.role}</p>
              <h4 className="company-subheading">{flowerDisasterFund.backgroundHeading}</h4>
              <p className="company-section__body">{flowerDisasterFund.background}</p>
              <h4 className="company-subheading">{flowerDisasterFund.targetHeading}</h4>
              <p className="company-section__body">{flowerDisasterFund.target}</p>
              <h4 className="company-subheading">{flowerDisasterFund.supportHeading}</h4>
              <ul className="company-bullets">
                {flowerDisasterFund.supportItems.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </Reveal>
            <Reveal className="company-split__visual" delayMs={90}>
              <img
                className="company-split__img"
                src={IMG.fieldRows}
                alt="花畑の列と遠くの山並み"
                loading="lazy"
              />
            </Reveal>
          </div>
        </section>

        <footer className="company-footer">
          <p className="company-footer__wordmark">DBW</p>
          <p className="company-footer__sub">HUB TARMINAL</p>
          <p className="company-footer__copy">© {new Date().getFullYear()} DBW</p>
          <img
            className="company-footer__mark"
            src={IMG.botanismMark}
            alt=""
            loading="lazy"
            width={48}
            height={48}
          />
        </footer>
      </div>
    </div>
  );
}
