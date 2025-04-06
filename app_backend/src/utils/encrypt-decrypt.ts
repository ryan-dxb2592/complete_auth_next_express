import crypto from "crypto";
import { ENCRYPTION_KEY } from "@/constants";

const algorithm = "aes-256-cbc";
const IV_LENGTH = 16;


export const encrypt = (text: string) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
};


export const decrypt = (encryptedText: string) => {
  const [ivPart, encryptedPart] = encryptedText.split(":");
  const iv = Buffer.from(ivPart, "hex");
  const encrypted = Buffer.from(encryptedPart, "hex");
  const decipher = crypto.createDecipheriv(
    algorithm,
    Buffer.from(ENCRYPTION_KEY, "hex"),
    iv
  );
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};
