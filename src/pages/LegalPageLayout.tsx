import { type ReactNode } from "react";
import { Link } from "react-router-dom";

type LegalSection = {
  title: string;
  paragraphs: string[];
};

type LegalPageLayoutProps = {
  eyebrow: string;
  title: string;
  summary: string;
  lastUpdated: string;
  sections: LegalSection[];
  footerNote?: ReactNode;
};

export function LegalPageLayout({
  eyebrow,
  title,
  summary,
  lastUpdated,
  sections,
  footerNote,
}: LegalPageLayoutProps) {
  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 sm:py-10">
      <div className="mx-auto flex max-w-4xl flex-col gap-5">
        <header className="overflow-hidden rounded-[28px] border border-border/60 bg-card/80 p-6 shadow-[0_24px_60px_hsla(var(--shadow)/0.18)] backdrop-blur-xl sm:p-8">
          <div className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/90">
            {eyebrow}
          </div>

          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-black font-heading tracking-tight text-foreground sm:text-4xl">{title}</h1>
              <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-[15px]">{summary}</p>
            </div>

            <div className="rounded-2xl border border-border/60 bg-secondary/35 px-4 py-3 text-sm text-muted-foreground">
              <div className="font-semibold text-foreground">Последнее обновление</div>
              <div className="mt-1">{lastUpdated}</div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 px-4 text-sm font-semibold text-primary transition hover:border-primary/35 hover:bg-primary/15"
            >
              Вернуться на главную
            </Link>
            <a
              href="mailto:salihovarturik3@gmail.com"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-border/60 bg-secondary/35 px-4 text-sm font-semibold text-foreground transition hover:border-primary/25 hover:bg-secondary/55"
            >
              Связаться с поддержкой
            </a>
          </div>
        </header>

        <div className="grid gap-4">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-[24px] border border-border/60 bg-card/70 p-6 shadow-[0_18px_45px_hsla(var(--shadow)/0.14)] backdrop-blur-xl"
            >
              <h2 className="text-lg font-bold text-foreground sm:text-xl">{section.title}</h2>
              <div className="mt-3 grid gap-3 text-sm leading-7 text-muted-foreground sm:text-[15px]">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        {footerNote ? (
          <footer className="rounded-[24px] border border-border/60 bg-card/65 p-5 text-sm leading-7 text-muted-foreground shadow-[0_18px_40px_hsla(var(--shadow)/0.12)]">
            {footerNote}
          </footer>
        ) : null}
      </div>
    </main>
  );
}
