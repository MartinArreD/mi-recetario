import { Injectable } from '@angular/core';
import {
  collection,
  deleteDoc,
  doc,
  FirestoreError,
  onSnapshot,
  setDoc,
  Unsubscribe
} from 'firebase/firestore';
import { auth, db } from '../firebase.config';
import { RecetaExterna } from './recetas-api.service';

@Injectable({ providedIn: 'root' })
export class FavoritosRepository {
  private coleccionDelUsuario() {
    const usuario = auth.currentUser;

    if (!usuario) {
      throw new Error('Debes iniciar sesión para acceder a tus favoritos.');
    }

    return collection(db, 'usuarios', usuario.uid, 'favoritos');
  }

  escucharFavoritos(
    actualizar: (favoritos: RecetaExterna[]) => void,
    manejarError: (error: FirestoreError) => void
  ): Unsubscribe {
    return onSnapshot(
      this.coleccionDelUsuario(),
      snapshot => {
        const favoritos: RecetaExterna[] =
          snapshot.docs.map(documento => {
            const datos = documento.data();

            return {
              id: documento.id,
              nombre: datos['nombre'],
              imagen: datos['imagen'],
              ingredientes: datos['ingredientes'],
              preparacion: datos['preparacion']
            };
          });

        favoritos.sort((a, b) =>
          a.nombre.localeCompare(b.nombre, 'es')
        );

        actualizar(favoritos);
      },
      manejarError
    );
  }

  guardarFavorito(receta: RecetaExterna) {
    if (!receta.id || receta.id.includes('/')) {
      throw new Error('La receta no tiene un identificador válido.');
    }

    const referencia = doc(
      this.coleccionDelUsuario(),
      receta.id
    );

    return setDoc(referencia, {
      nombre: receta.nombre,
      imagen: receta.imagen,
      ingredientes: receta.ingredientes,
      preparacion: receta.preparacion
    });
  }

  eliminarFavorito(id: string) {
    const referencia = doc(this.coleccionDelUsuario(), id);
    return deleteDoc(referencia);
  }
}