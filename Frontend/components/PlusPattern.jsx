/* Decorative tiled "+" field. Purely presentational: the glyphs are drawn with an
   SVG mask over a theme colour, so a theme only has to override
   --c-pattern-plus / --pattern-opacity. The host is pointer-events:none, so it
   never swallows clicks meant for the content layered above it. */
const PlusPattern = () => (
  <div className="plusminus-host" aria-hidden="true">
    <div className="plusminus-plus" />
  </div>
);

export default PlusPattern;