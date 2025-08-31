import bcrypt from "bcryptjs";
import { UserModel, type User } from "../models/user.model";
import { AdminModel, type Admin } from "../models/admin.model";
import { MitraModel, type Mitra } from "../models/mitra.model";
import { MitraLoginModel, type MitraLogin } from "../models/mitra-login.model";
import { generateToken } from "../utils/jwt";
import { sendMitraApprovalEmail } from "../utils/email";

// Login service untuk mitra menggunakan collection mitra_login
export async function mitraLoginService(email: string, password: string) {
  const mitraLogin = await MitraLoginModel.findByEmail(email);
  if (!mitraLogin) throw new Error("Email tidak terdaftar");

  if (!mitraLogin.isActive) throw new Error("Akun tidak aktif");

  const isMatch = await bcrypt.compare(password, mitraLogin.password);
  if (!isMatch) throw new Error("Password salah");

  // Update last login
  await MitraLoginModel.updateLastLogin(email);

  // Generate JWT token
  const token = generateToken({
    id: mitraLogin._id,
    email: mitraLogin.email,
    role: "mitra",
  });

  // Remove password from response
  const { password: _, ...safeMitraLogin } = mitraLogin;

  return {
    success: true,
    message: "Login berhasil",
    data: {
      token,
      user: safeMitraLogin,
    },
  };
}

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

// Service untuk mendapatkan data mitra login
export async function getMitraLoginProfileService(mitraLoginId: string) {
  const mitraLogin = await MitraLoginModel.findById(mitraLoginId);
  if (!mitraLogin) {
    throw new Error("Mitra login tidak ditemukan");
  }

  // Get detailed mitra data
  const mitraDetail = await MitraModel.findById(mitraLogin.mitraId);

  // Remove password from response
  const { password: _, ...safeMitraLogin } = mitraLogin;

  return {
    success: true,
    data: {
      // Login data
      _id: safeMitraLogin._id,
      email: safeMitraLogin.email,
      namaMitra: safeMitraLogin.namaMitra,
      isActive: safeMitraLogin.isActive,
      lastLogin: safeMitraLogin.lastLogin,
      createdAt: safeMitraLogin.createdAt,
      updatedAt: safeMitraLogin.updatedAt,

      // Mitra detail data (from mitra collection)
      mitraDetail: mitraDetail,

      // Flattened mitra data for easier access
      ...(mitraDetail
        ? {
            // Personal info from mitra collection
            alamatMitra: mitraDetail.alamatMitra,
            noHp: mitraDetail.noHp,

            // Business info from mitra collection
            sistemKemitraan: mitraDetail.sistemKemitraan,
            sales: mitraDetail.sales,
            paketUsaha: mitraDetail.paketUsaha,

            // Status from mitra collection
            status: mitraDetail.status,
            isApproved: mitraDetail.isApproved,
            userID: mitraDetail.userID,

            // Nilai Paket
            hargaPaket: mitraDetail.hargaPaket,

            // Use mitra registration date as join date
            joinDate: mitraDetail.createdAt,
          }
        : {}),
    },
  };
}

// Service untuk mendapatkan semua mitra login (untuk admin)
export async function getAllMitraLoginService() {
  const mitraLogins = await MitraLoginModel.findAll();

  // Remove passwords from response
  const safeLogins = mitraLogins.map(({ password: _, ...login }) => login);

  return {
    success: true,
    data: safeLogins,
    total: safeLogins.length,
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

      // Generate default password for new mitra login
      const defaultPassword = "mitrasagawagroup";
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);

      // Create mitra login account in mitra_login collection
      const newMitraLogin = await MitraLoginModel.create({
        email: mitra.email,
        password: hashedPassword,
        namaMitra: mitra.namaMitra,
        mitraId: mitraId,
        sales: mitra.sales,
        paketUsaha: mitra.paketUsaha,
        isActive: true,
      });

      // Update mitra with login reference
      await MitraModel.updateOne(
        { _id: mitraId },
        {
          userID: newMitraLogin._id,
          status: "approved",
          isApproved: true,
        }
      );

      // Send approval email
      try {
        await sendMitraApprovalEmail(
          mitra.email,
          mitra.namaMitra,
          defaultPassword
        );
        console.log(`Email approval berhasil dikirim ke: ${mitra.email}`);
      } catch (emailError) {
        console.error("Error sending email:", emailError);
        // Don't throw error here, user account is already created
      }

      return {
        success: true,
        message: "Mitra berhasil disetujui dan akun login telah dibuat",
        data: {
          mitraId,
          loginId: newMitraLogin._id,
          email: mitra.email,
        },
      };
    } else {
      // Reject mitra - DELETE from database and clean up files

      // Delete associated files if they exist
      try {
        if (
          mitra.fotoKTP &&
          mitra.fotoKTP.startsWith("http://localhost:5000/uploads/")
        ) {
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

        if (
          mitra.buktiTransfer &&
          mitra.buktiTransfer.startsWith("http://localhost:5000/uploads/")
        ) {
          const fileName = mitra.buktiTransfer.split("/uploads/")[1];
          const filePath = `./uploads/${fileName}`;
          try {
            const file = Bun.file(filePath);
            if (await file.exists()) {
              await Bun.write(filePath, new Uint8Array(0)); // Clear file content
              console.log(`Deleted file: ${filePath}`);
            }
          } catch (fileError) {
            console.warn(
              `Could not delete transfer file: ${filePath}`,
              fileError
            );
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

// Service untuk update profile mitra
export async function updateMitraProfileService(
  mitraLoginId: string,
  updateData: { namaMitra: string; noHp: string; alamatMitra: string }
) {
  // First get the mitra login data to get the mitraId
  const mitraLogin = await MitraLoginModel.findById(mitraLoginId);
  if (!mitraLogin) {
    throw new Error("Mitra login tidak ditemukan");
  }

  // Update both mitra_login and mitra collections

  // 1. Update mitra_login collection
  await MitraLoginModel.updateById(mitraLoginId, {
    namaMitra: updateData.namaMitra,
  });

  // 2. Update mitra collection
  await MitraModel.updateById(mitraLogin.mitraId, {
    namaMitra: updateData.namaMitra,
    noHp: updateData.noHp,
    alamatMitra: updateData.alamatMitra,
  });

  return {
    success: true,
    message: "Profile berhasil diperbarui",
    data: {
      namaMitra: updateData.namaMitra,
      noHp: updateData.noHp,
      alamatMitra: updateData.alamatMitra,
    },
  };
}

// Delete mitra from both collections (mitra and mitra_login)
export async function deleteMitraService(mitraId: string) {
  try {
    // Find mitra by ID first to get file information
    const mitra = await MitraModel.findById(mitraId);
    if (!mitra) {
      throw new Error("Mitra tidak ditemukan");
    }

    // Delete associated files if they exist
    try {
      if (
        mitra.fotoKTP &&
        mitra.fotoKTP.startsWith("http://localhost:4000/uploads/")
      ) {
        const fileName = mitra.fotoKTP.split("/uploads/")[1];
        const filePath = `./uploads/${fileName}`;
        try {
          const file = Bun.file(filePath);
          if (await file.exists()) {
            await Bun.write(filePath, new Uint8Array(0)); // Clear file content
            console.log(`Deleted KTP file: ${filePath}`);
          }
        } catch (fileError) {
          console.warn(`Could not delete KTP file: ${filePath}`, fileError);
        }
      }

      if (
        mitra.buktiTransfer &&
        mitra.buktiTransfer.startsWith("http://localhost:4000/uploads/")
      ) {
        const fileName = mitra.buktiTransfer.split("/uploads/")[1];
        const filePath = `./uploads/${fileName}`;
        try {
          const file = Bun.file(filePath);
          if (await file.exists()) {
            await Bun.write(filePath, new Uint8Array(0)); // Clear file content
            console.log(`Deleted transfer file: ${filePath}`);
          }
        } catch (fileError) {
          console.warn(
            `Could not delete transfer file: ${filePath}`,
            fileError
          );
        }
      }
    } catch (cleanupError) {
      console.warn("File cleanup error (non-critical):", cleanupError);
      // Don't throw error, continue with database deletion
    }

    // Delete from mitra_login collection first (if exists)
    try {
      await MitraLoginModel.deleteByMitraId(mitraId);
      console.log(`Deleted mitra login record for mitraId: ${mitraId}`);
    } catch (loginDeleteError) {
      console.warn("Error deleting mitra login record:", loginDeleteError);
      // Continue with main mitra deletion even if login deletion fails
    }

    // Delete from mitra collection
    const deleteResult = await MitraModel.deleteOne({ _id: mitraId });

    if (!deleteResult) {
      throw new Error("Gagal menghapus data mitra dari database");
    }

    return {
      success: true,
      message: "Mitra berhasil dihapus dari database",
      data: {
        mitraId,
        deleted: true,
      },
    };
  } catch (error) {
    console.error("Error deleting mitra:", error);
    throw error;
  }
}
