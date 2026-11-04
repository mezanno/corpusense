// Génère les fixtures image des tests E2E (Q9) : e2e/fixtures/image.jpg et
// e2e/fixtures/info.json (réponse IIIF Image 2.0 « single-tile » cohérente avec
// les dimensions de l'image, servie en interception au visualiseur OSD).
//
// Régénérer : `node scripts/generate-e2e-image.mjs` (à relancer seulement si l'on
// change les dimensions ou la composition ; les binaires versionnés sont la
// référence).
//
// Déterminisme : géométrie pure, aucune aléa, aucun texte (le rendu des polices
// varie selon les plateformes) ; l'encodage JPEG dépend uniquement de la version
// épinglée de `canvas` (package-lock.json). Le contenu exact importe peu : ce qui
// compte est que les dimensions (1024×768) et les aplats soient figés, pour que
// le dessin des annotations rectangulaires dans le visualiseur OSD soit
// reproductible (scénario S3).
import { createCanvas } from 'canvas';
import { writeFileSync } from 'node:fs';
import path from 'node:path';

const IMAGE_WIDTH = 1024;
const IMAGE_HEIGHT = 768;

const canvas = createCanvas(IMAGE_WIDTH, IMAGE_HEIGHT);
const ctx = canvas.getContext('2d');

// Fond « papier » aplati.
ctx.fillStyle = '#f2efe6';
ctx.fillRect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT);

// Cadre de contrôle (repère de cadrage).
ctx.strokeStyle = '#1b1b1b';
ctx.lineWidth = 8;
ctx.strokeRect(4, 4, IMAGE_WIDTH - 8, IMAGE_HEIGHT - 8);

// Bandes de contrôle horizontales : trois aplats de couleurs franches,
// séparés par des intervalles réguliers (référence de couleurs et d'échelle).
const bands = [
  { y: 128, color: '#1f3b8f' },
  { y: 320, color: '#a3232f' },
  { y: 512, color: '#2f7d3a' },
];
for (const band of bands) {
  ctx.fillStyle = band.color;
  ctx.fillRect(128, band.y, IMAGE_WIDTH - 256, 128);
}

// Équerres noires aux quatre coins (repères de géométrie pour l'annotation).
const square = 48;
ctx.fillStyle = '#1b1b1b';
for (const [x, y] of [
  [32, 32],
  [IMAGE_WIDTH - 32 - square, 32],
  [32, IMAGE_HEIGHT - 32 - square],
  [IMAGE_WIDTH - 32 - square, IMAGE_HEIGHT - 32 - square],
]) {
  ctx.fillRect(x, y, square, square);
}

// Réticules de contrôle en haut et à gauche (échelle 64 px).
ctx.fillStyle = '#1b1b1b';
for (let x = 192; x < IMAGE_WIDTH - 128; x += 64) {
  ctx.fillRect(x, 32, 8, 64);
}
for (let y = 192; y < IMAGE_HEIGHT - 128; y += 64) {
  ctx.fillRect(32, y, 64, 8);
}

const out = path.resolve('e2e/fixtures/image.jpg');
writeFileSync(out, canvas.toBuffer('image/jpeg', { quality: 90 }));
console.log(`Fixture écrite : ${out} (${String(IMAGE_WIDTH)}×${String(IMAGE_HEIGHT)})`);

// Réponse Image API 2.0 « single-tile » : une seule tuile couvrant toute l'image,
// profil level2. C'est le format que le visualiseur OSD demande quand le manifest
// référence un service IIIF : `{service.id}/info.json` (src/hooks/data/sources/
// useTileSource.tsx). Les dimensions MUST rester synchronisées avec l'image.
const info = {
  '@context': 'http://iiif.io/api/image/2/context.json',
  '@id': 'https://iiif.e2e.test/image',
  protocol: 'http://iiif.io/api/image',
  width: IMAGE_WIDTH,
  height: IMAGE_HEIGHT,
  tiles: [{ width: IMAGE_WIDTH, height: IMAGE_HEIGHT, scaleFactors: [1] }],
  profile: ['http://iiif.io/api/image/2/profiles/level2.json'],
};
const infoOut = path.resolve('e2e/fixtures/info.json');
writeFileSync(infoOut, `${JSON.stringify(info, null, 2)}\n`);
console.log(`Fixture écrite : ${infoOut} (single-tile)`);
