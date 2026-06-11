// Primitivos del design language (docs/DESIGN.md). Las pantallas usan esto
// en lugar de repetir clases — un solo lugar para corregir estilos.
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  SelectHTMLAttributes,
} from "react";

export function Input({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`bg-base px-3 py-2.5 text-base text-ink placeholder:text-ink-faint outline-none focus:bg-surface-alt ${className}`}
    />
  );
}

export function Select({
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`appearance-none bg-base px-3 py-2.5 text-base text-ink outline-none focus:bg-surface-alt ${className}`}
    />
  );
}

export function PrimaryButton({
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`bg-accent px-4 py-2.5 font-medium text-white active:opacity-80 ${className}`}
    />
  );
}

/** Etiqueta de sección: mayúsculas pequeñas, tono apagado. */
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-medium uppercase tracking-widest text-ink-muted">
      {children}
    </p>
  );
}
