import * as nodemailer from "nodemailer";
import * as path from "path";

// Konfigurasi transporter dengan setting yang lebih lengkap
const transporter = nodemailer.createTransport({
  service: "hostinger",
  host: "smtp.hostinger.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Fungsi untuk test koneksi email
export const testEmailConnection = async () => {
  try {
    await transporter.verify();
    console.log("Email connection is ready to send emails");
    return true;
  } catch (error) {
    console.error("Email connection failed:", error);
    return false;
  }
};

export const sendMitraApprovalEmail = async (
  email: string,
  namaMitra: string,
  password: string = "mitrasagawagroup"
) => {
  // Test koneksi dulu sebelum mengirim
  const isConnected = await testEmailConnection();
  if (!isConnected) {
    throw new Error(
      "Email service tidak dapat terhubung. Periksa konfigurasi EMAIL_USER dan EMAIL_PASS di file .env"
    );
  }

  const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); padding: 0; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
        <!-- Header dengan Logo -->
        <div style="background: linear-gradient(135deg, #ffc107 0%, #f57c00 100%); padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0;">
          <div style="margin-bottom: 20px;">
            <img src="cid:sagawa-logo"
                 alt="Sagawa Group Logo"
                 style="height: 60px; width: auto; invert: 100%; filter: brightness(0) saturate(100%); invert(100%);">
          </div>
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">Selamat Bergabung!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">PT SAGAWA PANGAN NUSANTARA</p>
        </div>

        <!-- Content -->
        <div style="background-color: #ffffff; padding: 40px 30px; margin: 0;">
          <p style="font-size: 18px; line-height: 1.6; color: #2c3e50; margin: 0 0 20px 0;">Yang Terhormat <strong>${namaMitra}</strong>,</p>

          <p style="font-size: 16px; line-height: 1.6; color: #34495e; margin: 0 0 25px 0;">Kami dengan bangga menginformasikan bahwa pendaftaran Anda sebagai mitra resmi PT SAGAWA PANGAN NUSANTARA telah berhasil diverifikasi dan disetujui. Selamat bergabung dalam keluarga besar Sagawa Group!</p>

          <!-- Account Details Card -->
          <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border: 1px solid #dee2e6; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <h3 style="margin: 0 0 20px 0; color: #495057; font-size: 18px; font-weight: 600; text-align: center;">Informasi Akses Dashboard</h3>
            <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107;">
              <p style="margin: 8px 0; font-size: 16px; color: #495057;"><strong>Email:</strong> <span style="color: #f57c00; font-weight: 600;">${email}</span></p>
              <p style="margin: 8px 0; font-size: 16px; color: #495057;"><strong>Password:</strong> <span style="color: #f57c00; font-weight: 600; font-family: 'Courier New', monospace;">${password}</span></p>
            </div>
            <div style="text-align: center; margin-top: 25px;">
              <a href="https://sagawagroup.id/login"
                 style="background: linear-gradient(135deg, #ffc107 0%, #f57c00 100%); color: white; padding: 15px 35px; text-decoration: none; border-radius: 50px; font-weight: 600; display: inline-block; font-size: 16px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 15px rgba(255, 193, 7, 0.4); transition: all 0.3s ease;">
                Akses Dashboard Sekarang
              </a>
            </div>
          </div>

          <!-- Important Notice -->
          <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #ffc107;">
            <p style="margin: 0; font-size: 15px; color: #856404; line-height: 1.5;">
              <strong>Penting:</strong> Demi keamanan akun Anda, password di atas tidak dapat diubah sendiri. Jika ada kendala silakan hubungi Admin Kami.
            </p>
          </div>

          <p style="font-size: 16px; line-height: 1.6; color: #34495e; margin: 25px 0;">Sebagai mitra Sagawa Group, Anda kini memiliki akses ke berbagai fasilitas dan layanan eksklusif yang akan mendukung kesuksesan bisnis Anda. Kami berkomitmen untuk memberikan pelayanan terbaik dan mendampingi perjalanan bisnis Anda.</p>

          <p style="font-size: 16px; line-height: 1.6; color: #34495e; margin: 25px 0 30px 0;">Terima kasih atas kepercayaan Anda bergabung dengan PT SAGAWA PANGAN NUSANTARA.</p>

          <div style="text-align: center; margin: 30px 0;">
            <p style="font-size: 16px; color: #495057; margin: 0;">Hormat kami,</p>
            <p style="font-size: 18px; font-weight: 600; color: #2c3e50; margin: 5px 0 0 0;">Tim Manajemen PT SAGAWA PANGAN NUSANTARA</p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #6c757d; padding: 20px; text-align: center; border-radius: 0 0 12px 12px;">
          <p style="margin: 0; color: #ffffff; font-size: 12px; line-height: 1.4;">
            Email ini dikirim secara otomatis dari sistem PT SAGAWA PANGAN NUSANTARA.<br>
            Jika Anda memiliki pertanyaan, silakan hubungi kami melalui email info@sagawagroup.id.<br>
            <br>
            © 2025 PT SAGAWA PANGAN NUSANTARA. All rights reserved.
          </p>
        </div>
      </div>
      `;

  const logoPath = path.join(
    process.cwd(),
    "../vue-frontend/public/assets/email-logo/sagawa-email.png"
  );

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Registrasi Akun Berhasil",
    html: htmlContent,
    attachments: [
      {
        filename: "sagawa-email.png",
        path: logoPath,
        cid: "sagawa-logo", // Content ID untuk referensi dalam HTML
      },
    ],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email approval berhasil dikirim:", info.response);
    console.log("Email dikirim ke:", email);
    return {
      success: true,
      messageId: info.messageId,
      response: info.response,
    };
  } catch (err: any) {
    console.error("Gagal mengirim email approval:", err);

    // Berikan pesan error yang lebih spesifik
    let errorMessage = "Gagal mengirim email";
    if (err.code === "EAUTH") {
      errorMessage =
        "Email authentication gagal. Periksa EMAIL_USER dan EMAIL_PASS di file .env. Pastikan menggunakan App Password Gmail.";
    } else if (err.code === "ECONNECTION") {
      errorMessage = "Gagal terhubung ke server email Gmail.";
    } else if (err.code === "EMESSAGE") {
      errorMessage = "Format email tidak valid.";
    }

    throw new Error(errorMessage);
  }
};
