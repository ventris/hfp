export const isBot = () => {
  const gl = document.createElement("canvas").getContext("webgl");
  const vendor = gl?.getParameter(gl.VENDOR);
  const renderer = gl?.getParameter(gl.RENDERER);

  const highPriorityFlags = [
    Boolean(window._phantom),
    Boolean(window.callPhantom),
    Boolean(window.__nightmare),
    Boolean(window.__selenium_unwrapped),
    Boolean(window.__selenium_evaluate),
    Boolean(window.__webdriver_script_fn),
    navigator.webdriver === true,
    navigator.userAgent.includes("HeadlessChrome"),
    !Boolean(document.createElement("canvas").getContext("2d")),
    renderer.includes("SwiftShader"),
    renderer.includes("llvmpipe"),
    renderer.includes("Mesa OffScreen"),
    gl === null,
    vendor === null,
    renderer === null,
    navigator.hardwareConcurrency <= 1,
    navigator.maxTouchPoints === 0 && navigator.userAgent.includes("Mobile"),
  ];

  const mediumPriorityFlags = [
    navigator.languages.length === 0,
    // The browser claims to be Chrome (via User-Agent) but doesn’t expose Chrome’s JS runtime object
    !window.chrome && navigator.userAgent.includes("Chrome"),
    navigator.vendor !== "Google Inc." &&
      navigator.userAgent.includes("Chrome"),
    screen.width === 0 || screen.height === 0,
    window.devicePixelRatio === 1 && screen.width >= 1920,
    navigator.deviceMemory && navigator.deviceMemory < 2,
    vendor === "Google Inc." && renderer?.includes("Apple"),
    vendor === "Apple Inc." && renderer?.includes("ANGLE"),
    !Boolean(navigator.pdfViewerEnabled),
  ];

  const lowPriorityFlags = [
    // In real browsers, default state is "default", "denied" only after user action or policy
    // In headless / automated browsers: Often hardcoded to "denied"
    // navigator.permissions
    //   ?.query({ name: "notifications" })
    //   .then((p) => p.state === "denied"),
    renderer === "WebKit WebGL" || renderer === "WebGL Renderer",
    !Boolean(navigator.platform),
    !Boolean(window.AudioContext) && !Boolean(window.webkitAudioContext),
    // Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.language !== navigator.languages?.[0],
    "ontouchstart" in window === false && navigator.maxTouchPoints > 0,
    typeof Promise === "undefined",
    typeof fetch === "undefined",
  ];

  const nHigh = highPriorityFlags.filter((flag) => flag === true).length;
  const nMedium = mediumPriorityFlags.filter((flag) => flag === true).length;
  const nLow = lowPriorityFlags.filter((flag) => flag === true).length;

  const score = nHigh * 40 + nMedium * 25 + nLow * 10;

  const totalPossibleScore =
    highPriorityFlags.length * 40 +
    mediumPriorityFlags.length * 25 +
    lowPriorityFlags.length * 10;

  const botProbability =
    Math.round(((score * 100) / totalPossibleScore) * 100) / 100;

  return {
    highPriorityFlags,
    mediumPriorityFlags,
    lowPriorityFlags,
    score,
    totalPossibleScore,
    botProbability,
  };
};
