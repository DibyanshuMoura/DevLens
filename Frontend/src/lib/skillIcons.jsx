const SI = (slug) => ({ si: slug });
const DEV = (path) => ({ dev: path });

const TABLE = {
  "c++": SI("cplusplus"),
  "c#": DEV("csharp/csharp-plain"),
  "f#": SI("fsharp"),
  ".net": SI("dotnet"),

  js: SI("javascript"),
  es6: SI("javascript"),
  ts: SI("typescript"),
  py: SI("python"),
  golang: SI("go"),
  cpp: SI("cplusplus"),
  csharp: DEV("csharp/csharp-plain"),
  "c sharp": DEV("csharp/csharp-plain"),
  java: DEV("java/java-plain"),
  matlab: DEV("matlab/matlab-original"),
  html: SI("html5"),
  css: SI("css"),
  css3: SI("css"),
  scss: SI("sass"),

  node: SI("nodedotjs"),
  nodejs: SI("nodedotjs"),
  next: SI("nextdotjs"),
  nextjs: SI("nextdotjs"),
  vue: SI("vuedotjs"),
  vuejs: SI("vuedotjs"),
  nuxt: SI("nuxt"),
  nuxtjs: SI("nuxt"),
  reactjs: SI("react"),
  reactnative: SI("react"),
  angularjs: SI("angular"),
  express: SI("express"),
  expressjs: SI("express"),
  nest: SI("nestjs"),
  nestjs: SI("nestjs"),
  three: SI("threedotjs"),
  threejs: SI("threedotjs"),
  tailwind: SI("tailwindcss"),
  tailwindcss: SI("tailwindcss"),
  mui: SI("mui"),
  materialui: SI("mui"),
  rails: SI("rubyonrails"),
  spring: SI("spring"),
  springboot: SI("springboot"),
  unity3d: SI("unity"),
  unreal: SI("unrealengine"),
  godot: DEV("godot/godot-plain"),
  godotengine: DEV("godot/godot-plain"),

  postgres: SI("postgresql"),
  mongo: SI("mongodb"),

  aws: DEV("amazonwebservices/amazonwebservices-original-wordmark"),
  amazonaws: DEV("amazonwebservices/amazonwebservices-original-wordmark"),
  amazonwebservices: DEV("amazonwebservices/amazonwebservices-original-wordmark"),
  azure: DEV("azure/azure-original"),
  microsoftazure: DEV("azure/azure-original"),
  gcp: SI("googlecloud"),
  k8s: SI("kubernetes"),

  scikitlearn: SI("scikitlearn"),
  sklearn: SI("scikitlearn"),
  jupyternotebook: SI("jupyter"),

  ethersjs: SI("ethers"),
  web3js: SI("web3dotjs"),
  socketio: SI("socketdotio"),
};

const normalize = (skill) =>
  String(skill ?? "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

const strip = (s) => s.replace(/[\s.+#&/()]/g, "");

const siUrl = (slug, isDark) =>
  `https://cdn.simpleicons.org/${slug}/${isDark ? "f5f5f5" : "000000"}`;

export const skillIcon = (skill, isDark) => {
  const norm = normalize(skill);
  if (!norm) return null;
  const stripped = strip(norm);
  const hit = TABLE[norm] || (stripped && TABLE[stripped]);

  if (hit?.si) return { si: siUrl(hit.si, isDark) };
  if (hit?.dev)
    return {
      dev: `https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/${hit.dev}.svg`,
    };

  if (stripped) return { si: siUrl(stripped, isDark) };
  return null;
};

export const SkillIcon = ({ skill, isDark }) => {
  const icon = skillIcon(skill, isDark);
  if (!icon) return null;

  if (icon.si) {
    return (
      <img
        src={icon.si}
        alt=""
        aria-hidden="true"
        loading="lazy"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
        className="h-4 w-4 shrink-0"
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className="h-4 w-4 shrink-0 bg-current"
      style={{
        WebkitMaskImage: `url("${icon.dev}")`,
        maskImage: `url("${icon.dev}")`,
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
      }}
    />
  );
};
