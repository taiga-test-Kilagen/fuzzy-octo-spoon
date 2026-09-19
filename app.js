const rows = document.getElementById("rows");
const podium = document.getElementById("podium");
const updated = document.getElementById("updated");
const summary = document.getElementById("summary");
const empty = document.getElementById("empty");
const error = document.getElementById("error");

const number = (value, digits) => Number(value).toLocaleString("ru-RU", {
  minimumFractionDigits: digits,
  maximumFractionDigits: digits,
});

function pokemonNode(entry, className = "") {
  const wrapper = document.createElement("div");
  wrapper.className = `pokemon ${className}`.trim();
  const image = document.createElement("img");
  image.src = /^assets\/pokemon\/\d+\.png$/.test(entry.pokemon.sprite) ? entry.pokemon.sprite : "";
  image.alt = "";
  image.width = 76;
  image.height = 76;
  const label = document.createElement("div");
  const name = document.createElement("span");
  name.className = "pokemon-name";
  name.textContent = entry.pokemon.name;
  const id = document.createElement("span");
  id.className = "pokemon-number";
  id.textContent = `#${String(entry.pokemon.pokemon_id).padStart(4, "0")}`;
  label.append(name, id);
  wrapper.append(image, label);
  return wrapper;
}

function renderPodium(entries) {
  podium.replaceChildren();
  for (const entry of entries.slice(0, 3)) {
    const card = document.createElement("article");
    card.className = "podium-card";
    const rank = document.createElement("span");
    rank.className = "podium-rank";
    rank.textContent = entry.rank;
    const score = document.createElement("div");
    score.className = "podium-score";
    score.textContent = number(entry.uncapped_score, 2);
    const metrics = document.createElement("div");
    metrics.className = "podium-metrics";
    metrics.textContent = `официально ${number(entry.score, 2)} / 100 · MAE ${number(entry.mae, 4)} · ${number(entry.predict_seconds, 3)} с`;
    card.append(rank, pokemonNode(entry), score, metrics);
    podium.append(card);
  }
  podium.hidden = entries.length === 0;
}

function metricCell(value, digits, suffix = "") {
  const cell = document.createElement("td");
  cell.className = "numeric";
  cell.textContent = `${number(value, digits)}${suffix}`;
  return cell;
}

function renderRows(entries) {
  rows.replaceChildren();
  for (const entry of entries) {
    const row = document.createElement("tr");
    const rank = document.createElement("td");
    rank.className = "rank";
    rank.textContent = entry.rank;
    const pokemon = document.createElement("td");
    pokemon.append(pokemonNode(entry, "table-pokemon"));
    const score = metricCell(entry.uncapped_score, 2);
    score.classList.add("score");
    const parts = document.createElement("td");
    const breakdown = document.createElement("div");
    breakdown.className = "parts";
    for (const [label, value] of [
      ["MAE", entry.mae_points],
      ["размер", entry.model_size_points],
      ["время", entry.predict_time_points],
    ]) {
      const item = document.createElement("span");
      item.append(`${label} `);
      const strong = document.createElement("strong");
      strong.textContent = number(value, 2);
      item.append(strong);
      breakdown.append(item);
    }
    const official = document.createElement("span");
    official.className = "official";
    official.textContent = `официально ${number(entry.score, 2)} / 100`;
    breakdown.append(official);
    parts.append(breakdown);
    row.append(
      rank,
      pokemon,
      score,
      metricCell(entry.mae, 4),
      metricCell(entry.model_size_mb, 3, " МБ"),
      metricCell(entry.predict_seconds, 3, " с"),
      parts,
    );
    rows.append(row);
  }
}

async function load() {
  try {
    const response = await fetch(`data/leaderboard.json?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const snapshot = await response.json();
    if (!snapshot || !Array.isArray(snapshot.entries)) throw new Error("Invalid leaderboard data");
    renderPodium(snapshot.entries);
    renderRows(snapshot.entries);
    summary.textContent = `Рейтинг без потолка · лучший результат каждого студента · участников: ${snapshot.entries.length}`;
    updated.textContent = `Обновлено ${new Date(snapshot.generated_at).toLocaleString("ru-RU")}`;
    empty.hidden = snapshot.entries.length !== 0;
    error.hidden = true;
  } catch (cause) {
    console.error(cause);
    error.hidden = false;
    updated.textContent = "Данные временно недоступны";
  }
}

load();
setInterval(load, 60_000);
