import { CorpusenseRoutes } from '@/hooks/useAppNavigation';
import { Link } from 'react-router-dom';

const Welcome = () => {
  return (
    <section className='justify-star flex h-full w-full flex-col items-center space-y-4'>
      <img src='./images/logo.png' className='w-1/2'></img>
      <div className='space-y-2'>
        <h1 className='font-bold'>Bienvenue sur Corpusense</h1>
        <p>
          Corpusense est une application web pensée pour les chercheurs et professionnels souhaitant
          exploiter des documents anciens numérisés de manière simple et efficace.
        </p>
        <h2>Avec Corpusense, vous pouvez :</h2>
        <ul>
          <li>
            <strong className='italic'>Importez des documents</strong> et sélectionnez les pages qui
            vous intéressent pour créer vos corpus personnalisés.
          </li>
          <li>
            <strong className='italic'>Traitez vos corpus</strong> grâce à des fonctionnalités
            telles que la reconnaissance de texte (OCR) et l’extraction de données structurées.
          </li>
          <li>
            <strong className='italic'>Analysez et exploitez vos documents</strong> sans avoir
            besoin de compétences techniques particulières.
          </li>
        </ul>
        <p>
          Corpusense transforme vos documents numérisés en ressources structurées et exploitables,
          tout en restant intuitif et accessible. Commencez dès maintenant à organiser et analyser
          vos sources historiques avec facilité.
        </p>
      </div>
      <div className='w-full space-y-2'>
        <h2 className='font-bold'>Par où commencer ?</h2>
        <p>
          La première étape consiste à sélectionner un document (sur Gallica par exemple). Si vous
          n&apos;avez pas encore de document, vous pouvez en choisir un dans la liste ci-dessous :
        </p>
        <ul className='list-disc pl-5'>
          <li>
            <Link
              className='font-medium text-blue-600 hover:underline dark:text-blue-500'
              to={`/${CorpusenseRoutes.MANIFEST}?manifestId=https://gallica.bnf.fr/iiif/ark:/12148/bd6t543024772/manifest.json`}
            >
              Annuaire général de la cinématographie et des industries qui s&apos;y rattachent
            </Link>
          </li>
          <li>
            <Link
              className='font-medium text-blue-600 hover:underline dark:text-blue-500'
              to={`/${CorpusenseRoutes.MANIFEST}?manifestId=https://gallica.bnf.fr/iiif/ark:/12148/bpt6k12410870/manifest.json`}
            >
              Catalogue d&apos;une jolie collection : objets de la Perse, armes, armures...
            </Link>
          </li>
        </ul>
      </div>
    </section>
  );
};

export default Welcome;
