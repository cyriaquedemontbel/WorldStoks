import React from 'react';

export const AboutPage = () => (
  <section className="max-w-4xl mx-auto p-8 bg-gray-50 rounded-2xl shadow-lg">
    <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">Bienvenue sur WorldStocks</h2>
    {/* Section Comment ça marche */}
    <div className="mb-12">
      <h3 className="text-2xl font-semibold text-gray-700 mb-6">Comment ça marche ?</h3>
      
      <div className="bg-white p-6 rounded-xl shadow-md mb-4">
        <p className="text-gray-700 leading-relaxed">
          WorldStocks est une plateforme de simulation de marché boursier unique où les "actions" reflètent la popularité et la performance d'entités du quotidien : équipes sportives, personnalités publiques, tendances culturelles et concepts innovants.
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md mb-4">
        <p className="text-gray-700 leading-relaxed">
          Chaque décision que vous prenez influence le marché virtuel et vous permet de tester vos stratégies en toute sécurité. Les prix fluctuent en temps réel en fonction des événements du monde réel et de l'activité de trading sur la plateforme.
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md">
        <p className="text-gray-700 leading-relaxed">
          Achetez bas, vendez haut, suivez vos performances et découvrez les mécanismes du marché sans risquer de perdre de l’argent réel. C’est un terrain de jeu pour les investisseurs curieux et les passionnés de finance.
        </p>
      </div>
    </div>
    {/* Section Qui nous sommes */}
    <div className="mb-12">
      <h3 className="text-2xl font-semibold text-gray-700 mb-6">Qui nous sommes ?</h3>

      <div className="bg-white p-6 rounded-xl shadow-md mb-4">
        <p className="text-gray-700 leading-relaxed">
          Nous sommes une équipe passionnée par la finance, la technologie et la culture populaire. Notre mission est de rendre le marché boursier plus accessible, interactif et ludique pour tous, que vous soyez un investisseur expérimenté ou un curieux débutant.
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md mb-4">
        <p className="text-gray-700 leading-relaxed">
          Avec WorldStocks, nous voulons créer une communauté d'apprenants et de traders virtuels, où chacun peut expérimenter, apprendre et se divertir en même temps. Nous croyons que comprendre la finance ne doit pas être intimidant : cela peut être amusant, instructif et social.
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md">
        <p className="text-gray-700 leading-relaxed">
          Rejoignez-nous pour explorer le monde fascinant des marchés financiers à votre rythme et développer vos compétences dans un environnement sûr et ludique.
        </p>
      </div>
    </div>
  </section>
);
