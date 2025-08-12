import { loginService } from "../services/auth.services";
import validator from "validator";

interface LoginRequestBody {
  email: string;
  password: string;
}

export const loginMitra = async (req: Request): Promise<Response> => {
  const { email, password } = (await req.json()) as LoginRequestBody;

  if (!email || !password) {
    return new Response(
      JSON.stringify({ error: "Email dan password wajib diisi" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const sanitizedEmail = validator.normalizeEmail(email.trim());
  if (!sanitizedEmail || !validator.isEmail(sanitizedEmail)) {
    return new Response(JSON.stringify({ error: "Email tidak valid" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const sanitizedPassword = password.trim();

  try {
    const result = await loginService(sanitizedEmail, sanitizedPassword);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Email atau password salah" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
};
