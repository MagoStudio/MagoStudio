export const LocalSetupWizardCard = ({
  children
}: {
  children: React.ReactNode;
}) => (
  <div className="flex flex-1 flex-col gap-3 rounded-2xl border border-element-primary bg-surface-on-image p-5">
    {children}
  </div>
);
