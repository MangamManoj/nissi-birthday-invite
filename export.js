/**
 * Photo upload + PNG export for WhatsApp invitation posters.
 * Exports at native artboard size (1080×1920 or 1080×1080).
 */

(function () {
  const statusEl = document.getElementById("status");
  const photoInput = document.getElementById("photo-input");
  const exportAllBtn = document.getElementById("export-all");
  const posters = Array.from(document.querySelectorAll(".poster"));

  function setStatus(msg) {
    if (statusEl) statusEl.textContent = msg;
  }

  function waitForFonts() {
    if (document.fonts && document.fonts.ready) {
      return document.fonts.ready;
    }
    return Promise.resolve();
  }

  function applyPhoto(dataUrl) {
    posters.forEach((poster) => {
      const inner = poster.querySelector(".photo-inner");
      if (!inner) return;

      let img = inner.querySelector("img.baby-photo");
      const placeholder = inner.querySelector(".photo-slot");

      if (!img) {
        img = document.createElement("img");
        img.className = "baby-photo";
        img.alt = "Nissita Mangam";
        inner.appendChild(img);
      }

      img.src = dataUrl;
      if (placeholder) placeholder.style.display = "none";
    });
    setStatus("Photo applied to all posters. Ready to export.");
  }

  photoInput.addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => applyPhoto(reader.result);
    reader.readAsDataURL(file);
  });

  async function exportPoster(poster) {
    const filename =
      poster.dataset.filename || "nissita-invitation.png";

    // Temporarily remove CSS scale so capture is at native pixels
    const scaleWrap = poster.closest(".preview-scale");
    const prevTransform = scaleWrap ? scaleWrap.style.transform : "";
    const prevHeight = scaleWrap ? scaleWrap.style.height : "";
    const prevWidth = scaleWrap ? scaleWrap.style.width : "";

    if (scaleWrap) {
      scaleWrap.style.transform = "none";
      scaleWrap.style.height = poster.classList.contains("portrait")
        ? "1920px"
        : "1080px";
      scaleWrap.style.width = "1080px";
    }

    await waitForFonts();
    // Allow layout to settle after un-scaling
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    const canvas = await html2canvas(poster, {
      scale: 1,
      width: poster.offsetWidth,
      height: poster.offsetHeight,
      backgroundColor: null,
      useCORS: true,
      allowTaint: true,
      logging: false,
    });

    if (scaleWrap) {
      scaleWrap.style.transform = prevTransform;
      scaleWrap.style.height = prevHeight;
      scaleWrap.style.width = prevWidth;
    }

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve(false);
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        resolve(true);
      }, "image/png");
    });
  }

  async function exportAll() {
    if (typeof html2canvas !== "function") {
      setStatus("Export library failed to load. Check your network and refresh.");
      return;
    }

    exportAllBtn.disabled = true;
    setStatus("Exporting posters…");

    try {
      for (let i = 0; i < posters.length; i++) {
        setStatus(`Exporting ${i + 1} of ${posters.length}…`);
        await exportPoster(posters[i]);
        // Brief pause so browsers don't block multiple downloads
        await new Promise((r) => setTimeout(r, 400));
      }
      setStatus("Done — 4 PNGs downloaded (portrait & square × both themes).");
    } catch (err) {
      console.error(err);
      setStatus("Export failed. Open this page via a local server if needed.");
    } finally {
      exportAllBtn.disabled = false;
    }
  }

  exportAllBtn.addEventListener("click", exportAll);

  const exportVisibleBtn = document.getElementById("export-visible");
  if (exportVisibleBtn) {
    exportVisibleBtn.addEventListener("click", async () => {
      // Export first (portrait blush) as a quick single download
      setStatus("Exporting Portrait A…");
      await exportPoster(posters[0]);
      setStatus("Portrait A downloaded. Use “Export all PNGs” for every size/theme.");
    });
  }

  waitForFonts().then(() => {
    setStatus("Add a baby photo, then export PNGs for WhatsApp.");
  });
})();
