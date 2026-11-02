export const openVideoFilePicker = (onFiles: (files: File[]) => void): void => {
  const input = document.createElement("input");
  input.type = "file";
  input.multiple = true;
  input.accept = "video/*";
  input.onchange = () => {
    if (input.files && input.files.length > 0) {
      onFiles(Array.from(input.files));
    }
  };
  input.click();
};
