# Demo de Chat con WebSockets en Red Hat OpenShift

Este proyecto consiste en una aplicación de chat distribuido en tiempo real utilizando el protocolo **WebSockets**. Está diseñado con una arquitectura cliente-servidor y optimizado para ser desplegado en contenedores dentro de la plataforma de nube híbrida **Red Hat OpenShift** (especialmente en entornos sin privilegios de root como el *Developer Sandbox*).

La demo ha sido realizada para la asignatura de **Sistemas Distribuidos** de la **Universidad Politécnica Estatal del Carchi (UPEC)**.

---

## 🏗️ Arquitectura del Proyecto

El proyecto está dividido en dos componentes principales:

1. **Servidor (`/server`):**
   * Desarrollado en **Node.js** utilizando la biblioteca nativa `http` y el paquete `ws` para la gestión de WebSockets.
   * Maneja conexiones simultáneas, asigna identificadores de cliente y retransmite (broadcast) los mensajes a todos los usuarios activos.
   * Cuenta con un endpoint de salud HTTP (`/health`) para monitoreo.

2. **Cliente (`/client`):**
   * Una interfaz web responsiva construida con **HTML5, CSS3 y JavaScript vanilla** (sin dependencias externas).
   * Se conecta al servidor mediante WebSockets nativos de HTML5, muestra contadores de mensajes enviados/recibidos e indica el estado de la conexión en tiempo real.
   * Servido mediante un contenedor **Nginx** optimizado para ejecutarse en entornos seguros sin permisos de superusuario (rootless).

---

## 🛠️ Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:
* [Node.js](https://nodejs.org/) (versión 18 o superior)
* [Git](https://git-scm.com/)
* [Docker](https://www.docker.com/) o [Podman](https://podman.io/) (para ejecución en contenedores localmente)
* El cliente de comandos de OpenShift [oc CLI](https://docs.openshift.com/container-platform/latest/cli_reference/openshift_cli/getting-started-cli.html) (opcional, para despliegue en la nube)

---

## 💻 Instalación y Ejecución Local

### 1. Clonar el repositorio
```bash
git clone https://github.com/0Geremias00/websocket-demo.git
cd websocket-demo
```

### 2. Iniciar el Servidor Backend
Accede a la carpeta del servidor, instala las dependencias y arráncalo:
```bash
cd server
npm install
npm start
```
El servidor WebSocket comenzará a escuchar en el puerto `8080` (`ws://localhost:8080`).

### 3. Iniciar el Cliente Frontend
Puedes abrir el archivo `/client/index.html` directamente en tu navegador web o servirlo usando una extensión de servidor local como *Live Server* en VS Code.

* **Conexión:** En la interfaz de usuario del navegador, escribe `ws://localhost:8080` en la barra de URL y presiona **Conectar**.

---

## ☁️ Despliegue y Configuración en Red Hat OpenShift

Este proyecto está configurado para compilarse y desplegarse en OpenShift de forma automática directamente desde el código fuente de GitHub (estrategia Docker build).

### 1. Iniciar sesión en el Clúster
Obtén tu token de acceso desde la consola web de OpenShift (haciendo clic en tu perfil arriba a la derecha -> *Copy login command*) y ejecútalo en la terminal:
```bash
oc login --token=<TU_TOKEN> --server=<URL_DEL_SERVIDOR_OPENSHIFT>
```

### 2. Desplegar el Servidor (`websocket-server`)
Crea y expone la aplicación del servidor backend utilizando el Dockerfile en el directorio `server`:
```bash
oc new-app https://github.com/0Geremias00/websocket-demo.git --context-dir=server --name=websocket-server
oc expose service/websocket-server
```

### 3. Desplegar el Cliente (`websocket-client`)
Crea y expone la interfaz del cliente utilizando el Dockerfile en el directorio `client`:
```bash
oc new-app https://github.com/0Geremias00/websocket-demo.git --context-dir=client --name=websocket-client
oc expose service/websocket-client
```

### 4. Verificar el Estado del Despliegue
Puedes seguir el progreso de las compilaciones y el estado de los pods con los siguientes comandos:
```bash
# Ver los builds activos
oc get builds

# Ver el estado de los pods (deben estar en "Running")
oc get pods

# Obtener las rutas (URLs públicas) creadas
oc get routes
```

### 🔗 Configuración de Rutas en Producción
Una vez expuestos los servicios, obtendrás dos rutas públicas:
* **Cliente:** `http://websocket-client-oscaringer01-dev.apps.rm1.0a51.p1.openshiftapps.com`
* **Servidor:** `http://websocket-server-oscaringer01-dev.apps.rm1.0a51.p1.openshiftapps.com`

*Nota: Para conectarse al servidor WebSocket seguro desde el cliente expuesto, se debe cambiar la ruta a protocolo seguro `wss://` (ej. `wss://websocket-server-oscaringer01-dev.apps.rm1.0a51.p1.openshiftapps.com`).*

---

## 🐳 Estructura de Contenedores (Dockerfiles)

### Servidor (`server/Dockerfile`)
Utiliza una imagen ligera de Node.js Alpine, copia los archivos necesarios, instala dependencias de producción y expone el puerto estándar `8080`.
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8080
CMD ["npm", "start"]
```

### Cliente (`client/Dockerfile`)
Utiliza Nginx Alpine. Configura el servidor para escuchar en el puerto `8080` (en lugar del `80` por defecto, ya que puertos menores a 1024 requieren permisos root) y otorga permisos de escritura en directorios temporales de Nginx para cumplir con las políticas de seguridad de OpenShift (SCC).
```dockerfile
FROM nginx:alpine
COPY index.html /usr/share/nginx/html/
RUN sed -i 's/listen  *80;/listen 8080;/g' /etc/nginx/conf.d/default.conf
RUN mkdir -p /var/cache/nginx /var/run /var/log/nginx && \
    chmod -R 777 /var/cache/nginx /var/run /var/log/nginx /etc/nginx/conf.d /usr/share/nginx/html
EXPOSE 8080
USER nginx
```
