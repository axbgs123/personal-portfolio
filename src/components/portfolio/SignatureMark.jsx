/* eslint-disable react/jsx-props-no-spreading */
// Z / C: the initials of 祉辰, drawn as two open, interlocking cuts.
// The same geometry carries the identity from the opening to the smallest UI.
export default function SignatureMark({ className = '', ...props }) {
  return (
    <svg viewBox="0 0 168 112" fill="none" className={className} aria-hidden="true" focusable="false" {...props}>
      <path data-signature-stroke pathLength="1" d="M10 18H83L18 94H91" stroke="currentColor" strokeWidth="12" strokeLinejoin="miter" />
      <path data-signature-stroke pathLength="1" d="M158 18H124L93 56V94H158" stroke="currentColor" strokeWidth="12" strokeLinejoin="miter" />
    </svg>
  );
}
