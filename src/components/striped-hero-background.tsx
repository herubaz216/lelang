export function StripedHeroBackground() {
  return (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50 via-white to-white" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `repeating-linear-gradient(
            -32deg,
            transparent,
            transparent 18px,
            rgba(79, 70, 229, 0.07) 18px,
            rgba(79, 70, 229, 0.07) 19px
          )`,
          WebkitMaskImage: "linear-gradient(to left, black 0%, transparent 72%)",
          maskImage: "linear-gradient(to left, black 0%, transparent 72%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-[58%] bg-gradient-to-l from-indigo-200/25 via-indigo-100/10 to-transparent"
      />
    </>
  );
}
