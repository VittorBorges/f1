import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import "./prototypes.css";

// Cada vista recebe a época (SEASON, TEAMS, DRIVERS, teamById, PUS) por props.
const ease = [0.22, 1, 0.36, 1];
const href = (s, d) => `#/${s.SEASON}/piloto/${d.code.toLowerCase()}`;
const pad = (n) => String(n).padStart(2, "0");

// Cor de texto legível sobre a cor da equipa (luminância relativa WCAG).
function onColor(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.179 ? "#16181c" : "#ffffff";
}
const tc = (t) => ({ "--c": t.color, "--on": onColor(t.color) });

const PROTOS = [
  ["", "Atual"],
  ["v1", "Boxes"],
  ["v2", "Quadro"],
  ["v3", "Números"],
];

export function ProtoNav({ current, season }) {
  return (
    <nav className="protos" aria-label="Protótipos de layout">
      <span>Layouts</span>
      {PROTOS.map(([id, label]) => (
        <a key={id} href={`#/${season}${id && `/${id}`}`} aria-current={current === id ? "page" : undefined}>{label}</a>
      ))}
    </nav>
  );
}

/* ── V1 · Boxes: as 11 equipas como garagens ao longo da pit lane ── */
function PitCar() {
  return (
    <svg viewBox="0 0 120 34" aria-hidden="true">
      <polygon points="4,24 18,18 44,15 54,8 66,8 72,15 96,20 116,24 116,28 4,28" fill="var(--c)" />
      <circle cx="24" cy="27" r="7" fill="#0b0c0e" />
      <circle cx="96" cy="27" r="7" fill="#0b0c0e" />
    </svg>
  );
}

function Boxes({ s }) {
  const { TEAMS, DRIVERS } = s;
  const [active, setActive] = useState(TEAMS[0].id);
  return (
    <section className="pit" aria-label="Pit lane">
      <ol className="pit-lane">
        {TEAMS.map((t, i) => (
          <li key={t.id} className="garage" style={tc(t)} onMouseEnter={() => setActive(t.id)} onFocus={() => setActive(t.id)}>
            <div className="door" aria-hidden="true" />
            <h2><span>{pad(i + 1)}</span>{t.name}</h2>
            <ul className="crew">
              {DRIVERS.filter((d) => d.team === t.id).map((d) => (
                <li key={d.code}>
                  <a href={href(s, d)}>
                    <b>{d.num}</b>
                    <span>{d.code}<small>{d.last}</small></span>
                  </a>
                </li>
              ))}
            </ul>
            <p className="garage-meta">{t.pu} · {t.car}{t.note && <><br />{t.note}</>}</p>
            <div className="box-mark">
              {active === t.id && (
                <motion.div layoutId="pitcar" className="pitcar" transition={{ type: "spring", stiffness: 260, damping: 30 }}>
                  <PitCar />
                </motion.div>
              )}
            </div>
          </li>
        ))}
      </ol>
      <p className="hint">Ordem das boxes = Mundial de Construtores de 2025. Passe pelas garagens; clique num piloto para abrir a ficha.</p>
    </section>
  );
}

/* ── V2 · Quadro: 11 colunas × 2 pilotos, tudo num ecrã, leitura em baixo ── */
function Readout({ s, d }) {
  const { DRIVERS, teamById } = s;
  const t = teamById[d.team];
  const mate = DRIVERS.find((x) => x.team === d.team && x !== d);
  return (
    <motion.div key={d.code} className="readout" style={tc(t)} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease }}>
      <b className="ro-num">{d.num}</b>
      <div className="ro-name">
        <h2><small>{d.first}</small>{d.last}</h2>
        <p>{t.name} · {d.country}</p>
      </div>
      <dl className="ro-facts">
        <div><dt>Nasceu</dt><dd>{d.born}</dd></div>
        <div><dt>Estreia</dt><dd>{d.debut}</dd></div>
        <div><dt>Títulos</dt><dd>{d.titles}</dd></div>
        <div><dt>Colega</dt><dd>{mate.code}</dd></div>
      </dl>
      <a className="ro-link" href={href(s, d)}>Abrir ficha →</a>
    </motion.div>
  );
}

function Board({ s }) {
  const { TEAMS, DRIVERS, PUS } = s;
  const [sel, setSel] = useState(DRIVERS[0]);
  const [pu, setPu] = useState(null);
  return (
    <section className="board-wrap" aria-label="Quadro da grelha">
      <div className="chips" role="group" aria-label="Destacar por motor">
        {PUS.map((p) => (
          <button key={p} type="button" aria-pressed={pu === p} onClick={() => setPu(pu === p ? null : p)}>Motor {p}</button>
        ))}
      </div>
      <div className="board">
        {TEAMS.map((t, i) => (
          <div key={t.id} className="col" style={tc(t)} data-dim={pu !== null && t.pu !== pu}>
            <h2 className="col-head"><span>{pad(i + 1)}</span>{t.name}</h2>
            {DRIVERS.filter((d) => d.team === t.id).map((d) => (
              <a
                key={d.code}
                href={href(s, d)}
                className="tile"
                aria-current={sel === d ? "true" : undefined}
                aria-label={`${d.num} ${d.first} ${d.last}`}
                onMouseEnter={() => setSel(d)}
                onFocus={() => setSel(d)}
              >
                <b>{d.num}</b>
                <span>{d.code}</span>
              </a>
            ))}
            <small className="col-pu">{t.pu}</small>
          </div>
        ))}
      </div>
      <div aria-live="polite">
        <AnimatePresence mode="wait">
          <Readout s={s} d={sel} />
        </AnimatePresence>
      </div>
    </section>
  );
}

/* ── V3 · Números: o painel 1–99, cada número aceso é um piloto ── */
function Numbers({ s }) {
  const { SEASON, DRIVERS, teamById } = s;
  const byNum = Object.fromEntries(DRIVERS.map((d) => [d.num, d]));
  const [n, setN] = useState(1);
  const d = byNum[n];
  const t = d && teamById[d.team];
  return (
    <section className="nums" aria-label="Pilotos por número">
      <div className="nums-board">
        <label className="field nums-field">
          Número do carro
          <input type="number" min="1" max="99" inputMode="numeric" value={n} onChange={(e) => setN(Number(e.target.value))} />
        </label>
        <div className="nums-grid">
          {Array.from({ length: 99 }, (_, i) => i + 1).map((k) => {
            const x = byNum[k];
            if (!x) return <span key={k} className="cell" data-on={k === n || undefined} aria-hidden="true">{k}</span>;
            const xt = teamById[x.team];
            return (
              <a
                key={k}
                href={href(s, x)}
                className="cell lit"
                style={tc(xt)}
                data-on={k === n || undefined}
                data-mate={(d && x !== d && x.team === d.team) || undefined}
                aria-label={`${k} ${x.first} ${x.last}, ${xt.name}`}
                onMouseEnter={() => setN(k)}
                onFocus={() => setN(k)}
              >
                {k}<small>{x.code}</small>
              </a>
            );
          })}
        </div>
      </div>
      <aside className="nums-panel" aria-live="polite">
        <AnimatePresence mode="wait">
          {d ? (
            <motion.div key={d.code} style={tc(t)} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.3, ease }}>
              <b className="np-num">{d.num}</b>
              <h2><small>{d.first}</small>{d.last}</h2>
              <p>{t.name} · {d.country}</p>
              <ul>
                <li>Nasceu em <b>{d.born}</b></li>
                <li>Na F1 desde <b>{d.debut}</b>{d.debut === SEASON && " · estreante"}</li>
                <li><b>{d.titles}</b> {d.titles === 1 ? "título" : "títulos"} mundiais</li>
              </ul>
              <a href={href(s, d)}>Abrir ficha →</a>
            </motion.div>
          ) : (
            <motion.p key="none" className="np-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {n >= 1 && n <= 99 ? `Nenhum piloto usa o número ${n} em ${SEASON}.` : "Escolha um número entre 1 e 99."}
            </motion.p>
          )}
        </AnimatePresence>
      </aside>
    </section>
  );
}

const VIEWS = { v1: Boxes, v2: Board, v3: Numbers };

export default function Prototype({ id, season: s }) {
  const View = VIEWS[id];
  const { SEASON, TEAMS, DRIVERS } = s;
  return (
    <>
      <ProtoNav current={id} season={SEASON} />
      <header className="proto-head">
        <h1>Grelha F1 <span className="year">{SEASON}</span></h1>
        <p className="lede">{TEAMS.length} equipas · {DRIVERS.length} pilotos</p>
      </header>
      <main><View key={SEASON} s={s} /></main>
    </>
  );
}
