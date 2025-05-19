(function () {
  const results = [];

  // Function to extract URLs with their source file and query parameters
  function extractURLsFromCode(code, sourceFile) {
    const regex = /(?<=(\"|\'|\`))\/[a-zA-Z0-9_?&=\/\-\#\.]*(?=(\"|\'|\`))/g;
    const matches = code.matchAll(regex);
    for (const match of matches) {
      const url = match[0];
      const params = extractQueryParams(url); // Extract query parameters
      results.push({ url, params, source: sourceFile });
    }
  }

  // Function to extract query parameters from a URL
  function extractQueryParams(url) {
    const params = {};
    const queryString = url.split('?')[1];
    if (queryString) {
      queryString.split('&').forEach(param => {
        const [key, value] = param.split('=');
        if (key && value) params[key] = decodeURIComponent(value);
      });
    }
    return params;
  }

  // Process external scripts
  const scripts = document.getElementsByTagName("script");
  for (let i = 0; i < scripts.length; i++) {
    const script = scripts[i];
    const src = script.src;

    if (src !== "") {
      fetch(src)
        .then((response) => response.text())
        .then((text) => {
          extractURLsFromCode(text, src); // Include the source file name
        })
        .catch((error) => {
          console.error(`Error fetching external script (${src}):`, error);
        });
    } else {
      // Process inline scripts
      const inlineCode = script.textContent || "";
      extractURLsFromCode(inlineCode, "Inline Script"); // Mark as "Inline Script"
    }
  }

  // Process the entire page content for additional URLs
  const pageContent = document.documentElement.outerHTML;
  extractURLsFromCode(pageContent, "Page Content");

  // Send results back to the popup after processing
  setTimeout(() => {
    chrome.runtime.sendMessage(results);
  }, 3000); // Wait 3 seconds to ensure all async operations complete
})();