export async function loadIncludeElement(element) {
  const relativeUrl = element.getAttribute("data-include");
  if (!relativeUrl) return;

  try {
    const resolvedUrl = new URL(relativeUrl, window.location.href).toString();
    const response = await fetch(resolvedUrl, { cache: "no-cache" });

    if (!response.ok) {
      throw new Error(`Failed include: ${resolvedUrl} (${response.status})`);
    }

    element.innerHTML = await response.text();
  } catch (error) {
    console.error("Include load failed:", error);
    element.innerHTML = `<div style="padding:1rem;color:red;">Could not load ${relativeUrl}</div>`;
  }
}

export async function initIncludes() {
  const includeElements = Array.from(document.querySelectorAll("[data-include]"));
  await Promise.all(includeElements.map(loadIncludeElement));
}