import { approveMitra } from "../services/mitra.services";

interface ApproveMitraBody {
  userId: string;
  email: string;
}

export const approveMitraController = async (
  req: Request
): Promise<Response> => {
  const body = (await req.json()) as ApproveMitraBody;

  if (!body.userId || !body.email) {
    return new Response(
      JSON.stringify({ error: "userId dan email wajib diisi" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const { userId, email } = body;

  try {
    const result = await approveMitra({ userId, email });
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Gagal menyetujui mitra" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
