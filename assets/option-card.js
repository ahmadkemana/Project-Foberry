  // select all required option
  function checkRequiredOptionsAndToggleButton(buttonSelector = '.btn-next-tab') {
    const requiredItems = getRequiredOptions();
    const allSelected = Array.from(requiredItems).every(item => item.classList.contains('select'));

    const button = buttonSelector === '.btn-next-tab' ? nextToSizeBtn : document.querySelector(buttonSelector);
    if (button) {
      button.disabled = !allSelected;
      button.classList.toggle('disabled', !allSelected); // Optional: add styling
    }
  }
  //   Query the child lists fresh on each use instead of snapshotting at init.
  //   They are injected lazily (after the modal paints), so a NodeList captured
  //   here would be empty and every consumer would silently no-op.
  const getAllChildTabs = () => document.querySelectorAll('.customizer-list.childs-list');
  const main_tab = document.querySelector('.overview-list');
  const apply_btn = document.querySelector('.apply_btn');
  const nextToSizeBtn = document.querySelector('.btn-next-tab');
  // const nextToSizeBtn = document.querySelector('.btn-next-tab');
  const prev_tab = document.querySelector('.btn-prev-tab');
  const currently_open_option = document.querySelector('.currently_open_option');
  let cachedRequiredOptions = null;
  let optionItemsByDataId = null;
  let allOptionLis = null;
  let inputsByMainParent = null;
  const appliedRadioInputs = new Set();
  let priceUpdateScheduled = false;
  const customPriceContainers = document.querySelectorAll('.custom_price');
  const cardCustomPriceContainers = document.querySelectorAll('.card_custom_price');
  const additionalChargesInput = document.querySelector('.customizer_additional_charges input');
  const monogramPrevTab = document.querySelector('.mono-prev-tab');
  function getRequiredOptions() {
    if (!cachedRequiredOptions) cachedRequiredOptions = document.querySelectorAll('.required-option');
    return cachedRequiredOptions;
  }

  function getOptionItemsByDataId() {
    if (!optionItemsByDataId) {
      optionItemsByDataId = new Map();
      document.querySelectorAll('li[data-id]').forEach(li => {
        optionItemsByDataId.set(li.getAttribute('data-id'), li);
      });
    }
    return optionItemsByDataId;
  }

  function getAllOptionLis() {
    if (!allOptionLis) allOptionLis = Array.from(document.querySelectorAll('li[child-id], li[data-id]'));
    return allOptionLis;
  }

  function escapeAttrValue(value) {
    const stringValue = String(value);
    if (window.CSS?.escape) return CSS.escape(stringValue);
    return stringValue.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }

  function getInputsByMainParent(id) {
    if (!id) return [];
    if (!inputsByMainParent) inputsByMainParent = new Map();
    const key = String(id);
    if (!inputsByMainParent.has(key)) {
      inputsByMainParent.set(
        key,
        Array.from(document.querySelectorAll(`input[data-main-parent="${escapeAttrValue(key)}"]`))
      );
    }
    return inputsByMainParent.get(key);
  }

  const getOptionItemById = id => getOptionItemsByDataId().get(String(id)) || document.querySelector(`li[data-id="${id}"]`);
  const CHILD_LIST_LOADER_DELAY = 300;

  function schedulePriceUpdate() {
    if (priceUpdateScheduled) return;
    priceUpdateScheduled = true;
    requestAnimationFrame(() => {
      priceUpdateScheduled = false;
      updatePrice();
    });
  }

  function getChildListLoader() {
    const loaderParent = document.querySelector('.overview') || document.querySelector('.customizer_content') || document.body;
    let loader = loaderParent.querySelector(':scope > .child-list-loader');

    if (!loader) {
      loader = document.createElement('div');
      loader.className = 'child-list-loader hidden';
      loader.setAttribute('aria-live', 'polite');
      loader.setAttribute('aria-busy', 'true');
      loader.innerHTML = '<span class="child-list-loader__spinner"></span>';
      loaderParent.appendChild(loader);
    }

    return loader;
  }

  function showChildListLoader() {
    const loader = getChildListLoader();
    loader.classList.remove('hidden');
  }

  function hideChildListLoader() {
    const loader = document.querySelector('.child-list-loader');
    loader?.classList.add('hidden');
  }

  apply_btn?.addEventListener('click', function () {
    prev_tab?.classList.remove("summary-page")
    currently_open_option?.classList.add('hidden');
    // Hide and disable the apply button
    apply_btn.classList.add('hidden', 'disabled');
    prev_tab?.classList.add('disabled');
    // Hide all child tabs
    getAllChildTabs().forEach(tab => tab.classList.add('hidden'));
    // Show the main tab and next button
    main_tab?.classList.remove('openchilds');
    main_tab?.classList.remove('hidden');
    nextToSizeBtn?.classList.remove('hidden');
          setTimeout(  ()=>{
            main_tab?.classList.add('openchilds')
          }, 200 )
  });
  function handleRadioChange(event) {
    const input = event.target;
    const data_main_parent = input.getAttribute('data-main-parent');
    if (!data_main_parent) {
      schedulePriceUpdate();
      return;
    }
    if (!apply_btn) return;
    // Enable Apply and store the selected input ID (not value)
    apply_btn.classList.remove('disabled');
    apply_btn.dataset.lastSelected = input.id;
    //   Uncheck only the *other currently-checked* radio in this group. Collection
    //   options can render thousands of radios per group, so querying just the
    //   ":checked" ones (usually a single element) is far cheaper than looping the
    //   whole cached group and writing .checked on every member.
    document
      .querySelectorAll(`input[data-main-parent="${escapeAttrValue(data_main_parent)}"]:checked`)
      .forEach(el => {
        if (el !== input) el.checked = false;
      });
    if (prev_tab?.classList.contains('summary-page')) {
      apply_btn.classList.remove('hidden');
      nextToSizeBtn?.classList.add('hidden');
    }
    schedulePriceUpdate();
  }
  //   Apply the "this option is selected" visuals to its parent <li>. Shared by
  //   applySelections (user picks an option) and handleloadprevious (restoring a
  //   saved selection) — both produced this identical block.
  function applySelectionVisuals(parentLi, {
    selectImg, selectOptions, card_send, allselection, selectParent, currentTitle, endstep,
  }) {
    if (!parentLi) return;
    parentLi.querySelector('.icon-check-circle')?.classList.add('active');
    parentLi.querySelector('.selected')?.classList.remove('hidden');
    parentLi.querySelector('.option-card')?.classList.add('select');
    const parent_img = parentLi.querySelector('.select_img img');
    const org_img = parentLi.querySelector('.org_img');
    if (parent_img && org_img) {
      org_img.classList.add('hidden');
      parent_img.parentElement.classList.remove('hidden');
      parent_img.onerror = () => {
        parent_img.src = selectImg;
      };
      parent_img.src = selectImg;
    }
    const nameElement = parentLi.querySelector('.name');
    const top = parentLi.querySelector('.top');
    const bottom = parentLi.querySelector('.bottom');
    if (nameElement && top && bottom) {
      nameElement.innerHTML = selectOptions;
      nameElement.classList.remove('hidden');
      top.classList.remove('hidden');
      bottom.classList.add('hidden');
    }
    parentLi.setAttribute('card-send', `[${card_send}]`);
    parentLi.setAttribute('options-selected', `[${allselection}]`);
    parentLi.setAttribute('summary-edit', `[${selectParent}]`);
    parentLi.setAttribute('current-title', `[${currentTitle}]`);
    parentLi.setAttribute('end-step', `[${endstep}]`);
    parentLi.classList.add('selected_options');
    if (typeof checkRequiredOptionsAndToggleButton === 'function') {
      checkRequiredOptionsAndToggleButton();
    }
  }
  // --- Apply Selections ---
  function applySelections() {
    const lastSelectedId = this.dataset.lastSelected;
    if (!lastSelectedId) return;
    const input = document.getElementById(lastSelectedId);
    if (!input) return;
    // --- Get attributes ---
    const selectedParentId = input.getAttribute('data-main-parent');
    const allselection = input.getAttribute('all-selection');
    const selectOptions = input.getAttribute('select-options');
    const card_send = input.getAttribute('card-send');
    const currentTitle = input.getAttribute('current-title');
    const endstep = input.getAttribute('end-step');
    const selectParent = input.getAttribute('data-parent');
    const selectImg = input.getAttribute('select-img');
    const why_not_name = input.getAttribute('style_name');
    const restrictedOptionIdsStr = input.getAttribute('restricted_option_ids');
    const restricted_option_Pid = input.getAttribute('restricted_option_Pid');
    // --- Restriction logic ---
    const restrictedOptionIds = restrictedOptionIdsStr
      ? restrictedOptionIdsStr.replace(/[\[\]\s"]/g, '').split(',')
      : [];
    hasOptions(restrictedOptionIds, restricted_option_Pid, selectedParentId, why_not_name);
    // --- UI selection visuals ---
    applySelectionVisuals(getOptionItemById(selectedParentId), {
      selectImg, selectOptions, card_send, allselection, selectParent, currentTitle, endstep,
    });
    //   Mark this input as applied
    input.setAttribute('data-applied', 'true');
    appliedRadioInputs.add(input);
    // Disable Apply until user changes again
    this.classList.add('disabled');
    delete this.dataset.lastSelected;
  }
  // --- Remove Applied Selection by ID ---
  function removeAppliedSelectionById(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const parentId = input.getAttribute('data-main-parent');
    const parentLi = getOptionItemById(parentId);
    if (parentLi) {
      parentLi.classList.remove('selected_options');
      parentLi.removeAttribute('card-send');
      parentLi.removeAttribute('options-selected');
      parentLi.removeAttribute('summary-edit');
      parentLi.removeAttribute('current-title');
      parentLi.removeAttribute('end-step');
      parentLi.querySelector('.icon-check-circle')?.classList.remove('active');
      parentLi.querySelector('.selected')?.classList.add('hidden');
      parentLi.querySelector('.option-card')?.classList.remove('select');
      const nameElement = parentLi.querySelector('.name');
      const top = parentLi.querySelector('.top');
      const bottom = parentLi.querySelector('.bottom');
      if (nameElement && top && bottom) {
        nameElement.innerHTML = '';
        nameElement.classList.add('hidden');
        top.classList.add('hidden');
        bottom.classList.remove('hidden');
      }
      const parent_img = parentLi.querySelector('.select_img img');
      const org_img = parentLi.querySelector('.org_img');
      if (parent_img && org_img) {
        parent_img.parentElement.classList.add('hidden');
        org_img.classList.remove('hidden');
      }
    }
    //   Only uncheck if input is NOT inside .monogram_options or .create-size
    if (!input.closest('.monogram_options') && !input.closest('.create-size')) {
    input.checked = false;
  }
    input.removeAttribute('data-applied');
    appliedRadioInputs.delete(input);
    schedulePriceUpdate();
  }
  // --- Update Price ---
  function getBasePrice(priceContainers = customPriceContainers) {
    if (priceContainers.length === 0) return null;
    const basePriceAttr = priceContainers[0].getAttribute('default-price');
    const basePriceStr = basePriceAttr?.replace(/Rs\./i, '').replace(/,/g, '').trim();
    const basePrice = parseFloat(basePriceStr);
    return isNaN(basePrice) ? null : basePrice;
  }

  function getCheckedRadioCharges() {
    let charges = 0;
    document.querySelectorAll('input[type="radio"]:checked[more-charges]').forEach(checkedInput => {
      const charge = parseFloat(checkedInput.getAttribute('more-charges'));
      if (!isNaN(charge)) charges += charge;
    });
    return charges;
  }

  function renderPrices(totalCharges, basePrice, {
    priceContainers = customPriceContainers,
    cardPriceContainers = cardCustomPriceContainers,
    extraInput = additionalChargesInput,
    roundedTotal = false,
    setAllAttrs = true,
  } = {}) {
    const monoCharges = 0;
    const totalText = roundedTotal ? totalCharges.toFixed(0) : totalCharges.toLocaleString();
    const cardTotalText = totalCharges.toLocaleString();

    priceContainers.forEach(container => {
      container.innerHTML = `<span>Total: Rs ${totalText}</span>`;
      if (setAllAttrs) {
        container.setAttribute("customizer-mono-price", monoCharges.toFixed());
        container.setAttribute("total-price", cardTotalText);
      }
    });

    cardPriceContainers.forEach(container => {
      container.innerHTML = `<span>Rs. ${cardTotalText}</span>`;
      container.setAttribute('data-base-price', cardTotalText);
      if (setAllAttrs) {
        container.setAttribute("customizer-mono-price", monoCharges.toFixed());
        container.setAttribute("total-price", cardTotalText);
      }
    });

    if (extraInput) {
      extraInput.value = `${totalCharges - basePrice}`;
    }
  }

  function recalculatePrice(options) {
    const priceContainers = options?.priceContainers || customPriceContainers;
    const basePrice = getBasePrice(priceContainers);
    if (basePrice === null) return false;
    renderPrices(basePrice + getCheckedRadioCharges(), basePrice, {
      ...options,
      priceContainers,
    });
    return true;
  }

  function updatePrice() {
    recalculatePrice();
  }
  // --- Clear Last Picked Radio on Prev Tab ---
  function clearLastSelected() {
    const apply_btn = document.querySelector('.apply_btn');
    if (!apply_btn) return;

    const lastSelectedId = apply_btn.dataset.lastSelected;
    if (lastSelectedId) {
      removeAppliedSelectionById(lastSelectedId);
    }

    delete apply_btn.dataset.lastSelected;
    apply_btn.classList.add('disabled');
    checkRequiredOptionsAndToggleButton()
  }
  // --- Event Listeners ---
  //   Delegate a single 'change' listener instead of binding one per radio. Collection
  //   options render a radio per product (thousands of them), so the old per-input loop
  //   ran thousands of addEventListener calls synchronously the moment the customizer is
  //   injected — right as the open animation plays — which stuttered the animation.
  document.addEventListener('change', function (e) {
    const input = e.target;
    if (!(input instanceof HTMLInputElement) || input.type !== 'radio') return;

    const isSizeRadio = input.closest('.create-size');
    const isMonogramRadio = input.closest('.monogram_options');
    const isOptionRadio = input.hasAttribute('data-main-parent') && !isSizeRadio;

    if (!isOptionRadio && !isMonogramRadio) return;

    if (isOptionRadio) {
      handleRadioChange(e);
    } else {
      schedulePriceUpdate();
    }

    if (prev_tab && prev_tab.classList.contains('summary-page')) {
      prev_tab.classList.add('disabled');
    }
    if (isMonogramRadio && monogramPrevTab) {
      monogramPrevTab.classList.add('mono-change');
    }

    // If this input was previously applied but now unchecked → remove it
    if (!input.checked && input.hasAttribute('data-applied')) {
      removeAppliedSelectionById(input.id);
    }

    // Also check for any applied inputs that got unchecked programmatically.
    // Keep this to the small applied set instead of querying every radio.
    Array.from(appliedRadioInputs).forEach(appliedInput => {
      if (!appliedInput.checked) {
        removeAppliedSelectionById(appliedInput.id);
      }
    });
  });
  document.querySelector('.apply_btn')?.addEventListener('click', applySelections);
  document.querySelectorAll('.btn-prev-tab, .mono-prev-tab').forEach(btn =>
    btn.addEventListener('click', clearLastSelected)
  );

  // restricted and depended options  
  function hasOptions(restrictedOptionIds = [], restricted_option_Pid, selectedParentId, why_not_name) {
    const restrictedSet = new Set(restrictedOptionIds.map(String)); // normalize as strings
    // Remove previous disabled items related to the selected parent
    const monogram_tab = document.querySelector(".custom_monogram");


    const previouslyDisabled = selectedParentId
      ? document.querySelectorAll(`li[hasdisabled-to="${escapeAttrValue(selectedParentId)}"]`)
      : [];
    previouslyDisabled.forEach(li => {
    //   Skip if inside monogram_tab
    if (monogram_tab && monogram_tab.contains(li)) return;

      li.classList.remove('hasdisabled');
      li.removeAttribute('hasdisabled-to');

      const why_not = li.querySelector('.why_not');
      if (why_not) why_not.textContent = '';

      const optionCard = li.querySelector('.option-card');
      const name = li.querySelector('.name');
      const top = li.querySelector('.top');
      const bottom = li.querySelector('.bottom');

      optionCard?.classList.remove('select');
      name?.classList.remove('hidden');
      top?.classList.remove('hidden');
      bottom?.classList.add('hidden');
  });

    
    // Disable restricted options (both parents and children)
    if (restrictedSet.size > 0) {
      getAllOptionLis().forEach(li => {
      // Check both child-id (for children) and data-id (for parents)
      const childId = li.getAttribute('child-id');
      const parentId = li.getAttribute('data-id');
      const elementId = childId || parentId;
      if (restrictedSet.has(elementId)) {
        li.classList.add('hasdisabled');
        li.setAttribute('hasdisabled-to', selectedParentId);
        const why_not = li.querySelector('.why_not');
        if (why_not) {
          why_not.textContent = `Can't choose this option with ${why_not_name}`;
        }
        // Apply visual changes to the disabled element
        const optionCard = li.querySelector('.option-card');
        const name = li.querySelector('.name');
        const top = li.querySelector('.top');
        const bottom = li.querySelector('.bottom');
        optionCard?.classList.remove('select');
        name?.classList.add('hidden');
        top?.classList.add('hidden');
        bottom?.classList.remove('hidden');
        // Uncheck related inputs based on element type
        if (parentId && restrictedSet.has(parentId)) {
          // This is a parent being disabled - uncheck inputs related to this parent
          getInputsByMainParent(parentId).forEach(input => {
            input.checked = false;
          });
        } else if (childId && restrictedSet.has(childId)) {
          // This is a child being disabled - uncheck inputs related to the restricted_option_Pid
          getInputsByMainParent(restricted_option_Pid).forEach(input => {
            input.checked = false;
          });
        }
      }
    });
    }
    // Additional logic: If restricted_option_Pid is provided, handle its specific visual state
    if (restricted_option_Pid) {
      const parentLi = getOptionItemById(restricted_option_Pid);
      if (parentLi) {
        const optionCard = parentLi.querySelector('.option-card');
        const name = parentLi.querySelector('.name');
        const top = parentLi.querySelector('.top');
        const bottom = parentLi.querySelector('.bottom');
        optionCard?.classList.remove('select');
        name?.classList.add('hidden');
        top?.classList.add('hidden');
        bottom?.classList.remove('hidden');
      }
    }
    // Restore dependent options
    const dependedLi = getOptionItemById(selectedParentId);
    if (dependedLi?.querySelector('.option-card')) {
      document.querySelectorAll(`input[has-depended="${selectedParentId}"]`).forEach(input => {
        input.parentElement?.classList.remove('hasdisabled');
      });
    }
  }

  const mainstyleLists = document.querySelector('.overview-list.style-list');


  let currentIndex = null;
  let currentListClass = '';

  // Handle childs option on click
  document.addEventListener('click', function (e) {
    const clickedLi = e.target.closest('li[data-list]');
    const info = e.target.matches('.info_btn');
    const modal_dialog = e.target.matches('.modal') || e.target.closest('.modal');
    const close_btn = e.target.matches('.close_btn');

    if (!clickedLi) return;
    if (info) return;
    if (modal_dialog) return;

    const dataList = clickedLi.getAttribute('data-list');
    const mainparent = clickedLi.getAttribute('data-id');
    const index = parseInt(clickedLi.getAttribute('current_index'));
    const total_options = parseInt(clickedLi.getAttribute('sub-options'));
    const childsIn = clickedLi.getAttribute('childsIn');
    const subTitle = clickedLi.getAttribute('sub-title') || clickedLi.getAttribute('contras_name') || '';

    //   Moved currently_open_option UI update here
    if (currently_open_option) {
      currently_open_option.classList.remove('hidden');
      currently_open_option.innerHTML = `<h4>${subTitle} : </h4> <span> (step ${index } of ${total_options + index - 1 })</span>`;
    }
    if (!prev_tab?.classList.contains('summary-page')) {
    apply_btn?.classList.remove('hidden');
    nextToSizeBtn?.classList.add('hidden');
  }

    if (!dataList || isNaN(index) || !childsIn) return;

    const dataIds = dataList.split(',').map(id => id.trim());

    prev_tab?.classList.remove('disabled');
    mainstyleLists?.classList.add('hidden');

    const removescroll = e.target.closest(".product_form_wrapper");
    if (removescroll) {
      removescroll.scrollTop = 0;
    }

    //   getnewList manages its own loader and reveals cards in batches across frames, so it
    //   never blocks the main thread (no "frozen" feel) — just call it directly.
    getnewList(index, total_options, childsIn, subTitle, mainparent, dataIds);
  });

  let stepSubtitles = {};

  function getnewList(index, total_options, childsIn, subTitle, mainparent, dataIds = []) {
    //   Child option lists are injected on demand. Materialize the specific list
    //   for this step (matched by childsIn + index) before we query for it below.
    if (typeof window.__injectCustomizerChildList === 'function') {
      window.__injectCustomizerChildList(childsIn, index);
    }
    currentIndex = index;
    currentListClass = childsIn;
    stepSubtitles[index] = subTitle;

    // Hide all lists first
    const allCustomizerLists = document.querySelectorAll('.customizer-list.childs-list');
    allCustomizerLists.forEach(list => {
      list.classList.add('hidden');
      list.classList.remove('openchilds');
    });

    const targetUL = document.querySelector(`.${childsIn}[data-index="${index}"]`);
    if (!targetUL) return;

    //   Decide which children match WHILE the <ul> is still display:none (toggling classes
    //   on a hidden subtree costs no layout). Keep every card hidden for now and collect the
    //   matches so we can reveal them in small batches below.
    const dataIdSet = new Set(dataIds);
    const childListItems = targetUL.querySelectorAll('li[child-id]');
    const matches = [];
    childListItems.forEach(childLi => {
      const childId = childLi.getAttribute('child-id');
      const parentId = childLi.getAttribute('parent-id');
      const shouldShow =
        dataIdSet.has(childId) ||
        dataIdSet.has(parentId) ||
        parentId === mainparent;
      if (shouldShow) matches.push(childLi);
      childLi.classList.add('hidden');
    });

    //   Reveal the (now visually empty) list — cheap, no cards are laid out yet.
    targetUL.setAttribute('data-scroll', targetUL.scrollTop);
    targetUL.classList.remove('hidden');
    targetUL.scrollTop = 0;

    showChildListLoader();

    //   Reveal matching cards in small batches across frames. When a selected option is a
    //   collection, every matching card shares the same parent, so a step can hold hundreds
    //   of cards — laying them all out in one frame froze the main thread for seconds (the
    //   "frozen, no spinner" symptom). ~24 per frame keeps each frame's layout cheap, so the
    //   thread never blocks and the compositor-animated spinner stays smooth while the cards
    //   stream in.
    const BATCH = 24;
    let i = 0;
    function revealBatch() {
      const end = Math.min(i + BATCH, matches.length);
      for (; i < end; i++) matches[i].classList.remove('hidden');
      if (i < matches.length) {
        requestAnimationFrame(revealBatch);
      } else {
        hideChildListLoader();
      }
    }

    //   Commit the initial (hidden/translated) state first, then start the slide-in and
    //   stream the cards in.
    requestAnimationFrame(() => {
      targetUL.classList.add('openchilds');
      revealBatch();
    });
  }
  const myTabContent = document.querySelector("#myTabContent");
  const Sizes = document.querySelector('.create-size');
  const custom_summary_page = document.querySelector('.custom_summary_page');
  const hide_selection = document.querySelectorAll('.hide_selection');
  const styles = document.querySelector('.overview');
  // const prev_tab = document.querySelector('.btn-prev-tab'); // make sure this exists
  nextToSizeBtn?.addEventListener('click', () => {
    if (!Sizes || !styles || !myTabContent) return;
    // First move from styles to sizes
    // Then, if Sizes is now visible, show the summary next
    if (!Sizes.classList.contains('hidden')) {
      Sizes.classList.add('hidden');
      hide_selection.forEach(el => el.classList.add('hidden'));
      custom_summary_page?.classList.remove('hidden');
      summary_styles()
    }else{
      styles.classList.add('hidden');
    Sizes.classList.remove('hidden');
    prev_tab?.classList.remove('disabled');
    nextToSizeBtn.classList.add('disabled');
    myTabContent.classList.add('hidden');
    nextToSizeBtn.innerHTML="Review & BUY";
      validateSizeInputs()
    }
      custom_hidden.forEach(el => { el.classList.add("custom_hide");});
  });



  // Prev button handler
  if (prev_tab) {
    prev_tab.addEventListener('click', function (e) {
      e.preventDefault();

      // 🟡 Handle summary-page mode first
      if (prev_tab.classList.contains('summary-page')) {
        Sizes?.classList.add('hidden');
        custom_summary_page?.classList.remove('hidden');
  hide_selection.forEach(el => el.classList.add('hidden'));
        custom_hidden.forEach(el => {
          el.classList.add('custom_hide');
        });

        styles?.classList.add('hidden');
        myTabContent?.classList.add('hidden');
        return; // stop further processing
      }

      // 🟢 Regular previous step logic
      if (Sizes && !Sizes.classList.contains('hidden')) {
        Sizes.classList.add('hidden');
        styles?.classList.remove('hidden');
        myTabContent?.classList.remove('hidden');
        prev_tab.classList.add('disabled');
        nextToSizeBtn?.classList.remove('disabled');
        if (nextToSizeBtn) nextToSizeBtn.innerHTML = "Next";
        custom_hidden.forEach(el => { el.classList.remove("custom_hide"); });
        return;
      }

      if (currentIndex === null || currentIndex <= 0) return;

      const prevIndex = currentIndex - 1;

      const currentUL = document.querySelector(`.${currentListClass}[data-index="${currentIndex}"]`);
      if (currentUL) {
        currentUL.classList.add('hidden');
        currentUL.classList.remove('openchilds');
      }

      //   Safety: the previous step was injected on the way forward, but make
      //   sure its list exists before we reveal it.
      if (typeof window.__injectCustomizerChildList === 'function') {
        window.__injectCustomizerChildList(currentListClass, prevIndex);
      }
      const prevUL = document.querySelector(`.${currentListClass}[data-index="${prevIndex}"]`);
      if (prevUL) {
        prevUL.classList.remove('hidden');
        setTimeout(() => prevUL.classList.add('openchilds'), 200);
        currentIndex = prevIndex;

        //   Restore subtitle from memory
        const prevSubTitle = stepSubtitles[prevIndex] || "";
        if (prevIndex >= 1) {
          if (currently_open_option) {
            currently_open_option.innerHTML = `<h4>${prevSubTitle} :</h4> <span> Step( ${prevIndex + 1} of 4 )</span>`;
            currently_open_option.classList.remove('hidden');
          }
        } else {
          prev_tab.classList.add('disabled');
          nextToSizeBtn?.classList.remove('hidden');
          apply_btn?.classList.add('hidden');
          currently_open_option?.classList.add('hidden');
          // currently_open_option.innerHTML = ""; 
        }
      }
    });
  }


  // Alert
  // Track if checkout is clicked

  (function () {
    let checkoutClicked = false;

    // Helper to check if modal is open
    function isModalOpen() {
      const m = document.getElementById('fullscreen-modal');
      if (!m) return false;
      return getComputedStyle(m).display === 'flex' || m.classList.contains('model-open') || m.hasAttribute('data-open');
    }

    // Mark checkout clicked to skip alert
    document.addEventListener('click', function (e) {
      if (e.target.closest('.cart__submit[name="checkout"], [data-checkout], button[name="checkout"]')) {
        checkoutClicked = true;
      }
    });

    // Main part: triggers when the user leaves, reloads, closes tab, or switches browser/app
    window.addEventListener('beforeunload', function (e) {
      if (isModalOpen() && !checkoutClicked) {
        // Required by modern browsers to show the default leave confirmation
        e.preventDefault();
        e.returnValue = ''; 
        return ''; 
      }
    });
  })();
  // sizes tabs flow 
  document.querySelectorAll('.create-size-list a').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      document.querySelectorAll('.create-size-list a').forEach(a => a.classList.remove("active"));
      anchor.classList.add("active");
      e.preventDefault();
      const clickedId = anchor.getAttribute('id'); // Get the ID from the clicked <a>
      const tabContainer = document.getElementById('myTabContent3');
      if (!tabContainer) return;

      tabContainer.querySelectorAll('div').forEach(div => {
        if (div.id === clickedId) {
          div.classList.add('active', 'show');
          validateSizeInputs()
        } else {
          div.classList.remove('active', 'show');
        }
      });
    });
  });

  // smart sizes tabs
    const questions = document.querySelectorAll(".question_sizes");
    const prevBtn = document.querySelector(".prev_size");
    const nextBtn = document.querySelector(".next_size");
    const skipBtns = document.querySelectorAll(".skip_question");
  const modalOpen = document.getElementById("open-modal");
    let currentIndexquestion = 0;
  if (modalOpen) {
    
    function updateView() {
      questions.forEach((q, i) => {
        q.classList.toggle("hidden", i !== currentIndexquestion);
      });

      prevBtn.classList.toggle("disabled", currentIndexquestion === 0);
      nextBtn.classList.toggle("disabled", currentIndexquestion === questions.length - 1);

      skipBtns.forEach(btn => {
        btn.classList.toggle("disabled", currentIndexquestion === questions.length - 1);
      });
    }

    function goToNext() {
      if (currentIndexquestion < questions.length - 1) {
        currentIndexquestion++;
        updateView();
      }
    }
    if (prevBtn) {
      
    prevBtn.addEventListener("click", function () {
      if (currentIndexquestion > 0) {
        currentIndexquestion--;
        updateView();
      }
    });
    }
    if (nextBtn) {
      
    nextBtn.addEventListener("click", goToNext);
    }

    if (skipBtns) {
      
    skipBtns.forEach(btn => {
      btn.addEventListener("click", goToNext);
    });
    }

    // updateView(); // Initial render
  }



    const adjust_monoscroll = document.querySelector(".main-customizer-new .product_form_wrapper");
    const monogram_li = document.querySelector("a.monogram");
    const custom_hidden = document.querySelectorAll(".image_and_btn.fabric_box, .modal-close");
    // monogram 
  document.addEventListener("DOMContentLoaded", function () {
    // DOM Elements
    
    const monogram_li_select = monogram_li?.querySelector(".selected");
    const monogram_tab = document.querySelector(".custom_monogram");
    const commonly_btn = document.querySelector(".commonly");
    const specific_mono_btn = document.querySelector(".specific_mono");
    const apply_mono_btn = document.querySelector(".apply_mono_btn");
    const styles = document.querySelector(".styles");
    const myTabContent = document.querySelector("#myTabContent");

    const questions = document.querySelectorAll(".mono-input-box");
    const mono_prev_tab = document.querySelector(".mono-prev-tab");
    const mono_next_tab = document.querySelector(".mono-next-tab");
    const apply_mono_addons = document.querySelector(".apply-mono-addons");
    const mono_prev_addons = document.querySelector(".mono-prev-addons");
    const mono_next_addons = document.querySelector(".mono-next-addons");
    const remove_mono_selection = document.querySelector(".remove-monogram");

    let currentIndex = 0;

    if (
      !monogram_li ||
      !monogram_tab ||
      !commonly_btn ||
      !specific_mono_btn ||
      !apply_mono_btn ||
      !styles ||
      !questions.length
    ) return;

    // Show Monogram Tab
    monogram_li.addEventListener("click", () => {
      if (adjust_monoscroll) adjust_monoscroll.style.overflow= "hidden"
      custom_hidden.forEach(el => { el.classList.add("custom_hide");});
      apply_mono_btn.classList.add("hidden");
      styles.classList.add("hidden");
      monogram_tab.classList.remove("hidden");
      commonly_btn.classList.add("hidden");
      myTabContent.classList.add("hidden");
      specific_mono_btn.classList.remove("hidden");
      currentIndex = 0;
      updateMonoView();
    });
    
    // Apply Monogram
    apply_mono_btn.addEventListener("click", () => {
      getAllChildTabs().forEach(tab => tab.classList.add('hidden'));
      if (adjust_monoscroll) adjust_monoscroll.style.overflow= "auto"
      apply_mono_btn.classList.add("hidden");
      monogram_li.classList.add("select");
      monogram_li_select?.classList.remove("hidden");
      custom_hidden.forEach(el => { el.classList.remove("custom_hide");});
  updatePrice();
    mono_prev_tab?.classList.remove("mono-change");
    commonly_btn.classList.remove("hidden");
    myTabContent.classList.remove("hidden");
    specific_mono_btn.classList.add("hidden");
    monogram_tab.classList.add("hidden");
    styles.classList.remove("hidden");

    const monogramfont = document.querySelector("input[name='properties[monogram_font]']:checked");
    const monogramcolor = document.querySelector("input[name='properties[monogram_color]']:checked");
    const monogramposition = document.querySelector("input[name='properties[monogram_position]']:checked");


    const titleEl = monogram_li.querySelector(".custom-title");
    const bottomtitle = monogram_li.querySelector(".title.bottom");
    const toptitle = monogram_li.querySelector(".title.top");
    const selections = monogram_li.querySelector(".selections");
    const imgWrapper = monogram_li.querySelector(".img");
    const imgEl = imgWrapper?.querySelector("img");

    if (monogramfont && monogramcolor && monogramposition && imgEl && imgWrapper && titleEl && bottomtitle && selections) {
      const fontImg = monogramfont.getAttribute("font-img");
      const fontname = monogramfont.value;
      const colorname = monogramcolor.value;
      const fontposition = monogramposition.value;
      const monogramContainer = document.querySelector('.custom_monogram');
      const textInputs = monogramContainer.querySelectorAll('input[name="mono"]');
    const textValues = Array.from(textInputs)
      .map(input => input.value.trim())
      .filter(val => val !== '');

      titleEl.classList.add("hidden");
      bottomtitle.classList.add("hidden");
      toptitle.classList.remove("hidden");
      imgWrapper.classList.remove("hidden");
      imgEl.src = fontImg;

    selections.innerHTML = `${textValues.join(' ')}<br>${fontname}, ${colorname}, ${fontposition}`;

    }
  });


    function updateMonoView() {
      questions.forEach((q, i) => {
    const isCurrent = i === currentIndex;
    
    q.classList.toggle("hidden", !isCurrent);
    
    const child = q.querySelector(".customizer-list");
    if (child) {
      setTimeout ( ()=>{
      
      child.classList.toggle("openchilds", isCurrent);
    },200 )
    }
  });


      const isLast = currentIndex === questions.length - 1;
      const monoisLast = currentIndex === questions.length - 5 ;
      const checkedInputs = monogram_tab.querySelectorAll("input[type='radio']:checked, input[type='checkbox']:checked");
      const textInput = monogram_tab.querySelector("input[type='text']");
      const stepflow = monogram_tab.querySelector(".steps_flow");
      const isTextFilled = textInput && textInput.value.trim() !== "";
      const isValid = checkedInputs.length === 3 && isTextFilled;
    let currentstep = currentIndex + 1;

  const popupLabels = ["Initial", "Design", "Color", "Position"];
  let currentpopup = popupLabels[currentstep - 1] || "Unknown";

      if (stepflow) stepflow.innerHTML = `<p>${currentpopup} ( Step ${currentstep} of 4 )</p>`;


      // Show/hide apply button
      apply_mono_btn.classList.toggle("hidden", !(isLast && isValid));

      // Top next button
      mono_next_tab?.classList.toggle("hidden", isLast && isValid);
      mono_next_tab?.classList.toggle("disabled", isLast && !isValid);
      // Disable footer prev if first step
      mono_prev_addons?.classList.toggle("disabled", currentIndex === 0);
      // mono_next_addons?.classList.toggle("disabled",currentIndex === 3 && !isValid);
      // mono_next_addons?.classList.toggle("hidden",currentIndex === 3 && isValid);
      // apply-mono-addons?.classList.toggle("hidden",currentIndex === 3 && isValid);
      const isLastStep = currentIndex === 3;

  mono_next_addons?.classList.toggle("disabled", isLastStep && !isValid);
  mono_next_addons?.classList.toggle("hidden", isLastStep && isValid);
  apply_mono_addons?.classList.toggle("hidden", !(isLastStep && isValid));
    }

    function goToNext() {
      if (currentIndex < questions.length - 1) {
        currentIndex++;
        updateMonoView();
      }
    }

    //   Return from the monogram tab back to the styles view. Shared by the
    //   monogram prev button (on the first step) and the "remove monogram" action.
    function returnToStylesFromMonogram() {
      const modal = document.getElementById("fullscreen-modal");
      if (modal.style.display === "flex") adjustModal();
      monogram_tab.classList.add("hidden");
      styles.classList.remove("hidden");
      myTabContent.classList.remove("hidden");
      commonly_btn.classList.remove("hidden");
      specific_mono_btn.classList.add("hidden");
      custom_hidden.forEach(el => el.classList.remove("custom_hide"));
      const adjust_monoscroll = document.querySelector(".main-customizer-new .product_form_wrapper");
      if (adjust_monoscroll) adjust_monoscroll.style.overflow = "auto";
    }

    //   Clear the monogram selection: deselect its card, uncheck its add-ons and
    //   recompute the price. (The old code also summed charges into an
    //   `extramonocharges` variable that was never read — dropped.)
    function clearMonogramSelection() {
      const mainmonoli = document.querySelector('.adjut_monogram');
      const monogramOptions = document.querySelector('.monogram_options');
      prev_tab?.classList.add('disabled');
      mainmonoli?.querySelector('.option-card')?.classList.remove("select");
      const mono_selection = mainmonoli?.querySelector('.selections ');
      if (mono_selection) mono_selection.innerHTML = "";
      monogramOptions?.querySelectorAll('input.customizer:checked').forEach(input => {
        input.checked = false;
      });
      recalculatePrice({
        priceContainers: document.querySelectorAll('.custom_price'),
        cardPriceContainers: document.querySelectorAll('.card_custom_price'),
        extraInput: document.querySelector('.customizer_additional_charges input'),
      });
    }

    function goToPrev() {
      if (currentIndex > 0) {
        currentIndex--;
        updateMonoView();
      } else {
        // Return to styles tab only from .mono-prev-tab (not from .mono-prev-addons)
        returnToStylesFromMonogram();
        if (mono_prev_tab && mono_prev_tab.classList.contains('mono-change')) {
          clearMonogramSelection();
        }
      }
  }
    // Top navigation
    mono_prev_tab?.addEventListener("click", (e) => {
      e.preventDefault();
      goToPrev();
    });
    mono_next_tab?.addEventListener("click", (e) => {
      e.preventDefault();
      if (!mono_next_tab.classList.contains("disabled")) {
        goToNext();
      }
    });

    // Footer navigation (does not return to styles tab)
    mono_prev_addons?.addEventListener("click", (e) => {
      e.preventDefault();
      if (currentIndex > 0) {
        currentIndex--;
        updateMonoView();
      }
    });
    // remove monogram selection 
    remove_mono_selection?.addEventListener("click", (e) => {
      returnToStylesFromMonogram();
      const mainmonoli = document.querySelector('.adjut_monogram');
      mainmonoli?.querySelector('.custom-title')?.classList.remove("hidden");
      mainmonoli?.querySelector('.img')?.classList.add("hidden");
      clearMonogramSelection();
    });

    mono_next_addons?.addEventListener("click", (e) => {
      e.preventDefault();
      if (!mono_next_addons.classList.contains("disabled")) {
        goToNext();
    
      }
    });

    // Validate on input change
    monogram_tab.addEventListener("input", function () {
      if (currentIndex === questions.length - 5 || currentIndex === questions.length - 1) {
        updateMonoView();
      }
    });

    updateMonoView(); // Initial render
  });

  const inputs = document.querySelectorAll("#letterInputs input");
  const previewBox = document.getElementById("previewBox");

  // Restrict to alphanumeric only
  inputs.forEach(input => {
    input.addEventListener("input", () => {
      input.value = input.value.replace(/[^A-Z0-9.&]/gi, "").toUpperCase();
      updatePreview();
      if (input.nextElementSibling) {
        input.nextElementSibling.focus();
      }
    });
  });

  function updatePreview() {
    if (!previewBox) return;
    const text = Array.from(inputs)
      .map(input => input.value)
      .join(" ")
      .trim();
    previewBox.textContent = text;
  }

  document.addEventListener("DOMContentLoaded", function () {
    const previewBox = document.getElementById("previewBox");
    const letterInputs = document.querySelectorAll("#letterInputs input[type='text']");

    // Live update text in preview
    function updatePreviewText() {
      if (!previewBox) return;
      const letters = Array.from(letterInputs).map(input => input.value.toUpperCase());
      previewBox.textContent = letters.join(" ");
    }

    letterInputs.forEach(input => {
      input.addEventListener("input", updatePreviewText);
    });

    // Update text color
    document.querySelectorAll("input.mono-color").forEach(input => {
      input.addEventListener("change", function () {
        const color = this.getAttribute("data-color");
        if (color) {
          previewBox.style.color = color;
        }
      });
    });
        document.querySelectorAll("input.mono-font").forEach(input => {
    input.addEventListener("change", function () {
      const googleFont = this.getAttribute("data-google-font");
      const customFont = this.getAttribute("data-custom-font");
      const customFontname = this.value.trim();

      let fontFamily = "";

      //   Case 1: Full Google Fonts URL
      if (googleFont?.includes("fonts.googleapis.com")) {
        if (!document.querySelector(`link[data-font="${googleFont}"]`)) {
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = googleFont;
          link.setAttribute("data-font", googleFont);
          document.head.appendChild(link);
        }

        const match = googleFont.match(/family=([^:&]+)/);
        fontFamily = match ? decodeURIComponent(match[1].replace(/\+/g, " ")) : "";
      }

      //   Case 2: Font name only (e.g., "Roboto")
      else if (googleFont && !googleFont.includes("http")) {
        const fontLink = `https://fonts.googleapis.com/css2?family=${googleFont.replace(/ /g, '+')}`;
        if (!document.querySelector(`link[data-font="${fontLink}"]`)) {
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = fontLink;
          link.setAttribute("data-font", fontLink);
          document.head.appendChild(link);
        }

        fontFamily = googleFont;
      }

      //   Case 3: Custom font file URL
      else if (customFont) {
        let styleTag = document.getElementById("custom-font-style");
        if (!styleTag) {
          styleTag = document.createElement("style");
          styleTag.id = "custom-font-style";
          document.head.appendChild(styleTag);
        }

        styleTag.innerHTML = `
          @font-face {
            font-family: '${customFontname}';
            src: url('${customFont}');
          }
        `;

        fontFamily = customFontname;
      }

      //   Apply font to preview box
      if (fontFamily) {
        const preview = document.getElementById("previewBox");
        if (preview) {
          preview.style.fontFamily = `'${fontFamily}', sans-serif`;
        }
      }
    });
  });
  });
  // show selection of all selected option 
  function summary_styles() {
    const selectedStyleContainer = document.querySelector('.summary_style');
    const selectedAdditionalContainer = document.querySelector('.summary_additional');
    const summary_form = document.querySelector('.summary_form');

    // Clear visual tags
    selectedStyleContainer.innerHTML = '';
    selectedAdditionalContainer.innerHTML = '';

    // 🔄 Clear only hidden inputs from summary_form
    summary_form.querySelectorAll('input[type="hidden"]').forEach(input => input.remove());

    // 1. Styles and Contrasts
    const selectedLis = document.querySelectorAll('li.selected_options');
    selectedLis.forEach((li, index) => {
      let value = li.getAttribute('options-selected');
      let cardData = li.getAttribute('card-send');
      let reSelect = li.getAttribute('summary-edit');
      let current_title = li.getAttribute('current-title');
      let selection_steps = li.getAttribute('end-step');
  let styleName = li.getAttribute('style_name') || li.getAttribute('contras_name');
      const childType = li.getAttribute('childsin'); // "styles" or "contrasts"

      if (value) {
        value = value.replace(/^\[+|\]+$/g, '').trim();
        cardData = cardData.replace(/^\[+|\]+$/g, '').trim();
        reSelect = reSelect.replace(/^\[+|\]+$/g, '').trim();
        current_title = current_title.replace(/^\[+|\]+$/g, '').trim();
        selection_steps = selection_steps.replace(/^\[+|\]+$/g, '').trim();
        if (value === '') return;

        const tag = document.createElement('div');
        tag.className = 'tag';
        tag.innerHTML = `${value} <span reselection="${reSelect}" reselection-step="${selection_steps}" option-title="${current_title}" class="edit-btn">Edit✎</span>`;

        if (childType === 'styles') {
          selectedStyleContainer.appendChild(tag);
        } else if (childType === 'contrasts') {
          selectedAdditionalContainer.appendChild(tag);
        }

        const input = document.createElement('input');
        input.type = 'hidden';
        // input.name = `properties[${childType}_${index}]`;
        input.name = `properties[${styleName}]`;
        input.value = cardData;
        // input.value = value;
        summary_form.appendChild(input);
      }
    });

    // 2. Monogram Section
    const summary_monogram = document.querySelector('.summary_monogram');
    const monogramContainer = document.querySelector('.custom_monogram');
    summary_monogram.innerHTML = '';

    // Text inputs
    const textInputs = monogramContainer.querySelectorAll('input[name="mono"]');
    const textValues = Array.from(textInputs)
      .map(input => input.value.trim())
      .filter(val => val !== '');

    if (textValues.length > 0) {
      const textTag = document.createElement('div');
      textTag.classList.add('tag');
      textTag.innerHTML = `Text: ${textValues.join(' ')} <span class="edit-btn mono">Edit✎</span>`;
      summary_monogram.appendChild(textTag);

      const textInput = document.createElement('input');
      textInput.type = 'hidden';
      textInput.name = `properties[monogram_text]`;
      textInput.value = textValues.join(' ');
      summary_form.appendChild(textInput);
    }

    // Checked radios & checkboxes
    const checkedInputs = monogramContainer.querySelectorAll('input[type="radio"]:checked, input[type="checkbox"]:checked');
    checkedInputs.forEach(input => {
      const name = input.name;
      const value = input.value;

      const tagDiv = document.createElement('div');
      tagDiv.classList.add('tag');
      tagDiv.innerHTML = `${name}: ${value} <span class="edit-btn mono">Edit✎</span>`;
      summary_monogram.appendChild(tagDiv);

      const hiddenInput = document.createElement('input');
      hiddenInput.type = 'hidden';
      hiddenInput.name = name;
      hiddenInput.value = value;
      summary_form.appendChild(hiddenInput);
    });

    // 3. Sizes Section

  const summary_sizes = document.querySelector('.summary_sizes');
  const selected_sizes = Sizes.querySelector('.active.show');
  const size_tab_links = Sizes.querySelectorAll('.create-size-list a');

  summary_sizes.innerHTML = '';

  //   Get active tab name
  let active_tab_name = '';
  size_tab_links.forEach(link => {
    if (link.classList.contains('active')) {
      active_tab_name = link.innerText.trim();
    }
  });

  //   Append heading if tab name exists
  if (active_tab_name) {
    const tabHeading = document.createElement('span');
    tabHeading.classList.add('summary_title');
    tabHeading.textContent = `${active_tab_name} :`;
    summary_sizes.appendChild(tabHeading);

    //   Create hidden input for active tab name
    const hiddenTabInput = document.createElement('input');
    hiddenTabInput.type = 'hidden';
    hiddenTabInput.name = 'properties[Measurments]';
    hiddenTabInput.value = active_tab_name;
    summary_form.appendChild(hiddenTabInput);
  }

  //   Get selected inputs (radio, checkbox, number)
  const allInputs = selected_sizes.querySelectorAll(
    'input[type="radio"]:checked, input[type="checkbox"]:checked, input[type="number"]'
  );

  allInputs.forEach(input => {
    const type = input.type;
    const name = input.name;
    const value = input.value.trim();

    if (type === 'number' && value === '') return;

    //   Create visible tag
    const tagDiv = document.createElement('div');
    tagDiv.classList.add('tag');
    tagDiv.innerHTML = `${name}: ${value} <span class="edit-btn sizes">Edit✎</span>`;
    summary_sizes.appendChild(tagDiv);

    //   Create hidden input for form submission
    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.name = `properties[${name}]`;
    hiddenInput.value = value;
    summary_form.appendChild(hiddenInput);
  });
  }
  // start again
  const start_again_buttons = document.querySelectorAll('.start-button');
  const monogram_tabs = document.querySelectorAll(".mono-input-box");
  const card_stack =document.querySelector('.card-stack')
  start_again_buttons.forEach(startBtn => {
    startBtn.addEventListener('click', () => {
      // Disable the next button initially
      nextToSizeBtn.classList.add('disabled');
      nextToSizeBtn.innerHTML= "NEXT";
      const selections = document.querySelector(".selections");
      selections .innerHTML= "";
      
    myTabContent.classList.remove('hidden');
      // If the stack is active, simulate click to collapse
      if (card_stack.classList.contains('active')) {
        card_stack.click();
      }

      // 1. Remove "select" class from all option cards
      main_tab.querySelectorAll('a.select').forEach(a => a.classList.remove('select'));

      // 2. Remove all 'hasdisabled' classes
      document.querySelectorAll('li').forEach(li => li.classList.remove('hasdisabled'));

      // 3. Add back 'hasdisabled' where has-depended exists with a value
      document.querySelectorAll('li').forEach(li => {
        const attrValue = li.getAttribute('has-depended');
        if (attrValue && attrValue.trim() !== '') {
          li.classList.add('hasdisabled');
        }
      });

      // 4. Reset all display elements
      main_tab.querySelectorAll('.name').forEach(el => {
        el.innerHTML = "";
        el.classList.add('hidden');
      });

      main_tab.querySelectorAll('.top').forEach(el => el.classList.add('hidden'));
      main_tab.querySelectorAll('.bottom').forEach(el => el.classList.remove('hidden'));
      main_tab.querySelectorAll('.select_img').forEach(el => el.classList.add('hidden'));
      main_tab.querySelectorAll('.org_img').forEach(el => el.classList.remove('hidden'));

      // 5. Uncheck inputs in child tabs and Sizes
      getAllChildTabs().forEach(tab => {
        tab.querySelectorAll('input').forEach(input => input.checked = false);
      });

      Sizes.querySelectorAll('input').forEach(input => input.checked = false);

      // 6. Reset monogram inputs (text, radio, checkbox)
      const mainmonoli = document.querySelector('.adjut_monogram');
          mainmonoli.querySelector('.custom-title').classList.remove("hidden")
            mainmonoli.querySelector('.img').classList.add("hidden")
      monogram_tabs.forEach(box => {
        box.querySelectorAll('input').forEach(input => {
          if (input.type === 'text') {
            input.value = '';
          } else {
            input.checked = false;
          }
        });
      });

      // 7. Hide apply/prev buttons
      apply_btn.classList.add('hidden', 'disabled');
      prev_tab.classList.add('disabled');

      // 8. Clear any selected info display
      currently_open_option.classList.add('hidden');

      // 9. Reset visible tabs
      getAllChildTabs().forEach(tab => tab.classList.add('hidden'));
      main_tab.classList.remove('hidden');
      styles.classList.remove('hidden');
      nextToSizeBtn.classList.remove('hidden');
      Sizes.classList.add('hidden');

      // 10. Reset monogram navigation
      document.querySelector(".commonly")?.classList.remove("hidden");
      document.querySelector(".specific_mono")?.classList.add("hidden");
      document.querySelector(".custom_monogram")?.classList.add("hidden");
  const priceContainers = document.querySelectorAll('.custom_price');
  let basePriceAttr = priceContainers[0].getAttribute('default-price');
  // Remove Rs, commas, and spaces → then parse
  let basePrice = parseFloat(
    basePriceAttr.replace(/Rs\.?/i, "").replace(/,/g, "").trim()
  );
  priceContainers.forEach(container => {
    // Format back with commas
    container.innerHTML = `<span>Total: Rs ${basePrice.toLocaleString()}</span>`;
  });
    });
  });
  // reselection of option through Edit btn
  document.addEventListener('click', function (event) {
    if (event.target.classList.contains('edit-btn')) {
        custom_hidden.forEach(el => { el.classList.remove("custom_hide");});
      hide_selection.forEach(el => el.classList.remove('hidden'));
      if (event.target.classList.contains('sizes')) {
        if (custom_summary_page) {
          custom_summary_page.classList.add('hidden');
          Sizes.classList.remove('hidden');
            prev_tab.classList.add('summary-page');
        }
      }else if(event.target.classList.contains('mono')){
          const mono_prev_tab = document.querySelector(".mono-prev-tab");
        styles.classList.remove('hidden');
            mono_prev_tab.classList.add('summary-page');
          custom_summary_page.classList.add('hidden');
                myTabContent.classList.remove('hidden');
        monogram_li.click();
        nextToSizeBtn.innerHTML="NEXT";
        // main_tab.classList.add('ok');
      }else {
        if (styles) {
          const subTitle=event.target.getAttribute("option-title")
          const selection_steps=event.target.getAttribute("reselection-step")
        if (currently_open_option) {
      currently_open_option.classList.remove('hidden');
      currently_open_option.innerHTML = `<h4>${subTitle} : </h4> <span> (step ${selection_steps } of ${selection_steps } )</span>`;
    }
          nextToSizeBtn.innerHTML="NEXT";
          // prev_tab.classList.add('disabled');
          prev_tab.classList.add('summary-page');
          styles.classList.remove('hidden');
          myTabContent.classList.remove('hidden');
          main_tab.classList.add('hidden');
          custom_summary_page.classList.add('hidden');

          const reselection = event.target.getAttribute('reselection');
          const reselection_steps = event.target.getAttribute('reselection-step');

          //   Editing from the summary jumps straight to a step's list, so make
          //   sure all deferred child lists exist before we search them.
          if (typeof window.__injectCustomizerChildLists === 'function') {
            window.__injectCustomizerChildLists();
          }
          getAllChildTabs().forEach(tab => {
            let hasVisibleLi = false;

            const liItems = tab.querySelectorAll('li');
            liItems.forEach(li => {
              const parentId = li.getAttribute('parent-id');
              if (parentId === reselection) {
                li.classList.remove('hidden');
                hasVisibleLi = true;
              } else {
                li.classList.add('hidden');
              }
            });

            if (hasVisibleLi) {
              tab.classList.remove('hidden');
              tab.classList.add('openchilds');
              
            } else {
              tab.classList.add('hidden');
            }
          });
        }
      }

    }
  });
  // unchecked sizes radio inputs (delegated — avoids binding a listener per radio at init)
  document.addEventListener('click', function (e) {
    const radio = e.target;
    if (!(radio instanceof HTMLInputElement) || radio.type !== 'radio') return;
    if (!radio.closest('.create-size')) return;

    // Check if already checked
    if (radio.checked) {
      if (radio.hasAttribute('data-waschecked')) {
        radio.checked = false;
        radio.removeAttribute('data-waschecked');
      } else {
        radio.setAttribute('data-waschecked', 'true');
      }

      // Clear others in the same group
      document.querySelectorAll(`.create-size input[type="radio"][name="${radio.name}"]`).forEach(other => {
        if (other !== radio) {
          other.removeAttribute('data-waschecked');
        }
      });
    }

    validateSizeInputs()
  });
  // sizes option validation 
  function validateSizeInputs(buttonSelector = '.btn-next-tab') {
    if (!Sizes) return true;
    const standard_sizes = Sizes.querySelector('.standard.active.show');
    const measure_body = Sizes.querySelector('.measure_body.active.show');
    const smart_sizes = Sizes.querySelector('.smart_sizes');
    //   Collect only those question blocks that do NOT have a .skip_question inside
    const smart_questions = smart_sizes 
      ? Array.from(smart_sizes.querySelectorAll('.question_sizes')).filter(
          q => !q.querySelector('.skip_question')
        )
      : [];
    let allValid = true;
    if (standard_sizes || measure_body) {
      //   Validate active standard or measure section
      const activeSection = standard_sizes || measure_body;
      const inputs = activeSection.querySelectorAll(
        'input[required][type="radio"], input[required][type="number"]'
      );
      const radioNamesChecked = new Set();
      inputs.forEach(input => {
        if (input.type === 'radio') {
          const name = input.name;
          if (!radioNamesChecked.has(name)) {
            radioNamesChecked.add(name);
            const isChecked = activeSection.querySelector(`input[name="${name}"]:checked`);
            if (!isChecked) allValid = false;
          }
        } else if (input.type === 'number') {
          if (input.value.trim() === '') allValid = false;
        }
      });
    } else if (smart_questions.length > 0) {
      //   Validate each smart question individually
      smart_questions.forEach(question => {
        const inputs = question.querySelectorAll(
          'input[required][type="radio"], input[required][type="number"]'
        );
        const radioNamesChecked = new Set();
        let questionValid = true;

        inputs.forEach(input => {
          if (input.type === 'radio') {
            const name = input.name;
            if (!radioNamesChecked.has(name)) {
              radioNamesChecked.add(name);
              const isChecked = question.querySelector(`input[name="${name}"]:checked`);
              if (!isChecked) questionValid = false;
            }
          } else if (input.type === 'number') {
            if (input.value.trim() === '') questionValid = false;
          }
        });

        if (!questionValid) {
          allValid = false;
          question.classList.add('error'); // optional: highlight invalid question
        } else {
          question.classList.remove('error');
        }
      });
    }

    //   Toggle button state and class
    const button = document.querySelector(buttonSelector);
    if (button) {
      button.disabled = !allValid;
      button.classList.toggle('disabled', !allValid);
    }

    return allValid;
  }
    
  // Run validation only when inputs inside standard_sizes or measure_body change
  Sizes?.addEventListener('change', function (e) {
    const standard_sizes = Sizes.querySelector('.standard.active.show');
    const measure_body   = Sizes.querySelector('.measure_body.active.show');

    const activeSection = standard_sizes || measure_body;
    if (!activeSection) return;

    if (
      activeSection.contains(e.target) &&
      (e.target.matches('input[type="radio"]') || e.target.matches('input[type="number"]'))
    ) {
      validateSizeInputs();
    }
  });
  // text slider
  function applyMarquee() {
      //   Only measure cards that are actually on screen. Collection options render an
      //   <li> per product (paginated by 1000), so the document can hold thousands of
      //   .scroll-wrapper/.why-not-scroll nodes inside hidden lists. Reading scrollWidth
      //   on all of them forces a full-document layout flush in the same frame the newly
      //   opened list needs to paint. Scoping to visible lists + visible <li> keeps the
      //   read to just what the user can see.
      const visibleLists = document.querySelectorAll(
        '.overview-list:not(.hidden), .customizer-list:not(.hidden)'
      );
      if (!visibleLists.length) return;

      //   Collect all measurements first (reads), then apply class changes (writes), so
      //   the whole pass costs a single reflow instead of one per node.
      const updates = [];

      visibleLists.forEach(list => {
        list.querySelectorAll('li:not(.hidden) .scroll-wrapper').forEach(wrapper => {
          const textElement = wrapper.querySelector('.name') || wrapper.querySelector('.title');
          if (!textElement) return;
          updates.push([textElement, textElement.scrollWidth > wrapper.clientWidth]);
        });

        list.querySelectorAll('li:not(.hidden) .why-not-scroll').forEach(wrapper => {
          const textElement = wrapper.querySelector('.why_not');
          if (!textElement) return;
          updates.push([textElement, textElement.scrollWidth > wrapper.clientWidth]);
        });
      });

      updates.forEach(([textElement, overflowing]) => {
        textElement.classList.toggle('animate', overflowing);
      });
    }

    //   Coalesce the per-click re-measure into one run per animation frame so a burst
    //   of clicks can't trigger repeated layout passes.
    let marqueeScheduled = false;
    function scheduleMarquee() {
      if (marqueeScheduled) return;
      marqueeScheduled = true;
      requestAnimationFrame(() => {
        marqueeScheduled = false;
        applyMarquee();
      });
    }
    //   Run the first measure through the rAF scheduler too. option-card.js is injected
    //   after load (readyState === 'complete'), so a direct call would force a layout read
    //   during the open animation; scheduling it lets the open paint first.
    if (document.readyState === 'complete') {
      scheduleMarquee();
    } else {
      window.addEventListener('load', applyMarquee);
    }
    window.addEventListener('click', scheduleMarquee);

  // Price increases according to quantity
    const priceContainer = document.querySelector('.card_custom_price');
  const quantityInput = document.querySelector('.total_quantity');
  const increaseBtn = document.querySelector('.increase');
  const decreaseBtn = document.querySelector('.decrease');
  // customizer price and quantity
  function updateDisplay(quantity) {
    if (!priceContainer || !quantityInput) return;
    const basePrice = parseFloat(priceContainer.dataset.basePrice.replace(/,/g, ''));
    quantityInput.value = quantity; //   Correct for input
    const totalPrice = basePrice * quantity;
    const formattedPrice = totalPrice.toLocaleString('en-PK');
    priceContainer.querySelector('span').textContent = `PK. ${formattedPrice}`;
  }

  let quantity = parseInt(quantityInput?.value) || 1;

  increaseBtn?.addEventListener('click', () => {
    quantity++;
    updateDisplay(quantity);
  });

  decreaseBtn?.addEventListener('click', () => {
    if (quantity > 1) {
      quantity--;
      updateDisplay(quantity);
    }
  });
  // monoinputs flow
  const monograminputs = document.querySelectorAll('#letterInputs input');

  monograminputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
      const value = e.target.value;

      // Allow only letters (optional)
      // if (!/^[a-zA-Z]$/.test(value)) {
      //   e.target.value = '';
      //   return;
      // }

      // Move to next input if exists
      if (value && index < inputs.length - 1) {
        inputs[index + 1].focus();
      }
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !e.target.value && index > 0) {
        inputs[index - 1].focus();
      }
    });
  });
  monograminputs.forEach(input => {
    input.addEventListener('focus', () => {
      input.classList.remove('no-caret'); // show caret
      setTimeout(() => {
        input.classList.add('no-caret'); // hide after delay
      }, 700); // adjust to blink once (~700ms = 1 blink)
    });

    input.addEventListener('blur', () => {
      input.classList.remove('no-caret'); // reset when unfocused
    });
  });
  // font style according text number 
  function updateMonogramTextValue() {
    const monoFonts = document.querySelectorAll('.mono-input-box.fonts li[has-depended]');
    const letterInputs = document.querySelectorAll('input[name="mono"].blink-once');
    const hiddenInput = document.querySelector('input[name="properties[monogram text]"]');

    if (!letterInputs.length || !hiddenInput || !monoFonts.length) return;

    // Step 1: Count filled inputs
    const filledCount = Array.from(letterInputs).filter(input => input.value.trim() !== '').length;

    // Step 2: Loop through each font item and match with its disable limit
    monoFonts.forEach(font => {
      const disableLimitAttr = font.getAttribute('has-depended');
      const disableLimit = parseInt(disableLimitAttr, 10) || 0;

      if (filledCount <= disableLimit) {
        font.classList.remove('hasdisabled');
      } else {
        font.classList.add('hasdisabled');
      }
    });

    // Step 3: Combine values into hidden input
    const combinedValue = Array.from(letterInputs)
      .map(input => input.value.trim())
      .join('');

    hiddenInput.value = combinedValue;

    // Optional: Debug log
  }
  // Attach input event to each mono input
  document.querySelectorAll('input[name="mono"].blink-once').forEach(input => {
    input.addEventListener('input', updateMonogramTextValue);
  });
  // save selected options 
  document.querySelector('.save-btn')?.addEventListener('click', function () {
    const form = document.querySelector('.summary_form');
    if (!form) return;
    const inputs = form.querySelectorAll('input');
    const savedSelections = {};

    inputs.forEach(input => {
      // Skip disabled inputs
      if (input.disabled) return;

      const name = input.name;
      const value = input.value;

      // If name already exists (e.g., checkboxes with same name), store as array
      if (savedSelections[name]) {
        if (!Array.isArray(savedSelections[name])) {
          savedSelections[name] = [savedSelections[name]];
        }
        savedSelections[name].push(value);
      } else {
        savedSelections[name] = value;
      }
    });

    // Store in localStorage (or you can send to server if needed)
    localStorage.setItem('savedSelections', JSON.stringify(savedSelections));

    alert('Selections saved for future order!');
  });

  // load previous selection 
  document.querySelectorAll('.load-button').forEach(button => {
    button.addEventListener('click', function () {
      const savedSelections = JSON.parse(localStorage.getItem('savedSelections'));

      if (!savedSelections) {
        alert("No saved selections found.");
        return;
      }

      const recheckinputs = document.querySelectorAll(
        'input[type="radio"], input[type="checkbox"], input[type="text"], input[type="hidden"], input[type="number"], input[style_name]'
      );
      const sectionCards = document.querySelectorAll('a.option-card[style_name]');
      //   Loading a saved selection reveals matching cards across every step, so
      //   make sure all deferred child lists exist first.
      if (typeof window.__injectCustomizerChildLists === 'function') {
        window.__injectCustomizerChildLists();
      }
      getAllChildTabs().forEach(tab => tab.classList.add('hidden'));

      //   Highlight section headers if saved value found
      sectionCards.forEach(section => {
        const group = section.getAttribute('style_name');
        const savedKey = `properties[${group}]`;
        const savedValue = savedSelections[savedKey] || savedSelections[group];


        if (savedValue) {
          section.classList.add('select');
          const showselect = section.querySelector('.selected');
          if (showselect) {
            showselect.classList.remove('hidden');
          }
        }
      });

      //   Match inputs and apply saved values
      recheckinputs.forEach(input => {
        let group = '';
        let value = '';
        let savedKey = '';
        let savedValue = '';

        // Priority 1: all-selection
        if (input.hasAttribute('all-selection')) {
          const allSelection = input.getAttribute('all-selection');
          if (!allSelection.includes(':')) return;
          [group, value] = allSelection.split(':').map(s => s.trim());
        }
        // Priority 2: style_name + name
        else if (input.hasAttribute('style_name') && input.name) {
          group = input.name;
          value = input.getAttribute('style_name');
        }
        // Priority 3: name + value (basic inputs like number/text)
        else if (input.name && input.value !== undefined) {
          group = input.name;
          value = input.value;
        }

        if (!group) return;

        savedKey = `properties[${group}]`;
        savedValue = savedSelections[savedKey] || savedSelections[group]; //   fallback support

        if (!savedValue) return;


        if (input.type === 'radio' || input.type === 'checkbox') {
          if (savedValue.includes(value)) {
            input.checked = true;
            //   Trigger visual & logic updates
            if (typeof handleloadprevious === 'function') {
              handleloadprevious({ target: input });
            }
          }
        } else {
          input.value = savedValue;
        }
      });
      function handleloadprevious(event) {
    const input = event.target;
    const selectedParentId = input.getAttribute('data-main-parent');
    const allselection = input.getAttribute('all-selection');
    const selectOptions = input.getAttribute('select-options');
    const card_send = input.getAttribute('card-send');
    const selectParent = input.getAttribute('data-parent');
    const currentTitle = input.getAttribute('current-title');
    const endstep = input.getAttribute('end-step');
    const selectImg = input.getAttribute('select-img');
    const why_not_name = input.getAttribute('style_name');
    const restrictedOptionIdsStr = input.getAttribute('restricted_option_ids');
    const restricted_option_Pid = input.getAttribute('restricted_option_Pid');
    const has_depended = input.getAttribute('has-depended');
    const apply_btn = document.querySelector('.apply_btn');

    apply_btn?.classList.remove('disabled');
  // Parse restricted IDs into array
    const restrictedOptionIds = restrictedOptionIdsStr
      ? restrictedOptionIdsStr.replace(/[\[\]\s"]/g, '').split(',')
      : [];
  hasOptions(restrictedOptionIds, restricted_option_Pid, selectedParentId, why_not_name)

    // UI selection visuals
    applySelectionVisuals(document.querySelector(`li[data-id="${selectedParentId}"]`), {
      selectImg, selectOptions, card_send, allselection, selectParent, currentTitle, endstep,
    });
  //   // Price Update Logic
    recalculatePrice({
      priceContainers: document.querySelectorAll('.custom_price'),
      cardPriceContainers: document.querySelectorAll('.card_custom_price'),
      extraInput: document.querySelector('.customizer_additional_charges input'),
      roundedTotal: true,
      setAllAttrs: false,
    });
  }

      //   Populate monogram_text into letter inputs
      const monogramText = savedSelections['properties[monogram_text]'];
      if (monogramText) {
        const letterInputs = document.querySelectorAll('.letter-inputs input[name="mono"]');
        const chars = monogramText.replace(/\s+/g, '').split('');

        letterInputs.forEach((input, index) => {
          input.value = chars[index] || '';
                    const apply_mono_btn = document.querySelector(".apply_mono_btn");
          apply_mono_btn?.click();
          updatePreview()
        });

      }

      alert('Previous selection loaded!');
    });
  });

  // info popup open 
  document.querySelectorAll('.info_btn').forEach(button => {
    button.addEventListener('click', () => {

      const targetId = button.getAttribute('data-target')?.replace('#', '');

      document.querySelectorAll('.modal').forEach(modal => {
        if (modal.id === targetId) {

          //   Append the matched modal into the .info-popup element
          const infoPopup = document.querySelector('.info-popup');
          if (infoPopup && !infoPopup.contains(modal)) {
            infoPopup.appendChild(modal);
          }

          modal.classList.add('show');
        } else {
          modal.classList.remove('show');
        }
      });

      const stopscroll = document.querySelector('.customizer_content .product_form_wrapper');
      if (stopscroll) {
        stopscroll.style.overflow = "hidden";
      }

      const adjust_height = document.querySelectorAll('.openchilds');
      adjust_height.forEach(el => {
        el.style.maxHeight = "none";
        el.style.overflow = "hidden";
      });
    });
  });
  // Handle close button to hide modal
  document.querySelectorAll('.close, .close_btn,.modal.fade').forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
      const targetId = closeBtn.getAttribute('data-target')?.replace('#', '');

      document.querySelectorAll('.modal').forEach(modal => {
        if (modal.id === targetId) {
        }
          modal.classList.remove('show'); // Remove 'show' from matched modal
            const stopscroll = document.querySelector('.customizer_content .product_form_wrapper')
            const stopscroll1 = document.querySelector('.modal.fade')
      if (stopscroll) stopscroll.style.overflow = "auto"
      });
        const adjust_height = document.querySelectorAll('.openchilds');
  adjust_height.forEach(el => {
    el.style.maxHeight = "max-content"; // use maxHeight (camelCase) and "none" instead of "auto"
    el.style.overflow = "auto"; // use maxHeight (camelCase) and "none" instead of "auto"
  });
    });
  });
  // open and close size guide popup
  function myFunction() {
    var popup = document.getElementById("myPopup");
    popup?.classList.toggle("show");
  }
