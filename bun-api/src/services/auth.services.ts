import bcrypt from "bcryptjs";
import { UserModel, type User } from "../models/user.model";
import { AdminModel, type Admin } from "../models/admin.model";
import { MitraModel, type Mitra } from "../models/mitra.model";
import { generateToken } from "../utils/jwt";
import { sendMitraApprovalEmail } from "../utils/email";

export async function loginService(email: string, password: string) {
  const mitra = await UserModel.findOne({ email });
  if (!mitra) throw new Error("Mitra tidak ditemukan");

  const isMatch = await bcrypt.compare(password, mitra.password);
  if (!isMatch) throw new Error("Password Salah");

  const token = generateToken({ id: mitra._id, email: mitra.email });

  // Remove password from response
  const { password: _, ...safeMitra } = mitra;

  return {
    user: safeMitra,
    token,
  };
}

export async function adminLoginService(email: string, password: string) {
  const admin = await AdminModel.findOne({ email });
  if (!admin) throw new Error("Admin tidak ditemukan");

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) throw new Error("Password Salah");

  const token = generateToken({
    id: admin._id,
    email: admin.email,
    role: admin.role,
  });

  // Remove password from response
  const { password: _, ...safeAdmin } = admin;

  return {
    user: safeAdmin,
    token,
  };
}

export async function adminRegisterService(adminData: {
  email: string;
  password: string;
  nama: string;
}) {
  // Check if admin already exists
  const existingAdmin = await AdminModel.findOne({ email: adminData.email });
  if (existingAdmin) {
    throw new Error("Admin dengan email ini sudah terdaftar");
  }

  // Hash password
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(adminData.password, saltRounds);

  // Create admin
  const newAdmin = await AdminModel.create({
    ...adminData,
    password: hashedPassword,
    role: "admin",
  });

  // Generate token
  const token = generateToken({
    id: newAdmin._id,
    email: newAdmin.email,
    role: newAdmin.role,
  });

  // Remove password from response
  const { password: _, ...safeAdmin } = newAdmin;

  return {
    user: safeAdmin,
    token,
  };
}

export async function getAllMitraService() {
  try {
    // Get all mitra from database
    const mitras = await MitraModel.find({});

    return {
      success: true,
      data: mitras,
      total: mitras.length,
    };
  } catch (error) {
    console.error("Error getting mitra:", error);
    throw new Error("Gagal mengambil data mitra");
  }
}

export async function getMitraByIdService(mitraId: string) {
  try {
    // Get specific mitra by ID
    const mitra = await MitraModel.findById(mitraId);

    if (!mitra) {
      throw new Error("Mitra tidak ditemukan");
    }

    // Convert image filenames to base64 if they exist as files
    const mitraWithImages = { ...mitra };

    // Helper function to convert image file to base64
    const convertImageToBase64 = async (
      filename: string | undefined
    ): Promise<string | undefined> => {
      if (!filename || filename === "") return undefined;

      // If it's already base64 data URL, return it directly
      if (filename.startsWith("data:")) {
        return filename;
      }

      // If it's a base64 string without data: prefix, add the prefix
      if (
        filename.length > 100 &&
        !filename.includes(".") &&
        !filename.includes("/")
      ) {
        // Assume it's base64 data, add data URL prefix
        return `data:image/jpeg;base64,${filename}`;
      }

      // For any other case, try to return it as is (might be a filename or URL)
      return filename;
    };

    // Convert all image fields
    if (mitraWithImages.fotoKTP) {
      const convertedKTP = await convertImageToBase64(mitraWithImages.fotoKTP);
      if (convertedKTP) mitraWithImages.fotoKTP = convertedKTP;
    }
    if (mitraWithImages.buktiTransfer) {
      const convertedTransfer = await convertImageToBase64(
        mitraWithImages.buktiTransfer
      );
      if (convertedTransfer) mitraWithImages.buktiTransfer = convertedTransfer;
    }

    return {
      success: true,
      data: mitraWithImages,
    };
  } catch (error) {
    console.error("Error getting mitra by ID:", error);
    throw new Error("Gagal mengambil data mitra");
  }
}

export async function approveMitraService(
  mitraId: string,
  action: "approve" | "reject"
) {
  try {
    // Find mitra by ID
    const mitra = await MitraModel.findById(mitraId);
    if (!mitra) {
      throw new Error("Mitra tidak ditemukan");
    }

    if (mitra.status !== "pending") {
      throw new Error("Mitra sudah diproses sebelumnya");
    }

    if (action === "approve") {
      // Update mitra status to approved
      await MitraModel.updateOne(
        { _id: mitraId },
        {
          status: "approved",
          isApproved: true,
        }
      );

      // Generate random password for new user
      const defaultPassword = "mitrasagawagroup";
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);

      // Create user account
      const newUser = await UserModel.create({
        email: mitra.email,
        password: hashedPassword,
        nama: mitra.namaMitra,
        sales: mitra.sales,
        isApproved: true,
      });

      // Update mitra with userID
      await MitraModel.updateOne({ _id: mitraId }, { userID: newUser._id });

      // Send approval email
      try {
        await sendMitraApprovalEmail(
          mitra.email,
          mitra.namaMitra,
          mitra.paketUsaha,
          defaultPassword
        );
      } catch (emailError) {
        console.error("Error sending email:", emailError);
        // Don't throw error here, user account is already created
      }

      return {
        success: true,
        message: "Mitra berhasil disetujui dan akun telah dibuat",
        data: {
          mitraId,
          userId: newUser._id,
          email: mitra.email,
        },
      };
    } else {
      // Reject mitra - DELETE from database and clean up files
      
      // Delete associated files if they exist
      try {
        if (mitra.fotoKTP && mitra.fotoKTP.startsWith("http://localhost:9999/uploads/")) {
          const fileName = mitra.fotoKTP.split("/uploads/")[1];
          const filePath = `./uploads/${fileName}`;
          try {
            const file = Bun.file(filePath);
            if (await file.exists()) {
              await Bun.write(filePath, new Uint8Array(0)); // Clear file content
              console.log(`Deleted file: ${filePath}`);
            }
          } catch (fileError) {
            console.warn(`Could not delete KTP file: ${filePath}`, fileError);
          }
        }

        if (mitra.buktiTransfer && mitra.buktiTransfer.startsWith("http://localhost:9999/uploads/")) {
          const fileName = mitra.buktiTransfer.split("/uploads/")[1];
          const filePath = `./uploads/${fileName}`;
          try {
            const file = Bun.file(filePath);
            if (await file.exists()) {
              await Bun.write(filePath, new Uint8Array(0)); // Clear file content
              console.log(`Deleted file: ${filePath}`);
            }
          } catch (fileError) {
            console.warn(`Could not delete transfer file: ${filePath}`, fileError);
          }
        }
      } catch (cleanupError) {
        console.warn("File cleanup error (non-critical):", cleanupError);
        // Don't throw error, continue with database deletion
      }
      
      // Delete from database
      const deleteResult = await MitraModel.deleteOne({ _id: mitraId });
      
      if (!deleteResult) {
        throw new Error("Gagal menghapus data mitra yang ditolak");
      }

      return {
        success: true,
        message: "Mitra ditolak dan data telah dihapus dari database",
        data: {
          mitraId,
          deleted: true,
        },
      };
    }
  } catch (error) {
    console.error("Error approving mitra:", error);
    throw error;
  }
}

// Update mitra with sample base64 images (demo utility)
export async function updateMitraWithSampleImages() {
  try {
    // Sample base64 image data (1x1 pixel JPEG - red pixel)
    const sampleBase64 =
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A/wAP/Z";

    return {
      success: true,
      message: "Sample image data prepared",
      data: {
        fotoKTP: sampleBase64,
        buktiTransfer: sampleBase64,
      },
    };
  } catch (error) {
    console.error("Error preparing sample images:", error);
    throw new Error("Gagal menyiapkan data gambar sample");
  }
}
