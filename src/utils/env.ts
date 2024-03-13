import { z } from "zod";

const envSchema = z.object({
    ALCHEMY_HTTPS: z.string(),
});

envSchema.parse(process.env);

declare global {
    namespace NodeJS {
        interface ProcessEnv extends z.infer<typeof envSchema> {}
    }
}
