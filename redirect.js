// redirect.js
// Intercept every .pdf URL and load it in our viewer
const pdfUrl = encodeURIComponent(location.href);
location.replace(chrome.runtime.getURL(`viewer.html?file=${pdfUrl}`));
