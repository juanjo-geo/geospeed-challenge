import { Config } from '@remotion/cli/config';

// Three.js necesita WebGL con GPU en el render sin ventana (Windows: ANGLE)
Config.setChromiumOpenGlRenderer('angle');
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setEntryPoint('./src/index.ts');
