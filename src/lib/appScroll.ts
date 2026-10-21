/**
 * Las pantallas con barra de navegación se desplazan dentro de su propio contenedor (.with-app-nav en
 * index.css), no la página: así el navegador del teléfono no esconde su barra de direcciones al hacer
 * scroll ni arrastra la barra del juego. Para volver arriba hay que desplazar ese contenedor.
 */
export const APP_SCROLL_ID = 'app-scroll';

export function scrollAppToTop(): void {
  document.getElementById(APP_SCROLL_ID)?.scrollTo(0, 0);
  window.scrollTo(0, 0);
}
