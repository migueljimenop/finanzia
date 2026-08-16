import { BucketType } from "@/generated/prisma/enums";

export const BUCKET_COLORS: Record<BucketType, string> = {
  INVESTMENT: "var(--chart-7)",
  HOME_TRANSFER: "var(--chart-3)",
  CREDIT_INSTALLMENT: "var(--chart-2)",
  AVAILABLE_MARGIN: "var(--chart-1)",
};
