let inp_vals = document.querySelectorAll('.custom_addons .addon_value')
let btns = document.querySelectorAll('.custom_addons .addon_label')

btns.forEach(btn=>{
  btn.addEventListener('click',function(){
    const targetEl = this.parentElement.parentElement.parentElement.querySelector('.addon_label_txt').querySelector('.inner_addon_label_txt')
    const details = this.closest(".addon_wrap ").querySelector('.addon_label_txt')
     details.style.background = "black"
     details.style.color = "white"
    console.log(targetEl)
    const targetPrice = this.dataset.price
    const targetLabel = this.dataset.label
    console.log(targetPrice)
    console.log(targetLabel)
    targetEl.innerHTML = ""
    targetEl.innerHTML = `${targetLabel} | RS.${targetPrice}.00` 
    // targetEl.click()
  })
})
 
  const swiper = new Swiper('.mySwiper', {
    loop: true,
    slidesPerView: 1,
     navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
   
  });
  
const addons_mono_close = document.querySelector('.addon_wrap_mono.addons-monogram-close');
const addons_mono_header_remove = document.querySelector('.header');
const addons_mono = document.querySelector('.addon_info_wrap.addons-monogram');
const closemonobtn = document.getElementById("close-mono");

// elements that need z-index control
if (addons_mono_close) {
  addons_mono_close.addEventListener("click", () => {
    const floatingElements = document.querySelectorAll('#ShopifyChat, #whatsapp-widget-root, #back-to-top');
    // console.log("floatingElements",floatingElements)
    addons_mono.classList.remove("hidden");
    addons_mono.classList.add("popup-active");
    addons_mono_header_remove.classList.add("hidden");
    document.body.classList.add("overflow_hidden");

    // apply z-index hidden class
    floatingElements.forEach(el => {
      if (el) {
        el.classList.add("zindex-hidden");
      }
    });
  });
}

if (closemonobtn) {
  closemonobtn.addEventListener("click", () => {
    addons_mono_header_remove.classList.remove("hidden");
    addons_mono.classList.add("hidden");
    addons_mono.classList.remove("popup-active");
    document.body.classList.remove("overflow_hidden");
const floatingElements = document.querySelectorAll('#ShopifyChat, #whatsapp-widget-root, #back-to-top');
    // restore z-index
    floatingElements.forEach(el => {
      if (el) {
        el.classList.remove("zindex-hidden");
      }
    });
  });
}



function fontvalidation(){
  const letterInputs = document.querySelectorAll('.monogram_options_addons #letterInputs input');
  const monoFonts = document.querySelectorAll('.mono-input-box.fonts li[has-depended]');
  
  // Count how many letter inputs are filled (non-empty)
  const filledCount = Array.from(letterInputs).filter(input => input.value.trim() !== '').length;

  monoFonts.forEach(font => {
    const disableLimitAttr = font.getAttribute('has-depended');
    const disableLimit = parseInt(disableLimitAttr, 10) || 0;

    if (filledCount <= disableLimit) {
      font.classList.remove('hasdisabled');
    } else {
      font.classList.add('hasdisabled');
    }
  });
} 
// monogram next previous 
document.addEventListener("DOMContentLoaded", function () {
    const apply_mono_addons = document.querySelector(".apply-mono-addons");
    const mono_prev_addons = document.querySelector(".mono-prev-addons");
    const mono_next_addons = document.querySelector(".mono-next-addons");
    const monogramContainer = document.querySelector('.addon_info_wrap.addons-monogram');

    if (!apply_mono_addons || !mono_prev_addons || !mono_next_addons || !monogramContainer) return;

    const questions = monogramContainer.querySelectorAll(".mono-input-box");
    let currentIndex = 0;

    function updateMonoAddonsView() {



      questions.forEach((q, i) => {
        const isCurrent = i === currentIndex;
        q.classList.toggle("hidden", !isCurrent);
        const child = q.querySelector(".customizer-list");
        if (child) {
          setTimeout(() => child.classList.toggle("openchilds", isCurrent), 200);
        }
      });

      const mono_stepflow = document.querySelector(".monogram_options_addons .steps_flow");
      const mono_currentStep = currentIndex + 1;
      const mono_popupLabels = ["Initial", "Design", "Color", "Position"];
      const mono_currentpopup = mono_popupLabels[mono_currentStep - 1] || "Unknown";
      if (mono_stepflow) {
        mono_stepflow.innerHTML = `<p>${mono_currentpopup} ( Step ${mono_currentStep} of 4 )</p>`;
      }

      const isLastStep = currentIndex === questions.length - 1;
      const checkedInputs = monogramContainer.querySelectorAll("input[type='radio']:checked, input[type='checkbox']:checked");
      const textInput = monogramContainer.querySelector("input[type='text']");
      const isTextFilled = textInput && textInput.value.trim() !== "";
      const isValid = checkedInputs.length === 3 && isTextFilled;
      const not_previous = currentIndex === 0

      mono_prev_addons.classList.toggle("disabled", not_previous);
      mono_next_addons.classList.toggle("disabled", isLastStep && !isValid);
      mono_next_addons.classList.toggle("hidden", isLastStep && isValid);
      apply_mono_addons.classList.toggle("hidden", !(isLastStep && isValid));
      console.log("currentIndex",currentIndex)
    }

    function goToNextAddonStep() {
      if (currentIndex < questions.length - 1) {
        currentIndex++;
        updateMonoAddonsView();
        // console.log("currentIndex",currentIndex)
      }
    }
    
    function goToPrevAddonStep() {
      if (currentIndex > 0) {
        currentIndex--;
        updateMonoAddonsView();
        // console.log("currentIndex",currentIndex)
      }
    }
  updateMonoAddonsView();
    // Apply Monogram Addon Selection
    apply_mono_addons.addEventListener("click", () => {
      // const floatingElements = document.querySelectorAll('#ShopifyChat, #whatsapp-widget-root, #back-to-top');
      // // restore z-index
      // floatingElements.forEach(el => {
      //   if (el) {
      //     el.classList.remove("zindex-hidden");
      //   }
      const closemono = document.querySelector(".addon_wrap_mono.addons-monogram-close");
      const addons_mono_select = document.querySelector(".addons_mono_select");
      const addons_mono = document.querySelector(".addon_info_wrap.addons-monogram");
      
      const textInputs = monogramContainer.querySelectorAll('input[name="mono"]');
      const textValues = Array.from(textInputs).map(input => input.value.trim()).filter(val => val !== '');
      
      const monogramfont = monogramContainer.querySelector("input[name='properties[monogram_font]']:checked");
      const monogramfont_price = monogramfont.getAttribute("more-charges")
      const monogramcolor = monogramContainer.querySelector("input[name='properties[monogram_color]']:checked");
      const monogramcolor_price = monogramcolor.getAttribute("more-charges")
      const monogramposition = monogramContainer.querySelector("input[name='properties[monogram_position]']:checked");
      const monogramposition_price = monogramposition.getAttribute("more-charges")
      
      const previewText = `Your monogram selection:<br>${textValues.join(' ')}, ${monogramfont?.value || ''}, ${monogramcolor?.value || ''}, ${monogramposition?.value || ''}`;
      const monogramselection = `${textValues.join(' ')}, ${monogramfont?.value || ''}, ${monogramcolor?.value || ''}, ${monogramposition?.value || ''}`;
      
      if (addons_mono_select) {
        addons_mono_select.innerHTML = previewText;
        
        const hiddenInput = document.createElement("input");
        hiddenInput.type = "hidden";
        hiddenInput.name = "properties[monogram]";
        hiddenInput.value = monogramselection;
        
        addons_mono_select.appendChild(hiddenInput);
      }
      
      if (closemono && addons_mono) {
        addons_mono.classList.add("hidden");
        closemono.firstElementChild.style.color = "white";
        closemono.style.backgroundColor = "black";
        document.body.classList.remove("overflow_hidden");
        addons_mono_header_remove.classList.remove("hidden")
      }
    });
    
    

    // Navigation
    mono_next_addons.addEventListener("click", (e) => {
      e.preventDefault();
      if (!mono_next_addons.classList.contains("disabled")) {
        goToNextAddonStep();
      }
    });

    mono_prev_addons.addEventListener("click", (e) => {
      e.preventDefault();
      goToPrevAddonStep();
    });

    // Live validation
    monogramContainer.addEventListener("input", function () {
      updateMonoAddonsView();
      fontvalidation()
    });

    // Initialize first view
    // updateMonoAddonsView();
});
// Disable Enter key inside monogram letter inputs
document.addEventListener("DOMContentLoaded", function () {
  const letterInputs = document.querySelectorAll('.monogram_options_addons #letterInputs input');
  letterInputs.forEach(input => {
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        return false;
      }
    });
  });
});
// monogram inputs , fonts  
document.addEventListener("DOMContentLoaded", function () {
    // const mono_inputs = document.querySelectorAll(".monogram_options_addons #letterInputs input");
    // const mono_previewBox = document.querySelector(".monogram_options_addons .preview-box");

    // Restrict to alphanumeric only & auto-focus next
    // mono_inputs.forEach((input, index) => {
    //   input.addEventListener("input", (e) => {
    //     e.target.value = e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    //     updatePreviewText();

    //     if (e.target.value && index < mono_inputs.length - 1) {
    //       mono_inputs[index + 1].focus();
    //     }
    //   });

    //   input.addEventListener("keydown", (e) => {
    //     if (e.key === "Backspace" && !e.target.value && index > 0) {
    //       mono_inputs[index - 1].focus();
    //     }
    //   });

    //   input.addEventListener("focus", () => {
    //     input.classList.remove("no-caret");
    //     setTimeout(() => {
    //       input.classList.add("no-caret");
    //     }, 700);
    //   });

    //   input.addEventListener("blur", () => {
    //     input.classList.remove("no-caret");
    //   });
    // });
    const mono_inputs = document.querySelectorAll(".monogram_options_addons #letterInputs input");
  const mono_previewBox = document.querySelector(".monogram_options_addons .preview-box");

  // Restrict to A–Z, 0–9, . and & only; auto-focus next field
  mono_inputs.forEach((input, index) => {
    input.addEventListener("input", (e) => {
      // Allow A–Z, 0–9, ., &
      e.target.value = e.target.value.replace(/[^A-Z0-9.&]/gi, "").toUpperCase();
      updatePreviewText();

      if (e.target.value && index < mono_inputs.length - 1) {
        mono_inputs[index + 1].focus();
      }
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !e.target.value && index > 0) {
        mono_inputs[index - 1].focus();
      }
    });

    input.addEventListener("focus", () => {
      input.classList.remove("no-caret");
      setTimeout(() => {
        input.classList.add("no-caret");
      }, 700);
    });

    input.addEventListener("blur", () => {
      input.classList.remove("no-caret");
    });
  });


    function updatePreviewText() {
      const letters = Array.from(mono_inputs).map(input => input.value.toUpperCase());
      mono_previewBox.textContent = letters.join(" ");
    }

    // Text Color Update
    document.querySelectorAll(".monogram_options_addons input.mono-color").forEach(input => {
      input.addEventListener("change", function () {
        const color = this.getAttribute("data-color");
        if (color) {
          mono_previewBox.style.color = color;
        }
      });
    });

    // Font Family Update
    document.querySelectorAll(".monogram_options_addons input.mono-font").forEach(input => {
      input.addEventListener("change", function () {
        const googleFont = this.getAttribute("data-google-font");
        const customFont = this.getAttribute("data-custom-font");
        const customFontname = this.value.trim();

        let fontFamily = "";

        // Google Fonts full URL
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

        // Google Fonts short name
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

        // Custom font URL
        else if (customFont) {
          const styleTag = document.getElementById("custom-font-style") || document.createElement("style");
          styleTag.id = "custom-font-style";
          styleTag.innerHTML = `
            @font-face {
              font-family: '${customFontname}';
              src: url('${customFont}');
            }
          `;
          document.head.appendChild(styleTag);
          fontFamily = customFontname;
        }

        if (fontFamily) {
          mono_previewBox.style.fontFamily = `'${fontFamily}', sans-serif`;
        }
      });
    });
});
//  monogram price update 
document.addEventListener('DOMContentLoaded', function () {
  const container = document.querySelector('.main-custom-addons');
  const totalPriceElement = document.querySelector('.product-orignal-price');
  const additional_charges_addons = document.querySelector('.additional_charges input');
  const monogramContainer = document.querySelector('.addon_info_wrap.addons-monogram');
  const apply_mono_addons = document.querySelector('.apply-mono-addons');
  const addons_remove_monogram = document.querySelector('.addons-remove-monogram');

  if (!container || !totalPriceElement) return;

  let basePriceInPaisa = parseInt(totalPriceElement.getAttribute('data-price-value')) || 0;
  let basePriceInRupees = basePriceInPaisa / 100;
  let monoApplied = false;

  // 🔹 calculate mono charges and save in attribute
  function updateMonoPrice() {
    if (!monogramContainer) return;

    const monogramfont = monogramContainer.querySelector("input[name='properties[monogram_font]']:checked");
    const monogramcolor = monogramContainer.querySelector("input[name='properties[monogram_color]']:checked");
    const monogramposition = monogramContainer.querySelector("input[name='properties[monogram_position]']:checked");

    const monogramfont_price = parseInt(monogramfont?.getAttribute("more-charges")) || 0;
    const monogramcolor_price = parseInt(monogramcolor?.getAttribute("more-charges")) || 0;
    const monogramposition_price = parseInt(monogramposition?.getAttribute("more-charges")) || 0;

    const monoExtraCharges = monogramfont_price + monogramcolor_price + monogramposition_price;

    console.log("Mono Charges Calculated:", monoExtraCharges);
    totalPriceElement.setAttribute("mono-price", monoExtraCharges);
  }

  // 🔹 calculate total
  function updateTotal() {
    let extraChargesRupees = 0;

    // ✅ normal addons
    const checkedInputs = container.querySelectorAll('input:checked');
    checkedInputs.forEach(input => {
      const charge = parseInt(input.getAttribute('more-charges')) || 0;
      extraChargesRupees += charge;
    });

    // ✅ add mono-price only if applied
    if (monoApplied) {
      const monoPrice = parseInt(totalPriceElement.getAttribute("mono-price")) || 0;
      extraChargesRupees += monoPrice;
    }

    const totalInRupees = basePriceInRupees + extraChargesRupees;

    // ✅ update UI
    totalPriceElement.textContent = '$' + totalInRupees.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    const updatedPaisa = Math.round(totalInRupees * 100);
    totalPriceElement.setAttribute('data-price-value', updatedPaisa);

    if (additional_charges_addons) {
      additional_charges_addons.value = `$${extraChargesRupees.toFixed(0)}`;
    }
  }

  // ✅ Event delegation: handle removing monogram and unchecking
  document.addEventListener("click", (e) => {
    const target = e.target.closest(".addons-remove-monogram");
    if (!target) return;
    target.classList.add("hidden")
    if (monogramContainer) {
      apply_mono_addons.classList.add("hidden")
      const checkedInputs = monogramContainer.querySelectorAll("input:checked");
      const textInputs = monogramContainer.querySelectorAll("input[type='text']");
      console.log("checkedInputs", checkedInputs.length, checkedInputs);
      const addons_mono_select = document.querySelector(".addons_mono_select");
      addons_mono_select.innerHTML = ""
      closemonobtn.click();
      const closemono = document.querySelector(".addon_wrap_mono.addons-monogram-close");
        closemono.firstElementChild.style.color = "black";
      closemono.style.backgroundColor = "white";

      textInputs.forEach(input => {
        input.value = "";
      });
      checkedInputs.forEach(input => {
        input.checked = false;
      });

      // 🔹 Reset mono state and price
      monoApplied = false;
      totalPriceElement.setAttribute("mono-price", 0);
      updateTotal(); // ✅ recalc total after unchecking
    }
  });

  // ✅ normal addons listener
  container.addEventListener('change', function (e) {
    if (e.target.matches('input[type="checkbox"], input[type="radio"]')) {
      updateTotal();
    }
  });

  // ✅ monogram inputs listener → only update mono-price attribute
  if (monogramContainer) {
    monogramContainer.addEventListener('change', function () {
      updateMonoPrice();
    });
  }

  // ✅ apply button → mark as applied and recalc total
  if (apply_mono_addons) {
    apply_mono_addons.addEventListener("click", function () {
      updateMonoPrice();
      monoApplied = true;
      updateTotal();
      addons_remove_monogram.classList.remove("hidden")
    });
  }
});
// addons 
document.addEventListener('DOMContentLoaded', function () {
  const container = document.querySelector('.main-custom-addons');
  const totalPriceElement = document.querySelector('.product-orignal-price');
  const additional_charges_addons = document.querySelector('.additional_charges input');
  const monogramContainer = document.querySelector('.addon_info_wrap.addons-monogram');
  const apply_mono_addons = document.querySelector('.apply-mono-addons');
  const addons_remove_monogram = document.querySelector('.addons-remove-monogram');

  // if (!container || !totalPriceElement) return;

  let basePriceInPaisa = parseInt(totalPriceElement.getAttribute('data-price-value')) || 0;
  let basePriceInRupees = basePriceInPaisa / 100;
  let monoApplied = false;
  let lastCheckedRadio = null;

  // 🔹 Calculate Monogram Extra Charges
  function updateMonoPrice() {
    if (!monogramContainer) return 0;

    const monogramfont = monogramContainer.querySelector("input[name='properties[monogram_font]']:checked");
    const monogramcolor = monogramContainer.querySelector("input[name='properties[monogram_color]']:checked");
    const monogramposition = monogramContainer.querySelector("input[name='properties[monogram_position]']:checked");

    const monogramfont_price = parseInt(monogramfont?.getAttribute("more-charges")) || 0;
    const monogramcolor_price = parseInt(monogramcolor?.getAttribute("more-charges")) || 0;
    const monogramposition_price = parseInt(monogramposition?.getAttribute("more-charges")) || 0;

    const monoExtraCharges = monogramfont_price + monogramcolor_price + monogramposition_price;
    totalPriceElement.setAttribute("mono-price", monoExtraCharges);
    return monoExtraCharges;
  }

  // 🔹 Update total price (with addons + monogram if applied)
  function updateTotal() {
    let extraChargesRupees = 0;

    // ✅ normal addons
    const checkedInputs = container.querySelectorAll('input:checked');
    checkedInputs.forEach(input => {
      const charge = parseInt(input.getAttribute('more-charges')) || 0;
      extraChargesRupees += charge;
    });

    // ✅ monogram (if applied)
    if (monoApplied) {
      const monoPrice = updateMonoPrice();
      extraChargesRupees += monoPrice;
    }

    // ✅ total calculation
    const totalInRupees = basePriceInRupees + extraChargesRupees;

    totalPriceElement.textContent = '$' + totalInRupees.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    const updatedPaisa = Math.round(totalInRupees * 100);
    totalPriceElement.setAttribute('data-price-value', updatedPaisa);

    if (additional_charges_addons) {
      additional_charges_addons.value = `$${extraChargesRupees.toFixed(0)}`;
    }
  }

  // 🔹 Handle label click → UI + toggle + total update
  const btns = document.querySelectorAll('.custom_addons .addon_label');
  btns.forEach(btn => {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      const input = this.previousElementSibling;
      if (!input) return;

      // ✅ Toggle behavior for radios
      if (input.type === "radio") {
        if (lastCheckedRadio === input && input.checked) {
          input.checked = false;
          lastCheckedRadio = null;
        } else {
          input.checked = true;
          lastCheckedRadio = input;
        }
      } else if (input.type === "checkbox") {
        input.checked = !input.checked;
      }

      // ✅ Update label UI
      const labelTxt = this.closest(".addon_wrap").querySelector('.addon_label_txt');
      const targetEl = labelTxt?.querySelector('.inner_addon_label_txt');
      const targetPrice = this.dataset.price;
      const targetLabel = this.dataset.label;

      if (input.checked) {
        labelTxt.style.background = "black";
        labelTxt.style.color = "white";
        if (targetEl) targetEl.innerHTML = `${targetLabel} | $${targetPrice}.00`;
      } else {
        labelTxt.style.background = "";
        labelTxt.style.color = "";
        if (targetEl) targetEl.innerHTML = "Select Option";
      }

      updateTotal();
    });
  });

  // 🔹 Fallback: input change watcher
  container.addEventListener('change', function (e) {
    if (e.target.matches('input[type="checkbox"], input[type="radio"]')) {
      updateTotal();
    }
  });

  // 🔹 When monogram options change → update mono-price live if applied
  if (monogramContainer) {
    monogramContainer.addEventListener('change', function () {
      if (monoApplied) updateTotal();
    });
  }

  // 🔹 Apply monogram → mark as applied + recalc
  if (apply_mono_addons) {
    apply_mono_addons.addEventListener("click", function () {
      monoApplied = true;
      updateTotal();
      addons_remove_monogram?.classList.remove("hidden");
    });
  }

  // 🔹 Remove monogram → reset fields + recalc
  if (addons_remove_monogram) {
    document.addEventListener("click", (e) => {
      const target = e.target.closest(".addons-remove-monogram");
      if (!target) return;

      target.classList.add("hidden");
      if (monogramContainer) {
        apply_mono_addons?.classList.add("hidden");
        const checkedInputs = monogramContainer.querySelectorAll("input:checked");
        const textInputs = monogramContainer.querySelectorAll("input[type='text']");
        const addons_mono_select = document.querySelector(".addons_mono_select");

        addons_mono_select.innerHTML = "";
        const closemono = document.querySelector(".addon_wrap_mono.addons-monogram-close");
        closemono.firstElementChild.style.color = "black";
        closemono.style.backgroundColor = "white";

        textInputs.forEach(input => (input.value = ""));
        checkedInputs.forEach(input => (input.checked = false));

        monoApplied = false;
        totalPriceElement.setAttribute("mono-price", 0);
        updateTotal();
      }
    });
  }

  // 🔹 Init once
  updateTotal();
});
