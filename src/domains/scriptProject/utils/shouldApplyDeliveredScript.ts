export const shouldApplyDeliveredScript = ({
  deliveredScript,
  embeddedScriptInPrecedingUserMessage,
  scriptBoxText
}: {
  deliveredScript: string;
  embeddedScriptInPrecedingUserMessage: string | undefined;
  scriptBoxText: string;
}): boolean => {
  const trimmedScriptBoxText = scriptBoxText.trim();

  const boxMatchesWhatThatMessageCarried =
    embeddedScriptInPrecedingUserMessage !== undefined
      ? trimmedScriptBoxText === embeddedScriptInPrecedingUserMessage.trim()
      : trimmedScriptBoxText.length === 0;

  return (
    boxMatchesWhatThatMessageCarried &&
    trimmedScriptBoxText !== deliveredScript.trim()
  );
};
