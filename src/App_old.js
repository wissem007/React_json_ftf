import React, { useState, useEffect } from 'react';
import { Search, Users, Trophy, Calendar, MapPin, Hash, RefreshCw, AlertCircle } from 'lucide-react';

const App = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('TOUS');
  const [playersData, setPlayersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fonction pour charger les données JSON
  const loadPlayersData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/data/players.json');
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      setPlayersData(data);
      setLastUpdated(new Date().toLocaleString('fr-FR'));
    } catch (err) {
      setError(`Erreur lors du chargement des données: ${err.message}`);
      console.error('Erreur de chargement:', err);
    } finally {
      setLoading(false);
    }
  };

  // Charger les données au démarrage
  useEffect(() => {
    loadPlayersData();
  }, []);

  // Fonction pour calculer l'âge
  const calculateAge = (dateNaissance) => {
    const today = new Date();
    const birthDate = new Date(dateNaissance);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Formatage de la date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  // Filtrage des joueurs
  const filteredPlayers = playersData.filter(player => {
    const matchesSearch = 
      player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.playerNum.toString().includes(searchTerm);
    
    const matchesCategory = filterCategory === 'TOUS' || player.categorie === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Obtenir les catégories uniques
  const categories = ['TOUS', ...new Set(playersData.map(player => player.categorie))];

  // Composant de chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin mx-auto mb-4 text-blue-500" size={48} />
          <h2 className="text-xl font-semibold text-gray-700">Chargement des données...</h2>
        </div>
      </div>
    );
  }

  // Composant d'erreur
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur de chargement</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadPlayersData}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 mx-auto"
          >
            <RefreshCw size={16} />
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b-4 border-red-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-red-500 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl">
                ASG
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Avenir Sportif De Gabes</h1>
                <p className="text-gray-600 flex items-center gap-2">
                  <Trophy size={16} />
                  Ligue I - Équipe Professionnelle
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-red-100 px-4 py-2 rounded-lg mb-2">
                <p className="text-red-800 font-semibold">{playersData.length} Joueurs</p>
              </div>
              <button
                onClick={loadPlayersData}
                className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded-lg flex items-center gap-2 text-sm"
                title="Actualiser les données"
              >
                <RefreshCw size={14} />
                Actualiser
              </button>
            </div>
          </div>
          
          {/* Indicateur de dernière mise à jour */}
          {lastUpdated && (
            <div className="mt-4 text-sm text-gray-500">
              Dernière mise à jour : {lastUpdated}
            </div>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Barre de recherche et filtres */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Rechercher un joueur (nom, prénom, numéro...)"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Grille des joueurs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPlayers.map((player, index) => (
            <div key={`${player.numLicence}-${index}`} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
              {/* Header de la carte */}
              <div className="bg-gradient-to-r from-red-500 to-red-600 p-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      {player.photo ? (
                        <img src={player.photo} alt={`${player.name} ${player.lastName}`} className="w-10 h-10 rounded-full" />
                      ) : (
                        <Users size={24} />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{player.name}</h3>
                      <p className="text-red-100">{player.lastName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="bg-white bg-opacity-20 rounded-lg px-2 py-1">
                      <span className="text-xl font-bold">#{player.playerNum}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Corps de la carte */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    player.categorie === 'ELITE' 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {player.categorie}
                  </span>
                  <span className="text-gray-500 text-sm">{calculateAge(player.dateNaissance)} ans</span>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Hash size={14} />
                    <span>Licence: {player.numLicence}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={14} />
                    <span>Né le {formatDate(player.dateNaissance)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} />
                    <span>{player.nationalite}</span>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Équipe</p>
                    <p className="font-medium text-gray-900">{player.teamInitial}</p>
                    <p className="text-xs text-gray-600">{player.division}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Message si aucun résultat */}
        {filteredPlayers.length === 0 && playersData.length > 0 && (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun joueur trouvé</h3>
            <p className="text-gray-600">Essayez de modifier votre recherche ou vos filtres.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h4 className="text-lg font-semibold mb-2">Avenir Sportif De Gabes</h4>
            <p className="text-gray-400">Ligue I - Saison 2024/2025</p>
            <p className="text-gray-500 text-sm mt-2">
              Données chargées dynamiquement depuis players.json
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
