import { Panel, BulletList } from "./Panel";

const BulletColumns = ({ columns }) => {
  const visible = columns.filter(([, items]) => items?.length > 0);
  if (visible.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {visible.map(([title, items]) => (
        <Panel key={title} title={title}>
          <BulletList items={items} />
        </Panel>
      ))}
    </div>
  );
};

export default BulletColumns;
