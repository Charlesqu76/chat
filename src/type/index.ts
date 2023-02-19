export enum EIdentity {
  GPT = "GPT",
  USER = "USER",
}

export type TtextList = Array<{
  identity: EIdentity;
  text: string;
  loading?: boolean;
  isError?: boolean;
}>;
