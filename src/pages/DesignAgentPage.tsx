import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Code2, Layers, Monitor, RefreshCw, Rocket, Sparkles, WandSparkles } from "lucide-react";
import { makeFadeUp, makeStagger } from "@/shared/motion";

const features = [
  {
    icon: Monitor,
    title: "Локальный preview",
    text: "Поднимает dev-сервер и показывает результат на localhost прямо в браузере, чтобы изменения были видны сразу.",
  },
  {
    icon: RefreshCw,
    title: "Живое обновление",
    text: "После сохранения файлов страница обычно обновляется сама через hot reload или fast refresh.",
  },
  {
    icon: Code2,
    title: "Код и UI рядом",
    text: "В браузере видно визуальный результат, а в редакторе сразу виден diff и точные изменения в файлах.",
  },
];

const process = [
  {
    title: "Понять задачу",
    text: "Сначала важно определить не только правку кода, но и то, как проверять результат на живом интерфейсе.",
  },
  {
    title: "Запустить локально",
    text: "Обычно это npm run dev, pnpm dev или yarn dev. После старта сайт открывается на localhost.",
  },
  {
    title: "Следить за обновлением",
    text: "Когда код меняется, фреймворк подхватывает изменения и сразу показывает новый экран без ручной пересборки.",
  },
  {
    title: "Сравнить diff",
    text: "Параллельно видно и сам результат, и точные изменения в проекте. Это ускоряет и дизайн, и отладку.",
  },
];

export default function DesignAgentPage() {
  const reduceMotion = useReducedMotion();
  const container = makeStagger(reduceMotion);
  const item = makeFadeUp(reduceMotion);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="min-h-full bg-[#08111f] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_8%_10%,rgba(14,165,233,0.25),transparent_28%),radial-gradient(circle_at_92%_16%,rgba(249,115,22,0.2),transparent_24%),radial-gradient(circle_at_65%_88%,rgba(16,185,129,0.17),transparent_30%)]" />

      <motion.section variants={item} className="mx-auto max-w-6xl px-4 pb-16 pt-14 md:px-8 md:pt-20">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-200/30 bg-cyan-300/10 px-4 py-1 text-xs font-bold uppercase tracking-[0.18em] text-cyan-100">
          <Sparkles className="h-3.5 w-3.5" />
          Codex Local Workflow
        </div>

        <div className="grid gap-8 md:grid-cols-[1.15fr_0.85fr] md:items-end">
          <div>
            <h1 className="text-4xl font-black leading-[1.03] text-balance sm:text-5xl md:text-6xl">
              Локальный сайт,
              <span className="block bg-gradient-to-r from-cyan-300 via-emerald-300 to-amber-200 bg-clip-text text-transparent">
                который видно сразу
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-slate-200/90 sm:text-base">
              Codex работает с локальным проектом: запускает dev-сервер, открывает localhost, вносит правки в файлы и даёт живой цикл проверки через браузер и diff.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button className="rounded-xl bg-cyan-300 px-5 py-3 text-sm font-bold text-[#07202e] transition hover:bg-cyan-200">
                Запустить локально
              </button>
              <button className="rounded-xl border border-white/25 bg-white/5 px-5 py-3 text-sm font-semibold transition hover:bg-white/10">
                Смотреть diff
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/15 bg-[#0d1a2f]/80 p-4 backdrop-blur">
            <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">
              <WandSparkles className="h-3.5 w-3.5" />
              Prompt
            </p>
            <div className="rounded-xl border border-emerald-100/15 bg-[#0a1425] p-4 font-mono text-xs leading-relaxed text-slate-200">
              Обнови экран в локальном проекте.
              <br />
              Запусти dev-сервер и открой localhost в браузере.
              <br />
              Вноси правки в файлы так, чтобы я сразу видел результат на сайте.
              <br />
              Параллельно показывай, какой diff появился в проекте.
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section variants={item} className="mx-auto max-w-6xl px-4 pb-6 md:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {features.map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur-sm">
              <Icon className="h-5 w-5 text-cyan-200" />
              <h2 className="mt-3 text-lg font-bold">{title}</h2>
              <p className="mt-2 text-sm text-slate-200/85">{text}</p>
            </article>
          ))}
        </div>
      </motion.section>

      <motion.section variants={item} className="mx-auto max-w-6xl px-4 pb-6 md:px-8">
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-white/15 bg-[#0f1d34] p-6">
            <p className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-amber-200">
              <Layers className="h-4 w-4" />
              Процесс
            </p>
            <ol className="space-y-3 text-sm text-slate-100/90">
              {process.map(({ title, text }) => (
                <li key={title} className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">{title}</p>
                  <p className="mt-2 leading-relaxed text-slate-100/85">{text}</p>
                </li>
              ))}
            </ol>
          </article>

          <article className="rounded-2xl border border-emerald-100/20 bg-emerald-300/10 p-6">
            <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-100">
              <Rocket className="h-4 w-4" />
              Результат
            </p>
            <h3 className="text-2xl font-black leading-tight text-emerald-50">Браузер, hot reload и diff в одном цикле</h3>
            <p className="mt-3 text-sm text-emerald-50/90">
              Не нужно ждать отдельный билд или собирать макет вручную: изменения сразу проверяются на живом сайте и сразу видны в коде.
            </p>
            <button className="mt-5 inline-flex items-center gap-2 rounded-lg border border-emerald-100/35 bg-emerald-200/20 px-4 py-2 text-sm font-semibold text-emerald-50 transition hover:bg-emerald-200/30">
              Открыть preview
              <ArrowRight className="h-4 w-4" />
            </button>
          </article>
        </div>
      </motion.section>

      <motion.section variants={item} className="mx-auto max-w-6xl px-4 pb-16 md:px-8">
        <div className="rounded-3xl border border-cyan-100/20 bg-gradient-to-r from-cyan-300/15 via-slate-200/5 to-amber-300/10 p-7 md:p-9">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-100/90">FAQ</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-white/15 bg-[#0d192d]/65 p-4">
              <p className="text-sm font-bold">Это Codex сам обновляет страницу?</p>
              <p className="mt-2 text-sm text-slate-200/85">Нет, автообновление обычно делает сам фреймворк через hot reload или fast refresh.</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-[#0d192d]/65 p-4">
              <p className="text-sm font-bold">Где смотреть изменения?</p>
              <p className="mt-2 text-sm text-slate-200/85">В браузере виден новый интерфейс, а в Codex или VS Code виден diff файлов.</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-[#0d192d]/65 p-4">
              <p className="text-sm font-bold">Какой адрес открывать?</p>
              <p className="mt-2 text-sm text-slate-200/85">Чаще всего это localhost:3000 или localhost:5173, в зависимости от dev-сервера проекта.</p>
            </div>
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
}
