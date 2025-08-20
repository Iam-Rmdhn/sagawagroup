import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendMitraApprovalEmail = async (
  email: string,
  namaMitra: string,
  password: string = "mitrasagawagroup"
) => {
  const htmlContent = `
    Halo ${namaMitra},

    Selamat! Registrasi Anda di PT SAGAWA PANGAN NUSANTARA telah berhasil.
    Berikut detail akun Anda:

    <ul>
    <li><strong>Email:</strong> ${email}</li>
    <li><strong>Password:</strong> ${password}</li>
    </ul>

    Silakan login melalui [link login].

    Remainder :
    Password tidak bisa di ubah, kecuali oleh admin pusat.

    Terima kasih,
    Admin Support`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Registrasi Akun Anda di PT SAGAWA PANGAN NUSANTARA – Berhasil",
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email berhasil dikirim:", info.response);
  } catch (err) {
    console.error("Gagal mengirim email:", err);
    throw err;
  }
};
