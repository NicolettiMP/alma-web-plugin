document.addEventListener("DOMContentLoaded", () => {
  // Obtém os dados de navegação e localização ao abrir o popup
  chrome.storage.local.get("tabNavigationData", (result) => {
    const tabList = document.getElementById("tab-list");
    const tabData = result.tabNavigationData || {};

    for (const [tabId, data] of Object.entries(tabData)) {
      const tabElement = document.createElement("div");
      tabElement.className = "tab";
      tabElement.innerHTML = `
        <strong>${data.title || "Tab"} (ID: ${tabId})</strong><br>
        <span class="stats">URL: ${data.url}</span><br>
        <span class="stats">Page Load Time: ${(data.loadTime / 1000).toFixed(2)} seconds</span><br>
        <span class="stats">Number of Errors: ${data.errorCount}</span><br>
        <span class="stats">Data Received: ${(data.dataReceived / 1024).toFixed(2)} KB</span><br>
        <span class="stats">Location: ${data.location ? `Lat: ${data.location.latitude}, Lng: ${data.location.longitude}` : "Unavailable"}</span><br>
      `;
      tabList.appendChild(tabElement);
    }
  });

  // Obter a localização do usuário e atualizar o armazenamento
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        chrome.runtime.sendMessage({ location });
      },
      (error) => {
        console.error("Erro ao obter localização:", error);
      }
    );
  }
});
