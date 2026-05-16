/**
 * Prints HTML content via a hidden iframe.
 * Avoids popup blockers common on kiosk/tablet browsers.
 */
export function silentPrint(htmlContent) {
  const iframe = document.createElement('iframe');
  iframe.style.cssText =
    'position:fixed;width:0;height:0;border:0;left:-9999px;top:-9999px;opacity:0';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open();
  doc.write(htmlContent);
  doc.close();

  iframe.onload = () => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1500);
    }
  };
}
