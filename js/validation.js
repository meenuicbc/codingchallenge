export function normalizeText(value) {
  return value.trim();
}

export function validateSubmission(data) {
  const errors = [];
  const studentName = normalizeText(data.studentName || "");
  const gameName = normalizeText(data.gameName || "");
  const description = normalizeText(data.description || "");
  const gameUrl = normalizeText(data.gameUrl || "");

  if (!studentName) {
    errors.push("Please enter a student name.");
  } else if (studentName.length < 2 || studentName.length > 40) {
    errors.push("Student name must be between 2 and 40 characters.");
  }

  if (!gameName) {
    errors.push("Please enter a game name.");
  } else if (gameName.length < 2 || gameName.length > 60) {
    errors.push("Game name must be between 2 and 60 characters.");
  }

  if (!description) {
    errors.push("Please enter a short description.");
  } else if (description.length < 10 || description.length > 300) {
    errors.push("Description must be between 10 and 300 characters.");
  }

  if (!gameUrl) {
    errors.push("Please enter a public game link.");
  } else {
    let url;
    try {
      url = new URL(gameUrl);
    } catch {
      errors.push("Please enter a valid HTTPS URL.");
    }

    if (url) {
      if (url.protocol !== "https:") {
        errors.push("Please enter an HTTPS URL.");
      }
      if (!isAllowedGitHubUrl(url)) {
        errors.push("Please use a public GitHub or GitHub Pages URL.");
      }
      if (isGitHubRepositoryUrl(url)) {
        errors.push("Please submit the public GitHub Pages game link rather than the repository page.");
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    values: {
      studentName,
      gameName,
      description,
      gameUrl,
      normalizedGameUrl: normalizeGameUrl(gameUrl)
    }
  };
}

export function normalizeGameUrl(value) {
  return value.trim().toLowerCase();
}

function isAllowedGitHubUrl(url) {
  const hostname = url.hostname.toLowerCase();
  return hostname === "github.com" || hostname.endsWith(".github.io") || hostname === "www.github.com" || hostname.endsWith(".github.io");
}

function isGitHubRepositoryUrl(url) {
  const hostname = url.hostname.toLowerCase();
  return (hostname === "github.com" || hostname === "www.github.com") && !url.pathname.includes("/tree/") && !url.pathname.includes("/blob/") && !url.pathname.includes("/releases/");
}
