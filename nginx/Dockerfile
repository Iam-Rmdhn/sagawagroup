FROM nginx:1.25-alpine

# Install security updates and required packages
RUN apk update && apk upgrade && \
    apk add --no-cache openssl curl && \
    rm -rf /var/cache/apk/*

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create directories for SSL
RUN mkdir -p /etc/nginx/ssl

# Set proper permissions
RUN chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chmod 755 /etc/nginx/ssl

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]