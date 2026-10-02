import { SkillIcon } from "../../src/lib/skillIcons";
import { Panel } from "./Panel";

const TechStack = ({ skills = [], languages = [], isDark }) => (
  <Panel title="Tech Stack">
    {skills.length > 0 ? (
      <div className="flex flex-wrap gap-2">
        {skills.map((s, i) => (
          <span
            key={`${s}-${i}`}
            className="inline-flex items-center gap-1.5 border border-edge px-2.5 py-1 text-sm anim-pop-in press"
          >
            <SkillIcon skill={s} isDark={isDark} />
            {s}
          </span>
        ))}
      </div>
    ) : (
      <p className="text-muted text-sm">No skills detected.</p>
    )}
    {languages.length > 0 && (
      <p className="text-muted text-xs mt-4">
        Top languages: {languages.join(", ")}
      </p>
    )}
  </Panel>
);

export default TechStack;
