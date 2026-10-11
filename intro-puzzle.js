// =========================================================
// CODE IGNITE — ACM-W × SNDT UMIT
// Puzzle Intro
//
// Wrapped in an IIFE so variables do not clash with script.js.
// Vanilla JavaScript only.
// =========================================================

(() => {
  "use strict";

  // -------------------------------------------------------
  // DOM ELEMENTS
  // -------------------------------------------------------

  const intro = document.querySelector("#intro");
  const igniteButton = document.querySelector("#ignite");
  const replayButton = document.querySelector("#replay");

  // If the intro HTML is not present, safely stop.
  if (!intro || !igniteButton) {
    return;
  }

  // -------------------------------------------------------
  // SETTINGS
  // -------------------------------------------------------

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const isMobile = window.matchMedia(
    "(max-width: 600px)"
  ).matches;

  const hasMouse = window.matchMedia(
    "(pointer: fine)"
  ).matches;

  const sleep = (ms) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const STORAGE_KEY = "acmwIntroSeen";

  // -------------------------------------------------------
  // PIECES
  //
  // text,
  // style,
  // desktop X,
  // desktop Y,
  // rotation,
  // font size,
  // assembly order,
  // mobile [X, Y]
  // -------------------------------------------------------

  const PIECES = [
    ["[ HTML ]", "paper",   14, 16, -8, 1.7,  0, [24, 10]],
    ["{ CSS }",  "tag",     84, 15,  6, 1.6,  1, [76, 13]],
    ["< JS >",   "code",    50,  8, -3, 1.5,  2, [22, 87]],
    ["GitHub",   "ticket",  90, 47,  5, 1.4,  3, [76, 82]],
    ["VS Code",  "sticker", 10, 52, -6, 1.3,  4, null],
    ["ACM-W",    "tag",     20, 84,  4, 1.7,  5, [50, 94]],
    ["SNDT",     "paper",   76, 86, -5, 1.5,  6, null],
    ["UMIT",     "sticker", 62, 92,  7, 1.3,  7, null],
    ["</>",      "code",    33,  9,  9, 1.6,  8, null],
    ["{ }",      "paper",   68,  8, -7, 1.7,  9, null],
    ["( )",      "tag",      9, 30,  8, 1.5, 10, null],
    [";",        "code",    91, 27, -9, 1.7, 11, null],
    ["/",        "ticket",  40, 92, -4, 1.5, 12, null]
  ];

  // -------------------------------------------------------
  // STATE
  // -------------------------------------------------------

  let pieces = [];
  let state = "idle";
  let pointerMoveQueued = false;

  // States:
  // idle
  // assembling
  // done


  // -------------------------------------------------------
  // INITIALIZE PUZZLE
  // -------------------------------------------------------

  function initializePuzzle() {
    /*
     * Remove old pieces first.
     * This is important if the intro is replayed.
     */

    intro.querySelectorAll(".p").forEach((piece) => {
      piece.remove();
    });

    pieces = PIECES
      .filter((piece) => {
        // On mobile only show pieces that have mobile coordinates.
        return !isMobile || piece[7] !== null;
      })
      .map((piece) => {
        const [
          text,
          style,
          desktopX,
          desktopY,
          rotation,
          fontSize,
          order,
          mobilePosition
        ] = piece;

        const element = document.createElement("div");

        element.className = `p ${style}`;

        /*
         * textContent is safer than innerHTML.
         * It also means < JS > and </> won't accidentally
         * become HTML elements.
         */

        const inner = document.createElement("span");

        inner.className = "in";
        inner.textContent = text;

        element.appendChild(inner);

        element.style.setProperty(
          "--fs",
          `${fontSize}rem`
        );

        element.style.setProperty(
          "--t",
          `${6 + Math.random() * 4}s`
        );

        inner.style.setProperty(
          "--w",
          `${-Math.random() * 5}s`
        );

        intro.appendChild(element);

        return {
          el: element,

          x: isMobile
            ? mobilePosition[0]
            : desktopX,

          y: isMobile
            ? mobilePosition[1]
            : desktopY,

          rot: rotation,

          order
        };
      });
  }


  // -------------------------------------------------------
  // SCATTER PIECES
  // -------------------------------------------------------

  function scatterPieces() {
    pieces.forEach((piece, index) => {
      const element = piece.el;

      element.style.left = `${piece.x}%`;
      element.style.top = `${piece.y}%`;

      element.style.setProperty(
        "--r",
        `${piece.rot}deg`
      );

      element.style.setProperty(
        "--s",
        "1"
      );

      /*
       * Small staggered entrance.
       */

      window.setTimeout(() => {
        element.classList.add("on");
      }, 100 + index * 70);
    });
  }


  // -------------------------------------------------------
  // ASSEMBLE PIECES
  // -------------------------------------------------------

  async function assemblePieces() {
    intro.classList.add("assembling");

    /*
     * Sort according to the assembly order.
     */

    const orderedPieces = [...pieces].sort(
      (a, b) => a.order - b.order
    );

    for (let i = 0; i < orderedPieces.length; i++) {
      const piece = orderedPieces[i];

      /*
       * Create a small circular movement around
       * the center so the pieces don't all land
       * at exactly the same pixel.
       */

      const angle = i * 2.4;

      const radius =
        (isMobile ? 18 : 30) +
        (i % 4) * (isMobile ? 10 : 16);

      const x =
        Math.cos(angle) * radius;

      const y =
        Math.sin(angle) * radius;

      piece.el.style.left =
        `calc(50% + ${x}px)`;

      piece.el.style.top =
        `calc(50% + ${y}px)`;

      piece.el.style.setProperty(
        "--r",
        `${i % 2 ? 5 : -5}deg`
      );

      piece.el.style.setProperty(
        "--s",
        "0.85"
      );

      piece.el.style.zIndex =
        `${10 + i}`;

      /*
       * Arrival/snap effect.
       */

      window.setTimeout(() => {
        piece.el.classList.add("snap");
      }, 120);

      /*
       * Stagger the assembly.
       */

      await sleep(
        i < 8
          ? 210
          : 120
      );
    }

    /*
     * Give the final piece time to settle.
     */

    await sleep(500);
  }


  // -------------------------------------------------------
  // SHOW CODE IGNITE
  // -------------------------------------------------------

  async function showCodeIgnite() {

    /*
     * These classes should be handled by your CSS.
     *
     * collapse:
     * pieces disappear/melt together
     *
     * flash:
     * cyan glow
     *
     * title:
     * CODE IGNITE appears
     */

    intro.classList.add(
      "collapse",
      "flash",
      "title"
    );

    /*
     * Reduced motion gets a shorter pause.
     */

    await sleep(
      reduceMotion
        ? 500
        : 1500
    );
  }


  // -------------------------------------------------------
  // TRANSITION TO HOMEPAGE
  // -------------------------------------------------------

  async function transitionToHome() {

    intro.classList.add("expand");

    await sleep(
      reduceMotion
        ? 100
        : 700
    );

    finishIntro(true);
  }


  // -------------------------------------------------------
  // FINISH INTRO
  // -------------------------------------------------------

  function finishIntro(smooth = true) {

    /*
     * Prevent this function from running twice.
     */

    if (state === "done") {
      return;
    }

    state = "done";

    /*
     * Remember that the visitor completed
     * the intro.
     */

    localStorage.setItem(
      STORAGE_KEY,
      "true"
    );

    /*
     * Restore page scrolling.
     */

    document.body.style.overflow = "";

    /*
     * Remove pointer listener.
     */

    intro.removeEventListener(
      "pointermove",
      onPointerMove
    );

    /*
     * Smooth fade-out.
     */

    if (smooth) {

      intro.classList.add("out");

      window.setTimeout(() => {
        intro.style.display = "none";
      }, 950);

    } else {

      intro.style.display = "none";
    }

    /*
     * Tell the existing homepage:
     *
     * "The intro is finished."
     */

    window.dispatchEvent(
      new CustomEvent("introDone")
    );
  }


  // -------------------------------------------------------
  // SKIP INTRO
  // -------------------------------------------------------

  function skipIntro() {

    if (state === "done") {
      return;
    }

    finishIntro(false);
  }


  // -------------------------------------------------------
  // IGNITE
  // -------------------------------------------------------

  async function ignite() {

    /*
     * Don't allow multiple clicks.
     */

    if (state !== "idle") {
      return;
    }

    state = "assembling";

    intro.classList.remove("hover");

    /*
     * Reduced-motion users skip the physical
     * puzzle assembly.
     */

    if (!reduceMotion) {
      await assemblePieces();
    }

    await showCodeIgnite();

    await transitionToHome();
  }


  // -------------------------------------------------------
  // MOUSE / POINTER INTERACTION
  // -------------------------------------------------------

  function onPointerMove(event) {

    /*
     * Only react while the puzzle is waiting
     * for the user.
     */

    if (
      state !== "idle" ||
      pointerMoveQueued
    ) {
      return;
    }

    pointerMoveQueued = true;

    requestAnimationFrame(() => {

      pointerMoveQueued = false;

      /*
       * CSS can use these variables for
       * a cursor-following glow.
       */

      intro.style.setProperty(
        "--cx",
        `${event.clientX}px`
      );

      intro.style.setProperty(
        "--cy",
        `${event.clientY}px`
      );

      /*
       * Give pieces near the cursor
       * a tiny physical reaction.
       */

      for (const piece of pieces) {

        const rect =
          piece.el.getBoundingClientRect();

        const pieceX =
          rect.left + rect.width / 2;

        const pieceY =
          rect.top + rect.height / 2;

        const dx =
          pieceX - event.clientX;

        const dy =
          pieceY - event.clientY;

        const distance =
          Math.hypot(dx, dy) || 1;

        const influence =
          Math.max(
            0,
            1 - distance / 200
          );

        const moveX =
          (dx / distance) *
          influence *
          14;

        const moveY =
          (dy / distance) *
          influence *
          14;

        const rotate =
          (dx > 0 ? 1 : -1) *
          influence *
          2;

        piece.el.style.setProperty(
          "--dx",
          `${moveX}px`
        );

        piece.el.style.setProperty(
          "--dy",
          `${moveY}px`
        );

        piece.el.style.setProperty(
          "--mr",
          `${rotate}deg`
        );
      }
    });
  }


  // -------------------------------------------------------
  // KEYBOARD
  // -------------------------------------------------------

  function handleKeydown(event) {

    /*
     * Enter = Ignite
     */

    if (
      event.key === "Enter" &&
      state === "idle"
    ) {

      event.preventDefault();

      ignite();

      return;
    }

    /*
     * Escape = Skip
     */

    if (event.key === "Escape") {

      event.preventDefault();

      skipIntro();
    }
  }


  // -------------------------------------------------------
  // START INTRO
  // -------------------------------------------------------

  function startIntro() {

    /*
     * ?intro=replay forces the intro to appear.
     */

    const replayRequested =
      new URLSearchParams(
        window.location.search
      ).get("intro") === "replay";

    if (replayRequested) {
      localStorage.removeItem(
        STORAGE_KEY
      );
    }

    /*
     * If the visitor has already seen
     * the intro, don't show it again.
     */

    if (
      localStorage.getItem(
        STORAGE_KEY
      ) === "true"
    ) {

      skipIntro();

      return;
    }

    /*
     * Lock page scrolling.
     */

    document.body.style.overflow =
      "hidden";

    /*
     * Reduced motion:
     * skip the physical assembly but
     * still show the CODE IGNITE branding.
     */

    if (reduceMotion) {

      state = "assembling";

      showCodeIgnite()
        .then(transitionToHome);

      return;
    }

    /*
     * Normal animation.
     */

    initializePuzzle();

    scatterPieces();

    /*
     * Mouse interaction only on
     * devices with a real pointer.
     */

    if (hasMouse) {

      intro.addEventListener(
        "pointermove",
        onPointerMove
      );
    }

    /*
     * Accessibility:
     * put keyboard focus on the
     * Ignite button.
     */

    igniteButton.focus({
      preventScroll: true
    });
  }


  // -------------------------------------------------------
  // EVENT LISTENERS
  // -------------------------------------------------------

  igniteButton.addEventListener(
    "click",
    ignite
  );

  document.addEventListener(
    "keydown",
    handleKeydown
  );

  /*
   * Development replay button.
   */

  if (replayButton) {

    replayButton.addEventListener(
      "click",
      () => {

        localStorage.removeItem(
          STORAGE_KEY
        );

        const url =
          new URL(
            window.location.href
          );

        url.searchParams.set(
          "intro",
          "replay"
        );

        window.location.href =
          url.toString();
      }
    );
  }
  // -------------------------------------------------------
  // START
  // -------------------------------------------------------

  startIntro();
})();