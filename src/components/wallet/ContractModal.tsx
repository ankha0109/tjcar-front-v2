"use client";

import { Modal } from "antd";
import { useTranslations } from "next-intl";
import BrandButton from "@/components/ui/BrandButton";
import { CONTRACT_EMBED_URL, CONTRACT_URL } from "@/lib/wallet";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Shown as the primary action; omit for a read-only view of the contract. */
  onAgree?: () => void;
};

/**
 * The auction service agreement, embedded from the published Google Doc (same
 * document v1 showed). The doc is the legal copy and is edited outside this
 * repo, so it stays an iframe rather than being mirrored into `messages/`.
 */
export default function ContractModal({ open, onClose, onAgree }: Props) {
  const t = useTranslations("dashboard.wallet");

  return (
    <Modal
      title={t("contractTitle")}
      open={open}
      onCancel={onClose}
      footer={null}
      width="min(820px, 94vw)"
      style={{ top: 24 }}
      destroyOnHidden
    >
      <div className="mb-4 h-[min(60vh,520px)] w-full overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
        <iframe
          src={CONTRACT_EMBED_URL}
          title={t("contractTitle")}
          className="h-full w-full"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Escape hatch: the embed is blocked on some corporate networks and
            unreadable on small phones. */}
        <a
          href={CONTRACT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[13px] text-neutral-500 underline underline-offset-2 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          {t("contractOpenExternal")}
        </a>

        {onAgree && (
          <BrandButton
            onClick={() => {
              onAgree();
              onClose();
            }}
          >
            {t("contractAgree")}
          </BrandButton>
        )}
      </div>
    </Modal>
  );
}
