// Armazena dados detalhados da navegação e rede
let tabNavigationData = {};

// Monitora quando uma navegação é iniciada e inicializa os dados da aba
chrome.webNavigation.onCommitted.addListener((details) => {
  if (details.frameId === 0) { // Apenas o quadro principal
    tabNavigationData[details.tabId] = {
      startTime: details.timeStamp,
      errorCount: 0, // Inicializa o contador de erros
      dataReceived: 0, // Dados recebidos em bytes
      location: null, // Localização do usuário
    };
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.location) {
    // Atualiza a localização para todas as abas ativas no armazenamento
    for (let tabId in tabNavigationData) {
      tabNavigationData[tabId].location = message.location;
    }
    chrome.storage.local.set({ tabNavigationData });
  }
});

// Monitora quando a navegação é concluída e calcula o tempo de carregamento
chrome.webNavigation.onCompleted.addListener(async (details) => {
  if (details.frameId === 0 && tabNavigationData[details.tabId]) {
    const endTime = details.timeStamp;
    const loadTime = endTime - tabNavigationData[details.tabId].startTime;

    const tab = await chrome.tabs.get(details.tabId);
    if(tab.url){
      tabNavigationData[details.tabId] = {
        ...tabNavigationData[details.tabId],
        loadTime,
        title: tab.title,
        url: tab.url,
        pid: details.processId
      };
    }

    chrome.storage.local.set({ tabNavigationData });
  }

  const socket = new WebSocket("ws://localhost:3000"); 

  socket.onopen = () => {
    console.log("Conectado ao servidor WebSocket!");

    // Coletar informações do navegador
    const dados = {
        navegador: navigator.userAgent,
        abasAbertas: []
    };

    // Coletar informações sobre as abas abertas
    chrome.tabs.query({}, (tabs) => {
        dados.abasAbertas = tabs.map(tab => ({
            id: tab.id,
            url: tab.url,
            titulo: tab.title
        }));
        dados.tabNavigationData = tabNavigationData;

        // Enviar os dados para o servidor WebSocket
        socket.send(JSON.stringify(dados));
        console.log("Dados enviados:", dados);
    });
  };

  socket.onerror = (error) => {
    console.error("Erro na conexão WebSocket:", error);
  };

  socket.onclose = () => {
    console.log("Conexão WebSocket fechada!");
  };
});

// Monitora erros de navegação e incrementa o contador de erros
chrome.webRequest.onErrorOccurred.addListener(
  (details) => {
    const { tabId } = details;
    if (tabId !== -1 && tabNavigationData[tabId]) {
      tabNavigationData[tabId].errorCount += 1;
      chrome.storage.local.set({ tabNavigationData }); // Salva os dados atualizados
    }
  },
  { urls: ["<all_urls>"] } // Filtro de URLs
);


// Captura dados de rede usando webRequest
chrome.webRequest.onCompleted.addListener(
  (details) => {
    const { tabId, fromCache, responseHeaders } = details;
    if (tabId !== -1 && tabNavigationData[tabId]) {
      let dataSize = 0;

      // Verifica se responseHeaders está presente e encontra o tamanho do conteúdo
      if (responseHeaders) {
        const contentLengthHeader = responseHeaders.find(
          (header) => header.name.toLowerCase() === "content-length"
        );
        if (contentLengthHeader) {
          dataSize = parseInt(contentLengthHeader.value, 10);
        }
      }

      if (!fromCache) {
        tabNavigationData[tabId].dataReceived += dataSize;
      }

      chrome.storage.local.set({ tabNavigationData });
    }
  },
  { urls: ["<all_urls>"] },  // Filtro de URLs
  ["responseHeaders"]        // Informa que queremos os cabeçalhos de resposta
);


// Remove informações ao fechar uma aba
chrome.tabs.onRemoved.addListener((tabId) => {
  delete tabNavigationData[tabId];
  chrome.storage.local.set({ tabNavigationData });
});

