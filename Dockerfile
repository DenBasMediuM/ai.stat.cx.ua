FROM php:8.3.25-apache
WORKDIR /var/www/html
COPY . /var/www/html
RUN apt update \
  && apt install -y openssh-server git zip unzip \
  && pecl install mongodb-2.1.1  && docker-php-ext-enable mongodb \
  && php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');" \
  && php composer-setup.php --install-dir=/usr/bin --filename=composer \
  && chmod +x /usr/bin/composer \
  && composer install \
  && sed -i '/DocumentRoot/a DirectoryIndex index.php index.html' /etc/apache2/sites-enabled/000-default.conf \
  && echo 'PassEnv CONNECTION_STRING DATABASE OPENAI_API_KEY' > /etc/apache2/conf-enabled/expose-env.conf \
  && sed -i '/DocumentRoot/a DirectoryIndex index.php index.html' /etc/apache2/sites-enabled/000-default.conf

COPY sshd_config /etc/ssh
RUN chmod +x /var/www/html/entrypoint.sh

# Start and enable SSH
RUN echo "root:Docker!" | chpasswd \
                     && cd /etc/ssh/ \
                     && ssh-keygen -A
EXPOSE 2222 80
ENTRYPOINT ["sh", "/var/www/html/entrypoint.sh"]
