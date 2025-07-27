import { MaterialSymbol } from "material-symbols";

export function ControlButton({
  icon,
  iconPosition = "left",
  label,
  onClick,
}: {
  icon: MaterialSymbol;
  iconPosition?: "left" | "right";
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`bg-white text-black py-2 px-4 cursor-pointer rounded-full uppercase font-mono font-semibold tracking-wide text-sm flex items-center gap-2 active:bg-black active:text-white shadow-neutral-400 ${
        iconPosition === "left" ? "pl-2.5" : "pr-2.5"
      }`}
      onClick={onClick}
    >
      {iconPosition === "left" && (
        <span className="material-symbols-outlined">{icon}</span>
      )}
      <span>{label}</span>
      {iconPosition === "right" && (
        <span className="material-symbols-outlined">{icon}</span>
      )}
    </button>
  );
}
