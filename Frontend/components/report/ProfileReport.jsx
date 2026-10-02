import TechStack from "./TechStack";
import ActivityInsights from "./ActivityInsights";
import ActivityHeatmap from "./ActivityHeatmap";
import RepoQuality from "./RepoQuality";
import BulletColumns from "./BulletColumns";
import ResumeMatch from "./ResumeMatch";
import TopRepos from "./TopRepos";
import ProfileCard from "./ProfileCard";

const ProfileReport = ({ data, isDark }) => {
  const { res, stats } = data;

  return (
    <article className="w-full max-w-6xl flex flex-col gap-6 anim-cascade">
      {}
      <ActivityHeatmap activity={data.activity} />
      <RepoQuality quality={data.quality} />

      {}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TechStack
          skills={res?.skills}
          languages={stats?.languages}
          isDark={isDark}
        />
        <ActivityInsights activity={res?.activity} />
      </div>

      <BulletColumns
        columns={[
          ["Strengths", res?.strengths],
          ["Weaknesses", res?.weaknesses],
          ["Improvements", res?.improvements],
        ]}
      />

      <ResumeMatch points={res?.resumeMatch} />
      <TopRepos repos={stats?.topRepos} />

      <ProfileCard data={data} />
    </article>
  );
};

export default ProfileReport;
