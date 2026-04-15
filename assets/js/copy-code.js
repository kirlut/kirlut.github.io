document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll("figure.highlight, div.highlight").forEach(function (block) {
    var btn = document.createElement("button");
    btn.className = "copy-btn";
    btn.textContent = "Copy";
    btn.setAttribute("aria-label", "Copy code to clipboard");

    btn.addEventListener("click", function () {
      // Get text from the code element, stripping line numbers if present
      var code = block.querySelector("td.code pre, pre code, pre");
      if (!code) return;
      var text = code.innerText;

      navigator.clipboard.writeText(text).then(function () {
        btn.textContent = "Copied!";
        setTimeout(function () {
          btn.textContent = "Copy";
        }, 2000);
      });
    });

    block.style.position = "relative";
    block.appendChild(btn);
  });
});
