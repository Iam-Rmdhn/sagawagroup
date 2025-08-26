import {
  loginService,
  mitraLoginService,
  getMitraLoginProfileService,
  getAllMitraLoginService,
  adminLoginService,
  adminRegisterService,
  getAllMitraService,
  getMitraByIdService,
  approveMitraService,
  updateMitraWithSampleImages,
  updateMitraProfileService,
} from "../services/auth.services";
import { verifyToken } from "../utils/jwt";
import validator from "validator";

interface LoginRequestBody {
  email: string;
  password: string;
}

interface AdminRegisterRequestBody {
  email: string;
  password: string;
  nama: string;
}

interface ApproveMitraRequestBody {
  mitraId: string;
  action: "approve" | "reject";
}

interface UpdateProfileRequestBody {
  namaMitra: string;
  noHp: string;
  alamatMitra: string;
}

// Helper function to validate admin token
async function validateAdminToken(req: Request): Promise<any> {
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Token tidak ditemukan");
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded.role || decoded.role !== "admin") {
    throw new Error("Akses ditolak: bukan admin");
  }

  return decoded;
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
    // Gunakan mitraLoginService untuk login mitra
    const result = await mitraLoginService(sanitizedEmail, sanitizedPassword);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Login error:", err.message);
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || "Email atau password salah",
      }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const adminLogin = async (req: Request): Promise<Response> => {
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
  if (sanitizedPassword.length < 6) {
    return new Response(
      JSON.stringify({ error: "Password minimal 6 karakter" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const result = await adminLoginService(sanitizedEmail, sanitizedPassword);

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

export const adminRegister = async (req: Request): Promise<Response> => {
  const { email, password, nama } =
    (await req.json()) as AdminRegisterRequestBody;

  // Validasi input required
  if (!email || !password || !nama) {
    return new Response(
      JSON.stringify({ error: "Email, password, dan nama wajib diisi" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Sanitasi dan validasi email
  const sanitizedEmail = validator.normalizeEmail(email.trim());
  if (!sanitizedEmail || !validator.isEmail(sanitizedEmail)) {
    return new Response(JSON.stringify({ error: "Email tidak valid" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Sanitasi password
  const sanitizedPassword = password.trim();
  if (sanitizedPassword.length < 6) {
    return new Response(
      JSON.stringify({ error: "Password minimal 6 karakter" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Sanitasi nama
  const sanitizedNama = validator.escape(nama.trim());
  if (sanitizedNama.length < 2) {
    return new Response(JSON.stringify({ error: "Nama minimal 2 karakter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const result = await adminRegisterService({
      email: sanitizedEmail,
      password: sanitizedPassword,
      nama: sanitizedNama,
    });

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const getAllMitra = async (req: Request): Promise<Response> => {
  console.log("getAllMitra called");

  try {
    // Validate admin token
    await validateAdminToken(req);

    console.log("Calling getAllMitraService...");
    const result = await getAllMitraService();
    console.log("getAllMitraService result:", result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Error in getAllMitra:", err);

    // Handle auth errors specifically
    if (err.message.includes("Token") || err.message.includes("Akses")) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const getMitraById = async (req: Request): Promise<Response> => {
  console.log("getMitraById called");

  try {
    // Validate admin token
    await validateAdminToken(req);

    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const mitraId = pathParts[pathParts.length - 1];

    if (!mitraId) {
      return new Response(
        JSON.stringify({ error: "Mitra ID tidak ditemukan" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("Calling getMitraByIdService with ID:", mitraId);
    const result = await getMitraByIdService(mitraId);
    console.log("getMitraByIdService result:", result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Error in getMitraById:", err);

    // Handle auth errors specifically
    if (err.message.includes("Token") || err.message.includes("Akses")) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const approveMitra = async (req: Request): Promise<Response> => {
  try {
    // Validate admin token
    await validateAdminToken(req);

    const { mitraId, action } = (await req.json()) as ApproveMitraRequestBody;

    if (!mitraId || !action) {
      return new Response(
        JSON.stringify({ error: "mitraId dan action wajib diisi" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (action !== "approve" && action !== "reject") {
      return new Response(
        JSON.stringify({ error: "Action harus 'approve' atau 'reject'" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = await approveMitraService(mitraId, action);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    // Handle auth errors specifically
    if (err.message.includes("Token") || err.message.includes("Akses")) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// Update mitra images to base64 (utility endpoint for demo)
export const updateMitraImages = async (req: Request): Promise<Response> => {
  try {
    // Sample base64 image data (1x1 pixel JPEG)
    const sampleBase64 =
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A/wAP/Z";

    return new Response(
      JSON.stringify({
        success: true,
        message: "Sample base64 image",
        data: {
          sampleImage: sampleBase64,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("Error in updateMitraImages:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// Controller untuk mendapatkan profile mitra login
export const getMitraProfile = async (req: Request): Promise<Response> => {
  try {
    // Validate mitra token
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Token tidak ditemukan" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded.role || decoded.role !== "mitra") {
      return new Response(
        JSON.stringify({ error: "Akses ditolak: bukan mitra" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = await getMitraLoginProfileService(decoded.id);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Error getting mitra profile:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

// Controller untuk admin mendapatkan semua mitra login
export const getAllMitraLogin = async (req: Request): Promise<Response> => {
  try {
    // Validate admin token
    await validateAdminToken(req);

    const result = await getAllMitraLoginService();

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Error getting all mitra login:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

// Controller untuk update profile mitra
export const updateMitraProfile = async (req: Request): Promise<Response> => {
  try {
    // Validate mitra token
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Token tidak ditemukan" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded.role || decoded.role !== "mitra") {
      return new Response(
        JSON.stringify({ error: "Akses ditolak: bukan mitra" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const updateData = (await req.json()) as UpdateProfileRequestBody;

    // Validate required fields
    if (!updateData.namaMitra || !updateData.noHp || !updateData.alamatMitra) {
      return new Response(
        JSON.stringify({ error: "Nama mitra, no HP, dan alamat harus diisi" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate phone number format
    const phoneRegex = /^[0-9]{10,15}$/;
    if (!phoneRegex.test(updateData.noHp)) {
      return new Response(
        JSON.stringify({ error: "Nomor HP harus berisi 10-15 digit angka" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = await updateMitraProfileService(decoded.id, updateData);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Error updating mitra profile:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
