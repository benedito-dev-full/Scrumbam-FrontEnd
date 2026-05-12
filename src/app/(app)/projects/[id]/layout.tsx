/**
 * Layout do segmento /projects/[id].
 *
 * O `modal` vem do parallel slot @modal. Tipamos como opcional porque o Next 16
 * Turbopack ocasionalmente nao popula o slot no LayoutSlotMap auto-gerado
 * durante build fresca (typecheck do framework reclama de "modal missing in
 * LayoutProps"). Opcional satisfaz o constraint em ambos os cenarios.
 */
export default function ProjectIdLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal?: React.ReactNode;
}) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}
