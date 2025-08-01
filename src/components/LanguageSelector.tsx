"use client";

import { useTranslation } from "react-i18next";

function LanguageButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`bg-white text-black px-4 py-2 cursor-pointer font-mono uppercase font-medium tracking-tight text-sm first:rounded-l-full last:rounded-r-full transition-opacity duration-150 ${
        active ? "opacity-100" : "opacity-50"
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export default function LanguageSelector() {
  const { i18n } = useTranslation();

  const changeLanguage = (language: string) => {
    i18n.changeLanguage(language);
  };

  return (
    <div className="flex gap-0.5">
      <LanguageButton
        active={i18n.language === "en"}
        label="🇬🇧 EN"
        onClick={() => changeLanguage("en")}
      />
      <LanguageButton
        active={i18n.language === "es"}
        label="🇪🇸 ES"
        onClick={() => changeLanguage("es")}
      />
    </div>
  );
}
