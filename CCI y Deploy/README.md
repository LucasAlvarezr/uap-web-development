Mi Biblioteca de Reseñas
Este proyecto es una aplicación web de Next.js para buscar libros y dejar reseñas. La aplicación utiliza la API de Google Books para la búsqueda y Firebase/Firestore como base de datos para almacenar y gestionar las reseñas en tiempo real.

Cómo Hacer el Deploy Local
Para ejecutar este proyecto en tu entorno de desarrollo, sigue los siguientes pasos:

Clona el repositorio:

Bash

git clone https://github.com/tu-usuario/tu-repositorio.git
cd tu-repositorio
Instala las dependencias:

Bash

npm install
Configura las variables de entorno:
Crea un archivo llamado .env.local en la raíz del proyecto y añade tus credenciales de Firebase.

Inicia el servidor de desarrollo:

Bash

npm run dev
La aplicación estará disponible en http://localhost:3000.

Variables de Entorno Necesarias
Para que la aplicación se conecte con Firebase, debes configurar las siguientes variables de entorno. Estas variables deben estar en un archivo .env.local en tu entorno de desarrollo y en la configuración de Vercel para el despliegue de producción.

NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=mi-app-de-libros.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=mi-app-de-libros
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=mi-app-de-libros.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=1:...
Cómo Funcionan los GitHub Actions
Hemos implementado un pipeline de Integración y Despliegue Continuos (CI/CD) usando GitHub Actions para automatizar el desarrollo.

CI Build (ci-build.yml): Se ejecuta en cada pull request para verificar que el código se compile correctamente. Esto previene que errores de compilación lleguen a la rama principal.

CI Tests (ci-tests.yml): Se activa en cada pull request para ejecutar los tests unitarios. Si un test falla, el PR no se puede fusionar, asegurando que las nuevas características no rompan las existentes.

Docker Publish (docker-publish.yml): Este flujo de trabajo se activa automáticamente cuando se fusionan cambios a la rama principal. Construye una imagen de Docker de la aplicación y la publica en el Registro de Contenedores de GitHub (GHCR).

Instrucciones para Ejecutar con Docker
Si prefieres usar Docker, sigue estos pasos para construir la imagen y ejecutar el contenedor:

Construye la imagen de Docker:

Bash

docker build -t mi-app-de-libros .
Este comando utiliza el Dockerfile en la raíz del proyecto para crear la imagen.

Ejecuta el contenedor:

Bash

docker run -p 3000:3000 mi-app-de-libros
Esto ejecuta la imagen en un contenedor y mapea el puerto 3000 del contenedor al puerto 3000 de tu máquina local.
