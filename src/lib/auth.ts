import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
  },
  // El adapter de Prisma accede a los modelos como `prisma[modelName]`, y el
  // client expone el delegate en lowerCamelCase del modelo. El modelo
  // bancario `Account` ya ocupa el delegate "account", así que la cuenta de
  // auth usa `AuthAccount` -> delegate `authAccount`.
  user: { modelName: "user" },
  session: { modelName: "session" },
  account: { modelName: "authAccount" },
  verification: { modelName: "verification" },
});