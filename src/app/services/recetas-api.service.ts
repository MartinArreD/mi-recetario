import { Injectable } from '@angular/core';

export interface RecetaExterna {
  id: string;
  nombre: string;
  imagen: string;
  ingredientes: string;
  preparacion: string;
}

interface RespuestaAPI {
  meals: Record<string, string | null>[] | null;
}

@Injectable({ providedIn: 'root' })
export class RecetasApiService {
  private readonly url =
    'https://www.themealdb.com/api/json/v1/1';

  async buscar(texto: string): Promise<RecetaExterna[]> {
    const termino = texto.trim();

    if (!termino) return [];

    const controlador = new AbortController();
    const temporizador = setTimeout(
      () => controlador.abort(),
      15000
    );

    try {
      const respuesta = await fetch(
        `${this.url}/search.php?s=${encodeURIComponent(termino)}`,
        { signal: controlador.signal }
      );

      if (!respuesta.ok) {
        throw new Error('No se pudo consultar el servicio de recetas.');
      }

      const datos: RespuestaAPI = await respuesta.json();

      return (datos.meals ?? []).map(receta => {
        const ingredientes: string[] = [];

        for (let i = 1; i <= 20; i++) {
          const ingrediente =
            receta[`strIngredient${i}`]?.trim();

          const cantidad =
            receta[`strMeasure${i}`]?.trim();

          if (ingrediente) {
            ingredientes.push(
              [cantidad, ingrediente].filter(Boolean).join(' ')
            );
          }
        }

        return {
          id: receta['idMeal'] ?? '',
          nombre: receta['strMeal'] ?? 'Sin nombre',
          imagen: receta['strMealThumb'] ?? '',
          ingredientes: ingredientes.join('\n'),
          preparacion:
            receta['strInstructions'] ?? 'Sin instrucciones disponibles'
        };
      });
    } finally {
      clearTimeout(temporizador);
    }
  }
}