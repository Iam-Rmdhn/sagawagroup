#!/bin/bash

# GitHub Secrets Setup Script for Sagawa Group CI/CD
# This script helps you set up the required secrets for GitHub Actions

echo "=========================================="
echo "  GitHub Secrets Setup for Sagawa Group"
echo "=========================================="
echo

echo "You need to add the following secrets to your GitHub repository:"
echo "Go to: https://github.com/tsubametaa/sagawagroup/settings/secrets/actions"
echo

echo "Required Secrets:"
echo "=================="

echo
echo "🔧 SERVER CONNECTION:"
echo "HOST                    = 31.97.221.43"
echo "USERNAME               = root"
echo "SSH_KEY                = b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACA7iC9j6BCR1KZnQYlDOn5NCrG8HGR9JkKjcW4KVG4gJgAAAJgAKrwnACq8
JwAAAAtzc2gtZWQyNTUxOQAAACA7iC9j6BCR1KZnQYlDOn5NCrG8HGR9JkKjcW4KVG4gJg
AAAEAaS8rV8nx/YYLLC1F5XYC56Qr6KC5ar+J4Hg6zIafZQjuIL2PoEJHUpmdBiUM6fk0K
sbwcZH0mQqNxbgpUbiAmAAAADnJvb3RAc3J2OTY1MjU1AQIDBAUGBw==
"
echo "PORT                   = 22"

echo
echo "🌐 DOMAIN & SSL:"
echo "DOMAIN                 = sagawagroup.id"
echo "WWW_DOMAIN            = www.sagawagroup.id"
echo "EMAIL                 = admin@sagawagroup.id"

echo
echo "🔐 APPLICATION SECRETS:"
echo "JWT_SECRET            = $(openssl rand -hex 64)"
echo "SESSION_SECRET        = $(openssl rand -hex 32)"

echo
echo "📊 DATABASE (Astra DB):"
echo "ASTRA_DB_APPLICATION_TOKEN = AstraCS:GcAHBNyZJEGUYJkYkEiJRXbr:c5a57f749b2bd125acb835fa98b1bcf8af879b8dad1876778696b5a2788d4407"
echo "ASTRA_DB_API_ENDPOINT     = https://a1971aa5-5930-4854-82ef-747bd405cc0a-us-east-2.apps.astra.datastax.com"

echo
echo "📧 EMAIL CONFIGURATION:"
echo "EMAIL_USER            = admin@sagawagroup.id"
echo "EMAIL_PASS            = SagawaGroup222!"

echo
echo "🔔 NOTIFICATIONS (Optional):"
echo "DISCORD_WEBHOOK       = Your Discord webhook URL for notifications"
echo "SLACK_WEBHOOK         = Your Slack webhook URL for notifications"

echo
echo "📱 MONITORING (Optional):"
echo "SENTRY_DSN            = Your Sentry DSN for error tracking"
echo "NEW_RELIC_LICENSE_KEY = Your New Relic license key"

echo
echo "=========================================="
echo "  How to add secrets to GitHub:"
echo "=========================================="
echo "1. Go to your repository on GitHub"
echo "2. Click Settings tab"
echo "3. In the left sidebar, click 'Secrets and variables'"
echo "4. Click 'Actions'"
echo "5. Click 'New repository secret'"
echo "6. Add each secret from the list above"
echo

echo "=========================================="
echo "  Generate SSH Key for GitHub Actions:"
echo "=========================================="
echo "Run this command on your server to generate SSH key:"
echo "ssh-keygen -t ed25519 -f ~/.ssh/github_actions -N ''"
echo
echo "Then add the public key to authorized_keys:"
echo "cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys"
echo
echo "And copy the private key content to GitHub Secrets as SSH_KEY:"
echo "cat ~/.ssh/github_actions"
echo

echo "=========================================="
echo "  Test SSH Connection:"
echo "=========================================="
echo "Test the connection with:"
echo "ssh -i ~/.ssh/github_actions root@31.97.221.43"
echo

echo "=========================================="
echo "  Environment File Setup:"
echo "=========================================="
echo "Don't forget to create .env file on your server:"
echo "cp /root/sagawagroup/.env.template /root/sagawagroup/.env"
echo "nano /root/sagawagroup/.env  # Edit with your actual values"
echo

echo "✅ Setup complete! Your CI/CD pipeline should work after adding these secrets."
