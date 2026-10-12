import {
  Component,
  inject,
  NgZone,
  OnDestroy,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FirebaseError } from 'firebase/app';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonInput,
  IonTextarea,
  IonButton,
  IonSegment,
  IonSegmentButton,
  IonLabel
} from '@ionic/angular';

import {
  Receta,
  RecetasRepository
} from '../services/recetas.repository';

import { AuthService } from '../services/auth.service';

import {
  RecetaExterna,
  RecetasApiService
} from '../services/recetas-api.service';

import {
  FavoritosRepository
} from '../services/favoritos.repository';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonInput,
    IonTextarea,
    IonButton,
    IonSegment,
    IonSegmentButton,
    IonLabel
  ]
})
export class HomePage implements OnDestroy {
  private repositorio = inject(RecetasRepository);
  private favoritosRepository = inject(FavoritosRepository);
  private authService = inject(AuthService);
  private recetasApi = inject(RecetasApiService);
  private router = inject(Router);
  private zona = inject(NgZone);
  private detector = inject(ChangeDetectorRef);

  private dejarDeEscuchar?: () => void;
  private dejarDeEscucharFavoritos?: () => void;
  private numeroBusqueda = 0;

  seccion = 'mis-recetas';

  nombre = '';
  ingredientes = '';
  preparacion = '';
  mensaje = '';

  recetas: Receta[] = [];
  editandoId: string | null = null;
  procesando = false;
  cargandoRecetas = true;

  busqueda = '';
  resultados: RecetaExterna[] = [];
  buscando = false;
  mensajeBusqueda = '';

  recetaSeleccionada: RecetaExterna | null = null;

  favoritos: RecetaExterna[] = [];
  cargandoFavoritos = true;
  mensajeFavoritos = '';

  ionViewWillEnter(): void {
    this.detenerEscucha();
    this.limpiarFormulario();
    this.limpiarBusqueda();

    this.seccion = 'mis-recetas';
    this.mensaje = '';
    this.cargandoRecetas = true;
    this.iniciarEscuchaFavoritos();
    this.detector.markForCheck();

    try {
      this.dejarDeEscuchar = this.repositorio.escucharRecetas(
        recetas => {
          this.zona.run(() => {
            this.recetas = recetas;
            this.cargandoRecetas = false;
            this.detector.markForCheck();
          });
        },
        error => {
          this.zona.run(() => {
            this.recetas = [];
            this.cargandoRecetas = false;
            this.mensaje = this.mensajeError(error);
            this.detector.markForCheck();
          });
        }
      );
    } catch (error) {
      this.cargandoRecetas = false;
      this.mensaje = this.mensajeError(error);
      this.detector.markForCheck();
    }
  }

  ionViewWillLeave(): void {
    this.detenerEscucha();
    this.limpiarFormulario();
    this.limpiarBusqueda();
    this.mensaje = '';
  }

  ngOnDestroy(): void {
    this.detenerEscucha();
    this.limpiarBusqueda();
  }

  abrirReceta(receta: RecetaExterna): void {
    this.recetaSeleccionada = receta;
    this.mensajeFavoritos = '';
    this.detector.markForCheck();
  }

  cerrarDetalle(): void {
    this.recetaSeleccionada = null;
    this.detector.markForCheck();
  }

  identificarReceta(
    _indice: number,
    receta: RecetaExterna
  ): string {
    return receta.id;
  }

  async guardarReceta(): Promise<void> {
    if (this.procesando || this.cargandoRecetas) return;

    const datos = {
      nombre: this.nombre.trim(),
      ingredientes: this.ingredientes.trim(),
      preparacion: this.preparacion.trim()
    };

    if (!datos.nombre || !datos.ingredientes || !datos.preparacion) {
      this.mensaje = 'Completa todos los campos.';
      this.detector.markForCheck();
      return;
    }

    const id = this.editandoId;

    this.procesando = true;
    this.mensaje = 'Guardando en la nube...';
    this.detector.markForCheck();

    try {
      if (id !== null) {
        await this.repositorio.actualizarReceta(id, datos);
      } else {
        await this.repositorio.crearReceta(datos);
      }

      this.limpiarFormulario();

      this.mensaje = id !== null
        ? 'Receta actualizada en la nube.'
        : 'Receta guardada en la nube.';
    } catch (error) {
      this.mensaje = this.mensajeError(error);
    } finally {
      this.procesando = false;
      this.detector.markForCheck();
    }
  }

  editarReceta(receta: Receta): void {
    if (this.procesando) return;

    this.editandoId = receta.id;
    this.nombre = receta.nombre;
    this.ingredientes = receta.ingredientes;
    this.preparacion = receta.preparacion;
    this.mensaje = 'Modifica los campos y guarda los cambios.';
    this.detector.markForCheck();
  }

  async eliminarReceta(receta: Receta): Promise<void> {
    if (this.procesando) return;

    if (!window.confirm(`¿Eliminar la receta "${receta.nombre}"?`)) {
      return;
    }

    this.procesando = true;
    this.mensaje = 'Eliminando...';
    this.detector.markForCheck();

    try {
      await this.repositorio.eliminarReceta(receta.id);

      if (this.editandoId === receta.id) {
        this.limpiarFormulario();
      }

      this.mensaje = 'Receta eliminada.';
    } catch (error) {
      this.mensaje = this.mensajeError(error);
    } finally {
      this.procesando = false;
      this.detector.markForCheck();
    }
  }

  cancelarEdicion(): void {
    if (this.procesando) return;

    this.limpiarFormulario();
    this.mensaje = '';
    this.detector.markForCheck();
  }

  async buscarRecetas(): Promise<void> {
    if (this.buscando) return;

    const termino = this.busqueda.trim();

    this.recetaSeleccionada = null;

    if (!termino) {
      this.resultados = [];
      this.mensajeBusqueda = 'Escribe el nombre de una receta.';
      this.detector.markForCheck();
      return;
    }

    const numero = ++this.numeroBusqueda;

    this.buscando = true;
    this.resultados = [];
    this.mensajeBusqueda = 'Buscando recetas...';
    this.mensajeFavoritos = '';
    this.detector.markForCheck();

    try {
      const resultados = await this.recetasApi.buscar(termino);

      if (numero !== this.numeroBusqueda) return;

      this.resultados = resultados;

      this.mensajeBusqueda = resultados.length === 0
        ? 'No se encontraron recetas. Prueba con otro nombre.'
        : `Se encontraron ${resultados.length} recetas.`;
    } catch (error) {
      if (numero !== this.numeroBusqueda) return;

      console.error(error);

      this.mensajeBusqueda =
        error instanceof Error && error.name === 'AbortError'
          ? 'La búsqueda tardó demasiado. Intenta de nuevo.'
          : 'No se pudo realizar la búsqueda. Revisa tu conexión e intenta de nuevo.';
    } finally {
      if (numero === this.numeroBusqueda) {
        this.buscando = false;
        this.detector.markForCheck();
      }
    }
  }

  private iniciarEscuchaFavoritos(): void {
    this.cargandoFavoritos = true;
    this.mensajeFavoritos = '';

    try {
      this.dejarDeEscucharFavoritos =
        this.favoritosRepository.escucharFavoritos(
          favoritos => {
            this.zona.run(() => {
              this.favoritos = favoritos;
              this.cargandoFavoritos = false;
              this.detector.markForCheck();
            });
          },
          error => {
            this.zona.run(() => {
              this.favoritos = [];
              this.cargandoFavoritos = false;
              this.mensajeFavoritos = this.mensajeError(error);
              this.detector.markForCheck();
            });
          }
        );
    } catch (error) {
      this.cargandoFavoritos = false;
      this.mensajeFavoritos = this.mensajeError(error);
      this.detector.markForCheck();
    }
  }

  esFavorito(id: string): boolean {
    return this.favoritos.some(receta => receta.id === id);
  }

  async guardarFavorito(receta: RecetaExterna): Promise<void> {
    if (
      this.procesando ||
      this.cargandoFavoritos ||
      this.esFavorito(receta.id)
    ) {
      return;
    }

    this.procesando = true;
    this.mensajeFavoritos = 'Guardando favorito...';
    this.detector.markForCheck();

    try {
      await this.favoritosRepository.guardarFavorito(receta);
      this.mensajeFavoritos = 'Favorito guardado en la nube.';
    } catch (error) {
      this.mensajeFavoritos = this.mensajeError(error);
    } finally {
      this.procesando = false;
      this.detector.markForCheck();
    }
  }

  async quitarFavorito(receta: RecetaExterna): Promise<void> {
    if (this.procesando) return;

    if (!window.confirm(`¿Quitar "${receta.nombre}" de favoritos?`)) {
      return;
    }

    this.procesando = true;
    this.mensajeFavoritos = 'Quitando favorito...';
    this.detector.markForCheck();

    try {
      await this.favoritosRepository.eliminarFavorito(receta.id);
      this.mensajeFavoritos = 'Receta quitada de favoritos.';
    } catch (error) {
      this.mensajeFavoritos = this.mensajeError(error);
    } finally {
      this.procesando = false;
      this.detector.markForCheck();
    }
  }

  async cerrarSesion(): Promise<void> {
    if (this.procesando) return;

    this.procesando = true;
    this.mensaje = '';
    this.detector.markForCheck();

    try {
      await this.authService.cerrarSesion();

      this.detenerEscucha();
      this.limpiarFormulario();
      this.limpiarBusqueda();

      await this.router.navigateByUrl('/login', {
        replaceUrl: true
      });
    } catch (error) {
      this.mensaje = this.mensajeError(error);
    } finally {
      this.procesando = false;
      this.detector.markForCheck();
    }
  }

  private limpiarFormulario(): void {
    this.nombre = '';
    this.ingredientes = '';
    this.preparacion = '';
    this.editandoId = null;
  }

  private limpiarBusqueda(): void {
    this.numeroBusqueda++;
    this.busqueda = '';
    this.resultados = [];
    this.buscando = false;
    this.mensajeBusqueda = '';
    this.recetaSeleccionada = null;
  }

  private detenerEscucha(): void {
    this.dejarDeEscuchar?.();
    this.dejarDeEscuchar = undefined;

    this.dejarDeEscucharFavoritos?.();
    this.dejarDeEscucharFavoritos = undefined;

    this.recetas = [];
    this.favoritos = [];
    this.mensajeFavoritos = '';
  }

  private mensajeError(error: unknown): string {
    console.error(error);

    if (error instanceof FirebaseError) {
      switch (error.code) {
        case 'permission-denied':
          return 'Acceso rechazado. Revisa las reglas de Firestore y tu sesión.';

        case 'unavailable':
          return 'Servicio no disponible. Revisa tu conexión a internet.';

        case 'not-found':
          return 'La receta ya no existe. Cancela la edición y revisa la lista.';
      }
    }

    return 'No se pudo completar la operación. Revisa la consola del navegador.';
  }
}