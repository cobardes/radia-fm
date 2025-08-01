"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

export default function AppHeader() {
  const { t } = useTranslation();

  return (
    <div className="fixed left-0 top-0 p-3.5 px-4.5 z-40">
      <Link href="/" className="font-mono font-semibold tracking-tight">
        <span>
          rad(ia){" "}
          <span className="text-xs text-black/60 font-normal">
            {t("experimental")}
          </span>
        </span>
      </Link>
    </div>
  );
}
