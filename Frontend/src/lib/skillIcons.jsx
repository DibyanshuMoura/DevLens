// Small brand glyphs for the Tech Stack chips.
//
// "si" entries are Simple Icons served from their CDN and recolored through
// the URL (pure monochrome, matches the active theme's ink token).
// "dev" entries are Devicon SVGs drawn as a CSS mask filled with currentColor,
// so they also follow the theme. Any URL that fails to load is hidden by the
// onError handler in SkillIcon — unknown skills simply show their text.

const SI = (slug) => ({ si: slug });
const DEV = (path) => ({ dev: path });

// Keys are checked first as normalized text ("c++"), then stripped of
// spacing/punctuation ("node.js" -> "nodejs").
const TABLE = {
  // symbols
  "c++": SI("cplusplus"),
  "c#": DEV("csharp/csharp-plain"),
  "f#": SI("fsharp"),
  ".net": SI("dotnet"),

  // languages
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

  // frameworks & libraries
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

  // data
  postgres: SI("postgresql"),
  mongo: SI("mongodb"),

  // cloud & devops
  aws: DEV("amazonwebservices/amazonwebservices-original-wordmark"),
  amazonaws: DEV("amazonwebservices/amazonwebservices-original-wordmark"),
  amazonwebservices: DEV("amazonwebservices/amazonwebservices-original-wordmark"),
  azure: DEV("azure/azure-original"),
  microsoftazure: DEV("azure/azure-original"),
  gcp: SI("googlecloud"),
  k8s: SI("kubernetes"),

  // ai / data science
  scikitlearn: SI("scikitlearn"),
  sklearn: SI("scikitlearn"),
  jupyternotebook: SI("jupyter"),

  // web3 / misc aliases
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

  // Best-effort guess from the skill name itself ("Tailwind CSS" works,
  // "Communication" 404s and is hidden by onError).
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
