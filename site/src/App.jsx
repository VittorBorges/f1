import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, animate, motion, useReducedMotion } from "motion/react";
import Prototype, { ProtoNav } from "./Prototypes.jsx";

// Uma pasta por época em src/data/<ano>/ com teams.json, drivers.json e season.json.
const files = import.meta.glob("./data/*/*.json", { eager: true, import: "default" });
const SEASONS = {};
for (const [path, data] of Object.entries(files)) {
  const [, year, name] = path.match(/\/(\d{4})\/(\w+)\.json$/);
  (SEASONS[year] ??= { SEASON: Number(year) })[name] = data;
}
for (const s of Object.values(SEASONS)) {
  const { teams: TEAMS, drivers: DRIVERS, SEASON } = s;
  Object.assign(s, {
    TEAMS,
    DRIVERS,
    teamById: Object.fromEntries(TEAMS.map((t) => [t.id, t])),
    PUS: [...new Set(TEAMS.map((t) => t.pu))],
    MAX_EXP: Math.max(...DRIVERS.map((d) => SEASON - d.debut)),
    GRID_ORDER: TEAMS.flatMap((t) => DRIVERS.filter((d) => d.team === t.id)),
  });
}
const YEARS = Object.keys(SEASONS).sort().reverse();
const Season = createContext(null);
const useSeason = () => useContext(Season);

const norm = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const SORTS = {
  num: (a, b) => a.num - b.num,
  name: (a, b) => a.last.localeCompare(b.last, "pt"),
  debut: (a, b) => a.debut - b.debut || a.num - b.num,
  born: (a, b) => b.born - a.born || a.num - b.num,
};
const FLAGS = [
  ["champ", "Campeões do mundo"],
  ["rookie", "Estreantes"],
  ["new", "Equipas novas"],
];

const ease = [0.22, 1, 0.36, 1];
const item = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, ease, delay: Math.min(i, 12) * 0.05 } }),
  exit: { opacity: 0, scale: 0.94, transition: { duration: 0.2 } },
};

function CountUp({ to, from = 0, suffix = "" }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  useEffect(() => {
    const c = animate(from, to, {
      duration: reduce ? 0 : 1.4,
      ease,
      onUpdate: (v) => ref.current && (ref.current.textContent = Math.round(v) + suffix),
    });
    return () => c.stop();
  }, [to, from, suffix, reduce]);
  return <b ref={ref}>{to}{suffix}</b>;
}

function Car({ color }) {
  const wheel = (cx) => (
    <g className="wheel">
      <circle cx={cx} cy="50" r="17" fill="var(--tyre)" />
      <circle cx={cx} cy="50" r="7" fill={color} />
      <rect x={cx - 1.5} y="36" width="3" height="28" fill={color} opacity=".55" />
    </g>
  );
  return (
    <motion.svg
      className="car"
      viewBox="0 0 240 70"
      role="img"
      aria-label="Ilustração genérica de um monolugar"
      initial={{ x: 140, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 70, damping: 14, delay: 0.15 }}
    >
      <rect x="6" y="14" width="8" height="30" fill={color} />
      <rect x="6" y="14" width="34" height="7" fill={color} />
      <polygon points="20,44 40,34 86,28 104,18 128,18 140,30 186,40 232,48 232,54 20,54" fill={color} />
      <polygon points="104,18 128,18 136,28 98,28" fill="var(--tyre)" opacity=".85" />
      <path d="M100 28 Q118 8 138 28" fill="none" stroke="var(--tyre)" strokeWidth="3.5" />
      <rect x="204" y="52" width="32" height="5" fill={color} />
      <rect x="64" y="50" width="110" height="4" fill="var(--tyre)" opacity=".35" />
      {wheel(48)}
      {wheel(192)}
    </motion.svg>
  );
}

function Helmet({ color, className = "helmet", delay = 0.25 }) {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 100 90"
      aria-hidden="true"
      initial={{ x: 40, rotate: 25, opacity: 0 }}
      animate={{ x: 0, rotate: 0, opacity: 0.9 }}
      transition={{ type: "spring", stiffness: 90, damping: 12, delay }}
    >
      <path d="M8 62 Q4 14 52 10 Q94 10 96 54 L96 70 Q96 80 86 80 L22 80 Q10 80 8 62Z" fill={color} />
      <path d="M44 40 L96 40 L96 58 L52 58 Q42 56 44 40Z" fill="var(--tyre)" />
      <rect x="8" y="66" width="88" height="5" fill="var(--tyre)" opacity=".3" />
    </motion.svg>
  );
}

function DriverCard({ d, showTeam, i }) {
  const { SEASON, MAX_EXP, teamById } = useSeason();
  const t = teamById[d.team];
  const years = SEASON - d.debut;
  return (
    <motion.a
      layout
      href={driverHref(SEASON, d)}
      className="driver"
      style={{ "--c": t.color }}
      variants={item}
      custom={i}
      initial="hidden"
      animate="show"
      exit="exit"
      whileHover={{ y: -4 }}
    >
      <div className="row">
        <span className="num">{d.num}</span>
        <span className="code">{d.code}</span>
      </div>
      <div className="name">
        {d.first} {d.last}
        <small>{showTeam && `${t.name} · `}{d.country}</small>
      </div>
      <ul className="facts">
        <li>n. {d.born}</li>
        <li>F1 desde {d.debut}</li>
      </ul>
      <div className="exp" title={`${years} ${years === 1 ? "época" : "épocas"} na F1`}>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: Math.max(years, 0.4) / MAX_EXP }}
          transition={{ duration: 1, ease, delay: 0.3 + Math.min(i, 12) * 0.05 }}
        />
      </div>
      <div className="tags">
        {d.titles > 0 && <span className="tag">{d.titles} {d.titles > 1 ? "títulos" : "título"}</span>}
        {d.debut === SEASON && <span className="tag plain">Estreante</span>}
      </div>
      <Helmet color={t.color} />
    </motion.a>
  );
}

const driverHref = (year, d) => `#/${year}/piloto/${d.code.toLowerCase()}`;

function useHash() {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const on = () => setHash(window.location.hash);
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return hash;
}

// Faixa com os 22 pilotos como pontos; empilha quem partilha o mesmo ano.
function DotStrip({ label, field, d, mate }) {
  const { SEASON, DRIVERS, teamById } = useSeason();
  const vals = DRIVERS.map((x) => x[field]);
  const min = Math.min(...vals), max = Math.max(...vals);
  const seen = {};
  const dots = [...DRIVERS].sort((a, b) => (a === d) - (b === d) || (a === mate) - (b === mate)).map((x) => {
    const stack = (seen[x[field]] = (seen[x[field]] ?? -1) + 1);
    return { x, left: ((x[field] - min) / (max - min)) * 100, stack };
  });
  return (
    <div className="strip">
      <div className="strip-label">{label}</div>
      <div className="strip-track">
        {dots.map(({ x, left, stack }, i) => {
          const kind = x === d ? "me" : x === mate ? "mate" : "";
          return (
            <motion.a
              key={x.code}
              href={driverHref(SEASON, x)}
              className={`dot ${kind}`}
              style={{ left: `${left}%`, bottom: stack * 12, "--c": teamById[x.team].color }}
              title={`${x.first} ${x.last} · ${x[field]}`}
              aria-label={`${x.first} ${x.last}, ${x[field]}`}
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.02, type: "spring", stiffness: 300, damping: 18 }}
            >
              {kind && <span>{x.code}</span>}
            </motion.a>
          );
        })}
      </div>
      <div className="strip-axis"><span>{min}</span><span>{max}</span></div>
    </div>
  );
}

function CompareRow({ label, a, b, fmt = (v) => v, max }) {
  const bar = (v, side) => (
    <div className={`cmp-bar ${side}`}>
      <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: max ? v / max : 0 }} transition={{ duration: 0.9, ease, delay: 0.5 }} />
    </div>
  );
  return (
    <div className="cmp-row">
      <b className={a > b ? "lead" : ""}>{fmt(a)}</b>
      {bar(a, "l")}
      <span>{label}</span>
      {bar(b, "r")}
      <b className={b > a ? "lead" : ""}>{fmt(b)}</b>
    </div>
  );
}

function DriverPage({ d }) {
  const { SEASON, DRIVERS, MAX_EXP, GRID_ORDER, teamById } = useSeason();
  const driverHref = (x) => `#/${SEASON}/piloto/${x.code.toLowerCase()}`;
  const t = teamById[d.team];
  const mate = DRIVERS.find((x) => x.team === d.team && x !== d);
  const idx = GRID_ORDER.indexOf(d);
  const prev = GRID_ORDER[(idx - 1 + GRID_ORDER.length) % GRID_ORDER.length];
  const next = GRID_ORDER[(idx + 1) % GRID_ORDER.length];
  const years = SEASON - d.debut;
  const youngest = [...DRIVERS].sort((a, b) => b.born - a.born).indexOf(d) + 1;

  useEffect(() => {
    document.title = `${d.first} ${d.last} · Grelha F1 ${SEASON}`;
    return () => { document.title = `Grelha F1 ${SEASON}`; };
  }, [d, SEASON]);

  // [rótulo, valor, de onde a contagem parte, sufixo, legenda]
  const facts = [
    ["Nascimento", d.born, d.born - 30, "", `faz ${SEASON - d.born} anos em ${SEASON}`],
    ["Estreia na F1", d.debut, d.debut - 30, "", d.debut === SEASON ? "estreante" : `há ${years} ${years === 1 ? "ano" : "anos"}`],
    ["Títulos mundiais", d.titles, 0, "", d.titles ? "campeão do mundo" : "ainda sem título"],
    ["Mais novo da grelha", youngest, 0, "º", `entre ${DRIVERS.length} pilotos`],
  ];

  return (
    <div className="detail" style={{ "--c": t.color }}>
      <nav className="crumbs">
        <a href={`#/${SEASON}`}>← Grelha {SEASON}</a>
        <span>
          <a href={driverHref(prev)} aria-label={`Anterior: ${prev.first} ${prev.last}`}>‹ {prev.code}</a>
          <a href={driverHref(next)} aria-label={`Seguinte: ${next.first} ${next.last}`}>{next.code} ›</a>
        </span>
      </nav>

      <section className="hero">
        <motion.div className="hero-band" initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.6, ease }} />
        <div className="hero-text">
          <motion.span className="hero-num" initial={{ opacity: 0, x: -60 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, ease }}>
            {d.num}
          </motion.span>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease, delay: 0.15 }}>
            <span className="code">{d.code}</span>
            <h1 className="hero-name"><small>{d.first}</small>{d.last}</h1>
            <p className="hero-sub">{t.name} · {d.country}</p>
            <div className="tags">
              {d.titles > 0 && <span className="tag">{d.titles} {d.titles > 1 ? "títulos" : "título"}</span>}
              {d.debut === SEASON && <span className="tag plain">Estreante</span>}
            </div>
          </motion.div>
        </div>
        <Helmet color={t.color} className="hero-helmet" delay={0.3} />
      </section>

      <ul className="facts-grid">
        {facts.map(([label, value, from, suffix, sub], i) => (
          <motion.li key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease, delay: 0.25 + i * 0.07 }}>
            <small>{label}</small>
            <CountUp to={value} from={from} suffix={suffix} />
            <span>{sub}</span>
          </motion.li>
        ))}
      </ul>

      <section className="panel team-panel">
        <div>
          <h2>{t.name}</h2>
          <ul className="meta">
            <li>Motor <b>{t.pu}</b></li>
            <li>Chassis <b>{t.car}</b></li>
            <li>{t.base}</li>
            {t.note && <li><b>{t.note}</b></li>}
          </ul>
        </div>
        <div className="track">
          <Car color={t.color} />
        </div>
      </section>

      <section className="panel">
        <h2>Contra o colega de equipa</h2>
        <div className="cmp-head">
          <span>{d.first} {d.last}</span>
          <a href={driverHref(mate)}>{mate.first} {mate.last} ›</a>
        </div>
        <CompareRow label="Idade" a={SEASON - d.born} b={SEASON - mate.born} max={SEASON - Math.min(...DRIVERS.map((x) => x.born))} />
        <CompareRow label="Anos na F1" a={years} b={SEASON - mate.debut} max={MAX_EXP} />
        <CompareRow label="Títulos" a={d.titles} b={mate.titles} max={Math.max(...DRIVERS.map((x) => x.titles))} />
      </section>

      <section className="panel">
        <h2>Na grelha de {SEASON}</h2>
        <DotStrip label="Ano de nascimento" field="born" d={d} mate={mate} />
        <DotStrip label="Ano de estreia" field="debut" d={d} mate={mate} />
        <p className="legend"><i className="dot me" /> {d.code} <i className="dot mate" /> {mate.code} · Clique num ponto para abrir o piloto.</p>
      </section>
    </div>
  );
}

function TeamCard({ t, pos, drivers, i }) {
  return (
    <motion.section layout className="team" style={{ "--c": t.color }} variants={item} custom={i} initial="hidden" animate="show" exit="exit">
      <div className="team-head">
        <div>
          <h2>
            <span className="pos">{String(pos).padStart(2, "0")}</span>
            {t.name}
          </h2>
          <ul className="meta">
            <li>Motor <b>{t.pu}</b></li>
            <li>Chassis <b>{t.car}</b></li>
            <li>{t.base}</li>
            {t.note && <li><b>{t.note}</b></li>}
          </ul>
        </div>
        <Car color={t.color} />
      </div>
      <div className="pair">
        <AnimatePresence mode="popLayout">
          {drivers.map((d, j) => <DriverCard key={d.code} d={d} i={i + j} />)}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}

function ScrollTo({ yRef }) {
  useLayoutEffect(() => { window.scrollTo(0, yRef?.current ?? 0); }, [yRef]);
  return null;
}

function readView() {
  try {
    const v = localStorage.getItem("f1-view");
    return v === "drivers" ? v : "teams";
  } catch {
    return "teams";
  }
}

export default function App() {
  const [view, setViewState] = useState(readView);
  const [q, setQ] = useState("");
  const [pu, setPu] = useState(null);
  const [flag, setFlag] = useState(null);
  const [sort, setSort] = useState("num");

  const setView = (v) => {
    setViewState(v);
    try { localStorage.setItem("f1-view", v); } catch { /* sem storage */ }
  };

  // Rotas: #/2026, #/2026/piloto/ham. Sem ano (ou ano desconhecido) → época mais recente.
  const hash = useHash();
  const [, yearInHash, code, proto] = hash.match(/^#\/(?:(\d{4})\/?)?(?:piloto\/([a-z]+)|(v[123]))?$/) ?? [];
  const season = SEASONS[yearInHash] ?? SEASONS[YEARS[0]];
  const { SEASON, TEAMS, DRIVERS, PUS, teamById } = season;
  const detail = code && DRIVERS.find((d) => d.code.toLowerCase() === code);
  useEffect(() => {
    if (yearInHash !== String(SEASON)) history.replaceState(null, "", `#/${SEASON}${code ? `/piloto/${code}` : proto ? `/${proto}` : ""}`);
    document.title = `Grelha F1 ${SEASON}`;
  }, [yearInHash, SEASON, code, proto]);

  const list = useMemo(() => {
    const nq = norm(q.trim());
    return DRIVERS.filter((d) => {
      const t = teamById[d.team];
      if (pu && PUS.includes(pu) && t.pu !== pu) return false;
      if (flag === "champ" && !d.titles) return false;
      if (flag === "rookie" && d.debut !== SEASON) return false;
      if (flag === "new" && !t.note) return false;
      return !nq || norm([d.first, d.last, d.code, d.num, d.country, t.name, t.pu, t.car].join(" ")).includes(nq);
    });
  }, [q, pu, flag, DRIVERS, SEASON, teamById, PUS]);

  // Guarda o scroll da grelha ao abrir um piloto, para voltar ao mesmo sítio.
  const gridY = useRef(0);
  const wasGrid = useRef(!detail);
  useLayoutEffect(() => {
    if (detail && wasGrid.current) gridY.current = window.scrollY;
    wasGrid.current = !detail;
  }, [detail]);

  const teamsShown = TEAMS.map((t, i) => ({ t, pos: i + 1, ds: list.filter((d) => d.team === t.id) })).filter((x) => x.ds.length);
  const champs = DRIVERS.filter((d) => d.titles).length;

  const pageFade = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0, transition: { duration: 0.18 } } };

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="wait">
      {detail ? (
        <motion.div key={`${SEASON}-${detail.code}`} className="wrap" {...pageFade}>
        <Season.Provider value={season}>
          <ScrollTo />
          <DriverPage d={detail} />
        </Season.Provider>
        </motion.div>
      ) : proto ? (
        <motion.div key={proto} className="wrap" {...pageFade}>
        <Season.Provider value={season}>
          <ScrollTo />
          <Prototype id={proto} season={season} />
        </Season.Provider>
        </motion.div>
      ) : (
      <motion.div key={`grid-${SEASON}`} className="wrap" {...pageFade}>
        <Season.Provider value={season}>
        <ScrollTo yRef={gridY} />
        <ProtoNav current="" season={SEASON} />
        <header>
          <div>
            <motion.h1 initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease }}>
              Grelha F1{" "}
              <motion.span className="year" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} style={{ originX: 0 }} transition={{ duration: 0.5, ease, delay: 0.35 }}>
                {SEASON}
              </motion.span>
            </motion.h1>
            <p className="lede">
              As {TEAMS.length} equipas e os {DRIVERS.length} pilotos do Mundial de Fórmula 1 de {SEASON}
              {season.season?.lede ? `, ${season.season.lede}` : "."}
            </p>
          </div>
          <ul className="stats">
            <li><CountUp to={TEAMS.length} /><small>equipas</small></li>
            <li><CountUp to={DRIVERS.length} /><small>pilotos</small></li>
            <li><CountUp to={PUS.length} /><small>fabricantes de motor</small></li>
            <li><CountUp to={champs} /><small>campeões do mundo</small></li>
          </ul>
        </header>

        <div className="controls">
          <label className="field">
            Época
            <select value={SEASON} onChange={(e) => { window.location.hash = `#/${e.target.value}`; }}>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
          <div className="seg" role="group" aria-label="Vista">
            {[["teams", "Equipas"], ["drivers", "Pilotos"]].map(([v, label]) => (
              <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)}>
                {view === v && <motion.span layoutId="seg-pill" className="pill" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
                {label}
              </button>
            ))}
          </div>
          <label className="field">
            Procurar
            <input type="search" placeholder="Piloto, equipa, país" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          {view === "drivers" && (
            <label className="field">
              Ordenar
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="num">Número</option>
                <option value="name">Apelido</option>
                <option value="debut">Estreia na F1</option>
                <option value="born">Mais novo primeiro</option>
              </select>
            </label>
          )}
          <span className="count" aria-live="polite">
            {list.length} pilotos · {new Set(list.map((d) => d.team)).size} equipas
          </span>
        </div>

        <div className="chips" role="group" aria-label="Filtros">
          {PUS.map((p) => (
            <button key={p} type="button" aria-pressed={pu === p} onClick={() => setPu(pu === p ? null : p)}>Motor {p}</button>
          ))}
          {FLAGS.map(([f, label]) => (
            <button key={f} type="button" aria-pressed={flag === f} onClick={() => setFlag(flag === f ? null : f)}>{label}</button>
          ))}
        </div>

        <main>
          <AnimatePresence mode="wait">
            {view === "teams" ? (
              <motion.div key="teams" className="teams" exit={{ opacity: 0, transition: { duration: 0.15 } }}>
                <AnimatePresence mode="popLayout">
                  {teamsShown.map(({ t, pos, ds }, i) => <TeamCard key={t.id} t={t} pos={pos} drivers={ds} i={i} />)}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div key="drivers" className="drivers" exit={{ opacity: 0, transition: { duration: 0.15 } }}>
                <AnimatePresence mode="popLayout">
                  {[...list].sort(SORTS[sort]).map((d, i) => <DriverCard key={d.code} d={d} i={i} showTeam />)}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
          {list.length === 0 && (
            <motion.p className="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              Nenhum resultado. Limpe a procura ou os filtros.
            </motion.p>
          )}
        </main>

        <footer>
          {season.season?.footer} As cores são aproximações das decorações e as ilustrações são genéricas: a
          página não usa fotografias nem logótipos oficiais. A barra em cada piloto mostra as épocas desde a estreia na F1.
        </footer>
      </Season.Provider>
      </motion.div>
      )}
      </AnimatePresence>
    </MotionConfig>
  );
}
