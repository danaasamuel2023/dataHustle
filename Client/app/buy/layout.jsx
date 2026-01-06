// app/buy/layout.jsx
// Hides the root nav and footer for the quick buy standalone page

export default function BuyLayout({ children }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          /* Hide only the root navbar component */
          body > div > nav,
          body > div > main > nav,
          [class*="Navbar"],
          [class*="navbar"] {
            display: none !important;
          }
          
          /* Hide footer */
          body > div > footer,
          [class*="Footer"],
          [class*="footer"] {
            display: none !important;
          }
          
          /* Hide WhatsApp floating button */
          [class*="whatsapp"],
          [class*="WhatsApp"],
          a[href*="wa.me"]:not(.buy-page a) {
            display: none !important;
          }
          
          /* Reset main spacing */
          main {
            padding-top: 0 !important;
            margin-top: 0 !important;
          }
        `
      }} />
      {children}
    </>
  );
}