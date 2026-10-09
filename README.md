# Mi Recetario

Aplicación móvil desarrollada con Ionic y Angular para administrar
recetas personales, buscar recetas en TheMealDB y guardar favoritas.

## Funciones

- Registro e inicio de sesión con correo y contraseña.
- Creación, edición y eliminación de recetas personales.
- Búsqueda de recetas con ingredientes e instrucciones.
- Favoritos guardados en la nube.
- Datos separados por usuario.
- Secciones de Mis recetas, Explorar y Favoritos.
- Cierre de sesión.

Las recetas externas se muestran en el idioma del proveedor.

## Tecnologías

- Ionic 9.
- Angular 22 con componentes standalone.
- TypeScript.
- Firebase Authentication.
- Cloud Firestore.
- API de TheMealDB.

## Instalación

Instalar Node.js y npm en una versión compatible con Angular 22.

Instalar Ionic CLI:

```bash
npm install -g @ionic/cli
```

Clonar el repositorio:

```bash
git clone https://github.com/MartinArreD/mi-recetario.git
```

Entrar a la carpeta:

```bash
cd mi-recetario
```

Instalar las dependencias:

```bash
npm ci
```

## Configuración de Firebase

Para ejecutar la aplicación con un proyecto Firebase propio:

1. Crear un proyecto en Firebase Console.
2. Registrar una aplicación web.
3. Copiar su configuración en `src/app/firebase.config.ts`,
   conservando las exportaciones `firebaseApp`, `auth` y `db`.
4. Activar Correo electrónico/contraseña en Authentication.
5. Crear una base de datos Cloud Firestore con ID `(default)`.
6. Publicar estas reglas:

```text
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /usuarios/{usuarioId}/recetas/{recetaId} {
      allow read, write: if request.auth != null
                        && request.auth.uid == usuarioId;
    }

    match /usuarios/{usuarioId}/favoritos/{favoritoId} {
      allow read, write: if request.auth != null
                        && request.auth.uid == usuarioId;
    }
  }
}
```

Los documentos se crean automáticamente al guardar recetas o favoritos.

## Ejecución

```bash
ionic serve
```

Abrir `http://localhost:8100`.

Crear una cuenta desde la pantalla de acceso.

## Compilación

```bash
ionic build
```

Los archivos compilados se generan en `www`.

## Organización del código

- `src/app/home`: recetas personales, búsqueda y favoritos.
- `src/app/login`: registro e inicio de sesión.
- `src/app/services/auth.service.ts`: autenticación.
- `src/app/services/recetas.repository.ts`: recetas en Firestore.
- `src/app/services/favoritos.repository.ts`: favoritos en Firestore.
- `src/app/services/recetas-api.service.ts`: consulta a TheMealDB.
- `src/app/app.routes.ts`: navegación y protección de acceso.
- `src/app/firebase.config.ts`: conexión con Firebase.

## Pruebas manuales

1. Registrar una cuenta e iniciar sesión.
2. Intentar acceder con credenciales incorrectas.
3. Crear, editar y eliminar una receta.
4. Recargar y comprobar que los cambios se conservan.
5. Buscar `chicken`, `pasta` o `cake`.
6. Guardar y quitar favoritos; comprobar los cambios al recargar.
7. Entrar con otra cuenta y verificar que sus datos estén separados.
8. Cerrar sesión e intentar acceder a `/home`.

## Créditos

Recetas e imágenes externas proporcionadas por TheMealDB.

Documentación: https://www.themealdb.com/api.php

Se utiliza la clave de prueba para desarrollo y uso educativo.