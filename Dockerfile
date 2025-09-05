FROM ubuntu:24.04
WORKDIR /var/www/html
COPY . /var/www/html
RUN apt update \
    && apt install -y openssh-server apache2 php8.3-curl php8.3 php8.3-gd php8.3-bcmath php8.3-mbstring php8.3-mongodb php8.3-xml \
    && php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');" \
    && php composer-setup.php --install-dir=/usr/bin --filename=composer \
    && chmod +x /usr/bin/composer \
    && composer install \
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
