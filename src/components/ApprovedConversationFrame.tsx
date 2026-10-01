import type { ReactNode } from "react";

type ApprovedConversationFrameProps = {
  children: ReactNode;
};

function useLegacyConversationPresentation() {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("conversationPresentation") === "legacy";
}

/** Owns composition only; game state and progression remain with the existing components. */
export function ApprovedConversationFrame({
  children,
}: ApprovedConversationFrameProps) {
  if (useLegacyConversationPresentation()) {
    return <>{children}</>;
  }

  return (
    <section className="approved-conversation-host" data-presentation-owner="approved-conversation">
      {children}
    </section>
  );
}
