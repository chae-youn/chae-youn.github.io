// 살짝 부드러운 스크롤 + 페이지 끝에서 튕기는 효과
// - 모션 줄이기 설정을 켠 사용자, 터치 기기에서는 동작하지 않아요.
(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  // ---- 살짝 부드러운 스크롤 ----
  if (typeof Lenis !== "undefined") {
    var lenis = new Lenis({
      lerp: 0.2,             // 0~1. 클수록 즉각적, 작을수록 미끄러지듯 (Lenis 기본 0.1)
      wheelMultiplier: 0.85, // 휠 한 번에 움직이는 거리 (1 = 브라우저 기본)
    });
    (function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    })(performance.now());
  }

  // ---- 끝에서 튕기기 ----

  var BOUNCE = {
    stiffness: 0.1, // 클수록 빨리 돌아와요
    damping: 0.78,   // 작을수록 더 많이 출렁여요
    maxOffset: 0,   // 최대로 밀리는 거리(px)
  };
  var target = document.body;
  var offset = 0;
  var velocity = 0;
  var running = false;

  function push(amount) {
    velocity += amount;
    if (!running) {
      running = true;
      requestAnimationFrame(step);
    }
  }

  function step() {
    velocity += -offset * BOUNCE.stiffness;
    velocity *= BOUNCE.damping;
    offset = Math.max(-BOUNCE.maxOffset, Math.min(BOUNCE.maxOffset, offset + velocity));

    if (Math.abs(offset) < 0.1 && Math.abs(velocity) < 0.1) {
      offset = velocity = 0;
      target.style.transform = "";
      running = false;
      return;
    }
    target.style.transform = "translate3d(0," + offset.toFixed(2) + "px,0)";
    requestAnimationFrame(step);
  }

  function maxScroll() { return document.documentElement.scrollHeight - window.innerHeight; }
  function atTop() { return window.scrollY <= 0.5; }
  function atBottom() { return window.scrollY >= maxScroll() - 0.5; }

  // 스크롤하다가 끝에 "도착"하는 순간: 속도만큼 부딪힘
  var lastY = window.scrollY;
  var lastT = performance.now();
  var wasAtEdge = atTop() || atBottom();
  window.addEventListener("scroll", function () {
    var now = performance.now();
    var speed = (window.scrollY - lastY) / Math.max(now - lastT, 1) * 16; // px/frame
    var edge = atTop() || atBottom();
    if (edge && !wasAtEdge) {
      push(Math.max(-12, Math.min(12, -speed * 0.6)));
    }
    wasAtEdge = edge;
    lastY = window.scrollY;
    lastT = now;
  }, { passive: true });

  // 이미 끝에 있는데 계속 스크롤할 때: 조금씩 밀렸다가 돌아옴
  window.addEventListener("wheel", function (e) {
    if ((atTop() && e.deltaY < 0) || (atBottom() && e.deltaY > 0)) {
      var resistance = 1 - Math.abs(offset) / BOUNCE.maxOffset;
      push(Math.max(-6, Math.min(6, -e.deltaY * 0.08)) * resistance);
    }
  }, { passive: true });
})();
