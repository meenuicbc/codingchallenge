import { listenToGamesAdmin } from "./firebase.js";
import { escapeText, formatDate } from "./ui.js";

const statsContainer = document.getElementById("admin-stats");
const topGamesContainer = document.getElementById("admin-top-games");
const listContainer = document.getElementById("admin-list");
const loadingElement = document.getElementById("admin-loading");
const searchInput = document.getElementById("admin-search");
const sortSelect = document.getElementById("admin-sort");

let allGames = [];

listenToGamesAdmin((games, error) => {
  loadingElement.hidden = true;
  if (error) {
    listContainer.innerHTML = '<div class="empty-state">Unable to load the admin dashboard right now.</div>';
    return;
  }
  allGames = games;
  renderAdmin();
});

searchInput.addEventListener("input", renderAdmin);
sortSelect.addEventListener("change", renderAdmin);

function renderAdmin() {
  const query = searchInput.value.trim().toLowerCase();
  const sortMode = sortSelect.value;
  let filtered = allGames.filter((game) => {
    const haystack = `${game.studentName} ${game.gameName}`.toLowerCase();
    return haystack.includes(query);
  });

  filtered.sort(compareGames);
  if (sortMode === "newest") {
    filtered.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }

  const totalVotes = filtered.reduce((sum, game) => sum + (game.voteCount ?? 0), 0);
  statsContainer.innerHTML = `
    <div class="card stat-card"><span>Total Games</span><strong>${filtered.length}</strong></div>
    <div class="card stat-card"><span>Total Upvotes</span><strong>${totalVotes}</strong></div>
    <div class="card stat-card"><span>Current Top 3</span><strong>${filtered.slice(0, 3).map((game) => escapeText(game.gameName)).join(" • ") || "Waiting for submissions"}</strong></div>
  `;

  topGamesContainer.innerHTML = "";
  const topThree = [...filtered].slice(0, 3);
  if (topThree.length === 0) {
    topGamesContainer.innerHTML = '<div class="empty-state">No submissions yet.</div>';
  } else {
    topThree.forEach((game, index) => {
      const card = document.createElement("article");
      card.className = `top-card top-card--${index === 0 ? "gold" : index === 1 ? "silver" : "bronze"}`;
      card.innerHTML = `
        <p class="top-card__place">${index + 1}${index === 0 ? "st" : index === 1 ? "nd" : "rd"} Place</p>
        <h3>${escapeText(game.gameName)}</h3>
        <p><strong>Student:</strong> ${escapeText(game.studentName)}</p>
        <p><strong>Votes:</strong> ${game.voteCount ?? 0}</p>
      `;
      topGamesContainer.appendChild(card);
    });
  }

  if (filtered.length === 0) {
    listContainer.innerHTML = '<div class="empty-state">No submissions match the current search.</div>';
    return;
  }

  const table = document.createElement("table");
  table.innerHTML = `
    <thead>
      <tr>
        <th>Student</th>
        <th>Game</th>
        <th>Link</th>
        <th>Votes</th>
        <th>Date</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const body = table.querySelector("tbody");
  filtered.forEach((game) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${escapeText(game.studentName)}</td>
      <td>${escapeText(game.gameName)}</td>
      <td><a href="${escapeText(game.gameUrl)}" target="_blank" rel="noopener noreferrer">Open</a></td>
      <td>${game.voteCount ?? 0}</td>
      <td>${formatDate(game.createdAt)}</td>
    `;
    body.appendChild(row);
  });
  listContainer.innerHTML = "";
  listContainer.appendChild(table);
}

function compareGames(a, b) {
  const voteDiff = (b.voteCount ?? 0) - (a.voteCount ?? 0);
  if (voteDiff !== 0) return voteDiff;
  return (a.createdAt?.seconds ?? 0) - (b.createdAt?.seconds ?? 0);
}
