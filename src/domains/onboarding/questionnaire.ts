export type Profession =
  | "2d_animation"
  | "3d_animation"
  | "vfx"
  | "vertical_drama"
  | "social_media_content"
  | "other";

export type ReferralSource =
  | "instagram"
  | "youtube"
  | "linkedin"
  | "google"
  | "friend"
  | "tiktok";

export interface QuestionnaireAnswers {
  firstName: string;
  lastName: string;
  profession: Profession;
  professionOther?: string;
  referralSource: ReferralSource;
}

export interface QuestionnaireOption<T> {
  value: T;
  labelKey: string;
}

export const SIGNUP_QUESTIONNAIRE_COMPLETED_KEY =
  "signupQuestionnaireCompleted";

export const PROFESSION_OPTIONS: QuestionnaireOption<Profession>[] = [
  {
    value: "2d_animation",
    labelKey: "titles.onboarding_questionnaire.profession.2d_animation"
  },
  {
    value: "3d_animation",
    labelKey: "titles.onboarding_questionnaire.profession.3d_animation"
  },
  { value: "vfx", labelKey: "titles.onboarding_questionnaire.profession.vfx" },
  {
    value: "vertical_drama",
    labelKey: "titles.onboarding_questionnaire.profession.vertical_drama"
  },
  {
    value: "social_media_content",
    labelKey: "titles.onboarding_questionnaire.profession.social_media_content"
  },
  {
    value: "other",
    labelKey: "titles.onboarding_questionnaire.profession.other"
  }
];

export const REFERRAL_SOURCE_OPTIONS: QuestionnaireOption<ReferralSource>[] = [
  {
    value: "instagram",
    labelKey: "titles.onboarding_questionnaire.referral_source.instagram"
  },
  {
    value: "youtube",
    labelKey: "titles.onboarding_questionnaire.referral_source.youtube"
  },
  {
    value: "linkedin",
    labelKey: "titles.onboarding_questionnaire.referral_source.linkedin"
  },
  {
    value: "google",
    labelKey: "titles.onboarding_questionnaire.referral_source.google"
  },
  {
    value: "friend",
    labelKey: "titles.onboarding_questionnaire.referral_source.friend"
  },
  {
    value: "tiktok",
    labelKey: "titles.onboarding_questionnaire.referral_source.tiktok"
  }
];
