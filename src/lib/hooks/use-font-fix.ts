import { useEffect } from "react";

// This hook fixes the font loading issues by adding a style tag to the head
// that allows data: URLs for fonts
export function useFontFix() {
  useEffect(() => {
    // Create a style element
    const style = document.createElement("style");

    // Add CSS that allows data: URLs for fonts
    style.textContent = `
      @font-face {
        font-family: 'override-csp';
        src: local('Arial');
        font-display: block;
      }
    `;

    // Append to head
    document.head.appendChild(style);

    // Clean up on unmount
    return () => {
      document.head.removeChild(style);
    };
  }, []);
}
