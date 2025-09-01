# CI/CD Setup untuk Sagawa Group

## 🚀 Fitur CI/CD

### Continuous Integration (CI)
- ✅ **Automated Testing**: Frontend dan API ditest otomatis
- ✅ **Build Validation**: Memastikan build berhasil sebelum deploy
- ✅ **Security Scanning**: Audit dependencies untuk keamanan
- ✅ **Code Quality**: Linting dan type checking
- ✅ **Artifact Management**: Menyimpan build results untuk deployment

### Continuous Deployment (CD)
- 🚀 **Zero-Downtime Deployment**: Deploy tanpa mengganggu user
- 🔄 **Automatic Rollback**: Rollback otomatis jika deployment gagal
- 🛡️ **Health Checks**: Verifikasi aplikasi berjalan dengan baik
- 📊 **Real-time Monitoring**: Notifikasi status deployment
- 🔧 **Multi-Environment Support**: Production dan staging

## 📁 Struktur Files

```
.github/
├── workflows/
│   ├── ci.yml           # Continuous Integration
│   └── deploy.yml       # Continuous Deployment
├── health-check.sh      # Script health check
├── setup-github-secrets.sh  # Setup secrets helper
└── .env.template        # Environment template
```

## ⚙️ Setup Instructions

### 1. GitHub Secrets Configuration

Jalankan script setup untuk melihat secrets yang diperlukan:
```bash
chmod +x setup-github-secrets.sh
./setup-github-secrets.sh
```

### 2. Required GitHub Secrets

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `HOST` | Server IP address | `203.194.112.30` |
| `USERNAME` | SSH username | `root` |
| `SSH_KEY` | Private SSH key | `-----BEGIN OPENSSH PRIVATE KEY-----` |
| `PORT` | SSH port | `22` |
| `DOMAIN` | Main domain | `sagawagroup.id` |
| `EMAIL` | Admin email | `admin@sagawagroup.id` |
| `JWT_SECRET` | JWT secret key | `generated-64-char-string` |
| `ASTRA_DB_APPLICATION_TOKEN` | Astra DB token | `AstraCS:...` |
| `ASTRA_DB_API_ENDPOINT` | Astra DB endpoint | `https://...` |

### 3. SSH Key Generation

```bash
# Generate SSH key for GitHub Actions
ssh-keygen -t ed25519 -f ~/.ssh/github_actions -N ""

# Add public key to authorized_keys
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys

# Copy private key content to GitHub Secrets
cat ~/.ssh/github_actions
```

### 4. Environment File Setup

```bash
# Copy template
cp .env.template .env

# Edit with your actual values
nano .env
```

## 🔄 Workflow Process

### CI Pipeline (ci.yml)
1. **Trigger**: Push ke `main` atau `develop`, atau Pull Request ke `main`
2. **Frontend Testing**:
   - Install dependencies dengan cache
   - Run linting dan testing
   - Build frontend
   - Validate build output
3. **API Testing**:
   - Install dependencies dengan cache
   - Type checking
   - Run API tests
   - Validate API structure
4. **Security Scanning**:
   - Audit dependencies
   - Check for vulnerabilities
5. **Production Build**:
   - Create deployment package
   - Upload artifacts

### CD Pipeline (deploy.yml)
1. **Trigger**: Setelah CI berhasil pada branch `main`
2. **Pre-deployment Checks**:
   - Server connectivity check
   - Generate deployment ID
3. **Deployment**:
   - Download build artifacts
   - Deploy to server via SSH
   - Run deployment script
4. **Health Checks**:
   - PM2 process status
   - API health endpoint
   - Website accessibility
   - SSL certificate validity
5. **Post-deployment**:
   - Send notifications
   - Cleanup old artifacts

## 🎯 Deployment Options

### Manual Deployment
```bash
# Full deployment
./deploy-production.sh

# Frontend only
./deploy-production.sh --frontend-only

# API only
./deploy-production.sh --api-only

# CI/CD mode
./deploy-production.sh --ci-mode --non-interactive
```

### GitHub Actions Deployment
- **Automatic**: Push ke `main` branch
- **Manual**: Dispatch workflow di GitHub Actions tab

## 🔍 Monitoring & Health Checks

### Automated Health Checks
```bash
# Run health check
chmod +x health-check.sh
./health-check.sh
```

### Checks Performed:
- ✅ PM2 processes status
- ✅ API health endpoint response
- ✅ Nginx service status
- ✅ Website accessibility
- ✅ SSL certificate validity
- ✅ Disk space usage
- ✅ Memory usage

## 📊 Notifications

### Discord Integration
Set `DISCORD_WEBHOOK` secret untuk notifikasi deployment:
- 🚀 Deployment started
- ✅ Deployment successful
- ❌ Deployment failed

### Slack Integration (Optional)
Set `SLACK_WEBHOOK` secret untuk notifikasi Slack.

## 🛠️ Troubleshooting

### Common Issues

#### 1. SSH Connection Failed
```bash
# Test SSH connection
ssh -i ~/.ssh/github_actions root@YOUR_SERVER_IP

# Check SSH key permissions
chmod 600 ~/.ssh/github_actions
```

#### 2. Build Failed
```bash
# Check build logs in GitHub Actions
# Verify dependencies in package.json
# Check for TypeScript errors
```

#### 3. Health Check Failed
```bash
# Run manual health check
./health-check.sh

# Check PM2 status
pm2 status

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

#### 4. SSL Issues
```bash
# Check SSL certificate
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Test SSL
openssl s_client -servername www.sagawagroup.id -connect www.sagawagroup.id:443
```

## 📈 Best Practices

### 1. Branch Strategy
- `main` → Production deployment
- `develop` → Staging deployment (optional)
- `feature/*` → Development branches

### 2. Commit Messages
- Use conventional commits: `feat:`, `fix:`, `docs:`, etc.
- Descriptive messages for better tracking

### 3. Environment Management
- Different secrets per environment
- Validate environment variables
- Use secure secret storage

### 4. Monitoring
- Set up health check alerts
- Monitor deployment logs
- Track performance metrics

## 🔒 Security

### 1. Secrets Management
- Rotate secrets regularly
- Use strong passwords
- Limit access to secrets

### 2. SSH Security
- Use key-based authentication only
- Disable password authentication
- Regular security updates

### 3. Application Security
- Keep dependencies updated
- Regular security audits
- Use HTTPS everywhere

## 🚀 Advanced Features

### Blue-Green Deployment (Optional)
```bash
# Enable blue-green deployment
./deploy-production.sh --strategy=blue-green
```

### Staging Environment (Optional)
```bash
# Deploy to staging
./deploy-production.sh --environment=staging
```

### Rollback
```bash
# Automatic rollback on failure
# Or manual rollback
./deploy-production.sh --rollback
```

---

## 📞 Support

Jika ada masalah dengan CI/CD setup:
1. Check GitHub Actions logs
2. Run health check script
3. Check deployment logs: `/var/log/sagawagroup-deploy.log`
4. Contact system administrator

**Happy Deploying! 🎉**
