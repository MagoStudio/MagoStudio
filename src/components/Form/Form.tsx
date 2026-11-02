import { zodResolver } from "@hookform/resolvers/zod";
import type { ComponentProps, ReactNode } from "react";
import { forwardRef } from "react";
import {
  type DefaultValues,
  type FieldErrors,
  FormProvider,
  type SubmitHandler,
  useForm,
  type UseFormReturn,
  FieldValues
} from "react-hook-form";
import { ZodType } from "zod";

type FormPropsWithoutOnSubmit = Omit<ComponentProps<"form">, "onSubmit">;
interface FormProps<T extends FieldValues> extends FormPropsWithoutOnSubmit {
  children?: ReactNode;
  formSchema: ZodType<T, T, any>;
  defaultValues?: DefaultValues<T>;
  values?: T;
  errors?: FieldErrors<T>;
  onSubmit: SubmitHandler<T>;
  onSuccess?: (payload: T, form: UseFormReturn<T>) => void;
}

export const Form = forwardRef(function Form<T extends FieldValues>(
  {
    children,
    formSchema,
    defaultValues,
    values,
    onSubmit,
    onSuccess,
    errors,
    ...rest
  }: FormProps<T>,
  ref: React.ForwardedRef<HTMLFormElement>
) {
  const form = useForm<T>({
    resolver: zodResolver(formSchema),
    defaultValues,
    values,
    errors
  });

  return (
    <FormProvider {...form}>
      <form ref={ref} onSubmit={form.handleSubmit(onSubmit)} {...rest}>
        {children}
      </form>
    </FormProvider>
  );
}) as <T extends FieldValues>(
  props: FormProps<T> & { ref?: React.ForwardedRef<HTMLFormElement> }
) => React.ReactElement;
