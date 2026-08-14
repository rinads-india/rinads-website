/** Runs before paint to avoid theme flash. */
export function ThemeScript() {
  const script = `(function(){try{var k='rinads-theme',t=localStorage.getItem(k);if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.classList.add(t);document.documentElement.style.colorScheme=t;}catch(e){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark';}})();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
