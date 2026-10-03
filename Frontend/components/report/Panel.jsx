export const Panel = ({
  title,
  description,
  actions,
  children,
  className = "",
}) => (
  <section className={`border border-edge bg-surface p-5 ${className}`}>
    {(title || actions) && (
      <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <div className="min-w-0">
          {title && <h3 className="font-medium">{title}</h3>}
          {description && (
            <p className="text-muted text-xs mt-0.5 leading-relaxed">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
    )}
    {children}
  </section>
);

export const ScoreMeter = ({
  value,
  max = 100,
  suffix = "",
  caption = "",
  size = "text-4xl",
}) => {
  const hasValue = typeof value === "number" && Number.isFinite(value);
  const pct = hasValue ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div className="flex flex-col items-end gap-1 shrink-0">
      <span className={`${size} font-bold tabular-nums`}>
        {hasValue ? value : "–"}
        {hasValue && suffix && (
          <span className="text-muted text-sm font-normal">{suffix}</span>
        )}
      </span>
      {caption && (
        <span className="text-[0.625rem] text-muted uppercase tracking-widest">
          {caption}
        </span>
      )}
      <div className="h-1.5 w-32 bg-line overflow-hidden">
        <div className="score-bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

export const BulletList = ({ items = [], className = "", muted = false }) => (
  <ul
    className={`list-disc pl-5 wrap-break-word anim-stagger text-sm space-y-1.5 ${
      muted ? "text-muted" : ""
    } ${className}`}
  >
    {items.map((item, i) => (
      <li key={i}>{item}</li>
    ))}
  </ul>
);
