// components/Footer.tsx
type FooterProps = {
  text?: string;
};

export default function Footer({ text }: FooterProps) {
  return (
    <footer style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: '#666' }}>
      <p>{text || '© 2025 Crystal The Developer Inc. All rights reserved.'}</p>
    </footer>
  );
}
