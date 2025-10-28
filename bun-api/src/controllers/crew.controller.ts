import { CrewModel } from "../models/crew.model";
import type { Crew } from "../models/crew.model";
import { verifyToken } from "../utils/jwt";
import * as bcrypt from "bcryptjs";
import {
  crewLoginService,
  getCrewProfileService,
} from "../services/crew.services";

// Type for request body
interface CreateCrewRequest {
  nama?: string;
  email?: string;
  password?: string;
  divisi?: string;
  nomorHP?: string;
  kemitraan?: string | null;
  subBrand?: string | null;
  outlet?: string | null;
}

// Helper: Validate admin token from Authorization header
async function validateAdminToken(req: Request): Promise<boolean> {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return false;
    }

    const token = authHeader.substring("Bearer ".length);
    const decoded = verifyToken(token);

    // Check if it's an admin token (should have admin-related fields)
    return !!decoded;
  } catch (error) {
    console.error("Token validation error:", error);
    return false;
  }
}

// POST /api/admin/crew/create
export const createCrewController = async (req: Request): Promise<Response> => {
  try {
    // Validate admin token
    const isValid = await validateAdminToken(req);
    if (!isValid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Unauthorized - Invalid or missing token",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = (await req.json()) as CreateCrewRequest;

    // Validation
    if (
      !body.nama ||
      !body.email ||
      !body.divisi ||
      !body.nomorHP ||
      !body.password
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Nama, email, divisi, nomor HP, dan password harus diisi",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate password length (minimum 6 characters)
    if (body.password.length < 6) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Password minimal harus 6 karakter",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(body.password, saltRounds);

    // Check if email already exists
    const existingCrew = await CrewModel.findOne({ email: body.email });
    if (existingCrew) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Email sudah terdaftar",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Prepare crew data
    const crewData: Omit<Crew, "_id" | "createdAt" | "updatedAt"> = {
      nama: body.nama,
      email: body.email,
      password: hashedPassword,
      divisi: body.divisi as
        | "IT & Digital"
        | "Finance"
        | "Digital Marketing"
        | "Produksi"
        | "Supervisor"
        | "Crew",
      kemitraan: body.kemitraan || null,
      subBrand: body.subBrand || null,
      outlet: body.outlet || null,
      nomorHP: body.nomorHP,
      status: "active",
    };

    // Create crew
    const newCrew = await CrewModel.create(crewData);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Crew berhasil ditambahkan",
        data: newCrew,
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating crew:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Gagal menambahkan crew",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// GET /api/admin/crew
export const getCrewController = async (req: Request): Promise<Response> => {
  try {
    // Validate admin token
    const isValid = await validateAdminToken(req);
    if (!isValid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Unauthorized - Invalid or missing token",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const url = new URL(req.url);
    const status = url.searchParams.get("status");

    // Build filter
    const filter: Partial<Crew> = {};
    if (status && (status === "active" || status === "inactive")) {
      filter.status = status as "active" | "inactive";
    }

    const crewList = await CrewModel.find(filter);

    return new Response(
      JSON.stringify({
        success: true,
        data: crewList,
        total: crewList.length,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching crew:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Gagal mengambil data crew",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// GET /api/admin/crew/:id
export const getCrewByIdController = async (
  req: Request
): Promise<Response> => {
  try {
    // Validate admin token
    const isValid = await validateAdminToken(req);
    if (!isValid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Unauthorized - Invalid or missing token",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const id = pathParts[pathParts.length - 1];

    if (!id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "ID crew tidak ditemukan",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const crew = await CrewModel.findById(id);

    if (!crew) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Crew tidak ditemukan",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: crew,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching crew by ID:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Gagal mengambil data crew",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// PUT /api/admin/crew/:id
export const updateCrewController = async (req: Request): Promise<Response> => {
  try {
    // Validate admin token
    const isValid = await validateAdminToken(req);
    if (!isValid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Unauthorized - Invalid or missing token",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const id = pathParts[pathParts.length - 1];
    const body = (await req.json()) as CreateCrewRequest;

    if (!id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "ID crew tidak ditemukan",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // If email is being updated, check for duplicates
    if (body.email) {
      const existingCrew = await CrewModel.findOne({ email: body.email });
      if (existingCrew && existingCrew._id !== id) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Email sudah digunakan oleh crew lain",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    const updateData: Partial<Omit<Crew, "_id" | "createdAt">> = {
      nama: body.nama,
      email: body.email,
      password: body.password
        ? await bcrypt.hash(body.password, 10)
        : undefined,
      divisi: body.divisi as
        | "IT & Digital"
        | "Finance"
        | "Digital Marketing"
        | "Produksi"
        | "Supervisor"
        | "Crew"
        | undefined,
      kemitraan: body.kemitraan || null,
      subBrand: body.subBrand || null,
      outlet: body.outlet || null,
      nomorHP: body.nomorHP,
      status: "active",
    };

    const updatedCrew = await CrewModel.updateById(id, updateData);

    if (!updatedCrew) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Crew tidak ditemukan",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Crew berhasil diperbarui",
        data: updatedCrew,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error updating crew:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Gagal memperbarui crew",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// DELETE /api/admin/crew/:id
export const deleteCrewController = async (req: Request): Promise<Response> => {
  try {
    // Validate admin token
    const isValid = await validateAdminToken(req);
    if (!isValid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Unauthorized - Invalid or missing token",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const id = pathParts[pathParts.length - 1];

    if (!id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "ID crew tidak ditemukan",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const deleted = await CrewModel.deleteById(id);

    if (!deleted) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Crew tidak ditemukan",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Crew berhasil dihapus",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error deleting crew:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Gagal menghapus crew",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// Type for login request body
interface CrewLoginRequest {
  email?: string;
  password?: string;
}

// POST /api/crew/login
export const crewLoginController = async (req: Request): Promise<Response> => {
  try {
    const body = (await req.json()) as CrewLoginRequest;
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Email dan password harus diisi",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = await crewLoginService(email, password);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error crew login:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Login gagal",
      }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
};

// GET /api/crew/profile
export const getCrewProfileController = async (
  req: Request
): Promise<Response> => {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Token tidak ditemukan",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.substring("Bearer ".length);
    const decoded = verifyToken(token);

    if (!decoded || !decoded.id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Token tidak valid",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = await getCrewProfileService(decoded.id);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error getting crew profile:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Gagal mengambil profile crew",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
