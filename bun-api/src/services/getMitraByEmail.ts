// Service to get mitra by email
import { MitraModel } from "../models/mitra.model";
import { UserModel } from "../models/user.model";

export async function getMitraByEmail(email: string) {
  if (!email) return null;
  
  console.log(`🔍 Looking for mitra with email: ${email}`);
  
  // First, try exact match
  let mitra = await MitraModel.findOne({ email });
  console.log(`🔍 Exact match in mitra collection result:`, mitra ? 'Found' : 'Not found');
  
  // If not found with exact match, try with case-insensitive search
  if (!mitra) {
    mitra = await MitraModel.findOne({ 
      email: { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    } as any);
    console.log(`🔍 Case-insensitive match in mitra collection result:`, 
      mitra ? 'Found' : 'Not found');
  }
  
  // Additional check: if still not found, look in user collection for any potential sync issues
  if (!mitra) {
    const user = await UserModel.findOne({ email });
    console.log(`🔍 User collection check result:`, user ? 'Found' : 'Not found');
    
    // If user exists but no mitra record, there might be a sync issue
    if (user) {
      console.log(`⚠️  User exists but no mitra record for email: ${email}`);
      // This could indicate the user was created through a different process
      // For now return null but log the issue
    }
  }
  
  if (!mitra) {
    console.log(`❌ No mitra found for email: ${email} in either mitra or user collections`);
    return null;
  }
  
  // Ambil status pelunasan dari user
  const user = await UserModel.findOne({ email });
  if (user) {
    mitra.isPaidOff = user.isPaidOff || false;
    mitra.statusPelunasan = user.statusPelunasan || "";
  }
  
  console.log(`✅ Found mitra:`, { 
    id: mitra._id, 
    nama: mitra.namaMitra, 
    email: mitra.email,
    hasUserStatus: !!user 
  });
  
  // Return standardized object with 'nama' field for frontend compatibility
  return {
    _id: mitra._id,
    id: mitra._id,
    nama: mitra.namaMitra,
    namaMitra: mitra.namaMitra, // Keep both for backward compatibility
    email: mitra.email,
    noHp: mitra.noHp,
    alamatMitra: mitra.alamatMitra,
    sistemKemitraan: mitra.sistemKemitraan,
    paketUsaha: mitra.paketUsaha,
    hargaPaket: mitra.hargaPaket,
    nominalDP: mitra.nominalDP,
    nominalFull: mitra.nominalFull,
    nilaiPaketUsaha: mitra.nilaiPaketUsaha,
    kekurangan: mitra.kekurangan,
    yangHarusDibayar: mitra.yangHarusDibayar,
    diskonHarian: mitra.diskonHarian,
    status: mitra.status || 'pending',
    isApproved: mitra.isApproved || false,
    isPaidOff: mitra.isPaidOff,
    statusPelunasan: mitra.statusPelunasan,
    createdAt: mitra.createdAt,
    updatedAt: mitra.updatedAt
  };
}