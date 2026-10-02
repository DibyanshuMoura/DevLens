import { Panel, ScoreMeter, BulletList } from "./Panel";

const KIND_LABEL = { learn: "Learn", build: "Build" };

const RoadmapItem = ({ item }) => {
  const kind = item.kind === "build" ? "build" : "learn";
  return (
    <div className="border border-line p-3 flex flex-col lift">
      <span className="text-[9px] uppercase tracking-widest text-muted self-start
        border border-line px-1.5 py-0.5">
        {KIND_LABEL[kind]}
      </span>
      <p className="font-medium text-sm mt-2">{item.title}</p>
      {item.detail && (
        <p className="text-muted text-xs mt-1 leading-relaxed">{item.detail}</p>
      )}
      {item.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {item.skills.map((s, i) => (
            <span
              key={`${s}-${i}`}
              className="border border-line px-1.5 py-0.5 text-[10px] wrap-break-word"
            >
              {s}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

const RoleFit = ({ role, fit, className = "" }) => {
  if (!fit) return null;
  const label = role || "target role";

  return (
    <Panel
      title={`Role Fit — ${label}`}
      description={`Add these to your resume to boost your chances for ${label}.`}
      className={`anim-rise-in ${className}`}
      actions={
        typeof fit.score === "number" ? (
          <ScoreMeter
            value={fit.score}
            suffix="/100"
            caption="role fit"
            size="text-2xl"
          />
        ) : null
      }
    >
      {fit.summary && (
        <p className="text-sm leading-relaxed mb-4">{fit.summary}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {fit.strengths?.length > 0 && (
          <div className="border border-line p-3">
            <p className="font-medium text-sm mb-2">Working in your favor</p>
            <BulletList items={fit.strengths} muted />
          </div>
        )}
        {fit.gaps?.length > 0 && (
          <div className="border border-line p-3">
            <p className="font-medium text-sm mb-2">
              On GitHub but missing from your resume
            </p>
            <BulletList items={fit.gaps} muted />
          </div>
        )}
      </div>

      {}
      {fit.roadmap?.length > 0 && (
        <div className="mt-4 pt-4 border-t border-line">
          <p className="font-medium text-sm mb-1">What to learn & build next</p>
          <p className="text-muted text-xs mb-3 leading-relaxed">
            The highest-impact moves for this role, most valuable first.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 anim-stagger">
            {fit.roadmap.map((item, i) => (
              <RoadmapItem key={`${item.kind}-${i}`} item={item} />
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
};

export default RoleFit;
