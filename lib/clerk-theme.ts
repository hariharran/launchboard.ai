export const clerkAppearance = {
  variables: {
    colorPrimary: "#0f172a",
    colorPrimaryForeground: "#f8fafc",
    colorBackground: "rgba(255,255,255,0.96)",
    colorForeground: "#0f172a",
    colorMuted: "#eff6ff",
    colorMutedForeground: "#475569",
    colorInput: "#ffffff",
    colorInputForeground: "#0f172a",
    colorBorder: "rgba(148,163,184,0.48)",
    colorRing: "#2563eb",
    colorSuccess: "#059669",
    colorDanger: "#dc2626",
    borderRadius: "1.25rem",
    fontFamily: "var(--font-sans)",
    fontFamilyButtons: "var(--font-sans)",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "shadow-none",
    card: "rounded-[28px] border border-slate-200 bg-white/96 shadow-none backdrop-blur-xl",
    formButtonPrimary:
      "bg-slate-950 hover:bg-slate-800 text-white shadow-none rounded-2xl",
    footerActionLink: "text-blue-600 hover:text-blue-700",
    socialButtonsBlockButton:
      "rounded-2xl border border-slate-300 bg-white text-slate-900 shadow-none hover:bg-slate-50",
    formFieldInput:
      "rounded-2xl border border-slate-300 bg-white text-slate-900 ring-1 ring-slate-200/80 shadow-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
    formFieldLabel: "text-slate-700",
    headerTitle: "text-slate-950",
    headerSubtitle: "text-slate-500",
    dividerLine: "bg-slate-200",
    dividerText: "text-slate-400",
    formResendCodeLink: "text-blue-600 hover:text-blue-700",
    identityPreviewText: "text-slate-700",
    otpCodeFieldInput:
      "rounded-2xl border border-slate-300 bg-white text-slate-950 ring-1 ring-slate-200/80 shadow-none",
    formFieldSuccessText: "text-emerald-700",
    alertText: "text-slate-700",
    footer: "bg-transparent shadow-none",
    footerAction: "bg-transparent",
    formFieldRow: "gap-4",
  },
} as const;

export const clerkComponentAppearance = {
  ...clerkAppearance,
  elements: {
    ...clerkAppearance.elements,
    cardBox: "shadow-none",
    card: "rounded-none border-0 bg-transparent shadow-none p-0",
    navbar: "hidden",
    pageScrollBox: "p-0",
    footer: "bg-transparent shadow-none",
    footerAction: "bg-transparent",
  },
} as const;
