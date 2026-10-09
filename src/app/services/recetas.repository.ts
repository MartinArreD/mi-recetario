import { Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  FirestoreError,
  onSnapshot,
  Unsubscribe,
  updateDoc
} from 'firebase/firestore';
import { auth, db } from '../firebase.config';

export interface DatosReceta {
  nombre: string;
  ingredientes: string;
  preparacion: string;
}

export interface Receta extends DatosReceta {
  id: string;
}

@Injectable({ providedIn: 'root' })
export class RecetasRepository {
  private coleccionDelUsuario() {
    const usuario = auth.currentUser;

    if (!usuario) {
      throw new Error('Debes iniciar sesión para acceder a tus recetas.');
    }

    return collection(db, 'usuarios', usuario.uid, 'recetas');
  }

  escucharRecetas(
    actualizar: (recetas: Receta[]) => void,
    manejarError: (error: FirestoreError) => void
  ): Unsubscribe {
    return onSnapshot(
      this.coleccionDelUsuario(),
      snapshot => {
        const recetas: Receta[] = snapshot.docs.map(documento => {
          const datos = documento.data();

          return {
            id: documento.id,
            nombre: datos['nombre'],
            ingredientes: datos['ingredientes'],
            preparacion: datos['preparacion']
          };
        });

        recetas.sort((a, b) =>
          a.nombre.localeCompare(b.nombre, 'es')
        );

        actualizar(recetas);
      },
      manejarError
    );
  }

  crearReceta(datos: DatosReceta) {
    return addDoc(this.coleccionDelUsuario(), datos);
  }

  actualizarReceta(id: string, datos: DatosReceta) {
    const referencia = doc(this.coleccionDelUsuario(), id);

    return updateDoc(referencia, {
      nombre: datos.nombre,
      ingredientes: datos.ingredientes,
      preparacion: datos.preparacion
    });
  }

  eliminarReceta(id: string) {
    const referencia = doc(this.coleccionDelUsuario(), id);
    return deleteDoc(referencia);
  }
}