document.getElementById("extractButton").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // Execute content.js in the active tab
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"]
  });

  // Listen for messages from content.js
  chrome.runtime.onMessage.addListener((message) => {
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = ""; // Clear previous results

    if (message.length > 0) {
      message.forEach((item) => {
        const p = document.createElement("p");
        p.textContent = `${item.url} [Source: ${item.source}]`;
        resultsDiv.appendChild(p);
      });
    } else {
      resultsDiv.innerHTML = "<p>No endpoints found.</p>";
    }

    // Store raw results for export
    window.rawResults = message;
  });
});

// Filter URLs based on input
document.getElementById("filterInput").addEventListener("input", (event) => {
  const filterText = event.target.value.toLowerCase();
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "";

  if (window.rawResults) {
    window.rawResults.forEach((item) => {
      if (item.url.toLowerCase().includes(filterText)) {
        const p = document.createElement("p");
        p.textContent = `${item.url} [Source: ${item.source}]`;
        resultsDiv.appendChild(p);
      }
    });
  }
});

// Export as TXT
document.getElementById("exportTXT").addEventListener("click", () => {
  const exportOption = document.getElementById("exportOptions").value;
  const blob = new Blob([formatForExport(window.rawResults, "txt", exportOption)], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "endpoints.txt";
  a.click();
  URL.revokeObjectURL(url);
});

// Export as CSV
document.getElementById("exportCSV").addEventListener("click", () => {
  const exportOption = document.getElementById("exportOptions").value;
  const csvContent = "data:text/csv;charset=utf-8," + formatForExport(window.rawResults, "csv", exportOption);
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "endpoints.csv");
  document.body.appendChild(link);
  link.click();
});

// Export as JSON
document.getElementById("exportJSON").addEventListener("click", () => {
  const exportOption = document.getElementById("exportOptions").value;
  const blob = new Blob([JSON.stringify(formatForExport(window.rawResults, "json", exportOption), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "endpoints.json";
  a.click();
  URL.revokeObjectURL(url);
});

// Format results for export
function formatForExport(results, format = "txt", exportOption = "urls-only") {
  // Remove duplicates
  const uniqueResults = Array.from(new Set(results.map(item => item.url))).map(url => ({ url }));

  if (exportOption === "with-source") {
    // Include source information
    return results.map(item => ({
      url: item.url,
      source: item.source
    }));
  }

  // Extract only the URLs
  const urlsOnly = uniqueResults.map(item => item.url);

  if (format === "csv") {
    return urlsOnly.join("\n"); // CSV format: one URL per line
  } else if (format === "json") {
    return urlsOnly; // JSON format: array of URLs
  } else {
    return urlsOnly.join("\n"); // TXT format: one URL per line
  }
}