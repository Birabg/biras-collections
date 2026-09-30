import { Link } from 'react-router-dom';
import { ChevronRight, Mail } from 'lucide-react';
import { CONTENT, UPDATED } from '../data/staticPages';
import NotFound from './NotFound';

/**
 * One component serves /about, /privacy and /terms — the copy differs, the
 * layout does not, so it is defined once. Each route passes its own key.
 */
export default function StaticPage({ page }) {
  const content = CONTENT[page];

  if (!content) return <NotFound />;

  return (
    <>
      <header className="border-b border-line">
        <div className="shell py-10 lg:py-16">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-1.5 text-[0.75rem] text-ink-40">
              <li>
                <Link to="/" className="link-underline hover:text-ink">
                  Home
                </Link>
              </li>
              <ChevronRight size={12} strokeWidth={1.5} aria-hidden="true" />
              <li aria-current="page" className="text-ink">
                {content.title}
              </li>
            </ol>
          </nav>

          <p className="t-eyebrow mt-6 text-ink-40">{content.eyebrow}</p>
          <h1 className="t-page mt-3 max-w-2xl">{content.title}</h1>
          <p className="t-body mt-4 max-w-xl text-[1.0625rem]">{content.lede}</p>
        </div>
      </header>

      <div className="shell py-12 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-20">
          <div className="max-w-2xl">
            {content.sections.map((section) => (
              <section key={section.heading} className="border-t border-line py-8 first:border-0 first:pt-0">
                <h2 className="t-section !text-xl sm:!text-2xl">{section.heading}</h2>
                <div className="mt-4 flex flex-col gap-4">
                  {section.body.map((paragraph) => (
                    <p key={paragraph} className="t-body">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}

            <p className="t-caption mt-10 border-t border-line pt-6">{UPDATED}</p>
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="border border-line p-6">
              <h2 className="t-eyebrow text-ink-40">Questions</h2>
              <p className="mt-3 text-[0.875rem] leading-relaxed text-ink-60">
                Something here unclear, or about an order you placed?
              </p>
              <Link
                to="/contact"
                className="link-underline mt-4 inline-flex items-center gap-2 text-[0.8125rem] text-ink"
              >
                <Mail size={14} strokeWidth={1.75} aria-hidden="true" />
                Contact us
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
