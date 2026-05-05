FROM nginx:alpine

# Copiar el html al directorio de nginx
COPY index.html /usr/share/nginx/html/

# Cambiar puerto de 80 a 8080
RUN sed -i 's/listen  *80;/listen 8080;/g' /etc/nginx/conf.d/default.conf

# Crear carpetas y dar permisos 777 para OpenShift (ejecución sin root)
RUN mkdir -p /var/cache/nginx /var/run /var/log/nginx && \
    chmod -R 777 /var/cache/nginx /var/run /var/log/nginx /etc/nginx/conf.d /usr/share/nginx/html

EXPOSE 8080

# Cambiar al usuario no privilegiado (aunque en OpenShift se asigna un UID aleatorio)
USER nginx
