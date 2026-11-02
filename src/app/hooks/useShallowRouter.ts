export const useShallowRouter = () => {
  const push = (url: string) => {
    window.history.pushState(null, "", url);
  };
  const replace = (url: string) => {
    window.history.replaceState(null, "", url);
  };
  return {
    push,
    replace
  };
};
