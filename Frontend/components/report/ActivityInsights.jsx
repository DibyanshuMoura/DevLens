import { Panel } from "./Panel";

const ActivityInsights = ({ activity = [] }) => (
  <Panel title="Activity Insights" className="lg:col-span-2">
    {activity.length > 0 ? (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 anim-stagger">
        {activity.map((a) => (
          <div key={a.title} className="border border-line p-3">
            <p className="font-medium text-sm">{a.title}</p>
            <p className="text-muted text-xs mt-1 leading-relaxed">
              {a.detail}
            </p>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-muted text-sm">No activity data.</p>
    )}
  </Panel>
);

export default ActivityInsights;
