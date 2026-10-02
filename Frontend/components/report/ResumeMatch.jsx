import { Panel } from "./Panel";

const ResumeMatch = ({ points = [] }) => {
  if (points.length === 0) return null;

  return (
    <Panel title="Resume ↔ GitHub Match">
      <ul className="grid grid-cols-1 md:grid-cols-3 gap-3 anim-stagger">
        {points.map((m, i) => (
          <li
            key={i}
            className="border border-line p-3 text-sm leading-relaxed"
          >
            {m}
          </li>
        ))}
      </ul>
    </Panel>
  );
};

export default ResumeMatch;
