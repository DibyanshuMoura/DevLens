import { useState } from "react";
import { ScoreMeter } from "./Panel";

function Avatar({ src, name }) {
  const [failed, setFailed] = useState(false);
  const initial = String(name || "?").trim().charAt(0).toUpperCase() || "?";

  if (!src || failed) {
    return (
      <span
        aria-hidden="true"
        className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border border-edge
          bg-canvas text-muted flex items-center justify-center text-3xl
          font-bold anim-pop-in shrink-0"
      >
        {initial}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={name || "Profile picture"}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border border-edge anim-pop-in shrink-0"
    />
  );
}

const ProfileHeader = ({ data }) => (
  <div className="border border-edge bg-surface p-5 flex flex-col sm:flex-row items-center gap-5">
    <Avatar src={data.dp} name={data.name} />
    <div className="flex-1 text-center sm:text-left min-w-0">
      <a
        href={data.id}
        target="_blank"
        rel="noopener noreferrer"
        className="text-2xl font-bold hover:underline break-all"
      >
        {data.name}
      </a>
      <p className="text-muted text-sm mt-1 leading-relaxed">
        {data.res?.summary}
      </p>
    </div>
    <ScoreMeter value={data.res?.score} caption="profile score / 100" />
  </div>
);

export default ProfileHeader;
