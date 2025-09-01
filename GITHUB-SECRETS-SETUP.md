# GitHub Secrets Setup untuk Sagawa Group

## Required Secrets untuk Deploy to Production Workflow:

### 1. HOST
- Name: `HOST`  
- Value: `31.97.221.43` (IP server Anda)

### 2. USERNAME  
- Name: `USERNAME`
- Value: `root` (SSH username)

### 3. SSH_KEY
- Name: `SSH_KEY`
- Value: Private SSH key untuk akses server
```bash
# Generate SSH key pair jika belum ada:
ssh-keygen -t rsa -b 4096 -C "github-actions@sagawagroup.id"
# Copy private key content untuk SSH_KEY secret
cat ~/.ssh/id_rsa
# Copy public key ke server
ssh-copy-id -i ~/.ssh/id_rsa.pub root@31.97.221.43
```

### 4. PORT (Optional)
- Name: `PORT`
- Value: `22` (default SSH port)

### 5. DISCORD_WEBHOOK (Optional untuk notifikasi)
- Name: `DISCORD_WEBHOOK` 
- Value: Discord webhook URL untuk notifikasi deployment

## Cara Setup:
1. Buka https://github.com/tsubametaa/sagawagroup
2. Settings → Secrets and variables → Actions  
3. New repository secret
4. Masukkan Name dan Value sesuai daftar di atas
5. Save

## Test Secrets:
Setelah setup, commit perubahan kecil dan push untuk trigger workflow.
