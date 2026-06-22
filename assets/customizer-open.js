document.addEventListener("DOMContentLoaded", function () {
  const modal = document.getElementById("fullscreen-modal");
  const announcement_bar = document.querySelector(".announcement-bar");
  const headerElement = document.querySelector(".header");
  const header_component = document.querySelector("header-component");
  const headerElementmobile = document.querySelector(".halo-header-mobile");

  //  LAZY LOAD STATE
  let customizerReady = false;
  let customizerLoading = null;

  //  Make DOMContentLoaded callbacks registered by lazily-loaded scripts run
  //  after the current paint. Those scripts (option-card.js) are injected AFTER
  //  the real DOMContentLoaded has fired, so an event listener would never
  //  trigger. Scheduling this as a task keeps heavy init from blocking the
  //  modal loader paint in the same script-load turn.
  function patchReadyListeners() {
    if (patchReadyListeners.done) return;
    patchReadyListeners.done = true;
    const nativeAdd = document.addEventListener.bind(document);
    document.addEventListener = function (type, listener, options) {
      if (type === "DOMContentLoaded" && document.readyState !== "loading") {
        setTimeout(() => listener.call(document, new Event("DOMContentLoaded")), 0);
        return;
      }
      return nativeAdd(type, listener, options);
    };
  }

  function waitForInjectedStyles(container) {
    const links = Array.from(container.querySelectorAll('link[rel="stylesheet"]'));
    const pending = links
      .filter((link) => !link.sheet)
      .map((link) => new Promise((resolve) => {
        link.addEventListener("load", resolve, { once: true });
        link.addEventListener("error", resolve, { once: true });
      }));

    if (!pending.length) return Promise.resolve();
    return Promise.race([
      Promise.all(pending),
      new Promise((resolve) => setTimeout(resolve, 1200)),
    ]);
  }

  function waitForPaint() {
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(resolve);
      });
    });
  }

  //  Inject the customizer markup from its <template> and load its scripts once.
  function loadCustomizer() {
    if (customizerReady) return Promise.resolve();
    if (customizerLoading) return customizerLoading;

    customizerLoading = new Promise((resolve) => {
      //  TIMING — measure how long the customizer template content takes to load.
      const t0 = performance.now();
      const mark = (label) =>
        console.log(
          `[customizer] ${label}: ${(performance.now() - t0).toFixed(1)}ms`
        );

      const template = document.getElementById("customizer-template");
      if (!template) {
        customizerReady = true;
        resolve();
        return;
      }

      //  Read script sources before the template is removed.
      const scripts = [
        template.getAttribute("data-option-card-src"),
      ].filter(Boolean);

      const parent = template.parentElement;

      //  STEP-BY-STEP LOAD.
      //  Phase 1 (now): the light, immediately-visible content — fabric box,
      //  the main style list (.overview-list[data-index="0"]) and the action
      //  buttons. Pull the heavy child option lists (.customizer-list.childs-list
      //  — thousands of collection <li>s, the part that froze the UI) OUT of the
      //  template before injecting so they don't get cloned/laid out up front.
      //  They are streamed back in during idle, after phase 1 has painted.
      const deferredChildLists = Array.from(
        template.content.querySelectorAll(".customizer-list.childs-list")
      );
      deferredChildLists.forEach((list) => list.remove());

      //  Move (don't clone) the now-light content into the modal — moving avoids
      //  duplicating the whole subtree.
      parent.appendChild(template.content);
      template.remove();
      mark(
        `phase 1 injected (${deferredChildLists.length} child lists deferred)`
      );

      //  Inject ONE child list <ul> on demand, matched by its childsIn class
      //  ("styles"/"contrasts") + data-index, into its original spot inside
      //  .overview. option-card.js calls this from getnewList the moment a style
      //  li[data-list] is clicked, so each step's heavy cards are materialized
      //  only when that step is actually opened.
      const overviewOf = () => parent.querySelector(".overview");
      function injectChildList(childsIn, index) {
        if (!deferredChildLists.length) return;
        const overview = overviewOf();
        if (!overview) return;
        const idx = String(index);
        for (let k = deferredChildLists.length - 1; k >= 0; k--) {
          const ul = deferredChildLists[k];
          if (
            ul.classList.contains(childsIn) &&
            ul.getAttribute("data-index") === idx
          ) {
            const cStart = performance.now();
            overview.appendChild(ul);
            deferredChildLists.splice(k, 1);
            console.log(
              `[customizer] child list .${childsIn}[data-index="${idx}"] injected: ` +
                `${(performance.now() - cStart).toFixed(1)}ms`
            );
          }
        }
      }

      //  Inject every remaining child list at once — for flows that touch all
      //  lists without going step-by-step (load-previous, summary "Edit").
      function injectAllChildLists() {
        if (!deferredChildLists.length) return;
        const overview = overviewOf();
        if (!overview) return;
        const frag = document.createDocumentFragment();
        deferredChildLists.forEach((list) => frag.appendChild(list));
        overview.appendChild(frag);
        deferredChildLists.length = 0;
        console.log("[customizer] all remaining child lists injected");
      }

      window.__injectCustomizerChildList = injectChildList;
      window.__injectCustomizerChildLists = injectAllChildLists;

      patchReadyListeners();
      const stylesReady = waitForInjectedStyles(parent);
      stylesReady.then(() => mark("styles ready"));

      function loadNext(i) {
        if (i >= scripts.length) {
          stylesReady.then(waitForPaint).then(() => {
            customizerReady = true;
            mark("TOTAL (phase 1 ready)");
            resolve();
            //  Child lists are no longer injected up front — each one is
            //  materialized on demand when its style is clicked (see
            //  option-card.js getnewList → window.__injectCustomizerChildList).
          });
          return;
        }
        const sStart = performance.now();
        const s = document.createElement("script");
        s.src = scripts[i];
        s.onload = () => {
          console.log(
            `[customizer] script ${scripts[i]} loaded+executed: ` +
              `${(performance.now() - sStart).toFixed(1)}ms`
          );
          loadNext(i + 1);
        };
        s.onerror = () => loadNext(i + 1);
        document.body.appendChild(s);
      }

      //  Let the injected DOM, CSS, and loader paint before option-card.js runs
      //  its startup queries/listeners. Without this yield, the first click can
      //  spend a long task cloning DOM and executing the customizer script before
      //  the user sees the modal respond.
      stylesReady.then(waitForPaint).then(() => {
        mark("first paint done — starting scripts");
        loadNext(0);
      });
    });

    return customizerLoading;
  }

  //  GLOBAL MODAL ADJUST FUNCTION
  window.adjustModal = function adjustModal() {
    if (!modal) return;
    const customizer = document.querySelector(".modal-content .customizer");
    const overview_list = document.querySelector(".overview-list");
    let activeHeader = headerElement;
    if (!activeHeader || activeHeader.offsetHeight === 0) {
      activeHeader = headerElementmobile;
    }
    if (!activeHeader) return;
    activeHeader.classList.remove("has_sticky", "is_sidebar");
    headerElement?.classList.add("view_increase");
    if (header_component) {
      header_component.removeAttribute("transparent");
    }
    modal.style.display = "flex";
    if (customizer) customizer.style.display = "flex";
    window.scrollTo(0, 0);
    document.body.classList.add("overflow_hidden");
    announcement_bar?.classList.add("hidden--mobile");
    if (overview_list) {
      setTimeout(() => {
        overview_list.classList.add("openchilds");
      }, 200);
    }
    const headerHeight =
      (activeHeader?.offsetHeight || 0) + (announcement_bar?.offsetHeight || 0);
    modal.style.top = headerHeight + "px";
    modal.style.height = `calc(100% - ${headerHeight}px)`;
  };

  //  LOADER inside the modal (shown while the customizer is injected/loaded)
  function showModalLoader() {
    if (!modal) return;
    modal.classList.add("is-loading-customizer");
    let loader = modal.querySelector(".customizer-loader");
    if (!loader) {
      loader = document.createElement("div");
      loader.className = "customizer-loader";
      loader.setAttribute("aria-live", "polite");
      loader.setAttribute("aria-busy", "true");
      loader.innerHTML =
        '<span class="customizer-loader__spinner"></span>' +
        '<span class="customizer-loader__text">Loading customizer…</span>';
      modal.appendChild(loader);
    }
    loader.classList.remove("hidden");
  }

  function hideModalLoader() {
    const loader = modal && modal.querySelector(".customizer-loader");
    if (loader) loader.remove();
    modal?.classList.remove("is-loading-customizer");
  }

  //  OPEN MODAL (MULTIPLE BUTTONS) — lazy load on first click
  document.addEventListener("click", function (e) {
    const openBtn = e.target.closest(".open-modal");
    if (!openBtn) return;

    //  Already loaded — just reopen, no loader needed
    if (customizerReady) {
      setTimeout(() => window.adjustModal(), 50);
      return;
    }

    //  TIMING — measure from this click until the template content is fully
    //  injected, styled, painted, and its script has run.
    const clickT0 = performance.now();
    console.log("[customizer] open-modal clicked — loading content…");

    //  First open — show loaders on the button and in the modal while it loads.
    //  Kick off injection first so a hiccup in adjustModal can never block it.
    openBtn.classList.add("is-loading");
    showModalLoader();
    const loading = loadCustomizer();
    window.adjustModal(); // reveal the (empty) modal shell with the spinner

    loading.then(() => {
      hideModalLoader();
      openBtn.classList.remove("is-loading");
      console.log(
        `[customizer] content ready — ${(performance.now() - clickT0).toFixed(1)}ms ` +
          `from click to fully loaded`
      );
      setTimeout(() => {
        window.adjustModal();
      }, 50);
    });
  });

  //  CLOSE MODAL (delegated — #close-modal is injected lazily)
  document.addEventListener("click", function (e) {
    if (!e.target.closest("#close-modal")) return;
    setTimeout(() => {
      modal.style.display = "none";
      modal.style.height = "0";
      document.body.classList.remove("overflow_hidden");
      document.body.classList.remove("overflow_mobile");
      announcement_bar?.classList.remove("hidden--mobile");
      headerElement?.classList.remove("view_increase");
      if (header_component) {
        header_component.setAttribute("transparent", "not-sticky");
      }
    }, 200);
  });

  //  RESIZE & SCROLL FIX
  ["scroll", "resize"].forEach((evt) => {
    window.addEventListener(evt, () => {
      if (modal && modal.style.display === "flex") {
        window.adjustModal();
      }
    });
  });
});

// additional options (delegated — .card-stack is injected lazily)
document.addEventListener('click', function (e) {
  const cardStack = e.target.closest('.card-stack');
  if (!cardStack) return;
  const contrastOptions = document.querySelectorAll('.overview-list.style-list .contrast-options');
  const makeSelections = document.querySelectorAll('.card-stack-text');
  const optionCard = cardStack.querySelector('.option-card');
  const second = cardStack.querySelector('.second');
  const thrid = cardStack.querySelector('.thrid');
  const scrollParent = cardStack.closest(".overview-list");
  if (contrastOptions.length <= 3 || !makeSelections.length) return;
  const delayPerItem = 0;
  // State based on 4th element (first 3 always visible)
  const isShowing = contrastOptions[3].classList.contains('hidden');
  if (isShowing) {
    // SHOW
    contrastOptions.forEach((el, index) => {
      if (index < 3) {
        // first 3 → only toggle "show", never hidden
        setTimeout(() => {
          el.classList.add('show');
        }, index * delayPerItem);
      } else {
        setTimeout(() => {
          el.classList.remove('hidden');
          el.classList.add('show');
        }, (index - 3) * delayPerItem + 3 * delayPerItem);
      }
    });
  } else {
    // HIDE
    contrastOptions.forEach((el, index) => {
      if (index < 3) {
        // first 3 → only remove "show", never hidden
        setTimeout(() => {
          el.classList.remove('show');
        }, index * (delayPerItem / 2));
      } else {
        setTimeout(() => {
          el.classList.remove('show');
          el.classList.add('hidden');
        }, (index - 3) * (delayPerItem / 2));
      }
    });
  }
  // Toggle button state
  cardStack.classList.toggle('active', isShowing);
  makeSelections[0].textContent = isShowing ? 'HIDE' : 'SHOW MORE';
  if (window.innerWidth < 450 && optionCard) {
    if (second) second.style.display = isShowing ? 'none' : 'block';
    if (thrid) thrid.style.display = isShowing ? 'none' : 'block';
    if (scrollParent) {
      if (isShowing) {
        // scroll to bottom after small delay (optional)
        setTimeout(() => {
          scrollParent.scrollTo({
            top: scrollParent.scrollHeight,
            behavior: 'smooth'
          });
        }, 500); // <-- delay in milliseconds
      }
    }
    optionCard.style.width = isShowing ? '100%' : '80%';
    optionCard.style.transition = 'width 0.3s ease';
  }
  makeSelections.forEach(el => {
    el.style.background = isShowing
      ? '#4eb74e'
      : 'linear-gradient(0deg,rgba(112, 112, 112, 1) 0%, rgba(20, 21, 22, 1) 40%)';
  });
});
