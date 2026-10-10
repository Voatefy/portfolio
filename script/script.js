(function () {
  var body = document.body,
    intro = document.getElementById("intro");
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var seen = false;
  try {
    seen = sessionStorage.getItem("intro-seen") === "1";
  } catch (e) {}

  function reveal() {
    body.classList.remove("locked");
    body.classList.add("ready");
  }
  function finish() {
    try {
      sessionStorage.setItem("intro-seen", "1");
    } catch (e) {}
    intro.classList.add("out");
    setTimeout(reveal, 450);
  }

  // letter-level split (used by the intro)
  function split(root) {
    var idx = 0;
    (function walk(node) {
      [].slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) {
              frag.appendChild(document.createTextNode(" "));
              return;
            }
            var g = document.createElement("span");
            g.className = "g";
            p.split("").forEach(function (c) {
              var l = document.createElement("span");
              l.className = "l";
              l.style.setProperty("--i", idx++);
              l.textContent = c;
              g.appendChild(l);
            });
            frag.appendChild(g);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1) walk(n);
      });
    })(root);
  }

  if (seen || reduce) {
    intro.style.display = "none";
    reveal();
  } else {
    var words = [].slice.call(intro.querySelectorAll(".word")),
      verdict = intro.querySelector(".verdict"),
      ticks = intro.querySelectorAll(".ticks i"),
      wrap = intro.querySelector(".stage-wrap");
    words.forEach(split);
    split(verdict.querySelector(".mask"));
    var t = 350;
    words.forEach(function (w, i) {
      setTimeout(function () {
        w.classList.add("in");
        ticks[i].classList.add("on");
      }, t);
      setTimeout(function () {
        w.classList.add("out");
      }, t + 950);
      t += 1000;
    });
    t += 250;
    setTimeout(function () {
      wrap.classList.add("fin");
      verdict.classList.add("in");
    }, t);
    setTimeout(finish, t + 2300);
  }

  // Scroll: top bar after the hero, active menu link, light/dark cursor context
  var ids = [
    "about",
    "academics",
    "projects",
    "awards",
    "impact",
    "stack",
    "chat",
    "contact",
  ];
  var els = ids.map(function (i) {
    return document.getElementById(i);
  });
  var tlinks = [].slice.call(document.querySelectorAll(".topbar .menu a")),
    ticking = false;
  function onScroll() {
    body.classList.toggle("past", scrollY > 60);
    var y = scrollY + innerHeight * 0.5,
      cur = "top";
    for (var i = 0; i < els.length; i++) {
      if (y >= els[i].offsetTop) cur = ids[i];
    }
    var shown = cur === "chat" ? "contact" : cur;
    tlinks.forEach(function (a) {
      a.classList.toggle("on", a.dataset.s === shown);
    });
    body.classList.toggle(
      "on-light",
      els[els.length - 1].getBoundingClientRect().top < innerHeight * 0.5,
    );
    ticking = false;
  }
  addEventListener(
    "scroll",
    function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(onScroll);
      }
    },
    { passive: true },
  );
  onScroll();

  // Scroll reveal for the lower pages
  var srs = [].slice.call(document.querySelectorAll(".sr"));
  if (reduce || !("IntersectionObserver" in window)) {
    srs.forEach(function (e) {
      e.classList.add("in");
    });
  } else {
    var rio = new IntersectionObserver(
      function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          var el = e.target,
            i = srs.indexOf(el);
          el.style.transitionDelay = (i % 4) * 80 + "ms";
          el.classList.add("in");
          rio.unobserve(el);
          setTimeout(function () {
            el.style.transitionDelay = "";
          }, 1400); // keep hover effects instant afterwards
        });
      },
      { threshold: 0.12 },
    );
    srs.forEach(function (e) {
      rio.observe(e);
    });
  }

  // About: dotted contour shape (two overlapping blobs, slowly morphing)
  var cv = document.getElementById("blob");
  if (cv) {
    var ctx = cv.getContext("2d"),
      dpr = Math.min(window.devicePixelRatio || 1, 2),
      W = 0,
      H = 0,
      vis = true,
      px = 0,
      py = 0,
      tx = 0,
      ty = 0;
    var colsA = ["#10B981", "#10B981", "#047857", "#9CA3AF"],
      colsB = ["#047857", "#ECFDF5", "#6B7280"];
    function size() {
      var r = cv.getBoundingClientRect();
      W = r.width;
      H = r.height;
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function shape(cx, cy, R, t, seed, cols, K, alpha) {
      for (var k = 1; k <= K; k++) {
        var s = k / K,
          n = Math.round(34 + s * 108),
          rad = 0.8 + s * 1.2;
        for (var j = 0; j < n; j++) {
          var a = (j / n) * 6.2832;
          var w =
            1 +
            0.26 * Math.sin(3 * a + t * 0.5 + seed) +
            0.16 * Math.sin(5 * a - t * 0.35 + s * 3 + seed * 2) +
            0.1 * Math.sin(2 * a + t * 0.25 - s * 2);
          var r = R * s * w;
          ctx.fillStyle =
            cols[Math.floor((a / 6.2832) * cols.length + s * 2) % cols.length];
          ctx.globalAlpha = alpha * (0.25 + s * 0.6);
          ctx.beginPath();
          ctx.arc(
            cx + r * Math.cos(a) + (1 - s) * 18 * Math.sin(t * 0.4 + seed),
            cy +
              r * Math.sin(a) * 0.78 +
              (1 - s) * 14 * Math.cos(t * 0.35 + seed),
            rad,
            0,
            6.2832,
          );
          ctx.fill();
        }
      }
    }
    function draw(ms) {
      var t = ms / 1000,
        m = Math.min(W, H);
      px += (tx - px) * 0.05;
      py += (ty - py) * 0.05;
      ctx.clearRect(0, 0, W, H);
      shape(
        W * 0.62 + px * 0.6,
        H * 0.6 + py * 0.6,
        m * 0.36,
        t + 2,
        2.1,
        colsB,
        18,
        0.45,
      );
      shape(W * 0.38 + px, H * 0.46 + py, m * 0.44, t, 0, colsA, 20, 1);
      ctx.globalAlpha = 1;
    }
    size();
    addEventListener("resize", size);
    if (reduce) {
      draw(2500);
    } else {
      if ("IntersectionObserver" in window)
        new IntersectionObserver(function (e) {
          vis = e[0].isIntersecting;
        }).observe(cv);
      addEventListener(
        "mousemove",
        function (e) {
          tx = (e.clientX / innerWidth - 0.5) * 40;
          ty = (e.clientY / innerHeight - 0.5) * 30;
        },
        { passive: true },
      );
      (function frame(ms) {
        if (vis) draw(ms);
        requestAnimationFrame(frame);
      })(0);
    }
  }

  // Name: split into letters for the hover wave
  var k = 0;
  document.querySelectorAll(".nm>span").forEach(function (line) {
    var txt = line.textContent;
    line.textContent = "";
    line.setAttribute("aria-hidden", "true");
    txt.split("").forEach(function (c) {
      var e = document.createElement("span");
      e.className = "ch";
      e.style.setProperty("--i", k++);
      e.textContent = c;
      line.appendChild(e);
    });
  });

  // Round cursor: dot + trailing ring, changes on name and on buttons/links
  if (matchMedia("(hover:hover) and (pointer:fine)").matches) {
    var dot = document.querySelector(".cur-dot"),
      ring = document.querySelector(".cur-ring");
    var mx = -100,
      my = -100,
      rx = -100,
      ry = -100,
      fx = null,
      items = [];
    function clearFx() {
      if (!fx) return;
      fx.style.removeProperty("--mx");
      fx.style.removeProperty("--my");
      items.forEach(function (el) {
        el.style.removeProperty("--lx");
        el.style.removeProperty("--ly");
      });
      fx = null;
      items = [];
    }
    addEventListener(
      "mousemove",
      function (e) {
        mx = e.clientX;
        my = e.clientY;
        body.classList.add("has-cur");
      },
      { passive: true },
    );
    document.documentElement.addEventListener("mouseleave", function () {
      body.classList.remove("has-cur");
      clearFx();
      delete body.dataset.state;
    });
    document.addEventListener("mouseover", function (e) {
      var t = e.target.closest && e.target.closest("[data-cur],a");
      if (t) body.dataset.state = t.dataset.cur || "link";
      else delete body.dataset.state;
      var f = e.target.closest && e.target.closest(".fx");
      if (f !== fx) {
        clearFx();
        if (f) {
          fx = f;
          items = [].slice.call(f.querySelectorAll(".ink,.ch"));
        }
      }
    });
    (function loop() {
      rx += (mx - rx) * 0.24;
      ry += (my - ry) * 0.24;
      dot.style.transform =
        "translate3d(" + mx + "px," + my + "px,0) translate(-50%,-50%)";
      ring.style.transform =
        "translate3d(" + rx + "px," + ry + "px,0) translate(-50%,-50%)";
      if (fx) {
        var r = fx.getBoundingClientRect(),
          rects = items.map(function (el) {
            return el.getBoundingClientRect();
          });
        fx.style.setProperty("--mx", rx - r.left + "px");
        fx.style.setProperty("--my", ry - r.top + "px");
        items.forEach(function (el, i) {
          el.style.setProperty("--lx", rx - rects[i].left + "px");
          el.style.setProperty("--ly", ry - rects[i].top + "px");
        });
      }
      requestAnimationFrame(loop);
    })();
  }

  // Impact: scrolling the page shows the cards one by one (the active card scales up and takes the centre)
  var is = document.querySelector(".ishow");
  if (is) {
    var os = is.parentElement,
      tr = is.querySelector(".itrack"),
      cards = [].slice.call(tr.children),
      dts = [].slice.call(is.querySelectorAll(".hdots button")),
      cnt = is.querySelector(".hcount"),
      n = cards.length,
      idx = -1,
      step = 1;
    is.classList.add("auto");
    var top0 = function () {
      return os.getBoundingClientRect().top + scrollY;
    };
    var measure = function () {
      step = innerHeight * 0.8;
      os.style.height = innerHeight + (n - 1) * step + "px";
    };
    var go = function (k, instant) {
      idx = k;
      var c = cards[idx];
      var x = is.clientWidth / 2 - (c.offsetLeft + c.offsetWidth / 2);
      if (instant) tr.style.transition = "none";
      tr.style.transform = "translate3d(" + x + "px,0,0)";
      if (instant) {
        void tr.offsetWidth;
        tr.style.transition = "";
      }
      cards.forEach(function (el, j) {
        el.classList.toggle("on", j === idx);
      });
      dts.forEach(function (d, j) {
        d.classList.toggle("on", j === idx);
      });
      cnt.textContent = "0" + (idx + 1) + " / 0" + n;
      var im = c.querySelector(".wimg");
      is.style.setProperty(
        "--ay",
        tr.offsetTop + im.offsetTop + im.offsetHeight / 2 + "px",
      ); // arrows follow the image's vertical centre
    };
    var update = function () {
      var i = Math.min(
        n - 1,
        Math.max(0, Math.round((scrollY - top0()) / step)),
      );
      if (i !== idx) go(i);
    };
    var toStep = function (j) {
      scrollTo({ top: top0() + j * step, behavior: "instant" });
    };
    measure();
    go(0, true);
    is.querySelector(".iprev").addEventListener("click", function () {
      toStep(Math.max(0, idx - 1));
    });
    is.querySelector(".inext").addEventListener("click", function () {
      toStep(Math.min(n - 1, idx + 1));
    });
    dts.forEach(function (d, j) {
      d.addEventListener("click", function () {
        toStep(j);
      });
    });
    addEventListener("scroll", update, { passive: true });
    var again = function () {
      measure();
      go(Math.max(0, idx), true);
      update();
    };
    addEventListener("resize", again);
    addEventListener("load", again);
  }

  // Message: chat-style contact form. NO backend needed: it posts to a free form-to-email service (Web3Forms).
  // 1) web3forms.com -> enter tefiniaina.pro@gmail.com -> copy the access key.  2) Paste it below.
  var WEB3FORMS_KEY = "YOUR_ACCESS_KEY";
  var form = document.getElementById("chatform"),
    msgs = document.getElementById("msgs");
  if (form) {
    var mail = "tefiniaina.pro@gmail.com",
      MAX = 2000;
    var RULES = {
      name: {
        re: /^\p{L}[\p{L}\p{M}' .\-]{1,59}$/u,
        empty: "I would love to know what to call you.",
        fix: "Just your name is perfect: letters only, no numbers or symbols, please.",
        ok: function (v) {
          return "Nice to meet you, " + v.split(" ")[0] + "!";
        },
      },
      email: {
        re: /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9\-]+(?:\.[A-Za-z0-9\-]+)*\.[A-Za-z]{2,}$/,
        empty: "Your email lets me write back to you.",
        fix: "Could you double-check it? Something like name@example.com, so my reply reaches you.",
        ok: function () {
          return "Perfect, I will reply right here.";
        },
      },
      message: {
        test: function (v) {
          return v.length >= 10 && v.length <= MAX;
        },
        empty: "Say hello, or tell me what is on your mind.",
        fix: "A few more words would help me a lot: one or two sentences is great.",
        ok: function () {
          return "Thank you, I cannot wait to read this.";
        },
      },
    };
    var nudge = null,
      touched = {},
      field = function (n) {
        return form.elements[n];
      };
    var clean = function (n) {
      var v = (field(n).value || "").replace(
        /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,
        "",
      ); // strip control characters
      v =
        n === "message" ? v.replace(/\n{3,}/g, "\n\n") : v.replace(/\s+/g, " ");
      return v.trim();
    };
    var check = function (n, show) {
      var v = clean(n),
        r = RULES[n],
        ok = r.re ? r.re.test(v) && v.length <= 254 : r.test(v),
        el = field(n),
        err = form.querySelector('.err[data-for="' + n + '"]');
      el.setAttribute("aria-invalid", !ok && show ? "true" : "false");
      if (!show) {
        err.textContent = "";
        err.classList.remove("ok");
        return ok;
      }
      err.textContent = ok ? r.ok(v) : v ? r.fix : r.empty;
      err.classList.toggle("ok", ok);
      return ok;
    };
    ["name", "email", "message"].forEach(function (n) {
      var el = field(n);
      el.addEventListener("blur", function () {
        touched[n] = true;
        check(n, true);
      });
      el.addEventListener("input", function () {
        if (touched[n]) check(n, true);
      });
    });
    // auto-growing message field: Enter adds a line and the box grows, the first lines stay visible
    var ta = field("message"),
      cnt = document.getElementById("cnt"),
      LIMIT = 180;
    var grow = function () {
      ta.style.height = "auto";
      var hgt = Math.min(ta.scrollHeight + 2, LIMIT);
      ta.style.height = hgt + "px";
      ta.style.overflowY = ta.scrollHeight + 2 > LIMIT ? "auto" : "hidden";
      cnt.textContent = ta.value.length + " / " + MAX;
    };
    ta.addEventListener("input", grow);
    ta.addEventListener("keydown", function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        form.requestSubmit();
      }
    });
    grow();

    var say = function (html, out) {
      var d = document.createElement("div");
      d.className = "bub " + (out ? "out" : "in");
      d.innerHTML = html;
      msgs.appendChild(d);
      msgs.scrollTop = msgs.scrollHeight;
      return d;
    };
    var esc = function (t) {
      return t.replace(/[&<>"']/g, function (c) {
        return {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        }[c];
      });
    };
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form.elements.botcheck.value) return; // bots fill the hidden field
      var bad = null;
      ["name", "email", "message"].forEach(function (n) {
        touched[n] = true;
        if (!check(n, true) && !bad) bad = n;
      });
      if (bad) {
        var t =
          "Almost there! Just a quick look at the highlighted fields and I can read your message.";
        if (nudge && nudge.parentNode) {
          nudge.innerHTML = t;
        } else {
          nudge = say(t, false);
        }
        field(bad).focus();
        return;
      }
      var name = clean("name"),
        email = clean("email"),
        message = clean("message");
      say(esc(message).replace(/\n/g, "<br>"), true);
      var wait = say('<span class="dots3"><i></i><i></i><i></i></span>', false),
        btn = form.querySelector("button");
      btn.disabled = true;
      var done = function (ok, html) {
        wait.innerHTML = html;
        btn.disabled = false;
        if (ok) {
          form.reset();
          touched = {};
          grow();
          ["name", "email", "message"].forEach(function (n) {
            check(n, false);
          });
        }
        msgs.scrollTop = msgs.scrollHeight;
      };
      var fallback =
        'Could not send it from here. Please write to <a href="mailto:' +
        mail +
        "?subject=" +
        encodeURIComponent("Portfolio message from " + name) +
        "&body=" +
        encodeURIComponent(message) +
        '">' +
        mail +
        "</a>.";
      if (WEB3FORMS_KEY === "YOUR_ACCESS_KEY") {
        done(false, fallback);
        return;
      }
      fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          subject: "Portfolio message from " + name,
          from_name: name,
          name: name,
          email: email,
          message: message,
        }),
      })
        .then(function (r) {
          return r.json();
        })
        .then(function (d) {
          d.success
            ? done(
                true,
                "Thank you, " +
                  esc(name) +
                  "! Your message is sent. I will reply to <b>" +
                  esc(email) +
                  "</b> soon.",
              )
            : done(false, fallback);
        })
        .catch(function () {
          done(false, fallback);
        });
    });
  }
})();
