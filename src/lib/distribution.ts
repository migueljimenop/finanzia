import { CalcMethod, BucketType } from "@/generated/prisma/client";

export type BucketInput = {
  id: string;
  type: BucketType;
  calcMethod: CalcMethod;
  value: number | null;
  order: number;
};

export type BucketDistribution = {
  bucketId: string;
  type: BucketType;
  amount: number;
};

export function computeDistribution(
  incomeAmount: number,
  buckets: BucketInput[]
): BucketDistribution[] {
  const sorted = [...buckets].sort((a, b) => a.order - b.order);
  const fixed = sorted.filter((b) => b.calcMethod !== CalcMethod.REMAINDER);
  const remainderBuckets = sorted.filter((b) => b.calcMethod === CalcMethod.REMAINDER);

  const fixedResults = fixed.map((bucket) => {
    const amount =
      bucket.calcMethod === CalcMethod.PERCENTAGE
        ? incomeAmount * ((bucket.value ?? 0) / 100)
        : bucket.value ?? 0;
    return { bucketId: bucket.id, type: bucket.type, amount };
  });

  const spent = fixedResults.reduce((sum, r) => sum + r.amount, 0);
  const remaining = Math.max(incomeAmount - spent, 0);
  const perRemainderBucket = remainderBuckets.length > 0 ? remaining / remainderBuckets.length : 0;

  const remainderResults = remainderBuckets.map((bucket) => ({
    bucketId: bucket.id,
    type: bucket.type,
    amount: perRemainderBucket,
  }));

  return [...fixedResults, ...remainderResults];
}
