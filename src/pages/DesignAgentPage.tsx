import { ArrowRight, Brush, Code2, Layers, Rocket, Sparkles, Timer, WandSparkles } from "lucide-react";

const features = [
  { icon: Brush, title: "Сильный стиль", text: "Не шаблон, а фирменная визуальная система под твою нишу." },
  { icon: Code2, title: "Чистый код", text: "Готовые секции в HTML/CSS/JS с адаптивом под мобильные." },
  { icon: Timer, title: "Быстрый запуск", text: "Первый рабочий экран за 1 итерацию без долгого брифа." },
];

const process = [
  "Ты пишешь короткий запрос: ниша, стиль, цель.",
  "Агент строит структуру: hero, ценности, оффер, CTA.",
  "Сразу генерируется код для интеграции в проект.",
];

export default function DesignAgentPage() {
  return (
    <div className="min-h-full bg-[#08111f] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_8%_10%,rgba(14,165,233,0.25),transparent_28%),radial-gradient(circle_at_92%_16%,rgba(249,115,22,0.2),transparent_24%),radial-gradient(circle_at_65%_88%,rgba(16,185,129,0.17),transparent_30%)]" />

      <section className="mx-auto max-w-6xl px-4 pb-16 pt-14 md:px-8 md:pt-20">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-200/30 bg-cyan-300/10 px-4 py-1 text-xs font-bold uppercase tracking-[0.18em] text-cyan-100">
          <Sparkles className="h-3.5 w-3.5" />
          Web Design Agent
        </div>

        <div className="grid gap-8 md:grid-cols-[1.15fr_0.85fr] md:items-end">
          <div>
            <h1 className="text-4xl font-black leading-[1.03] text-balance sm:text-5xl md:text-6xl">
              Дизайн сайта,
              <span className="block bg-gradient-to-r from-cyan-300 via-emerald-300 to-amber-200 bg-clip-text text-transparent">
                который сразу в прод
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-slate-200/90 sm:text-base">
              Готовая стартовая страница с четким оффером, контентными блоками и кодовой базой. Можно сразу
              доработать в PyCharm и выкатывать.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button className="rounded-xl bg-cyan-300 px-5 py-3 text-sm font-bold text-[#07202e] transition hover:bg-cyan-200">
                Создать макет
              </button>
              <button className="rounded-xl border border-white/25 bg-white/5 px-5 py-3 text-sm font-semibold transition hover:bg-white/10">
                Сгенерировать HTML
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/15 bg-[#0d1a2f]/80 p-4 backdrop-blur">
            <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">
              <WandSparkles className="h-3.5 w-3.5" />
              Prompt
            </p>
            <div className="rounded-xl border border-emerald-100/15 bg-[#0a1425] p-4 font-mono text-xs leading-relaxed text-slate-200">
              Сделай лендинг для IT-сервиса.
              <br />
              Стиль: modern editorial + bold typography.
              <br />
              Блоки: hero, преимущества, кейсы, тарифы, FAQ, CTA.
              <br />
              Выгрузка: адаптивный HTML/CSS.
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-6 md:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {features.map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur-sm">
              <Icon className="h-5 w-5 text-cyan-200" />
              <h2 className="mt-3 text-lg font-bold">{title}</h2>
              <p className="mt-2 text-sm text-slate-200/85">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-6 md:px-8">
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-white/15 bg-[#0f1d34] p-6">
            <p className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-amber-200">
              <Layers className="h-4 w-4" />
              Процесс
            </p>
            <ol className="space-y-3 text-sm text-slate-100/90">
              {process.map((item) => (
                <li key={item} className="rounded-lg border border-white/10 bg-white/5 p-3">
                  {item}
                </li>
              ))}
            </ol>
          </article>

          <article className="rounded-2xl border border-emerald-100/20 bg-emerald-300/10 p-6">
            <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-100">
              <Rocket className="h-4 w-4" />
              Результат
            </p>
            <h3 className="text-2xl font-black leading-tight text-emerald-50">Готовый экран + код за один проход</h3>
            <p className="mt-3 text-sm text-emerald-50/90">
              Ты не теряешь время между дизайнером и разработкой: интерфейс сразу становится частью проекта.
            </p>
            <button className="mt-5 inline-flex items-center gap-2 rounded-lg border border-emerald-100/35 bg-emerald-200/20 px-4 py-2 text-sm font-semibold text-emerald-50 transition hover:bg-emerald-200/30">
              Собрать версию 1
              <ArrowRight className="h-4 w-4" />
            </button>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 md:px-8">
        <div className="rounded-3xl border border-cyan-100/20 bg-gradient-to-r from-cyan-300/15 via-slate-200/5 to-amber-300/10 p-7 md:p-9">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-100/90">FAQ</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-white/15 bg-[#0d192d]/65 p-4">
              <p className="text-sm font-bold">Можно подключить к текущему проекту?</p>
              <p className="mt-2 text-sm text-slate-200/85">Да, страница уже в React/Tailwind и легко встраивается в роуты.</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-[#0d192d]/65 p-4">
              <p className="text-sm font-bold">Адаптив включен?</p>
              <p className="mt-2 text-sm text-slate-200/85">Да, макет оптимизирован для мобильных и десктопа.</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-[#0d192d]/65 p-4">
              <p className="text-sm font-bold">Можно сменить стиль?</p>
              <p className="mt-2 text-sm text-slate-200/85">Да, меняем палитру, типографику и блоки под твой бренд.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
