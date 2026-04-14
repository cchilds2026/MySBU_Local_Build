export async function loadIncludeElement(element) {
  const file = element.getAttribute("data-include");
  console.log("include target:", file);

  if (!file) return;

  try {
    const response = await fetch(file, { cache: "no-cache" });
    console.log("fetch response for", file, response.status, response.ok);

    if (!response.ok) {
      throw new Error(`${file} -> ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    element.innerHTML = html;
  } catch (error) {
    console.error("Include load failed:", error);
    element.innerHTML = `<div style="padding:1rem;color:red;">Could not load ${file}</div>`;
  }
}

export async function initIncludes() {
  const includeElements = Array.from(document.querySelectorAll("[data-include]"));
  console.log("include elements found:", includeElements.length);
  await Promise.all(includeElements.map(loadIncludeElement));
}