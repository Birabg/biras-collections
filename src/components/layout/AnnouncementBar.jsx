const MESSAGES = [
  'Free delivery on orders over 5,000 ETB',
  'Complimentary returns within 14 days',
  'Ethiopia-wide delivery — Addis Ababa in 1–2 days',
];

export default function AnnouncementBar() {
  return (
    <div className="bg-ink text-paper" role="region" aria-label="Store announcements">
      {/* Single message on mobile, a quiet rotation on wider screens */}
      <p className="t-eyebrow mx-auto max-w-[90rem] truncate px-5 py-2.5 text-center text-[0.625rem] text-paper/90 lg:hidden">
        {MESSAGES[0]}
      </p>

      <div className="hidden lg:block">
        <ul className="mx-auto flex max-w-[90rem] items-center justify-between gap-6 px-12 py-2.5">
          {MESSAGES.map((message) => (
            <li key={message} className="t-eyebrow text-[0.625rem] text-paper/70">
              {message}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
