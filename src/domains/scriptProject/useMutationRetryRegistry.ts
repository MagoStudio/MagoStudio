import { MutateOptions, UseMutationResult } from "@tanstack/react-query";
import { useState } from "react";

type MutationCalls<Data, MutationError, Request, Context> = {
  mutate: (
    request: Request,
    callOptions?: MutateOptions<Data, MutationError, Request, Context>
  ) => void;
  mutateAsync: (
    request: Request,
    callOptions?: MutateOptions<Data, MutationError, Request, Context>
  ) => Promise<Data>;
};

export const useMutationRetryRegistry = () => {
  const [retryByRequest] = useState(() => new WeakMap<object, () => void>());
  const [registeredCallsByMutate] = useState(
    () => new WeakMap<object, unknown>()
  );

  const buildRegisteredCalls = <
    Data,
    MutationError,
    Request extends object,
    Context
  >(
    mutation: UseMutationResult<Data, MutationError, Request, Context>
  ): MutationCalls<Data, MutationError, Request, Context> => {
    const { mutate: originalMutate, mutateAsync: originalMutateAsync } =
      mutation;
    return {
      mutate: (request, callOptions) => {
        const retry = () => originalMutate(request, callOptions);
        retryByRequest.set(request, retry);
        retry();
      },
      mutateAsync: (request, callOptions) => {
        retryByRequest.set(request, () => originalMutate(request, callOptions));
        return originalMutateAsync(request, callOptions);
      }
    };
  };

  return {
    findRetryForRequest: (request: object) => retryByRequest.get(request),
    withRetryRegistered: <Data, MutationError, Request extends object, Context>(
      mutation: UseMutationResult<Data, MutationError, Request, Context>
    ) => {
      const registeredCalls =
        (registeredCallsByMutate.get(mutation.mutate) as
          | MutationCalls<Data, MutationError, Request, Context>
          | undefined) ?? buildRegisteredCalls(mutation);
      registeredCallsByMutate.set(mutation.mutate, registeredCalls);

      return { ...mutation, ...registeredCalls };
    }
  };
};
