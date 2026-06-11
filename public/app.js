const form = document.getElementById("upload-form");
const statusElement = document.getElementById("status");
const resultsElement = document.getElementById("results");
const summaryGrid = document.getElementById("summary-grid");
const matchedList = document.getElementById("matched-list");
const columnsDetected = document.getElementById("columns-detected");
const thresholdInput = form.elements.fuzzyThreshold;
const thresholdValue = document.getElementById("threshold-value");

let latestReport = null;

thresholdInput.addEventListener("input", () => {
  thresholdValue.textContent = Number(thresholdInput.value).toFixed(2);
});

function setStatus(message, type = "success") {
  statusElement.textContent = message;
  statusElement.className = `status status--${type}`;
}

function renderSummary(summary) {
  const labels = {
    totalControlledProducts: "Produtos controlados",
    totalMovementRows: "Linhas na planilha",
    matchedProducts: "Produtos com movimentação",
    totalMatchedMovements: "Movimentações encontradas"
  };

  summaryGrid.innerHTML = Object.entries(summary)
    .map(
      ([key, value]) => `
        <article class="summary-card">
          <span>${labels[key] || key}</span>
          <strong>${value}</strong>
        </article>
      `
    )
    .join("");
}

function renderMatches(matchedProducts) {
  const template = document.getElementById("match-template");
  matchedList.innerHTML = "";

  if (!matchedProducts.length) {
    matchedList.innerHTML = "<p>Nenhuma movimentação encontrada para os produtos controlados.</p>";
    return;
  }

  matchedProducts.forEach((product) => {
    const fragment = template.content.cloneNode(true);
    fragment.querySelector(".match-product").textContent = product.productName;
    fragment.querySelector(".match-count").textContent = `${product.matchCount} movimentações`;

    const rowsElement = fragment.querySelector(".match-rows");
    rowsElement.innerHTML = product.matches
      .map(
        (match) => `
          <tr>
            <td>${match.movementProduct || "-"}</td>
            <td>${match.movement.date || "-"}</td>
            <td>${match.movement.movementType || "-"}</td>
            <td>${match.movement.reason || "-"}</td>
            <td>${match.movement.document || "-"}</td>
            <td>${match.movement.quantity || "-"}</td>
            <td>${match.movement.unit || "-"}</td>
            <td>${match.movement.sector || "-"}</td>
            <td>${match.movement.responsible || "-"}</td>
            <td>${match.movement.notes || "-"}</td>
            <td>${match.matchType} (${match.score})</td>
          </tr>
        `
      )
      .join("");

    matchedList.appendChild(fragment);
  });
}

function renderColumns(detectedColumns) {
  const parts = Object.entries(detectedColumns)
    .filter(([, value]) => Boolean(value))
    .map(([key, value]) => `${key}: ${value}`);

  columnsDetected.textContent = `Colunas identificadas automaticamente: ${parts.join(" | ")}`;
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const payload = new FormData();
  const controlledFile = form.elements.controlledList.files[0];
  const movementFile = form.elements.movementSheet.files[0];

  payload.append("controlledList", controlledFile);
  payload.append("movementSheet", movementFile);
  payload.append(
    "options",
    JSON.stringify({
      comparisonMode: form.elements.comparisonMode.value,
      fuzzyThreshold: Number(form.elements.fuzzyThreshold.value)
    })
  );

  setStatus("Processando arquivos...", "success");
  resultsElement.classList.add("results--hidden");

  try {
    const response = await fetch("/api/process", {
      method: "POST",
      body: payload
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Falha ao processar arquivos.");
    }

    latestReport = data;
    renderSummary(data.summary);
    renderMatches(data.matchedProducts);
    renderColumns(data.detectedColumns);
    resultsElement.classList.remove("results--hidden");
    setStatus("Análise concluída com sucesso.", "success");
  } catch (error) {
    setStatus(error.message, "error");
  }
});

document.querySelectorAll("[data-export]").forEach((button) => {
  button.addEventListener("click", async () => {
    if (!latestReport) {
      setStatus("Processe os arquivos antes de exportar.", "error");
      return;
    }

    const format = button.dataset.export;
    setStatus(`Gerando exportação em ${format.toUpperCase()}...`, "success");

    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          format,
          report: latestReport
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Falha ao exportar relatório.");
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") || "";
      const fileNameMatch = disposition.match(/filename="(.+)"/);
      const fileName = fileNameMatch ? fileNameMatch[1] : `relatorio.${format}`;

      downloadBlob(blob, fileName);
      setStatus(`Exportação ${format.toUpperCase()} concluída.`, "success");
    } catch (error) {
      setStatus(error.message, "error");
    }
  });
});
