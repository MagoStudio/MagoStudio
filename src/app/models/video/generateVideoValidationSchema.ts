import { SourceImage } from "@domains/renders/types";
import { Setting } from "@models/shared/types";
import { VideoModelDefinition } from "@models/video/types";
import { flattenSettingsGroups } from "@models/video/utils/flattenSettingsGroups";
import { z } from "zod";

interface CustomValidationInfo {
  key: string;
  validate: (
    value: unknown,
    allValues: Record<string, unknown>,
    sources: SourceImage[]
  ) => string | undefined | null;
}

interface RequiredFieldInfo {
  key: string;
  errorMessage: string | undefined;
}

function settingToZod(setting: Setting): [string, z.ZodTypeAny] {
  let schema: z.ZodTypeAny;
  const errorMsg = setting.errorMessage;

  switch (setting.type) {
    case "string": {
      let strSchema = z.string();
      if (setting.nullable) {
        schema = strSchema.nullish();
      } else {
        schema = strSchema.trim().min(1, errorMsg);
      }
      if (setting.defaultValue !== undefined) {
        schema = schema.default(setting.defaultValue);
      }
      break;
    }
    case "number": {
      let numSchema = z.number();
      if (typeof (setting as any).min === "number") {
        numSchema = numSchema.min((setting as any).min, errorMsg);
      }
      if (typeof (setting as any).max === "number") {
        numSchema = numSchema.max((setting as any).max, errorMsg);
      }
      const valueIfChecked = setting.specificConfig?.valueIfChecked;
      if (typeof valueIfChecked === "number") {
        schema = z.union([z.literal(valueIfChecked), numSchema]);
      } else if (setting.nullable) {
        schema = numSchema.nullish();
      } else {
        schema = numSchema;
      }
      if (setting.defaultValue !== undefined) {
        schema = schema.default(setting.defaultValue);
      }
      break;
    }
    case "boolean":
      schema = z.boolean();
      if (setting.defaultValue !== undefined) {
        schema = schema.default(setting.defaultValue);
      }
      break;
    case "enum": {
      const options = (setting as any).options?.map(
        (opt: any) => opt.value
      ) as [string, ...string[]];
      if (options && options.length > 0) {
        schema = z.enum(options);
      } else {
        schema = z.any();
      }
      if (setting.defaultValue !== undefined) {
        schema = schema.default(setting.defaultValue);
      }
      break;
    }
    case "array": {
      let arrSchema = z.array(z.string());
      if (setting.nullable) {
        schema = arrSchema.nullish();
      } else {
        schema = arrSchema;
      }
      if (setting.defaultValue !== undefined) {
        schema = schema.default(setting.defaultValue);
      }
      break;
    }
    case "tool":
      schema = z.any();
      break;
    default:
      schema = z.any();
  }

  return [setting.key, schema];
}

export const generateVideoValidationSchema = (
  model: VideoModelDefinition,
  sources: SourceImage[] = []
) => {
  const shape: Record<string, z.ZodTypeAny> = {};
  const customValidations: CustomValidationInfo[] = [];
  const requiredFields: RequiredFieldInfo[] = [];

  for (const section of flattenSettingsGroups(model)) {
    for (const setting of section.settings) {
      const [key, schema] = settingToZod(setting);
      shape[key] = schema;
      if (setting.secondKey) {
        shape[setting.secondKey] = schema;
      }

      if (setting.customValidation) {
        customValidations.push({
          key: setting.key,
          validate: setting.customValidation
        });
      }

      if (
        setting.type === "string" &&
        !setting.nullable &&
        !setting.secondKey
      ) {
        requiredFields.push({
          key: setting.key,
          errorMessage: setting.errorMessage
        });
      }
    }
  }

  let objectSchema = z.object(shape).partial();

  for (const { key, errorMessage } of requiredFields) {
    objectSchema = objectSchema.extend({
      [key]: z.string({ message: errorMessage }).trim().min(1, errorMessage)
    }) as unknown as typeof objectSchema;
  }

  if (model.isSourceImageRequired) {
    objectSchema = objectSchema.extend({
      source_image_slot: z
        .string({ message: "actions.addStyleReferenceImage.label" })
        .trim()
        .min(1, "actions.addStyleReferenceImage.label")
    });
  }

  objectSchema = objectSchema.passthrough() as typeof objectSchema;

  if (customValidations.length > 0) {
    objectSchema = objectSchema.superRefine((data, ctx) => {
      for (const { key, validate } of customValidations) {
        const value = data[key];
        const errorMessage = validate(value, data, sources);
        if (errorMessage) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: errorMessage,
            path: [key]
          });
        }
      }
    }) as typeof objectSchema;
  }

  return objectSchema;
};
