FROM php:8.2-apache

# Enable Apache mod_rewrite for clean routing
RUN a2enmod rewrite

# Install PDO MySQL and mysqli extensions for database communication
RUN docker-php-ext-install pdo pdo_mysql mysqli

# Copy backend files into Apache's web root
COPY . /var/www/html/

# Set correct permissions
RUN chown -R www-data:www-data /var/www/html

# Expose port 80
EXPOSE 80