import { useMutation } from "@tanstack/react-query";

import { postScenarioPlan } from "../api/postScenarioPlan";

export const useCreateScenarioPlan = () => {
  return useMutation({
    mutationFn: postScenarioPlan
  });
};
